import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="min-h-screen bg-background checker-bg flex flex-col items-center justify-center p-4">
      {/* Header bubble */}
      <div className="bg-primary rounded-3xl px-8 py-4 mb-8 shadow-glow animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary-foreground text-center">
          Welcome to Dough & Joe 🍕
        </h1>
      </div>

      {/* Card */}
      <div className="bg-card rounded-3xl shadow-card p-8 max-w-md w-full animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <div className="text-center mb-6">
          <span className="text-4xl mb-3 block">🎁</span>
          <h2 className="text-xl font-bold text-foreground mb-1">Unlock a surprise reward</h2>
          <p className="text-muted-foreground text-sm">Enter your details to get started</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-5 py-3.5 rounded-2xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-5 py-3.5 rounded-2xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <button
            onClick={() => navigate("/otp")}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-full text-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Get My Reward 🎁
          </button>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-5">
          Receive exclusive perks & updates on WhatsApp
        </p>
      </div>
    </div>
  );
};

export default Welcome;
