import { useState } from "react";

const audiences = ["All Customers", "Repeat Customers", "Last 7 Days Visitors", "VIP Only", "Inactive 14+ Days"];

const Campaigns = () => {
  const [selectedAudience, setSelectedAudience] = useState("All Customers");

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
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  selectedAudience === a
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground hover:bg-primary/10"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 bg-card rounded-3xl shadow-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-bold text-foreground mb-4">WhatsApp Preview</h2>

          {/* Phone mock */}
          <div className="bg-background rounded-3xl border-2 border-border p-4 max-w-sm mx-auto">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">🍕</div>
              <div>
                <p className="font-bold text-foreground text-sm">Dough & Joe</p>
                <p className="text-muted-foreground text-[10px]">Business</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 text-sm text-foreground max-w-[85%]">
                <p>Hey 👋 Weekend special is live! 🍕</p>
                <p className="mt-1">Show this message for <span className="font-bold">10% off</span> your next order!</p>
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
            Sending to: <span className="font-semibold text-foreground">{selectedAudience}</span>
          </p>

          <button className="w-full mt-6 bg-primary text-primary-foreground font-bold py-4 rounded-full text-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            Send Campaign 📢
          </button>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
