import type { CSSProperties } from "react";
import type { RestaurantTheme } from "@/data/restaurantThemes";

export type ThemeFontKey = "heading" | "body" | "price" | "ui";

export type LayoutTextStyleProps = {
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: ThemeFontKey | string;
  align?: CSSProperties["textAlign"];
};

export function resolveThemeFont(
  theme: RestaurantTheme,
  key: string | undefined,
  fallback: string,
): string {
  if (!key) return fallback;
  const fonts = theme.typography.fonts;
  if (key === "heading") return fonts.heading;
  if (key === "body") return fonts.body;
  if (key === "price") return fonts.price;
  if (key === "ui") return fonts.ui;
  // Allow raw CSS font stacks if stored
  return key;
}

/** Merge optional node text style props over theme defaults. */
export function resolveTextStyle(
  props: Record<string, unknown> | undefined,
  theme: RestaurantTheme,
  defaults: {
    color: string;
    fontSize: number | string;
    fontWeight: number | string;
    fontFamily: string;
    align?: CSSProperties["textAlign"];
  },
): CSSProperties {
  const fontKey = props?.fontFamily as string | undefined;
  const fontSize =
    typeof props?.fontSize === "number" && Number.isFinite(props.fontSize)
      ? props.fontSize
      : defaults.fontSize;
  const fontWeight =
    props?.fontWeight !== undefined && props?.fontWeight !== null && props?.fontWeight !== ""
      ? (props.fontWeight as number | string)
      : defaults.fontWeight;
  const color = typeof props?.color === "string" && props.color ? props.color : defaults.color;
  const align =
    (typeof props?.align === "string" && props.align
      ? (props.align as CSSProperties["textAlign"])
      : defaults.align) ?? "left";

  return {
    color,
    fontSize,
    fontWeight,
    fontFamily: resolveThemeFont(theme, fontKey, defaults.fontFamily),
    textAlign: align,
  };
}

export const THEME_FONT_OPTIONS: { value: ThemeFontKey; label: string }[] = [
  { value: "heading", label: "Heading" },
  { value: "body", label: "Body" },
  { value: "price", label: "Price" },
  { value: "ui", label: "UI" },
];

export const FONT_WEIGHT_OPTIONS: { value: string; label: string }[] = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra bold" },
];
