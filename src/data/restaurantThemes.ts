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

  // Fonts
  headingFont: string;
  bodyFont: string;
  serifFont: string;

  // Style
  style: "bold" | "minimal";
}

export const restaurantThemes: Record<string, RestaurantTheme> = {
  doughandjoe: {
    id: "doughandjoe",
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

    headingFont: "'Righteous', cursive",
    bodyFont: "'Inter', sans-serif",
    serifFont: "'Playfair Display', 'Georgia', serif",

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

    headingFont: "'Playfair Display', 'Georgia', serif",
    bodyFont: "'Inter', sans-serif",
    serifFont: "'Playfair Display', 'Georgia', serif",

    style: "minimal",
  },
};

export function getTheme(restaurantId: string): RestaurantTheme {
  return restaurantThemes[restaurantId] || restaurantThemes.doughandjoe;
}
