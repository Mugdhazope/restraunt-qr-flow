import { useState } from "react";
import { mockFeedback } from "@/data/mockData";

const sentimentFilters = ["All", "Positive", "Neutral", "Negative"];

const Feedback = () => {
  const [filter, setFilter] = useState("All");

  const filtered = mockFeedback.filter((f) => {
    if (filter === "All") return true;
    return f.sentiment === filter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-foreground animate-fade-in">Feedback</h1>

      {/* Filters */}
      <div className="flex gap-2 animate-fade-in">
        {sentimentFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((fb, i) => (
          <div
            key={fb.id}
            className={`bg-card rounded-3xl shadow-card p-5 transition-all hover:-translate-y-1 duration-300 animate-fade-in ${
              fb.sentiment === "negative" ? "border-2 border-primary/20" : ""
            }`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">{fb.emoji}</span>
              <span className="text-muted-foreground text-xs">{fb.date}</span>
            </div>
            <h3 className="font-bold text-foreground text-sm">{fb.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">{fb.comment}</p>
            <span
              className={`inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-bold ${
                fb.sentiment === "positive"
                  ? "bg-green-100 text-green-700"
                  : fb.sentiment === "negative"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {fb.rating}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feedback;
