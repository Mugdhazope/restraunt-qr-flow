import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { restaurants } from "@/data/menuData";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { categoryImages } from "@/components/menu/menuImages";
import MenuCategoryPage from "@/components/menu/MenuCategoryPage";
import MenuItemDetail from "@/components/menu/MenuItemDetail";

const Menu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const resolvedId = restaurantId && restaurants[restaurantId] ? restaurantId : "doughandjoe";
  const restaurant = restaurants[resolvedId];
  const menu = restaurant.menu;

  const [activePage, setActivePage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  const isNest = resolvedId === "thenest";

  const swipePage = useCallback(
    (dir: number) => {
      const next = activePage + dir;
      if (next >= 0 && next < menu.length) {
        setDirection(dir);
        setActivePage(next);
      }
    },
    [activePage, menu.length]
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) swipePage(1);
    else if (info.offset.x > 60) swipePage(-1);
  };

  const pageVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0, scale: 0.92 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0, scale: 0.92 }),
  };

  const currentCategory = menu[activePage];

  // Open item detail
  const openItem = (catIndex: number, itemIndex: number) => {
    setSelectedCategoryIndex(catIndex);
    setSelectedItemIndex(itemIndex);
  };

  // Navigate between items in detail view
  const currentItems = menu[selectedCategoryIndex]?.items || [];

  const goToNextItem = () => {
    if (selectedItemIndex !== null && selectedItemIndex < currentItems.length - 1) {
      setSelectedItemIndex(selectedItemIndex + 1);
    }
  };

  const goToPrevItem = () => {
    if (selectedItemIndex !== null && selectedItemIndex > 0) {
      setSelectedItemIndex(selectedItemIndex - 1);
    }
  };

  // Detail view
  if (selectedItemIndex !== null) {
    const cat = menu[selectedCategoryIndex];
    const item = cat.items[selectedItemIndex];
    const heroImg = categoryImages[cat.name];

    return (
      <AnimatePresence>
        <MenuItemDetail
          key={`${selectedCategoryIndex}-${selectedItemIndex}`}
          item={item}
          heroImage={heroImg}
          categoryName={cat.name}
          isNest={isNest}
          onBack={() => setSelectedItemIndex(null)}
          onPrev={selectedItemIndex > 0 ? goToPrevItem : null}
          onNext={selectedItemIndex < currentItems.length - 1 ? goToNextItem : null}
          currentIndex={selectedItemIndex}
          totalItems={currentItems.length}
        />
      </AnimatePresence>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#f5f0eb] flex flex-col">
      {/* Minimal top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-5 pb-3">
        <button
          onClick={() => navigate(`/scan/${resolvedId}/checked-in`)}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>

        <div className="text-center">
          <h1 className="text-white font-bold text-sm drop-shadow-lg">{restaurant.name}</h1>
          <p className="text-white/60 text-[10px] drop-shadow">{restaurant.tagline}</p>
        </div>

        {/* Page indicator */}
        <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg">
          <span className="text-foreground text-xs font-bold">
            {activePage + 1}/{menu.length}
          </span>
        </div>
      </div>

      {/* Full-screen swipeable pages */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activePage}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            <MenuCategoryPage
              category={currentCategory}
              heroImage={categoryImages[currentCategory.name]}
              isNest={isNest}
              onItemTap={(itemIndex) => openItem(activePage, itemIndex)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-6 pt-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-center gap-6 px-6">
          <button
            onClick={() => swipePage(-1)}
            disabled={activePage === 0}
            className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all border border-white/10"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>

          {/* Category dots */}
          <div className="flex items-center gap-1.5">
            {menu.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => {
                  setDirection(i > activePage ? 1 : -1);
                  setActivePage(i);
                }}
                className="group relative"
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activePage
                      ? "w-8 bg-white"
                      : "w-1.5 bg-white/30 group-hover:bg-white/50"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => swipePage(1)}
            disabled={activePage === menu.length - 1}
            className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all border border-white/10"
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>

        {/* Category label */}
        <p className="text-white/40 text-[10px] font-medium text-center mt-2 tracking-wider uppercase">
          {currentCategory.name}
        </p>
      </div>
    </div>
  );
};

export default Menu;
