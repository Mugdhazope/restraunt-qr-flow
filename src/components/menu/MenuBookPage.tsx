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
 * Editorial / magazine-style menu page.
 * Items are scattered asymmetrically like stickers on a page.
 * No cards, no containers, no grids — just floating images + typography.
 */

// Each layout position: percentage-based, with rotation and scale for editorial feel
const LAYOUTS: {
  top: string;
  left: string;
  w: string;
  rotate: number;
  z: number;
}[][] = [
  // 1 item — large centered
  [{ top: "18%", left: "12%", w: "72%", rotate: -2, z: 3 }],
  // 2 items — staggered
  [
    { top: "6%", left: "4%", w: "55%", rotate: -3, z: 2 },
    { top: "44%", left: "32%", w: "60%", rotate: 2.5, z: 3 },
  ],
  // 3 items — editorial triangle
  [
    { top: "4%", left: "28%", w: "50%", rotate: 2, z: 3 },
    { top: "36%", left: "2%", w: "44%", rotate: -4, z: 2 },
    { top: "46%", left: "48%", w: "48%", rotate: 3, z: 4 },
  ],
  // 4 items — magazine spread
  [
    { top: "2%", left: "4%", w: "46%", rotate: -2.5, z: 2 },
    { top: "6%", left: "50%", w: "42%", rotate: 3, z: 3 },
    { top: "44%", left: "8%", w: "40%", rotate: 4, z: 4 },
    { top: "48%", left: "46%", w: "48%", rotate: -1.5, z: 5 },
  ],
  // 5 items — full editorial collage
  [
    { top: "1%", left: "6%", w: "42%", rotate: -3, z: 2 },
    { top: "3%", left: "52%", w: "38%", rotate: 4, z: 3 },
    { top: "30%", left: "22%", w: "50%", rotate: -1, z: 5 },
    { top: "56%", left: "2%", w: "36%", rotate: 5, z: 4 },
    { top: "58%", left: "44%", w: "44%", rotate: -2.5, z: 6 },
  ],
];

const MenuBookPage = ({ page, isNest, onItemTap }: MenuBookPageProps) => {
  const { items, categoryName, heroImage } = page;
  const count = Math.min(items.length, 5);
  const positions = LAYOUTS[count - 1] || LAYOUTS[4];
  const accentColor = isNest ? "#047857" : "#dc2626";

  return (
    <div className="h-full w-full bg-[#f0ebe4] relative overflow-hidden select-none">
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Large watermark category name — rotated, editorial */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
      >
        <span
          className="text-[160px] font-black tracking-[-0.05em] leading-none text-foreground/[0.025] select-none"
          style={{
            writingMode: "vertical-lr",
            transform: "rotate(180deg)",
          }}
        >
          {categoryName}
        </span>
      </motion.div>

      {/* Category name — editorial typography */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="absolute top-5 left-5 z-10"
      >
        <p className="text-foreground/20 text-[9px] font-bold uppercase tracking-[0.3em] mb-0.5">
          Menu
        </p>
        <h2
          className="text-[22px] font-black tracking-tight leading-none"
          style={{ color: accentColor }}
        >
          {categoryName}
        </h2>
      </motion.div>

      {/* Floating food items — no containers, just images + text */}
      <div className="absolute inset-0 pt-16 pb-4 px-2">
        {items.slice(0, 5).map((item, idx) => {
          const pos = positions[idx];
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
              className="absolute active:scale-95 transition-transform touch-manipulation group"
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.w,
                zIndex: pos.z,
                transform: `rotate(${pos.rotate}deg)`,
              }}
            >
              {/* Food image — floating, no container */}
              <div className="relative">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={item.name}
                    className="w-full aspect-square object-cover drop-shadow-[0_8px_24px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_12px_32px_rgba(0,0,0,0.2)] transition-all duration-300"
                    style={{
                      borderRadius: "18% 22% 20% 24%",
                      objectPosition: `${25 + idx * 18}% ${15 + idx * 12}%`,
                    }}
                  />
                ) : (
                  <div
                    className="w-full aspect-square bg-gradient-to-br from-[#e8ddd0] to-[#d4c5b2] flex items-center justify-center drop-shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    style={{ borderRadius: "18% 22% 20% 24%" }}
                  >
                    <span className="text-5xl font-black text-foreground/[0.06] select-none">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Tag — floating badge, no container */}
                {item.tag && (
                  <span
                    className="absolute -top-1.5 -right-1 text-[7px] px-1.5 py-0.5 font-black uppercase tracking-wider"
                    style={{
                      color:
                        item.tag === "Bestseller"
                          ? "#b45309"
                          : item.tag === "Chef's Pick"
                          ? "#be123c"
                          : "#1d4ed8",
                      transform: "rotate(3deg)",
                    }}
                  >
                    {item.tag === "Chef's Pick" && (
                      <Star
                        size={7}
                        className="inline mr-0.5 -mt-px"
                        fill="currentColor"
                      />
                    )}
                    {item.tag}
                  </span>
                )}
              </div>

              {/* Name + price — floating text, no box */}
              <div
                className="mt-1 pl-1"
                style={{ transform: `rotate(${-pos.rotate * 0.3}deg)` }}
              >
                <p className="text-foreground/80 font-bold text-[11px] leading-tight truncate text-left">
                  {item.name}
                </p>
                <p
                  className="font-black text-[12px] text-left"
                  style={{ color: accentColor }}
                >
                  ₹{item.price}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Page edge — book spine effect */}
      <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-gradient-to-l from-foreground/[0.08] to-transparent" />
      <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-foreground/[0.03]" />
    </div>
  );
};

export default MenuBookPage;
