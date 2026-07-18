"""Validate layout JSON documents for staff writes (schema v2 freeform frames)."""

from __future__ import annotations

from typing import Any

from rest_framework.exceptions import ValidationError

from kotak.layouts.defaults import ALLOWED_COMPONENT_TYPES
from kotak.layouts.defaults import SCHEMA_VERSION
from kotak.layouts.models import PageKey

MAX_DEPTH = 12
MAX_NODES = 200

# Legacy / alternate type names → canonical component types
_COMPONENT_TYPE_ALIASES: dict[str, str] = {
    "Button": "CTAButton",
}

_STYLE_KEYS = frozenset(
    {
        "marginTop",
        "marginBottom",
        "marginLeft",
        "marginRight",
        "paddingTop",
        "paddingBottom",
        "gap",
        "opacity",
        "zIndex",
    },
)


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _clean_frame(frame: Any, *, path: str, strict: bool) -> dict[str, Any]:
    """Normalize frame to percent coords; h may be null (auto height)."""
    if frame is None:
        return {"x": 0, "y": 0, "w": 100, "h": None}
    if not isinstance(frame, dict):
        if strict:
            raise ValidationError({f"{path}.frame": ["Must be an object."]})
        return {"x": 0, "y": 0, "w": 100, "h": None}

    def num(key: str, default: float) -> float:
        v = frame.get(key, default)
        if v is None and key == "h":
            return default  # noqa: RET504 — handled below
        if not isinstance(v, (int, float)):
            if strict:
                raise ValidationError({f"{path}.frame.{key}": ["Must be a number."]})
            return default
        return float(v)

    x = _clamp(num("x", 0), -50, 150)
    y = _clamp(num("y", 0), -50, 200)
    w = _clamp(num("w", 100), 1, 150)

    h_raw = frame.get("h", None)
    if h_raw is None:
        h: float | None = None
    elif isinstance(h_raw, (int, float)):
        h = _clamp(float(h_raw), 1, 200)
    elif strict:
        raise ValidationError({f"{path}.frame.h": ["Must be a number or null."]})
    else:
        h = None

    return {"x": round(x, 3), "y": round(y, 3), "w": round(w, 3), "h": None if h is None else round(h, 3)}


def validate_layout_document(layout: Any, *, page_key: str, strict: bool = True) -> dict[str, Any]:
    """Return a cleaned layout dict or raise ValidationError.

    ``strict=True`` (staff write): unknown types / bad structure → 400.
    ``strict=False`` (public read): strip unknown node types, keep rest.
    """
    if not isinstance(layout, dict):
        raise ValidationError({"layout": ["Layout must be an object."]})

    pk = layout.get("page_key", page_key)
    if pk != page_key:
        raise ValidationError({"layout": [f"layout.page_key must match {page_key!r}."]})
    if pk not in PageKey.values:
        raise ValidationError({"layout": [f"Invalid page_key: {pk!r}."]})

    schema_version = layout.get("schema_version", SCHEMA_VERSION)
    if not isinstance(schema_version, int) or schema_version < 1:
        raise ValidationError({"layout": ["schema_version must be a positive integer."]})

    root = layout.get("root")
    if not isinstance(root, dict):
        raise ValidationError({"layout": ["layout.root is required."]})

    counter = {"n": 0}
    cleaned_root = _validate_node(root, path="root", depth=0, counter=counter, strict=strict)
    if cleaned_root is None:
        raise ValidationError({"layout": ["layout.root was empty after cleaning."]})

    return {
        "schema_version": schema_version if schema_version >= SCHEMA_VERSION else SCHEMA_VERSION,
        "page_key": pk,
        "root": cleaned_root,
    }


def _validate_node(
    node: Any,
    *,
    path: str,
    depth: int,
    counter: dict[str, int],
    strict: bool,
) -> dict[str, Any] | None:
    if depth > MAX_DEPTH:
        raise ValidationError({path: [f"Exceeds max depth ({MAX_DEPTH})."]})
    if not isinstance(node, dict):
        if strict:
            raise ValidationError({path: ["Node must be an object."]})
        return None

    counter["n"] += 1
    if counter["n"] > MAX_NODES:
        raise ValidationError({"layout": [f"Exceeds max nodes ({MAX_NODES})."]})

    type_ = node.get("type")
    if not isinstance(type_, str) or not type_:
        if strict:
            raise ValidationError({f"{path}.type": ["Required string."]})
        return None
    type_ = _COMPONENT_TYPE_ALIASES.get(type_, type_)
    if type_ not in ALLOWED_COMPONENT_TYPES:
        if strict:
            raise ValidationError(
                {f"{path}.type": [f"Unknown component type: {type_!r}."]},
            )
        return None

    node_id = node.get("id")
    if not isinstance(node_id, str) or not node_id.strip():
        if strict:
            raise ValidationError({f"{path}.id": ["Required non-empty string."]})
        node_id = f"auto-{counter['n']}"

    props = node.get("props", {})
    if props is None:
        props = {}
    if not isinstance(props, dict):
        raise ValidationError({f"{path}.props": ["Must be an object."]})

    style = node.get("style", {})
    if style is None:
        style = {}
    if not isinstance(style, dict):
        raise ValidationError({f"{path}.style": ["Must be an object."]})
    cleaned_style = {
        k: v for k, v in style.items() if k in _STYLE_KEYS and isinstance(v, (int, float))
    }

    visible = node.get("visible", True)
    locked = node.get("locked", False)
    if not isinstance(visible, bool):
        raise ValidationError({f"{path}.visible": ["Must be a boolean."]})
    if not isinstance(locked, bool):
        raise ValidationError({f"{path}.locked": ["Must be a boolean."]})

    frame = _clean_frame(node.get("frame"), path=path, strict=strict)

    cleaned: dict[str, Any] = {
        "id": node_id.strip(),
        "type": type_,
        "visible": visible,
        "locked": locked,
        "props": props,
        "style": cleaned_style,
        "frame": frame,
    }

    children = node.get("children")
    if children is not None:
        if not isinstance(children, list):
            raise ValidationError({f"{path}.children": ["Must be a list."]})
        cleaned_children: list[dict[str, Any]] = []
        for i, child in enumerate(children):
            c = _validate_node(
                child,
                path=f"{path}.children[{i}]",
                depth=depth + 1,
                counter=counter,
                strict=strict,
            )
            if c is not None:
                cleaned_children.append(c)
        cleaned["children"] = cleaned_children

    return cleaned


def sanitize_layout_for_public(layout: dict[str, Any], *, page_key: str) -> dict[str, Any]:
    """Soft-clean layout for public responses (strip unknown types)."""
    try:
        return validate_layout_document(layout, page_key=page_key, strict=False)
    except ValidationError:
        from kotak.layouts.defaults import default_layout_for
        from kotak.layouts.models import PageKey

        if page_key not in PageKey.values:
            # Orphan / unknown key — never call default_layout_for (raises ValueError)
            return {
                "schema_version": 2,
                "page_key": page_key,
                "root": {
                    "id": "root",
                    "type": "PageRoot",
                    "visible": True,
                    "locked": False,
                    "props": {},
                    "style": {},
                    "frame": {"x": 0, "y": 0, "w": 100, "h": None},
                    "children": [],
                },
            }
        return default_layout_for(page_key)
