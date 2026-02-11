import { dashboardStats } from "@/data/mockData";
import { Users, Flame, MessageCircle, Smartphone } from "lucide-react";

const stats = [
  { label: "Total Customers", value: dashboardStats.totalCustomers, icon: Users, emoji: "🍕", color: "text-primary" },
  { label: "Repeat Rate", value: `${dashboardStats.repeatRate}%`, icon: Flame, emoji: "🔥", color: "text-primary" },
  { label: "Avg Feedback", value: `${dashboardStats.avgFeedback} / 5`, icon: MessageCircle, emoji: "💬", color: "text-secondary" },
  { label: "WhatsApp Reach", value: `${dashboardStats.whatsappReach}%`, icon: Smartphone, emoji: "📲", color: "text-secondary" },
];

const DashboardHome = () => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Growth Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your WhatsApp-first customer engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-card rounded-3xl shadow-card p-6 hover:shadow-glow hover:-translate-y-1 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{stat.emoji}</span>
              <stat.icon className={`${stat.color} opacity-40`} size={24} />
            </div>
            <p className="text-3xl font-extrabold text-foreground">{stat.value}</p>
            <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-3xl shadow-card p-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {["Send Broadcast", "Create Reward", "View Feedback", "Export Customers"].map((action) => (
            <button
              key={action}
              className="px-5 py-2.5 bg-primary/5 text-foreground font-semibold rounded-full border border-primary/10 hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-sm"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
