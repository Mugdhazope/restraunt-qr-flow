"""Default freeform layouts mirroring current hardcoded customer UX."""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from kotak.layouts.models import PageKey

SCHEMA_VERSION = 2

ALLOWED_COMPONENT_TYPES = frozenset(
    {
        "PageRoot",
        "RestaurantLogo",
        "RestaurantName",
        "Text",
        "Banner",
        "Divider",
        "SearchBar",
        "CategoryTabs",
        "MenuItemGrid",
        "MenuItemCard",
        "MenuBook",
        "ItemDetailShell",
        "ItemImage",
        "ItemDescription",
        "ItemPrice",
        "Tags",
        "CTAButton",
        "CheckInForm",
        "LoyaltySummary",
    },
)


def _id() -> str:
    return str(uuid4())


def _node(
    type_: str,
    *,
    props: dict[str, Any] | None = None,
    style: dict[str, Any] | None = None,
    frame: dict[str, Any] | None = None,
    children: list[dict[str, Any]] | None = None,
    visible: bool = True,
    locked: bool = False,
    node_id: str | None = None,
) -> dict[str, Any]:
    node: dict[str, Any] = {
        "id": node_id or _id(),
        "type": type_,
        "visible": visible,
        "locked": locked,
        "props": props or {},
        "style": style or {},
        "frame": frame
        if frame is not None
        else {"x": 0, "y": 0, "w": 100, "h": None},
    }
    if children is not None:
        node["children"] = children
    return node


def default_layout_for(page_key: str) -> dict[str, Any]:
    builders = {
        PageKey.WELCOME: _welcome,
        PageKey.CHECKED_IN: _checked_in,
        PageKey.MENU: _menu,
        PageKey.ITEM_DETAIL: _item_detail,
    }
    builder = builders.get(page_key)
    if builder is None:
        msg = f"Unknown page_key: {page_key}"
        raise ValueError(msg)
    return deepcopy(builder())


def _welcome() -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "page_key": PageKey.WELCOME,
        "root": _node(
            "PageRoot",
            node_id="root",
            props={"padding": 0, "background": None},
            frame={"x": 0, "y": 0, "w": 100, "h": 100},
            children=[
                _node(
                    "RestaurantName",
                    props={"align": "center", "showTagline": True},
                    frame={"x": 8, "y": 12, "w": 84, "h": None},
                ),
                _node(
                    "Text",
                    props={
                        "text": "Check in to start your visit",
                        "align": "center",
                        "variant": "muted",
                    },
                    frame={"x": 8, "y": 28, "w": 84, "h": None},
                ),
                _node(
                    "CheckInForm",
                    props={"showName": True, "showPhone": True},
                    frame={"x": 6, "y": 36, "w": 88, "h": None},
                ),
                _node(
                    "CTAButton",
                    props={
                        "label": "Continue",
                        "action": "submit_check_in",
                        "variant": "primary",
                        "width": "full",
                    },
                    frame={"x": 6, "y": 72, "w": 88, "h": None},
                ),
            ],
        ),
    }


def _checked_in() -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "page_key": PageKey.CHECKED_IN,
        "root": _node(
            "PageRoot",
            node_id="root",
            props={"padding": 0, "background": None},
            frame={"x": 0, "y": 0, "w": 100, "h": 100},
            children=[
                _node(
                    "Text",
                    props={
                        "text": "You're Checked In!",
                        "align": "center",
                        "variant": "heading",
                    },
                    frame={"x": 8, "y": 14, "w": 84, "h": None},
                ),
                _node(
                    "LoyaltySummary",
                    props={"visitGoal": 5, "showProgressBar": True},
                    frame={"x": 6, "y": 28, "w": 88, "h": None},
                ),
                _node(
                    "CTAButton",
                    props={
                        "label": "View Menu",
                        "action": "navigate_menu",
                        "variant": "primary",
                        "width": "full",
                    },
                    frame={"x": 6, "y": 62, "w": 88, "h": None},
                ),
            ],
        ),
    }


def _menu() -> dict[str, Any]:
    """Full-bleed MenuBook preserves current mobile magazine book UX."""
    return {
        "schema_version": SCHEMA_VERSION,
        "page_key": PageKey.MENU,
        "root": _node(
            "PageRoot",
            node_id="root",
            props={"padding": 0, "background": None},
            frame={"x": 0, "y": 0, "w": 100, "h": 100},
            children=[
                _node(
                    "MenuBook",
                    props={},
                    frame={"x": 0, "y": 0, "w": 100, "h": 100},
                    locked=False,
                ),
            ],
        ),
    }


def _item_detail() -> dict[str, Any]:
    """ItemDetailShell wraps classic MenuItemDetail so look stays unchanged."""
    return {
        "schema_version": SCHEMA_VERSION,
        "page_key": PageKey.ITEM_DETAIL,
        "root": _node(
            "PageRoot",
            node_id="root",
            props={"padding": 0, "background": None},
            frame={"x": 0, "y": 0, "w": 100, "h": 100},
            children=[
                _node(
                    "ItemDetailShell",
                    props={},
                    frame={"x": 0, "y": 0, "w": 100, "h": 100},
                    locked=False,
                ),
            ],
        ),
    }


def all_default_layouts() -> dict[str, dict[str, Any]]:
    return {key: default_layout_for(key) for key, _ in PageKey.choices}
