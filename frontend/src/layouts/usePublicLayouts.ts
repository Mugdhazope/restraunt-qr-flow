import { useEffect, useMemo, useState } from "react";
import { fetchPublicLayouts } from "@/lib/api";
import { defaultLayoutFor } from "./defaults";
import type { LayoutDocument, PageKey } from "./types";

export function usePublicLayouts(apiSlug: string) {
  const [layouts, setLayouts] = useState<Partial<Record<PageKey, LayoutDocument>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetchPublicLayouts(apiSlug);
        if (cancelled) return;
        const map: Partial<Record<PageKey, LayoutDocument>> = {};
        for (const page of res.pages) {
          const key = page.page_key as PageKey;
          map[key] = page.layout as unknown as LayoutDocument;
        }
        setLayouts(map);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load layouts");
          setLayouts({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiSlug]);

  const getLayout = useMemo(
    () => (pageKey: PageKey): LayoutDocument => layouts[pageKey] ?? defaultLayoutFor(pageKey),
    [layouts],
  );

  return { layouts, getLayout, loading, error };
}
