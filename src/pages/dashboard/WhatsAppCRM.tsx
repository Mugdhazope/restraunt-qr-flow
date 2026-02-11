import { useState } from "react";
import { mockCustomers, mockMessages } from "@/data/mockData";
import { Search, Send, Tag, History } from "lucide-react";

const filters = ["All", "Repeat", "VIP", "First-Time", "Inactive"];
const tagColors: Record<string, string> = {
  VIP: "bg-primary/10 text-primary border-primary/20",
  Repeat: "bg-secondary/10 text-secondary border-secondary/20",
  New: "bg-muted text-muted-foreground border-border",
};

const WhatsAppCRM = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(mockCustomers[0]);
  const [showChat, setShowChat] = useState(false);

  const filtered = mockCustomers.filter((c) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "First-Time") return c.tag === "New";
    if (activeFilter === "Inactive") return c.status === "Inactive";
    return c.tag === activeFilter;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-foreground animate-fade-in">WhatsApp CRM</h1>

      <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
        {/* Left: Customer list */}
        <div className={`bg-card rounded-3xl shadow-card p-4 lg:w-96 flex-shrink-0 ${showChat ? "hidden lg:block" : ""} animate-fade-in`}>
          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-2.5 bg-background rounded-2xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedCustomer(c); setShowChat(true); }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                  selectedCustomer.id === c.id ? "bg-primary/5 border border-primary/15" : "hover:bg-muted/50"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                  <p className="text-muted-foreground text-xs">Last: {c.lastVisit}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tagColors[c.tag] || tagColors.New}`}>
                  {c.tag}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Chat */}
        <div className={`flex-1 bg-card rounded-3xl shadow-card flex flex-col ${!showChat ? "hidden lg:flex" : ""} animate-fade-in`}>
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <button onClick={() => setShowChat(false)} className="lg:hidden text-muted-foreground text-sm">← Back</button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {selectedCustomer.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{selectedCustomer.name}</p>
              <p className="text-muted-foreground text-xs">{selectedCustomer.phone}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {mockMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "business" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender === "business"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender === "business" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border flex flex-wrap gap-2">
            {[
              { label: "Send Broadcast", icon: Send },
              { label: "Tag Customer", icon: Tag },
              { label: "View History", icon: History },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-foreground rounded-full text-xs font-semibold border border-primary/10 hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppCRM;
