import { NEW_THIS_WEEK_TITLE } from "@/components/menu/MenuItemBadges";
import type { MenuItem } from "@/data/menuData";

export const MENU_BOOK_ITEMS_PER_PAGE = 5;

export type MenuBookPageData = {
  categoryName: string;
  items: MenuItem[];
  heroImage?: string;
  pageLabel: string;
};

type MenuCategoryInput = { name: string; items: MenuItem[] };

/**
 * Split a restaurant menu into magazine-book pages (same rules as live Menu / MenuBook).
 * Optional `heroByCategory` maps category name → image URL (customer menu uses categoryImages).
 */
export function buildBookPages(
  menu: MenuCategoryInput[],
  heroByCategory: Record<string, string | undefined> = {},
): MenuBookPageData[] {
  const pages: MenuBookPageData[] = [];
  const perPage = MENU_BOOK_ITEMS_PER_PAGE;

  const newItems = menu.flatMap((c) => c.items.filter((i) => i.isNew));
  if (newItems.length > 0) {
    for (let i = 0; i < newItems.length; i += perPage) {
      const slice = newItems.slice(i, i + perPage);
      const part = Math.floor(i / perPage) + 1;
      const total = Math.ceil(newItems.length / perPage);
      pages.push({
        categoryName: NEW_THIS_WEEK_TITLE,
        items: slice,
        pageLabel: total > 1 ? `${NEW_THIS_WEEK_TITLE} (${part}/${total})` : NEW_THIS_WEEK_TITLE,
      });
    }
  }

  menu.forEach((cat) => {
    for (let i = 0; i < cat.items.length; i += perPage) {
      const slice = cat.items.slice(i, i + perPage);
      const part = Math.floor(i / perPage) + 1;
      const total = Math.ceil(cat.items.length / perPage);
      pages.push({
        categoryName: cat.name,
        items: slice,
        heroImage: heroByCategory[cat.name],
        pageLabel: total > 1 ? `${cat.name} (${part}/${total})` : cat.name,
      });
    }
  });

  return pages;
}

/** Flat list of dishes with category — same shape as LayoutEditor / MobileMenuLayout. */
export function flattenMenuItems(menu: MenuCategoryInput[]): {
  item: MenuItem;
  categoryName: string;
  key: string;
}[] {
  return menu.flatMap((c) =>
    c.items.map((item) => ({
      item,
      categoryName: c.name,
      key: `${c.name}::${item.name}`,
    })),
  );
}
