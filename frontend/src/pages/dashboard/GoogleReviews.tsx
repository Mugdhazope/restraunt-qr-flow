import { reviewFunnelStats } from "@/data/mockData";
import { MessageSquare, ThumbsUp, Send, Star, ArrowRight } from "lucide-react";

const funnelSteps = [
  { label: "Feedback Received", value: reviewFunnelStats.feedbackReceived, icon: MessageSquare, color: "bg-foreground/10 text-foreground" },
  { label: "Positive Feedback", value: reviewFunnelStats.positiveFeedback, icon: ThumbsUp, color: "bg-success/10 text-success" },
  { label: "Review Requests Sent", value: reviewFunnelStats.reviewRequestsSent, icon: Send, color: "bg-primary/10 text-primary" },
  { label: "Google Reviews Generated", value: reviewFunnelStats.googleReviewsGenerated, icon: Star, color: "bg-warning/10 text-warning" },
];

const GoogleReviews = () => {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Google Reviews</h1>
        <p className="text-muted-foreground text-sm">Automate review collection from happy customers</p>
      </div>

      {/* Funnel Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
        {funnelSteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="bg-card border border-border rounded-xl p-4 relative" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className={`w-9 h-9 rounded-lg ${step.color} flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-foreground">{step.value}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{step.label}</p>
              {i < funnelSteps.length - 1 && (
                <ArrowRight size={14} className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 hidden lg:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* Conversion rate */}
      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Review Funnel Conversion</h3>
        <div className="space-y-4">
          {[
            { label: "Feedback → Positive", value: Math.round((reviewFunnelStats.positiveFeedback / reviewFunnelStats.feedbackReceived) * 100) },
            { label: "Positive → Request Sent", value: Math.round((reviewFunnelStats.reviewRequestsSent / reviewFunnelStats.positiveFeedback) * 100) },
            { label: "Request → Review", value: Math.round((reviewFunnelStats.googleReviewsGenerated / reviewFunnelStats.reviewRequestsSent) * 100) },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow visualization */}
      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Automation Workflow</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {[
            { step: "1", label: "Customer gives feedback" },
            { step: "2", label: "Positive sentiment detected" },
            { step: "3", label: "Review prompt sent via WhatsApp" },
            { step: "4", label: "Customer posts Google review" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {s.step}
                </div>
                <span className="text-sm text-foreground whitespace-nowrap">{s.label}</span>
              </div>
              {i < 3 && <ArrowRight size={14} className="text-muted-foreground hidden sm:block flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Review message preview */}
      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.25s" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Review Request Message Preview</h3>
        <div className="max-w-sm mx-auto bg-muted/50 rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success text-xs font-bold">DJ</div>
            <div>
              <p className="font-medium text-foreground text-sm">Dough & Joe</p>
              <p className="text-muted-foreground text-[10px]">WhatsApp Business</p>
            </div>
          </div>
          <div className="bg-card rounded-lg px-3 py-2.5 text-sm text-foreground">
            <p>Hi Mugdha! 👋</p>
            <p className="mt-1.5">Thank you for your wonderful feedback! We'd love it if you could share your experience on Google. It really helps us.</p>
            <p className="mt-1.5 text-primary font-medium">→ Leave a Google Review</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleReviews;
