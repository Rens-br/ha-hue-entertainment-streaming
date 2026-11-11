"""What every node type builds on: the frame values are computed in, the Node base
class, and the compiler that turns a scene's JSON into nodes."""

from __future__ import annotations

from collections.abc import Callable, Iterator
from contextlib import contextmanager
import difflib
import random
from typing import NoReturn

FIELD = "field"
COLOR = "colour"

Color = tuple[float, float, float]
Position = tuple[float, float, float]


class SceneError(ValueError):
    """A scene file is invalid. The message says where."""


def parse_color(value) -> Color:
    """[r, g, b] / [r, g, b, brightness] in 0..255, or "#rrggbb" / "#rrggbbBB" -> floats 0..1."""
    if isinstance(value, str):
        h = value.lstrip("#")
        if len(h) not in (6, 8):
            raise ValueError(f"bad hex colour {value!r}")
        try:
            value = [int(h[i : i + 2], 16) for i in range(0, len(h), 2)]
        except ValueError:
            raise ValueError(f"bad hex colour {value!r}") from None
    if isinstance(value, (list, tuple)) and len(value) in (3, 4):
        v = [max(0.0, min(255.0, float(x))) / 255 for x in value]
        scale = v[3] if len(v) == 4 else 1.0
        r, g, b = (c * scale for c in v[:3])
        return r, g, b
    raise ValueError(
        f"bad colour {value!r}; use [r,g,b], [r,g,b,brightness] (0-255), '#rrggbb' or '#rrggbbBB'"
    )


class Frame:
    """Everything a node can read while one frame is computed."""

    def __init__(
        self, positions: list[Position], dt: float, params: dict, inputs: dict
    ):
        self.positions = positions
        self.count = len(positions)
        self.dt = dt
        self.params = params
        self.inputs = inputs
        self._values: dict[Node, list] = {}

    def value(self, node: Node) -> list:
        """The node's values for every light, computed on first use this frame."""
        if node not in self._values:
            self._values[node] = node.evaluate(self)
        return self._values[node]

    def rows(self, *nodes: Node) -> Iterator[tuple]:
        """The values of several nodes side by side: one tuple per light."""
        return zip(*(self.value(node) for node in nodes), strict=True)

    def number(self, node: Node) -> float:
        """The value of a field that is the same for every light, such as a rate."""
        return self.value(node)[0]


class Node:
    """One block of a scene.

    Node types take (spec, compiler) and read their options through the compiler,
    which checks them and builds the nodes they refer to.
    """

    kind = FIELD

    def reset(self, rng: random.Random) -> None:
        """Called when the scene (re)starts."""

    def update(self, frame: Frame) -> None:
        """Called once per frame for every node before any value is read, for state
        that has to move on even when nothing reads the node, such as a phase."""

    def evaluate(self, frame: Frame) -> list:
        """One float per light for a field, one colour per light for a colour."""
        raise NotImplementedError

    def output(self, name: str) -> Node | None:
        """The node behind {"ref": ..., "output": name}, or None if there is none."""
        return self if name == "value" else None


class Constant(Node):
    def __init__(self, value: float | Color, kind: str):
        self.value, self.kind = value, kind

    def evaluate(self, frame):
        return [self.value] * frame.count


class Param(Node):
    """A parameter, read every frame so a change shows at once."""

    def __init__(self, name: str, kind: str):
        self.name, self.kind = name, kind

    def evaluate(self, frame):
        value = frame.params[self.name]
        value = parse_color(value) if self.kind == COLOR else float(value)
        return [value] * frame.count


class Word:
    """An option that is one of a few words, such as an axis. When it comes from a
    choice parameter it is read every frame."""

    def __init__(self, value: str = "", param: str | None = None):
        self.value, self.param = value, param

    def get(self, frame: Frame) -> str:
        return frame.params[self.param] if self.param else self.value


class Compiler:
    """Turns the JSON of a scene's nodes into Node objects.

    Errors are SceneErrors that say where they are, from the outside in:
    'layer 2 > color > field > noise: unknown option "scal" (did you mean "scale"?)'
    """

    def __init__(
        self,
        parameters: dict,
        inputs: dict,
        named: dict,
        node_types: dict[str, NodeType],
    ):
        self.parameters = parameters
        self.inputs = inputs
        self._types = node_types
        self.nodes: list[Node] = []  # every node, each after the nodes it uses
        self._path: list[str] = []
        self._known: list[set[str]] = []  # per node being built: the options it read
        if not isinstance(named, dict):
            self.fail('"nodes" must be an object')
        self._specs = named
        self._named: dict[str, Node] = {}
        self._building: list[str] = []  # named nodes being built, to find loops
        for name in named:
            self._named_node(name)

    def compile(self, where: str, value, kind: str, key: str) -> Node:
        """Compile an option at the top of the scene, e.g. a layer's colour:
        compile("layer 2", layer.get("color"), COLOR, "color")."""
        with self._at(where):
            return self._value(value, kind, key)

    def fail(self, msg: str) -> NoReturn:
        raise SceneError(" > ".join(self._path) + ": " + msg if self._path else msg)

    # ---- options, read by the node types --------------------------------

    def option(self, spec: dict, key: str, default=None, required: bool = True):
        """The value of an option as written; without a default it is required."""
        self._known[-1].add(key)
        if key not in spec and default is None and required:
            self.fail(f'"{key}" is required')
        return spec.get(key, default)

    def field(self, spec: dict, key: str, default: float | None = None) -> Node:
        return self._value(self.option(spec, key, default), FIELD, key)

    def color(self, spec: dict, key: str, default: str | None = None) -> Node:
        return self._value(self.option(spec, key, default), COLOR, key)

    def fields(
        self,
        spec: dict,
        key: str,
        count: int | None = None,
        default: list[float] | None = None,
    ) -> list[Node]:
        """A list of fields, such as "inputs" or a range like "from": [0, 1]."""
        return self._list(spec, key, FIELD, count, default)

    def colors(self, spec: dict, key: str) -> list[Node]:
        return self._list(spec, key, COLOR, None, None)

    def word(
        self, spec: dict, key: str, default: str, choices: tuple[str, ...]
    ) -> Word:
        value = self.option(spec, key, default)
        if isinstance(value, str) and value.startswith("$"):
            p = self._parameter(value[1:])
            if p["type"] != "choice" or any(o not in choices for o in p["options"]):
                self.fail(
                    f'"{key}": parameter "{value}" must be a choice of {", ".join(choices)}'
                )
            return Word(param=value[1:])
        if value not in choices:
            self.fail(f'"{key}" must be one of {", ".join(choices)}')
        return Word(value)

    def flag(self, spec: dict, key: str, default: bool) -> bool:
        value = self.option(spec, key, default)
        if not isinstance(value, bool):
            self.fail(f'"{key}" must be true or false')
        return value

    def _list(
        self, spec: dict, key: str, kind: str, count: int | None, default
    ) -> list[Node]:
        values = self.option(spec, key, default)
        if not isinstance(values, list) or not values:
            self.fail(f'"{key}" must be a list')
        if count is not None and len(values) != count:
            self.fail(f'"{key}" must have {count} entries')
        return [self._value(v, kind, f"{key} {i + 1}") for i, v in enumerate(values)]

    # ---- building ---------------------------------------------------------

    def _value(self, value, kind: str, key: str) -> Node:
        """A number, "$param", colour or node at `key`, checked to give `kind`."""
        if isinstance(value, dict):
            with self._at(key):
                node = self._ref(value) if "ref" in value else self._node(value)
                if node.kind != kind:
                    self.fail(f"expected a {kind}, got a {node.kind}")
            return node
        if isinstance(value, str) and value.startswith("$"):
            return self._add(self._param(value[1:], kind, key))
        if kind == FIELD:
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                self.fail(f'"{key}" must be a number, a "$parameter" or a node')
            return self._add(Constant(float(value), FIELD))
        try:
            return self._add(Constant(parse_color(value), COLOR))
        except (ValueError, TypeError) as e:
            self.fail(f'"{key}": {e}')

    def _node(self, spec: dict, label: str | None = None) -> Node:
        type_name = spec.get("type")
        if not isinstance(type_name, str) or type_name not in self._types:
            self.fail(
                f'unknown node type "{type_name}"'
                + did_you_mean(type_name, self._types)
            )
        with self._at(label or type_name):
            self._known.append({"type"})
            node = self._types[type_name](spec, self)
            known = self._known.pop()
            for key in spec:
                if key not in known:
                    self.fail(f'unknown option "{key}"' + did_you_mean(key, known))
        return self._add(node)

    def _ref(self, spec: dict) -> Node:
        for key in spec:
            if key not in ("ref", "output"):
                self.fail(f'unknown option "{key}" next to "ref"')
        name, output = spec["ref"], spec.get("output", "value")
        node = self._named_node(name)
        result = node.output(output) if isinstance(output, str) else None
        if result is None:
            self.fail(f'node "{name}" has no output "{output}"')
        return result

    def _named_node(self, name) -> Node:
        if not isinstance(name, str):
            self.fail('"ref" must be the name of a node')
        if name in self._named:
            return self._named[name]
        if name not in self._specs:
            self.fail(f'unknown node "{name}"' + did_you_mean(name, self._specs))
        if name in self._building:
            loop = [*self._building[self._building.index(name) :], name]
            self.fail(f'node "{name}" refers to itself ({" > ".join(loop)})')
        spec = self._specs[name]
        if not isinstance(spec, dict) or "type" not in spec:
            self.fail(f'node "{name}" must be a node, like {{"type": "noise"}}')
        path, self._path = self._path, []
        self._building.append(name)
        try:
            node = self._node(spec, label=f'node "{name}"')
        finally:
            self._building.pop()
            self._path = path
        self._named[name] = node
        return node

    def _param(self, name: str, kind: str, key: str) -> Node:
        p = self._parameter(name)
        if kind == COLOR:
            ok = p["type"] == "color"
        else:
            ok = p["type"] == "number" or (
                p["type"] == "choice"
                and all(isinstance(o, (int, float)) for o in p["options"])
            )
        if not ok:
            self.fail(f'"{key}": parameter "${name}" is a {p["type"]}, not a {kind}')
        return Param(name, kind)

    def _parameter(self, name: str) -> dict:
        if name not in self.parameters:
            self.fail(
                f'unknown parameter "${name}"' + did_you_mean(name, self.parameters)
            )
        return self.parameters[name]

    def _add(self, node: Node) -> Node:
        self.nodes.append(node)
        return node

    @contextmanager
    def _at(self, label: str) -> Iterator[None]:
        self._path.append(label)
        try:
            yield
        finally:
            self._path.pop()


def clamp(x: float) -> float:
    return max(0.0, min(1.0, x))


def accumulate(total: list[float], rate: Node, frame: Frame) -> list[float]:
    """total + rate × dt for every light, starting from zero. Adding up instead of
    multiplying by the time means a change of rate never makes the result jump."""
    total = total or [0.0] * frame.count
    return [t + r * frame.dt for t, r in zip(total, frame.value(rate), strict=True)]


def did_you_mean(word, options) -> str:
    match = difflib.get_close_matches(str(word), [str(o) for o in options], n=1)
    return f' (did you mean "{match[0]}"?)' if match else ""


NodeType = Callable[[dict, Compiler], Node]
