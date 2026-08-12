export const PREVIEW_DASHBOARD_BASE = "/preview/dashboard";
export const PREVIEW_SCAN_BASE = "/preview/scan";
export const PREVIEW_HUB_PATH = "/preview";

export function isPreviewOnlyBuild(): boolean {
  return import.meta.env.VITE_PREVIEW_ONLY === "true";
}

export function isPreviewMode(): boolean {
  if (isPreviewOnlyBuild()) return true;
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith(PREVIEW_HUB_PATH);
}

export function dashboardBasePath(): string {
  return isPreviewMode() ? PREVIEW_DASHBOARD_BASE : "/dashboard";
}

export function dashboardPath(...parts: string[]): string {
  const extra = parts.filter(Boolean);
  if (extra.length === 0) return dashboardBasePath();
  return `${dashboardBasePath()}/${extra.join("/")}`;
}

export function scanBasePath(): string {
  return isPreviewMode() ? PREVIEW_SCAN_BASE : "/scan";
}

/** Build a customer scan route, e.g. buildScanPath("dough-joe", "menu") */
export function buildScanPath(slug: string, ...parts: string[]): string {
  const segs = [scanBasePath(), slug.trim(), ...parts.filter(Boolean)];
  return segs.join("/");
}

/** Login URL for the live CRM, or null when this build has no live backend. */
export function liveAppLoginUrl(): string | null {
  const origin = String(import.meta.env.VITE_LIVE_APP_ORIGIN || "")
    .trim()
    .replace(/\/+$/, "");
  if (origin) return `${origin}/dashboard/login`;
  if (isPreviewOnlyBuild()) return null;
  return "/dashboard/login";
}
