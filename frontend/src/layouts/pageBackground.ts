import type { CSSProperties } from "react";

/** Outlet / scanner_theme background modes (may include image). */
export type BackgroundType = "solid" | "gradient" | "image";

/** Per-page overlay on top of outlet base (no image). */
export type PageOverlayType = "transparent" | "solid" | "gradient";

export type PageBackgroundProps = {
  backgroundType?: BackgroundType | PageOverlayType;
  background?: string | null;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  backgroundImage?: string | null;
  overlayColor?: string;
  overlayOpacity?: number;
  imageOpacity?: number;
  blur?: number;
  brightness?: number;
  backgroundSize?: "cover" | "contain";
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundRepeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
};

export type ResolvedPageBackground = {
  /** Outlet image / solid / gradient base */
  baseStyle: CSSProperties;
  /** Optional wash from outlet Appearance (overlayColor) */
  themeOverlayStyle: CSSProperties | null;
  /** Page background surface (solid/gradient); null when transparent — items live here */
  pageLayerStyle: CSSProperties | null;
  overlayType: PageOverlayType;
};

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

const absoluteFill: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 0,
};

/** Outlet Appearance: solid / gradient / image. */
export function inferBackgroundType(props: Record<string, unknown> | undefined): BackgroundType {
  const explicit = props?.backgroundType;
  if (explicit === "solid" || explicit === "gradient" || explicit === "image") return explicit;
  if (typeof props?.backgroundImage === "string" && props.backgroundImage) return "image";
  if (props?.gradientFrom || props?.gradientTo) return "gradient";
  return "solid";
}

/** Keys that belong on outlet Appearance only — never on per-page overlay. */
export const OUTLET_ONLY_BACKGROUND_KEYS = [
  "backgroundImage",
  "imageOpacity",
  "blur",
  "brightness",
  "backgroundSize",
  "backgroundPosition",
  "backgroundRepeat",
  "overlayColor",
] as const;

/**
 * Normalize PageRoot props for the layered model used on every QR page:
 * outlet image/color base + optional transparent/solid/gradient overlay.
 * Strips leftover page-level image fields from the old exclusive-bg model.
 */
export function sanitizePageOverlayProps(
  props: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!props) return {};
  const out: Record<string, unknown> = { ...props };
  const hadPageImage = typeof props.backgroundImage === "string" && Boolean(props.backgroundImage);

  for (const key of OUTLET_ONLY_BACKGROUND_KEYS) {
    delete out[key];
  }

  const type = props.backgroundType;
  const opacity =
    typeof props.overlayOpacity === "number" && Number.isFinite(props.overlayOpacity)
      ? props.overlayOpacity
      : 1;

  // Legacy page image + full-cover solid/gradient replaced the outlet photo — drop overlay
  if (hadPageImage && (type === "solid" || type === "gradient") && opacity >= 0.95) {
    out.backgroundType = "transparent";
    delete out.overlayOpacity;
    return out;
  }

  if (type === "image") {
    out.backgroundType = "transparent";
  }

  return out;
}

/**
 * Per-page overlay type. Default transparent so outlet image shows through.
 * Legacy page-level `image` is treated as transparent (no page image).
 */
export function inferPageOverlayType(props: Record<string, unknown> | undefined): PageOverlayType {
  const cleaned = sanitizePageOverlayProps(props);
  const explicit = cleaned.backgroundType;
  if (explicit === "transparent" || explicit === "solid" || explicit === "gradient") return explicit;
  if (explicit === "image") return "transparent";
  if (cleaned.gradientFrom || cleaned.gradientTo) return "gradient";
  return "transparent";
}

function resolveOutletBase(
  outlet: Record<string, unknown> | undefined,
  themeBackground: string,
): CSSProperties {
  const type = inferBackgroundType(outlet);
  const solid = str(outlet?.background, themeBackground) || themeBackground;
  const blur = Math.max(0, num(outlet?.blur, 0));
  const brightness = Math.max(0, num(outlet?.brightness, 100));
  const imageOpacity = Math.min(1, Math.max(0, num(outlet?.imageOpacity, 1)));
  const size = (outlet?.backgroundSize === "contain" ? "contain" : "cover") as "cover" | "contain";
  const position = str(outlet?.backgroundPosition, "center") as PageBackgroundProps["backgroundPosition"];
  const repeat = str(outlet?.backgroundRepeat, "no-repeat") as PageBackgroundProps["backgroundRepeat"];

  const filterParts: string[] = [];
  if (blur > 0) filterParts.push(`blur(${blur}px)`);
  if (brightness !== 100) filterParts.push(`brightness(${brightness}%)`);
  const filter = filterParts.length ? filterParts.join(" ") : undefined;

  if (type === "image" && typeof outlet?.backgroundImage === "string" && outlet.backgroundImage) {
    return {
      ...absoluteFill,
      backgroundColor: solid,
      backgroundImage: `url(${outlet.backgroundImage})`,
      backgroundSize: size,
      backgroundPosition: position,
      backgroundRepeat: repeat,
      filter,
      opacity: imageOpacity,
    };
  }

  if (type === "gradient") {
    const from = str(outlet?.gradientFrom, solid);
    const to = str(outlet?.gradientTo, themeBackground);
    const angle = num(outlet?.gradientAngle, 180);
    return {
      ...absoluteFill,
      background: `linear-gradient(${angle}deg, ${from}, ${to})`,
      filter,
      opacity: imageOpacity < 1 ? imageOpacity : undefined,
    };
  }

  // Prefer image URL even if type drifted; else solid theme / outlet color
  if (typeof outlet?.backgroundImage === "string" && outlet.backgroundImage) {
    return {
      ...absoluteFill,
      backgroundColor: solid,
      backgroundImage: `url(${outlet.backgroundImage})`,
      backgroundSize: size,
      backgroundPosition: position,
      backgroundRepeat: repeat,
      filter,
      opacity: imageOpacity,
    };
  }

  return {
    ...absoluteFill,
    background: solid,
    filter,
    opacity: imageOpacity < 1 ? imageOpacity : undefined,
  };
}

/**
 * Layered PageRoot background (back → front):
 * 1) outlet appearance (behind the page)
 * 2) optional outlet color wash
 * 3) page background — the surface where items live (transparent | solid | gradient)
 */
export function resolvePageBackground(
  pageProps: Record<string, unknown> | undefined,
  themeBackground: string,
  outletBg?: PageBackgroundProps | Record<string, unknown> | null,
): ResolvedPageBackground {
  const outlet = (outletBg ?? undefined) as Record<string, unknown> | undefined;
  const page = sanitizePageOverlayProps(pageProps);
  const baseStyle = resolveOutletBase(outlet, themeBackground);

  const themeWashOpacity = Math.min(1, Math.max(0, num(outlet?.overlayOpacity, 0)));
  const themeOverlayStyle: CSSProperties | null =
    themeWashOpacity > 0
      ? {
          ...absoluteFill,
          zIndex: 1,
          background: str(outlet?.overlayColor, "#000000"),
          opacity: themeWashOpacity,
        }
      : null;

  const overlayType = inferPageOverlayType(page);
  let pageLayerStyle: CSSProperties | null = null;

  if (overlayType === "solid") {
    const opacity = Math.min(1, Math.max(0, num(page.overlayOpacity, 1)));
    const color = str(page.background, themeBackground) || themeBackground;
    pageLayerStyle = {
      ...absoluteFill,
      zIndex: 2,
      background: color,
      opacity,
    };
  } else if (overlayType === "gradient") {
    const opacity = Math.min(1, Math.max(0, num(page.overlayOpacity, 1)));
    const solid = str(page.background, themeBackground) || themeBackground;
    const from = str(page.gradientFrom, solid);
    const to = str(page.gradientTo, themeBackground);
    const angle = num(page.gradientAngle, 180);
    pageLayerStyle = {
      ...absoluteFill,
      zIndex: 2,
      background: `linear-gradient(${angle}deg, ${from}, ${to})`,
      opacity,
    };
  }

  return { baseStyle, themeOverlayStyle, pageLayerStyle, overlayType };
}

export function readPageBackgroundProps(
  props: Record<string, unknown> | undefined,
): PageBackgroundProps {
  return {
    backgroundType: inferBackgroundType(props),
    background: (props?.background as string | null | undefined) ?? null,
    gradientFrom: props?.gradientFrom as string | undefined,
    gradientTo: props?.gradientTo as string | undefined,
    gradientAngle: typeof props?.gradientAngle === "number" ? props.gradientAngle : undefined,
    backgroundImage: (props?.backgroundImage as string | null | undefined) ?? null,
    overlayColor: props?.overlayColor as string | undefined,
    overlayOpacity: typeof props?.overlayOpacity === "number" ? props.overlayOpacity : undefined,
    imageOpacity: typeof props?.imageOpacity === "number" ? props.imageOpacity : undefined,
    blur: typeof props?.blur === "number" ? props.blur : undefined,
    brightness: typeof props?.brightness === "number" ? props.brightness : undefined,
    backgroundSize: props?.backgroundSize === "contain" ? "contain" : "cover",
    backgroundPosition: (props?.backgroundPosition as PageBackgroundProps["backgroundPosition"]) ?? "center",
    backgroundRepeat: (props?.backgroundRepeat as PageBackgroundProps["backgroundRepeat"]) ?? "no-repeat",
  };
}
