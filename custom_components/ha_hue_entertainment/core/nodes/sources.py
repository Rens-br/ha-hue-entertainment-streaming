"""Sources: where the values of a scene come from."""

from __future__ import annotations

import math

from .base import Compiler, Node, NodeType, Position, accumulate, did_you_mean

AXES = ("x", "y", "z", "angle", "radius")


class Time(Node):
    """Seconds since the scene started, times "speed", plus "offset"."""

    def __init__(self, spec: dict, c: Compiler):
        self.speed = c.field(spec, "speed", 1)
        self.offset = c.field(spec, "offset", 0)
        self.elapsed: list[float] = []

    def reset(self, rng):
        self.elapsed = []

    def update(self, frame):
        self.elapsed = accumulate(self.elapsed, self.speed, frame)

    def evaluate(self, frame):
        offsets = frame.value(self.offset)
        return [e + o for e, o in zip(self.elapsed, offsets, strict=True)]


class LightPosition(Node):
    """Where the light is along "axis": x, y, z in -1..1, angle and radius in 0..1."""

    def __init__(self, spec: dict, c: Compiler):
        self.axis = c.word(spec, "axis", "x", AXES)

    def evaluate(self, frame):
        axis = self.axis.get(frame)
        return [_axis_value(pos, axis) for pos in frame.positions]


def _axis_value(pos: Position, axis: str) -> float:
    x, y, z = pos
    if axis == "x":
        return x
    if axis == "y":
        return y
    if axis == "z":
        return z
    if axis == "angle":  # 0..1 around the room's centre, seen from above
        return (math.atan2(y, x) / (2 * math.pi)) % 1.0
    return min(1.0, math.hypot(x, y))  # radius, 0 (centre) .. 1


class Input(Node):
    """A value set from outside while the scene plays, the same for every light.
    With "smooth" it takes that many seconds to reach a new value."""

    def __init__(self, spec: dict, c: Compiler):
        self.name = c.option(spec, "name")
        if not isinstance(self.name, str) or self.name not in c.inputs:
            c.fail(f'unknown input "{self.name}"' + did_you_mean(self.name, c.inputs))
        self.smooth = c.field(spec, "smooth", 0)
        self.current: float | None = None

    def reset(self, rng):
        self.current = None

    def update(self, frame):
        target = float(frame.inputs[self.name])
        smooth = frame.number(self.smooth)
        if self.current is None or smooth <= 0:
            self.current = target
        else:
            self.current += (target - self.current) * min(1.0, frame.dt / smooth)

    def evaluate(self, frame):
        return [self.current] * frame.count


TYPES: dict[str, NodeType] = {
    "time": Time,
    "position": LightPosition,
    "input": Input,
}
