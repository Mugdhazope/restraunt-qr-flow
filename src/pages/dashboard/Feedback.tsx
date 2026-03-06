import { useState } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { mockFeedback } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { Check, Star, ArrowUpRight } from "lucide-react";

const sentimentFilters = ["All", "Positive", "Neutral", "Negative"];

const Feedback = () => {
  const { selectedOutlet } = useRestaurant();
  const restaurantFeedback = mockFeedback.filter((f) => f.restaurant === selectedOutlet.restaurantId);
  const [filter, setFilter] = useState("All");
  const [feedbackList, setFeedbackList] = useState(restaurantFeedback);

  const filtered = feedbackList.filter((f) => {
    if (filter === "All") return true;
    return f.sentiment === filter.toLowerCase();
  });

  const markResolved = (id: number) => {
    setFeedbackList(feedbackList.map((f) => f.id === id ? { ...f, resolved: true } : f));
    toast({ title: "Marked as resolved" });
  };

  const sendReviewRequest = (name: string) => {
    toast({ title: "Review request sent", description: `Google review prompt sent to ${name}` });
  };

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Feedback</h1>
        <p className="text-muted-foreground text-sm">{restaurantFeedback.length} responses at {selectedOutlet.name}</p>
      </div>

      <div className="flex gap-2 animate-fade-in">
        {sentimentFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "bg-foreground text-background" : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((fb, i) => (
          <div
            key={fb.id}
            className={`bg-card border rounded-xl p-4 animate-fade-in transition-colors ${
              fb.sentiment === "negative" ? "border-destructive/20" : "border-border"
            }`}
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={14} className={i < fb.rating ? "text-warning fill-warning" : "text-muted"} />
                ))}
              </div>
              <span className="text-muted-foreground text-xs">{fb.date}</span>
            </div>

            <p className="font-medium text-foreground text-sm">{fb.name}</p>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{fb.comment}</p>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                fb.sentiment === "positive" ? "bg-success/10 text-success"
                : fb.sentiment === "negative" ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
              }`}>
                {fb.sentiment}
              </span>

              <div className="flex items-center gap-1">
                {!fb.resolved && (
                  <button onClick={() => markResolved(fb.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Mark resolved">
                    <Check size={14} />
                  </button>
                )}
                {fb.sentiment === "positive" && (
                  <button onClick={() => sendReviewRequest(fb.name)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary" title="Send review request">
                    <ArrowUpRight size={14} />
                  </button>
                )}
                {fb.resolved && (
                  <span className="text-xs text-success font-medium">Resolved</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No feedback found for this filter</p>
        </div>
      )}
    </div>
  );
};

export default Feedback;
