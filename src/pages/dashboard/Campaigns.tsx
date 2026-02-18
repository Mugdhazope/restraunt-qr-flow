import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const audiences = ["All Customers", "Repeat Customers", "Last 7 Days Visitors", "VIP Only", "Inactive 14+ Days"];

const audienceCounts: Record<string, number> = {
  "All Customers": 842,
  "Repeat Customers": 320,
  "Last 7 Days Visitors": 156,
  "VIP Only": 89,
  "Inactive 14+ Days": 64,
};

const Campaigns = () => {
  const [selectedAudience, setSelectedAudience] = useState("All Customers");
  const [message, setMessage] = useState("Hey 👋 Weekend special is live! 🍕\nShow this message for 10% off your next order!");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      toast({
        title: "Campaign Sent! 📢",
        description: `Message sent to ${audienceCounts[selectedAudience]} customers in "${selectedAudience}"`,
      });
      setTimeout(() => setSent(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-foreground animate-fade-in">Broadcast Campaign</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Audience */}
        <div className="bg-card rounded-3xl shadow-card p-6 lg:w-80 flex-shrink-0 animate-fade-in">
          <h2 className="font-bold text-foreground mb-4">Select Audience</h2>
          <div className="space-y-2">
            {audiences.map((a) => (
              <button
                key={a}
                onClick={() => setSelectedAudience(a)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all flex justify-between items-center ${
                  selectedAudience === a
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground hover:bg-primary/10"
                }`}
              >
                {a}
                <span className={`text-xs ${selectedAudience === a ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {audienceCounts[a]}
                </span>
              </button>
            ))}
          </div>

          {/* Message editor */}
          <h2 className="font-bold text-foreground mb-2 mt-6">Edit Message</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full bg-background border border-border rounded-2xl p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Right: Preview */}
        <div className="flex-1 bg-card rounded-3xl shadow-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-bold text-foreground mb-4">WhatsApp Preview</h2>

          <div className="bg-background rounded-3xl border-2 border-border p-4 max-w-sm mx-auto">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">🍕</div>
              <div>
                <p className="font-bold text-foreground text-sm">Dough & Joe</p>
                <p className="text-muted-foreground text-[10px]">Business</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 text-sm text-foreground max-w-[85%] whitespace-pre-line">
                {message}
              </div>
              <div className="flex gap-2 max-w-[85%]">
                <button className="flex-1 px-3 py-2 bg-secondary/10 border border-secondary/20 rounded-xl text-xs font-semibold text-secondary">
                  🎉 Claim Now
                </button>
                <button className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-xs font-semibold text-muted-foreground">
                  Later
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-muted-foreground text-xs mt-4">
            Sending to: <span className="font-semibold text-foreground">{selectedAudience}</span> ({audienceCounts[selectedAudience]} customers)
          </p>

          <button
            onClick={handleSend}
            disabled={sending || sent}
            className={`w-full mt-6 font-bold py-4 rounded-full text-lg transition-all duration-200 ${
              sent
                ? "bg-green-500 text-white"
                : "bg-primary text-primary-foreground hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
            } disabled:opacity-80`}
          >
            {sending ? "Sending..." : sent ? "✅ Sent!" : "Send Campaign 📢"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
