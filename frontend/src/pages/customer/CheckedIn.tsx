import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";
import confetti from "canvas-confetti";
import { Check } from "lucide-react";
import { restaurants } from "@/data/menuData";
import { resolveScanContext } from "@/lib/scanContext";
import { useScannerTheme } from "@/lib/useScannerTheme";
import { LayoutRenderer } from "@/layouts/LayoutRenderer";
import { usePublicLayouts } from "@/layouts/usePublicLayouts";
import type { LayoutDataContext } from "@/layouts/types";

const VISIT_GOAL = 5;

const CheckedIn = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { apiSlug, menuKey } = useMemo(() => resolveScanContext(restaurantId), [restaurantId]);
  const pathSegment = restaurantId?.trim() || menuKey;
  const { customer } = useCustomer();
  const restaurant = restaurants[menuKey];
  const { theme } = useScannerTheme(apiSlug, menuKey);
  const { getLayout, loading: layoutsLoading, error: layoutsError } = usePublicLayouts(apiSlug);

  const visitCount =
    typeof customer?.totalVisits === "number" && customer.totalVisits > 0 ? customer.totalVisits : 1;
  const progressFilled = Math.min(visitCount, VISIT_GOAL);
  const progressPct = (progressFilled / VISIT_GOAL) * 100;
  const visitSummary =
    visitCount > VISIT_GOAL
      ? `${VISIT_GOAL} of ${VISIT_GOAL} visits · ${visitCount} visits total`
      : `${visitCount} of ${VISIT_GOAL} visits`;

  useEffect(() => {
    const end = Date.now() + 1500;
    const frame = () => {
      confetti({ particleCount: 2, angle: 60, speed: 55, origin: { x: 0 }, colors: ["#1a1a2e", "#ef4444", "#f59e0b"] });
      confetti({ particleCount: 2, angle: 120, speed: 55, origin: { x: 1 }, colors: ["#1a1a2e", "#ef4444", "#f59e0b"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const layoutData: LayoutDataContext = {
    restaurant: restaurant ?? null,
    restaurantName: restaurant?.name || customer?.restaurant || "Restaurant",
    tagline: restaurant?.tagline,
    theme,
    menu: restaurant?.menu ?? [],
    activeCategory: null,
    searchQuery: "",
    item: null,
    pathSegment,
    resolvedId: pathSegment,
    customerName: customer?.name,
    visitCount,
    visitGoal: VISIT_GOAL,
    navigateToMenu: () => navigate(`/scan/${pathSegment}/menu`),
  };

  if (!layoutsError && !layoutsLoading) {
    return (
      <div className="min-h-screen" style={{ background: theme.background }}>
        <LayoutRenderer document={getLayout("checked_in")} mode="live" data={layoutData} />
      </div>
    );
  }

  if (layoutsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-scale-in text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <Check size={32} className="text-success" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">You're Checked In!</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            {customer?.name ? `Welcome, ${customer.name}!` : "Welcome!"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-medium text-foreground mb-3">Loyalty Progress</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                  step <= progressFilled ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                {step <= progressFilled ? "✓" : step}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs mt-3">{visitSummary}</p>
          <div className="mt-3 w-full bg-muted rounded-full h-1.5">
            <div className="bg-foreground h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/scan/${pathSegment}/menu`)}
            className="w-full bg-foreground text-background py-3 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            View Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckedIn;
