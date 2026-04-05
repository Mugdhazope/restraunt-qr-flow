import { useState } from "react";
import { outlets } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("outlets");

  const tabs = [
    { id: "outlets", label: "Outlets" },
    { id: "whatsapp", label: "WhatsApp Integration" },
    { id: "templates", label: "Message Templates" },
    { id: "team", label: "Team Access" },
  ];

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and integrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border animate-fade-in">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === "outlets" && (
          <div className="space-y-4">
            {outlets.map((o) => (
              <div key={o.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{o.name}</p>
                  <p className="text-muted-foreground text-sm">{o.location}</p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  Edit
                </button>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
              + Add Outlet
            </button>
          </div>
        )}

        {activeTab === "whatsapp" && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">WhatsApp Business Phone Number</label>
              <input
                defaultValue="+91 98765 00000"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">API Access Token</label>
              <input
                type="password"
                defaultValue="EAAxxxxxxxxxxxxxxxx"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number ID</label>
              <input
                defaultValue="1234567890"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Connection status</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">Connected</span>
            </div>
            <button
              onClick={() => toast({ title: "Settings saved" })}
              className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-3">
            {[
              { name: "Welcome Message", body: "Hi {{name}}! Welcome to {{outlet}}. Thanks for visiting us today!" },
              { name: "Feedback Request", body: "Hi {{name}}, how was your experience at {{outlet}} today? We'd love your feedback." },
              { name: "Review Request", body: "Hi {{name}}! Thank you for your wonderful feedback. Could you share it as a Google Review?" },
              { name: "Comeback Offer", body: "Hey {{name}}! We miss you. Here's 10% off on your next visit." },
            ].map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground text-sm">{t.name}</p>
                  <button className="text-xs text-primary font-medium hover:underline">Edit</button>
                </div>
                <p className="text-muted-foreground text-sm bg-muted/50 rounded-lg p-3">{t.body}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "team" && (
          <div className="space-y-3">
            {[
              { name: "Admin User", email: "admin@restaurant.com", role: "Owner" },
              { name: "Manager", email: "manager@restaurant.com", role: "Manager" },
            ].map((m) => (
              <div key={m.email} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-foreground text-xs font-bold">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{m.name}</p>
                    <p className="text-muted-foreground text-xs">{m.email}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{m.role}</span>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
              + Invite Team Member
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
