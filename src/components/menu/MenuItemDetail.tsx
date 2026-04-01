import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { MenuItem } from "@/data/menuData";

interface MenuItemDetailProps {
  item: MenuItem;
  heroImage?: string;
  categoryName: string;
  isNest: boolean;
  onBack: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  currentIndex: number;
  totalItems: number;
}

/**
 * Editorial item detail — no cards, no containers.
 * Large floating food image with typography below on plain background.
 * Inspired by Apple product pages / luxury restaurant menus.
 */
const MenuItemDetail = ({
  item,
  heroImage,
  categoryName,
  isNest,
  onBack,
  onPrev,
  onNext,
  currentIndex,
  totalItems,
}: MenuItemDetailProps) => {
  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -60 && onNext) onNext();
    else if (info.offset.x > 60 && onPrev) onPrev();
  };

  const accentColor = isNest ? "#047857" : "#dc2626";

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#f5f0eb] to-[#ece5db]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="h-full flex flex-col"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
      >
        {/* Back button — floating */}
        <motion.button
          onClick={onBack}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-6 left-5 z-20 w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        >
          <ArrowLeft size={16} className="text-foreground" />
        </motion.button>

        {/* Counter — floating */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-7 right-5 z-20 text-foreground/30 text-[11px] font-medium tracking-wider"
        >
          {currentIndex + 1} / {totalItems}
        </motion.div>

        {/* Large floating food image — no container */}
        <div className="flex-shrink-0 flex items-center justify-center pt-20 pb-4 px-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-[65vw] max-w-[280px]"
          >
            {heroImage ? (
              <img
                src={heroImage}
                alt={item.name}
                className="w-full aspect-square object-cover"
                style={{
                  borderRadius: "22% 28% 24% 20%",
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.18))",
                }}
              />
            ) : (
              <div
                className="w-full aspect-square bg-gradient-to-br from-[#e8ddd0] to-[#cfc0ad] flex items-center justify-center"
                style={{
                  borderRadius: "22% 28% 24% 20%",
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.12))",
                }}
              >
                <span className="text-[80px] font-black text-foreground/[0.04] select-none">
                  {item.name.charAt(0)}
                </span>
              </div>
            )}

            {/* Tag — floating near image */}
            {item.tag && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-2 -right-3 text-[9px] font-black uppercase tracking-wider"
                style={{
                  color:
                    item.tag === "Bestseller"
                      ? "#b45309"
                      : item.tag === "Chef's Pick"
                      ? "#be123c"
                      : "#1d4ed8",
                  transform: "rotate(-3deg)",
                }}
              >
                {item.tag === "Chef's Pick" && (
                  <Star
                    size={9}
                    className="inline mr-0.5 -mt-px"
                    fill="currentColor"
                  />
                )}
                {item.tag}
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* Typography content — no containers, just text on page */}
        <div className="flex-1 px-8 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p className="text-foreground/25 text-[9px] font-bold uppercase tracking-[0.25em] mb-2">
              {categoryName}
            </p>
            <h1 className="text-[32px] font-black text-foreground tracking-tight leading-[1.1]">
              {item.name}
            </h1>
            <p
              className="text-[28px] font-black mt-3 tracking-tight"
              style={{ color: accentColor }}
            >
              ₹{item.price}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-foreground/45 text-[15px] leading-[1.7] mt-6 font-light"
          >
            {item.description}
          </motion.p>

          {item.jain && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-block mt-5 text-emerald-700 text-[11px] font-bold uppercase tracking-[0.15em]"
            >
              🌿 Jain available
            </motion.span>
          )}
        </div>

        {/* Bottom nav — minimal, floating */}
        <div className="px-8 pb-8 pt-3 flex items-center justify-between">
          <button
            onClick={onPrev || undefined}
            disabled={!onPrev}
            className="w-11 h-11 rounded-full bg-foreground/[0.04] flex items-center justify-center disabled:opacity-15 active:scale-90 transition-all"
          >
            <ChevronLeft size={18} className="text-foreground/60" />
          </button>

          <div className="flex gap-[3px] max-w-[160px] overflow-hidden">
            {Array.from({ length: Math.min(totalItems, 20) }).map((_, i) => (
              <div
                key={i}
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-5 bg-foreground/35"
                    : "w-[3px] bg-foreground/[0.08]"
                }`}
              />
            ))}
          </div>

          <button
            onClick={onNext || undefined}
            disabled={!onNext}
            className="w-11 h-11 rounded-full bg-foreground/[0.04] flex items-center justify-center disabled:opacity-15 active:scale-90 transition-all"
          >
            <ChevronRight size={18} className="text-foreground/60" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuItemDetail;
