import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { MenuCategory } from "@/data/menuData";

interface MenuCategoryPageProps {
  category: MenuCategory;
  heroImage?: string;
  isNest: boolean;
  onItemTap: (itemIndex: number) => void;
}

/**
 * Full-screen magazine-style category page.
 * Items are arranged in a poster/editorial layout, NOT a list.
 */
const MenuCategoryPage = ({ category, heroImage, isNest, onItemTap }: MenuCategoryPageProps) => {
  const items = category.items;
  const accentColor = isNest ? "text-emerald-700" : "text-red-600";

  return (
    <div className="h-full w-full relative overflow-hidden select-none">
      {/* Full-bleed background image */}
      {heroImage && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <img
            src={heroImage}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

      {/* Content layer */}
      <div className="relative z-10 h-full flex flex-col px-5 pt-14 pb-6">
        {/* Category title — big editorial style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-auto"
        >
          <h2 className="text-white text-[36px] font-black tracking-tight leading-none">
            {category.name}
          </h2>
          <p className="text-white/50 text-sm mt-1.5 font-medium">
            {items.length} items · Tap to explore
          </p>
        </motion.div>

        {/* Items arranged as floating cards in a magazine layout */}
        <div className="flex-1 flex flex-col justify-end gap-2 mt-4">
          {items.slice(0, 6).map((item, idx) => (
            <motion.button
              key={item.name}
              onClick={() => onItemTap(idx)}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.06, duration: 0.4 }}
              className="w-full text-left active:scale-[0.97] transition-transform touch-manipulation"
            >
              <div className="bg-white/[0.12] backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-between border border-white/[0.08]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-[14px] truncate">
                      {item.name}
                    </h3>
                    {item.tag && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                          item.tag === "Bestseller"
                            ? "bg-amber-400/20 text-amber-300"
                            : item.tag === "Chef's Pick"
                            ? "bg-rose-400/20 text-rose-300"
                            : item.tag === "Popular"
                            ? "bg-blue-400/20 text-blue-300"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {item.tag === "Chef's Pick" && <Star size={7} className="inline mr-0.5 -mt-px" />}
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-[11px] mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>
                <span className="text-white font-bold text-[14px] ml-3 shrink-0">
                  ₹{item.price}
                </span>
              </div>
            </motion.button>
          ))}

          {items.length > 6 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/30 text-xs text-center mt-1"
            >
              +{items.length - 6} more items
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuCategoryPage;
