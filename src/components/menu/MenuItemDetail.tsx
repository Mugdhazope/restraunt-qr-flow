import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { MenuItem } from "@/data/menuData";
import { itemImages } from "./menuImages";

const BRAND_FONT = "'Righteous', cursive";
const SERIF_FONT = "'Playfair Display', 'Georgia', serif";

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
  const bgWord = categoryName.split(" ").slice(-1)[0].toUpperCase();

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#f0ebe4] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Typography texture background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.025]">
        {Array.from({ length: 18 }).map((_, row) => (
          <div
            key={row}
            className="whitespace-nowrap"
            style={{
              fontFamily: BRAND_FONT,
              fontSize: "clamp(28px, 7vw, 44px)",
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
          style={{ fontFamily: BRAND_FONT }}
        >
          {currentIndex + 1} / {totalItems}
        </motion.div>

        {/* EXTREME ZOOM Hero image — takes up almost the whole screen */}
        <div className="flex-1 flex items-center justify-center px-4 pt-14 pb-0 relative">
          <motion.div
            key={item.name}
            initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-[90vw] max-w-[400px]"
            style={{
              filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.25))",
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
                    fontFamily: BRAND_FONT,
                    fontSize: "140px",
                    color: "rgba(0,0,0,0.03)",
                  }}
                >
                  {item.name.charAt(0)}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Text content — compact at bottom, overlapping image area */}
        <div className="relative z-10 px-6 pb-2 -mt-6">
          {/* Category label */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center tracking-[0.25em] uppercase"
            style={{
              fontFamily: SERIF_FONT,
              fontSize: "9px",
              fontWeight: 400,
              fontStyle: "italic",
              color: "rgba(0,0,0,0.3)",
            }}
          >
            {categoryName}
          </motion.p>

          {/* Item name — Bauhaus style */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-center mt-1 leading-[1]"
            style={{
              fontFamily: BRAND_FONT,
              fontSize: "clamp(24px, 7vw, 32px)",
              color: "rgba(0,0,0,0.85)",
              letterSpacing: "0.02em",
            }}
          >
            {item.name}
          </motion.h1>

          {/* Price */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mt-1"
            style={{
              fontFamily: BRAND_FONT,
              fontSize: "clamp(20px, 5vw, 26px)",
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
            className="text-center mt-2 leading-[1.6]"
            style={{
              fontFamily: SERIF_FONT,
              fontStyle: "italic",
              fontSize: "12px",
              color: "rgba(0,0,0,0.35)",
              maxWidth: "300px",
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
            className="flex items-center justify-center gap-2 mt-3"
          >
            {item.tag && (
              <span
                className="text-[8px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
                style={{
                  fontFamily: BRAND_FONT,
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
                className="text-[8px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full"
                style={{
                  fontFamily: BRAND_FONT,
                  background: "#d1fae5",
                  color: "#065f46",
                }}
              >
                🌿 Jain
              </span>
            )}
          </motion.div>
        </div>

        {/* Bottom nav */}
        <div className="px-8 pb-6 pt-2 flex items-center justify-between">
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
                  i === currentIndex ? "w-5" : "w-[3px]"
                }`}
                style={{
                  background: i === currentIndex ? accentColor : "rgba(0,0,0,0.08)",
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
