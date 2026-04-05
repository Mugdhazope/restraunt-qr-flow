import { motion } from "framer-motion";
import { MenuItem } from "@/data/menuData";
import { RestaurantTheme } from "@/data/restaurantThemes";
import { itemImages } from "./menuImages";

interface MenuBookPageProps {
  page: {
    categoryName: string;
    items: MenuItem[];
    heroImage?: string;
    pageLabel: string;
  };
  theme: RestaurantTheme;
  onItemTap: (itemIndex: number) => void;
}

// Asymmetric positions for floating items
const LAYOUTS: {
  top: string;
  left: string;
  w: string;
  rotate: number;
  z: number;
  labelAnchor: "tl" | "tr" | "bl" | "br" | "bc";
}[][] = [
  [{ top: "18%", left: "10%", w: "75%", rotate: -2, z: 3, labelAnchor: "bc" }],
  [
    { top: "4%", left: "2%", w: "55%", rotate: -5, z: 2, labelAnchor: "br" },
    { top: "44%", left: "35%", w: "58%", rotate: 4, z: 3, labelAnchor: "bl" },
  ],
  [
    { top: "2%", left: "25%", w: "50%", rotate: 3, z: 3, labelAnchor: "bc" },
    { top: "34%", left: "-2%", w: "44%", rotate: -6, z: 2, labelAnchor: "br" },
    { top: "40%", left: "48%", w: "48%", rotate: 5, z: 4, labelAnchor: "bl" },
  ],
  [
    { top: "0%", left: "0%", w: "44%", rotate: -4, z: 2, labelAnchor: "br" },
    { top: "2%", left: "50%", w: "40%", rotate: 5, z: 3, labelAnchor: "bl" },
    { top: "40%", left: "5%", w: "38%", rotate: 6, z: 4, labelAnchor: "br" },
    { top: "44%", left: "46%", w: "46%", rotate: -3, z: 5, labelAnchor: "bl" },
  ],
  [
    { top: "0%", left: "3%", w: "38%", rotate: -5, z: 2, labelAnchor: "br" },
    { top: "1%", left: "52%", w: "34%", rotate: 6, z: 3, labelAnchor: "bl" },
    { top: "26%", left: "22%", w: "42%", rotate: -1, z: 5, labelAnchor: "bc" },
    { top: "50%", left: "-2%", w: "36%", rotate: 7, z: 4, labelAnchor: "br" },
    { top: "52%", left: "45%", w: "40%", rotate: -4, z: 6, labelAnchor: "bl" },
  ],
];

const MenuBookPage = ({ page, theme, onItemTap }: MenuBookPageProps) => {
  const { items, categoryName } = page;
  const count = Math.min(items.length, 5);
  const positions = LAYOUTS[count - 1] || LAYOUTS[4];

  const hasNewItem = items.some((i) => i.isNew);
  const hasFeaturedItem = items.some((i) => i.featured);

  return (
    <div className="h-full w-full relative overflow-hidden select-none" style={{ background: theme.background }}>
      {/* 3 BIG LINES — Category name with decreasing opacity */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="absolute top-4 left-0 right-0 z-10 px-3 pointer-events-none"
      >
        {[0.85, 0.35, 0.12].map((opacity, i) => (
          <p
            key={i}
            className="leading-[0.92] uppercase"
            style={{
              fontFamily: theme.headingFont,
              fontSize: "clamp(20px, 6vw, 30px)",
              color: theme.primary,
              opacity,
              letterSpacing: "0.04em",
            }}
          >
            {categoryName.toUpperCase()}
          </p>
        ))}
        <div
          className="mt-1.5 h-[2px] w-10 rounded-full"
          style={{ background: theme.primary, opacity: 0.2 }}
        />
      </motion.div>

      {/* "IT'S NEW" watermark */}
      {hasNewItem && (
        <div className="absolute top-4 right-3 z-[1] pointer-events-none">
          {[0.6, 0.3, 0.12, 0.05].map((opacity, i) => (
            <p key={i} className="leading-[0.95] uppercase text-right" style={{ fontFamily: theme.headingFont, fontSize: "clamp(12px, 3.5vw, 16px)", color: theme.primary, opacity }}>
              IT'S NEW
            </p>
          ))}
        </div>
      )}

      {/* "FEATURED" watermark */}
      {hasFeaturedItem && !hasNewItem && (
        <div className="absolute top-4 right-3 z-[1] pointer-events-none">
          {[0.5, 0.25, 0.1].map((opacity, i) => (
            <p key={i} className="leading-[0.95] uppercase text-right" style={{ fontFamily: theme.headingFont, fontSize: "clamp(10px, 3vw, 14px)", color: theme.primary, opacity }}>
              FEATURED
            </p>
          ))}
        </div>
      )}

      {/* Floating food items */}
      <div className="absolute inset-0 pt-[90px] pb-4 px-3">
        {items.slice(0, 5).map((item, idx) => {
          const pos = positions[idx];
          const img = itemImages[item.name];

          return (
            <motion.button
              key={item.name}
              onClick={() => onItemTap(idx)}
              initial={{ opacity: 0, scale: 0.5, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute active:scale-95 transition-transform touch-manipulation group"
              style={{ top: pos.top, left: pos.left, width: pos.w, zIndex: pos.z }}
            >
              <motion.div
                className="relative"
                style={{ transform: `rotate(${pos.rotate}deg)`, filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.18))" }}
                whileTap={{ scale: 0.93 }}
              >
                {img ? (
                  <img src={img} alt={item.name} loading="lazy" className="w-full aspect-square object-contain" draggable={false} />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center">
                    <span className="font-black select-none" style={{ fontFamily: theme.headingFont, fontSize: "clamp(40px, 12vw, 72px)", color: "rgba(0,0,0,0.04)" }}>
                      {item.name.charAt(0)}
                    </span>
                  </div>
                )}

                {item.tag && (() => {
                  const tagKey = item.tag === "Chef's Pick" ? "tagChefsPick" : item.tag === "Bestseller" ? "tagBestseller" : "tagPopular";
                  const tagStyle = theme[tagKey as keyof RestaurantTheme] as { bg: string; text: string };
                  return (
                    <span
                      className="absolute -top-1 -right-1 text-[7px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: tagStyle.bg,
                        color: tagStyle.text,
                        transform: `rotate(${-pos.rotate + 3}deg)`,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      {item.tag}
                    </span>
                  );
                })()}

                {item.isNew && (
                  <span
                    className="absolute -bottom-1 -left-1 text-[7px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full"
                    style={{ background: theme.tagNew.bg, color: theme.tagNew.text, transform: `rotate(${-pos.rotate - 3}deg)`, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                  >
                    NEW
                  </span>
                )}

                {item.featured && (
                  <span className="absolute -top-1 -left-1 text-[9px]" style={{ transform: `rotate(${-pos.rotate}deg)`, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.2))" }}>
                    ⭐
                  </span>
                )}
              </motion.div>

              {/* Label */}
              <div
                className="relative -mt-2"
                style={{
                  textAlign: pos.labelAnchor === "bl" || pos.labelAnchor === "tl" ? "left" : pos.labelAnchor === "br" || pos.labelAnchor === "tr" ? "right" : "center",
                  paddingLeft: pos.labelAnchor.includes("l") ? "4px" : 0,
                  paddingRight: pos.labelAnchor.includes("r") ? "4px" : 0,
                }}
              >
                <p className="leading-tight truncate" style={{ fontFamily: theme.headingFont, fontSize: "clamp(10px, 2.8vw, 13px)", color: theme.text, letterSpacing: "0.02em" }}>
                  {item.name}
                </p>
                <p className="font-black" style={{ fontSize: "clamp(11px, 3vw, 14px)", color: theme.primary, fontFamily: theme.headingFont }}>
                  ₹{item.price}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Page edge effects */}
      <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-gradient-to-l from-black/[0.06] to-transparent" />
      <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-black/[0.02]" />
    </div>
  );
};

export default MenuBookPage;
