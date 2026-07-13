import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";
import { restaurants } from "@/data/menuData";
import { postCheckIn, setCustomerScanSession } from "@/lib/api";
import { DEFAULT_RESTAURANT_SLUG } from "@/lib/defaultRestaurantSlug";
import { toIndiaE164 } from "@/lib/phoneE164";
import { resolveScanContext } from "@/lib/scanContext";
import { useScannerTheme } from "@/lib/useScannerTheme";
import { LayoutRenderer } from "@/layouts/LayoutRenderer";
import { usePublicLayouts } from "@/layouts/usePublicLayouts";
import type { LayoutDataContext } from "@/layouts/types";

const Welcome = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { apiSlug, menuKey } = useMemo(() => resolveScanContext(restaurantId), [restaurantId]);
  const { setCustomer } = useCustomer();
  const restaurant = restaurants[menuKey];
  const { theme } = useScannerTheme(apiSlug, menuKey);
  const { getLayout, loading: layoutsLoading, error: layoutsError } = usePublicLayouts(apiSlug);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validate = () => {
    const errs: { name?: string; phone?: string } = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      errs.name = "Please enter your name";
    } else if (trimmedName.length < 2) {
      errs.name = "Name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      errs.name = "Only alphabet characters allowed";
    }

    const digits = phone.replace(/\D/g, "");
    if (!digits) {
      errs.phone = "Please enter your phone number";
    } else if (digits.length !== 10) {
      errs.phone = "Please enter a valid 10-digit phone number";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    if (digits.length > 5) {
      setPhone(`${digits.slice(0, 5)} ${digits.slice(5)}`);
    } else {
      setPhone(digits);
    }
  };

  const pathSegment = restaurantId || menuKey;

  const handleContinue = async () => {
    setFormError(null);
    if (!validate()) return;
    const digits = phone.replace(/\D/g, "");
    const e164 = toIndiaE164(digits);
    setSubmitting(true);
    try {
      const res = await postCheckIn({
        restaurant_slug: apiSlug,
        phone: e164,
        name: name.trim(),
      });
      if (!res.success || !res.access || !res.refresh) {
        setFormError("Could not check in. Please try again.");
        return;
      }

      setCustomerScanSession(apiSlug, res.access, res.refresh);
      setCustomer({
        name: name.trim(),
        phone: digits,
        restaurant: restaurant?.name || "Restaurant",
        restaurantSlug: apiSlug,
        visitTimestamp: new Date().toISOString(),
        totalVisits: typeof res.total_visits === "number" ? res.total_visits : undefined,
      });
      navigate(`/scan/${pathSegment}/checked-in`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const layoutData: LayoutDataContext = {
    restaurant: restaurant ?? null,
    restaurantName: restaurant?.name || "Restaurant",
    tagline: restaurant?.tagline,
    theme,
    menu: restaurant?.menu ?? [],
    activeCategory: null,
    searchQuery: "",
    item: null,
    pathSegment,
    resolvedId: pathSegment,
    checkIn: {
      name,
      phone,
      setName: (v) => {
        setName(v);
        if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
      },
      setPhone: (v) => {
        setPhone(v);
        if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
      },
      errors,
      formError,
      submitting,
      onSubmit: () => void handleContinue(),
    },
  };

  // Layout API ok → freeform renderer. Fetch fail → classic JSX (preserve UX).
  if (!layoutsError && !layoutsLoading) {
    return (
      <div className="min-h-screen" style={{ background: theme.background }}>
        <LayoutRenderer document={getLayout("welcome")} mode="live" data={layoutData} />
      </div>
    );
  }

  if (layoutsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center">
          <h1
            className="text-2xl text-foreground"
            style={{
              fontFamily: theme.typography.fonts.heading,
              fontWeight: theme.typography.weights.heading,
              letterSpacing: theme.typography.letterSpacing.heading,
              lineHeight: theme.typography.lineHeights.compact,
            }}
          >
            Welcome to{" "}
            <span
              style={{
                color: theme.typography.accents.welcomeHighlight,
                textDecoration: menuKey === DEFAULT_RESTAURANT_SLUG ? "underline" : "none",
                textUnderlineOffset: menuKey === DEFAULT_RESTAURANT_SLUG ? "5px" : "0",
                textDecorationThickness: menuKey === DEFAULT_RESTAURANT_SLUG ? "2px" : "0",
              }}
            >
              {restaurant?.name || "Restaurant"}
            </span>
          </h1>
          <p
            className="text-muted-foreground mt-1.5"
            style={{
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.scale.sm,
              marginTop: theme.typography.spacing.titleToDescription,
              letterSpacing: theme.typography.letterSpacing.body,
              lineHeight: theme.typography.lineHeights.relaxed,
              fontWeight: theme.typography.weights.body,
            }}
          >
            {restaurant?.tagline || "Scan, check in, and enjoy your visit."}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              className={`w-full px-4 py-3 rounded-lg bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all ${
                errors.name ? "border-destructive focus:ring-destructive" : "border-border focus:ring-ring"
              }`}
            />
            {errors.name && (
              <p className="text-destructive text-xs mt-1.5">{errors.name}</p>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground shrink-0">+91</span>
              <input
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => {
                  handlePhoneChange(e.target.value);
                  if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-lg bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all ${
                  errors.phone ? "border-destructive focus:ring-destructive" : "border-border focus:ring-ring"
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-destructive text-xs mt-1.5">{errors.phone}</p>
            )}
          </div>
          {formError && <p className="text-destructive text-xs">{formError}</p>}
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={submitting}
            className="w-full bg-foreground text-background py-3 rounded-lg text-sm hover:bg-foreground/90 transition-colors disabled:opacity-60"
          >
            {submitting ? "Please wait…" : "Continue"}
          </button>
        </div>

        <p className="text-center text-muted-foreground text-xs">
          Check in to unlock perks & updates on WhatsApp
        </p>
      </div>
    </div>
  );
};

export default Welcome;
