import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RestaurantConfig, MenuItem } from "@/data/menuData";
import { getTheme, RestaurantTheme } from "@/data/restaurantThemes";
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

const SECTION_LAYOUTS = ["hero-left", "collage", "hero-right", "feature-grid"] as const;

const MenuDesktop = ({ restaurant, resolvedId }: MenuDesktopProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const theme = getTheme(resolvedId);

  const [detailItem, setDetailItem] = useState<{ item: MenuItem; cat: string } | null>(null);

  const featuredItems = restaurant.menu.flatMap((cat) =>
    cat.items.filter((i) => i.featured).map((item) => ({ item, cat: cat.name }))
  );
  const newItems = restaurant.menu.flatMap((cat) =>
    cat.items.filter((i) => i.isNew).map((item) => ({ item, cat: cat.name }))
  );

  const allItems = restaurant.menu.flatMap((cat) =>
    cat.items.map((item) => ({ item, cat: cat.name }))
  );
  const currentDetailIdx = detailItem
    ? allItems.findIndex((a) => a.item.name === detailItem.item.name && a.cat === detailItem.cat)
    : -1;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-brand", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: "elastic.out(1, 0.5)", delay: 0.2 });
      gsap.fromTo(".hero-tagline-text", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.6 });
      gsap.fromTo(".hero-scroll-cue", { opacity: 0 }, { opacity: 1, delay: 1.5, duration: 0.8 });

      if (heroRef.current) {
        gsap.to(".hero-brand", { yPercent: -40, ease: "none", scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1 } });
        gsap.to(".hero-float", { yPercent: 30, ease: "none", scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1 } });
      }

      gsap.utils.toArray<HTMLElement>(".cat-section").forEach((section) => {
        const title = section.querySelector(".cat-title");
        if (title) {
          gsap.fromTo(title, { y: 80, opacity: 0, skewY: 4 }, { y: 0, opacity: 1, skewY: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none reverse" } });
        }
        const line = section.querySelector(".cat-line");
        if (line) {
          gsap.fromTo(line, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1.2, ease: "power2.out", scrollTrigger: { trigger: section, start: "top 75%", toggleActions: "play none none reverse" } });
        }
        const items = section.querySelectorAll(".menu-card");
        gsap.fromTo(items, { y: 80, opacity: 0, rotate: 3 }, { y: 0, opacity: 1, rotate: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: section, start: "top 70%", toggleActions: "play none none reverse" } });
      });

      gsap.utils.toArray<HTMLElement>(".bg-typo").forEach((el, i) => {
        gsap.to(el, { xPercent: i % 2 === 0 ? -12 : 12, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 } });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(".hero-float", { x: x * 40, y: y * 25, rotateY: x * 10, rotateX: -y * 10, duration: 1, ease: "power2.out" });
  };

  return (
    <div ref={containerRef} className="min-h-screen overflow-x-hidden" style={{ background: theme.background }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5 backdrop-blur-2xl" style={{ background: `${theme.background}b3` }}>
        <button onClick={() => navigate(`/scan/${resolvedId}/checked-in`)} className="flex items-center gap-2 transition-colors" style={{ color: theme.textSecondary }}>
          <ArrowLeft size={18} />
          <span className="text-xs tracking-[0.15em] uppercase font-bold" style={{ fontFamily: theme.serifFont }}>Back</span>
        </button>
        <h1 style={{ fontFamily: theme.headingFont, fontSize: "22px", color: theme.primary, letterSpacing: "0.04em" }}>{restaurant.name}</h1>
        <span className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ fontFamily: theme.serifFont, color: theme.textSecondary }}>Menu</span>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden" onMouseMove={handleMouseMove}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] select-none">
          {Array.from({ length: 10 }).map((_, row) => (
            <div key={row} className="whitespace-nowrap bg-typo" style={{ fontFamily: theme.headingFont, fontSize: "clamp(80px, 12vw, 180px)", lineHeight: 1.05, color: "#000", transform: `translateX(${row % 2 === 0 ? "-8%" : "12%"})` }}>
              {Array.from({ length: 5 }).map((_, col) => (<span key={col} className="mr-16">{restaurant.name.toUpperCase()}</span>))}
            </div>
          ))}
        </div>
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
              <div key={i} className="absolute hero-float" style={{ ...cssPos, width: `${size}px`, transform: `rotate(${rot}deg)`, filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.18))", opacity: 0.12 }}>
                <img src={img} alt="" className="w-full aspect-square object-contain" draggable={false} />
              </div>
            );
          })}
        </div>
        <div className="relative z-10 text-center">
          <h1 className="hero-brand leading-[0.85]" style={{ fontFamily: theme.headingFont, fontSize: "clamp(72px, 14vw, 200px)", color: theme.primary }}>{restaurant.name}</h1>
          <p className="hero-tagline-text mt-6 tracking-[0.3em] uppercase" style={{ fontFamily: theme.serifFont, fontSize: "14px", fontWeight: 400, color: theme.textSecondary, fontStyle: "italic" }}>{restaurant.tagline}</p>
          <div className="hero-scroll-cue mt-20">
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="mx-auto w-[1px] h-16 bg-gradient-to-b from-transparent via-black/15 to-transparent" />
            <p className="mt-3 text-[9px] tracking-[0.4em] uppercase" style={{ color: theme.textSecondary, fontFamily: theme.serifFont }}>Scroll to explore</p>
          </div>
        </div>
      </section>

      {/* NEW THIS WEEK */}
      {newItems.length > 0 && (
        <section className="cat-section relative py-28 lg:py-40 overflow-hidden">
          <div className="max-w-7xl mx-auto px-8 lg:px-16 mb-20">
            <div className="cat-title">
              {[1, 0.4, 0.15].map((opacity, i) => (
                <h2 key={i} className="leading-[0.92]" style={{ fontFamily: theme.headingFont, fontSize: "clamp(48px, 8vw, 100px)", color: theme.primary, opacity }}>IT'S NEW</h2>
              ))}
            </div>
            <div className="cat-line mt-5 h-[3px] rounded-full" style={{ background: `linear-gradient(to right, ${theme.primary}, transparent)`, maxWidth: "160px" }} />
            <p className="cat-subtitle mt-4 tracking-[0.15em] uppercase" style={{ fontFamily: theme.serifFont, fontSize: "12px", color: theme.textSecondary, fontStyle: "italic" }}>New this week — {newItems.length} selections</p>
          </div>
          <div className="max-w-7xl mx-auto px-8 lg:px-16">
            <div className="flex flex-wrap justify-center gap-x-16 gap-y-20 items-start">
              {newItems.map((x, i) => (
                <div key={x.item.name} className="menu-card" style={{ marginTop: i % 2 === 1 ? "50px" : "0", flex: "0 0 auto", width: i === 0 ? "340px" : "260px" }}>
                  <ItemCard item={x.item} theme={theme} onClick={() => setDetailItem(x)} size={i === 0 ? "large" : "normal"} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED */}
      {featuredItems.length > 0 && (
        <section className="cat-section relative py-28 lg:py-40 overflow-hidden">
          <div className="max-w-7xl mx-auto px-8 lg:px-16 mb-20">
            <div className="cat-title">
              {[1, 0.4, 0.15].map((opacity, i) => (
                <h2 key={i} className="leading-[0.92]" style={{ fontFamily: theme.headingFont, fontSize: "clamp(48px, 8vw, 100px)", color: theme.primary, opacity }}>FEATURED</h2>
              ))}
            </div>
            <div className="cat-line mt-5 h-[3px] rounded-full" style={{ background: `linear-gradient(to right, ${theme.primary}, transparent)`, maxWidth: "160px" }} />
            <p className="cat-subtitle mt-4 tracking-[0.15em] uppercase" style={{ fontFamily: theme.serifFont, fontSize: "12px", color: theme.textSecondary, fontStyle: "italic" }}>Our favorites — {featuredItems.length} selections</p>
          </div>
          <div className="max-w-7xl mx-auto px-8 lg:px-16">
            <div className="flex flex-wrap justify-center gap-x-16 gap-y-20 items-start">
              {featuredItems.map((x, i) => (
                <div key={x.item.name} className="menu-card" style={{ marginTop: i % 3 === 1 ? "40px" : i % 3 === 2 ? "-20px" : "0", flex: "0 0 auto", width: "280px" }}>
                  <ItemCard item={x.item} theme={theme} onClick={() => setDetailItem(x)} size="normal" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORY SECTIONS */}
      {restaurant.menu.map((cat, catIdx) => {
        const layout = SECTION_LAYOUTS[catIdx % SECTION_LAYOUTS.length];
        const isPlated = /pizza|pasta|appetizer|non veg/i.test(cat.name);

        return (
          <section key={cat.name} className="cat-section relative py-28 lg:py-40 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02] select-none">
              {Array.from({ length: 6 }).map((_, row) => (
                <div key={row} className="whitespace-nowrap bg-typo" style={{ fontFamily: theme.headingFont, fontSize: "clamp(60px, 10vw, 120px)", lineHeight: 1.1, color: "#000", transform: `translateX(${row % 2 === 0 ? "-12%" : "6%"})` }}>
                  {Array.from({ length: 8 }).map((_, col) => (<span key={col} className="mr-12">{(cat.name.split(" ").pop() || "").toUpperCase()}</span>))}
                </div>
              ))}
            </div>

            <div className="max-w-7xl mx-auto px-8 lg:px-16 mb-20">
              <div className="cat-title">
                {[1, 0.35, 0.12].map((opacity, i) => (
                  <h2 key={i} className="leading-[0.92]" style={{ fontFamily: theme.headingFont, fontSize: "clamp(40px, 6vw, 80px)", color: theme.primary, opacity }}>{cat.name.toUpperCase()}</h2>
                ))}
              </div>
              <div className="cat-line mt-5 h-[3px] rounded-full" style={{ background: `linear-gradient(to right, ${theme.primary}, transparent)`, maxWidth: "160px" }} />
              <p className="cat-subtitle mt-4 tracking-[0.15em] uppercase" style={{ fontFamily: theme.serifFont, fontSize: "12px", color: theme.textSecondary, fontStyle: "italic" }}>{cat.items.length} selections</p>
            </div>

            <div className="max-w-7xl mx-auto px-8 lg:px-16">
              {isPlated ? (
                <PlatedLayout items={cat.items} theme={theme} onItemClick={(item) => setDetailItem({ item, cat: cat.name })} />
              ) : layout === "collage" ? (
                <CollageLayout items={cat.items} theme={theme} onItemClick={(item) => setDetailItem({ item, cat: cat.name })} />
              ) : layout === "hero-left" ? (
                <HeroSideLayout items={cat.items} theme={theme} onItemClick={(item) => setDetailItem({ item, cat: cat.name })} side="left" />
              ) : layout === "hero-right" ? (
                <HeroSideLayout items={cat.items} theme={theme} onItemClick={(item) => setDetailItem({ item, cat: cat.name })} side="right" />
              ) : (
                <FeatureGridLayout items={cat.items} theme={theme} onItemClick={(item) => setDetailItem({ item, cat: cat.name })} />
              )}
            </div>
          </section>
        );
      })}

      {/* FOOTER */}
      <footer className="py-32 text-center overflow-hidden">
        <div className="opacity-[0.04]">
          <p style={{ fontFamily: theme.headingFont, fontSize: "clamp(64px, 12vw, 160px)", color: "#000", lineHeight: 0.9 }}>{restaurant.name}</p>
        </div>
        <p className="mt-6 tracking-[0.3em] uppercase" style={{ fontFamily: theme.serifFont, fontSize: "11px", color: theme.textSecondary, fontStyle: "italic" }}>{restaurant.tagline}</p>
      </footer>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {detailItem && (
          <DetailModal
            detailItem={detailItem}
            theme={theme}
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

/* ITEM CARD */
const ItemCard = ({ item, theme, onClick, size = "normal" }: { item: MenuItem; theme: RestaurantTheme; onClick: () => void; size?: "large" | "normal" | "small" }) => {
  const img = itemImages[item.name];
  const imgSize = size === "large" ? "max-w-[360px]" : size === "small" ? "max-w-[180px]" : "max-w-[260px]";
  const nameSize = size === "large" ? "text-xl" : size === "small" ? "text-sm" : "text-base";
  const priceSize = size === "large" ? "text-2xl" : size === "small" ? "text-base" : "text-lg";

  return (
    <div className="menu-card group cursor-pointer" onClick={onClick}>
      <div className={`relative mx-auto ${imgSize} transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-2`} style={{ filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.15))" }}>
        {img ? (
          <img src={img} alt={item.name} loading="lazy" className="w-full aspect-square object-contain" draggable={false} />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center">
            <span style={{ fontFamily: theme.headingFont, fontSize: size === "large" ? "100px" : "64px", color: "rgba(0,0,0,0.03)" }}>{item.name.charAt(0)}</span>
          </div>
        )}
        {item.tag && (
          <span className="absolute -top-2 -right-2 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md"
            style={{ background: item.tag === "Bestseller" ? theme.tagBestseller.bg : item.tag === "Chef's Pick" ? theme.tagChefsPick.bg : theme.tagPopular.bg, color: item.tag === "Bestseller" ? theme.tagBestseller.text : item.tag === "Chef's Pick" ? theme.tagChefsPick.text : theme.tagPopular.text, transform: "rotate(6deg)" }}>
            {item.tag}
          </span>
        )}
        {item.isNew && (
          <span className="absolute -bottom-2 -left-2 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md"
            style={{ background: theme.tagNew.bg, color: theme.tagNew.text, transform: "rotate(-4deg)" }}>NEW</span>
        )}
        {item.featured && (
          <span className="absolute -top-2 -left-2 text-sm" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.2))" }}>⭐</span>
        )}
      </div>
      <div className="mt-4 text-center">
        <p className={`${nameSize} font-bold leading-tight group-hover:tracking-wide transition-all duration-300`} style={{ fontFamily: theme.headingFont, color: theme.text }}>{item.name}</p>
        <p className={`${priceSize} font-black mt-1`} style={{ fontFamily: theme.headingFont, color: theme.primary }}>₹{item.price}</p>
        <p className="mt-2 text-xs leading-relaxed max-w-[280px] mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ color: theme.textSecondary, fontFamily: theme.serifFont, fontStyle: "italic" }}>{item.description}</p>
      </div>
    </div>
  );
};

/* PLATED LAYOUT */
const PlatedLayout = ({ items, theme, onItemClick }: { items: MenuItem[]; theme: RestaurantTheme; onItemClick: (item: MenuItem) => void }) => {
  return (
    <div className="space-y-32">
      {items.map((item, i) => {
        const img = itemImages[item.name];
        const isLeft = i % 2 === 0;
        return (
          <div key={item.name} className={`menu-card flex items-center gap-8 ${isLeft ? "flex-row" : "flex-row-reverse"} cursor-pointer group`} onClick={() => onItemClick(item)}>
            <div className={`flex-shrink-0 w-[55%] relative ${isLeft ? "-ml-[15%]" : "-mr-[15%]"}`}>
              <div className="transition-transform duration-700 group-hover:scale-105 group-hover:rotate-2" style={{ filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.2))" }}>
                {img ? (
                  <img src={img} alt={item.name} loading="lazy" className="w-full aspect-square object-contain" draggable={false} />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center">
                    <span style={{ fontFamily: theme.headingFont, fontSize: "120px", color: "rgba(0,0,0,0.03)" }}>{item.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              {item.tag && (
                <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg"
                  style={{ background: item.tag === "Bestseller" ? theme.tagBestseller.bg : item.tag === "Chef's Pick" ? theme.tagChefsPick.bg : theme.tagPopular.bg, color: item.tag === "Bestseller" ? theme.tagBestseller.text : item.tag === "Chef's Pick" ? theme.tagChefsPick.text : theme.tagPopular.text }}>
                  {item.tag}
                </span>
              )}
            </div>
            <div className={`flex-1 ${isLeft ? "text-left" : "text-right"}`}>
              <h3 className="leading-[0.95] group-hover:tracking-wide transition-all duration-500" style={{ fontFamily: theme.headingFont, fontSize: "clamp(28px, 4vw, 48px)", color: theme.text }}>{item.name.toUpperCase()}</h3>
              <p className="mt-3" style={{ fontFamily: theme.headingFont, fontSize: "clamp(24px, 3vw, 36px)", color: theme.primary }}>₹{item.price}</p>
              <p className="mt-4 leading-[1.8] max-w-[400px]" style={{ fontSize: "14px", color: theme.textSecondary, fontFamily: theme.serifFont, fontStyle: "italic", marginLeft: isLeft ? "0" : "auto", marginRight: isLeft ? "auto" : "0" }}>{item.description}</p>
              {item.isNew && <span className="inline-block mt-3 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: theme.tagNew.bg, color: theme.tagNew.text }}>NEW</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* COLLAGE */
const CollageLayout = ({ items, theme, onItemClick }: { items: MenuItem[]; theme: RestaurantTheme; onItemClick: (item: MenuItem) => void }) => {
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
            <ItemCard item={item} theme={theme} onClick={() => onItemClick(item)} size={o.size} />
          </div>
        );
      })}
    </div>
  );
};

/* HERO SIDE */
const HeroSideLayout = ({ items, theme, onItemClick, side }: { items: MenuItem[]; theme: RestaurantTheme; onItemClick: (item: MenuItem) => void; side: "left" | "right" }) => {
  const hero = items[0];
  const rest = items.slice(1);
  const heroBlock = (
    <div className="flex-1 flex items-center justify-center">
      <ItemCard item={hero} theme={theme} onClick={() => onItemClick(hero)} size="large" />
    </div>
  );
  const restBlock = (
    <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-14">
      {rest.map((item, i) => (
        <div key={item.name} style={{ marginTop: i % 2 === 1 ? "30px" : "0" }}>
          <ItemCard item={item} theme={theme} onClick={() => onItemClick(item)} size="small" />
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex flex-col lg:flex-row gap-16 items-start">
      {side === "left" ? <>{heroBlock}{restBlock}</> : <>{restBlock}{heroBlock}</>}
    </div>
  );
};

/* FEATURE GRID */
const FeatureGridLayout = ({ items, theme, onItemClick }: { items: MenuItem[]; theme: RestaurantTheme; onItemClick: (item: MenuItem) => void }) => (
  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
    {items.map((item, i) => (
      <div key={item.name} style={{ marginTop: i % 3 === 1 ? "40px" : i % 3 === 2 ? "-20px" : "0" }}>
        <ItemCard item={item} theme={theme} onClick={() => onItemClick(item)} size={i < 2 ? "large" : "normal"} />
      </div>
    ))}
  </div>
);

/* DETAIL MODAL */
const DetailModal = ({ detailItem, theme, allItems, currentDetailIdx, onClose, onNavigate }: {
  detailItem: { item: MenuItem; cat: string };
  theme: RestaurantTheme;
  allItems: { item: MenuItem; cat: string }[];
  currentDetailIdx: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
}) => {
  const img = itemImages[detailItem.item.name];
  const isPlated = /pizza|pasta|appetizer|non veg/i.test(detailItem.cat);

  const getTagStyle = (tag: string) => {
    const key = tag === "Chef's Pick" ? "tagChefsPick" : `tag${tag}`;
    const t = (theme as any)[key] || theme.tagPopular;
    return { background: t.bg, color: t.text };
  };

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

      <motion.div
        className="relative z-10 rounded-[32px] max-w-2xl w-[92vw] max-h-[90vh] overflow-y-auto"
        style={{ background: theme.background, boxShadow: "0 60px 120px rgba(0,0,0,0.35)" }}
        initial={{ scale: 0.8, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 60 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <button onClick={onClose} className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/70 transition-colors">
          <X size={16} style={{ color: theme.textSecondary }} />
        </button>

        {currentDetailIdx > 0 && (
          <button onClick={() => onNavigate(currentDetailIdx - 1)} className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/70 transition-colors">
            <ChevronLeft size={16} style={{ color: theme.textSecondary }} />
          </button>
        )}
        {currentDetailIdx < allItems.length - 1 && (
          <button onClick={() => onNavigate(currentDetailIdx + 1)} className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/70 transition-colors">
            <ChevronRight size={16} style={{ color: theme.textSecondary }} />
          </button>
        )}

        <div className="relative z-10 p-10 pt-8">
          <div className="mb-6">
            {[0.8, 0.3, 0.1].map((opacity, i) => (
              <p key={i} className="leading-[0.92] uppercase" style={{ fontFamily: theme.headingFont, fontSize: "clamp(28px, 5vw, 44px)", color: theme.primary, opacity }}>{detailItem.cat.toUpperCase()}</p>
            ))}
          </div>

          {detailItem.item.isNew && (
            <div className="absolute top-8 right-10">
              {[0.7, 0.35, 0.15, 0.06].map((opacity, i) => (
                <p key={i} className="leading-[0.95] uppercase text-right" style={{ fontFamily: theme.headingFont, fontSize: "clamp(18px, 3vw, 28px)", color: theme.primary, opacity }}>IT'S NEW</p>
              ))}
            </div>
          )}

          <motion.div
            key={detailItem.item.name}
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`mx-auto ${isPlated ? "w-[80%] max-w-[400px] -mr-[10%]" : "w-[65%] max-w-[300px]"}`}
            style={{ filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.22))" }}
          >
            {img ? (
              <img src={img} alt={detailItem.item.name} className="w-full aspect-square object-contain" draggable={false} />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center">
                <span style={{ fontFamily: theme.headingFont, fontSize: "100px", color: "rgba(0,0,0,0.03)" }}>{detailItem.item.name.charAt(0)}</span>
              </div>
            )}
          </motion.div>

          <div className="mt-8">
            <h2 className="leading-[1]" style={{ fontFamily: theme.headingFont, fontSize: "32px", color: theme.text }}>{detailItem.item.name.toUpperCase()}</h2>
            <p className="mt-3" style={{ fontFamily: theme.headingFont, fontSize: "28px", color: theme.primary }}>₹{detailItem.item.price}</p>
            <p className="mt-5 leading-[1.8] max-w-[400px]" style={{ fontSize: "14px", color: theme.textSecondary, fontFamily: theme.serifFont, fontStyle: "italic" }}>{detailItem.item.description}</p>

            <div className="flex items-center gap-3 mt-6 pb-2">
              {detailItem.item.tag && (
                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full" style={{ fontFamily: theme.headingFont, ...getTagStyle(detailItem.item.tag) }}>
                  {detailItem.item.tag === "Bestseller" ? "⭐ " : detailItem.item.tag === "Chef's Pick" ? "👨‍🍳 " : "🔥 "}{detailItem.item.tag}
                </span>
              )}
              {detailItem.item.isNew && (
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full" style={{ background: theme.tagNew.bg, color: theme.tagNew.text, fontFamily: theme.headingFont }}>✨ New</span>
              )}
              {detailItem.item.featured && (
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full" style={{ background: theme.tagFeatured.bg, color: theme.tagFeatured.text, fontFamily: theme.headingFont }}>⭐ Featured</span>
              )}
              {detailItem.item.jain && (
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full" style={{ background: theme.tagJain.bg, color: theme.tagJain.text, fontFamily: theme.headingFont }}>🌿 Jain</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuDesktop;
