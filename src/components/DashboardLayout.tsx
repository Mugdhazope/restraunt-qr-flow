import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageCircle, Megaphone, Gift, MessageSquare, Users, Settings, Menu, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "WhatsApp CRM", path: "/dashboard/crm", icon: MessageCircle },
  { label: "Campaigns", path: "/dashboard/campaigns", icon: Megaphone },
  { label: "Rewards", path: "/dashboard/rewards", icon: Gift },
  { label: "Feedback", path: "/dashboard/feedback", icon: MessageSquare },
  { label: "Customers", path: "/dashboard/customers", icon: Users },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <nav className="bg-primary sticky top-0 z-50 shadow-glow">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/dashboard" className="text-primary-foreground font-extrabold text-xl tracking-tight">
            Dough & Joe <span className="font-normal text-primary-foreground/70 text-sm ml-1">Growth</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-primary-foreground p-2"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-primary border-t border-primary-foreground/10 animate-fade-in">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-all ${
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/70 hover:bg-primary-foreground/10"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
