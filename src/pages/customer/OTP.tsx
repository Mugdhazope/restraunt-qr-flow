import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const OTP = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) refs[index + 1].current?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => navigate("/reward"), 1500);
  };

  return (
    <div className="min-h-screen bg-background checker-bg flex flex-col items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-card p-8 max-w-sm w-full animate-scale-in text-center">
        <h2 className="text-2xl font-extrabold text-foreground mb-2">Almost there 👋</h2>
        <p className="text-muted-foreground text-sm mb-8">Enter the 4-digit code we sent you</p>

        <div className="flex justify-center gap-4 mb-8">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-16 h-16 rounded-full bg-background border-2 border-border text-center text-2xl font-bold text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-full text-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Verifying...
            </span>
          ) : (
            "Unlock Now 🔓"
          )}
        </button>
      </div>
    </div>
  );
};

export default OTP;
