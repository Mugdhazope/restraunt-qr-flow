/**
 * Dashboard / CRM API helpers. Staff auth uses DRF token from the login page
 * (stored in localStorage `kotak_api_token`) or VITE_API_TOKEN for dev scripts.
 * CSRF cookie is HTTP-only; mutating requests fetch a token from GET /api/csrf/.
 */
const TOKEN_KEY = "kotak_api_token";

function staffToken(): string | undefined {
  return import.meta.env.VITE_API_TOKEN || localStorage.getItem(TOKEN_KEY) || undefined;
}

export function setStaffToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStaffToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function handleAuthFailure(): void {
  clearStaffToken();
  const path = window.location.pathname;
  if (path.startsWith("/dashboard") && path !== "/dashboard/login") {
    const next = encodeURIComponent(`${path}${window.location.search}`);
    window.location.href = `/dashboard/login?next=${next}`;
  }
}

/** For authenticated downloads (e.g. import samples) outside `apiFetch`. */
export function getStaffToken(): string | undefined {
  return staffToken();
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** CSRF cookie is HTTP-only; fetch token from API (no cache — must match current session). */
async function resolveCsrfToken(): Promise<string | undefined> {
  const fromCookie = readCookie("csrftoken");
  if (fromCookie) return fromCookie;
  try {
    const r = await fetch("/api/csrf/", { credentials: "include" });
    if (!r.ok) return undefined;
    const d = (await r.json()) as { csrfToken?: string };
    return d.csrfToken;
  } catch {
    return undefined;
  }
}

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function nextPath(next: string | null): string | null {
  if (!next) return null;
  try {
    const u = new URL(next);
    return `${u.pathname}${u.search}`;
  } catch {
    return next.startsWith("/") ? next : null;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const tok = staffToken();
  if (tok) headers.set("Authorization", `Token ${tok}`);
  const method = (init.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrf = (await resolveCsrfToken()) ?? readCookie("csrftoken");
    if (csrf) headers.set("X-CSRFToken", csrf);
  }
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    if (
      (res.status === 401 || res.status === 403) &&
      path.startsWith("/api/") &&
      !path.startsWith("/api/auth-token/")
    ) {
      handleAuthFailure();
    }
    throw new Error(formatApiError(data, res.statusText) || `HTTP ${res.status}`);
  }
  return data as T;
}

function formatApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  if ("detail" in obj && obj.detail != null) {
    const d = obj.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map(String).join(" ");
  }
  if ("non_field_errors" in obj && Array.isArray(obj.non_field_errors)) {
    return obj.non_field_errors.map(String).join(" ");
  }
  const parts: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key === "detail" || key === "non_field_errors") continue;
    if (Array.isArray(val)) parts.push(val.map(String).join(" "));
    else if (typeof val === "string") parts.push(val);
  }
  return parts.join(" · ") || fallback;
}

export async function fetchAllPages<T>(firstPath: string): Promise<T[]> {
  const out: T[] = [];
  let path: string | null = firstPath;
  while (path) {
    const page = await apiFetch<Paginated<T>>(path);
    out.push(...page.results);
    path = nextPath(page.next);
  }
  return out;
}

// ——— Types (match DRF serializers) ———

export type ApiStaffUser = {
  username: string;
  name: string;
  url: string;
  is_staff: boolean;
};

export async function loginWithCredentials(username: string, password: string): Promise<{ token: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // Prefer CSRF when cookie/session already exist (admin visit, etc.).
  const csrf = (await resolveCsrfToken()) ?? readCookie("csrftoken");
  if (csrf) headers["X-CSRFToken"] = csrf;

  const res = await fetch("/api/auth-token/", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && data !== null && "non_field_errors" in data
        ? String((data as { non_field_errors: string[] }).non_field_errors[0])
        : data && typeof data === "object" && data !== null && "detail" in data
          ? String((data as { detail: unknown }).detail)
          : "Invalid username or password";
    throw new Error(msg);
  }
  return data as { token: string };
}

export async function fetchCurrentUser(): Promise<ApiStaffUser> {
  return apiFetch<ApiStaffUser>("/api/users/me/");
}

export async function logoutStaff(): Promise<void> {
  try {
    await apiFetch<void>("/api/auth/logout/", { method: "POST" });
  } catch {
    // Best-effort; token is cleared client-side regardless.
  }
}

export type { ScannerTagStyle, ScannerThemeOverrides } from "@/data/restaurantThemes";
import type { ScannerThemeOverrides } from "@/data/restaurantThemes";

export type ApiRestaurant = {
  id: number;
  name: string;
  slug: string;
  location: string;
  whatsapp_number: string;
  whatsapp_api_token: string;
  whatsapp_phone_number_id: string;
  whatsapp_broadcast_template_name: string;
  whatsapp_broadcast_template_language: string;
  whatsapp_otp_template_name: string;
  whatsapp_otp_template_language: string;
  whatsapp_feedback_template_name: string;
  whatsapp_feedback_template_language: string;
  sms_api_key: string;
  sms_sender_id: string;
  sms_template_id: string;
  google_review_link: string;
  google_review_prompts_sent: number;
  scanner_theme?: ScannerThemeOverrides;
};

export type DashboardSummary = {
  total_customers: number;
  total_visits: number;
  total_feedback: number;
  positive_feedback_percentage: number;
  recent_feedback: {
    id: number;
    customer: { id: number; name: string; phone: string };
    rating: number;
    message: string;
    created_at: string;
  }[];
  new_customers_this_week: number;
  campaigns_sent_count: number;
  google_review_prompts_sent: number;
  repeat_customer_rate: number;
  avg_feedback_rating: number;
};

export type DashboardAnalytics = {
  customer_growth: { month: string; customers: number }[];
  sentiment_distribution: { name: string; count: number; percentage: number; fill: string }[];
  visit_frequency_buckets: { range: string; count: number }[];
  visits_by_month: { month: string; visits: number }[];
  campaign_sends_by_month: { month: string; sent: number; opened: number | null }[];
  return_rate_by_month: { month: string; rate: number }[];
  review_generation_by_month: { month: string; reviews: number }[];
  visit_trends_weekly: { week: string; visits: number }[];
  review_funnel: {
    feedback_received: number;
    positive_feedback: number;
    review_requests_sent: number;
    google_reviews_generated: number;
  };
  repeat_customer_rate: number;
  avg_feedback_rating: number;
};

export type ApiCustomerList = {
  id: number;
  name: string;
  phone: string;
  total_visits: number;
  last_visit: string | null;
  tag: string;
  created_at: string;
};

export type ApiCustomerDetail = ApiCustomerList & {
  is_active: boolean;
  notes: string;
  visits: { id: number; visit_time: string }[];
  feedback_history: {
    id: number;
    rating: number;
    message: string;
    created_at: string;
    is_complete: boolean;
    sentiment: string;
  }[];
};

export type ApiCampaignSend = {
  id: number;
  name: string;
  target_type: string;
  message: string;
  recipient_count: number;
  sent: number;
  failed: number;
  created_at: string;
  audience: string;
  delivered: number;
  opened: number;
  responses: number;
  status: string;
  date: string;
  scheduled_for?: string | null;
};

export type ApiAutomationRule = {
  id: number;
  trigger_type: "positive_feedback" | "no_visit_14_days" | "third_visit_completed";
  enabled: boolean;
  delay_minutes: number;
  message_template: string;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiMenuItem = {
  id: number;
  category: number;
  name: string;
  description: string;
  price: string;
  tag: string;
  is_featured: boolean;
  is_new: boolean;
  is_jain: boolean;
  image_scale: number;
  image_url: string | null;
};

export type ApiMenuCategory = {
  id: number;
  restaurant: number;
  name: string;
  items: ApiMenuItem[];
};

export type PublicMenuResponse = {
  restaurant: {
    slug: string;
    name: string;
    location: string;
    google_review_link?: string;
    scanner_theme?: ScannerThemeOverrides;
  };
  categories: ApiMenuCategory[];
};

export type MessageTemplate = {
  id: number;
  restaurant: number;
  name: string;
  body: string;
  created_at: string;
};

export type TeamMember = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  restaurant: number;
};

export function dashboardSummaryUrl(slug: string) {
  return `/api/dashboard/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function dashboardAnalyticsUrl(slug: string) {
  return `/api/dashboard/analytics/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function customersUrl(slug: string, params?: Record<string, string>) {
  const q = new URLSearchParams({ restaurant_slug: slug, ...params });
  return `/api/customers/?${q}`;
}

export function customerDetailUrl(slug: string, id: number) {
  return `/api/customers/${id}/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function customersImportUrl(slug: string) {
  return `/api/customers/import/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function customersImportSampleCsvUrl(slug: string) {
  return `/api/customers/import/sample-csv/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function customersImportSampleXlsxUrl(slug: string) {
  return `/api/customers/import/sample-xlsx/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function campaignsUrl(slug: string) {
  return `/api/campaigns/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function campaignSendUrl(slug: string) {
  return `/api/campaigns/send/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function campaignResendUrl(slug: string, id: number) {
  return `/api/campaigns/${id}/resend/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function campaignDetailUrl(slug: string, id: number) {
  return `/api/campaigns/${id}/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function automationsUrl(slug: string) {
  return `/api/automations/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function automationDetailUrl(slug: string, id: number) {
  return `/api/automations/${id}/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function restaurantsListUrl() {
  return `/api/restaurants/`;
}

export function restaurantDetailUrl(slug: string) {
  return `/api/restaurants/${encodeURIComponent(slug)}/`;
}

export function messageTemplatesUrl(slug: string) {
  return `/api/message-templates/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function messageTemplateDetailUrl(slug: string, id: number) {
  return `/api/message-templates/${id}/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function teamUrl(slug: string) {
  return `/api/team/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function menuCategoriesUrl(slug: string) {
  return `/api/menu/categories/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function menuCategoryDetailUrl(slug: string, id: number) {
  return `/api/menu/categories/${id}/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function menuItemsUrl(slug: string) {
  return `/api/menu/items/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function menuItemDetailUrl(slug: string, id: number) {
  return `/api/menu/items/${id}/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function menuItemsBulkUrl(slug: string) {
  return `/api/menu/items/bulk/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function publicMenuUrl(slug: string) {
  return `/api/public/menu/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function publicLayoutsUrl(slug: string, pageKey?: string) {
  const base = `/api/public/layouts/${encodeURIComponent(slug)}/`;
  if (!pageKey) return base;
  return `${base}?page_key=${encodeURIComponent(pageKey)}`;
}

export function layoutsPagesUrl(slug: string) {
  return `/api/layouts/pages/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function layoutPageUrl(slug: string, pageKey: string) {
  return `/api/layouts/?restaurant_slug=${encodeURIComponent(slug)}&page_key=${encodeURIComponent(pageKey)}`;
}

export function layoutResetUrl(slug: string, pageKey: string) {
  return `/api/layouts/reset/?restaurant_slug=${encodeURIComponent(slug)}&page_key=${encodeURIComponent(pageKey)}`;
}

export type ApiPageLayout = {
  id?: number;
  page_key: string;
  version: number;
  schema_version: number;
  layout: Record<string, unknown>;
  updated_at?: string;
};

export type PublicLayoutsResponse = {
  restaurant_slug: string;
  pages: ApiPageLayout[];
};

export async function fetchPublicLayouts(slug: string): Promise<PublicLayoutsResponse> {
  const res = await fetch(publicLayoutsUrl(slug), { credentials: "include" });
  if (res.status === 404) {
    throw new Error("Restaurant not found");
  }
  if (!res.ok) {
    throw new Error(`Failed to load layouts (${res.status})`);
  }
  return (await res.json()) as PublicLayoutsResponse;
}

export async function fetchStaffLayout(slug: string, pageKey: string): Promise<ApiPageLayout> {
  return apiFetch<ApiPageLayout>(layoutPageUrl(slug, pageKey));
}

export async function saveStaffLayout(
  slug: string,
  pageKey: string,
  layout: Record<string, unknown>,
  expectedVersion?: number,
): Promise<ApiPageLayout> {
  return apiFetch<ApiPageLayout>(layoutPageUrl(slug, pageKey), {
    method: "PUT",
    body: JSON.stringify({
      page_key: pageKey,
      layout,
      expected_version: expectedVersion ?? null,
    }),
  });
}

export async function resetStaffLayout(slug: string, pageKey: string): Promise<ApiPageLayout> {
  return apiFetch<ApiPageLayout>(layoutResetUrl(slug, pageKey), { method: "POST" });
}

export function layoutAssetsUrl(slug: string) {
  return `/api/layouts/assets/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export async function uploadLayoutAsset(
  slug: string,
  file: File,
): Promise<{ id: number; url: string }> {
  const fd = new FormData();
  fd.append("image", file);
  return apiFetch<{ id: number; url: string }>(layoutAssetsUrl(slug), {
    method: "POST",
    body: fd,
  });
}

export function feedbackUrl(slug: string) {
  return `/api/feedback/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export function feedbackDetailUrl(slug: string, id: number) {
  return `/api/feedback/${id}/?restaurant_slug=${encodeURIComponent(slug)}`;
}

export type ApiFeedbackRow = {
  id: number;
  customer: { id: number; name: string; phone: string };
  rating: number;
  message: string;
  created_at: string;
  is_complete: boolean;
};

export async function fetchRestaurants(): Promise<ApiRestaurant[]> {
  return fetchAllPages<ApiRestaurant>(restaurantsListUrl());
}

export async function fetchPublicMenu(slug: string): Promise<PublicMenuResponse> {
  const res = await fetch(publicMenuUrl(slug), { credentials: "include" });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 404) throw new Error("Restaurant not found");
    const looksHtml = text.trimStart().startsWith("<");
    throw new Error(looksHtml ? "Menu temporarily unavailable" : text || res.statusText);
  }
  return JSON.parse(text) as PublicMenuResponse;
}

export type OtpDeliveryChannel = "sms" | "whatsapp";

export type SendOtpResponse = {
  success: boolean;
  message: string;
  existing_user?: boolean;
  customer_id?: number;
  access?: string;
  refresh?: string;
  /** Present when a visit was recorded (returning verified user on send-otp). */
  total_visits?: number;
  /** Present when ``success`` and a new OTP was sent (not returning user). */
  delivery_channel?: OtpDeliveryChannel;
};

export type ResendOtpResponse = {
  success: boolean;
  message: string;
  delivery_channel?: OtpDeliveryChannel;
};

export type VerifyOtpResponse = {
  success: boolean;
  customer_id: number;
  access: string;
  refresh: string;
  /** Count after this check-in (same as CRM ``Customer.total_visits``). */
  total_visits?: number;
};

export type CheckInResponse = {
  success: boolean;
  customer_id: number;
  access: string;
  refresh: string;
  existing_user?: boolean;
  /** Count after this check-in (same as CRM ``Customer.total_visits``). */
  total_visits?: number;
};

/** Turn DRF validation / domain errors into a single user-visible string. */
function formatPublicApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object" || data === null) {
    return fallback;
  }
  const d = data as Record<string, unknown>;
  if (typeof d.message === "string" && d.message.trim()) {
    return d.message;
  }
  const detail = d.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail)) {
    const parts = detail.map((x) => String(x)).filter(Boolean);
    if (parts.length) return parts.join(" ");
  }
  const fieldParts: string[] = [];
  for (const [key, val] of Object.entries(d)) {
    if (key === "detail" || key === "message") continue;
    if (Array.isArray(val) && val.length && val.every((x) => typeof x === "string")) {
      fieldParts.push(`${key}: ${(val as string[]).join(" ")}`);
    } else if (typeof val === "string" && val.trim()) {
      fieldParts.push(`${key}: ${val}`);
    }
  }
  if (fieldParts.length) {
    return fieldParts.join("; ");
  }
  return fallback;
}

export async function publicApiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const csrf = (await resolveCsrfToken()) ?? readCookie("csrftoken");
  if (csrf) headers.set("X-CSRFToken", csrf);
  const res = await fetch(path, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    const msg = formatPublicApiError(data, res.statusText || `HTTP ${res.status}`);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data as T;
}

export function postCheckIn(payload: { restaurant_slug: string; phone: string; name?: string }) {
  return publicApiPost<CheckInResponse>("/api/auth/check-in/", payload);
}

export function postSendOtp(payload: { restaurant_slug: string; phone: string; name?: string }) {
  return publicApiPost<SendOtpResponse>("/api/auth/send-otp/", payload);
}

export function postResendOtp(payload: { restaurant_slug: string; phone: string; name?: string }) {
  return publicApiPost<ResendOtpResponse>("/api/auth/resend-otp/", payload);
}

export function postVerifyOtp(payload: {
  restaurant_slug: string;
  phone: string;
  otp: string;
  name?: string;
}) {
  return publicApiPost<VerifyOtpResponse>("/api/auth/verify-otp/", payload);
}

const SCAN_ACCESS_KEY = "kotak_scan_access";
const SCAN_REFRESH_KEY = "kotak_scan_refresh";
const SCAN_SLUG_KEY = "kotak_scan_slug";

export function setCustomerScanSession(slug: string, access: string, refresh: string) {
  sessionStorage.setItem(SCAN_ACCESS_KEY, access);
  sessionStorage.setItem(SCAN_REFRESH_KEY, refresh);
  sessionStorage.setItem(SCAN_SLUG_KEY, slug);
}

export function clearCustomerScanSession() {
  sessionStorage.removeItem(SCAN_ACCESS_KEY);
  sessionStorage.removeItem(SCAN_REFRESH_KEY);
  sessionStorage.removeItem(SCAN_SLUG_KEY);
}

export type CampaignTargetApi =
  | "ALL"
  | "VIP"
  | "FREQUENT"
  | "INACTIVE"
  | "FIRST_TIME"
  | "NEUTRAL"
  | "INACTIVE_TAG";

const AUDIENCE_LABEL: Record<CampaignTargetApi, string> = {
  ALL: "All Customers",
  VIP: "VIP Only",
  FREQUENT: "Frequent Visitors",
  INACTIVE: "Dormant (90d+ no visit)",
  FIRST_TIME: "Tag: First Timer",
  NEUTRAL: "Tag: Neutral",
  INACTIVE_TAG: "Tag: Inactive",
};

export function campaignTargetLabel(t: string): string {
  return AUDIENCE_LABEL[t as CampaignTargetApi] || t;
}
