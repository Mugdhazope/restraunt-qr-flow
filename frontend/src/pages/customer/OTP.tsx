import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";
import { postResendOtp, postVerifyOtp, setCustomerScanSession, type OtpDeliveryChannel } from "@/lib/api";
import { toIndiaE164 } from "@/lib/phoneE164";
import { resolveScanContext } from "@/lib/scanContext";
import { useScannerTheme } from "@/lib/useScannerTheme";

const SIMULATED_OTP = "482916";

const SIMULATE_OTP =
  import.meta.env.DEV && String(import.meta.env.VITE_SIMULATE_OTP || "").toLowerCase() === "true";

const OTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { apiSlug, menuKey } = useMemo(() => resolveScanContext(restaurantId), [restaurantId]);
  const pathSegment = restaurantId || menuKey;
  const { theme } = useScannerTheme(apiSlug, menuKey);
  const { customer, setCustomer, addCheckin } = useCustomer();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSimulated, setShowSimulated] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [deliveryChannel, setDeliveryChannel] = useState<OtpDeliveryChannel>(() => {
    const st = location.state as { deliveryChannel?: OtpDeliveryChannel } | null;
    return st?.deliveryChannel ?? "sms";
  });
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const ref4 = useRef<HTMLInputElement>(null);
  const ref5 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3, ref4, ref5];

  useEffect(() => {
    if (!SIMULATE_OTP) return;
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

  const phoneE164 = customer?.phone ? toIndiaE164(customer.phone) : "";

  const handleSubmit = async () => {
    const entered = otp.join("");
    if (entered.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }
    if (!customer?.phone) {
      setError("Session expired. Go back and enter your details again.");
      return;
    }

    if (SIMULATE_OTP) {
      if (entered !== SIMULATED_OTP) {
        setError("Incorrect OTP. Please try again.");
        return;
      }
      setLoading(true);
      const nextVisits = (customer.totalVisits ?? 0) + 1;
      const updated = { ...customer, totalVisits: nextVisits, visitTimestamp: new Date().toISOString() };
      setCustomer(updated);
      addCheckin(updated);
      setTimeout(() => navigate(`/scan/${pathSegment}/checked-in`), 1200);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await postVerifyOtp({
        restaurant_slug: apiSlug,
        phone: phoneE164,
        otp: entered,
        name: customer.name,
      });
      if (res.success && res.access && res.refresh) {
        setCustomerScanSession(apiSlug, res.access, res.refresh);
        const updated = {
          ...customer,
          totalVisits:
            typeof res.total_visits === "number" ? res.total_visits : (customer.totalVisits ?? 1),
          visitTimestamp: new Date().toISOString(),
          restaurantSlug: apiSlug,
        };
        setCustomer(updated);
        addCheckin(updated);
        navigate(`/scan/${pathSegment}/checked-in`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCountdown(30);
    setCanResend(false);
    setShowSimulated(false);
    setOtp(["", "", "", "", "", ""]);
    setError("");

    if (SIMULATE_OTP) {
      setTimeout(() => setShowSimulated(true), 1500);
      return;
    }

    if (!customer?.phone || !customer.name) return;
    try {
      const out = await postResendOtp({
        restaurant_slug: apiSlug,
        phone: phoneE164,
        name: customer.name,
      });
      if (out.delivery_channel) setDeliveryChannel(out.delivery_channel);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend code");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
        <div>
          <h1
            className="text-2xl text-foreground"
            style={{
              fontFamily: theme.typography.fonts.heading,
              fontWeight: theme.typography.weights.heading,
              letterSpacing: theme.typography.letterSpacing.heading,
              lineHeight: theme.typography.lineHeights.compact,
            }}
          >
            Verify your number
          </h1>
          <p
            className="text-muted-foreground mt-1.5"
            style={{
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.scale.sm,
              marginTop: theme.typography.spacing.titleToDescription,
              letterSpacing: theme.typography.letterSpacing.body,
              lineHeight: theme.typography.lineHeights.relaxed,
            }}
          >
            Enter the 6-digit code sent to +91{" "}
            {customer?.phone ? `${customer.phone.slice(0, 5)} ${customer.phone.slice(5)}` : "•••••"}
          </p>
        </div>

        {SIMULATE_OTP && showSimulated && (
          <div className="bg-muted border border-border rounded-lg px-4 py-3 text-left animate-fade-in">
            <p className="text-xs text-muted-foreground mb-0.5" style={{ fontFamily: theme.typography.fonts.ui }}>
              Simulated SMS (dev)
            </p>
            <p
              className="text-sm text-foreground tracking-widest"
              style={{ fontFamily: theme.typography.fonts.price, fontWeight: theme.typography.weights.price }}
            >
              {SIMULATED_OTP}
            </p>
          </div>
        )}

        {!SIMULATE_OTP && (
          <p className="text-xs text-muted-foreground text-left px-1">
            {deliveryChannel === "whatsapp"
              ? "Check WhatsApp for your 6-digit code (from this restaurant's business number). It may take a few seconds."
              : "Check your text messages (SMS) for the code. It may take a few seconds."}
          </p>
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
              className={`w-12 h-14 rounded-lg bg-card border text-center text-xl text-foreground outline-none transition-all ${
                error ? "border-destructive" : "border-border focus:border-foreground focus:ring-1 focus:ring-ring"
              }`}
              style={{
                fontFamily: theme.typography.fonts.price,
                fontWeight: theme.typography.weights.price,
                letterSpacing: theme.typography.letterSpacing.heading,
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-destructive text-sm animate-fade-in" style={{ fontFamily: theme.typography.fonts.ui }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={loading || otp.some((d) => !d)}
          className="w-full bg-foreground text-background py-3 rounded-lg text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
          style={{
            fontFamily: theme.typography.fonts.ui,
            fontWeight: theme.typography.weights.ui,
            letterSpacing: theme.typography.letterSpacing.ui,
            textTransform: "uppercase",
          }}
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
          type="button"
          onClick={() => void handleResend()}
          disabled={!canResend}
          className="text-muted-foreground text-sm hover:text-foreground transition-colors disabled:opacity-50"
          style={{
            fontFamily: theme.typography.fonts.ui,
            letterSpacing: theme.typography.letterSpacing.body,
          }}
        >
          {canResend ? "Resend code" : `Resend in ${countdown}s`}
        </button>
      </div>
    </div>
  );
};

export default OTP;
