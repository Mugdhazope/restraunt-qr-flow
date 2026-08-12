import { describe, expect, it } from "vitest";
import { handlePreviewApi } from "@/lib/previewApi";
import { PREVIEW_STAFF_USER } from "@/lib/previewFixtures";
import type { DashboardSummary, Paginated, PublicMenuResponse } from "@/lib/api";

describe("handlePreviewApi", () => {
  it("returns a demo staff user", () => {
    expect(handlePreviewApi("/api/users/me/")).toEqual(PREVIEW_STAFF_USER);
  });

  it("returns dashboard summary for an outlet", () => {
    const summary = handlePreviewApi("/api/dashboard/?restaurant_slug=dough-joe") as DashboardSummary;
    expect(summary.total_customers).toBeGreaterThan(0);
    expect(summary.recent_feedback.length).toBeGreaterThan(0);
  });

  it("returns paginated customers", () => {
    const page = handlePreviewApi("/api/customers/?restaurant_slug=dough-joe") as Paginated<{ id: number }>;
    expect(page.results.length).toBeGreaterThan(0);
    expect(page.next).toBeNull();
  });

  it("returns a public menu without fetching", () => {
    const menu = handlePreviewApi("/api/public/menu/?restaurant_slug=dough-joe") as PublicMenuResponse;
    expect(menu.restaurant.slug).toBe("dough-joe");
    expect(menu.categories.length).toBeGreaterThan(0);
    expect(menu.categories[0].items.length).toBeGreaterThan(0);
  });

  it("accepts check-in", () => {
    const res = handlePreviewApi("/api/auth/check-in/", {
      method: "POST",
      body: JSON.stringify({ restaurant_slug: "dough-joe", phone: "+919876543210", name: "Guest" }),
    }) as { success: boolean; access: string };
    expect(res.success).toBe(true);
    expect(res.access).toBeTruthy();
  });
});
