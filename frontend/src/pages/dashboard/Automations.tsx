import { useEffect, useState } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { apiFetch, automationsUrl, automationDetailUrl, fetchAllPages, type ApiAutomationRule } from "@/lib/api";
import { Zap, Play, Pause } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Automations = () => {
  const { selectedOutlet } = useRestaurant();
  const slug = selectedOutlet.restaurantId;
  const [rules, setRules] = useState<ApiAutomationRule[]>([]);

  useEffect(() => {
    void fetchAllPages<ApiAutomationRule>(automationsUrl(slug))
      .then(setRules)
      .catch(() => setRules([]));
  }, [slug]);

  const toggleRule = async (rule: ApiAutomationRule) => {
    const next = !rule.enabled;
    await apiFetch<ApiAutomationRule>(automationDetailUrl(slug, rule.id), {
      method: "PATCH",
      body: JSON.stringify({ enabled: next }),
    });
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: next } : r)));
    toast({ title: next ? "Automation activated" : "Automation paused" });
  };

  const saveRule = async (rule: ApiAutomationRule) => {
    await apiFetch<ApiAutomationRule>(automationDetailUrl(slug, rule.id), {
      method: "PATCH",
      body: JSON.stringify({
        delay_minutes: rule.delay_minutes,
        message_template: rule.message_template,
      }),
    });
    toast({ title: "Automation updated" });
  };

  const triggerLabel = (trigger: ApiAutomationRule["trigger_type"]) => {
    if (trigger === "positive_feedback") return "Rating >= 4";
    if (trigger === "no_visit_14_days") return "No visit for 14 days";
    return "3rd visit completed";
  };

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Automations</h1>
        <p className="text-muted-foreground text-sm">Automated workflows triggered by customer actions</p>
      </div>

      <div className="space-y-3">
        {rules.map((rule, i) => (
          <div
            key={rule.id}
            className={`bg-card border rounded-xl p-5 animate-fade-in ${rule.enabled ? "border-border" : "border-border opacity-60"}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  rule.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <Zap size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">TRIGGER</span>
                    <span className="text-sm font-medium text-foreground">{triggerLabel(rule.trigger_type)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">ACTION</span>
                    <textarea
                      value={rule.message_template}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r) => (r.id === rule.id ? { ...r, message_template: e.target.value } : r)),
                        )
                      }
                      className="text-sm text-foreground bg-background border border-border rounded px-2 py-1 w-full"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Delay (min)</span>
                    <input
                      type="number"
                      min={0}
                      value={rule.delay_minutes}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r) =>
                            r.id === rule.id ? { ...r, delay_minutes: Number(e.target.value || 0) } : r,
                          ),
                        )
                      }
                      className="w-20 text-xs bg-background border border-border rounded px-2 py-1"
                    />
                    <button
                      onClick={() => void saveRule(rule)}
                      className="text-xs px-2 py-1 border border-border rounded hover:bg-muted"
                    >
                      Save
                    </button>
                    <span className="text-xs text-muted-foreground">
                      Last run: {rule.last_run_at ? new Date(rule.last_run_at).toLocaleString() : "never"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  rule.enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}>
                  {rule.enabled ? "Active" : "Paused"}
                </span>
                <button
                  onClick={() => void toggleRule(rule)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {rule.enabled ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Automations;
