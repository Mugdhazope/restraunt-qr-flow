import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { restaurants, MenuItem } from "@/data/menuData";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { categoryImages } from "@/components/menu/menuImages";
import MenuBookPage from "@/components/menu/MenuBookPage";
import MenuItemDetail from "@/components/menu/MenuItemDetail";

interface FlatPage {
  categoryName: string;
  items: MenuItem[];
  heroImage?: string;
  pageLabel: string;
}

const ITEMS_PER_PAGE = 5;

function buildPages(menu: { name: string; items: MenuItem[] }[]): FlatPage[] {
  const pages: FlatPage[] = [];
  menu.forEach((cat) => {
    for (let i = 0; i < cat.items.length; i += ITEMS_PER_PAGE) {
      const slice = cat.items.slice(i, i + ITEMS_PER_PAGE);
      const part = Math.floor(i / ITEMS_PER_PAGE) + 1;
      const total = Math.ceil(cat.items.length / ITEMS_PER_PAGE);
      pages.push({
        categoryName: cat.name,
        items: slice,
        heroImage: categoryImages[cat.name],
        pageLabel: total > 1 ? `${cat.name} (${part}/${total})` : cat.name,
      });
    }
  });
  return pages;
}

const Menu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const resolvedId =
    restaurantId && restaurants[restaurantId] ? restaurantId : "doughandjoe";
  const restaurant = restaurants[resolvedId];
  const menu = restaurant.menu;
  const pages = buildPages(menu);
  const isNest = resolvedId === "thenest";
  const accentColor = isNest ? "#047857" : "#c41e24";

  const [currentPage, setCurrentPage] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [isFlipping, setIsFlipping] = useState(false);
  const [detailItem, setDetailItem] = useState<{
    pageIdx: number;
    itemIdx: number;
  } | null>(null);

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
    [currentPage, pages.length, isFlipping]
  );

  const handleSwipe = (_: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) < 50) return;
    if (info.offset.x < -50) flipTo("next");
    else flipTo("prev");
  };

  // Flatten all items for detail navigation
  const allItems = pages.flatMap((p, pi) =>
    p.items.map((item, ii) => ({
      item,
      pageIdx: pi,
      itemIdx: ii,
      cat: p.categoryName,
      heroImage: p.heroImage,
    }))
  );

  const currentDetailFlat = detailItem
    ? allItems.findIndex(
        (a) =>
          a.pageIdx === detailItem.pageIdx && a.itemIdx === detailItem.itemIdx
      )
    : -1;

  if (!restaurant || pages.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#f0ebe4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/60 text-lg">Menu not available</p>
          <button
            onClick={() => navigate(`/scan/${resolvedId}/checked-in`)}
            className="mt-4 text-sm underline text-foreground/40"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  // Detail view
  if (detailItem !== null && currentDetailFlat >= 0) {
    const flat = allItems[currentDetailFlat];
    return (
      <MenuItemDetail
        item={flat.item}
        heroImage={flat.heroImage}
        categoryName={flat.cat}
        isNest={isNest}
        onBack={() => setDetailItem(null)}
        onPrev={
          currentDetailFlat > 0
            ? () => {
                const prev = allItems[currentDetailFlat - 1];
                setDetailItem({
                  pageIdx: prev.pageIdx,
                  itemIdx: prev.itemIdx,
                });
              }
            : null
        }
        onNext={
          currentDetailFlat < allItems.length - 1
            ? () => {
                const next = allItems[currentDetailFlat + 1];
                setDetailItem({
                  pageIdx: next.pageIdx,
                  itemIdx: next.itemIdx,
                });
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
    <div className="fixed inset-0 bg-[#f0ebe4] flex flex-col overflow-hidden">
      {/* Top bar — brand header */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-5 pb-3">
        <button
          onClick={() => navigate(`/scan/${resolvedId}/checked-in`)}
          className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
        >
          <ArrowLeft size={16} className="text-foreground" />
        </button>
        <div className="text-center">
          <h1
            className="tracking-[0.08em] uppercase leading-none"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "14px",
              fontWeight: 900,
              color: accentColor,
            }}
          >
            {restaurant.name}
          </h1>
          <p
            className="text-[9px] mt-0.5 tracking-wider uppercase"
            style={{
              color: "rgba(0,0,0,0.3)",
              fontFamily: "'Georgia', serif",
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
            className="text-[11px] font-bold"
            style={{
              color: "rgba(0,0,0,0.5)",
              fontFamily: "'Georgia', serif",
            }}
          >
            {currentPage + 1}/{pages.length}
          </span>
        </div>
      </div>

      {/* Book area with perspective flip */}
      <div
        className="flex-1 relative mt-16 mb-20 mx-3"
        style={{ perspective: "1200px" }}
      >
        <motion.div
          key={currentPage}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleSwipe}
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            transformStyle: "preserve-3d",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
          }}
          initial={{
            rotateY: flipDirection === "next" ? 90 : -90,
            opacity: 0.3,
          }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{
            rotateY: flipDirection === "next" ? -90 : 90,
            opacity: 0.3,
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Page shadow during flip */}
          <div
            className="absolute inset-0 pointer-events-none z-20 rounded-2xl"
            style={{
              background: isFlipping
                ? "linear-gradient(to right, rgba(0,0,0,0.06), transparent 25%, transparent 75%, rgba(0,0,0,0.04))"
                : "none",
              transition: "background 0.3s",
            }}
          />

          <MenuBookPage
            page={page}
            isNest={isNest}
            onItemTap={(itemIdx) =>
              setDetailItem({ pageIdx: currentPage, itemIdx })
            }
          />
        </motion.div>

        {/* Page curl shadow during flip */}
        {isFlipping && (
          <div
            className="absolute inset-y-0 w-8 z-30 pointer-events-none"
            style={{
              right: flipDirection === "next" ? 0 : undefined,
              left: flipDirection === "prev" ? 0 : undefined,
              background:
                flipDirection === "next"
                  ? "linear-gradient(to left, rgba(0,0,0,0.1), transparent)"
                  : "linear-gradient(to right, rgba(0,0,0,0.1), transparent)",
              borderRadius: "0 16px 16px 0",
            }}
          />
        )}
      </div>

      {/* Bottom navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pb-6 pt-3 bg-gradient-to-t from-[#f0ebe4] via-[#f0ebe4]/90 to-transparent">
        <div className="flex items-center justify-center gap-5 px-6">
          <button
            onClick={() => flipTo("prev")}
            disabled={currentPage === 0 || isFlipping}
            className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all"
          >
            <ChevronLeft size={18} className="text-foreground/60" />
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1.5 max-w-[200px] overflow-hidden">
            {pages.map((_, i) => (
              <button
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
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentPage ? "w-6" : "w-1.5"
                  }`}
                  style={{
                    background:
                      i === currentPage ? accentColor : "rgba(0,0,0,0.12)",
                  }}
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => flipTo("next")}
            disabled={currentPage === pages.length - 1 || isFlipping}
            className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all"
          >
            <ChevronRight size={18} className="text-foreground/60" />
          </button>
        </div>

        {/* Page label */}
        <p
          className="text-center mt-1.5 tracking-[0.15em] uppercase"
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "9px",
            fontWeight: 700,
            color: "rgba(0,0,0,0.25)",
          }}
        >
          {page.pageLabel}
        </p>
      </div>
    </div>
  );
};

export default Menu;
