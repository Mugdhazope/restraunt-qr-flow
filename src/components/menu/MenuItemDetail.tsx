import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { MenuItem } from "@/data/menuData";
import { itemImages } from "./menuImages";

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
 * Item detail — Apple/Nike product page style.
 * Repeated typography texture background.
 * Large floating food image. Bold retro name + price. No cards.
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

  const accentColor = isNest ? "#047857" : "#c41e24";
  const img = itemImages[item.name] || heroImage;

  // Build typography background word
  const bgWord = categoryName.split(" ").slice(-1)[0].toUpperCase();

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#f0ebe4] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Typography texture background — repeated pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.025]">
        {Array.from({ length: 18 }).map((_, row) => (
          <div
            key={row}
            className="whitespace-nowrap"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(24px, 6vw, 40px)",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#000",
              letterSpacing: "0.06em",
              transform: `translateX(${row % 2 === 0 ? "-8%" : "12%"})`,
            }}
          >
            {Array.from({ length: 10 }).map((_, col) => (
              <span key={col} className="mr-5">{bgWord}</span>
            ))}
          </div>
        ))}
      </div>

      <motion.div
        className="h-full flex flex-col relative z-10"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
      >
        {/* Back button */}
        <motion.button
          onClick={onBack}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="absolute top-6 left-5 z-20 w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
        >
          <ArrowLeft size={16} className="text-foreground" />
        </motion.button>

        {/* Counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="absolute top-7 right-5 z-20 text-foreground/25 text-[11px] font-medium tracking-wider"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {currentIndex + 1} / {totalItems}
        </motion.div>

        {/* Hero image — large, floating, no container */}
        <div className="flex-shrink-0 flex items-center justify-center pt-20 pb-0 px-8">
          <motion.div
            key={item.name}
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-[65vw] max-w-[280px]"
            style={{
              filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.2))",
            }}
          >
            {img ? (
              <img
                src={img}
                alt={item.name}
                className="w-full aspect-square object-contain"
                draggable={false}
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center">
                <span
                  className="select-none"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "100px",
                    fontWeight: 900,
                    color: "rgba(0,0,0,0.03)",
                  }}
                >
                  {item.name.charAt(0)}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Text content — editorial typography, no containers */}
        <div className="flex-1 px-8 pt-4 overflow-y-auto">
          {/* Category label */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center tracking-[0.2em] uppercase"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "10px",
              fontWeight: 700,
              color: "rgba(0,0,0,0.3)",
            }}
          >
            {categoryName}
          </motion.p>

          {/* Item name — big, bold, retro */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-center mt-2 leading-[1.05]"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(26px, 7vw, 34px)",
              fontWeight: 900,
              color: "rgba(0,0,0,0.85)",
              letterSpacing: "-0.01em",
            }}
          >
            {item.name.toUpperCase()}
          </motion.h1>

          {/* Price — accent color, bold */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mt-2"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(22px, 5.5vw, 28px)",
              fontWeight: 900,
              color: accentColor,
            }}
          >
            ₹{item.price}
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-center mt-4 leading-[1.7] font-light"
            style={{
              fontSize: "14px",
              color: "rgba(0,0,0,0.4)",
              maxWidth: "320px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {item.description}
          </motion.p>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex items-center justify-center gap-3 mt-5"
          >
            {item.tag && (
              <span
                className="text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full"
                style={{
                  background:
                    item.tag === "Bestseller"
                      ? "#fef3c7"
                      : item.tag === "Chef's Pick"
                      ? "#fce7f3"
                      : "#dbeafe",
                  color:
                    item.tag === "Bestseller"
                      ? "#92400e"
                      : item.tag === "Chef's Pick"
                      ? "#9d174d"
                      : "#1e40af",
                }}
              >
                {item.tag === "Bestseller" ? "⭐ " : item.tag === "Chef's Pick" ? "👨‍🍳 " : "🔥 "}
                {item.tag}
              </span>
            )}
            {item.jain && (
              <span
                className="text-[9px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full"
                style={{
                  background: "#d1fae5",
                  color: "#065f46",
                }}
              >
                🌿 Jain Available
              </span>
            )}
          </motion.div>
        </div>

        {/* Bottom nav — prev/next */}
        <div className="px-8 pb-8 pt-3 flex items-center justify-between">
          <button
            onClick={onPrev || undefined}
            disabled={!onPrev}
            className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-15 active:scale-90 transition-all"
          >
            <ChevronLeft size={18} className="text-foreground/50" />
          </button>

          <div className="flex gap-[3px] max-w-[160px] overflow-hidden">
            {Array.from({ length: Math.min(totalItems, 20) }).map((_, i) => (
              <div
                key={i}
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-5"
                    : "w-[3px]"
                }`}
                style={{
                  background:
                    i === currentIndex
                      ? accentColor
                      : "rgba(0,0,0,0.08)",
                }}
              />
            ))}
          </div>

          <button
            onClick={onNext || undefined}
            disabled={!onNext}
            className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-15 active:scale-90 transition-all"
          >
            <ChevronRight size={18} className="text-foreground/50" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuItemDetail;
