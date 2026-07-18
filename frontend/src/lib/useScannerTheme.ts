import { useEffect, useMemo, useState } from "react";
import {
  applyScannerTheme,
  getTheme,
  type RestaurantTheme,
  type ScannerThemeOverrides,
} from "@/data/restaurantThemes";
import { fetchPublicMenu } from "@/lib/api";

/**
 * Load Appearance `scanner_theme` for a restaurant and merge onto static theme.
 * Used across Welcome / check-in / OTP / menu / layout editor so bg + tags match Settings.
 */
export function useScannerTheme(apiSlug: string, menuKey: string) {
  const baseTheme = useMemo(() => getTheme(menuKey), [menuKey]);
  const [overrides, setOverrides] = useState<ScannerThemeOverrides | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await fetchPublicMenu(apiSlug);
        if (cancelled) return;
        setOverrides(data.restaurant.scanner_theme ?? {});
        setRestaurantName(data.restaurant.name || null);
      } catch (e) {
        if (!cancelled) {
          setOverrides(null);
          setRestaurantName(null);
          setError(e instanceof Error ? e.message : "Failed to load theme");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiSlug]);

  const theme: RestaurantTheme = useMemo(
    () => applyScannerTheme(baseTheme, overrides),
    [baseTheme, overrides],
  );

  return { theme, baseTheme, overrides, setOverrides, restaurantName, loading, error };
}
