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

/**
 * Desktop: full scroll-based editorial experience.
 * GSAP parallax, scroll-triggered reveals, floating typography, hover zooms.
 */
const MenuDesktop = ({ restaurant, resolvedId }: MenuDesktopProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isNest = resolvedId === "thenest";
  const accentColor = isNest ? "#047857" : "#c41e24";

  // Detail modal state
  const [detailItem, setDetailItem] = useState<{
    item: MenuItem;
    cat: string;
  } | null>(null);

  // Flatten all items for detail navigation
  const allItems = restaurant.menu.flatMap((cat) =>
    cat.items.map((item) => ({ item, cat: cat.name }))
  );
  const currentDetailIdx = detailItem
    ? allItems.findIndex(
        (a) => a.item.name === detailItem.item.name && a.cat === detailItem.cat
      )
    : -1;

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero parallax
      if (heroRef.current) {
        gsap.to(".hero-title", {
          yPercent: -30,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
        gsap.to(".hero-tagline", {
          yPercent: -50,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "60% top",
            scrub: 1,
          },
        });
        gsap.to(".hero-bg-text", {
          yPercent: 20,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      // Category sections — staggered reveals
      gsap.utils.toArray<HTMLElement>(".cat-section").forEach((section) => {
        // Category title slide in
        const title = section.querySelector(".cat-title");
        if (title) {
          gsap.fromTo(
            title,
            { x: -80, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section,
                start: "top 80%",
                end: "top 50%",
                scrub: 1,
              },
            }
          );
        }

        // Divider line grow
        const divider = section.querySelector(".cat-divider");
        if (divider) {
          gsap.fromTo(
            divider,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: section,
                start: "top 75%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        // Items stagger reveal
        const items = section.querySelectorAll(".menu-item-card");
        gsap.fromTo(
          items,
          { y: 60, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Floating background typography parallax
      gsap.utils.toArray<HTMLElement>(".bg-typo-row").forEach((el, i) => {
        gsap.to(el, {
          xPercent: i % 2 === 0 ? -8 : 8,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Mouse parallax for hero
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(".hero-float-img", {
      x: x * 30,
      y: y * 20,
      rotateY: x * 8,
      rotateX: -y * 8,
      duration: 0.8,
      ease: "power2.out",
    });
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#f0ebe4] overflow-x-hidden"
    >
      {/* Fixed nav bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#f0ebe4]/80 backdrop-blur-xl border-b border-black/[0.04]">
        <button
          onClick={() => navigate(`/scan/${resolvedId}/checked-in`)}
          className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span
            className="text-[11px] tracking-[0.15em] uppercase"
            style={{ fontFamily: "'Georgia', serif", fontWeight: 700 }}
          >
            Back
          </span>
        </button>
        <h1
          className="tracking-[0.12em] uppercase"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "16px",
            fontWeight: 900,
            color: accentColor,
          }}
        >
          {restaurant.name}
        </h1>
        <span
          className="text-[10px] tracking-[0.15em] uppercase"
          style={{
            fontFamily: "'Georgia', serif",
            fontWeight: 700,
            color: "rgba(0,0,0,0.25)",
          }}
        >
          Menu
        </span>
      </nav>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Background typography texture */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.025]">
          {Array.from({ length: 14 }).map((_, row) => (
            <div
              key={row}
              className="whitespace-nowrap hero-bg-text bg-typo-row"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: "72px",
                fontWeight: 900,
                lineHeight: 1.1,
                color: "#000",
                letterSpacing: "0.06em",
                transform: `translateX(${row % 2 === 0 ? "-5%" : "10%"})`,
              }}
            >
              {Array.from({ length: 6 }).map((_, col) => (
                <span key={col} className="mr-10">
                  {restaurant.name.toUpperCase()}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Floating food images in hero — decorative */}
        <div className="absolute inset-0 pointer-events-none">
          {restaurant.menu.slice(0, 4).map((cat, i) => {
            const firstItem = cat.items[0];
            const img = firstItem ? itemImages[firstItem.name] : null;
            if (!img) return null;
            const positions = [
              { top: "15%", left: "5%", size: "180px", rot: -12 },
              { top: "10%", right: "8%", size: "160px", rot: 15 },
              { bottom: "18%", left: "8%", size: "140px", rot: 8 },
              { bottom: "12%", right: "5%", size: "170px", rot: -10 },
            ];
            const pos = positions[i];
            const { rot, size, ...cssPos } = pos;
            return (
              <div
                key={i}
                className="absolute hero-float-img opacity-[0.15]"
                style={{
                  ...cssPos,
                  width: size,
                  transform: `rotate(${rot}deg)`,
                  filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.2))",
                }}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full aspect-square object-contain"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="hero-title leading-[0.9]"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: "clamp(60px, 10vw, 140px)",
                fontWeight: 900,
                color: accentColor,
                letterSpacing: "-0.02em",
              }}
            >
              {restaurant.name.toUpperCase()}
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="hero-tagline mt-4 tracking-[0.2em] uppercase"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "14px",
              fontWeight: 700,
              color: "rgba(0,0,0,0.3)",
            }}
          >
            {restaurant.tagline}
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="mx-auto w-[1px] h-12 bg-gradient-to-b from-transparent via-black/20 to-transparent"
            />
            <p
              className="mt-2 text-[9px] tracking-[0.3em] uppercase"
              style={{
                color: "rgba(0,0,0,0.2)",
                fontFamily: "'Georgia', serif",
              }}
            >
              Scroll to explore
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CATEGORY SECTIONS ═══════════ */}
      {restaurant.menu.map((cat, catIdx) => {
        const isEven = catIdx % 2 === 0;
        const bgWord = cat.name.split(" ").slice(-1)[0].toUpperCase();

        return (
          <section
            key={cat.name}
            className="cat-section relative py-24 md:py-32 overflow-hidden"
          >
            {/* Background typography for this category */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
              {Array.from({ length: 8 }).map((_, row) => (
                <div
                  key={row}
                  className="whitespace-nowrap bg-typo-row"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "clamp(48px, 8vw, 96px)",
                    fontWeight: 900,
                    lineHeight: 1.15,
                    color: "#000",
                    letterSpacing: "0.05em",
                    transform: `translateX(${row % 2 === 0 ? "-10%" : "5%"})`,
                  }}
                >
                  {Array.from({ length: 8 }).map((_, col) => (
                    <span key={col} className="mr-8">
                      {bgWord}
                    </span>
                  ))}
                </div>
              ))}
            </div>

            {/* Category header */}
            <div
              className={`max-w-7xl mx-auto px-8 md:px-16 mb-16 ${
                isEven ? "text-left" : "text-right"
              }`}
            >
              <h2
                className="cat-title tracking-[0.2em] uppercase leading-none"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: "clamp(32px, 5vw, 64px)",
                  fontWeight: 900,
                  color: accentColor,
                }}
              >
                {cat.name.toUpperCase()}
              </h2>
              <div
                className="cat-divider mt-4 h-[2px] origin-left"
                style={{
                  background: `linear-gradient(${
                    isEven ? "to right" : "to left"
                  }, ${accentColor}40, transparent)`,
                  maxWidth: "200px",
                  marginLeft: isEven ? "0" : "auto",
                  marginRight: isEven ? "auto" : "0",
                }}
              />
              <p
                className="mt-3 text-[12px] tracking-[0.12em] uppercase"
                style={{
                  color: "rgba(0,0,0,0.25)",
                  fontFamily: "'Georgia', serif",
                  fontWeight: 600,
                }}
              >
                {cat.items.length} items
              </p>
            </div>

            {/* Items — editorial scattered layout */}
            <div className="max-w-7xl mx-auto px-8 md:px-16">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
                {cat.items.map((item, itemIdx) => {
                  const img = itemImages[item.name];
                  // Vary sizes based on index for editorial feel
                  const isLarge = itemIdx === 0 || itemIdx === 3;
                  const rotation =
                    ((itemIdx * 7 + catIdx * 3) % 11) - 5; // -5 to +5
                  const yOffset = ((itemIdx * 13) % 40) - 20; // -20 to +20

                  return (
                    <div
                      key={item.name}
                      className={`menu-item-card group cursor-pointer ${
                        isLarge ? "md:col-span-2 md:row-span-1" : ""
                      }`}
                      style={{ transform: `translateY(${yOffset}px)` }}
                      onClick={() =>
                        setDetailItem({ item, cat: cat.name })
                      }
                    >
                      {/* Image — floating, no container */}
                      <div
                        className="relative mx-auto transition-transform duration-500 ease-out group-hover:scale-105"
                        style={{
                          maxWidth: isLarge ? "320px" : "220px",
                          transform: `rotate(${rotation}deg)`,
                          filter:
                            "drop-shadow(0 12px 30px rgba(0,0,0,0.15))",
                        }}
                      >
                        {img ? (
                          <img
                            src={img}
                            alt={item.name}
                            loading="lazy"
                            className="w-full aspect-square object-contain transition-transform duration-700 ease-out group-hover:rotate-3"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full aspect-square flex items-center justify-center">
                            <span
                              className="select-none"
                              style={{
                                fontFamily: "'Georgia', serif",
                                fontSize: isLarge ? "80px" : "56px",
                                fontWeight: 900,
                                color: "rgba(0,0,0,0.03)",
                              }}
                            >
                              {item.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Tag */}
                        {item.tag && (
                          <span
                            className="absolute -top-2 -right-2 text-[8px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-full"
                            style={{
                              background:
                                item.tag === "Bestseller"
                                  ? "#fbbf24"
                                  : item.tag === "Chef's Pick"
                                  ? "#f43f5e"
                                  : "#3b82f6",
                              color:
                                item.tag === "Bestseller"
                                  ? "#78350f"
                                  : "#fff",
                              transform: `rotate(${-rotation + 4}deg)`,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                            }}
                          >
                            {item.tag}
                          </span>
                        )}
                      </div>

                      {/* Label — editorial typography */}
                      <div className="mt-3 text-center">
                        <p
                          className="leading-tight group-hover:tracking-[0.04em] transition-all duration-300"
                          style={{
                            fontFamily: "'Georgia', serif",
                            fontWeight: 900,
                            fontSize: isLarge ? "16px" : "13px",
                            color: "rgba(0,0,0,0.75)",
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="mt-1 font-black"
                          style={{
                            fontFamily: "'Georgia', serif",
                            fontSize: isLarge ? "18px" : "14px",
                            color: accentColor,
                          }}
                        >
                          ₹{item.price}
                        </p>
                        <p
                          className="mt-1 text-[11px] leading-relaxed max-w-[240px] mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{ color: "rgba(0,0,0,0.35)" }}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Separator */}
            {catIdx < restaurant.menu.length - 1 && (
              <div className="max-w-7xl mx-auto px-16 mt-24">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
              </div>
            )}
          </section>
        );
      })}

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="py-24 text-center">
        <div className="opacity-[0.03]">
          <p
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(48px, 8vw, 100px)",
              fontWeight: 900,
              color: "#000",
              lineHeight: 1,
            }}
          >
            {restaurant.name.toUpperCase()}
          </p>
        </div>
        <p
          className="mt-4 tracking-[0.25em] uppercase"
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "10px",
            fontWeight: 700,
            color: "rgba(0,0,0,0.2)",
          }}
        >
          {restaurant.tagline}
        </p>
      </footer>

      {/* ═══════════ DETAIL MODAL ═══════════ */}
      <AnimatePresence>
        {detailItem && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDetailItem(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal content */}
            <motion.div
              className="relative z-10 bg-[#f0ebe4] rounded-3xl max-w-lg w-[90vw] max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                boxShadow: "0 40px 80px rgba(0,0,0,0.25)",
              }}
            >
              {/* Typography background inside modal */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl opacity-[0.02]">
                {Array.from({ length: 12 }).map((_, row) => (
                  <div
                    key={row}
                    className="whitespace-nowrap"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "32px",
                      fontWeight: 900,
                      lineHeight: 1.15,
                      color: "#000",
                      transform: `translateX(${row % 2 === 0 ? "-5%" : "8%"})`,
                    }}
                  >
                    {Array.from({ length: 8 }).map((_, col) => (
                      <span key={col} className="mr-4">
                        {detailItem.cat
                          .split(" ")
                          .slice(-1)[0]
                          .toUpperCase()}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={() => setDetailItem(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center hover:bg-white/80 transition-colors"
              >
                <X size={14} className="text-foreground/60" />
              </button>

              {/* Prev / Next buttons */}
              {currentDetailIdx > 0 && (
                <button
                  onClick={() => {
                    const prev = allItems[currentDetailIdx - 1];
                    setDetailItem({ item: prev.item, cat: prev.cat });
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center hover:bg-white/80 transition-colors"
                >
                  <ChevronLeft size={14} className="text-foreground/60" />
                </button>
              )}
              {currentDetailIdx < allItems.length - 1 && (
                <button
                  onClick={() => {
                    const next = allItems[currentDetailIdx + 1];
                    setDetailItem({ item: next.item, cat: next.cat });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center hover:bg-white/80 transition-colors"
                >
                  <ChevronRight size={14} className="text-foreground/60" />
                </button>
              )}

              <div className="relative z-10 p-8 pt-6">
                {/* Image */}
                <motion.div
                  key={detailItem.item.name}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="mx-auto w-[55%] max-w-[240px]"
                  style={{
                    filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.2))",
                  }}
                >
                  {itemImages[detailItem.item.name] ? (
                    <img
                      src={itemImages[detailItem.item.name]}
                      alt={detailItem.item.name}
                      className="w-full aspect-square object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center">
                      <span
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "80px",
                          fontWeight: 900,
                          color: "rgba(0,0,0,0.03)",
                        }}
                      >
                        {detailItem.item.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Text */}
                <div className="text-center mt-6">
                  <p
                    className="tracking-[0.2em] uppercase"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "rgba(0,0,0,0.3)",
                    }}
                  >
                    {detailItem.cat}
                  </p>
                  <h2
                    className="mt-2 leading-[1.05]"
                    style={{
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: "28px",
                      fontWeight: 900,
                      color: "rgba(0,0,0,0.85)",
                    }}
                  >
                    {detailItem.item.name.toUpperCase()}
                  </h2>
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "24px",
                      fontWeight: 900,
                      color: accentColor,
                    }}
                  >
                    ₹{detailItem.item.price}
                  </p>
                  <p
                    className="mt-4 leading-[1.7] font-light max-w-[360px] mx-auto"
                    style={{
                      fontSize: "14px",
                      color: "rgba(0,0,0,0.4)",
                    }}
                  >
                    {detailItem.item.description}
                  </p>

                  {/* Tags */}
                  <div className="flex items-center justify-center gap-3 mt-5 pb-2">
                    {detailItem.item.tag && (
                      <span
                        className="text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full"
                        style={{
                          background:
                            detailItem.item.tag === "Bestseller"
                              ? "#fef3c7"
                              : detailItem.item.tag === "Chef's Pick"
                              ? "#fce7f3"
                              : "#dbeafe",
                          color:
                            detailItem.item.tag === "Bestseller"
                              ? "#92400e"
                              : detailItem.item.tag === "Chef's Pick"
                              ? "#9d174d"
                              : "#1e40af",
                        }}
                      >
                        {detailItem.item.tag === "Bestseller"
                          ? "⭐ "
                          : detailItem.item.tag === "Chef's Pick"
                          ? "👨‍🍳 "
                          : "🔥 "}
                        {detailItem.item.tag}
                      </span>
                    )}
                    {detailItem.item.jain && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full"
                        style={{
                          background: "#d1fae5",
                          color: "#065f46",
                        }}
                      >
                        🌿 Jain Available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuDesktop;
