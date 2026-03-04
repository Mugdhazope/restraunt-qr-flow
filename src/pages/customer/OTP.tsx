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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verify your number</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Enter the 4-digit code we sent you</p>
        </div>

        <div className="flex justify-center gap-3">
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
              className="w-14 h-14 rounded-lg bg-card border border-border text-center text-xl font-semibold text-foreground focus:border-foreground focus:ring-1 focus:ring-ring outline-none transition-all"
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || otp.some((d) => !d)}
          className="w-full bg-foreground text-background font-medium py-3 rounded-lg text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              Verifying...
            </span>
          ) : (
            "Verify"
          )}
        </button>

        <button className="text-muted-foreground text-sm hover:text-foreground transition-colors">
          Resend code
        </button>
      </div>
    </div>
  );
};

export default OTP;
