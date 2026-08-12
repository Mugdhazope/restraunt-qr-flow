import {
  analyticsData,
  automationRules,
  campaignStats,
  customerGrowthData,
  dashboardStats,
  feedbackSentimentData,
  mockCustomers,
  mockFeedback,
  outlets,
  reviewFunnelStats,
  visitFrequencyData,
} from "@/data/mockData";
import { restaurants } from "@/data/menuData";
import { DEFAULT_RESTAURANT_SLUG } from "@/lib/defaultRestaurantSlug";
import { defaultLayoutFor, PAGE_KEYS, SCHEMA_VERSION } from "@/layouts/defaults";
import type { PageKey } from "@/layouts/types";
import type {
  ApiAutomationRule,
  ApiCampaignSend,
  ApiCustomerDetail,
  ApiCustomerList,
  ApiFeedbackRow,
  ApiMenuCategory,
  ApiMenuItem,
  ApiPageLayout,
  ApiRestaurant,
  ApiStaffUser,
  DashboardAnalytics,
  DashboardSummary,
  MessageTemplate,
  PublicLayoutsResponse,
  PublicMenuResponse,
} from "@/lib/api";

export const PREVIEW_STAFF_USER: ApiStaffUser = {
  username: "demo",
  name: "Demo Owner",
  url: "/api/users/me/",
  is_staff: true,
};

const TAG_MAP: Record<string, string> = {
  vip: "vip",
  frequent: "frequent",
  "first-time": "first_time",
  first_time: "first_time",
  influencer: "first_time",
  inactive: "inactive",
  neutral: "neutral",
};

function emptyRestaurantFields() {
  return {
    whatsapp_number: "",
    whatsapp_api_token: "",
    whatsapp_phone_number_id: "",
    whatsapp_broadcast_template_name: "",
    whatsapp_broadcast_template_language: "en",
    whatsapp_otp_template_name: "",
    whatsapp_otp_template_language: "en",
    whatsapp_feedback_template_name: "",
    whatsapp_feedback_template_language: "en",
    sms_api_key: "",
    sms_sender_id: "",
    sms_template_id: "",
    google_review_link: "https://g.page/preview-demo/review",
    google_review_prompts_sent: 0,
  };
}

/** API slug (`the-nest`) from mock keys (`thenest`) or route params. */
export function normalizePreviewSlug(slug: string): string {
  const s = (slug || "").trim().toLowerCase();
  if (s === "thenest") return "the-nest";
  return s || DEFAULT_RESTAURANT_SLUG;
}

/** mockData / menuData key (`thenest`) from an API slug. */
export function previewMenuKey(slug: string): string {
  const s = normalizePreviewSlug(slug);
  return s === "the-nest" ? "thenest" : s;
}

function isoDay(day: string | null | undefined): string {
  if (!day) return "2026-02-01T12:00:00Z";
  return day.includes("T") ? day : `${day}T12:00:00Z`;
}

export function previewRestaurants(): ApiRestaurant[] {
  return outlets.map((o) => {
    const slug = normalizePreviewSlug(o.restaurantId);
    const menuKey = previewMenuKey(slug);
    const cfg = restaurants[menuKey];
    return {
      id: o.id,
      name: o.name,
      slug,
      location: o.location,
      ...emptyRestaurantFields(),
      scanner_theme: cfg
        ? {
            tagline: cfg.tagline,
          }
        : undefined,
    };
  });
}

export function previewRestaurant(slug: string): ApiRestaurant | undefined {
  const want = normalizePreviewSlug(slug);
  return previewRestaurants().find((r) => r.slug === want);
}

function mapTag(raw: string, status: string): string {
  if (status.toLowerCase() === "inactive") return "inactive";
  const key = raw.trim().toLowerCase();
  return TAG_MAP[key] || "neutral";
}

function customersForSlug(slug: string) {
  const menuKey = previewMenuKey(slug);
  const apiSlug = normalizePreviewSlug(slug);
  return mockCustomers.filter((c) => {
    const r = (c.restaurant || "").toLowerCase();
    return r === menuKey || r === apiSlug || normalizePreviewSlug(r) === apiSlug;
  });
}

function feedbackForSlug(slug: string) {
  const menuKey = previewMenuKey(slug);
  const apiSlug = normalizePreviewSlug(slug);
  return mockFeedback.filter((f) => {
    const r = (f.restaurant || "").toLowerCase();
    return r === menuKey || r === apiSlug || normalizePreviewSlug(r) === apiSlug;
  });
}

export function previewCustomerList(slug: string): ApiCustomerList[] {
  return customersForSlug(slug).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone.replace(/\s/g, ""),
    total_visits: c.visits,
    last_visit: isoDay(c.lastVisit),
    tag: mapTag(c.tag, c.status),
    created_at: isoDay(c.lastVisit),
  }));
}

export function previewCustomerDetail(slug: string, id: number): ApiCustomerDetail | undefined {
  const row = previewCustomerList(slug).find((c) => c.id === id);
  const raw = customersForSlug(slug).find((c) => c.id === id);
  if (!row || !raw) return undefined;
  const visits = Array.from({ length: Math.min(raw.visits, 8) }, (_, i) => {
    const d = new Date(isoDay(raw.lastVisit));
    d.setDate(d.getDate() - i * 12);
    return { id: id * 100 + i, visit_time: d.toISOString() };
  });
  const history = feedbackForSlug(slug)
    .filter((f) => f.name === raw.name)
    .map((f) => ({
      id: f.id,
      rating: f.rating,
      message: f.comment,
      created_at: isoDay(f.date),
      is_complete: f.resolved,
      sentiment: f.sentiment,
    }));
  return {
    ...row,
    is_active: raw.status.toLowerCase() === "active",
    notes: history.length
      ? `Sample notes from preview check-ins. Last comment: “${history[0].message}”`
      : "Regular guest — sample preview notes.",
    visits,
    feedback_history: history,
  };
}

export function previewFeedback(slug: string): ApiFeedbackRow[] {
  const customers = previewCustomerList(slug);
  return feedbackForSlug(slug).map((f) => {
    const match = customers.find((c) => c.name === f.name);
    return {
      id: f.id,
      customer: {
        id: match?.id ?? f.id,
        name: f.name,
        phone: match?.phone ?? "",
      },
      rating: f.rating,
      message: f.comment,
      created_at: isoDay(f.date),
      is_complete: f.resolved,
    };
  });
}

function statsFor(slug: string) {
  const key = previewMenuKey(slug);
  return dashboardStats[key] ?? dashboardStats[DEFAULT_RESTAURANT_SLUG];
}

export function previewDashboardSummary(slug: string): DashboardSummary {
  const stats = statsFor(slug);
  const recent = previewFeedback(slug).slice(0, 5);
  return {
    total_customers: stats.totalCustomers,
    total_visits: Math.round(stats.totalCustomers * 1.8),
    total_feedback: stats.feedbackCollected,
    positive_feedback_percentage: stats.positiveFeedbackRate,
    recent_feedback: recent.map((f) => ({
      id: f.id,
      customer: f.customer,
      rating: f.rating,
      message: f.message,
      created_at: f.created_at,
    })),
    new_customers_this_week: stats.customersThisWeek,
    campaigns_sent_count: stats.campaignsSent,
    google_review_prompts_sent: stats.googleReviewsGenerated,
    repeat_customer_rate: stats.repeatRate,
    avg_feedback_rating: stats.avgFeedback,
  };
}

export function previewDashboardAnalytics(slug: string): DashboardAnalytics {
  const stats = statsFor(slug);
  const key = previewMenuKey(slug);
  const growth = customerGrowthData[key] ?? customerGrowthData[DEFAULT_RESTAURANT_SLUG];
  return {
    customer_growth: growth,
    sentiment_distribution: feedbackSentimentData.map((s) => ({
      name: s.name,
      count: Math.round((s.value / 100) * stats.feedbackCollected),
      percentage: s.value,
      fill: s.fill,
    })),
    visit_frequency_buckets: visitFrequencyData,
    visits_by_month: growth.map((g) => ({ month: g.month, visits: Math.round(g.customers * 1.4) })),
    campaign_sends_by_month: analyticsData.campaignPerformance.map((r) => ({
      month: r.month,
      sent: r.sent,
      opened: r.opened,
    })),
    return_rate_by_month: analyticsData.returnRate,
    review_generation_by_month: analyticsData.reviewGeneration,
    visit_trends_weekly: analyticsData.visitTrends,
    review_funnel: {
      feedback_received: reviewFunnelStats.feedbackReceived,
      positive_feedback: reviewFunnelStats.positiveFeedback,
      review_requests_sent: reviewFunnelStats.reviewRequestsSent,
      google_reviews_generated: reviewFunnelStats.googleReviewsGenerated,
    },
    repeat_customer_rate: stats.repeatRate,
    avg_feedback_rating: stats.avgFeedback,
  };
}

function audienceToTarget(audience: string): string {
  const a = audience.toLowerCase();
  if (a.includes("vip")) return "VIP";
  if (a.includes("inactive")) return "INACTIVE";
  if (a.includes("frequent")) return "FREQUENT";
  return "ALL";
}

export function previewCampaigns(slug: string): ApiCampaignSend[] {
  const menuKey = previewMenuKey(slug);
  const apiSlug = normalizePreviewSlug(slug);
  return campaignStats
    .filter((c) => {
      const r = (c.restaurant || "").toLowerCase();
      return r === menuKey || r === apiSlug || normalizePreviewSlug(r) === apiSlug;
    })
    .map((c) => ({
      id: c.id,
      name: c.name,
      target_type: audienceToTarget(c.audience),
      message: `Sample ${c.name} message for preview.`,
      recipient_count: c.sent,
      sent: c.sent,
      failed: Math.max(0, c.sent - c.delivered),
      created_at: isoDay(c.date),
      audience: c.audience,
      delivered: c.delivered,
      opened: c.opened,
      responses: c.responses,
      status: c.status.toLowerCase() === "completed" ? "completed" : c.status,
      date: c.date,
      scheduled_for: null,
    }));
}

const TRIGGER_MAP: Array<ApiAutomationRule["trigger_type"]> = [
  "positive_feedback",
  "no_visit_14_days",
  "third_visit_completed",
];

export function previewAutomations(): ApiAutomationRule[] {
  return automationRules.slice(0, 3).map((r, i) => ({
    id: r.id,
    trigger_type: TRIGGER_MAP[i] ?? "positive_feedback",
    enabled: r.status === "Active",
    delay_minutes: i === 1 ? 60 : 15,
    message_template: r.action,
    last_run_at: "2026-02-11T09:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-11T09:00:00Z",
  }));
}

export function previewMenuCategories(slug: string): ApiMenuCategory[] {
  const restaurant = previewRestaurant(slug);
  const restaurantId = restaurant?.id ?? 1;
  const cfg = restaurants[previewMenuKey(slug)] ?? restaurants[DEFAULT_RESTAURANT_SLUG];
  return (cfg?.menu ?? []).map((cat, i) => {
    const categoryId = restaurantId * 100 + i + 1;
    const items: ApiMenuItem[] = cat.items.map((it, j) => ({
      id: restaurantId * 10000 + i * 100 + j + 1,
      category: categoryId,
      name: it.name,
      description: it.description || "",
      price: String(it.price),
      tag: it.tag || "",
      is_featured: Boolean(it.featured),
      is_new: Boolean(it.isNew),
      is_jain: Boolean(it.jain),
      image_scale: typeof it.imageScale === "number" ? it.imageScale : 100,
      image_url: it.imageUrl ?? null,
    }));
    return {
      id: categoryId,
      restaurant: restaurantId,
      name: cat.name,
      items,
    };
  });
}

export function previewPublicMenu(slug: string): PublicMenuResponse {
  const restaurant = previewRestaurant(slug);
  const cfg = restaurants[previewMenuKey(slug)] ?? restaurants[DEFAULT_RESTAURANT_SLUG];
  return {
    restaurant: {
      slug: restaurant?.slug ?? normalizePreviewSlug(slug),
      name: restaurant?.name ?? cfg?.name ?? "Preview Restaurant",
      location: restaurant?.location ?? "",
      google_review_link: restaurant?.google_review_link,
      scanner_theme: restaurant?.scanner_theme,
    },
    categories: previewMenuCategories(slug),
  };
}

export function previewPageLayout(pageKey: string): ApiPageLayout {
  const key = pageKey as PageKey;
  const known = PAGE_KEYS.some((p) => p.key === key);
  const layout = known ? defaultLayoutFor(key) : defaultLayoutFor("welcome");
  return {
    id: PAGE_KEYS.findIndex((p) => p.key === key) + 1,
    page_key: known ? key : "welcome",
    version: 1,
    schema_version: SCHEMA_VERSION,
    layout: layout as unknown as Record<string, unknown>,
    updated_at: "2026-02-01T00:00:00Z",
  };
}

export function previewPublicLayouts(slug: string): PublicLayoutsResponse {
  return {
    restaurant_slug: normalizePreviewSlug(slug),
    pages: PAGE_KEYS.map((p) => previewPageLayout(p.key)),
  };
}

export function previewMessageTemplates(slug: string): MessageTemplate[] {
  const restaurant = previewRestaurant(slug);
  const rid = restaurant?.id ?? 1;
  return [
    {
      id: 1,
      restaurant: rid,
      name: "Welcome back",
      body: "Hi {{name}}, we miss you at the restaurant! Show this for 10% off.",
      created_at: "2026-01-15T00:00:00Z",
    },
    {
      id: 2,
      restaurant: rid,
      name: "Thank you",
      body: "Thanks for visiting, {{name}}! We’d love a Google review if you enjoyed it.",
      created_at: "2026-01-20T00:00:00Z",
    },
  ];
}

export const PREVIEW_CHECK_IN = {
  success: true as const,
  customer_id: 1,
  access: "preview-access-token",
  refresh: "preview-refresh-token",
  existing_user: false,
  total_visits: 1,
};
