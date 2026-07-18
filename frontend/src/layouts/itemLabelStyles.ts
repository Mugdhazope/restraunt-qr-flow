/** Shared label styling for menu item name / price / tags / hint in the layout editor. */
export type ItemLabelStyle = {
  /** Horizontal position as % of the parent box (0–100). */
  x: number;
  /** Vertical position as % of the parent box (0–100). */
  y: number;
  /** Font size in px. */
  fontSize: number;
  /** CSS color. Empty / omit → theme default. */
  color?: string;
  /** Box width as % of parent (text wraps within). */
  width?: number;
  /** Clamp to 1 line (expanded) or 2 lines (collapsed). */
  maxLines?: 1 | 2;
  /** Font weight override (number or CSS string). */
  fontWeight?: number | string;
  /** Theme font key (`heading` | `body` | `price` | `ui`) or raw CSS font stack. */
  fontFamily?: string;
  /** Text alignment. */
  textAlign?: "left" | "center" | "right";
};

export type ItemLabelField = "name" | "price" | "tags" | "tapHint";

export type DetailLabelField =
  | "name"
  | "price"
  | "tags"
  | "description"
  | "back"
  | "counter";
/** @deprecated Prev/next are fixed chrome — not freeform. Kept for old saved layouts. */
export type LegacyDetailNavField = "prev" | "next";

export type DetailVisibility = {
  description?: boolean;
  tags?: boolean;
  back?: boolean;
  nav?: boolean;
  counter?: boolean;
};

export type ItemTextStyles = {
  name?: Partial<ItemLabelStyle>;
  price?: Partial<ItemLabelStyle>;
  tags?: Partial<ItemLabelStyle>;
  /** @deprecated Per-item tap hints ignored; use MenuBook `tapHintStyle`. Kept for old layouts. */
  tapHint?: Partial<ItemLabelStyle>;
};

export const DEFAULT_MENU_NAME_LABEL: ItemLabelStyle = {
  x: 50,
  y: 82,
  fontSize: 13,
  width: 90,
  maxLines: 2,
};

export const DEFAULT_MENU_PRICE_LABEL: ItemLabelStyle = {
  x: 50,
  y: 92,
  fontSize: 13,
  width: 50,
  maxLines: 1,
};

export const DEFAULT_MENU_TAGS_LABEL: ItemLabelStyle = {
  x: 12,
  y: 10,
  fontSize: 8,
};

/** Page-level “Tap to view” — % of the book page area. */
export const DEFAULT_MENU_TAP_HINT_LABEL: ItemLabelStyle = {
  x: 50,
  y: 94,
  fontSize: 9,
};

export const DEFAULT_DETAIL_NAME_LABEL: ItemLabelStyle = {
  x: 6,
  y: 68,
  fontSize: 32,
  width: 72,
  maxLines: 2,
};

export const DEFAULT_DETAIL_PRICE_LABEL: ItemLabelStyle = {
  x: 6,
  y: 86,
  fontSize: 26,
  width: 40,
  maxLines: 1,
};

export const DEFAULT_DETAIL_TAGS_LABEL: ItemLabelStyle = {
  x: 6,
  y: 92,
  fontSize: 8,
  width: 55,
  maxLines: 2,
};

export const DEFAULT_DETAIL_DESCRIPTION_LABEL: ItemLabelStyle = {
  x: 6,
  y: 76,
  fontSize: 13,
  width: 72,
  maxLines: 2,
};

export const DEFAULT_DETAIL_BACK_LABEL: ItemLabelStyle = {
  x: 6,
  y: 5,
  fontSize: 16,
};

export const DEFAULT_DETAIL_COUNTER_LABEL: ItemLabelStyle = {
  x: 88,
  y: 5,
  fontSize: 11,
};

export const DEFAULT_DETAIL_PREV_LABEL: ItemLabelStyle = {
  x: 12,
  y: 94,
  fontSize: 18,
};

export const DEFAULT_DETAIL_NEXT_LABEL: ItemLabelStyle = {
  x: 88,
  y: 94,
  fontSize: 18,
};

export const DEFAULT_DETAIL_VISIBILITY: Required<DetailVisibility> = {
  description: true,
  tags: true,
  back: true,
  nav: true,
  counter: true,
};

export function mergeLabelStyle(
  base: ItemLabelStyle,
  override?: Partial<ItemLabelStyle> | null,
): ItemLabelStyle {
  if (!override) return base;
  return {
    x: override.x ?? base.x,
    y: override.y ?? base.y,
    fontSize: override.fontSize ?? base.fontSize,
    color: override.color ?? base.color,
    width: override.width ?? base.width,
    maxLines: override.maxLines ?? base.maxLines,
    fontWeight: override.fontWeight ?? base.fontWeight,
    fontFamily: override.fontFamily ?? base.fontFamily,
    textAlign: override.textAlign ?? base.textAlign,
  };
}

export function mergeDetailVisibility(
  override?: DetailVisibility | null,
): Required<DetailVisibility> {
  return {
    description: override?.description ?? true,
    tags: override?.tags ?? true,
    back: override?.back ?? true,
    nav: override?.nav ?? true,
    counter: override?.counter ?? true,
  };
}

export function defaultMenuLabel(field: ItemLabelField): ItemLabelStyle {
  switch (field) {
    case "name":
      return DEFAULT_MENU_NAME_LABEL;
    case "price":
      return DEFAULT_MENU_PRICE_LABEL;
    case "tags":
      return DEFAULT_MENU_TAGS_LABEL;
    case "tapHint":
      return DEFAULT_MENU_TAP_HINT_LABEL;
  }
}

export function defaultDetailLabel(field: DetailLabelField): ItemLabelStyle {
  switch (field) {
    case "name":
      return DEFAULT_DETAIL_NAME_LABEL;
    case "price":
      return DEFAULT_DETAIL_PRICE_LABEL;
    case "tags":
      return DEFAULT_DETAIL_TAGS_LABEL;
    case "description":
      return DEFAULT_DETAIL_DESCRIPTION_LABEL;
    case "back":
      return DEFAULT_DETAIL_BACK_LABEL;
    case "counter":
      return DEFAULT_DETAIL_COUNTER_LABEL;
  }
}

/** Per-dish formatting on ItemDetailShell (`itemOverrides[category::name]`). */
export type DetailImageFrame = { top: number; left: number; width: number };

export type ItemDetailOverride = {
  imageFrame?: DetailImageFrame;
  nameStyle?: Partial<ItemLabelStyle>;
  priceStyle?: Partial<ItemLabelStyle>;
  descriptionStyle?: Partial<ItemLabelStyle>;
  tagsStyle?: Partial<ItemLabelStyle>;
  backBtnStyle?: Partial<ItemLabelStyle>;
  counterStyle?: Partial<ItemLabelStyle>;
  visibility?: DetailVisibility;
};

export type ItemDetailOverridesMap = Record<string, ItemDetailOverride>;

export function itemDetailKey(categoryName: string, itemName: string): string {
  return `${categoryName}::${itemName}`;
}

/** Resolve one item’s override, falling back to legacy top-level shell props. */
export function getItemDetailOverride(
  props: Record<string, unknown> | null | undefined,
  key: string,
): ItemDetailOverride {
  const map = (props?.itemOverrides as ItemDetailOverridesMap | undefined) ?? {};
  const specific = map[key] ?? {};
  return {
    imageFrame:
      specific.imageFrame ??
      (props?.imageFrame as DetailImageFrame | undefined),
    nameStyle:
      specific.nameStyle ?? (props?.nameStyle as Partial<ItemLabelStyle> | undefined),
    priceStyle:
      specific.priceStyle ?? (props?.priceStyle as Partial<ItemLabelStyle> | undefined),
    descriptionStyle:
      specific.descriptionStyle ??
      (props?.descriptionStyle as Partial<ItemLabelStyle> | undefined),
    tagsStyle:
      specific.tagsStyle ?? (props?.tagsStyle as Partial<ItemLabelStyle> | undefined),
    backBtnStyle:
      specific.backBtnStyle ??
      (props?.backBtnStyle as Partial<ItemLabelStyle> | undefined),
    counterStyle:
      specific.counterStyle ??
      (props?.counterStyle as Partial<ItemLabelStyle> | undefined),
    visibility:
      specific.visibility ?? (props?.visibility as DetailVisibility | undefined),
  };
}

/** Deep-merge itemOverrides maps so updating one dish never wipes another. */
export function mergeItemOverridesMaps(
  prev: ItemDetailOverridesMap,
  next: ItemDetailOverridesMap,
): ItemDetailOverridesMap {
  const out: ItemDetailOverridesMap = { ...prev };
  for (const [key, patch] of Object.entries(next)) {
    const existing = prev[key] ?? {};
    out[key] = {
      ...existing,
      ...patch,
      imageFrame: patch.imageFrame ?? existing.imageFrame,
      nameStyle: patch.nameStyle
        ? { ...(existing.nameStyle ?? {}), ...patch.nameStyle }
        : existing.nameStyle,
      priceStyle: patch.priceStyle
        ? { ...(existing.priceStyle ?? {}), ...patch.priceStyle }
        : existing.priceStyle,
      descriptionStyle: patch.descriptionStyle
        ? { ...(existing.descriptionStyle ?? {}), ...patch.descriptionStyle }
        : existing.descriptionStyle,
      tagsStyle: patch.tagsStyle
        ? { ...(existing.tagsStyle ?? {}), ...patch.tagsStyle }
        : existing.tagsStyle,
      backBtnStyle: patch.backBtnStyle
        ? { ...(existing.backBtnStyle ?? {}), ...patch.backBtnStyle }
        : existing.backBtnStyle,
      counterStyle: patch.counterStyle
        ? { ...(existing.counterStyle ?? {}), ...patch.counterStyle }
        : existing.counterStyle,
      visibility: patch.visibility
        ? { ...(existing.visibility ?? {}), ...patch.visibility }
        : existing.visibility,
    };
  }
  return out;
}

/** Patch one item’s override entry (copies resolved base so first edit is self-contained). */
export function patchItemDetailOverride(
  props: Record<string, unknown> | null | undefined,
  key: string,
  patch: Partial<ItemDetailOverride>,
): ItemDetailOverridesMap {
  const prev = (props?.itemOverrides as ItemDetailOverridesMap | undefined) ?? {};
  const base = getItemDetailOverride(props, key);
  return mergeItemOverridesMaps(prev, {
    [key]: {
      ...base,
      ...patch,
      nameStyle: patch.nameStyle
        ? { ...(base.nameStyle ?? {}), ...patch.nameStyle }
        : base.nameStyle,
      priceStyle: patch.priceStyle
        ? { ...(base.priceStyle ?? {}), ...patch.priceStyle }
        : base.priceStyle,
      descriptionStyle: patch.descriptionStyle
        ? { ...(base.descriptionStyle ?? {}), ...patch.descriptionStyle }
        : base.descriptionStyle,
      tagsStyle: patch.tagsStyle
        ? { ...(base.tagsStyle ?? {}), ...patch.tagsStyle }
        : base.tagsStyle,
      backBtnStyle: patch.backBtnStyle
        ? { ...(base.backBtnStyle ?? {}), ...patch.backBtnStyle }
        : base.backBtnStyle,
      counterStyle: patch.counterStyle
        ? { ...(base.counterStyle ?? {}), ...patch.counterStyle }
        : base.counterStyle,
      visibility: patch.visibility
        ? { ...(base.visibility ?? {}), ...patch.visibility }
        : base.visibility,
      imageFrame: patch.imageFrame ?? base.imageFrame,
    },
  });
}
