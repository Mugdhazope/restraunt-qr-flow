import type { RestaurantTheme } from "@/data/restaurantThemes";
import type { LayoutDocument, LayoutNode, PageKey } from "./types";

/** Walk a layout tree and return the first RestaurantLogo imageUrl, if any. */
export function findRestaurantLogoImageUrl(node: LayoutNode | null | undefined): string | null {
  if (!node) return null;
  if (node.type === "RestaurantLogo") {
    const url = node.props?.imageUrl;
    if (typeof url === "string" && url.trim()) return url.trim();
  }
  for (const child of node.children ?? []) {
    const found = findRestaurantLogoImageUrl(child);
    if (found) return found;
  }
  return null;
}

/** Prefer scanner_theme.logoUrl; fall back to any page's RestaurantLogo.imageUrl (legacy). */
export function resolveOutletLogoUrl(
  themeLogoUrl: string | null | undefined,
  layouts: Partial<Record<PageKey, LayoutDocument>> | LayoutDocument[] | null | undefined,
): string | null {
  if (typeof themeLogoUrl === "string" && themeLogoUrl.trim()) return themeLogoUrl.trim();
  if (!layouts) return null;
  const docs = Array.isArray(layouts) ? layouts : Object.values(layouts);
  for (const doc of docs) {
    if (!doc?.root) continue;
    const found = findRestaurantLogoImageUrl(doc.root);
    if (found) return found;
  }
  return null;
}

/** Theme with a single outlet logo for all RestaurantLogo nodes. */
export function themeWithOutletLogo(
  theme: RestaurantTheme,
  layouts: Partial<Record<PageKey, LayoutDocument>> | LayoutDocument[] | null | undefined,
): RestaurantTheme {
  const logoUrl = resolveOutletLogoUrl(theme.logoUrl, layouts);
  if (logoUrl === (theme.logoUrl ?? null)) return theme;
  return { ...theme, logoUrl };
}

/** Remove per-node logo imageUrl so outlet logoUrl stays the single source of truth. */
export function stripRestaurantLogoImageUrls(node: LayoutNode): LayoutNode {
  const next: LayoutNode = { ...node };
  if (node.type === "RestaurantLogo" && node.props && "imageUrl" in node.props) {
    const { imageUrl: _removed, ...rest } = node.props;
    next.props = rest;
  }
  if (node.children?.length) {
    next.children = node.children.map(stripRestaurantLogoImageUrls);
  }
  return next;
}
