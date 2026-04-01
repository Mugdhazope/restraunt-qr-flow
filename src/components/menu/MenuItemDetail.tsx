import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Star } from "lucide-react";
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
 * Full-screen item detail — inspired by the reference.
 * Large floating food image on cream background.
 * Big bold name, price, description. No cards or containers.
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
  const img = itemImages[item.name] || heroImage;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#f0ebe4]"
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
        {/* Back button */}
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

        {/* Counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-7 right-5 z-20 text-foreground/30 text-[11px] font-medium tracking-wider"
        >
          {currentIndex + 1} / {totalItems}
        </motion.div>

        {/* Large floating food image — no container, transparent BG */}
        <div className="flex-shrink-0 flex items-center justify-center pt-20 pb-2 px-10">
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-[60vw] max-w-[260px]"
            style={{
              filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.18))",
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
                className="absolute -bottom-1 -right-2 text-[9px] font-black uppercase tracking-wider"
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

        {/* Typography — name, price, description. No containers. */}
        <div className="flex-1 px-8 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-center"
          >
            <h1
              className="text-[28px] font-black tracking-tight leading-[1.1] uppercase"
              style={{ color: "rgba(0,0,0,0.85)" }}
            >
              {item.name}
            </h1>
            <p
              className="text-[24px] font-black mt-1 tracking-tight"
              style={{ color: accentColor }}
            >
              ₹{item.price}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-foreground/45 text-[14px] leading-[1.7] mt-4 font-light text-center"
          >
            {item.description}
          </motion.p>

          {item.jain && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="block mt-4 text-emerald-700 text-[11px] font-bold uppercase tracking-[0.15em] text-center"
            >
              🌿 Jain available
            </motion.span>
          )}
        </div>

        {/* Bottom nav */}
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
