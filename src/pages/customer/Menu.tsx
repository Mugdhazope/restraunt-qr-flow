import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { restaurants } from "@/data/menuData";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { ArrowLeft, Star, ChevronLeft, ChevronRight } from "lucide-react";

import drinksCollage from "@/assets/menu/drinks-collage.png";
import strawberryDrink from "@/assets/menu/strawberry-drink.png";
import pastaCollage from "@/assets/menu/pasta-collage.png";

// Map category names to hero images for visual richness
const categoryHeroImages: Record<string, string> = {
  "Shakes & Drinks": drinksCollage,
  "Beverages": drinksCollage,
  "Milkshakes": strawberryDrink,
  "Non Veg Appetizers": pastaCollage,
  "Dim Sums": pastaCollage,
};

interface SelectedItem {
  name: string;
  description: string;
  price: number;
  tag?: string;
}

const Menu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const restaurant = restaurants[restaurantId || "doughandjoe"];
  const menu = restaurant?.menu || [];
  const [activeCategory, setActiveCategory] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const isNest = restaurantId === "thenest";

  const swipeCategory = useCallback(
    (dir: number) => {
      const next = activeCategory + dir;
      if (next >= 0 && next < menu.length) {
        setDirection(dir);
        setActiveCategory(next);
      }
    },
    [activeCategory, menu.length]
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) swipeCategory(1);
    else if (info.offset.x > threshold) swipeCategory(-1);
  };

  const categoryVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const currentCategory = menu[activeCategory];
  const heroImage = categoryHeroImages[currentCategory?.name];

  if (selectedItem) {
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-background"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        {/* Item Detail Page */}
        <div className="min-h-screen flex flex-col">
          {/* Hero image area */}
          <div className="relative h-[45vh] bg-muted overflow-hidden">
            {heroImage && (
              <motion.img
                src={heroImage}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
            {!heroImage && (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
                <span className="text-[120px] opacity-10 font-bold text-foreground select-none">
                  {selectedItem.name.charAt(0)}
                </span>
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

            {/* Back button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center text-foreground shadow-lg"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Tag */}
            {selectedItem.tag && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-5 right-5 z-10"
              >
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    selectedItem.tag === "Bestseller"
                      ? "bg-warning/20 text-warning"
                      : selectedItem.tag === "Chef's Pick"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {selectedItem.tag === "Chef's Pick" && (
                    <Star size={10} className="inline mr-1 -mt-px" />
                  )}
                  {selectedItem.tag}
                </span>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 px-6 -mt-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {selectedItem.name}
              </h1>
              <p
                className={`text-2xl font-bold mt-2 ${
                  isNest ? "text-emerald-600" : "text-destructive"
                }`}
              >
                ₹{selectedItem.price}
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-muted-foreground text-base leading-relaxed mt-5"
            >
              {selectedItem.description}
            </motion.p>

            {/* Decorative category label */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.08 }}
              transition={{ delay: 0.5 }}
              className="text-[80px] font-black text-foreground leading-none mt-8 select-none tracking-tighter"
            >
              {currentCategory?.name}
            </motion.p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() =>
              navigate(`/scan/${restaurantId || "doughandjoe"}/checked-in`)
            }
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground text-base">
              {restaurant?.name}
            </h1>
            <p className="text-muted-foreground text-xs">{restaurant?.tagline}</p>
          </div>
        </div>
      </div>

      {/* Category nav with arrows */}
      <div className="max-w-lg mx-auto w-full px-2 py-3 flex items-center gap-1">
        <button
          onClick={() => swipeCategory(-1)}
          disabled={activeCategory === 0}
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-20 transition-all shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 justify-center">
            {menu.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => {
                  setDirection(i > activeCategory ? 1 : -1);
                  setActiveCategory(i);
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeCategory === i
                    ? isNest
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => swipeCategory(1)}
          disabled={activeCategory === menu.length - 1}
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-20 transition-all shrink-0"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Swipeable category content */}
      <div className="flex-1 relative overflow-hidden max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeCategory}
            custom={direction}
            variants={categoryVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="px-4 pb-6 min-h-0"
          >
            {/* Category hero */}
            <div className="relative rounded-2xl overflow-hidden mb-5">
              {heroImage ? (
                <div className="relative h-44">
                  <img
                    src={heroImage}
                    alt={currentCategory.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <h2 className="absolute bottom-4 left-5 text-white text-2xl font-bold tracking-tight">
                    {currentCategory.name}
                  </h2>
                </div>
              ) : (
                <div
                  className={`h-28 flex items-end p-5 rounded-2xl ${
                    isNest
                      ? "bg-gradient-to-br from-emerald-600/10 to-emerald-600/5"
                      : "bg-gradient-to-br from-destructive/10 to-destructive/5"
                  }`}
                >
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    {currentCategory.name}
                  </h2>
                </div>
              )}
            </div>

            {/* Items as tappable cards */}
            <div className="space-y-3">
              {currentCategory.items.map((item, idx) => (
                <motion.button
                  key={item.name}
                  onClick={() => setSelectedItem(item)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className="w-full text-left bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3 hover:shadow-md active:scale-[0.98] transition-all duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">
                        {item.name}
                      </h3>
                      {item.tag && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            item.tag === "Bestseller"
                              ? "bg-warning/10 text-warning"
                              : item.tag === "Chef's Pick"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.tag === "Chef's Pick" && (
                            <Star
                              size={8}
                              className="inline mr-0.5 -mt-px"
                            />
                          )}
                          {item.tag}
                        </span>
                      )}
                      {item.jain && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-medium">
                          Jain
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <span
                    className={`font-bold text-sm shrink-0 ${
                      isNest ? "text-emerald-600" : "text-foreground"
                    }`}
                  >
                    ₹{item.price}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Swipe hint */}
            <div className="flex items-center justify-center gap-2 mt-6 pb-4">
              {menu.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === activeCategory
                      ? isNest
                        ? "w-6 bg-emerald-600"
                        : "w-6 bg-foreground"
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Loyalty footer */}
      <div className="max-w-lg mx-auto w-full px-4 pb-5">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-sm font-medium text-foreground">
            🎯 Loyalty: 1/5 visits
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Get 10% off after 5 visits
          </p>
          <div className="mt-2 w-full bg-muted rounded-full h-1.5 max-w-xs mx-auto">
            <div
              className={`h-1.5 rounded-full ${isNest ? "bg-emerald-600" : "bg-foreground"}`}
              style={{ width: "20%" }}
            />
          </div>
        </div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
};

export default Menu;
