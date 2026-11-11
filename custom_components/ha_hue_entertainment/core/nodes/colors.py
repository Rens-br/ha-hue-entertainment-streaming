"""Colour nodes: a colour per light."""

from __future__ import annotations

from .base import COLOR, Color, Compiler, Node, NodeType, clamp


class ColorValue(Node):
    """One colour for every light: {"type": "color", "value": "#ff7a00"}."""

    kind = COLOR

    def __init__(self, spec: dict, c: Compiler):
        self.value = c.color(spec, "value")

    def evaluate(self, frame):
        return frame.value(self.value)


class Map(Node):
    """A colour for a field, through a palette. "colors" are spread evenly over 0..1,
    the first at 0 and the last at 1; a field outside that keeps the end colour.
    With "wrap" the field repeats and the last colour blends back into the first.
    "softness" is how much of the way from one colour to the next is spent blending,
    centred halfway: 1 is a smooth gradient, 0 gives hard steps.
    """

    kind = COLOR

    def __init__(self, spec: dict, c: Compiler):
        self.field = c.field(spec, "field")
        self.colors = c.colors(spec, "colors")
        self.wrap = c.flag(spec, "wrap", False)
        self.softness = c.field(spec, "softness", 1)

    def evaluate(self, frame):
        palettes = frame.rows(*self.colors)
        rows = frame.rows(self.field, self.softness)
        return [
            self._pick(palette, x, softness)
            for palette, (x, softness) in zip(palettes, rows, strict=True)
        ]

    def _pick(self, palette: tuple[Color, ...], x: float, softness: float) -> Color:
        count = len(palette)
        steps = count if self.wrap else count - 1  # from one colour to the next
        if steps == 0:
            return palette[0]
        at = (x % 1.0 if self.wrap else clamp(x)) * steps
        i = min(int(at), steps - 1)
        t = at - i
        if softness < 1:
            t = clamp((t - 0.5) / softness + 0.5) if softness > 0 else float(t >= 0.5)
        return _mix(palette[i], palette[(i + 1) % count], t)


def _mix(a: Color, b: Color, t: float) -> Color:
    return (
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    )


class Brightness(Node):
    """A colour made darker by a field: 0 is black, 1 leaves it as it is."""

    kind = COLOR

    def __init__(self, spec: dict, c: Compiler):
        self.color = c.color(spec, "color")
        self.field = c.field(spec, "field")

    def evaluate(self, frame):
        return [
            (r * level, g * level, b * level)
            for (r, g, b), level in frame.rows(self.color, self.field)
        ]


TYPES: dict[str, NodeType] = {
    "color": ColorValue,
    "map": Map,
    "brightness": Brightness,
}
