import { useState, useEffect, useCallback } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import {
  apiFetch,
  fetchAllPages,
  messageTemplateDetailUrl,
  messageTemplatesUrl,
  restaurantDetailUrl,
  type ApiRestaurant,
  type MessageTemplate,
  type ScannerThemeOverrides,
  type ScannerTagStyle,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_TAG_EMOJIS, type TagEmojiKey } from "@/data/restaurantThemes";

const TAG_ROWS: { key: TagEmojiKey; label: string }[] = [
  { key: "new", label: "New" },
  { key: "featured", label: "Featured" },
  { key: "popular", label: "Popular" },
  { key: "bestseller", label: "Bestseller" },
  { key: "chefs_pick", label: "Chef's Pick" },
  { key: "jain", label: "Jain" },
];

const emptyTag = (): ScannerTagStyle => ({ bg: "", text: "", emoji: "" });

const Settings = () => {
  const { outlets, selectedOutlet, refreshOutlets } = useRestaurant();
  const slug = selectedOutlet.restaurantId;
  const [activeTab, setActiveTab] = useState("outlets");

  const [wa, setWa] = useState({
    whatsapp_number: "",
    whatsapp_api_token: "",
    whatsapp_phone_number_id: "",
    whatsapp_broadcast_template_name: "",
    whatsapp_broadcast_template_language: "en",
    whatsapp_otp_template_name: "",
    whatsapp_otp_template_language: "en",
    whatsapp_feedback_template_name: "",
    whatsapp_feedback_template_language: "en",
    sms_api_key: "",
    sms_sender_id: "",
    sms_template_id: "",
    google_review_link: "",
  });
  const [waLoading, setWaLoading] = useState(false);

  const [appearanceBg, setAppearanceBg] = useState("");
  const [appearanceTags, setAppearanceTags] = useState<Record<TagEmojiKey, ScannerTagStyle>>({
    new: emptyTag(),
    featured: emptyTag(),
    popular: emptyTag(),
    bestseller: emptyTag(),
    chefs_pick: emptyTag(),
    jain: emptyTag(),
  });
  const [appearanceLoading, setAppearanceLoading] = useState(false);
  const [appearanceSaving, setAppearanceSaving] = useState(false);

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [tplLoading, setTplLoading] = useState(false);
  const [editingTpl, setEditingTpl] = useState<MessageTemplate | null>(null);
  const [newTplName, setNewTplName] = useState("");
  const [newTplBody, setNewTplBody] = useState("");

  const loadWhatsapp = useCallback(async () => {
    setWaLoading(true);
    try {
      const r = await apiFetch<ApiRestaurant>(restaurantDetailUrl(slug));
      setWa({
        whatsapp_number: r.whatsapp_number || "",
        whatsapp_api_token: "",
        whatsapp_phone_number_id: r.whatsapp_phone_number_id || "",
        whatsapp_broadcast_template_name: r.whatsapp_broadcast_template_name || "",
        whatsapp_broadcast_template_language: r.whatsapp_broadcast_template_language || "en",
        whatsapp_otp_template_name: r.whatsapp_otp_template_name || "",
        whatsapp_otp_template_language: r.whatsapp_otp_template_language || "en",
        whatsapp_feedback_template_name: r.whatsapp_feedback_template_name || "",
        whatsapp_feedback_template_language: r.whatsapp_feedback_template_language || "en",
        sms_api_key: "",
        sms_sender_id: r.sms_sender_id || "",
        sms_template_id: r.sms_template_id || "",
        google_review_link: r.google_review_link || "",
      });
    } catch {
      toast({ title: "Could not load outlet settings", variant: "destructive" });
    } finally {
      setWaLoading(false);
    }
  }, [slug]);

  const loadTemplates = useCallback(async () => {
    setTplLoading(true);
    try {
      const rows = await fetchAllPages<MessageTemplate>(messageTemplatesUrl(slug));
      setTemplates(rows);
    } catch {
      setTemplates([]);
    } finally {
      setTplLoading(false);
    }
  }, [slug]);

  const loadAppearance = useCallback(async () => {
    setAppearanceLoading(true);
    try {
      const r = await apiFetch<ApiRestaurant>(restaurantDetailUrl(slug));
      const st = r.scanner_theme || {};
      setAppearanceBg(st.background || "");
      const tagEmoji = (key: TagEmojiKey) => {
        const row = st.tags?.[key];
        if (row && Object.prototype.hasOwnProperty.call(row, "emoji")) {
          return row.emoji ?? "";
        }
        return DEFAULT_TAG_EMOJIS[key];
      };
      setAppearanceTags({
        new: { bg: st.tags?.new?.bg || "", text: st.tags?.new?.text || "", emoji: tagEmoji("new") },
        featured: {
          bg: st.tags?.featured?.bg || "",
          text: st.tags?.featured?.text || "",
          emoji: tagEmoji("featured"),
        },
        popular: {
          bg: st.tags?.popular?.bg || "",
          text: st.tags?.popular?.text || "",
          emoji: tagEmoji("popular"),
        },
        bestseller: {
          bg: st.tags?.bestseller?.bg || "",
          text: st.tags?.bestseller?.text || "",
          emoji: tagEmoji("bestseller"),
        },
        chefs_pick: {
          bg: st.tags?.chefs_pick?.bg || "",
          text: st.tags?.chefs_pick?.text || "",
          emoji: tagEmoji("chefs_pick"),
        },
        jain: { bg: st.tags?.jain?.bg || "", text: st.tags?.jain?.text || "", emoji: tagEmoji("jain") },
      });
    } catch {
      toast({ title: "Could not load appearance", variant: "destructive" });
    } finally {
      setAppearanceLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (activeTab === "whatsapp" || activeTab === "google") void loadWhatsapp();
    if (activeTab === "templates") void loadTemplates();
    if (activeTab === "appearance") void loadAppearance();
  }, [activeTab, loadWhatsapp, loadTemplates, loadAppearance]);

  const saveAppearance = async () => {
    setAppearanceSaving(true);
    try {
      const tags: NonNullable<ScannerThemeOverrides["tags"]> = {};
      (Object.keys(appearanceTags) as TagEmojiKey[]).forEach((key) => {
        const row = appearanceTags[key];
        const entry: ScannerTagStyle = {};
        if (row.bg?.trim()) entry.bg = row.bg.trim();
        if (row.text?.trim()) entry.text = row.text.trim();
        // Always persist emoji ("" clears default and shows no emoji on chips)
        entry.emoji = (row.emoji ?? "").trim();
        tags[key] = entry;
      });
      const scanner_theme: ScannerThemeOverrides = {};
      if (appearanceBg.trim()) scanner_theme.background = appearanceBg.trim();
      if (Object.keys(tags).length) scanner_theme.tags = tags;
      await apiFetch(restaurantDetailUrl(slug), {
        method: "PATCH",
        body: JSON.stringify({ scanner_theme }),
      });
      toast({ title: "Appearance saved" });
      await loadAppearance();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Save failed", variant: "destructive" });
    } finally {
      setAppearanceSaving(false);
    }
  };

  const saveWhatsapp = async () => {
    setWaLoading(true);
    try {
      const body: Record<string, string> = {
        whatsapp_number: wa.whatsapp_number,
        whatsapp_phone_number_id: wa.whatsapp_phone_number_id,
        whatsapp_broadcast_template_name: wa.whatsapp_broadcast_template_name.trim(),
        whatsapp_broadcast_template_language: wa.whatsapp_broadcast_template_language.trim() || "en",
        whatsapp_otp_template_name: wa.whatsapp_otp_template_name.trim(),
        whatsapp_otp_template_language: wa.whatsapp_otp_template_language.trim() || "en",
        whatsapp_feedback_template_name: wa.whatsapp_feedback_template_name.trim(),
        whatsapp_feedback_template_language: wa.whatsapp_feedback_template_language.trim() || "en",
        sms_sender_id: wa.sms_sender_id.trim(),
        sms_template_id: wa.sms_template_id.trim(),
        google_review_link: wa.google_review_link,
      };
      if (wa.whatsapp_api_token.trim()) body.whatsapp_api_token = wa.whatsapp_api_token.trim();
      if (wa.sms_api_key.trim()) body.sms_api_key = wa.sms_api_key.trim();
      await apiFetch(restaurantDetailUrl(slug), { method: "PATCH", body: JSON.stringify(body) });
      toast({ title: "Settings saved" });
      await loadWhatsapp();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Save failed", variant: "destructive" });
    } finally {
      setWaLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!newTplName.trim() || !newTplBody.trim()) {
      toast({ title: "Name and body required", variant: "destructive" });
      return;
    }
    try {
      if (editingTpl) {
        await apiFetch(messageTemplateDetailUrl(slug, editingTpl.id), {
          method: "PATCH",
          body: JSON.stringify({ name: newTplName.trim(), body: newTplBody.trim() }),
        });
        toast({ title: "Template updated" });
      } else {
        await apiFetch(messageTemplatesUrl(slug), {
          method: "POST",
          body: JSON.stringify({ name: newTplName.trim(), body: newTplBody.trim() }),
        });
        toast({ title: "Template created" });
      }
      setEditingTpl(null);
      setNewTplName("");
      setNewTplBody("");
      await loadTemplates();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const deleteTemplate = async (id: number) => {
    try {
      await apiFetch(messageTemplateDetailUrl(slug, id), { method: "DELETE" });
      await loadTemplates();
      toast({ title: "Template deleted" });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const tabs = [
    { id: "outlets", label: "Outlets" },
    { id: "appearance", label: "Appearance" },
    // WA_DISABLED — re-enable WhatsApp / SMS / OTP settings with messaging
    // { id: "whatsapp", label: "WhatsApp Integration" },
    // { id: "templates", label: "Message Templates" },
    { id: "google", label: "Google Review Link" },
  ];

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and integrations</p>
      </div>

      <div className="flex gap-1 border-b border-border animate-fade-in overflow-x-auto">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {activeTab === "outlets" && (
          <div className="space-y-4">
            {outlets.map((o) => (
              <div key={o.restaurantId} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{o.name}</p>
                  <p className="text-muted-foreground text-sm">{o.location || "—"}</p>
                  <p className="text-muted-foreground text-xs mt-1">Slug: {o.restaurantId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshOutlets()}
                  className="px-3 py-1.5 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Refresh list
                </button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              New outlets are created in Django admin (or a future admin API). This list loads from{" "}
              <code className="text-foreground">GET /api/restaurants/</code>.
            </p>
          </div>
        )}

        {activeTab === "whatsapp" && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            {waLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">WhatsApp Business Phone Number</label>
              <input
                value={wa.whatsapp_number}
                onChange={(e) => setWa((w) => ({ ...w, whatsapp_number: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">API Access Token</label>
              <input
                type="password"
                value={wa.whatsapp_api_token}
                onChange={(e) => setWa((w) => ({ ...w, whatsapp_api_token: e.target.value }))}
                placeholder="Leave blank to keep existing"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">Saved tokens are masked in API responses.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number ID</label>
              <input
                value={wa.whatsapp_phone_number_id}
                onChange={(e) => setWa((w) => ({ ...w, whatsapp_phone_number_id: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Campaign broadcast template name (Meta)
              </label>
              <input
                value={wa.whatsapp_broadcast_template_name}
                onChange={(e) => setWa((w) => ({ ...w, whatsapp_broadcast_template_name: e.target.value }))}
                placeholder="e.g. restaurant_promo (approved in WhatsApp Manager)"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                When set, WhatsApp Campaigns send this <strong>approved</strong> template and put the dashboard message
                into the template&apos;s first body variable (<code className="text-foreground">{"{{1}}"}</code>). Leave
                blank to send plain session text (only works inside the 24-hour window).
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Template language code</label>
              <input
                value={wa.whatsapp_broadcast_template_language}
                onChange={(e) => setWa((w) => ({ ...w, whatsapp_broadcast_template_language: e.target.value }))}
                placeholder="en or en_US"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Login OTP template name (Meta)
              </label>
              <input
                value={wa.whatsapp_otp_template_name}
                onChange={(e) => setWa((w) => ({ ...w, whatsapp_otp_template_name: e.target.value }))}
                placeholder="e.g. login_otp — approved template; body uses {{1}} for the code"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Required</strong> for QR login: the API sends this approved template only (Meta blocks plain
                OTP text outside the 24-hour session window, error 131047). In WhatsApp Manager, create an
                Authentication or Utility template whose body has a single variable{" "}
                <code className="text-foreground">{"{{1}}"}</code> for the code. Use the exact template name and
                language here (e.g. <code className="text-foreground">en_US</code> if that is what Meta shows), or set{" "}
                <code className="text-foreground">WHATSAPP_OTP_TEMPLATE_NAME</code> in the server environment.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">OTP template language code</label>
              <input
                value={wa.whatsapp_otp_template_language}
                onChange={(e) => setWa((w) => ({ ...w, whatsapp_otp_template_language: e.target.value }))}
                placeholder="en"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Feedback template name (Meta)
              </label>
              <input
                value={wa.whatsapp_feedback_template_name}
                onChange={(e) => setWa((w) => ({ ...w, whatsapp_feedback_template_name: e.target.value }))}
                placeholder="e.g. feedback_message"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Feedback template language code
              </label>
              <input
                value={wa.whatsapp_feedback_template_language}
                onChange={(e) => setWa((w) => ({ ...w, whatsapp_feedback_template_language: e.target.value }))}
                placeholder="en"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">SMS API Key (MSG91)</label>
              <input
                type="password"
                value={wa.sms_api_key}
                onChange={(e) => setWa((w) => ({ ...w, sms_api_key: e.target.value }))}
                placeholder="Leave blank to keep existing"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">Saved keys are masked in API responses.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">SMS Sender ID</label>
              <input
                value={wa.sms_sender_id}
                onChange={(e) => setWa((w) => ({ ...w, sms_sender_id: e.target.value }))}
                placeholder="e.g. DOUGHJ"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">SMS Template ID (OTP)</label>
              <input
                value={wa.sms_template_id}
                onChange={(e) => setWa((w) => ({ ...w, sms_template_id: e.target.value }))}
                placeholder="MSG91 template id"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Development fallback: if these are empty, backend uses SMS_* environment variables.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Google review link</label>
              <input
                value={wa.google_review_link}
                onChange={(e) => setWa((w) => ({ ...w, google_review_link: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              disabled={waLoading}
              onClick={() => void saveWhatsapp()}
              className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">{editingTpl ? "Edit template" : "New template"}</p>
              <input
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                placeholder="Template name"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                value={newTplBody}
                onChange={(e) => setNewTplBody(e.target.value)}
                placeholder="Message body"
                rows={3}
                className="w-full bg-background border border-border rounded-lg p-3 text-sm resize-none"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => void saveTemplate()} className="bg-foreground text-background px-3 py-2 rounded-lg text-sm">
                  {editingTpl ? "Update" : "Create"}
                </button>
                {editingTpl && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTpl(null);
                      setNewTplName("");
                      setNewTplBody("");
                    }}
                    className="border border-border px-3 py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            {tplLoading && <p className="text-xs text-muted-foreground">Loading templates…</p>}
            {templates.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="font-medium text-foreground text-sm">{t.name}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTpl(t);
                        setNewTplName(t.name);
                        setNewTplBody(t.body);
                      }}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => void deleteTemplate(t.id)} className="text-xs text-destructive font-medium hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">{t.body}</p>
              </div>
            ))}
            {templates.length === 0 && !tplLoading && <p className="text-sm text-muted-foreground">No templates yet.</p>}
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-6">
            {appearanceLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">QR menu background</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Overrides the scanner page background. Leave blank to use the brand default.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Background color picker"
                  value={/^#[0-9a-fA-F]{6}$/.test(appearanceBg) ? appearanceBg : "#f0ebe4"}
                  onChange={(e) => setAppearanceBg(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-border bg-background"
                />
                <input
                  value={appearanceBg}
                  onChange={(e) => setAppearanceBg(e.target.value)}
                  placeholder="#f0ebe4"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">Tag styles</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Customize chip background, text color, and emoji. Clear emoji to show text only (no icon).
              </p>
              <div className="space-y-3">
                {TAG_ROWS.map(({ key, label }) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 sm:grid-cols-[7rem_1fr] gap-2 sm:gap-3 items-start border border-border rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 pt-2">
                      <span
                        className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold"
                        style={{
                          background: appearanceTags[key].bg || "#e5e7eb",
                          color: appearanceTags[key].text || "#111827",
                        }}
                      >
                        {(appearanceTags[key].emoji || "").trim()
                          ? `${appearanceTags[key].emoji!.trim()} ${label}`
                          : label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Bg</label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            aria-label={`${label} background`}
                            value={/^#[0-9a-fA-F]{6}$/.test(appearanceTags[key].bg || "") ? appearanceTags[key].bg! : "#10b981"}
                            onChange={(e) =>
                              setAppearanceTags((t) => ({ ...t, [key]: { ...t[key], bg: e.target.value } }))
                            }
                            className="h-9 w-9 shrink-0 cursor-pointer rounded border border-border"
                          />
                          <input
                            value={appearanceTags[key].bg || ""}
                            onChange={(e) =>
                              setAppearanceTags((t) => ({ ...t, [key]: { ...t[key], bg: e.target.value } }))
                            }
                            placeholder="#hex"
                            className="w-full min-w-0 bg-background border border-border rounded-md px-2 py-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Text</label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            aria-label={`${label} text`}
                            value={/^#[0-9a-fA-F]{6}$/.test(appearanceTags[key].text || "") ? appearanceTags[key].text! : "#ffffff"}
                            onChange={(e) =>
                              setAppearanceTags((t) => ({ ...t, [key]: { ...t[key], text: e.target.value } }))
                            }
                            className="h-9 w-9 shrink-0 cursor-pointer rounded border border-border"
                          />
                          <input
                            value={appearanceTags[key].text || ""}
                            onChange={(e) =>
                              setAppearanceTags((t) => ({ ...t, [key]: { ...t[key], text: e.target.value } }))
                            }
                            placeholder="#hex"
                            className="w-full min-w-0 bg-background border border-border rounded-md px-2 py-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Emoji</label>
                        <input
                          value={appearanceTags[key].emoji || ""}
                          onChange={(e) =>
                            setAppearanceTags((t) => ({ ...t, [key]: { ...t[key], emoji: e.target.value } }))
                          }
                          placeholder="(none)"
                          maxLength={8}
                          className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={appearanceLoading || appearanceSaving}
              onClick={() => void saveAppearance()}
              className="bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {appearanceSaving ? "Saving…" : "Save appearance"}
            </button>
            <p className="text-xs text-muted-foreground">
              Changes apply on the next QR menu load for this outlet.
            </p>
          </div>
        )}

        {activeTab === "google" && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            {waLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Google review link</label>
              <input
                value={wa.google_review_link}
                onChange={(e) => setWa((w) => ({ ...w, google_review_link: e.target.value }))}
                placeholder="https://g.page/..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              disabled={waLoading}
              onClick={() => void saveWhatsapp()}
              className="bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
            <p className="text-xs text-muted-foreground">
              WhatsApp / SMS / OTP settings are temporarily disabled for QR-menu-only mode.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
