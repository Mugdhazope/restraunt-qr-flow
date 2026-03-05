import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";

const SIMULATED_OTP = "482916";

const OTP = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { customer, addCheckin } = useCustomer();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSimulated, setShowSimulated] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  useEffect(() => {
    // Show simulated OTP after 1.5s
    const t = setTimeout(() => setShowSimulated(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");
    if (value && index < 5) refs[index + 1].current?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      refs[5].current?.focus();
    }
  }, []);

  const handleSubmit = () => {
    const entered = otp.join("");
    if (entered.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }
    if (entered !== SIMULATED_OTP) {
      setError("Incorrect OTP. Please try again.");
      return;
    }
    setLoading(true);
    if (customer) {
      addCheckin(customer);
    }
    setTimeout(() => navigate(`/scan/${restaurantId || "doughandjoe"}/checked-in`), 1200);
  };

  const handleResend = () => {
    setCountdown(30);
    setCanResend(false);
    setShowSimulated(false);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setTimeout(() => setShowSimulated(true), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verify your number</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Enter the 6-digit code sent to +91 {customer?.phone ? `${customer.phone.slice(0, 5)} ${customer.phone.slice(5)}` : "•••••"}
          </p>
        </div>

        {/* Simulated OTP banner */}
        {showSimulated && (
          <div className="bg-muted border border-border rounded-lg px-4 py-3 text-left animate-fade-in">
            <p className="text-xs text-muted-foreground mb-0.5">Simulated SMS</p>
            <p className="text-sm text-foreground font-mono tracking-widest">{SIMULATED_OTP}</p>
          </div>
        )}

        <div className="flex justify-center gap-2" onPaste={handlePaste}>
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
              className={`w-12 h-14 rounded-lg bg-card border text-center text-xl font-semibold text-foreground outline-none transition-all ${
                error ? "border-destructive" : "border-border focus:border-foreground focus:ring-1 focus:ring-ring"
              }`}
            />
          ))}
        </div>

        {error && <p className="text-destructive text-sm animate-fade-in">{error}</p>}

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

        <button
          onClick={handleResend}
          disabled={!canResend}
          className="text-muted-foreground text-sm hover:text-foreground transition-colors disabled:opacity-50"
        >
          {canResend ? "Resend code" : `Resend in ${countdown}s`}
        </button>
      </div>
    </div>
  );
};

export default OTP;
