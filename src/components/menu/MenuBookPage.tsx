import { motion } from "framer-motion";
import { MenuItem } from "@/data/menuData";
import { itemImages } from "./menuImages";

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
 * Magazine / poster-style menu page.
 * Floating transparent food images scattered like stickers on a cream page.
 * Matches the reference: large vertical category watermark + scattered items.
 */

// Asymmetric layout positions for floating items — percentage-based
const LAYOUTS: {
  top: string;
  left: string;
  size: string;
  rotate: number;
  z: number;
  labelSide: "left" | "right" | "below";
}[][] = [
  // 1 item
  [{ top: "20%", left: "15%", size: "65%", rotate: -3, z: 3, labelSide: "below" }],
  // 2 items
  [
    { top: "5%", left: "5%", size: "52%", rotate: -4, z: 2, labelSide: "right" },
    { top: "45%", left: "38%", size: "55%", rotate: 3, z: 3, labelSide: "left" },
  ],
  // 3 items
  [
    { top: "2%", left: "30%", size: "45%", rotate: 3, z: 3, labelSide: "below" },
    { top: "35%", left: "0%", size: "42%", rotate: -5, z: 2, labelSide: "right" },
    { top: "42%", left: "50%", size: "46%", rotate: 4, z: 4, labelSide: "left" },
  ],
  // 4 items
  [
    { top: "0%", left: "2%", size: "42%", rotate: -3, z: 2, labelSide: "right" },
    { top: "3%", left: "52%", size: "38%", rotate: 4, z: 3, labelSide: "below" },
    { top: "42%", left: "8%", size: "36%", rotate: 5, z: 4, labelSide: "right" },
    { top: "46%", left: "48%", size: "44%", rotate: -2, z: 5, labelSide: "left" },
  ],
  // 5 items — editorial collage matching the reference
  [
    { top: "0%", left: "5%", size: "36%", rotate: -4, z: 2, labelSide: "right" },
    { top: "2%", left: "55%", size: "32%", rotate: 5, z: 3, labelSide: "below" },
    { top: "28%", left: "25%", size: "40%", rotate: -1, z: 5, labelSide: "below" },
    { top: "52%", left: "0%", size: "34%", rotate: 6, z: 4, labelSide: "right" },
    { top: "55%", left: "48%", size: "38%", rotate: -3, z: 6, labelSide: "left" },
  ],
];

const MenuBookPage = ({ page, isNest, onItemTap }: MenuBookPageProps) => {
  const { items, categoryName } = page;
  const count = Math.min(items.length, 5);
  const positions = LAYOUTS[count - 1] || LAYOUTS[4];
  const accentColor = isNest ? "#047857" : "#dc2626";

  return (
    <div className="h-full w-full bg-[#f0ebe4] relative overflow-hidden select-none">
      {/* Large vertical watermark — category name rotated */}
      <motion.div
        className="absolute inset-0 flex items-center pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{ left: "2%" }}
      >
        <span
          className="font-black tracking-[-0.04em] leading-none select-none"
          style={{
            writingMode: "vertical-lr",
            transform: "rotate(180deg)",
            fontSize: "clamp(80px, 20vw, 160px)",
            color: "rgba(0,0,0,0.04)",
            letterSpacing: "-0.03em",
          }}
        >
          {categoryName.toUpperCase()}
        </span>
      </motion.div>

      {/* Category title — top */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="absolute top-4 left-0 right-0 z-10 text-center"
      >
        <h2
          className="text-[22px] font-black tracking-tight uppercase"
          style={{ color: "rgba(0,0,0,0.85)", fontFamily: "'Inter', sans-serif" }}
        >
          {categoryName.toUpperCase()}
        </h2>
      </motion.div>

      {/* Floating food items — sticker-style, no containers */}
      <div className="absolute inset-0 pt-14 pb-4 px-3">
        {items.slice(0, 5).map((item, idx) => {
          const pos = positions[idx];
          const img = itemImages[item.name];

          return (
            <motion.button
              key={item.name}
              onClick={() => onItemTap(idx)}
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: 0.12 + idx * 0.08,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute active:scale-95 transition-transform touch-manipulation group"
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.size,
                zIndex: pos.z,
              }}
            >
              {/* Food image — floating, transparent PNG, soft shadow */}
              <motion.div
                className="relative"
                style={{
                  transform: `rotate(${pos.rotate}deg)`,
                  filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.15))",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {img ? (
                  <img
                    src={img}
                    alt={item.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="w-full aspect-square object-contain"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center">
                    <span className="text-5xl font-black text-foreground/[0.06] select-none">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Floating label — name + price, no container */}
              <div
                className="mt-0.5"
                style={{
                  textAlign:
                    pos.labelSide === "left"
                      ? "left"
                      : pos.labelSide === "right"
                      ? "right"
                      : "center",
                }}
              >
                <p
                  className="font-bold text-[10px] leading-tight truncate"
                  style={{ color: "rgba(0,0,0,0.7)" }}
                >
                  {item.name}
                </p>
                <p
                  className="font-black text-[11px]"
                  style={{ color: accentColor }}
                >
                  ₹{item.price}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Book spine edge effects */}
      <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-gradient-to-l from-foreground/[0.08] to-transparent" />
      <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-foreground/[0.03]" />
    </div>
  );
};

export default MenuBookPage;
