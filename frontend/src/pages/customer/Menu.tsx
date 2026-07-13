import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MenuItem, type RestaurantConfig } from "@/data/menuData";
import { getTheme, applyScannerTheme, type RestaurantTheme } from "@/data/restaurantThemes";
import { fetchPublicMenu, type ScannerThemeOverrides } from "@/lib/api";
import { mergePublicMenu } from "@/lib/publicMenu";
import { resolveScanContext } from "@/lib/scanContext";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { categoryImages } from "@/components/menu/menuImages";
import MenuBookPage from "@/components/menu/MenuBookPage";
import MenuItemDetail from "@/components/menu/MenuItemDetail";
import MenuDesktop from "@/components/menu/MenuDesktop";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMenuLayout } from "@/layouts/MobileMenuLayout";
import { buildBookPages } from "@/layouts/buildBookPages";

const Menu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const isMobile = useIsMobile();
  const { apiSlug, menuKey } = useMemo(() => resolveScanContext(restaurantId), [restaurantId]);
  const pathSegment = restaurantId?.trim() || apiSlug;
  const baseTheme = useMemo(() => getTheme(menuKey), [menuKey]);

  const [restaurant, setRestaurant] = useState<RestaurantConfig | null>(null);
  const [scannerTheme, setScannerTheme] = useState<ScannerThemeOverrides | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  const theme = useMemo(
    () => applyScannerTheme(baseTheme, scannerTheme),
    [baseTheme, scannerTheme],
  );

  useEffect(() => {
    let cancelled = false;
    setMenuLoading(true);
    setMenuError(null);
    setRestaurant(null);
    setScannerTheme(null);
    (async () => {
      try {
        const data = await fetchPublicMenu(apiSlug);
        if (!cancelled) {
          setRestaurant(mergePublicMenu(menuKey, data));
          setScannerTheme(data.restaurant.scanner_theme ?? {});
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Could not load menu";
          setMenuError(msg.includes("not found") || msg.includes("404") ? "Restaurant not found" : msg);
          setRestaurant(null);
        }
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiSlug, menuKey]);

  if (menuLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: theme.background }}>
        <p style={{ color: theme.textSecondary }} className="text-lg animate-pulse">
          Loading menu…
        </p>
      </div>
    );
  }

  if (menuError || !restaurant) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
        style={{ background: theme.background }}
      >
        <p style={{ color: theme.text }} className="text-lg font-medium">
          {menuError || "Menu not available"}
        </p>
        <p style={{ color: theme.textSecondary }} className="text-sm max-w-xs">
          Check the QR code or ask staff for the correct menu link.
        </p>
      </div>
    );
  }

  if (!isMobile) {
    return <MenuDesktop restaurant={restaurant} resolvedId={pathSegment} theme={theme} />;
  }

  return (
    <MobileMenuWithLayout
      restaurant={restaurant}
      resolvedId={pathSegment}
      apiSlug={apiSlug}
      theme={theme}
    />
  );
};

function MobileMenuWithLayout({
  restaurant,
  resolvedId,
  apiSlug,
  theme,
}: {
  restaurant: RestaurantConfig;
  resolvedId: string;
  apiSlug: string;
  theme: RestaurantTheme;
}) {
  const [useClassic, setUseClassic] = useState(false);
  if (useClassic) {
    return <MobileMenu restaurant={restaurant} resolvedId={resolvedId} theme={theme} />;
  }
  return (
    <MobileMenuLayout
      restaurant={restaurant}
      resolvedId={resolvedId}
      apiSlug={apiSlug}
      theme={theme}
      onLayoutUnavailable={() => setUseClassic(true)}
    />
  );
}

const MobileMenu = ({
  restaurant,
  resolvedId,
  theme,
}: {
  restaurant: RestaurantConfig;
  resolvedId: string;
  theme: RestaurantTheme;
}) => {
  const navigate = useNavigate();
  const menu = restaurant.menu;
  const pages = buildBookPages(menu, categoryImages);

  const [currentPage, setCurrentPage] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [isFlipping, setIsFlipping] = useState(false);
  const [detailItem, setDetailItem] = useState<{ pageIdx: number; itemIdx: number } | null>(null);

  const flipTo = useCallback(
    (dir: "next" | "prev") => {
      if (isFlipping) return;
      const next = dir === "next" ? currentPage + 1 : currentPage - 1;
      if (next < 0 || next >= pages.length) return;
      setFlipDirection(dir);
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(next);
        setIsFlipping(false);
      }, 500);
    },
    [currentPage, pages.length, isFlipping],
  );

  const handleSwipe = (_: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) < 50) return;
    if (info.offset.x < -50) flipTo("next");
    else flipTo("prev");
  };

  const allItems = pages.flatMap((p, pi) =>
    p.items.map((item, ii) => ({ item, pageIdx: pi, itemIdx: ii, cat: p.categoryName, heroImage: p.heroImage })),
  );

  const currentDetailFlat = detailItem
    ? allItems.findIndex((a) => a.pageIdx === detailItem.pageIdx && a.itemIdx === detailItem.itemIdx)
    : -1;

  if (pages.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-2 p-6" style={{ background: theme.background }}>
        <p style={{ color: theme.text }} className="text-lg font-medium">
          {restaurant.name}
        </p>
        <p style={{ color: theme.textSecondary }} className="text-sm">
          Menu coming soon — check back shortly.
        </p>
      </div>
    );
  }

  if (detailItem !== null && currentDetailFlat >= 0) {
    const flat = allItems[currentDetailFlat];
    return (
      <MenuItemDetail
        item={flat.item}
        heroImage={flat.heroImage}
        categoryName={flat.cat}
        theme={theme}
        onBack={() => setDetailItem(null)}
        onPrev={
          currentDetailFlat > 0
            ? () => {
                const prev = allItems[currentDetailFlat - 1];
                setDetailItem({ pageIdx: prev.pageIdx, itemIdx: prev.itemIdx });
              }
            : null
        }
        onNext={
          currentDetailFlat < allItems.length - 1
            ? () => {
                const next = allItems[currentDetailFlat + 1];
                setDetailItem({ pageIdx: next.pageIdx, itemIdx: next.itemIdx });
              }
            : null
        }
        currentIndex={currentDetailFlat}
        totalItems={allItems.length}
      />
    );
  }

  const page = pages[currentPage];

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: theme.background }}>
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-5 pb-2">
        <button
          type="button"
          onClick={() => navigate(`/scan/${resolvedId}`)}
          className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
          aria-label="Back"
        >
          <ArrowLeft size={16} style={{ color: theme.text }} />
        </button>
        <div className="text-center">
          <h1
            className="tracking-[0.08em] uppercase leading-none"
            style={{
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.scale.sm,
              fontWeight: theme.typography.weights.heading,
              letterSpacing: theme.typography.letterSpacing.ui,
              color: theme.primary,
            }}
          >
            {restaurant.name}
          </h1>
          <p
            className="text-[9px] mt-0.5 tracking-wider uppercase"
            style={{
              color: theme.textSecondary,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.scale.xs,
              letterSpacing: theme.typography.letterSpacing.ui,
              lineHeight: theme.typography.lineHeights.normal,
            }}
          >
            {restaurant.tagline}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
        >
          <span
            className="text-[11px]"
            style={{
              color: theme.textSecondary,
              fontFamily: theme.typography.fonts.ui,
              fontWeight: theme.typography.weights.ui,
              letterSpacing: theme.typography.letterSpacing.body,
            }}
          >
            {currentPage + 1}/{pages.length}
          </span>
        </div>
      </div>

      <div className="flex-1 relative mt-[72px] mb-[86px] mx-4" style={{ perspective: "1200px" }}>
        <motion.div
          key={currentPage}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleSwipe}
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ transformStyle: "preserve-3d", boxShadow: "0 16px 46px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.07)" }}
          initial={{ rotateY: flipDirection === "next" ? 90 : -90, opacity: 0.3 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: flipDirection === "next" ? -90 : 90, opacity: 0.3 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
            style={{
              background: isFlipping
                ? "linear-gradient(to right, rgba(0,0,0,0.045), transparent 28%, transparent 72%, rgba(0,0,0,0.03))"
                : "none",
              transition: "background 0.3s",
            }}
          />
          <MenuBookPage page={page} theme={theme} onItemTap={(itemIdx) => setDetailItem({ pageIdx: currentPage, itemIdx })} />
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-40 pb-6 pt-2"
        style={{ background: `linear-gradient(to top, ${theme.background}, ${theme.background}e8, transparent)` }}
      >
        <div className="flex items-center justify-center gap-5 px-6">
          <button
            type="button"
            onClick={() => flipTo("prev")}
            disabled={currentPage === 0 || isFlipping}
            className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all"
          >
            <ChevronLeft size={18} style={{ color: theme.textSecondary }} />
          </button>
          <div className="flex items-center gap-1.5 max-w-[200px] overflow-hidden">
            {pages.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  if (i === currentPage || isFlipping) return;
                  setFlipDirection(i > currentPage ? "next" : "prev");
                  setIsFlipping(true);
                  setTimeout(() => {
                    setCurrentPage(i);
                    setIsFlipping(false);
                  }, 400);
                }}
                className="shrink-0"
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentPage ? "w-6" : "w-1.5"}`}
                  style={{ background: i === currentPage ? theme.primary : "rgba(0,0,0,0.12)" }}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => flipTo("next")}
            disabled={currentPage === pages.length - 1 || isFlipping}
            className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all"
          >
            <ChevronRight size={18} style={{ color: theme.textSecondary }} />
          </button>
        </div>
        <p
          className="text-center mt-1.5 tracking-[0.15em] uppercase"
          style={{
            fontFamily: theme.typography.fonts.ui,
            fontSize: theme.typography.scale.xs,
            fontWeight: theme.typography.weights.ui,
            letterSpacing: theme.typography.letterSpacing.ui,
            color: theme.textSecondary,
          }}
        >
          {page.pageLabel}
        </p>
        <p
          className="text-center mt-1 px-4 tracking-[0.12em] uppercase opacity-75"
          style={{
            fontFamily: theme.typography.fonts.ui,
            fontSize: "10px",
            fontWeight: theme.typography.weights.ui,
            letterSpacing: theme.typography.letterSpacing.ui,
            color: theme.primary,
          }}
        >
          Tap a dish for details · swipe to turn the page
        </p>
      </div>
    </div>
  );
};

export default Menu;
