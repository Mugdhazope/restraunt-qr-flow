import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { MenuItem } from "@/data/menuData";
import { RestaurantTheme } from "@/data/restaurantThemes";
import { itemImages } from "./menuImages";

interface MenuItemDetailProps {
  item: MenuItem;
  heroImage?: string;
  categoryName: string;
  theme: RestaurantTheme;
  onBack: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  currentIndex: number;
  totalItems: number;
}

const MenuItemDetail = ({ item, heroImage, categoryName, theme, onBack, onPrev, onNext, currentIndex, totalItems }: MenuItemDetailProps) => {
  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -60 && onNext) onNext();
    else if (info.offset.x > 60 && onPrev) onPrev();
  };

  const img = itemImages[item.name] || heroImage;
  const isPlatedCategory = /pizza|pasta|appetizer|non veg/i.test(categoryName);

  const getTagStyle = (tag: string) => {
    const key = tag === "Chef's Pick" ? "tagChefsPick" : `tag${tag}`;
    const t = (theme as any)[key] || theme.tagPopular;
    return { background: t.bg, color: t.text };
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: theme.background }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div className="h-full flex flex-col relative z-10" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12} onDragEnd={handleDragEnd}>
        <motion.button onClick={onBack} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="absolute top-6 left-5 z-20 w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
        >
          <ArrowLeft size={16} style={{ color: theme.text }} />
        </motion.button>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="absolute top-7 right-5 z-20 text-[11px] font-medium tracking-wider"
          style={{ fontFamily: theme.headingFont, color: theme.textSecondary }}
        >
          {currentIndex + 1} / {totalItems}
        </motion.div>

        {/* 3 BIG LINES */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
          className="absolute top-14 left-0 right-0 z-[1] pointer-events-none overflow-hidden"
        >
          {[1, 0.5, 0.2].map((opacity, i) => (
            <p key={i} className="leading-[0.95] uppercase" style={{ fontFamily: theme.headingFont, fontSize: "clamp(36px, 11vw, 56px)", color: theme.primary, opacity, paddingLeft: "20px", letterSpacing: "-0.01em" }}>
              {categoryName.toUpperCase()}
            </p>
          ))}
        </motion.div>

        {item.isNew && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute top-14 right-4 z-20 pointer-events-none"
          >
            {[1, 0.5, 0.25].map((opacity, i) => (
              <p key={i} className="leading-[0.95] uppercase text-right" style={{ fontFamily: theme.headingFont, fontSize: "clamp(16px, 5vw, 22px)", color: theme.primary, opacity }}>
                IT'S NEW
              </p>
            ))}
          </motion.div>
        )}

        {/* Hero image */}
        <div className={`flex-1 flex items-center relative ${isPlatedCategory ? "justify-end pr-0" : "justify-center px-4"} pt-[140px] pb-0`}>
          <motion.div
            key={item.name}
            initial={{ scale: 0.3, opacity: 0, rotate: isPlatedCategory ? 5 : -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`relative ${isPlatedCategory ? "w-[110vw] -mr-[25vw] max-w-[500px]" : "w-[90vw] max-w-[400px]"}`}
            style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.25))" }}
          >
            {img ? (
              <img src={img} alt={item.name} className={`w-full ${isPlatedCategory ? "aspect-square object-cover rounded-full" : "aspect-square object-contain"}`} draggable={false} />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center">
                <span className="select-none" style={{ fontFamily: theme.headingFont, fontSize: "140px", color: "rgba(0,0,0,0.03)" }}>{item.name.charAt(0)}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Text content */}
        <div className="relative z-10 px-6 pb-2 -mt-4">
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
            className="leading-[1] mt-1"
            style={{ fontFamily: theme.headingFont, fontSize: "clamp(26px, 8vw, 36px)", color: theme.text, letterSpacing: "0.01em" }}
          >
            {item.name.toUpperCase()}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-1" style={{ fontFamily: theme.headingFont, fontSize: "clamp(22px, 6vw, 30px)", color: theme.primary }}
          >
            ₹{item.price}
          </motion.p>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-2 leading-[1.6]"
            style={{ fontFamily: theme.serifFont, fontStyle: "italic", fontSize: "12px", color: theme.textSecondary, maxWidth: "300px" }}
          >
            {item.description}
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="flex items-center gap-2 mt-3">
            {item.tag && (
              <span className="text-[8px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full" style={{ fontFamily: theme.headingFont, ...getTagStyle(item.tag) }}>
                {item.tag === "Bestseller" ? "⭐ " : item.tag === "Chef's Pick" ? "👨‍🍳 " : "🔥 "}{item.tag}
              </span>
            )}
            {item.isNew && (
              <span className="text-[8px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full" style={{ fontFamily: theme.headingFont, background: theme.tagNew.bg, color: theme.tagNew.text }}>✨ New</span>
            )}
            {item.featured && (
              <span className="text-[8px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full" style={{ fontFamily: theme.headingFont, background: theme.tagFeatured.bg, color: theme.tagFeatured.text }}>⭐ Featured</span>
            )}
            {item.jain && (
              <span className="text-[8px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full" style={{ fontFamily: theme.headingFont, background: theme.tagJain.bg, color: theme.tagJain.text }}>🌿 Jain</span>
            )}
          </motion.div>
        </div>

        {/* Bottom nav */}
        <div className="px-8 pb-6 pt-2 flex items-center justify-between">
          <button onClick={onPrev || undefined} disabled={!onPrev} className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-15 active:scale-90 transition-all">
            <ChevronLeft size={18} style={{ color: theme.textSecondary }} />
          </button>
          <div className="flex gap-[3px] max-w-[160px] overflow-hidden">
            {Array.from({ length: Math.min(totalItems, 20) }).map((_, i) => (
              <div key={i} className={`h-[3px] rounded-full transition-all duration-300 ${i === currentIndex ? "w-5" : "w-[3px]"}`}
                style={{ background: i === currentIndex ? theme.primary : "rgba(0,0,0,0.08)" }} />
            ))}
          </div>
          <button onClick={onNext || undefined} disabled={!onNext} className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center disabled:opacity-15 active:scale-90 transition-all">
            <ChevronRight size={18} style={{ color: theme.textSecondary }} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuItemDetail;
