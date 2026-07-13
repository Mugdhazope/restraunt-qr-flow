import { useEffect, useState } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { apiFetch, dashboardAnalyticsUrl, type DashboardAnalytics } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";

const tooltipStyle = { borderRadius: 8, border: "1px solid hsl(220, 13%, 91%)", fontSize: 13 };

const Analytics = () => {
  const { selectedOutlet } = useRestaurant();
  const slug = selectedOutlet.restaurantId;
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const a = await apiFetch<DashboardAnalytics>(dashboardAnalyticsUrl(slug));
        if (!cancelled) setData(a);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load analytics");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const campaignChart =
    data?.campaign_sends_by_month.map((m) => ({
      month: m.month,
      sent: m.sent,
      opened: m.opened ?? 0,
    })) ?? [];

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm">Deep insights into your customer growth and engagement</p>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-4">Customer Return Rate</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.return_rate_by_month ?? []}>
              <defs>
                <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="rate" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#colorReturn)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Positive feedback completed (proxy)</h3>
          <p className="text-xs text-muted-foreground mb-2">Counts completed feedback with rating ≥ 4 (not confirmed Google clicks).</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.review_generation_by_month ?? []}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="reviews" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Campaign sends</h3>
          <p className="text-xs text-muted-foreground mb-2">WhatsApp opens are not tracked until status webhooks exist.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={campaignChart}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sent" fill="hsl(220, 15%, 13%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="opened" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-foreground" />
              <span className="text-xs text-muted-foreground">Sent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Opened (placeholder)</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Visit Trends (Weekly)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.visit_trends_weekly ?? []}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="visits" stroke="hsl(220, 15%, 13%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(220, 15%, 13%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
