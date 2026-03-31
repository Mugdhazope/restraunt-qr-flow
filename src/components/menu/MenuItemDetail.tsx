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

  const accentColor = isNest ? "#047857" : "#dc2626";

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Blurred background */}
      <div className="absolute inset-0">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="w-full h-full object-cover scale-110 blur-3xl opacity-40"
          />
        ) : (
          <div className="w-full h-full bg-[#e8e0d5]" />
        )}
        <div className="absolute inset-0 bg-[#f4efe8]/70" />
      </div>

      <motion.div
        className="relative h-full flex flex-col"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
      >
        {/* Back + Counter */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-5">
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <span className="text-foreground/40 text-xs font-medium bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {currentIndex + 1} / {totalItems}
          </span>
        </div>

        {/* Hero food image — large, floating */}
        <div className="flex-1 flex items-center justify-center pt-20 pb-4 px-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[320px]"
          >
            {heroImage ? (
              <img
                src={heroImage}
                alt={item.name}
                className="w-full aspect-square object-cover rounded-3xl"
                style={{
                  filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.2))",
                  objectPosition: `${30 + (currentIndex % 5) * 15}% center`,
                }}
              />
            ) : (
              <div
                className="w-full aspect-square rounded-3xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #e8e0d5, #d4c8b8)",
                  filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.15))",
                }}
              >
                <span className="text-[100px] font-black opacity-5 select-none">
                  {item.name.charAt(0)}
                </span>
              </div>
            )}

            {/* Tag */}
            {item.tag && (
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`absolute top-2 right-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                  item.tag === "Bestseller"
                    ? "bg-amber-400 text-amber-900"
                    : item.tag === "Chef's Pick"
                    ? "bg-rose-400 text-white"
                    : item.tag === "Popular"
                    ? "bg-orange-400 text-white"
                    : "bg-white/90 text-foreground/70"
                }`}
              >
                {item.tag === "Chef's Pick" && (
                  <Star size={10} className="inline mr-1 -mt-px" />
                )}
                {item.tag}
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* Content area — gradient overlay style */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="px-7 pb-6"
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
            style={{ color: accentColor, opacity: 0.7 }}
          >
            {categoryName}
          </p>
          <h1 className="text-[28px] font-black text-foreground tracking-tight leading-tight">
            {item.name}
          </h1>
          <p
            className="text-2xl font-bold mt-1.5"
            style={{ color: accentColor }}
          >
            ₹{item.price}
          </p>

          <p className="text-foreground/50 text-[14px] leading-relaxed mt-3">
            {item.description}
          </p>

          {item.jain && (
            <span className="inline-block mt-3 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
              🌿 Jain available
            </span>
          )}
        </motion.div>

        {/* Bottom nav */}
        <div className="px-7 pb-8 pt-2 flex items-center justify-between">
          <button
            onClick={onPrev || undefined}
            disabled={!onPrev}
            className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all shadow-md"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>

          <div className="flex gap-1 max-w-[160px] overflow-hidden">
            {Array.from({ length: Math.min(totalItems, 15) }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-5 bg-foreground/50" : "w-1 bg-foreground/10"
                }`}
              />
            ))}
          </div>

          <button
            onClick={onNext || undefined}
            disabled={!onNext}
            className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all shadow-md"
          >
            <ChevronRight size={20} className="text-foreground" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuItemDetail;
