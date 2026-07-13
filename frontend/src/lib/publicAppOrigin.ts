/**
 * Public SPA origin used in printed QR codes.
 * Prefer VITE_PUBLIC_APP_ORIGIN so QRs never bake in localhost when generated from a local dashboard.
 */
export function getPublicAppOrigin(): string {
  const fromEnv = String(import.meta.env.VITE_PUBLIC_APP_ORIGIN || "")
    .trim()
    .replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
}

export function isLocalAppOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  } catch {
    return /localhost|127\.0\.0\.1|\[::1\]/i.test(origin);
  }
}

/** Absolute QR / deep-link URL for an outlet's digital menu. */
export function buildScanMenuUrl(slug: string): string {
  const origin = getPublicAppOrigin();
  const path = `/scan/${encodeURIComponent(slug.trim())}/menu`;
  return origin ? `${origin}${path}` : path;
}
