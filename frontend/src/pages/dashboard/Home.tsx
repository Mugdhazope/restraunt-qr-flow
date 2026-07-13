import { useEffect, useState } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import {
  apiFetch,
  dashboardAnalyticsUrl,
  dashboardSummaryUrl,
  type DashboardAnalytics,
  type DashboardSummary,
} from "@/lib/api";
import { Users, TrendingUp, MessageSquare, Star, Megaphone } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const DashboardHome = () => {
  const { selectedOutlet } = useRestaurant();
  const slug = selectedOutlet.restaurantId;
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const [s, a] = await Promise.all([
          apiFetch<DashboardSummary>(dashboardSummaryUrl(slug)),
          apiFetch<DashboardAnalytics>(dashboardAnalyticsUrl(slug)),
        ]);
        if (!cancelled) {
          setSummary(s);
          setAnalytics(a);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const sentimentPie =
    analytics?.sentiment_distribution.map((d) => ({
      name: d.name,
      value: d.percentage,
      fill: d.fill,
    })) ?? [];

  const statCards = summary
    ? [
        { label: "Total Customers", value: summary.total_customers.toLocaleString(), icon: Users },
        { label: "This Week (new)", value: String(summary.new_customers_this_week), icon: TrendingUp },
        { label: "Feedback Collected", value: String(summary.total_feedback), icon: MessageSquare },
        { label: "Positive Rate", value: `${summary.positive_feedback_percentage}%`, icon: Star },
        { label: "Review prompts sent", value: String(summary.google_review_prompts_sent), icon: Star },
        { label: "Campaigns Sent", value: String(summary.campaigns_sent_count), icon: Megaphone },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">{selectedOutlet.name} Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of your restaurant&apos;s growth metrics</p>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-4 animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon size={16} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Live</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {summary && (
        <p className="text-xs text-muted-foreground">
          Repeat customers: {summary.repeat_customer_rate}% · Avg feedback rating: {summary.avg_feedback_rating.toFixed(1)}/5
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-4">Customer Growth (cumulative)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={analytics?.customer_growth ?? []}>
              <defs>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220, 13%, 91%)", fontSize: 13 }} />
              <Area type="monotone" dataKey="customers" stroke="hsl(0, 72%, 51%)" strokeWidth={2} fill="url(#colorCustomers)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-4">Feedback Sentiment</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sentimentPie} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {sentimentPie.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220, 13%, 91%)", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            {sentimentPie.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-xs text-muted-foreground">
                  {d.name} {d.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
        <h3 className="text-sm font-semibold text-foreground mb-4">Visit Frequency Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={analytics?.visit_frequency_buckets ?? []}>
            <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220, 13%, 91%)", fontSize: 13 }} />
            <Bar dataKey="count" fill="hsl(220, 15%, 13%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardHome;
