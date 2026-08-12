import type { Paginated } from "@/lib/api";
import {
  PREVIEW_CHECK_IN,
  PREVIEW_STAFF_USER,
  normalizePreviewSlug,
  previewAutomations,
  previewCampaigns,
  previewCustomerDetail,
  previewCustomerList,
  previewDashboardAnalytics,
  previewDashboardSummary,
  previewFeedback,
  previewMenuCategories,
  previewMessageTemplates,
  previewPageLayout,
  previewPublicLayouts,
  previewPublicMenu,
  previewRestaurant,
  previewRestaurants,
} from "@/lib/previewFixtures";

function page<T>(results: T[]): Paginated<T> {
  return { count: results.length, next: null, previous: null, results };
}

function parseUrl(path: string): { pathname: string; search: URLSearchParams } {
  const u = new URL(path, "http://preview.local");
  const pathname = u.pathname.replace(/\/+$/, "") || "/";
  return { pathname, search: u.searchParams };
}

function parseBody(init: RequestInit): Record<string, unknown> | null {
  const body = init.body;
  if (body == null || typeof body !== "string") return null;
  try {
    const parsed = JSON.parse(body) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function slugOf(search: URLSearchParams, fallback = ""): string {
  return normalizePreviewSlug(search.get("restaurant_slug") || fallback);
}

function idFrom(pathname: string, prefix: string): number | null {
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const id = Number(rest.split("/")[0]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * In-memory stand-in for Django. Reads return fixtures; writes echo success
 * without persisting (refresh restores sample data).
 */
export function handlePreviewApi(path: string, init: RequestInit = {}): unknown {
  const method = (init.method || "GET").toUpperCase();
  const { pathname, search } = parseUrl(path);
  const slug = slugOf(search);
  const body = parseBody(init);

  if (pathname === "/api/csrf") {
    return { csrfToken: "preview" };
  }

  if (pathname === "/api/auth-token" && method === "POST") {
    return { token: "preview-token" };
  }

  if (pathname === "/api/auth/logout" && method === "POST") {
    return undefined;
  }

  if (pathname === "/api/users/me") {
    return PREVIEW_STAFF_USER;
  }

  if (pathname === "/api/auth/check-in" && method === "POST") {
    return { ...PREVIEW_CHECK_IN };
  }

  if (
    (pathname === "/api/auth/send-otp" ||
      pathname === "/api/auth/resend-otp" ||
      pathname === "/api/auth/verify-otp") &&
    method === "POST"
  ) {
    return {
      success: true,
      message: "Preview OTP accepted",
      customer_id: PREVIEW_CHECK_IN.customer_id,
      access: PREVIEW_CHECK_IN.access,
      refresh: PREVIEW_CHECK_IN.refresh,
      total_visits: PREVIEW_CHECK_IN.total_visits,
      delivery_channel: "sms",
    };
  }

  if (pathname === "/api/restaurants") {
    return page(previewRestaurants());
  }

  if (pathname.startsWith("/api/restaurants/")) {
    const restSlug = decodeURIComponent(pathname.slice("/api/restaurants/".length));
    const row = previewRestaurant(restSlug);
    if (!row) return { detail: "Not found" };
    if (method === "GET") return row;
    return { ...row, ...(body ?? {}) };
  }

  if (pathname === "/api/dashboard/analytics") {
    return previewDashboardAnalytics(slug);
  }

  if (pathname === "/api/dashboard") {
    return previewDashboardSummary(slug);
  }

  if (pathname === "/api/customers/import") {
    const customers = Array.isArray(body?.customers) ? body.customers : [];
    return { created: customers.length, updated: 0, errors: [] };
  }

  const customerId = idFrom(pathname, "/api/customers/");
  if (customerId != null) {
    const detail = previewCustomerDetail(slug, customerId);
    if (!detail) return { detail: "Not found" };
    if (method === "GET") return detail;
    return { ...detail, ...(body ?? {}) };
  }

  if (pathname === "/api/customers") {
    return page(previewCustomerList(slug));
  }

  const feedbackId = idFrom(pathname, "/api/feedback/");
  if (feedbackId != null) {
    const row = previewFeedback(slug).find((f) => f.id === feedbackId);
    if (!row) return { detail: "Not found" };
    if (method === "GET") return row;
    return { ...row, ...(body ?? {}) };
  }

  if (pathname === "/api/feedback") {
    return page(previewFeedback(slug));
  }

  if (pathname === "/api/campaigns/send" && method === "POST") {
    return {
      queued: true,
      task_id: "preview-task",
      recipient_count: 12,
      name: typeof body?.name === "string" ? body.name : "Preview campaign",
      target_type: typeof body?.target_type === "string" ? body.target_type : "ALL",
    };
  }

  const campaignId = idFrom(pathname, "/api/campaigns/");
  if (campaignId != null) {
    const row = previewCampaigns(slug).find((c) => c.id === campaignId);
    if (pathname.endsWith("/resend") && method === "POST") {
      return row ?? { id: campaignId, sent: 0 };
    }
    if (method === "DELETE") return undefined;
    if (row) return { ...row, ...(body ?? {}) };
    return { detail: "Not found" };
  }

  if (pathname === "/api/campaigns") {
    return page(previewCampaigns(slug));
  }

  const automationId = idFrom(pathname, "/api/automations/");
  if (automationId != null) {
    const row = previewAutomations().find((a) => a.id === automationId);
    if (!row) return { detail: "Not found" };
    return { ...row, ...(body ?? {}) };
  }

  if (pathname === "/api/automations") {
    return page(previewAutomations());
  }

  if (pathname === "/api/menu/categories") {
    if (method === "POST") {
      const cats = previewMenuCategories(slug);
      return {
        id: Date.now(),
        restaurant: previewRestaurant(slug)?.id ?? 1,
        name: typeof body?.name === "string" ? body.name : "New category",
        items: [],
        ...((cats[0] && { restaurant: cats[0].restaurant }) || {}),
      };
    }
    return page(previewMenuCategories(slug));
  }

  const categoryId = idFrom(pathname, "/api/menu/categories/");
  if (categoryId != null) {
    const cat = previewMenuCategories(slug).find((c) => c.id === categoryId);
    if (method === "DELETE") return undefined;
    if (!cat) return { detail: "Not found" };
    return { ...cat, ...(body ?? {}) };
  }

  if (pathname === "/api/menu/items/bulk" && method === "POST") {
    return { results: [{ index: 0, ok: true, id: Date.now() }] };
  }

  if (pathname === "/api/menu/items") {
    const items = previewMenuCategories(slug).flatMap((c) => c.items);
    if (method === "POST") {
      return {
        id: Date.now(),
        category: typeof body?.category === "number" ? body.category : items[0]?.category ?? 1,
        name: typeof body?.name === "string" ? body.name : "New item",
        description: typeof body?.description === "string" ? body.description : "",
        price: typeof body?.price === "string" ? body.price : "0",
        tag: typeof body?.tag === "string" ? body.tag : "",
        is_featured: Boolean(body?.is_featured),
        is_new: Boolean(body?.is_new),
        is_jain: Boolean(body?.is_jain),
        image_scale: typeof body?.image_scale === "number" ? body.image_scale : 100,
        image_url: null,
      };
    }
    return page(items);
  }

  const itemId = idFrom(pathname, "/api/menu/items/");
  if (itemId != null) {
    const item = previewMenuCategories(slug)
      .flatMap((c) => c.items)
      .find((i) => i.id === itemId);
    if (method === "DELETE") return undefined;
    if (!item) {
      return {
        id: itemId,
        category: 1,
        name: typeof body?.name === "string" ? body.name : "Item",
        description: "",
        price: "0",
        tag: "",
        is_featured: false,
        is_new: false,
        is_jain: false,
        image_scale: 100,
        image_url: null,
        ...(body ?? {}),
      };
    }
    return { ...item, ...(body ?? {}) };
  }

  if (pathname.startsWith("/api/public/menu")) {
    return previewPublicMenu(slug);
  }

  if (pathname.startsWith("/api/public/layouts/")) {
    const rest = decodeURIComponent(pathname.slice("/api/public/layouts/".length));
    return previewPublicLayouts(rest || slug);
  }

  if (pathname === "/api/layouts/reset" && method === "POST") {
    return previewPageLayout(search.get("page_key") || "welcome");
  }

  if (pathname === "/api/layouts/assets" && method === "POST") {
    return { id: Date.now(), url: "" };
  }

  if (pathname === "/api/layouts/pages") {
    return page(previewPublicLayouts(slug).pages);
  }

  if (pathname === "/api/layouts") {
    const pageKey = search.get("page_key") || "welcome";
    if (method === "GET") return previewPageLayout(pageKey);
    const layout =
      body?.layout && typeof body.layout === "object"
        ? (body.layout as Record<string, unknown>)
        : previewPageLayout(pageKey).layout;
    const expected =
      typeof body?.expected_version === "number" ? body.expected_version : 1;
    return {
      ...previewPageLayout(pageKey),
      layout,
      version: expected + 1,
    };
  }

  const tplId = idFrom(pathname, "/api/message-templates/");
  if (tplId != null) {
    const row = previewMessageTemplates(slug).find((t) => t.id === tplId);
    if (method === "DELETE") return undefined;
    if (!row) return { detail: "Not found" };
    return { ...row, ...(body ?? {}) };
  }

  if (pathname === "/api/message-templates") {
    if (method === "POST") {
      return {
        id: Date.now(),
        restaurant: previewRestaurant(slug)?.id ?? 1,
        name: typeof body?.name === "string" ? body.name : "Template",
        body: typeof body?.body === "string" ? body.body : "",
        created_at: new Date().toISOString(),
      };
    }
    return page(previewMessageTemplates(slug));
  }

  if (pathname === "/api/team") {
    return page([]);
  }

  if (method === "DELETE" || method === "POST" || method === "PUT" || method === "PATCH") {
    return body ?? undefined;
  }

  return {};
}
