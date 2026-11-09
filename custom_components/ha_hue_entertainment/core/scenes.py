"""Animated scenes: JSON definitions rendered per light from position and time.

A scene is a graph of nodes that ends in a list of layers, drawn in order. Every
layer gives a colour per light (from the light's position, as set in the Hue app,
and the scene time) and blends onto what is below it. Scenes are data, not code,
so a shared scene can't run anything. The format (version 2) and the node types
are described in docs/NODES.md.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import json
import logging
from pathlib import Path
import random
import re
from typing import NoReturn

from .nodes import (
    COLOR,
    FIELD,
    NODE_TYPES,
    Color,
    Compiler,
    Frame,
    Node,
    Position,
    SceneError,
    parse_color,
)

log = logging.getLogger(__name__)

FORMAT_VERSION = 2
ID_RE = re.compile(r"^[a-z0-9_-]{1,64}$")
BLENDS = ("normal", "add", "max", "multiply")


# ---- definition ----------------------------------------------------------


@dataclass
class Scene:
    id: str
    name: str
    raw: dict
    parameters: dict[str, dict] = field(default_factory=dict)
    duration: float | None = None
    description: str = ""
    author: str = ""
    builtin: bool = False
    file: Path | None = None

    def defaults(self) -> dict:
        return {name: p["default"] for name, p in self.parameters.items()}


def load_scene(data: dict, source: str = "scene", builtin: bool = False) -> Scene:
    """Validate a scene definition and return it. Raises SceneError."""

    def fail(msg) -> NoReturn:
        raise SceneError(f"{source}: {msg}")

    if not isinstance(data, dict):
        fail("must be a JSON object")
    if data.get("format") == 1:
        fail("uses format 1, which is no longer supported (see docs/NODES.md)")
    if data.get("format") != FORMAT_VERSION:
        fail(f'"format" must be {FORMAT_VERSION}')
    sid, name = data.get("id"), data.get("name")
    if not isinstance(sid, str) or not ID_RE.match(sid):
        fail('"id" must be 1-64 characters of a-z, 0-9, _ or -')
    if not isinstance(name, str) or not name.strip():
        fail('"name" is required')

    params = data.get("parameters", {})
    if not isinstance(params, dict):
        fail('"parameters" must be an object')
    for pname, p in params.items():
        _check_parameter(pname, p, fail)

    duration = data.get("duration")
    if duration is not None and (
        not isinstance(duration, (int, float)) or duration <= 0
    ):
        fail('"duration" must be a positive number of seconds')

    layers = data.get("layers")
    if not isinstance(layers, list) or not layers:
        fail('"layers" must be a non-empty list')
    try:
        _compile(data)
    except SceneError as e:
        fail(str(e))

    return Scene(
        id=sid,
        name=name.strip(),
        raw=data,
        parameters=params,
        duration=duration,
        description=data.get("description", ""),
        author=data.get("author", ""),
        builtin=builtin,
    )


def _check_parameter(name: str, p, fail):
    if not isinstance(p, dict) or p.get("type") not in ("color", "number", "choice"):
        fail(f'parameter "{name}" needs "type": color, number or choice')
    if "default" not in p:
        fail(f'parameter "{name}" needs a "default"')
    if p["type"] == "choice":
        if p["default"] not in p.get("options", []):
            fail(f'parameter "{name}": default must be one of "options"')
        return
    try:
        parse_color(p["default"]) if p["type"] == "color" else float(p["default"])
    except (ValueError, TypeError) as e:
        fail(f'parameter "{name}": {e}')


def load_scene_dir(
    path: Path, builtin: bool = False
) -> tuple[dict[str, Scene], list[str]]:
    """Load every *.json in `path`. Returns (scenes by id, error messages). Never raises."""
    scenes, errors = {}, []
    if not path.is_dir():
        return scenes, errors
    for file in sorted(path.glob("*.json")):
        try:
            scene = load_scene(
                json.loads(file.read_text()), source=file.name, builtin=builtin
            )
            scene.file = file
        except (OSError, json.JSONDecodeError) as e:
            errors.append(f"{file.name}: {e}")
            continue
        except SceneError as e:
            errors.append(str(e))
            continue
        if scene.id in scenes:
            errors.append(f"{file.name}: duplicate id {scene.id!r}, ignored")
            continue
        scenes[scene.id] = scene
    return scenes, errors


# ---- running ---------------------------------------------------------------


class Layer:
    """A layer's colour and opacity per light, and how it blends onto what is below."""

    def __init__(self, spec, c: Compiler, where: str):
        if not isinstance(spec, dict):
            raise SceneError(f"{where}: must be an object")
        for key in spec:
            if key not in ("color", "blend", "opacity"):
                raise SceneError(f'{where}: unknown option "{key}"')
        if "color" not in spec:
            raise SceneError(f'{where}: "color" is required')
        self.color = c.compile(where, spec["color"], COLOR, "color")
        self.opacity = c.compile(where, spec.get("opacity", 1), FIELD, "opacity")
        self.blend = spec.get("blend", "normal")
        if self.blend not in BLENDS:
            raise SceneError(f'{where}: "blend" must be one of {", ".join(BLENDS)}')


def _compile(data: dict) -> tuple[list[Node], list[Layer]]:
    """Every node of the scene, each after the nodes it uses, and its layers."""
    c = Compiler(data.get("parameters", {}), data.get("nodes", {}), NODE_TYPES)
    layers = [Layer(spec, c, f"layer {i + 1}") for i, spec in enumerate(data["layers"])]
    return c.nodes, layers


def _blend(base: Color, color: Color, opacity: float, mode: str) -> Color:
    s = max(0.0, min(1.0, opacity))

    def channel(below: float, c: float) -> float:
        if mode == "add":
            return min(1.0, below + c * s)
        if mode == "max":
            return max(below, c * s)
        if mode == "multiply":
            return below * (1 - s + s * c)
        return below + (c - below) * s

    r, g, b = (channel(x, c) for x, c in zip(base, color, strict=True))
    return r, g, b


class SceneRun:
    """A scene playing on a set of light positions. render(dt) is called by the
    stream thread for every frame; it returns None once a play-once scene ends."""

    def __init__(
        self,
        scene: Scene,
        positions: dict[int, Position],
        params: dict | None = None,
        seed: int | None = None,
    ):
        values = scene.defaults()
        for name, value in (params or {}).items():
            if name not in scene.parameters:
                raise SceneError(f'{scene.id}: unknown parameter "{name}"')
            values[name] = value
        self.scene, self.params = scene, values
        self.nodes, self.layers = _compile(scene.raw)
        self.channels = list(positions)
        self.positions = list(positions.values())
        self.time = 0.0
        rng = random.Random(seed)
        for node in self.nodes:
            node.reset(rng)

    def render(self, dt: float, speed: float = 1.0) -> dict[int, Color] | None:
        self.time += dt * speed
        if self.scene.duration is not None and self.time > self.scene.duration:
            return None
        frame = Frame(self.positions, dt * speed, self.params, {})
        for node in self.nodes:
            node.update(frame)
        colors: list[Color] = [(0.0, 0.0, 0.0)] * frame.count
        for layer in self.layers:
            colors = [
                _blend(base, color, opacity, layer.blend)
                for base, color, opacity in zip(
                    colors,
                    frame.value(layer.color),
                    frame.value(layer.opacity),
                    strict=True,
                )
            ]
        return dict(zip(self.channels, colors, strict=True))
