import { useState } from "react";
import { toast } from "sonner";
import { uploadLayoutAsset } from "@/lib/api";
import {
  inferBackgroundType,
  inferPageOverlayType,
  sanitizePageOverlayProps,
  type BackgroundType,
  type PageBackgroundProps,
  type PageOverlayType,
} from "@/layouts/pageBackground";

/** Keys copied between scanner_theme and PageRoot background props. */
export const PAGE_BACKGROUND_KEYS = [
  "backgroundType",
  "background",
  "gradientFrom",
  "gradientTo",
  "gradientAngle",
  "backgroundImage",
  "overlayColor",
  "overlayOpacity",
  "imageOpacity",
  "blur",
  "brightness",
  "backgroundSize",
  "backgroundPosition",
  "backgroundRepeat",
] as const satisfies readonly (keyof PageBackgroundProps)[];

export function pickPageBackgroundProps(
  source: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!source) return {};
  const out: Record<string, unknown> = {};
  for (const key of PAGE_BACKGROUND_KEYS) {
    if (key in source && source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

type Props = {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
  setProps: (next: Record<string, unknown>) => void;
  restaurantSlug: string;
  themeBackground: string;
  title?: string;
  /**
   * When false, page-level overlay only: Transparent / Solid / Gradient + opacity.
   * Default true for outlet theme (includes image).
   */
  allowImage?: boolean;
};

/** Shared background controls — outlet (image) or page overlay (transparent/solid/gradient). */
export function BackgroundFields({
  props,
  setProp,
  setProps,
  restaurantSlug,
  themeBackground,
  title = "Background",
  allowImage = true,
}: Props) {
  const [uploading, setUploading] = useState(false);

  if (!allowImage) {
    return (
      <PageOverlayFields
        props={props}
        setProp={setProp}
        setProps={setProps}
        themeBackground={themeBackground}
        title={title}
      />
    );
  }

  const type = inferBackgroundType(props);

  const setType = (next: BackgroundType) => {
    setProp("backgroundType", next);
  };

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadLayoutAsset(restaurantSlug, file);
      setProps({ ...props, backgroundImage: url, backgroundType: "image" });
      toast.success("Background image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      <label className="block text-xs">
        Type
        <select
          className="mt-1 w-full border rounded px-2 py-1"
          value={type}
          onChange={(e) => setType(e.target.value as BackgroundType)}
        >
          <option value="solid">Solid color</option>
          <option value="gradient">Gradient</option>
          <option value="image">Background image</option>
        </select>
      </label>

      {type === "solid" && (
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Color</span>
          <input
            type="color"
            className="h-8 w-14 border rounded cursor-pointer"
            value={String(props.background || themeBackground || "#ffffff")}
            onChange={(e) => setProp("background", e.target.value)}
          />
        </label>
      )}

      {type === "gradient" && (
        <>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>From</span>
            <input
              type="color"
              className="h-8 w-14 border rounded cursor-pointer"
              value={String(props.gradientFrom || props.background || themeBackground || "#ffffff")}
              onChange={(e) => setProp("gradientFrom", e.target.value)}
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>To</span>
            <input
              type="color"
              className="h-8 w-14 border rounded cursor-pointer"
              value={String(props.gradientTo || themeBackground || "#eeeeee")}
              onChange={(e) => setProp("gradientTo", e.target.value)}
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>Angle</span>
            <input
              type="number"
              className="w-20 border rounded px-2 py-1"
              value={typeof props.gradientAngle === "number" ? props.gradientAngle : 180}
              onChange={(e) => setProp("gradientAngle", Number(e.target.value) || 180)}
            />
          </label>
        </>
      )}

      {type === "image" && (
        <>
          <label className="block text-xs">
            Image
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full text-[11px]"
              disabled={uploading}
              onChange={(e) => void onUpload(e.target.files?.[0])}
            />
          </label>
          {typeof props.backgroundImage === "string" && props.backgroundImage && (
            <p className="text-[10px] text-muted-foreground truncate">{props.backgroundImage}</p>
          )}
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>Fallback color</span>
            <input
              type="color"
              className="h-8 w-14 border rounded cursor-pointer"
              value={String(props.background || themeBackground || "#ffffff")}
              onChange={(e) => setProp("background", e.target.value)}
            />
          </label>
          <label className="block text-xs">
            Size
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.backgroundSize ?? "cover")}
              onChange={(e) => setProp("backgroundSize", e.target.value)}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </label>
          <label className="block text-xs">
            Position
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.backgroundPosition ?? "center")}
              onChange={(e) => setProp("backgroundPosition", e.target.value)}
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="block text-xs">
            Repeat
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={String(props.backgroundRepeat ?? "no-repeat")}
              onChange={(e) => setProp("backgroundRepeat", e.target.value)}
            >
              <option value="no-repeat">No repeat</option>
              <option value="repeat">Repeat</option>
              <option value="repeat-x">Repeat X</option>
              <option value="repeat-y">Repeat Y</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>Image opacity</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              className="w-28"
              value={typeof props.imageOpacity === "number" ? props.imageOpacity : 1}
              onChange={(e) => setProp("imageOpacity", Number(e.target.value))}
            />
          </label>
        </>
      )}

      <label className="flex items-center justify-between gap-2 text-xs">
        <span>Overlay color</span>
        <input
          type="color"
          className="h-8 w-14 border rounded cursor-pointer"
          value={String(props.overlayColor || "#000000")}
          onChange={(e) => setProp("overlayColor", e.target.value)}
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-xs">
        <span>Overlay opacity</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          className="w-28"
          value={typeof props.overlayOpacity === "number" ? props.overlayOpacity : 0}
          onChange={(e) => setProp("overlayOpacity", Number(e.target.value))}
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-xs">
        <span>Blur (px)</span>
        <input
          type="number"
          min={0}
          max={40}
          className="w-20 border rounded px-2 py-1"
          value={typeof props.blur === "number" ? props.blur : 0}
          onChange={(e) => setProp("blur", Number(e.target.value) || 0)}
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-xs">
        <span>Brightness %</span>
        <input
          type="number"
          min={0}
          max={200}
          className="w-20 border rounded px-2 py-1"
          value={typeof props.brightness === "number" ? props.brightness : 100}
          onChange={(e) => setProp("brightness", Number(e.target.value) || 100)}
        />
      </label>
      {uploading && <p className="text-[11px] text-muted-foreground">Uploading…</p>}
    </div>
  );
}

/** Page surface fill (solid/gradient) sitting above outlet appearance — where items live. */
function PageOverlayFields({
  props,
  setProp,
  setProps,
  themeBackground,
  title,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
  setProps: (next: Record<string, unknown>) => void;
  themeBackground: string;
  title: string;
}) {
  const cleaned = sanitizePageOverlayProps(props);
  const type = inferPageOverlayType(cleaned);
  const opacityPct = Math.round(
    Math.min(1, Math.max(0, typeof cleaned.overlayOpacity === "number" ? cleaned.overlayOpacity : 1)) *
      100,
  );

  const setType = (next: PageOverlayType) => {
    const base = sanitizePageOverlayProps(props);
    if (next === "transparent") {
      setProps({ ...base, backgroundType: "transparent" });
      return;
    }
    // Full page surface by default — outlet stays behind; lower opacity to peek through
    const nextProps: Record<string, unknown> = { ...base, backgroundType: next };
    if (typeof base.overlayOpacity !== "number") nextProps.overlayOpacity = 1;
    setProps(nextProps);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      <label className="block text-xs">
        Type
        <select
          className="mt-1 w-full border rounded px-2 py-1"
          value={type}
          onChange={(e) => setType(e.target.value as PageOverlayType)}
        >
          <option value="transparent">None — see outlet behind</option>
          <option value="solid">Solid</option>
          <option value="gradient">Gradient</option>
        </select>
      </label>

      {type === "solid" && (
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Color</span>
          <input
            type="color"
            className="h-8 w-14 border rounded cursor-pointer"
            value={String(cleaned.background || themeBackground || "#ffffff")}
            onChange={(e) => setProp("background", e.target.value)}
          />
        </label>
      )}

      {type === "gradient" && (
        <>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>From</span>
            <input
              type="color"
              className="h-8 w-14 border rounded cursor-pointer"
              value={String(cleaned.gradientFrom || cleaned.background || themeBackground || "#ffffff")}
              onChange={(e) => setProp("gradientFrom", e.target.value)}
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>To</span>
            <input
              type="color"
              className="h-8 w-14 border rounded cursor-pointer"
              value={String(cleaned.gradientTo || themeBackground || "#eeeeee")}
              onChange={(e) => setProp("gradientTo", e.target.value)}
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span>Angle</span>
            <input
              type="number"
              className="w-20 border rounded px-2 py-1"
              value={typeof cleaned.gradientAngle === "number" ? cleaned.gradientAngle : 180}
              onChange={(e) => setProp("gradientAngle", Number(e.target.value) || 180)}
            />
          </label>
        </>
      )}

      {(type === "solid" || type === "gradient") && (
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Opacity {opacityPct}%</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            className="w-28"
            value={opacityPct}
            onChange={(e) => setProp("overlayOpacity", Number(e.target.value) / 100)}
          />
        </label>
      )}

      {type === "transparent" && (
        <p className="text-[10px] text-muted-foreground">
          No page fill — items sit on the outlet appearance behind this page.
        </p>
      )}

      {(type === "solid" || type === "gradient") && (
        <p className="text-[10px] text-muted-foreground">
          This is the page surface where items live. Outlet appearance stays behind it.
        </p>
      )}
    </div>
  );
}
