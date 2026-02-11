import { useState } from "react";
import { mockCustomers, mockFeedback } from "@/data/mockData";
import { X } from "lucide-react";

const Customers = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = mockCustomers.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6 relative">
      <h1 className="text-2xl font-extrabold text-foreground animate-fade-in">Customers</h1>

      {/* Table */}
      <div className="bg-card rounded-3xl shadow-card overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Phone", "Visits", "Last Visit", "Tag", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 font-bold text-foreground text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockCustomers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="border-b border-border/50 hover:bg-primary/5 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5 font-semibold text-foreground">{c.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.phone}</td>
                  <td className="px-5 py-3.5 text-foreground font-bold">{c.visits}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.lastVisit}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      c.tag === "VIP" ? "bg-primary/10 text-primary border-primary/20" :
                      c.tag === "Repeat" ? "bg-secondary/10 text-secondary border-secondary/20" :
                      "bg-muted text-muted-foreground border-border"
                    }`}>{c.tag}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === "Active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-foreground/20 z-40" onClick={() => setSelectedId(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-card z-50 p-6 overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-foreground">{selected.name}</h2>
              <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-2xl p-4">
                  <p className="text-2xl font-extrabold text-foreground">{selected.visits}</p>
                  <p className="text-muted-foreground text-xs">Total Visits</p>
                </div>
                <div className="bg-background rounded-2xl p-4">
                  <p className="text-2xl font-extrabold text-foreground">{selected.feedback}/5</p>
                  <p className="text-muted-foreground text-xs">Avg Rating</p>
                </div>
              </div>

              <div className="bg-background rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <p className="font-semibold text-foreground">{selected.phone}</p>
              </div>
              <div className="bg-background rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Last Visit</p>
                <p className="font-semibold text-foreground">{selected.lastVisit}</p>
              </div>
              <div className="bg-background rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Tag</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  selected.tag === "VIP" ? "bg-primary/10 text-primary border-primary/20" :
                  selected.tag === "Repeat" ? "bg-secondary/10 text-secondary border-secondary/20" :
                  "bg-muted text-muted-foreground border-border"
                }`}>{selected.tag}</span>
              </div>

              {/* Feedback */}
              <div>
                <h3 className="font-bold text-foreground text-sm mb-3">Recent Feedback</h3>
                {mockFeedback
                  .filter((f) => f.name === selected.name)
                  .map((f) => (
                    <div key={f.id} className="bg-background rounded-2xl p-4 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{f.emoji}</span>
                        <span className="text-xs text-muted-foreground">{f.date}</span>
                      </div>
                      <p className="text-sm text-foreground">{f.comment}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Customers;
