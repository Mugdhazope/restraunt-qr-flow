import { useState, useEffect, useCallback, useMemo } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import {
  apiFetch,
  customerDetailUrl,
  customersUrl,
  feedbackUrl,
  fetchAllPages,
  type ApiCustomerDetail,
  type ApiCustomerList,
} from "@/lib/api";
import { Search, X, Filter } from "lucide-react";

const TAG_EDIT_OPTIONS = [
  { value: "vip", label: "VIP" },
  { value: "frequent", label: "Frequent" },
  { value: "first_time", label: "First Timer" },
  { value: "neutral", label: "Neutral" },
  { value: "inactive", label: "Inactive" },
] as const;

const tagStyles: Record<string, string> = {
  vip: "bg-primary/10 text-primary",
  frequent: "bg-foreground/10 text-foreground",
  first_time: "bg-muted text-muted-foreground",
  neutral: "bg-success/10 text-success",
  inactive: "bg-destructive/10 text-destructive",
  regular: "bg-success/10 text-success",
};

function formatTag(tag: string): string {
  const m: Record<string, string> = {
    vip: "VIP",
    frequent: "Frequent",
    first_time: "First Timer",
    neutral: "Neutral",
    inactive: "Inactive",
    regular: "Neutral",
  };
  return m[tag] || tag;
}

function sentimentLabel(rating: number | undefined): string {
  if (rating === undefined) return "unknown";
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

function fmtDay(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

const Customers = () => {
  const { selectedOutlet } = useRestaurant();
  const slug = selectedOutlet.restaurantId;
  const [rows, setRows] = useState<ApiCustomerList[]>([]);
  const [latestRating, setLatestRating] = useState<Map<number, number>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ApiCustomerDetail | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [savingTag, setSavingTag] = useState(false);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("All");
  const [sentimentFilter, setSentimentFilter] = useState("All");

  const refreshList = useCallback(async () => {
    setLoadError(null);
    try {
      const [cust, fb] = await Promise.all([
        fetchAllPages<ApiCustomerList>(customersUrl(slug)),
        fetchAllPages<{ id: number; customer: { id: number }; rating: number; created_at: string }>(feedbackUrl(slug)),
      ]);
      setRows(cust);
      const byTime = [...fb].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      const map = new Map<number, number>();
      for (const f of byTime) {
        if (!map.has(f.customer.id)) map.set(f.customer.id, f.rating);
      }
      setLatestRating(map);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load customers");
      setRows([]);
    }
  }, [slug]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (selectedId === null) {
      setDetail(null);
      setNotesDraft("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const d = await apiFetch<ApiCustomerDetail>(customerDetailUrl(slug, selectedId));
        if (!cancelled) {
          setDetail(d);
          setNotesDraft(d.notes || "");
          setTagDraft(TAG_EDIT_OPTIONS.some((o) => o.value === d.tag) ? d.tag : "neutral");
        }
      } catch {
        if (!cancelled) setDetail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, selectedId]);

  const allTags = useMemo(() => ["All", ...Array.from(new Set(rows.map((c) => c.tag)))], [rows]);

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.replace(/\s/g, "").includes(search.replace(/\s/g, ""));
      const matchTag = tagFilter === "All" || c.tag === tagFilter;
      const sent = sentimentLabel(latestRating.get(c.id));
      const matchSentiment = sentimentFilter === "All" || sent === sentimentFilter.toLowerCase();
      return matchSearch && matchTag && matchSentiment;
    });
  }, [rows, search, tagFilter, sentimentFilter, latestRating]);

  const saveNotes = async () => {
    if (selectedId === null || !detail) return;
    setSavingNotes(true);
    try {
      const d = await apiFetch<ApiCustomerDetail>(customerDetailUrl(slug, selectedId), {
        method: "PATCH",
        body: JSON.stringify({ notes: notesDraft }),
      });
      setDetail(d);
    } finally {
      setSavingNotes(false);
    }
  };

  const saveTag = async () => {
    if (selectedId === null || !detail) return;
    setSavingTag(true);
    try {
      const d = await apiFetch<ApiCustomerDetail>(customerDetailUrl(slug, selectedId), {
        method: "PATCH",
        body: JSON.stringify({ tag: tagDraft }),
      });
      setDetail(d);
      await refreshList();
    } finally {
      setSavingTag(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground text-sm">
            {rows.length} customers at {selectedOutlet.name}
          </p>
          {loadError && <p className="text-destructive text-xs mt-1">{loadError}</p>}
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

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-muted-foreground" />
          {allTags.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTagFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tagFilter === t ? "bg-foreground text-background" : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              {t === "All" ? t : formatTag(t)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["All", "Positive", "Neutral", "Negative"].map((s) => (
            <button
              type="button"
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
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sent = sentimentLabel(latestRating.get(c.id));
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{c.total_visits}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDay(c.last_visit)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          sent === "positive" ? "bg-success" : sent === "negative" ? "bg-destructive" : "bg-muted-foreground"
                        }`}
                      />
                      <span className="text-muted-foreground capitalize">{sent}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${tagStyles[c.tag] || tagStyles.first_time}`}>
                        {formatTag(c.tag)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          c.total_visits > 0 ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.total_visits > 0 ? "Active" : "New"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && selectedId !== null && (
        <>
          <div className="fixed inset-0 bg-foreground/10 z-40" onClick={() => setSelectedId(null)} aria-hidden />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto animate-slide-in-right">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">{detail.name}</h2>
                <button type="button" onClick={() => setSelectedId(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xl font-bold text-foreground">{detail.total_visits}</p>
                    <p className="text-muted-foreground text-xs">Total Visits</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xl font-bold text-foreground">
                      {detail.feedback_history.length
                        ? (detail.feedback_history.reduce((a, f) => a + f.rating, 0) / detail.feedback_history.length).toFixed(1)
                        : "—"}
                      /5
                    </p>
                    <p className="text-muted-foreground text-xs">Avg Rating</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Phone", value: detail.phone },
                    { label: "Last Visit", value: fmtDay(detail.last_visit) },
                    { label: "Active", value: detail.is_active ? "Yes" : "No" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground text-sm">{item.label}</span>
                      <span className="text-foreground text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                  <div className="py-2 border-b border-border space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-muted-foreground text-sm">Tag</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${tagStyles[detail.tag] || tagStyles.first_time}`}>
                        {formatTag(detail.tag)}
                      </span>
                    </div>
                    <select
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {TAG_EDIT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={savingTag || tagDraft === detail.tag}
                      onClick={() => void saveTag()}
                      className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      {savingTag ? "Saving…" : "Save tag"}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-3">Feedback</h3>
                  {detail.feedback_history.map((f) => (
                    <div key={f.id} className="bg-muted/50 rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={`text-xs ${i < f.rating ? "text-warning" : "text-muted"}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{fmtDay(f.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground">{f.message}</p>
                    </div>
                  ))}
                  {detail.feedback_history.length === 0 && <p className="text-muted-foreground text-sm">No feedback yet</p>}
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">Notes</h3>
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Add a note about this customer..."
                    className="w-full bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none h-24"
                  />
                  <button
                    type="button"
                    disabled={savingNotes}
                    onClick={() => void saveNotes()}
                    className="mt-2 text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {savingNotes ? "Saving…" : "Save notes"}
                  </button>
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
