import { DEFAULT_RESTAURANT_SLUG } from "@/lib/defaultRestaurantSlug";

export type TagEmojiKey = "new" | "featured" | "popular" | "bestseller" | "chefs_pick" | "jain";

export type ScannerTagStyle = {
  bg?: string;
  text?: string;
  emoji?: string;
};

export type ScannerThemeOverrides = {
  background?: string;
  tags?: Partial<Record<TagEmojiKey, ScannerTagStyle>>;
};

export const DEFAULT_TAG_EMOJIS: Record<TagEmojiKey, string> = {
  new: "✨",
  featured: "⭐",
  popular: "🔥",
  bestseller: "⭐",
  chefs_pick: "👨‍🍳",
  jain: "🌿",
};

export interface RestaurantTheme {
  id: string;
  name: string;
  tagline: string;

  // Colors
  primary: string;
  primaryLight: string;
  background: string;
  backgroundSecondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  tagBestseller: { bg: string; text: string };
  tagChefsPick: { bg: string; text: string };
  tagPopular: { bg: string; text: string };
  tagNew: { bg: string; text: string };
  tagFeatured: { bg: string; text: string };
  tagJain: { bg: string; text: string };
  /** Chip emoji per badge kind; empty string = no emoji */
  tagEmojis: {
    new: string;
    featured: string;
    popular: string;
    bestseller: string;
    chefs_pick: string;
    jain: string;
  };

  // Fonts
  headingFont: string;
  bodyFont: string;
  serifFont: string;
  typography: {
    fonts: {
      heading: string;
      body: string;
      price: string;
      ui: string;
    };
    scale: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    lineHeights: {
      compact: number;
      normal: number;
      relaxed: number;
    };
    spacing: {
      titleToDescription: string;
      itemToItem: string;
    };
    letterSpacing: {
      heading: string;
      body: string;
      ui: string;
    };
    weights: {
      heading: number;
      itemName: number;
      body: number;
      price: number;
      ui: number;
    };
    accents: {
      welcomeHighlight: string;
    };
  };

  // Style
  style: "bold" | "minimal";
}

export const restaurantThemes: Record<string, RestaurantTheme> = {
  [DEFAULT_RESTAURANT_SLUG]: {
    id: DEFAULT_RESTAURANT_SLUG,
    name: "Dough & Joe",
    tagline: "Wood-fired goodness, served with love.",

    primary: "#c41e24",
    primaryLight: "#fef2f2",
    background: "#f0ebe4",
    backgroundSecondary: "#e8e0d5",
    accent: "#8b1a1a",
    text: "rgba(0,0,0,0.85)",
    textSecondary: "rgba(0,0,0,0.4)",
    tagBestseller: { bg: "#fbbf24", text: "#78350f" },
    tagChefsPick: { bg: "#f43f5e", text: "#ffffff" },
    tagPopular: { bg: "#3b82f6", text: "#ffffff" },
    tagNew: { bg: "#10b981", text: "#ffffff" },
    tagFeatured: { bg: "#fef3c7", text: "#92400e" },
    tagJain: { bg: "#d1fae5", text: "#065f46" },
    tagEmojis: { ...DEFAULT_TAG_EMOJIS },

    headingFont: "'Clash Display', 'Montserrat', 'Poppins', sans-serif",
    bodyFont: "'Inter', sans-serif",
    serifFont: "'Clash Display', 'Montserrat', 'Poppins', sans-serif",
    typography: {
      fonts: {
        heading: "'Clash Display', 'Montserrat', 'Poppins', sans-serif",
        body: "'Inter', 'Montserrat', sans-serif",
        price: "'Clash Display', 'Montserrat', 'Poppins', sans-serif",
        ui: "'Inter', 'Montserrat', sans-serif",
      },
      scale: {
        xs: "12px",
        sm: "14px",
        md: "16px",
        lg: "20px",
        xl: "28px",
      },
      lineHeights: {
        compact: 1.08,
        normal: 1.35,
        relaxed: 1.55,
      },
      spacing: {
        titleToDescription: "10px",
        itemToItem: "16px",
      },
      letterSpacing: {
        heading: "0.01em",
        body: "0.003em",
        ui: "0.06em",
      },
      weights: {
        heading: 700,
        itemName: 650,
        body: 450,
        price: 700,
        ui: 600,
      },
      accents: {
        welcomeHighlight: "#c41e24",
      },
    },

    style: "bold",
  },
  thenest: {
    id: "thenest",
    name: "The Nest",
    tagline: "Feels like home.",

    primary: "#7A8B6F",
    primaryLight: "#f0f4ec",
    background: "#EDE6DA",
    backgroundSecondary: "#E3E0D5",
    accent: "#3F4A3C",
    text: "#3F4A3C",
    textSecondary: "#8a8a7a",
    tagBestseller: { bg: "#CCD5C1", text: "#3F4A3C" },
    tagChefsPick: { bg: "#b8c4a8", text: "#3F4A3C" },
    tagPopular: { bg: "#CCD5C1", text: "#3F4A3C" },
    tagNew: { bg: "#CCD5C1", text: "#3F4A3C" },
    tagFeatured: { bg: "#e8e0c8", text: "#5a5a3a" },
    tagJain: { bg: "#CCD5C1", text: "#3F4A3C" },
    tagEmojis: { ...DEFAULT_TAG_EMOJIS },

    headingFont: "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
    bodyFont: "'Libre Baskerville', 'Cormorant Garamond', 'Georgia', serif",
    serifFont: "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
    typography: {
      fonts: {
        heading: "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
        body: "'Libre Baskerville', 'Cormorant Garamond', 'Georgia', serif",
        price: "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
        ui: "'Libre Baskerville', 'Cormorant Garamond', 'Georgia', serif",
      },
      scale: {
        xs: "12px",
        sm: "14px",
        md: "16px",
        lg: "20px",
        xl: "30px",
      },
      lineHeights: {
        compact: 1.12,
        normal: 1.5,
        relaxed: 1.75,
      },
      spacing: {
        titleToDescription: "14px",
        itemToItem: "22px",
      },
      letterSpacing: {
        heading: "0.04em",
        body: "0.01em",
        ui: "0.08em",
      },
      weights: {
        heading: 600,
        itemName: 500,
        body: 400,
        price: 500,
        ui: 500,
      },
      accents: {
        welcomeHighlight: "#7A8B6F",
      },
    },

    style: "minimal",
  },
};

export function getTheme(restaurantId: string): RestaurantTheme {
  const key =
    restaurantId === "the-nest" || restaurantId === "thenest" ? "thenest" : restaurantId;
  return restaurantThemes[key] || restaurantThemes[DEFAULT_RESTAURANT_SLUG];
}

const TAG_FIELD: Record<TagEmojiKey, keyof Pick<RestaurantTheme, "tagNew" | "tagFeatured" | "tagPopular" | "tagBestseller" | "tagChefsPick" | "tagJain">> = {
  new: "tagNew",
  featured: "tagFeatured",
  popular: "tagPopular",
  bestseller: "tagBestseller",
  chefs_pick: "tagChefsPick",
  jain: "tagJain",
};

/** Merge API scanner_theme overrides onto a static RestaurantTheme. */
export function applyScannerTheme(
  base: RestaurantTheme,
  overrides?: ScannerThemeOverrides | null,
): RestaurantTheme {
  if (!overrides || typeof overrides !== "object") return base;
  const next: RestaurantTheme = {
    ...base,
    tagBestseller: { ...base.tagBestseller },
    tagChefsPick: { ...base.tagChefsPick },
    tagPopular: { ...base.tagPopular },
    tagNew: { ...base.tagNew },
    tagFeatured: { ...base.tagFeatured },
    tagJain: { ...base.tagJain },
    tagEmojis: { ...base.tagEmojis },
  };
  if (overrides.background && typeof overrides.background === "string") {
    next.background = overrides.background;
  }
  const tags = overrides.tags;
  if (tags && typeof tags === "object") {
    (Object.keys(TAG_FIELD) as TagEmojiKey[]).forEach((key) => {
      const style = tags[key];
      if (!style || typeof style !== "object") return;
      const field = TAG_FIELD[key];
      if (style.bg) next[field] = { ...next[field], bg: style.bg };
      if (style.text) next[field] = { ...next[field], text: style.text };
      // Explicit emoji (including "") overrides default — empty means no emoji on chips
      if ("emoji" in style && typeof style.emoji === "string") {
        next.tagEmojis[key] = style.emoji.trim();
      }
    });
  }
  return next;
}
