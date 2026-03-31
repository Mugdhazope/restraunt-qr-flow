import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { restaurants, MenuItem } from "@/data/menuData";
import { AnimatePresence, motion } from "framer-motion";
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

  const [currentPage, setCurrentPage] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [isFlipping, setIsFlipping] = useState(false);

  // Item detail state
  const [detailItem, setDetailItem] = useState<{
    pageIdx: number;
    itemIdx: number;
  } | null>(null);

  const isNest = resolvedId === "thenest";

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

  const openItem = (pageIdx: number, itemIdx: number) => {
    setDetailItem({ pageIdx, itemIdx });
  };

  // Flatten all items for detail navigation
  const allItems = pages.flatMap((p, pi) =>
    p.items.map((item, ii) => ({ item, pageIdx: pi, itemIdx: ii, cat: p.categoryName, heroImage: p.heroImage }))
  );

  const currentDetailFlat = detailItem
    ? allItems.findIndex(
        (a) => a.pageIdx === detailItem.pageIdx && a.itemIdx === detailItem.itemIdx
      )
    : -1;

  if (!restaurant || pages.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#f5f0eb] flex items-center justify-center">
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
    <div className="fixed inset-0 bg-[#f5f0eb] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-5 pb-3">
        <button
          onClick={() => navigate(`/scan/${resolvedId}/checked-in`)}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="text-center">
          <h1 className="text-foreground font-bold text-sm">{restaurant.name}</h1>
          <p className="text-foreground/40 text-[10px]">{restaurant.tagline}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg">
          <span className="text-foreground text-xs font-bold">
            {currentPage + 1}/{pages.length}
          </span>
        </div>
      </div>

      {/* Book area */}
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
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
          style={{ transformStyle: "preserve-3d" }}
          initial={{
            rotateY: flipDirection === "next" ? 90 : -90,
            opacity: 0.3,
          }}
          animate={{
            rotateY: 0,
            opacity: 1,
          }}
          exit={{
            rotateY: flipDirection === "next" ? -90 : 90,
            opacity: 0.3,
          }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* Page shadow during animation */}
          <div
            className="absolute inset-0 pointer-events-none z-20 rounded-2xl"
            style={{
              background: isFlipping
                ? "linear-gradient(to right, rgba(0,0,0,0.08), transparent 30%, transparent 70%, rgba(0,0,0,0.05))"
                : "none",
              transition: "background 0.3s",
            }}
          />

          <MenuBookPage
            page={page}
            isNest={isNest}
            onItemTap={(itemIdx) => openItem(currentPage, itemIdx)}
          />
        </motion.div>

        {/* Page curl shadow */}
        {isFlipping && (
          <div
            className="absolute inset-y-0 w-8 z-30 pointer-events-none"
            style={{
              right: flipDirection === "next" ? 0 : undefined,
              left: flipDirection === "prev" ? 0 : undefined,
              background:
                flipDirection === "next"
                  ? "linear-gradient(to left, rgba(0,0,0,0.12), transparent)"
                  : "linear-gradient(to right, rgba(0,0,0,0.12), transparent)",
              borderRadius: "0 16px 16px 0",
            }}
          />
        )}
      </div>

      {/* Bottom navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pb-6 pt-3 bg-gradient-to-t from-[#f5f0eb] via-[#f5f0eb]/90 to-transparent">
        <div className="flex items-center justify-center gap-5 px-6">
          <button
            onClick={() => flipTo("prev")}
            disabled={currentPage === 0 || isFlipping}
            className="w-11 h-11 rounded-full bg-foreground/5 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all"
          >
            <ChevronLeft size={18} className="text-foreground" />
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
                    i === currentPage
                      ? "w-6 bg-foreground/60"
                      : "w-1.5 bg-foreground/15"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => flipTo("next")}
            disabled={currentPage === pages.length - 1 || isFlipping}
            className="w-11 h-11 rounded-full bg-foreground/5 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all"
          >
            <ChevronRight size={18} className="text-foreground" />
          </button>
        </div>

        {/* Page label */}
        <p className="text-foreground/30 text-[10px] font-medium text-center mt-1.5 tracking-wider uppercase">
          {page.pageLabel}
        </p>
      </div>
    </div>
  );
};

export default Menu;
