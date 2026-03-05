import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { restaurants } from "@/data/menuData";
import { ArrowLeft, Star } from "lucide-react";

const Menu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const restaurant = restaurants[restaurantId || "doughandjoe"];
  const menu = restaurant?.menu || [];
  const [activeCategory, setActiveCategory] = useState(0);

  const isNest = restaurantId === "thenest";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm"
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(`/scan/${restaurantId || "doughandjoe"}/checked-in`)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground text-base">{restaurant?.name}</h1>
            <p className="text-muted-foreground text-xs">{restaurant?.tagline}</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {menu.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === i
                    ? isNest
                      ? "bg-emerald-600 text-white"
                      : "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {menu.map((category, catIdx) => (
          <div
            key={category.name}
            className={catIdx !== activeCategory ? "hidden" : ""}
          >
            <h2 className="text-lg font-bold text-foreground mb-3">{category.name}</h2>
            <div className="space-y-2">
              {category.items.map((item) => (
                <div
                  key={item.name}
                  className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                      {item.tag && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            item.tag === "Bestseller"
                              ? "bg-warning/10 text-warning"
                              : item.tag === "Chef's Pick"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.tag === "Chef's Pick" && <Star size={8} className="inline mr-0.5 -mt-px" />}
                          {item.tag}
                        </span>
                      )}
                      {item.jain && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-medium">
                          Jain
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{item.description}</p>
                  </div>
                  <span className="text-foreground font-semibold text-sm shrink-0">₹{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Loyalty reminder */}
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-sm font-medium text-foreground">🎯 Loyalty Progress: 1/5 visits</p>
          <p className="text-xs text-muted-foreground mt-1">Get 10% off your next pizza after 5 visits</p>
          <div className="mt-2 w-full bg-muted rounded-full h-1.5 max-w-xs mx-auto">
            <div className="bg-foreground h-1.5 rounded-full" style={{ width: "20%" }} />
          </div>
        </div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
};

export default Menu;
