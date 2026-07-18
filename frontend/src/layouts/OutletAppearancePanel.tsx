import { useMemo, useState } from "react";
import {
  DEFAULT_TAG_EMOJIS,
  type ScannerTagStyle,
  type ScannerThemeOverrides,
  type TagEmojiKey,
} from "@/data/restaurantThemes";
import { BackgroundFields, pickPageBackgroundProps } from "@/layouts/BackgroundFields";
import { apiFetch, restaurantDetailUrl, uploadLayoutAsset } from "@/lib/api";
import { toast } from "sonner";

const TAG_ROWS: { key: TagEmojiKey; label: string }[] = [
  { key: "new", label: "New" },
  { key: "featured", label: "Featured" },
  { key: "popular", label: "Popular" },
  { key: "bestseller", label: "Bestseller" },
  { key: "chefs_pick", label: "Chef's pick" },
  { key: "jain", label: "Jain" },
];

type Props = {
  restaurantSlug: string;
  themeBackground: string;
  defaults: {
    text: string;
    textSecondary: string;
    primary: string;
    pageTitle?: string;
    tagline?: string;
  };
  overrides: ScannerThemeOverrides | null;
  onChange: (next: ScannerThemeOverrides) => void;
};

function emptyTags(): Record<TagEmojiKey, ScannerTagStyle> {
  return {
    new: {},
    featured: {},
    popular: {},
    bestseller: {},
    chefs_pick: {},
    jain: {},
  };
}

/** Outlet-level QR appearance: background, fonts, tags — saved to scanner_theme. */
export function OutletAppearancePanel({
  restaurantSlug,
  themeBackground,
  defaults,
  overrides,
  onChange,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const draft = overrides ?? {};
  const bgProps = useMemo(() => pickPageBackgroundProps(draft as Record<string, unknown>), [draft]);
  const tags: Record<TagEmojiKey, ScannerTagStyle> = {
    ...emptyTags(),
    ...(draft.tags ?? {}),
  };

  const patch = (partial: Partial<ScannerThemeOverrides>) => {
    onChange({ ...draft, ...partial });
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      const { url } = await uploadLayoutAsset(restaurantSlug, file);
      patch({ logoUrl: url });
      toast.success("Restaurant logo uploaded — save to publish");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const setBgProp = (key: string, value: unknown) => {
    const next = { ...draft, [key]: value };
    if (value === undefined) delete (next as Record<string, unknown>)[key];
    onChange(next);
  };

  const setBgProps = (nextBg: Record<string, unknown>) => {
    onChange({ ...draft, ...nextBg });
  };

  const setTag = (key: TagEmojiKey, field: keyof ScannerTagStyle, value: string) => {
    patch({
      tags: {
        ...(draft.tags ?? {}),
        [key]: { ...(draft.tags?.[key] ?? {}), [field]: value },
      },
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const body: ScannerThemeOverrides = {};
      Object.assign(body, pickPageBackgroundProps(draft as Record<string, unknown>));
      if (draft.text?.trim()) body.text = draft.text.trim();
      if (draft.textSecondary?.trim()) body.textSecondary = draft.textSecondary.trim();
      if (draft.primary?.trim()) body.primary = draft.primary.trim();
      if (draft.pageTitle?.trim()) body.pageTitle = draft.pageTitle.trim();
      if (typeof draft.logoUrl === "string" && draft.logoUrl.trim()) {
        body.logoUrl = draft.logoUrl.trim();
      } else if (draft.logoUrl === null) {
        body.logoUrl = null;
      }
      if (typeof draft.tagline === "string") {
        body.tagline = draft.tagline.trim();
      } else if (draft.tagline === null) {
        body.tagline = "";
      }
      const tagsOut: ScannerThemeOverrides["tags"] = {};
      (Object.keys(tags) as TagEmojiKey[]).forEach((key) => {
        const t = tags[key];
        const entry: ScannerTagStyle = {};
        if (t.bg?.trim()) entry.bg = t.bg.trim();
        if (t.text?.trim()) entry.text = t.text.trim();
        if ("emoji" in t && typeof t.emoji === "string") entry.emoji = t.emoji;
        if (Object.keys(entry).length) tagsOut![key] = entry;
      });
      if (Object.keys(tagsOut!).length) body.tags = tagsOut;
      await apiFetch(restaurantDetailUrl(restaurantSlug), {
        method: "PATCH",
        body: JSON.stringify({ scanner_theme: body }),
      });
      onChange(body);
      toast.success("Outlet appearance saved — live for QR menu");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save appearance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-3 text-sm">
      <div>
        <p className="font-semibold text-foreground">Outlet appearance</p>
        <p className="text-[11px] text-muted-foreground">
          Sits behind every page (photo, color, fonts, tags). Page background is the surface on top
          where items live. Live after save.
        </p>
      </div>

      <BackgroundFields
        title="Behind the page"
        props={bgProps}
        setProp={setBgProp}
        setProps={setBgProps}
        restaurantSlug={restaurantSlug}
        themeBackground={themeBackground}
      />

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Restaurant logo
        </p>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Used by Restaurant Logo on every page — one image for this outlet.
        </p>
        <label className="block text-xs">
          Image
          <input
            type="file"
            accept="image/*"
            className="mt-1 w-full text-[11px]"
            disabled={logoUploading}
            onChange={(e) => void uploadLogo(e.target.files?.[0])}
          />
        </label>
        {typeof draft.logoUrl === "string" && draft.logoUrl && (
          <div className="flex items-center gap-3">
            <img
              src={draft.logoUrl}
              alt="Restaurant logo"
              className="h-14 w-14 rounded-lg object-cover border"
            />
            <button
              type="button"
              className="text-[11px] text-destructive underline"
              onClick={() => patch({ logoUrl: null })}
            >
              Remove logo
            </button>
          </div>
        )}
        {logoUploading && <p className="text-[11px] text-muted-foreground">Uploading…</p>}
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tagline
        </p>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Outlet-wide copy under the restaurant name. Layout Editor only shows or hides it per page.
        </p>
        <label className="block text-xs">
          Text
          <textarea
            className="mt-1 w-full border rounded px-2 py-1.5 text-sm min-h-[4rem]"
            rows={2}
            maxLength={200}
            placeholder="e.g. Wood-fired goodness, served with love."
            value={
              typeof draft.tagline === "string" ? draft.tagline : (defaults.tagline ?? "")
            }
            onChange={(e) => patch({ tagline: e.target.value })}
          />
        </label>
        <p className="text-[10px] text-muted-foreground">
          Leave blank for no tagline. Save appearance to publish.
        </p>
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Font colors
        </p>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Text</span>
          <input
            type="color"
            className="h-8 w-14 border rounded cursor-pointer"
            value={/^#[0-9a-fA-F]{6}$/.test(draft.text || "") ? draft.text! : defaults.text}
            onChange={(e) => patch({ text: e.target.value })}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Secondary</span>
          <input
            type="color"
            className="h-8 w-14 border rounded cursor-pointer"
            value={
              /^#[0-9a-fA-F]{6}$/.test(draft.textSecondary || "")
                ? draft.textSecondary!
                : defaults.textSecondary
            }
            onChange={(e) => patch({ textSecondary: e.target.value })}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Primary / accent</span>
          <input
            type="color"
            className="h-8 w-14 border rounded cursor-pointer"
            value={/^#[0-9a-fA-F]{6}$/.test(draft.primary || "") ? draft.primary! : defaults.primary}
            onChange={(e) => patch({ primary: e.target.value })}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Page title on bg</span>
          <input
            type="color"
            className="h-8 w-14 border rounded cursor-pointer"
            title="Desserts, New This Week, and other category watermarks"
            value={
              /^#[0-9a-fA-F]{6}$/.test(draft.pageTitle || "")
                ? draft.pageTitle!
                : defaults.pageTitle || defaults.primary
            }
            onChange={(e) => patch({ pageTitle: e.target.value })}
          />
        </label>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Page title = big faded words behind dishes (Desserts, New This Week, …).
        </p>
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tag styles
        </p>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Chip background, text, emoji. Clear emoji for text-only chips.
        </p>
        {TAG_ROWS.map(({ key, label }) => (
          <div key={key} className="rounded border p-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: tags[key].bg || "#e5e7eb",
                  color: tags[key].text || "#111827",
                }}
              >
                {(tags[key].emoji ?? DEFAULT_TAG_EMOJIS[key] ?? "").trim()
                  ? `${(tags[key].emoji ?? DEFAULT_TAG_EMOJIS[key]).trim()} ${label}`
                  : label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <label className="text-[10px]">
                Bg
                <input
                  type="color"
                  className="mt-0.5 h-7 w-full border rounded cursor-pointer"
                  value={/^#[0-9a-fA-F]{6}$/.test(tags[key].bg || "") ? tags[key].bg! : "#10b981"}
                  onChange={(e) => setTag(key, "bg", e.target.value)}
                />
              </label>
              <label className="text-[10px]">
                Text
                <input
                  type="color"
                  className="mt-0.5 h-7 w-full border rounded cursor-pointer"
                  value={/^#[0-9a-fA-F]{6}$/.test(tags[key].text || "") ? tags[key].text! : "#ffffff"}
                  onChange={(e) => setTag(key, "text", e.target.value)}
                />
              </label>
              <label className="text-[10px]">
                Emoji
                <input
                  className="mt-0.5 w-full border rounded px-1 py-1 text-xs"
                  value={tags[key].emoji ?? ""}
                  placeholder="(none)"
                  maxLength={8}
                  onChange={(e) => setTag(key, "emoji", e.target.value)}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="w-full px-3 py-2 text-xs rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save outlet appearance"}
      </button>
    </div>
  );
}
