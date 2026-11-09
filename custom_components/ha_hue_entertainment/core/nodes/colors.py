"""Colour nodes: a colour per light."""

from __future__ import annotations

from .base import COLOR, Compiler, Node, NodeType


class ColorValue(Node):
    """One colour for every light: {"type": "color", "value": "#ff7a00"}."""

    kind = COLOR

    def __init__(self, spec: dict, c: Compiler):
        self.value = c.color(spec, "value")

    def evaluate(self, frame):
        return frame.value(self.value)


TYPES: dict[str, NodeType] = {
    "color": ColorValue,
}
