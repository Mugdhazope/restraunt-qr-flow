import type { MenuItem } from "@/data/menuData";
import type { RestaurantTheme } from "@/data/restaurantThemes";

const chipBase =
  "uppercase tracking-[0.12em] rounded-full font-semibold shadow-sm whitespace-nowrap";

function tagStyle(theme: RestaurantTheme, tag: string): { background: string; color: string } {
  const s =
    tag === "Bestseller"
      ? theme.tagBestseller
      : tag === "Chef's Pick"
        ? theme.tagChefsPick
        : theme.tagPopular;
  return { background: s.bg, color: s.text };
}

function marketingEmojiKey(tag: string): "bestseller" | "chefs_pick" | "popular" {
  if (tag === "Bestseller") return "bestseller";
  if (tag === "Chef's Pick") return "chefs_pick";
  return "popular";
}

/** Prefix label with emoji only when emoji is non-empty. */
function chipLabel(emoji: string | undefined, text: string): string {
  const e = (emoji || "").trim();
  return e ? `${e} ${text}` : text;
}

function Chip({
  label,
  bg,
  text,
  theme,
  fontSize = 8,
  className = "",
}: {
  label: string;
  bg: string;
  text: string;
  theme: RestaurantTheme;
  fontSize?: number;
  className?: string;
}) {
  return (
    <span
      className={`${chipBase} ${className}`}
      style={{
        background: bg,
        color: text,
        fontFamily: theme.typography.fonts.ui,
        letterSpacing: theme.typography.letterSpacing.ui,
        fontWeight: theme.typography.weights.ui,
        fontSize,
        padding: `${Math.max(2, fontSize * 0.35)}px ${Math.max(6, fontSize * 0.9)}px`,
      }}
    >
      {label}
    </span>
  );
}

type Layout = "overlay" | "inline" | "freeform";

/**
 * Overlay: fixed top-left on image. Inline: flex row for detail footers.
 * Freeform: chip cluster only (parent positions absolutely).
 */
export function MenuItemBadges({
  item,
  theme,
  layout = "overlay",
  showTag = true,
  showJain = false,
  fontSize = 8,
}: {
  item: MenuItem;
  theme: RestaurantTheme;
  layout?: Layout;
  showTag?: boolean;
  showJain?: boolean;
  /** Chip font size in px (freeform size control) */
  fontSize?: number;
}) {
  const hasNew = Boolean(item.isNew);
  const hasFeatured = Boolean(item.featured);
  const hasTag = showTag && Boolean(item.tag);
  const hasJain = showJain && Boolean(item.jain);

  if (!hasNew && !hasFeatured && !hasTag && !hasJain) return null;

  const chips = (
    <>
      {hasFeatured && (
        <Chip
          label={chipLabel(theme.tagEmojis.featured, "Featured")}
          bg={theme.tagFeatured.bg}
          text={theme.tagFeatured.text}
          theme={theme}
          fontSize={fontSize}
        />
      )}
      {hasNew && (
        <Chip
          label={chipLabel(theme.tagEmojis.new, "New")}
          bg={theme.tagNew.bg}
          text={theme.tagNew.text}
          theme={theme}
          fontSize={fontSize}
        />
      )}
      {hasTag && item.tag && (
        <Chip
          label={chipLabel(theme.tagEmojis[marketingEmojiKey(item.tag)], item.tag)}
          bg={tagStyle(theme, item.tag).background}
          text={tagStyle(theme, item.tag).color}
          theme={theme}
          fontSize={fontSize}
        />
      )}
      {hasJain && (
        <Chip
          label={chipLabel(theme.tagEmojis.jain, "Jain")}
          bg={theme.tagJain.bg}
          text={theme.tagJain.text}
          theme={theme}
          fontSize={fontSize}
        />
      )}
    </>
  );

  if (layout === "inline" || layout === "freeform") {
    return <div className="flex flex-wrap items-center gap-1">{chips}</div>;
  }

  return (
    <div className="absolute top-1 left-1 right-1 z-20 flex flex-wrap gap-1 pointer-events-none">{chips}</div>
  );
}

export function itemHasBadges(
  item: MenuItem,
  opts: { showTag?: boolean; showJain?: boolean } = {},
): boolean {
  const showTag = opts.showTag !== false;
  const showJain = Boolean(opts.showJain);
  return Boolean(item.isNew || item.featured || (showTag && item.tag) || (showJain && item.jain));
}

export const NEW_THIS_WEEK_TITLE = " New This Week";
