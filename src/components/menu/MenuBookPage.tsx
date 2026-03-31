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
 * Magazine / editorial poster page.
 * Items float freely at different sizes, positions, and rotations.
 * NO circles, NO cards, NO grids — just images placed on a page like a food magazine.
 */

interface ItemLayout {
  top: string;
  left: string;
  width: string;
  rotate: number;
  zIndex: number;
  labelPos: "below" | "right" | "left";
}

// Magazine-style scattered layouts — varied sizes, overlapping, rotated
const LAYOUTS: ItemLayout[][] = [
  // 1 item — hero center
  [{ top: "18%", left: "10%", width: "80%", rotate: -2, zIndex: 3, labelPos: "below" }],
  // 2 items
  [
    { top: "8%", left: "5%", width: "58%", rotate: -3, zIndex: 2, labelPos: "below" },
    { top: "45%", left: "35%", width: "60%", rotate: 2, zIndex: 3, labelPos: "below" },
  ],
  // 3 items — one large, two smaller
  [
    { top: "5%", left: "8%", width: "55%", rotate: -2, zIndex: 3, labelPos: "right" },
    { top: "10%", left: "58%", width: "38%", rotate: 4, zIndex: 2, labelPos: "below" },
    { top: "52%", left: "15%", width: "65%", rotate: -1, zIndex: 4, labelPos: "below" },
  ],
  // 4 items — mixed sizes
  [
    { top: "3%", left: "2%", width: "50%", rotate: -3, zIndex: 2, labelPos: "below" },
    { top: "5%", left: "52%", width: "42%", rotate: 3, zIndex: 3, labelPos: "below" },
    { top: "44%", left: "8%", width: "38%", rotate: 2, zIndex: 4, labelPos: "below" },
    { top: "48%", left: "42%", width: "55%", rotate: -2, zIndex: 5, labelPos: "below" },
  ],
  // 5 items — editorial scatter
  [
    { top: "2%", left: "5%", width: "45%", rotate: -2, zIndex: 2, labelPos: "below" },
    { top: "3%", left: "52%", width: "40%", rotate: 4, zIndex: 3, labelPos: "below" },
    { top: "32%", left: "20%", width: "52%", rotate: -1, zIndex: 5, labelPos: "below" },
    { top: "58%", left: "0%", width: "42%", rotate: 3, zIndex: 4, labelPos: "below" },
    { top: "60%", left: "44%", width: "48%", rotate: -3, zIndex: 6, labelPos: "below" },
  ],
];

const MenuBookPage = ({ page, isNest, onItemTap }: MenuBookPageProps) => {
  const { items, categoryName, heroImage } = page;
  const count = Math.min(items.length, 5);
  const positions = LAYOUTS[count - 1] || LAYOUTS[4];
  const accentColor = isNest ? "#047857" : "#dc2626";

  return (
    <div className="h-full w-full bg-[#f4efe8] relative overflow-hidden select-none">
      {/* Subtle paper texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Large watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.03 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="font-black text-[160px] leading-none tracking-tighter whitespace-nowrap select-none uppercase"
          style={{
            color: accentColor,
            transform: "rotate(-90deg)",
          }}
        >
          {categoryName}
        </motion.span>
      </div>

      {/* Category header — editorial style */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="absolute top-5 left-5 z-10"
      >
        <div
          className="w-8 h-[2px] mb-2"
          style={{ backgroundColor: accentColor }}
        />
        <h2
          className="text-[10px] font-bold uppercase tracking-[0.25em]"
          style={{ color: accentColor }}
        >
          {categoryName}
        </h2>
      </motion.div>

      {/* Freely placed food items — magazine style */}
      <div className="absolute inset-0 pt-14 pb-4 px-2">
        {items.slice(0, 5).map((item, idx) => {
          const layout = positions[idx];
          return (
            <motion.button
              key={item.name}
              onClick={() => onItemTap(idx)}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.15 + idx * 0.1,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute touch-manipulation group"
              style={{
                top: layout.top,
                left: layout.left,
                width: layout.width,
                zIndex: layout.zIndex,
                transform: `rotate(${layout.rotate}deg)`,
              }}
              whileTap={{ scale: 0.93 }}
            >
              <div className="relative">
                {/* Food image — floating with drop shadow, NO border, NO circle */}
                <div className="relative">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt={item.name}
                      className="w-full aspect-[4/3] object-cover rounded-2xl"
                      style={{
                        objectPosition: `${20 + idx * 18}% ${15 + idx * 12}%`,
                        filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.15))",
                      }}
                    />
                  ) : (
                    <div
                      className="w-full aspect-[4/3] rounded-2xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, #e8e0d5, #d4c8b8)`,
                        filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.1))",
                      }}
                    >
                      <span className="text-5xl font-black opacity-10">
                        {item.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Hover / active glow */}
                  <div className="absolute inset-0 rounded-2xl bg-white/0 group-active:bg-white/10 transition-colors duration-200" />
                </div>

                {/* Name + Price — overlaid at bottom of image */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/50 via-black/20 to-transparent rounded-b-2xl">
                  <p className="text-white font-bold text-[12px] leading-tight truncate drop-shadow-sm">
                    {item.name}
                  </p>
                  <p className="text-white/80 font-semibold text-[11px] mt-0.5">
                    ₹{item.price}
                  </p>
                </div>

                {/* Tag — floating badge */}
                {item.tag && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + idx * 0.08 }}
                    className={`absolute -top-2 -right-2 text-[8px] px-2 py-1 rounded-full font-bold shadow-md ${
                      item.tag === "Bestseller"
                        ? "bg-amber-400 text-amber-900"
                        : item.tag === "Chef's Pick"
                        ? "bg-rose-400 text-white"
                        : item.tag === "Popular"
                        ? "bg-orange-400 text-white"
                        : "bg-white text-foreground/70"
                    }`}
                  >
                    {item.tag === "Chef's Pick" && (
                      <Star size={7} className="inline mr-0.5 -mt-px" />
                    )}
                    {item.tag}
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Book edge — right side */}
      <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-l from-black/8 to-transparent" />
      <div className="absolute top-0 bottom-0 right-1 w-px bg-black/[0.03]" />
      {/* Book edge — left side (spine) */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-r from-black/5 to-transparent" />
    </div>
  );
};

export default MenuBookPage;
