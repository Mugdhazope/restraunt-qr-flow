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
 * Editorial / magazine poster page.
 * Floating transparent food PNGs scattered asymmetrically on a cream page.
 * Large typography watermark. No cards, no grids, no containers.
 */

// Asymmetric positions for floating items — editorial collage style
// Each layout: top, left, width, rotation, z-index, label anchor
const LAYOUTS: {
  top: string;
  left: string;
  w: string;
  rotate: number;
  z: number;
  labelAnchor: "tl" | "tr" | "bl" | "br" | "bc";
}[][] = [
  // 1 item — hero centered
  [{ top: "18%", left: "10%", w: "75%", rotate: -2, z: 3, labelAnchor: "bc" }],
  // 2 items
  [
    { top: "4%", left: "2%", w: "55%", rotate: -5, z: 2, labelAnchor: "br" },
    { top: "44%", left: "35%", w: "58%", rotate: 4, z: 3, labelAnchor: "bl" },
  ],
  // 3 items
  [
    { top: "2%", left: "25%", w: "50%", rotate: 3, z: 3, labelAnchor: "bc" },
    { top: "34%", left: "-2%", w: "44%", rotate: -6, z: 2, labelAnchor: "br" },
    { top: "40%", left: "48%", w: "48%", rotate: 5, z: 4, labelAnchor: "bl" },
  ],
  // 4 items
  [
    { top: "0%", left: "0%", w: "44%", rotate: -4, z: 2, labelAnchor: "br" },
    { top: "2%", left: "50%", w: "40%", rotate: 5, z: 3, labelAnchor: "bl" },
    { top: "40%", left: "5%", w: "38%", rotate: 6, z: 4, labelAnchor: "br" },
    { top: "44%", left: "46%", w: "46%", rotate: -3, z: 5, labelAnchor: "bl" },
  ],
  // 5 items — full editorial collage
  [
    { top: "0%", left: "3%", w: "38%", rotate: -5, z: 2, labelAnchor: "br" },
    { top: "1%", left: "52%", w: "34%", rotate: 6, z: 3, labelAnchor: "bl" },
    { top: "26%", left: "22%", w: "42%", rotate: -1, z: 5, labelAnchor: "bc" },
    { top: "50%", left: "-2%", w: "36%", rotate: 7, z: 4, labelAnchor: "br" },
    { top: "52%", left: "45%", w: "40%", rotate: -4, z: 6, labelAnchor: "bl" },
  ],
];

const MenuBookPage = ({ page, isNest, onItemTap }: MenuBookPageProps) => {
  const { items, categoryName } = page;
  const count = Math.min(items.length, 5);
  const positions = LAYOUTS[count - 1] || LAYOUTS[4];
  const accentColor = isNest ? "#047857" : "#c41e24";

  // Build repeated typography background text
  const bgWord = categoryName.split(" ").slice(-1)[0].toUpperCase();

  return (
    <div className="h-full w-full bg-[#f0ebe4] relative overflow-hidden select-none">
      {/* Typography texture background — repeated word pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        {Array.from({ length: 12 }).map((_, row) => (
          <div
            key={row}
            className="whitespace-nowrap"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(28px, 7vw, 48px)",
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#000",
              letterSpacing: "0.05em",
              transform: `translateX(${row % 2 === 0 ? "-10%" : "5%"})`,
            }}
          >
            {Array.from({ length: 8 }).map((_, col) => (
              <span key={col} className="mr-6">{bgWord}</span>
            ))}
          </div>
        ))}
      </div>

      {/* Category title — bold retro style at top */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="absolute top-5 left-0 right-0 z-10 text-center px-4"
      >
        <h2
          className="tracking-[0.15em] uppercase leading-none"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "clamp(18px, 5vw, 26px)",
            fontWeight: 900,
            color: accentColor,
            textShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          {categoryName.toUpperCase()}
        </h2>
        <div
          className="mx-auto mt-2 h-[2px] w-12 rounded-full"
          style={{ background: accentColor, opacity: 0.3 }}
        />
      </motion.div>

      {/* Floating food items — sticker-style, no containers */}
      <div className="absolute inset-0 pt-16 pb-4 px-3">
        {items.slice(0, 5).map((item, idx) => {
          const pos = positions[idx];
          const img = itemImages[item.name];

          return (
            <motion.button
              key={item.name}
              onClick={() => onItemTap(idx)}
              initial={{ opacity: 0, scale: 0.5, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
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
              }}
            >
              {/* Food image — floating, transparent, soft drop shadow */}
              <motion.div
                className="relative"
                style={{
                  transform: `rotate(${pos.rotate}deg)`,
                  filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.18))",
                }}
                whileTap={{ scale: 0.93 }}
              >
                {img ? (
                  <img
                    src={img}
                    alt={item.name}
                    loading="lazy"
                    className="w-full aspect-square object-contain"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center">
                    <span
                      className="font-black select-none"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "clamp(40px, 12vw, 72px)",
                        color: "rgba(0,0,0,0.04)",
                      }}
                    >
                      {item.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Tag badge — floating near image */}
                {item.tag && (
                  <span
                    className="absolute -top-1 -right-1 text-[7px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full"
                    style={{
                      background:
                        item.tag === "Bestseller"
                          ? "#fbbf24"
                          : item.tag === "Chef's Pick"
                          ? "#f43f5e"
                          : "#3b82f6",
                      color:
                        item.tag === "Bestseller" ? "#78350f" : "#fff",
                      transform: `rotate(${-pos.rotate + 3}deg)`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    {item.tag}
                  </span>
                )}
              </motion.div>

              {/* Floating typography label — name overlapping image slightly, price nearby */}
              <div
                className="relative -mt-2"
                style={{
                  textAlign:
                    pos.labelAnchor === "bl" || pos.labelAnchor === "tl"
                      ? "left"
                      : pos.labelAnchor === "br" || pos.labelAnchor === "tr"
                      ? "right"
                      : "center",
                  paddingLeft: pos.labelAnchor.includes("l") ? "4px" : 0,
                  paddingRight: pos.labelAnchor.includes("r") ? "4px" : 0,
                }}
              >
                <p
                  className="leading-tight truncate"
                  style={{
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontWeight: 900,
                    fontSize: "clamp(9px, 2.5vw, 12px)",
                    color: "rgba(0,0,0,0.75)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {item.name}
                </p>
                <p
                  className="font-black"
                  style={{
                    fontSize: "clamp(10px, 2.8vw, 13px)",
                    color: accentColor,
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  ₹{item.price}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Subtle page edge effects */}
      <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-gradient-to-l from-black/[0.06] to-transparent" />
      <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-black/[0.02]" />
    </div>
  );
};

export default MenuBookPage;
