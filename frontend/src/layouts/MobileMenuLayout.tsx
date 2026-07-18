import { useEffect, useMemo, useState } from "react";
import type { MenuItem, RestaurantConfig } from "@/data/menuData";
import type { RestaurantTheme } from "@/data/restaurantThemes";
import { LayoutRenderer } from "@/layouts/LayoutRenderer";
import { defaultLayoutFor } from "@/layouts/defaults";
import { themeWithOutletLogo } from "@/layouts/outletLogo";
import { usePublicLayouts } from "@/layouts/usePublicLayouts";
import type { LayoutDataContext, LayoutDocument } from "@/layouts/types";
import { categoryImages } from "@/components/menu/menuImages";
import MenuItemDetail from "@/components/menu/MenuItemDetail";

type Props = {
  restaurant: RestaurantConfig;
  resolvedId: string;
  apiSlug: string;
  theme: RestaurantTheme;
  /** When layouts API fails, parent falls back to classic MobileMenu */
  onLayoutUnavailable?: () => void;
};

export function MobileMenuLayout({
  restaurant,
  resolvedId,
  apiSlug,
  theme: baseTheme,
  onLayoutUnavailable,
}: Props) {
  const { getLayout, layouts, loading, error } = usePublicLayouts(apiSlug);
  const theme = useMemo(() => themeWithOutletLogo(baseTheme, layouts), [baseTheme, layouts]);
  const menuDoc = useMemo(() => getLayout("menu"), [getLayout]);
  const detailDoc = useMemo(() => getLayout("item_detail"), [getLayout]);

  const [activeCategory, setActiveCategory] = useState<string | null>(
    restaurant.menu[0]?.name ?? null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [detail, setDetail] = useState<{ item: MenuItem; categoryName: string } | null>(null);

  useEffect(() => {
    if (error && onLayoutUnavailable) onLayoutUnavailable();
  }, [error, onLayoutUnavailable]);

  const flatItems = useMemo(() => {
    return restaurant.menu.flatMap((c) =>
      c.items.map((item) => ({ item, categoryName: c.name })),
    );
  }, [restaurant.menu]);

  const detailIndex = detail
    ? flatItems.findIndex(
        (f) => f.item.name === detail.item.name && f.categoryName === detail.categoryName,
      )
    : -1;

  const baseData: LayoutDataContext = {
    restaurant,
    restaurantName: restaurant.name,
    tagline: restaurant.tagline,
    theme,
    menu: restaurant.menu,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    item: detail?.item ?? null,
    categoryName: detail?.categoryName,
    pathSegment: resolvedId,
    resolvedId,
    flatItems,
    detailIndex: detailIndex >= 0 ? detailIndex : undefined,
    navigateToMenu: () => setDetail(null),
    navigateBack: () => setDetail(null),
    onDetailNavigate: (index) => {
      const row = flatItems[index];
      if (row) setDetail({ item: row.item, categoryName: row.categoryName });
    },
    onItemTap: (item) => {
      const cat =
        restaurant.menu.find((c) => c.items.some((i) => i.name === item.name))?.name ??
        activeCategory ??
        "";
      setDetail({ item, categoryName: cat });
    },
  };

  if (error) {
    return null;
  }

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.background }}
      >
        <p style={{ color: theme.textSecondary }} className="animate-pulse">
          Loading…
        </p>
      </div>
    );
  }

  if (detail && detailIndex >= 0) {
    const useLayout = Boolean(detailDoc?.root);
    if (useLayout) {
      return (
        <div className="fixed inset-0 overflow-hidden" style={{ background: "transparent" }}>
          <LayoutRenderer
            document={detailDoc}
            mode="live"
            data={{
              ...baseData,
              item: detail.item,
              categoryName: detail.categoryName,
              detailIndex,
            }}
          />
        </div>
      );
    }
    const flat = flatItems[detailIndex];
    return (
      <MenuItemDetail
        item={flat.item}
        heroImage={categoryImages[flat.categoryName]}
        categoryName={flat.categoryName}
        theme={theme}
        onBack={() => setDetail(null)}
        onPrev={detailIndex > 0 ? () => setDetail(flatItems[detailIndex - 1]) : null}
        onNext={
          detailIndex < flatItems.length - 1
            ? () => setDetail(flatItems[detailIndex + 1])
            : null
        }
        currentIndex={detailIndex}
        totalItems={flatItems.length}
      />
    );
  }

  const doc: LayoutDocument = menuDoc ?? defaultLayoutFor("menu");

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "transparent" }}>
      <LayoutRenderer document={doc} mode="live" data={baseData} />
    </div>
  );
}

export default MobileMenuLayout;
