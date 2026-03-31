import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { MenuItem } from "@/data/menuData";

interface MenuBookPageProps {
  page: {
    categoryName: string;
    items: MenuItem[];
    heroImage?: string;
    pageLabel: string;
  };
  isNest: boolean;
  onItemTap: (itemIndex: number) => void;
}

/**
 * Poster / magazine-style book page.
 * Items are scattered artistically — NOT in a list or grid.
 * Inspired by the reference images: items float at different positions with
 * overlaid name + price, and a large vertical category watermark.
 */

// Predefined artistic positions for up to 5 items on a "poster"
const LAYOUT_POSITIONS: { top: string; left: string; size: string; zIndex: number }[][] = [
  // 1 item
  [{ top: "30%", left: "15%", size: "70%", zIndex: 3 }],
  // 2 items
  [
    { top: "12%", left: "8%", size: "52%", zIndex: 2 },
    { top: "48%", left: "40%", size: "55%", zIndex: 3 },
  ],
  // 3 items
  [
    { top: "8%", left: "5%", size: "48%", zIndex: 2 },
    { top: "18%", left: "48%", size: "46%", zIndex: 3 },
    { top: "55%", left: "20%", size: "50%", zIndex: 4 },
  ],
  // 4 items
  [
    { top: "6%", left: "5%", size: "44%", zIndex: 2 },
    { top: "8%", left: "50%", size: "42%", zIndex: 3 },
    { top: "48%", left: "2%", size: "40%", zIndex: 4 },
    { top: "52%", left: "45%", size: "46%", zIndex: 5 },
  ],
  // 5 items
  [
    { top: "4%", left: "3%", size: "40%", zIndex: 2 },
    { top: "6%", left: "52%", size: "38%", zIndex: 3 },
    { top: "36%", left: "25%", size: "42%", zIndex: 5 },
    { top: "58%", left: "0%", size: "38%", zIndex: 4 },
    { top: "62%", left: "48%", size: "40%", zIndex: 6 },
  ],
];

const MenuBookPage = ({ page, isNest, onItemTap }: MenuBookPageProps) => {
  const { items, categoryName, heroImage } = page;
  const count = Math.min(items.length, 5);
  const positions = LAYOUT_POSITIONS[count - 1] || LAYOUT_POSITIONS[4];
  const accentClass = isNest ? "text-emerald-700" : "text-red-600";

  return (
    <div className="h-full w-full bg-[#f0ebe4] relative overflow-hidden select-none">
      {/* Subtle background image wash */}
      {heroImage && (
        <div className="absolute inset-0 opacity-[0.07]">
          <img src={heroImage} alt="" className="w-full h-full object-cover blur-2xl scale-110" />
        </div>
      )}

      {/* Large vertical category watermark — like the reference */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-foreground/[0.04] font-black text-[140px] leading-none tracking-tighter whitespace-nowrap -rotate-90 select-none"
          style={{ writingMode: "vertical-lr" }}
        >
          {categoryName}
        </motion.span>
      </div>

      {/* Category title at top */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-4 left-5 z-10"
      >
        <h2 className="text-foreground/80 text-xs font-bold uppercase tracking-[0.2em]">
          {categoryName}
        </h2>
      </motion.div>

      {/* Artistically positioned items */}
      <div className="absolute inset-0 pt-10 pb-4 px-3">
        {items.slice(0, 5).map((item, idx) => {
          const pos = positions[idx];
          return (
            <motion.button
              key={item.name}
              onClick={() => onItemTap(idx)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.08, duration: 0.45, ease: "easeOut" }}
              className="absolute active:scale-95 transition-transform touch-manipulation"
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.size,
                zIndex: pos.zIndex,
              }}
            >
              {/* Circular / rounded item with food image */}
              <div className="relative">
                {heroImage ? (
                  <div className="w-full aspect-square rounded-full overflow-hidden shadow-xl border-4 border-white/60">
                    <img
                      src={heroImage}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      style={{
                        // Offset each item's crop slightly to differentiate
                        objectPosition: `${30 + idx * 15}% ${20 + idx * 10}%`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-full bg-foreground/[0.06] border-4 border-white/40 flex items-center justify-center">
                    <span className="text-4xl font-black text-foreground/[0.08]">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Name + Price overlay */}
                <div className="mt-1.5 text-center px-1">
                  <p className="text-foreground/80 font-bold text-[11px] leading-tight truncate">
                    {item.name}
                  </p>
                  <p className={`font-bold text-[11px] ${accentClass}`}>
                    ₹{item.price}
                  </p>
                </div>

                {/* Tag badge */}
                {item.tag && (
                  <span
                    className={`absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                      item.tag === "Bestseller"
                        ? "bg-amber-100 text-amber-700"
                        : item.tag === "Chef's Pick"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.tag === "Chef's Pick" && (
                      <Star size={7} className="inline mr-0.5 -mt-px" />
                    )}
                    {item.tag}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Page edge decoration — looks like book page edge */}
      <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-gradient-to-l from-foreground/10 to-transparent" />
      <div className="absolute top-0 bottom-0 right-[3px] w-[1px] bg-foreground/[0.04]" />
    </div>
  );
};

export default MenuBookPage;
