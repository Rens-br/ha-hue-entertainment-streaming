"""Generators: patterns across the room and over time."""

from __future__ import annotations

import math

from .base import Compiler, Node, NodeType, Position, accumulate, clamp

SHAPES = ("sine", "triangle", "saw")


class Noise(Node):
    """A smooth pattern across the room, 0..1 (a sum of waves), for aurora, water,
    lava. "offset" moves it: feed it a time and it flows."""

    def __init__(self, spec: dict, c: Compiler):
        self.scale = c.field(spec, "scale", 1.5)
        self.offset = c.field(spec, "offset", 0)

    def evaluate(self, frame):
        rows = frame.rows(self.scale, self.offset)
        return [
            _noise(pos, scale, offset)
            for pos, (scale, offset) in zip(frame.positions, rows, strict=True)
        ]


def _noise(pos: Position, scale: float, offset: float) -> float:
    x, y, z = (c * scale for c in pos)
    d = offset * 2 * math.pi
    waves = (
        math.sin(x * 1.7 + d)
        + math.sin(y * 2.3 - d * 0.7 + 1.3)
        + math.sin((x + y + z) * 1.1 + d * 0.45 + 2.1)
    )
    return waves / 6 + 0.5


class Wave(Node):
    """A wave, 0..1, over a field such as a position: "cycles" waves per unit."""

    def __init__(self, spec: dict, c: Compiler):
        self.input = c.field(spec, "input")
        self.cycles = c.field(spec, "cycles", 1)
        self.phase = c.field(spec, "phase", 0)
        self.shape = c.word(spec, "shape", "sine", SHAPES)

    def evaluate(self, frame):
        shape = self.shape.get(frame)
        rows = frame.rows(self.input, self.cycles, self.phase)
        return [_shape(shape, x * cycles + phase) for x, cycles, phase in rows]


class Oscillator(Node):
    """A wave, 0..1, over time: "rate" waves per second. It keeps its own phase, so
    a change of rate speeds it up or slows it down without a jump."""

    def __init__(self, spec: dict, c: Compiler):
        self.rate = c.field(spec, "rate", 1)
        self.phase = c.field(spec, "phase", 0)
        self.shape = c.word(spec, "shape", "sine", SHAPES)
        self.turns: list[float] = []

    def reset(self, rng):
        self.turns = []

    def update(self, frame):
        self.turns = accumulate(self.turns, self.rate, frame)

    def evaluate(self, frame):
        shape = self.shape.get(frame)
        phases = frame.value(self.phase)
        return [
            _shape(shape, turns + phase)
            for turns, phase in zip(self.turns, phases, strict=True)
        ]


def _shape(shape: str, turns: float) -> float:
    """One cycle per turn: from 0 up to 1 halfway (saw: at the end) and back."""
    p = turns % 1.0
    if shape == "sine":
        return 0.5 - 0.5 * math.cos(2 * math.pi * p)
    if shape == "triangle":
        return 1 - abs(2 * p - 1)
    return p


class Distance(Node):
    """1 at the point "from", falling to 0 at "radius" away from it."""

    def __init__(self, spec: dict, c: Compiler):
        self.point = c.fields(spec, "from", 3)
        self.radius = c.field(spec, "radius", 1)

    def evaluate(self, frame):
        rows = frame.rows(self.radius, *self.point)
        return [
            clamp(1 - math.dist(pos, point) / radius) if radius > 0 else 0.0
            for pos, (radius, *point) in zip(frame.positions, rows, strict=True)
        ]


TYPES: dict[str, NodeType] = {
    "noise": Noise,
    "wave": Wave,
    "oscillator": Oscillator,
    "distance": Distance,
}
