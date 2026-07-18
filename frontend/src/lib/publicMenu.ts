import { restaurants, type MenuItem, type RestaurantConfig } from "@/data/menuData";
import { DEFAULT_RESTAURANT_SLUG } from "@/lib/defaultRestaurantSlug";
import type { PublicMenuResponse } from "@/lib/api";

/** Merge public menu API payload into RestaurantConfig (live categories/items). */
export function mergePublicMenu(menuKey: string, data: PublicMenuResponse): RestaurantConfig {
  const base =
    restaurants[menuKey] ??
    restaurants[DEFAULT_RESTAURANT_SLUG] ??
    ({
      id: menuKey,
      name: data.restaurant.name,
      tagline: "",
      accentColor: "0 0% 20%",
      accentBg: "0 0% 96%",
      accentText: "0 0% 20%",
      menu: [],
    } satisfies RestaurantConfig);
  return {
    ...base,
    id: menuKey,
    name: data.restaurant.name,
    tagline:
      typeof data.restaurant.scanner_theme?.tagline === "string"
        ? data.restaurant.scanner_theme.tagline
        : base.tagline,
    menu: data.categories.map((c) => ({
      name: c.name,
      items: c.items.map(
        (it): MenuItem => ({
          name: it.name,
          description: it.description || "",
          price: Number(it.price),
          tag: it.tag || undefined,
          jain: it.is_jain,
          featured: it.is_featured,
          isNew: it.is_new,
          imageUrl: it.image_url ?? null,
          imageScale: typeof it.image_scale === "number" ? it.image_scale : 100,
        }),
      ),
    })),
  };
}
