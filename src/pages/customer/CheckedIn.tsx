import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";
import confetti from "canvas-confetti";
import { Check, Gift } from "lucide-react";

const CheckedIn = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { customer } = useCustomer();

  useEffect(() => {
    const end = Date.now() + 1500;
    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#1a1a2e", "#ef4444", "#f59e0b"] });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#1a1a2e", "#ef4444", "#f59e0b"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-scale-in text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <Check size={32} className="text-success" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">You're Checked In!</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            {customer?.name ? `Welcome, ${customer.name}!` : "Welcome!"}
          </p>
        </div>

        {/* Reward card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-3">
            <Gift size={24} className="text-warning" />
          </div>
          <h2 className="font-bold text-foreground text-lg">Free Cookie on Your Next Visit</h2>
          <p className="text-muted-foreground text-sm mt-1">Valid for 5 days</p>
          <p className="text-muted-foreground text-xs mt-3 pt-3 border-t border-border">Check WhatsApp for details</p>
        </div>

        {/* Loyalty progress */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-medium text-foreground mb-3">Loyalty Progress</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1 ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                {step === 1 ? "✓" : step}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs mt-3">1 of 5 visits · Get 10% off your next pizza after 5 visits</p>
          <div className="mt-3 w-full bg-muted rounded-full h-1.5">
            <div className="bg-foreground h-1.5 rounded-full" style={{ width: "20%" }} />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => navigate(`/scan/${restaurantId || "doughandjoe"}/menu`)}
            className="w-full bg-foreground text-background font-medium py-3 rounded-lg text-sm hover:bg-foreground/90 transition-colors"
          >
            View Menu
          </button>
          <button
            onClick={() => navigate(`/scan/${restaurantId || "doughandjoe"}/feedback`)}
            className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors py-2"
          >
            Share Your Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckedIn;
