import { useState } from "react";
import { automationRules } from "@/data/mockData";
import { Zap, Play, Pause } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Automations = () => {
  const [rules, setRules] = useState(automationRules);

  const toggleRule = (id: number) => {
    setRules(rules.map((r) => r.id === id ? { ...r, status: r.status === "Active" ? "Paused" : "Active" } : r));
    const rule = rules.find((r) => r.id === id);
    toast({ title: rule?.status === "Active" ? "Automation paused" : "Automation activated" });
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
            className={`bg-card border rounded-xl p-5 animate-fade-in ${rule.status === "Active" ? "border-border" : "border-border opacity-60"}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  rule.status === "Active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <Zap size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">TRIGGER</span>
                    <span className="text-sm font-medium text-foreground">{rule.trigger}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">ACTION</span>
                    <span className="text-sm text-foreground">{rule.action}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{rule.runs} times executed</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  rule.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}>
                  {rule.status}
                </span>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {rule.status === "Active" ? <Pause size={16} /> : <Play size={16} />}
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
