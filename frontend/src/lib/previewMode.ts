export const PREVIEW_DASHBOARD_BASE = "/preview/dashboard";
export const PREVIEW_SCAN_BASE = "/preview/scan";
export const PREVIEW_HUB_PATH = "/preview";

export function isPreviewOnlyBuild(): boolean {
  return import.meta.env.VITE_PREVIEW_ONLY === "true";
}

/** Real staff login must never use demo mocks or a fake session. */
export function isStaffLoginPath(pathname?: string): boolean {
  const path =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return path === "/dashboard/login" || path.startsWith("/dashboard/login/");
}

export function isPreviewMode(): boolean {
  // Keep privacy strong: login always talks to the live API / username screen.
  if (isStaffLoginPath()) return false;
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

/**
 * Always points at the staff username/password screen.
 * Prefer the live CRM origin when this image is a standalone preview container.
 */
export function liveAppLoginUrl(): string {
  const origin = String(import.meta.env.VITE_LIVE_APP_ORIGIN || "")
    .trim()
    .replace(/\/+$/, "");
  if (origin) return `${origin}/dashboard/login`;
  return "/dashboard/login";
}
