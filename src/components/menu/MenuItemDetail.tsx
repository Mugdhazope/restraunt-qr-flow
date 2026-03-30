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

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#f5f0eb]"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 280 }}
    >
      <motion.div
        className="h-full flex flex-col"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
      >
        {/* Hero image — takes ~45% of screen */}
        <div className="relative h-[45vh] overflow-hidden">
          {heroImage ? (
            <motion.img
              src={heroImage}
              alt={item.name}
              className="w-full h-full object-cover"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#e8e0d5] to-[#d4c8b8] flex items-center justify-center">
              <span className="text-[120px] font-black text-foreground/[0.04] select-none">
                {item.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Gradient fade into content */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f5f0eb] via-transparent to-black/10" />

          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-5 left-5 z-10 w-11 h-11 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>

          {/* Tag */}
          {item.tag && (
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`absolute top-6 right-5 z-10 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                item.tag === "Bestseller"
                  ? "bg-amber-100/90 text-amber-700"
                  : item.tag === "Chef's Pick"
                  ? "bg-rose-100/90 text-rose-700"
                  : "bg-white/70 text-foreground/70"
              }`}
            >
              {item.tag === "Chef's Pick" && <Star size={10} className="inline mr-1 -mt-px" />}
              {item.tag}
            </motion.span>
          )}

          {/* Item counter */}
          <div className="absolute bottom-4 right-5 z-10 text-foreground/40 text-xs font-medium">
            {currentIndex + 1} / {totalItems}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 -mt-4 relative z-10 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <h1 className="text-[28px] font-black text-foreground tracking-tight leading-tight">
              {item.name}
            </h1>
            <p className={`text-2xl font-bold mt-2 ${isNest ? "text-emerald-700" : "text-red-600"}`}>
              ₹{item.price}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-foreground/60 text-[15px] leading-relaxed mt-5"
          >
            {item.description}
          </motion.p>

          {item.jain && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-block mt-4 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium"
            >
              🌿 Jain available
            </motion.span>
          )}

          {/* Decorative category watermark */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-[48px] font-black text-foreground/[0.03] leading-none mt-8 select-none tracking-tighter"
          >
            {categoryName}
          </motion.p>
        </div>

        {/* Bottom nav arrows for swiping between items */}
        <div className="px-6 pb-8 pt-2 flex items-center justify-between">
          <button
            onClick={onPrev || undefined}
            disabled={!onPrev}
            className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalItems }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-4 bg-foreground/40" : "w-1 bg-foreground/10"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onNext || undefined}
            disabled={!onNext}
            className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all"
          >
            <ChevronRight size={20} className="text-foreground" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuItemDetail;
