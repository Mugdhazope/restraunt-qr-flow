import { describe, expect, it } from "vitest";
import { applyScannerTheme, getTheme } from "@/data/restaurantThemes";
import type { RestaurantTheme } from "@/data/restaurantThemes";
import {
  inferBackgroundType,
  inferPageOverlayType,
  resolvePageBackground,
} from "./pageBackground";
import { resolveTextStyle, resolveThemeFont } from "./textStyles";

const theme = {
  background: "#fafafa",
  text: "#111",
  textSecondary: "#666",
  typography: {
    fonts: {
      heading: "HeadingFont",
      body: "BodyFont",
      price: "PriceFont",
      ui: "UiFont",
    },
    weights: { heading: 700, body: 400, itemName: 600, price: 700, ui: 500 },
  },
} as unknown as RestaurantTheme;

describe("pageBackground", () => {
  it("infers solid by default for outlet", () => {
    expect(inferBackgroundType({})).toBe("solid");
  });

  it("infers image from backgroundImage for outlet", () => {
    expect(inferBackgroundType({ backgroundImage: "https://x/a.jpg" })).toBe("image");
  });

  it("defaults page overlay to transparent", () => {
    expect(inferPageOverlayType({})).toBe("transparent");
    expect(inferPageOverlayType({ background: "#ff0000" })).toBe("transparent");
  });

  it("treats legacy page image type as transparent", () => {
    expect(inferPageOverlayType({ backgroundType: "image" })).toBe("transparent");
  });

  it("uses outlet solid as base when no image; page transparent has no overlay", () => {
    const r = resolvePageBackground({}, "#abc", { backgroundType: "solid", background: "#abc" });
    expect(r.overlayType).toBe("transparent");
    expect(r.baseStyle.background).toBe("#abc");
    expect(r.pageLayerStyle).toBeNull();
    expect(r.themeOverlayStyle).toBeNull();
  });

  it("keeps outlet image under page solid overlay with opacity", () => {
    const r = resolvePageBackground(
      {
        backgroundType: "solid",
        background: "#112233",
        overlayOpacity: 0.5,
      },
      "#fff",
      {
        backgroundType: "image",
        backgroundImage: "https://cdn.example/bg.jpg",
        backgroundSize: "cover",
      },
    );
    expect(r.baseStyle.backgroundImage).toBe("url(https://cdn.example/bg.jpg)");
    expect(r.pageLayerStyle?.background).toBe("#112233");
    expect(r.pageLayerStyle?.opacity).toBe(0.5);
    expect(r.overlayType).toBe("solid");
  });

  it("page gradient overlays outlet image without replacing it", () => {
    const r = resolvePageBackground(
      {
        backgroundType: "gradient",
        gradientFrom: "#111",
        gradientTo: "#eee",
        gradientAngle: 90,
        overlayOpacity: 0.4,
      },
      "#fff",
      { backgroundType: "image", backgroundImage: "https://cdn.example/photo.jpg" },
    );
    expect(r.baseStyle.backgroundImage).toBe("url(https://cdn.example/photo.jpg)");
    expect(String(r.pageLayerStyle?.background)).toContain("linear-gradient(90deg");
    expect(r.pageLayerStyle?.opacity).toBe(0.4);
  });

  it("applies outlet theme wash separately from page overlay", () => {
    const r = resolvePageBackground(
      { backgroundType: "transparent" },
      "#fff",
      {
        backgroundType: "image",
        backgroundImage: "https://cdn.example/bg.jpg",
        overlayColor: "#000",
        overlayOpacity: 0.3,
      },
    );
    expect(r.themeOverlayStyle?.opacity).toBe(0.3);
    expect(r.pageLayerStyle).toBeNull();
  });

  it("resolves outlet image filters on base layer", () => {
    const r = resolvePageBackground({}, "#fff", {
      backgroundType: "image",
      backgroundImage: "https://cdn.example/bg.jpg",
      backgroundSize: "contain",
      backgroundPosition: "top",
      blur: 4,
      brightness: 80,
      imageOpacity: 0.9,
    });
    expect(r.baseStyle.backgroundImage).toBe("url(https://cdn.example/bg.jpg)");
    expect(r.baseStyle.backgroundSize).toBe("contain");
    expect(r.baseStyle.backgroundPosition).toBe("top");
    expect(String(r.baseStyle.filter)).toContain("blur(4px)");
    expect(String(r.baseStyle.filter)).toContain("brightness(80%)");
    expect(r.baseStyle.opacity).toBe(0.9);
  });

  it("coerces legacy page image + full overlay to transparent so outlet shows on all pages", () => {
    const r = resolvePageBackground(
      {
        backgroundType: "gradient",
        gradientFrom: "#111",
        gradientTo: "#eee",
        overlayOpacity: 1,
        backgroundImage: "https://cdn.example/old-page.jpg",
      },
      "#fff",
      { backgroundType: "image", backgroundImage: "https://cdn.example/outlet.jpg" },
    );
    expect(r.overlayType).toBe("transparent");
    expect(r.pageLayerStyle).toBeNull();
    expect(r.baseStyle.backgroundImage).toBe("url(https://cdn.example/outlet.jpg)");
  });

  it("keeps intentional page gradient overlay without page image", () => {
    const r = resolvePageBackground(
      {
        backgroundType: "gradient",
        gradientFrom: "#111",
        gradientTo: "#eee",
        overlayOpacity: 0.4,
      },
      "#fff",
      { backgroundType: "image", backgroundImage: "https://cdn.example/outlet.jpg" },
    );
    expect(r.overlayType).toBe("gradient");
    expect(r.pageLayerStyle?.opacity).toBe(0.4);
    expect(r.baseStyle.backgroundImage).toBe("url(https://cdn.example/outlet.jpg)");
  });
});

describe("textStyles", () => {
  it("resolves theme font keys", () => {
    expect(resolveThemeFont(theme, "heading", "fallback")).toBe("HeadingFont");
    expect(resolveThemeFont(theme, "Custom, serif", "fallback")).toBe("Custom, serif");
  });

  it("applies font colors and page background", () => {
    const style = resolveTextStyle(
      { color: "#f00", fontSize: 22, fontWeight: "700", fontFamily: "heading", align: "center" },
      theme,
      {
        color: theme.text,
        fontSize: 14,
        fontWeight: 400,
        fontFamily: theme.typography.fonts.body,
        align: "left",
      },
    );
    expect(style.color).toBe("#f00");
    expect(style.fontSize).toBe(22);
    expect(style.fontWeight).toBe("700");
    expect(style.fontFamily).toBe("HeadingFont");
    expect(style.textAlign).toBe("center");
  });
});

describe("applyScannerTheme", () => {
  it("merges rich background and font colors", () => {
    const base = getTheme("anything");
    const next = applyScannerTheme(base, {
      backgroundType: "gradient",
      background: "#aabbcc",
      gradientFrom: "#111111",
      gradientTo: "#eeeeee",
      text: "#010101",
      primary: "#ff5500",
      tags: { new: { bg: "#00ff00", text: "#000", emoji: "✨" } },
    });
    expect(next.background).toBe("#aabbcc");
    expect(next.text).toBe("#010101");
    expect(next.primary).toBe("#ff5500");
    expect(next.pageBackground?.backgroundType).toBe("gradient");
    expect(next.pageBackground?.gradientFrom).toBe("#111111");
    expect(next.tagNew.bg).toBe("#00ff00");
    expect(next.tagEmojis.new).toBe("✨");
  });

  it("applies pageTitle for category watermarks", () => {
    const base = getTheme("anything");
    const next = applyScannerTheme(base, { pageTitle: "#224466" });
    expect(next.pageTitle).toBe("#224466");
  });

  it("applies logoUrl for restaurant logo", () => {
    const base = getTheme("anything");
    const next = applyScannerTheme(base, { logoUrl: "/media/layouts/x/logo.png" });
    expect(next.logoUrl).toBe("/media/layouts/x/logo.png");
  });

  it("applies outlet tagline override", () => {
    const base = getTheme("anything");
    const next = applyScannerTheme(base, { tagline: "  Custom tagline  " });
    expect(next.tagline).toBe("Custom tagline");
    const cleared = applyScannerTheme(base, { tagline: "" });
    expect(cleared.tagline).toBe("");
  });
});
