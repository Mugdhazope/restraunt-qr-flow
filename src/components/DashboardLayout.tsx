import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { outlets } from "@/data/mockData";
import {
  LayoutDashboard, Users, MessageSquare, Star, Megaphone,
  Zap, QrCode, BarChart3, Settings, Search, Bell, ChevronDown,
  Menu, X, LogOut
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", path: "/dashboard/customers", icon: Users },
  { label: "Feedback", path: "/dashboard/feedback", icon: MessageSquare },
  { label: "Google Reviews", path: "/dashboard/google-reviews", icon: Star },
  { label: "WhatsApp Campaigns", path: "/dashboard/campaigns", icon: Megaphone },
  { label: "Automations", path: "/dashboard/automations", icon: Zap },
  { label: "QR & Entry Flow", path: "/dashboard/qr-entry", icon: QrCode },
  { label: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", path: "/dashboard/settings", icon: Settings },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [outletDropdown, setOutletDropdown] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState(outlets[0]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-sidebar z-50 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="px-6 h-16 flex items-center justify-between border-b border-sidebar-border">
          <Link to="/dashboard" className="text-sidebar-foreground font-bold text-lg tracking-tight">
            WhatsApp CRM
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-muted hover:text-sidebar-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground text-xs font-bold">
              AK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground text-sm font-medium truncate">Admin</p>
              <p className="text-sidebar-muted text-xs truncate">admin@restaurant.com</p>
            </div>
            <button className="text-sidebar-muted hover:text-sidebar-foreground">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <Menu size={20} />
            </button>

            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-64">
              <Search size={16} className="text-muted-foreground" />
              <input
                placeholder="Search..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Outlet selector */}
            <div className="relative">
              <button
                onClick={() => setOutletDropdown(!outletDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {selectedOutlet.name}
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
              {outletDropdown && (
                <div className="absolute right-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                  {outlets.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => { setSelectedOutlet(o); setOutletDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${selectedOutlet.id === o.id ? "text-primary font-medium" : "text-foreground"}`}
                    >
                      <p className="font-medium">{o.name}</p>
                      <p className="text-muted-foreground text-xs">{o.location}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>

            {/* Profile avatar */}
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground text-xs font-bold">
              AK
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
