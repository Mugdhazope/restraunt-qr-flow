import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RestaurantConfig, MenuItem } from "@/data/menuData";
import { itemImages, categoryImages } from "./menuImages";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface MenuDesktopProps {
  restaurant: RestaurantConfig;
  resolvedId: string;
}

const BRAND_FONT = "'Righteous', cursive";
const SERIF_FONT = "'Playfair Display', 'Georgia', serif";

/* Alternating editorial layouts for category sections */
const SECTION_LAYOUTS = [
  // Layout A: hero image left, items right in staggered column
  "hero-left",
  // Layout B: full-width scattered collage
  "collage",
  // Layout C: hero image right, items left
  "hero-right",
  // Layout D: big grid, 2 large + rest small
  "feature-grid",
] as const;

const MenuDesktop = ({ restaurant, resolvedId }: MenuDesktopProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isNest = resolvedId === "thenest";
  const accentColor = isNest ? "#047857" : "#c41e24";

  const [detailItem, setDetailItem] = useState<{
    item: MenuItem;
    cat: string;
  } | null>(null);

  const allItems = restaurant.menu.flatMap((cat) =>
    cat.items.map((item) => ({ item, cat: cat.name }))
  );
  const currentDetailIdx = detailItem
    ? allItems.findIndex(
        (a) => a.item.name === detailItem.item.name && a.cat === detailItem.cat
      )
    : -1;

  /* ═══ GSAP ANIMATIONS ═══ */
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.fromTo(
        ".hero-brand",
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.4, ease: "elastic.out(1, 0.5)", delay: 0.2 }
      );
      gsap.fromTo(
        ".hero-tagline-text",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.6 }
      );
      gsap.fromTo(
        ".hero-scroll-cue",
        { opacity: 0 },
        { opacity: 1, delay: 1.5, duration: 0.8 }
      );

      // Hero parallax on scroll
      if (heroRef.current) {
        gsap.to(".hero-brand", {
          yPercent: -40,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1 },
        });
        gsap.to(".hero-float", {
          yPercent: 30,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1 },
        });
      }

      // Category sections
      gsap.utils.toArray<HTMLElement>(".cat-section").forEach((section) => {
        const title = section.querySelector(".cat-title");
        if (title) {
          gsap.fromTo(title, { y: 80, opacity: 0, skewY: 4 }, {
            y: 0, opacity: 1, skewY: 0, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none reverse" },
          });
        }
        const subtitle = section.querySelector(".cat-subtitle");
        if (subtitle) {
          gsap.fromTo(subtitle, { y: 30, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.15,
            scrollTrigger: { trigger: section, start: "top 80%", toggleActions: "play none none reverse" },
          });
        }
        const line = section.querySelector(".cat-line");
        if (line) {
          gsap.fromTo(line, { scaleX: 0, transformOrigin: "left center" }, {
            scaleX: 1, duration: 1.2, ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 75%", toggleActions: "play none none reverse" },
          });
        }
        const items = section.querySelectorAll(".menu-card");
        gsap.fromTo(items, { y: 80, opacity: 0, rotate: 3 }, {
          y: 0, opacity: 1, rotate: 0, duration: 0.9, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: section, start: "top 70%", toggleActions: "play none none reverse" },
        });
      });

      // Background text rows parallax
      gsap.utils.toArray<HTMLElement>(".bg-typo").forEach((el, i) => {
        gsap.to(el, {
          xPercent: i % 2 === 0 ? -12 : 12,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Mouse parallax hero
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(".hero-float", {
      x: x * 40, y: y * 25, rotateY: x * 10, rotateX: -y * 10,
      duration: 1, ease: "power2.out",
    });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f0ebe4] overflow-x-hidden">
      {/* ═══ FIXED NAV ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5 bg-[#f0ebe4]/70 backdrop-blur-2xl">
        <button
          onClick={() => navigate(`/scan/${resolvedId}/checked-in`)}
          className="flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-xs tracking-[0.15em] uppercase font-bold" style={{ fontFamily: SERIF_FONT }}>
            Back
          </span>
        </button>
        <h1
          style={{ fontFamily: BRAND_FONT, fontSize: "22px", color: accentColor, letterSpacing: "0.04em" }}
        >
          {restaurant.name}
        </h1>
        <span
          className="text-[10px] tracking-[0.2em] uppercase font-bold"
          style={{ fontFamily: SERIF_FONT, color: "rgba(0,0,0,0.2)" }}
        >
          Menu
        </span>
      </nav>

      {/* ═══ HERO ═══ */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Background typography */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] select-none">
          {Array.from({ length: 10 }).map((_, row) => (
            <div
              key={row}
              className="whitespace-nowrap bg-typo"
              style={{
                fontFamily: BRAND_FONT,
                fontSize: "clamp(80px, 12vw, 180px)",
                lineHeight: 1.05,
                color: "#000",
                transform: `translateX(${row % 2 === 0 ? "-8%" : "12%"})`,
              }}
            >
              {Array.from({ length: 5 }).map((_, col) => (
                <span key={col} className="mr-16">
                  {restaurant.name.toUpperCase()}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Floating food decorations */}
        <div className="absolute inset-0 pointer-events-none">
          {restaurant.menu.slice(0, 5).map((cat, i) => {
            const firstItem = cat.items[0];
            const img = firstItem ? itemImages[firstItem.name] : null;
            if (!img) return null;
            const positions = [
              { top: "8%", left: "4%", size: 240, rot: -15 },
              { top: "6%", right: "6%", size: 200, rot: 12 },
              { bottom: "14%", left: "6%", size: 180, rot: 8 },
              { bottom: "8%", right: "4%", size: 220, rot: -8 },
              { top: "40%", left: "82%", size: 160, rot: 20 },
            ];
            const pos = positions[i];
            const { rot, size, ...cssPos } = pos;
            return (
              <div
                key={i}
                className="absolute hero-float"
                style={{
                  ...cssPos,
                  width: `${size}px`,
                  transform: `rotate(${rot}deg)`,
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.18))",
                  opacity: 0.12,
                }}
              >
                <img src={img} alt="" className="w-full aspect-square object-contain" draggable={false} />
              </div>
            );
          })}
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center">
          <h1
            className="hero-brand leading-[0.85]"
            style={{
              fontFamily: BRAND_FONT,
              fontSize: "clamp(72px, 14vw, 200px)",
              color: accentColor,
            }}
          >
            {restaurant.name}
          </h1>
          <p
            className="hero-tagline-text mt-6 tracking-[0.3em] uppercase"
            style={{
              fontFamily: SERIF_FONT,
              fontSize: "14px",
              fontWeight: 400,
              color: "rgba(0,0,0,0.3)",
              fontStyle: "italic",
            }}
          >
            {restaurant.tagline}
          </p>

          {/* Scroll cue */}
          <div className="hero-scroll-cue mt-20">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="mx-auto w-[1px] h-16 bg-gradient-to-b from-transparent via-black/15 to-transparent"
            />
            <p
              className="mt-3 text-[9px] tracking-[0.4em] uppercase"
              style={{ color: "rgba(0,0,0,0.15)", fontFamily: SERIF_FONT }}
            >
              Scroll to explore
            </p>
          </div>
        </div>
      </section>

      {/* ═══ CATEGORY SECTIONS ═══ */}
      {restaurant.menu.map((cat, catIdx) => {
        const layout = SECTION_LAYOUTS[catIdx % SECTION_LAYOUTS.length];
        const bgWord = cat.name.split(" ").pop()?.toUpperCase() || "";

        return (
          <section key={cat.name} className="cat-section relative py-28 lg:py-40 overflow-hidden">
            {/* Background typography */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02] select-none">
              {Array.from({ length: 6 }).map((_, row) => (
                <div
                  key={row}
                  className="whitespace-nowrap bg-typo"
                  style={{
                    fontFamily: BRAND_FONT,
                    fontSize: "clamp(60px, 10vw, 120px)",
                    lineHeight: 1.1,
                    color: "#000",
                    transform: `translateX(${row % 2 === 0 ? "-12%" : "6%"})`,
                  }}
                >
                  {Array.from({ length: 8 }).map((_, col) => (
                    <span key={col} className="mr-12">{bgWord}</span>
                  ))}
                </div>
              ))}
            </div>

            {/* Category header */}
            <div className="max-w-7xl mx-auto px-8 lg:px-16 mb-20">
              <h2
                className="cat-title"
                style={{
                  fontFamily: BRAND_FONT,
                  fontSize: "clamp(40px, 6vw, 80px)",
                  color: accentColor,
                  lineHeight: 1,
                }}
              >
                {cat.name}
              </h2>
              <div
                className="cat-line mt-5 h-[3px] rounded-full"
                style={{
                  background: `linear-gradient(to right, ${accentColor}, transparent)`,
                  maxWidth: "160px",
                }}
              />
              <p
                className="cat-subtitle mt-4 tracking-[0.15em] uppercase"
                style={{
                  fontFamily: SERIF_FONT,
                  fontSize: "12px",
                  color: "rgba(0,0,0,0.25)",
                  fontStyle: "italic",
                }}
              >
                {cat.items.length} selections
              </p>
            </div>

            {/* Items — different layouts */}
            <div className="max-w-7xl mx-auto px-8 lg:px-16">
              {layout === "collage" ? (
                <CollageLayout items={cat.items} accentColor={accentColor} onItemClick={(item) => setDetailItem({ item, cat: cat.name })} catIdx={catIdx} />
              ) : layout === "hero-left" ? (
                <HeroSideLayout items={cat.items} accentColor={accentColor} onItemClick={(item) => setDetailItem({ item, cat: cat.name })} side="left" />
              ) : layout === "hero-right" ? (
                <HeroSideLayout items={cat.items} accentColor={accentColor} onItemClick={(item) => setDetailItem({ item, cat: cat.name })} side="right" />
              ) : (
                <FeatureGridLayout items={cat.items} accentColor={accentColor} onItemClick={(item) => setDetailItem({ item, cat: cat.name })} />
              )}
            </div>
          </section>
        );
      })}

      {/* ═══ FOOTER ═══ */}
      <footer className="py-32 text-center overflow-hidden">
        <div className="opacity-[0.04]">
          <p style={{ fontFamily: BRAND_FONT, fontSize: "clamp(64px, 12vw, 160px)", color: "#000", lineHeight: 0.9 }}>
            {restaurant.name}
          </p>
        </div>
        <p
          className="mt-6 tracking-[0.3em] uppercase"
          style={{ fontFamily: SERIF_FONT, fontSize: "11px", color: "rgba(0,0,0,0.15)", fontStyle: "italic" }}
        >
          {restaurant.tagline}
        </p>
      </footer>

      {/* ═══ DETAIL MODAL ═══ */}
      <AnimatePresence>
        {detailItem && (
          <DetailModal
            detailItem={detailItem}
            accentColor={accentColor}
            allItems={allItems}
            currentDetailIdx={currentDetailIdx}
            onClose={() => setDetailItem(null)}
            onNavigate={(idx) => setDetailItem(allItems[idx])}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   LAYOUT COMPONENTS
   ═══════════════════════════════════════════════ */

/** Item card used across layouts */
const ItemCard = ({
  item,
  accentColor,
  onClick,
  size = "normal",
}: {
  item: MenuItem;
  accentColor: string;
  onClick: () => void;
  size?: "large" | "normal" | "small";
}) => {
  const img = itemImages[item.name];
  const imgSize = size === "large" ? "max-w-[360px]" : size === "small" ? "max-w-[180px]" : "max-w-[260px]";
  const nameSize = size === "large" ? "text-xl" : size === "small" ? "text-sm" : "text-base";
  const priceSize = size === "large" ? "text-2xl" : size === "small" ? "text-base" : "text-lg";

  return (
    <div className="menu-card group cursor-pointer" onClick={onClick}>
      <div
        className={`relative mx-auto ${imgSize} transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-2`}
        style={{ filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.15))" }}
      >
        {img ? (
          <img src={img} alt={item.name} loading="lazy" className="w-full aspect-square object-contain" draggable={false} />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center">
            <span style={{ fontFamily: BRAND_FONT, fontSize: size === "large" ? "100px" : "64px", color: "rgba(0,0,0,0.03)" }}>
              {item.name.charAt(0)}
            </span>
          </div>
        )}
        {item.tag && (
          <span
            className="absolute -top-2 -right-2 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md"
            style={{
              background: item.tag === "Bestseller" ? "#fbbf24" : item.tag === "Chef's Pick" ? "#f43f5e" : "#3b82f6",
              color: item.tag === "Bestseller" ? "#78350f" : "#fff",
              transform: "rotate(6deg)",
            }}
          >
            {item.tag}
          </span>
        )}
      </div>
      <div className="mt-4 text-center">
        <p className={`${nameSize} font-bold leading-tight group-hover:tracking-wide transition-all duration-300`} style={{ fontFamily: BRAND_FONT, color: "rgba(0,0,0,0.8)" }}>
          {item.name}
        </p>
        <p className={`${priceSize} font-black mt-1`} style={{ fontFamily: BRAND_FONT, color: accentColor }}>
          ₹{item.price}
        </p>
        <p
          className="mt-2 text-xs leading-relaxed max-w-[280px] mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ color: "rgba(0,0,0,0.35)", fontFamily: SERIF_FONT, fontStyle: "italic" }}
        >
          {item.description}
        </p>
      </div>
    </div>
  );
};

/** Collage: scattered asymmetric layout */
const CollageLayout = ({
  items,
  accentColor,
  onItemClick,
  catIdx,
}: {
  items: MenuItem[];
  accentColor: string;
  onItemClick: (item: MenuItem) => void;
  catIdx: number;
}) => {
  // Predefined offsets for editorial feel
  const offsets = [
    { marginTop: "0px", size: "large" as const },
    { marginTop: "60px", size: "normal" as const },
    { marginTop: "-20px", size: "normal" as const },
    { marginTop: "40px", size: "small" as const },
    { marginTop: "10px", size: "normal" as const },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-x-12 gap-y-16 items-start">
      {items.map((item, i) => {
        const o = offsets[i % offsets.length];
        return (
          <div key={item.name} style={{ marginTop: o.marginTop, flex: "0 0 auto", width: o.size === "large" ? "300px" : o.size === "small" ? "180px" : "240px" }}>
            <ItemCard item={item} accentColor={accentColor} onClick={() => onItemClick(item)} size={o.size} />
          </div>
        );
      })}
    </div>
  );
};

/** Hero side: one big item on the side, rest stacked on the other */
const HeroSideLayout = ({
  items,
  accentColor,
  onItemClick,
  side,
}: {
  items: MenuItem[];
  accentColor: string;
  onItemClick: (item: MenuItem) => void;
  side: "left" | "right";
}) => {
  const hero = items[0];
  const rest = items.slice(1);

  const heroBlock = (
    <div className="flex-1 flex items-center justify-center">
      <ItemCard item={hero} accentColor={accentColor} onClick={() => onItemClick(hero)} size="large" />
    </div>
  );
  const restBlock = (
    <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-14">
      {rest.map((item, i) => (
        <div key={item.name} style={{ marginTop: i % 2 === 1 ? "30px" : "0" }}>
          <ItemCard item={item} accentColor={accentColor} onClick={() => onItemClick(item)} size="small" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-16 items-start">
      {side === "left" ? (
        <>{heroBlock}{restBlock}</>
      ) : (
        <>{restBlock}{heroBlock}</>
      )}
    </div>
  );
};

/** Feature grid: first 2 large, rest normal */
const FeatureGridLayout = ({
  items,
  accentColor,
  onItemClick,
}: {
  items: MenuItem[];
  accentColor: string;
  onItemClick: (item: MenuItem) => void;
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
      {items.map((item, i) => {
        const isFeature = i < 2;
        return (
          <div key={item.name} className={isFeature ? "lg:col-span-1" : ""} style={{ marginTop: i % 3 === 1 ? "40px" : i % 3 === 2 ? "-20px" : "0" }}>
            <ItemCard item={item} accentColor={accentColor} onClick={() => onItemClick(item)} size={isFeature ? "large" : "normal"} />
          </div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════════════ */

const DetailModal = ({
  detailItem,
  accentColor,
  allItems,
  currentDetailIdx,
  onClose,
  onNavigate,
}: {
  detailItem: { item: MenuItem; cat: string };
  accentColor: string;
  allItems: { item: MenuItem; cat: string }[];
  currentDetailIdx: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
}) => {
  const img = itemImages[detailItem.item.name];
  const bgWord = detailItem.cat.split(" ").pop()?.toUpperCase() || "";

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="relative z-10 bg-[#f0ebe4] rounded-[32px] max-w-xl w-[92vw] max-h-[88vh] overflow-y-auto"
        initial={{ scale: 0.8, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 60 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ boxShadow: "0 60px 120px rgba(0,0,0,0.35)" }}
      >
        {/* Background texture */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[32px] opacity-[0.02] select-none">
          {Array.from({ length: 10 }).map((_, row) => (
            <div
              key={row}
              className="whitespace-nowrap"
              style={{
                fontFamily: BRAND_FONT,
                fontSize: "36px",
                lineHeight: 1.15,
                color: "#000",
                transform: `translateX(${row % 2 === 0 ? "-5%" : "8%"})`,
              }}
            >
              {Array.from({ length: 8 }).map((_, col) => (
                <span key={col} className="mr-5">{bgWord}</span>
              ))}
            </div>
          ))}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/70 transition-colors"
        >
          <X size={16} className="text-foreground/60" />
        </button>

        {/* Prev / Next */}
        {currentDetailIdx > 0 && (
          <button
            onClick={() => onNavigate(currentDetailIdx - 1)}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/70 transition-colors"
          >
            <ChevronLeft size={16} className="text-foreground/60" />
          </button>
        )}
        {currentDetailIdx < allItems.length - 1 && (
          <button
            onClick={() => onNavigate(currentDetailIdx + 1)}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/70 transition-colors"
          >
            <ChevronRight size={16} className="text-foreground/60" />
          </button>
        )}

        <div className="relative z-10 p-10 pt-8">
          {/* Image */}
          <motion.div
            key={detailItem.item.name}
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-[65%] max-w-[300px]"
            style={{ filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.22))" }}
          >
            {img ? (
              <img src={img} alt={detailItem.item.name} className="w-full aspect-square object-contain" draggable={false} />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center">
                <span style={{ fontFamily: BRAND_FONT, fontSize: "100px", color: "rgba(0,0,0,0.03)" }}>
                  {detailItem.item.name.charAt(0)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Text */}
          <div className="text-center mt-8">
            <p
              className="tracking-[0.2em] uppercase"
              style={{ fontFamily: SERIF_FONT, fontSize: "11px", color: "rgba(0,0,0,0.25)", fontStyle: "italic" }}
            >
              {detailItem.cat}
            </p>
            <h2 className="mt-3 leading-[1]" style={{ fontFamily: BRAND_FONT, fontSize: "32px", color: "rgba(0,0,0,0.85)" }}>
              {detailItem.item.name}
            </h2>
            <p className="mt-3" style={{ fontFamily: BRAND_FONT, fontSize: "28px", color: accentColor }}>
              ₹{detailItem.item.price}
            </p>
            <p
              className="mt-5 leading-[1.8] max-w-[400px] mx-auto"
              style={{ fontSize: "14px", color: "rgba(0,0,0,0.4)", fontFamily: SERIF_FONT, fontStyle: "italic" }}
            >
              {detailItem.item.description}
            </p>

            {/* Tags */}
            <div className="flex items-center justify-center gap-3 mt-6 pb-2">
              {detailItem.item.tag && (
                <span
                  className="text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full"
                  style={{
                    background: detailItem.item.tag === "Bestseller" ? "#fef3c7" : detailItem.item.tag === "Chef's Pick" ? "#fce7f3" : "#dbeafe",
                    color: detailItem.item.tag === "Bestseller" ? "#92400e" : detailItem.item.tag === "Chef's Pick" ? "#9d174d" : "#1e40af",
                    fontFamily: BRAND_FONT,
                  }}
                >
                  {detailItem.item.tag === "Bestseller" ? "⭐ " : detailItem.item.tag === "Chef's Pick" ? "👨‍🍳 " : "🔥 "}
                  {detailItem.item.tag}
                </span>
              )}
              {detailItem.item.jain && (
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full"
                  style={{ background: "#d1fae5", color: "#065f46", fontFamily: BRAND_FONT }}
                >
                  🌿 Jain Available
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuDesktop;
