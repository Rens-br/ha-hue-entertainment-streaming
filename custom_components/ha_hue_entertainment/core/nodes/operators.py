"""Operators: fields made from other fields."""

from __future__ import annotations

import math
import operator

from .base import Compiler, Node, NodeType, clamp


class Combine(Node):
    """One field from a list of fields: {"type": "add", "inputs": [...]}."""

    FUNCTIONS = {"add": sum, "multiply": math.prod, "min": min, "max": max}

    def __init__(self, spec: dict, c: Compiler):
        self.inputs = c.fields(spec, "inputs")
        self.function = self.FUNCTIONS[spec["type"]]

    def evaluate(self, frame):
        return [self.function(values) for values in frame.rows(*self.inputs)]


class Pair(Node):
    """A field from "a" and "b": {"type": "subtract", "a": ..., "b": ...}."""

    FUNCTIONS = {
        "subtract": operator.sub,
        "divide": lambda a, b: a / b if b else 0.0,
    }

    def __init__(self, spec: dict, c: Compiler):
        self.a = c.field(spec, "a")
        self.b = c.field(spec, "b")
        self.function = self.FUNCTIONS[spec["type"]]

    def evaluate(self, frame):
        return [self.function(a, b) for a, b in frame.rows(self.a, self.b)]


class Single(Node):
    """A field from one "input": {"type": "invert", "input": ...}."""

    FUNCTIONS = {"invert": lambda x: 1 - x, "abs": abs, "clamp": clamp}

    def __init__(self, spec: dict, c: Compiler):
        self.input = c.field(spec, "input")
        self.function = self.FUNCTIONS[spec["type"]]

    def evaluate(self, frame):
        return [self.function(x) for x in frame.value(self.input)]


class Mix(Node):
    """Between "a" (t = 0) and "b" (t = 1)."""

    def __init__(self, spec: dict, c: Compiler):
        self.a = c.field(spec, "a")
        self.b = c.field(spec, "b")
        self.t = c.field(spec, "t")

    def evaluate(self, frame):
        return [a + (b - a) * t for a, b, t in frame.rows(self.a, self.b, self.t)]


class Remap(Node):
    """ "input" moved from the range "from" to the range "to"; values outside
    "from" stay at the ends of "to" unless "clamp" is false."""

    def __init__(self, spec: dict, c: Compiler):
        self.input = c.field(spec, "input")
        self.source = c.fields(spec, "from", 2, [0, 1])
        self.target = c.fields(spec, "to", 2, [0, 1])
        self.clamp = c.flag(spec, "clamp", True)

    def evaluate(self, frame):
        rows = frame.rows(self.input, *self.source, *self.target)
        return [self._remap(*row) for row in rows]

    def _remap(self, x: float, a: float, b: float, c: float, d: float) -> float:
        t = (x - a) / (b - a) if b != a else 0.0
        return c + (d - c) * (clamp(t) if self.clamp else t)


class Smoothstep(Node):
    """A smooth step from 0 at "edge0" to 1 at "edge1"; swap them for a falling step."""

    def __init__(self, spec: dict, c: Compiler):
        self.input = c.field(spec, "input")
        self.edge0 = c.field(spec, "edge0")
        self.edge1 = c.field(spec, "edge1")

    def evaluate(self, frame):
        rows = frame.rows(self.input, self.edge0, self.edge1)
        return [_smoothstep(*row) for row in rows]


def _smoothstep(x: float, edge0: float, edge1: float) -> float:
    if edge0 == edge1:
        return 0.0 if x < edge0 else 1.0
    t = clamp((x - edge0) / (edge1 - edge0))
    return t * t * (3 - 2 * t)


TYPES: dict[str, NodeType] = {
    **dict.fromkeys(Combine.FUNCTIONS, Combine),
    **dict.fromkeys(Pair.FUNCTIONS, Pair),
    **dict.fromkeys(Single.FUNCTIONS, Single),
    "mix": Mix,
    "remap": Remap,
    "smoothstep": Smoothstep,
}
