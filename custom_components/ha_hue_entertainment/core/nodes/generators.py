"""Generators: patterns across the room and over time."""

from __future__ import annotations

import math
import random
from typing import NamedTuple

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


class Strike(NamedTuple):
    start: float
    origin: Position
    tint: float


class Strikes(Node):
    """Random strikes that start at a point and roll across the room: lightning,
    fireworks. Gives how bright each light is, 0..1. The output "tint" is a random
    number per strike (of the brightest one at a light), to give each its own colour.

    "rate" is strikes per second, "spread" how fast one travels (0: everywhere at
    once), "decay" the seconds a pulse takes to fade, "flicker" the pulses per
    strike, "origin" where strikes start, e.g. {"z": [0.4, 1]}.
    """

    def __init__(self, spec: dict, c: Compiler):
        self.rate = c.field(spec, "rate", 0.1)
        self.spread = c.field(spec, "spread", 2)
        self.decay = c.field(spec, "decay", 0.4)
        self.flicker = c.field(spec, "flicker", 2)
        self.origin = _origin(c, c.option(spec, "origin", {}))
        self.seed = c.option(spec, "seed", required=False)
        if self.seed is not None and not isinstance(self.seed, int):
            c.fail('"seed" must be a whole number')
        self.tint = Tint(self)
        self.reset(random.Random())

    def reset(self, rng):
        self.rng = rng if self.seed is None else random.Random(self.seed)
        self.time = 0.0
        self.next: float | None = None  # when the next strike starts
        self.strikes: list[Strike] = []
        self.levels: list[float] = []
        self.tints: list[float] = []

    def output(self, name):
        return self.tint if name == "tint" else super().output(name)

    def update(self, frame):
        rate = max(0.0, frame.number(self.rate))
        spread = frame.number(self.spread)
        decay = max(0.001, frame.number(self.decay))
        flicker = max(1, int(frame.number(self.flicker)))

        if self.next is None or (math.isinf(self.next) and rate):
            self.next = self.time + self._gap(rate)
        self.time += frame.dt
        while self.time >= self.next:
            x, y, z = (self.rng.uniform(lo, hi) for lo, hi in self.origin)
            self.strikes.append(Strike(self.next, (x, y, z), self.rng.random()))
            self.next += self._gap(rate)
        lifetime = decay * flicker + 3 / max(spread, 0.1)
        self.strikes = [s for s in self.strikes if self.time - s.start < lifetime]

        brightest = [
            max(
                (
                    (self._level(pos, s, spread, decay, flicker), s.tint)
                    for s in self.strikes
                ),
                default=(0.0, 0.0),
            )
            for pos in frame.positions
        ]
        self.levels = [level for level, _ in brightest]
        self.tints = [tint for _, tint in brightest]

    def evaluate(self, frame):
        return self.levels

    def _gap(self, rate: float) -> float:
        return self.rng.expovariate(rate) if rate else math.inf

    def _level(
        self, pos: Position, strike: Strike, spread: float, decay: float, flicker: int
    ) -> float:
        delay = math.dist(pos, strike.origin) / spread if spread > 0 else 0.0
        pulse, phase = divmod(self.time - strike.start - delay, decay)
        if not 0 <= pulse < flicker:  # not there yet, or over
            return 0.0
        return (1 - phase / decay) ** 2 * 0.6**pulse


class Tint(Node):
    def __init__(self, strikes: Strikes):
        self.strikes = strikes

    def evaluate(self, frame):
        return self.strikes.tints


def _origin(c: Compiler, value) -> list[tuple[float, float]]:
    """The range strikes start in, per axis: all of x and y, z from -0.5 up."""
    ranges = {"x": (-1.0, 1.0), "y": (-1.0, 1.0), "z": (-0.5, 1.0)}
    if not isinstance(value, dict) or any(axis not in ranges for axis in value):
        c.fail('"origin" must give ranges for x, y or z, like {"z": [0.4, 1]}')
    for axis, limits in value.items():
        numbers = isinstance(limits, list) and all(
            isinstance(n, (int, float)) and not isinstance(n, bool) for n in limits
        )
        if not numbers or len(limits) != 2:
            c.fail(f'"origin": {axis} must be two numbers, like [0.4, 1]')
        ranges[axis] = (limits[0], limits[1])
    return list(ranges.values())


TYPES: dict[str, NodeType] = {
    "noise": Noise,
    "wave": Wave,
    "oscillator": Oscillator,
    "distance": Distance,
    "strikes": Strikes,
}
