import { restaurants } from "@/data/menuData";
import { DEFAULT_RESTAURANT_SLUG } from "@/lib/defaultRestaurantSlug";

/** Legacy path segments → Django `Restaurant.slug`. */
const LEGACY_PATH_TO_API_SLUG: Record<string, string> = {
  thenest: "the-nest",
};

/** Django API slug → static theme / menuData key (`thenest`, `dough-joe`). */
const API_SLUG_TO_MENU_KEY: Record<string, string> = {
  "the-nest": "thenest",
  thenest: "thenest",
  "dough-joe": "dough-joe",
};

/**
 * Resolve QR route param to API tenant slug and static menu/theme key.
 * API slugs match the database (`dough-joe`, `the-nest`).
 * Theme keys stay on existing menuData ids (`dough-joe`, `thenest`).
 * Legacy `/scan/thenest` still resolves to The Nest.
 */
export function resolveScanContext(routeRestaurantId: string | undefined): {
  apiSlug: string;
  menuKey: string;
} {
  const raw =
    (routeRestaurantId || "").trim().toLowerCase().replace(/\s+/g, "-") || DEFAULT_RESTAURANT_SLUG;
  const apiSlug = LEGACY_PATH_TO_API_SLUG[raw] ?? raw;
  const menuKey =
    API_SLUG_TO_MENU_KEY[apiSlug] ??
    (restaurants[raw] ? raw : restaurants[apiSlug] ? apiSlug : DEFAULT_RESTAURANT_SLUG);
  return { apiSlug, menuKey };
}
