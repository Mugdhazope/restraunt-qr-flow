import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { menuCategories } from "@/data/menuData";
import { ChevronDown } from "lucide-react";

const Reward = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ["#E10600", "#FFF6EA", "#1F4AE0"];
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen bg-background checker-bg flex flex-col items-center p-4 pt-12 pb-20">
      {/* Reward Card */}
      <div className="bg-card rounded-3xl shadow-card p-8 max-w-sm w-full animate-scale-in text-center">
        <span className="text-6xl block mb-4">🎉</span>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">You've unlocked</h2>

        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 my-5">
          <span className="text-5xl block mb-3">🍪</span>
          <h3 className="text-xl font-bold text-foreground">Free Cookie</h3>
          <p className="text-muted-foreground text-sm mt-1">Valid for 5 days</p>
        </div>

        <p className="text-muted-foreground text-xs mb-5">Check WhatsApp for confirmation ✅</p>
      </div>

      {/* Next Visit Incentive */}
      <div
        className="bg-card rounded-3xl shadow-card p-6 max-w-sm w-full mt-5 text-center animate-fade-in border-2 border-secondary/20"
        style={{ animationDelay: "0.3s" }}
      >
        <span className="text-4xl block mb-2">🔥</span>
        <h3 className="text-lg font-extrabold text-foreground">Come back & earn more!</h3>
        <p className="text-muted-foreground text-sm mt-1 mb-4">
          Your next visit unlocks <span className="font-bold text-secondary">10% off</span> any pizza!
        </p>
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step === 1 ? "✓" : step}
              </div>
              {step < 5 && (
                <div className="w-0.5 h-0 hidden" />
              )}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-[11px] mt-3">1 of 5 visits complete — keep going! 🚀</p>
      </div>

      {/* Browse Menu CTA */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full text-base hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 animate-fade-in"
        style={{ animationDelay: "0.5s" }}
      >
        {showMenu ? "Hide Menu" : "Browse Our Menu 🍕"}
        <ChevronDown size={18} className={`transition-transform duration-300 ${showMenu ? "rotate-180" : ""}`} />
      </button>

      {/* Full Menu */}
      {showMenu && (
        <div className="w-full max-w-lg mt-6 animate-fade-in">
          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {menuCategories.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeCategory === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground border border-border hover:bg-primary/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="space-y-3">
            {menuCategories[activeCategory].items.map((item, i) => (
              <div
                key={item.name}
                className="bg-card rounded-2xl shadow-soft p-4 flex items-start justify-between gap-3 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                    {item.tag && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.tag === "Bestseller"
                            ? "bg-primary/10 text-primary"
                            : item.tag === "Chef's Pick"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">{item.description}</p>
                </div>
                <p className="font-extrabold text-foreground text-sm whitespace-nowrap">₹{item.price}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <p className="text-muted-foreground text-sm mb-4">Can't wait to see you! 🍕❤️</p>
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Done — See You Soon! 👋
            </button>
          </div>
        </div>
      )}

      {/* If menu not shown, still show a done button */}
      {!showMenu && (
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground transition-colors animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          Skip — See You Soon! 👋
        </button>
      )}
    </div>
  );
};

export default Reward;
