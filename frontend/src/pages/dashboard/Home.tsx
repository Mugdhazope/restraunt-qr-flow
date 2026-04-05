import { useRestaurant } from "@/context/RestaurantContext";
import { dashboardStats, customerGrowthData, feedbackSentimentData, visitFrequencyData } from "@/data/mockData";
import { Users, TrendingUp, MessageSquare, Star, Megaphone } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const DashboardHome = () => {
  const { selectedOutlet } = useRestaurant();
  const rid = selectedOutlet.restaurantId;
  const stats = dashboardStats[rid] || dashboardStats["doughandjoe"];
  const growth = customerGrowthData[rid] || customerGrowthData["doughandjoe"];

  const statCards = [
    { label: "Total Customers", value: stats.totalCustomers.toLocaleString(), icon: Users, change: "+12%" },
    { label: "This Week", value: String(stats.customersThisWeek), icon: TrendingUp, change: "+8%" },
    { label: "Feedback Collected", value: String(stats.feedbackCollected), icon: MessageSquare, change: "+15%" },
    { label: "Positive Rate", value: `${stats.positiveFeedbackRate}%`, icon: Star, change: "+3%" },
    { label: "Google Reviews", value: String(stats.googleReviewsGenerated), icon: Star, change: "+22%" },
    { label: "Campaigns Sent", value: String(stats.campaignsSent), icon: Megaphone, change: "+5%" },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">{selectedOutlet.name} Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of your restaurant's growth metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center justify-between mb-3">
                <Icon size={16} className="text-muted-foreground" />
                <span className="text-xs font-medium text-success">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-4">Customer Growth</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={growth}>
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
              <Pie data={feedbackSentimentData} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {feedbackSentimentData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220, 13%, 91%)", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {feedbackSentimentData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-xs text-muted-foreground">{d.name} {d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
        <h3 className="text-sm font-semibold text-foreground mb-4">Visit Frequency Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={visitFrequencyData}>
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
