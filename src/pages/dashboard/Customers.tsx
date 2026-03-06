import { useState } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { mockCustomers, mockFeedback } from "@/data/mockData";
import { Search, X, Filter } from "lucide-react";

const tagStyles: Record<string, string> = {
  VIP: "bg-primary/10 text-primary",
  Frequent: "bg-foreground/10 text-foreground",
  "First-time": "bg-muted text-muted-foreground",
  Influencer: "bg-warning/10 text-warning",
  Regular: "bg-success/10 text-success",
  "Frequent Visitor": "bg-foreground/10 text-foreground",
};

const Customers = () => {
  const { selectedOutlet } = useRestaurant();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("All");
  const [sentimentFilter, setSentimentFilter] = useState("All");

  const restaurantCustomers = mockCustomers.filter((c) => c.restaurant === selectedOutlet.restaurantId);
  const selected = restaurantCustomers.find((c) => c.id === selectedId);

  const allTags = ["All", ...Array.from(new Set(restaurantCustomers.map((c) => c.tag)))];

  const filtered = restaurantCustomers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchTag = tagFilter === "All" || c.tag === tagFilter;
    const matchSentiment = sentimentFilter === "All" || c.sentiment === sentimentFilter.toLowerCase();
    return matchSearch && matchTag && matchSentiment;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground text-sm">{restaurantCustomers.length} customers at {selectedOutlet.name}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 animate-fade-in">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tagFilter === t ? "bg-foreground text-background" : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {["All", "Positive", "Neutral", "Negative"].map((s) => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sentimentFilter === s ? "bg-foreground text-background" : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Name", "Phone", "Visits", "Last Visit", "Sentiment", "Tag", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{c.visits}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.lastVisit}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      c.sentiment === "positive" ? "bg-success" : c.sentiment === "negative" ? "bg-destructive" : "bg-muted-foreground"
                    }`} />
                    <span className="text-muted-foreground capitalize">{c.sentiment}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tagStyles[c.tag] || tagStyles["First-time"]}`}>
                      {c.tag}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No customers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 bg-foreground/10 z-40" onClick={() => setSelectedId(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto animate-slide-in-right">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
                <button onClick={() => setSelectedId(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xl font-bold text-foreground">{selected.visits}</p>
                    <p className="text-muted-foreground text-xs">Total Visits</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xl font-bold text-foreground">{selected.feedback}/5</p>
                    <p className="text-muted-foreground text-xs">Avg Rating</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Phone", value: selected.phone },
                    { label: "Last Visit", value: selected.lastVisit },
                    { label: "Status", value: selected.status },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground text-sm">{item.label}</span>
                      <span className="text-foreground text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground text-sm">Tag</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tagStyles[selected.tag] || tagStyles["First-time"]}`}>
                      {selected.tag}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-3">Recent Feedback</h3>
                  {mockFeedback
                    .filter((f) => f.name === selected.name)
                    .map((f) => (
                      <div key={f.id} className="bg-muted/50 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} className={`text-xs ${i < f.rating ? "text-warning" : "text-muted"}`}>★</span>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{f.date}</span>
                        </div>
                        <p className="text-sm text-foreground">{f.comment}</p>
                      </div>
                    ))}
                  {mockFeedback.filter((f) => f.name === selected.name).length === 0 && (
                    <p className="text-muted-foreground text-sm">No feedback yet</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">Notes</h3>
                  <textarea
                    placeholder="Add a note about this customer..."
                    className="w-full bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none h-20"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Customers;
