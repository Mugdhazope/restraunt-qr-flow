import { useState, useEffect, useCallback, useMemo } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { apiFetch, feedbackDetailUrl, feedbackUrl, fetchAllPages, type ApiFeedbackRow } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Check, Star, ArrowUpRight } from "lucide-react";

const sentimentFilters = ["All", "Positive", "Neutral", "Negative"] as const;

function sentimentFromRating(rating: number): "positive" | "neutral" | "negative" {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

function fmtDate(iso: string): string {
  return iso ? iso.slice(0, 10) : "—";
}

type Row = ApiFeedbackRow & { sentiment: "positive" | "neutral" | "negative" };

const Feedback = () => {
  const { selectedOutlet } = useRestaurant();
  const slug = selectedOutlet.restaurantId;
  const [rows, setRows] = useState<Row[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const list = await fetchAllPages<ApiFeedbackRow>(feedbackUrl(slug));
      setRows(
        list.map((f) => ({
          ...f,
          sentiment: sentimentFromRating(f.rating),
        })),
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load feedback");
      setRows([]);
    }
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (filter === "All") return rows;
    return rows.filter((f) => f.sentiment === filter.toLowerCase());
  }, [rows, filter]);

  const markResolved = async (id: number) => {
    try {
      await apiFetch(feedbackDetailUrl(slug, id), {
        method: "PATCH",
        body: JSON.stringify({ is_complete: true }),
      });
      setRows((prev) => prev.map((f) => (f.id === id ? { ...f, is_complete: true } : f)));
      toast({ title: "Marked as resolved" });
    } catch (e) {
      toast({
        title: "Could not update",
        description: e instanceof Error ? e.message : "Try refreshing the page",
        variant: "destructive",
      });
    }
  };

  const sendReviewRequest = (name: string) => {
    toast({ title: "Review request sent", description: `Google review prompt sent to ${name}` });
  };

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Feedback</h1>
        <p className="text-muted-foreground text-sm">
          {rows.length} responses at {selectedOutlet.name}
        </p>
        {loadError && <p className="text-destructive text-xs mt-1">{loadError}</p>}
      </div>

      <div className="flex gap-2 animate-fade-in flex-wrap">
        {sentimentFilters.map((f) => (
          <button
            type="button"
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
                {Array.from({ length: 5 }, (_, si) => (
                  <Star key={si} size={14} className={si < fb.rating ? "text-warning fill-warning" : "text-muted"} />
                ))}
              </div>
              <span className="text-muted-foreground text-xs">{fmtDate(fb.created_at)}</span>
            </div>

            <p className="font-medium text-foreground text-sm">{fb.customer.name}</p>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{fb.message || "—"}</p>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                  fb.sentiment === "positive"
                    ? "bg-success/10 text-success"
                    : fb.sentiment === "negative"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {fb.sentiment}
              </span>

              <div className="flex items-center gap-1">
                {!fb.is_complete && (
                  <button
                    type="button"
                    onClick={() => void markResolved(fb.id)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Mark resolved"
                  >
                    <Check size={14} />
                  </button>
                )}
                {fb.sentiment === "positive" && (
                  <button
                    type="button"
                    onClick={() => sendReviewRequest(fb.customer.name)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                    title="Send review request"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                )}
                {fb.is_complete && <span className="text-xs text-success font-medium">Resolved</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">
            {rows.length === 0 ? "No feedback in the database for this outlet yet." : "No feedback found for this filter"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Feedback;
