import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";
import confetti from "canvas-confetti";
import { restaurants } from "@/data/menuData";
import { resolveScanContext } from "@/lib/scanContext";
import { useScannerTheme } from "@/lib/useScannerTheme";
import { LayoutRenderer } from "@/layouts/LayoutRenderer";
import { themeWithOutletLogo } from "@/layouts/outletLogo";
import { usePublicLayouts } from "@/layouts/usePublicLayouts";
import type { LayoutDataContext } from "@/layouts/types";

const VISIT_GOAL = 5;

const CheckedIn = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { apiSlug, menuKey } = useMemo(() => resolveScanContext(restaurantId), [restaurantId]);
  const pathSegment = restaurantId?.trim() || menuKey;
  const { customer } = useCustomer();
  const fallback = restaurants[menuKey];
  const { theme: baseTheme, restaurantName } = useScannerTheme(apiSlug, menuKey);
  const { getLayout, layouts, loading: layoutsLoading } = usePublicLayouts(apiSlug);
  const theme = useMemo(() => themeWithOutletLogo(baseTheme, layouts), [baseTheme, layouts]);

  const visitCount =
    typeof customer?.totalVisits === "number" && customer.totalVisits > 0 ? customer.totalVisits : 1;

  useEffect(() => {
    const end = Date.now() + 1500;
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        speed: 55,
        origin: { x: 0 },
        colors: ["#1a1a2e", "#ef4444", "#f59e0b"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        speed: 55,
        origin: { x: 1 },
        colors: ["#1a1a2e", "#ef4444", "#f59e0b"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const layoutData: LayoutDataContext = {
    restaurant: fallback ?? null,
    restaurantName: restaurantName || fallback?.name || customer?.restaurant || "Restaurant",
    tagline: theme.tagline || fallback?.tagline,
    theme,
    menu: fallback?.menu ?? [],
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

  if (layoutsLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.background }}
      >
        <p className="animate-pulse text-sm" style={{ color: theme.textSecondary }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "transparent" }}>
      <LayoutRenderer document={getLayout("checked_in")} mode="live" data={layoutData} />
    </div>
  );
};

export default CheckedIn;
