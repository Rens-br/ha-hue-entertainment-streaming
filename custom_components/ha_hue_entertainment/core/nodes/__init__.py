"""Scene nodes (format 2): small blocks that each give one value per light, every frame.

A node gives either a field (a number per light) or a colour per light. Its options
are numbers, "$parameters", colours or other nodes, so a scene is a graph that ends
in its layers. Every node is computed once per frame, however often it is used.
The format and the node types are described in docs/NODES.md.
"""

from . import colors
from .base import (
    COLOR,
    FIELD,
    Color,
    Compiler,
    Frame,
    Node,
    NodeType,
    Position,
    SceneError,
    parse_color,
)

__all__ = [
    "COLOR",
    "FIELD",
    "NODE_TYPES",
    "Color",
    "Compiler",
    "Frame",
    "Node",
    "Position",
    "SceneError",
    "parse_color",
]

# TODO: sources, generators and operators, each in its own file 
NODE_TYPES: dict[str, NodeType] = {
    **colors.TYPES,
}
