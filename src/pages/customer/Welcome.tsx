import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome to Dough & Joe</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Scan, check in, and enjoy your visit.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          />
          <button
            onClick={() => navigate("/otp")}
            className="w-full bg-foreground text-background font-medium py-3 rounded-lg text-sm hover:bg-foreground/90 transition-colors"
          >
            Continue
          </button>
        </div>

        <p className="text-center text-muted-foreground text-xs">
          You'll receive exclusive perks & updates on WhatsApp
        </p>
      </div>
    </div>
  );
};

export default Welcome;
