import { useState } from "react";
import { mockCustomers, mockMessages } from "@/data/mockData";
import { Search, Send, Tag, History, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const filters = ["All", "Repeat", "VIP", "First-Time", "Inactive"];
const tagColors: Record<string, string> = {
  VIP: "bg-primary/10 text-primary border-primary/20",
  Repeat: "bg-secondary/10 text-secondary border-secondary/20",
  New: "bg-muted text-muted-foreground border-border",
};
const allTags = ["VIP", "Repeat", "New"];

const WhatsAppCRM = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(mockCustomers[0]);
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [showTagModal, setShowTagModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [customerTags, setCustomerTags] = useState<Record<number, string>>(
    Object.fromEntries(mockCustomers.map((c) => [c.id, c.tag]))
  );

  const filtered = mockCustomers.filter((c) => {
    const tag = customerTags[c.id] || c.tag;
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "First-Time" && tag === "New") ||
      (activeFilter === "Inactive" && c.status === "Inactive") ||
      tag === activeFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = { id: messages.length + 1, sender: "business", text: newMessage, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  const handleBroadcast = () => {
    toast({ title: "Broadcast Sent! 📢", description: `Message sent to ${selectedCustomer.name} on WhatsApp` });
  };

  const handleTagCustomer = (tag: string) => {
    setCustomerTags({ ...customerTags, [selectedCustomer.id]: tag });
    setShowTagModal(false);
    toast({ title: "Tag Updated ✅", description: `${selectedCustomer.name} tagged as ${tag}` });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-foreground animate-fade-in">WhatsApp CRM</h1>

      <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
        {/* Left: Customer list */}
        <div className={`bg-card rounded-3xl shadow-card p-4 lg:w-96 flex-shrink-0 ${showChat ? "hidden lg:block" : ""} animate-fade-in`}>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background rounded-2xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedCustomer(c); setShowChat(true); setShowHistoryPanel(false); }}
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
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tagColors[customerTags[c.id] || c.tag] || tagColors.New}`}>
                  {customerTags[c.id] || c.tag}
                </span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No customers found</p>}
          </div>
        </div>

        {/* Right: Chat */}
        <div className={`flex-1 bg-card rounded-3xl shadow-card flex flex-col ${!showChat ? "hidden lg:flex" : ""} animate-fade-in relative`}>
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
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "business" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.sender === "business" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender === "business" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message input */}
          <div className="px-4 pb-2">
            <div className="flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={handleSendMessage} className="bg-primary text-primary-foreground rounded-full p-2.5 hover:shadow-glow transition-all">
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border flex flex-wrap gap-2">
            {[
              { label: "Send Broadcast", icon: Send, action: handleBroadcast },
              { label: "Tag Customer", icon: Tag, action: () => setShowTagModal(true) },
              { label: "View History", icon: History, action: () => setShowHistoryPanel(!showHistoryPanel) },
            ].map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-foreground rounded-full text-xs font-semibold border border-primary/10 hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Tag Modal */}
          {showTagModal && (
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
              <div className="bg-card rounded-3xl shadow-card p-6 w-64">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-foreground">Tag {selectedCustomer.name.split(" ")[0]}</h3>
                  <button onClick={() => setShowTagModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                </div>
                <div className="space-y-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagCustomer(tag)}
                      className={`w-full px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${tagColors[tag]} hover:opacity-80`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* History Panel */}
          {showHistoryPanel && (
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-card border-l border-border rounded-r-3xl p-4 overflow-y-auto z-10 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-foreground text-sm">Visit History</h3>
                <button onClick={() => setShowHistoryPanel(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  <p><span className="font-semibold text-foreground">Total Visits:</span> {selectedCustomer.visits}</p>
                  <p><span className="font-semibold text-foreground">Last Visit:</span> {selectedCustomer.lastVisit}</p>
                  <p><span className="font-semibold text-foreground">Feedback:</span> {selectedCustomer.feedback} / 5</p>
                  <p><span className="font-semibold text-foreground">Status:</span> {selectedCustomer.status}</p>
                </div>
                {Array.from({ length: Math.min(selectedCustomer.visits, 5) }, (_, i) => {
                  const d = new Date(selectedCustomer.lastVisit);
                  d.setDate(d.getDate() - i * 7);
                  return (
                    <div key={i} className="bg-muted/50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-foreground">Visit #{selectedCustomer.visits - i}</p>
                      <p className="text-[10px] text-muted-foreground">{d.toLocaleDateString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppCRM;
