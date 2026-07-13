import { useState, useEffect, useCallback } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import {
  apiFetch,
  campaignDetailUrl,
  campaignResendUrl,
  campaignsUrl,
  campaignSendUrl,
  fetchAllPages,
  campaignTargetLabel,
  type ApiCampaignSend,
  type CampaignTargetApi,
  type Paginated,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Plus, Send, X, RotateCcw, Trash2 } from "lucide-react";

const SEGMENTS: { label: string; value: CampaignTargetApi }[] = [
  { label: "All Customers", value: "ALL" },
  { label: "VIP Only", value: "VIP" },
  { label: "Frequent Visitors", value: "FREQUENT" },
  { label: "Dormant (90d+ no visit)", value: "INACTIVE" },
  { label: "Tag: First Timer", value: "FIRST_TIME" },
  { label: "Tag: Neutral", value: "NEUTRAL" },
  { label: "Tag: Inactive", value: "INACTIVE_TAG" },
];

async function fetchCustomerCount(slug: string, target: CampaignTargetApi): Promise<number | null> {
  if (target === "INACTIVE") return null;
  const tagMap: Partial<Record<CampaignTargetApi, string>> = {
    VIP: "vip",
    FREQUENT: "frequent",
    FIRST_TIME: "first_time",
    NEUTRAL: "neutral",
    INACTIVE_TAG: "inactive",
  };
  const tag = tagMap[target];
  const q = new URLSearchParams({ restaurant_slug: slug });
  if (tag) q.set("tag", tag);
  const r = await apiFetch<Paginated<unknown>>(`/api/customers/?${q}`);
  return r.count;
}

const Campaigns = () => {
  const { selectedOutlet } = useRestaurant();
  const slug = selectedOutlet.restaurantId;
  const [history, setHistory] = useState<ApiCampaignSend[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedTarget, setSelectedTarget] = useState<CampaignTargetApi>("ALL");
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState(
    "Hi! Weekend special is live 🍕 — show this message for 10% off your next order.",
  );
  const [sending, setSending] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [recipientEstimate, setRecipientEstimate] = useState<number | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");

  const refreshHistory = useCallback(async () => {
    setLoadError(null);
    try {
      const rows = await fetchAllPages<ApiCampaignSend>(campaignsUrl(slug));
      setHistory(rows);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load campaigns");
      setHistory([]);
    }
  }, [slug]);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const n = await fetchCustomerCount(slug, selectedTarget);
        if (!cancelled) setRecipientEstimate(n);
      } catch {
        if (!cancelled) setRecipientEstimate(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, selectedTarget]);

  const handleSend = async () => {
    if (!campaignName.trim()) {
      toast({ title: "Please enter a campaign name", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await apiFetch<
        | {
            queued: true;
            task_id: string;
            recipient_count: number;
            name: string;
            target_type: string;
          }
        | {
            id: number;
            name: string;
            recipient_count: number;
            sent: number;
            failed: number;
            target_type: string;
            error_summary?: string | null;
          }
      >(campaignSendUrl(slug), {
        method: "POST",
        body: JSON.stringify({
          name: campaignName.trim(),
          message: message.trim(),
          target_type: selectedTarget,
          scheduled_for: scheduleAt ? new Date(scheduleAt).toISOString() : null,
        }),
      });
      if ("queued" in res && res.queued) {
        toast({
          title: "Campaign queued",
          description: `"${res.name}" — sending to ${res.recipient_count} recipients in the background. History updates when delivery finishes; you can leave this page.`,
        });
        setShowBuilder(false);
        setCampaignName("");
        setScheduleAt("");
        await refreshHistory();
        window.setTimeout(() => void refreshHistory(), 4000);
      } else {
        const deliveryHint =
          res.sent > 0
            ? " Meta accepts the send immediately; if the chat stays empty, the recipient may be outside the 24-hour window (use a template or have them message you first)."
            : "";
        const detail =
          res.failed > 0 && res.error_summary
            ? `"${res.name}" — ${res.sent} sent, ${res.failed} failed (${res.recipient_count} recipients). ${res.error_summary}`
            : `"${res.name}" — ${res.sent} sent, ${res.failed} failed (${res.recipient_count} recipients).${deliveryHint}`;
        toast({
          title: res.failed > 0 && res.sent === 0 ? "Campaign not delivered" : "Campaign sent",
          description: detail,
          variant: res.failed > 0 && res.sent === 0 ? "destructive" : undefined,
        });
        setShowBuilder(false);
        setCampaignName("");
        setScheduleAt("");
        await refreshHistory();
      }
    } catch (e) {
      toast({
        title: "Send failed",
        description: e instanceof Error ? e.message : "Check staff login and API token",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (campaign: ApiCampaignSend) => {
    const scheduledFor = window.prompt("Schedule resend (ISO or leave empty for immediate):", "");
    try {
      await apiFetch(campaignResendUrl(slug, campaign.id), {
        method: "POST",
        body: JSON.stringify({
          scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        }),
      });
      toast({ title: "Campaign resend queued" });
      await refreshHistory();
    } catch (e) {
      toast({
        title: "Resend failed",
        description: e instanceof Error ? e.message : "Unable to resend",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (campaign: ApiCampaignSend) => {
    if (!window.confirm(`Delete campaign "${campaign.name}"? This keeps delivery analytics.`)) return;
    try {
      await apiFetch(campaignDetailUrl(slug, campaign.id), { method: "DELETE" });
      toast({ title: "Campaign deleted" });
      await refreshHistory();
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Unable to delete",
        variant: "destructive",
      });
    }
  };

  const fmtDate = (iso: string) => (iso ? iso.slice(0, 10) : "—");
  const statusBadgeClass = (status: string) => {
    const normalized = status.trim().toLowerCase();
    if (normalized === "failed") return "bg-destructive/10 text-destructive";
    if (normalized === "partial") return "bg-warning/10 text-warning";
    return "bg-success/10 text-success";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">WhatsApp Campaigns</h1>
          <p className="text-muted-foreground text-sm">Send targeted broadcasts to {selectedOutlet.name} customers</p>
          <div className="text-muted-foreground text-xs mt-2 max-w-2xl leading-relaxed border border-border/80 bg-muted/30 rounded-lg px-3 py-2.5 space-y-2">
            <p className="font-medium text-foreground/90">How your message is sent</p>
            <p>
              The campaign box is what you want customers to read. How WhatsApp delivers it depends on your settings:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Template set</strong> (in{" "}
                <span className="text-foreground/90">Settings → WhatsApp Integration</span>): we send your Meta-approved
                template and put this text in the first body placeholder{" "}
                <code className="text-[11px] px-0.5 bg-muted rounded">{"{{1}}"}</code>. Use this for people who
                haven&apos;t messaged you recently.
              </li>
              <li>
                <strong>No template:</strong> we send plain session text. That only works if they contacted your
                business WhatsApp within the last 24 hours.
              </li>
              <li>
                If it still doesn&apos;t show up on their phone, check server logs for{" "}
                <code className="text-[11px] px-0.5 bg-muted rounded">whatsapp_outbound_message_failed</code> (common
                code <code className="text-[11px] px-0.5 bg-muted rounded">131047</code> = outside the 24-hour window).
              </li>
            </ul>
          </div>
          {loadError && <p className="text-destructive text-xs mt-1">{loadError}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus size={16} />
          New Campaign
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Campaign", "Audience", "Sent", "Delivered", "Opened", "Responses", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((c) => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{campaignTargetLabel(c.target_type)}</td>
                  <td className="px-4 py-3 text-foreground">{c.sent}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.delivered ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.opened ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.responses ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => void handleResend(c)} className="p-1 rounded hover:bg-muted" title="Resend">
                        <RotateCcw size={14} />
                      </button>
                      <button onClick={() => void handleDelete(c)} className="p-1 rounded hover:bg-muted text-destructive" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No campaigns yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBuilder && (
        <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Create Campaign — {selectedOutlet.name}</h2>
              <button type="button" onClick={() => setShowBuilder(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Weekend Special, VIP Exclusive"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Target Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  {SEGMENTS.map((a) => (
                    <button
                      type="button"
                      key={a.value}
                      onClick={() => setSelectedTarget(a.value)}
                      className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors border ${
                        selectedTarget === a.value ? "border-primary bg-primary/5 text-foreground" : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      <p>{a.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg px-4 py-3">
                <p className="text-sm text-foreground font-medium">
                  Estimated audience:{" "}
                  <span className="text-primary font-bold">{recipientEstimate === null && selectedTarget === "INACTIVE" ? "—" : recipientEstimate ?? "—"}</span>
                  {selectedTarget === "INACTIVE" && (
                    <span className="block text-xs text-muted-foreground mt-1 font-normal">
                      Inactive segment uses last-visit rules on the server (see CRM_INACTIVE_VISIT_DAYS).
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">WhatsApp Preview</label>
                <div className="bg-[hsl(var(--muted))] rounded-xl p-4 max-w-xs border border-border">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center text-white text-xs font-bold">
                      {selectedOutlet.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{selectedOutlet.name}</p>
                      <p className="text-[10px] text-muted-foreground">Business</p>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg rounded-tl-none px-3 py-2.5 text-sm text-foreground whitespace-pre-line shadow-sm relative border border-border">
                    {message}
                    <span className="text-[10px] text-muted-foreground float-right mt-1 ml-2">2:30 PM ✓✓</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 rounded-lg font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
                {sending ? "Sending..." : "Send campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
