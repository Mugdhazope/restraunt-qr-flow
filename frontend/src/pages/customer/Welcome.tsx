import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";
import { restaurants } from "@/data/menuData";
import { postCheckIn, setCustomerScanSession } from "@/lib/api";
import { toIndiaE164 } from "@/lib/phoneE164";
import { resolveScanContext } from "@/lib/scanContext";
import { useScannerTheme } from "@/lib/useScannerTheme";
import { LayoutRenderer } from "@/layouts/LayoutRenderer";
import { themeWithOutletLogo } from "@/layouts/outletLogo";
import { usePublicLayouts } from "@/layouts/usePublicLayouts";
import type { LayoutDataContext } from "@/layouts/types";

const Welcome = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { apiSlug, menuKey } = useMemo(() => resolveScanContext(restaurantId), [restaurantId]);
  const { setCustomer } = useCustomer();
  const fallback = restaurants[menuKey];
  const { theme: baseTheme, restaurantName } = useScannerTheme(apiSlug, menuKey);
  const { getLayout, layouts, loading: layoutsLoading } = usePublicLayouts(apiSlug);
  const theme = useMemo(() => themeWithOutletLogo(baseTheme, layouts), [baseTheme, layouts]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const displayName = restaurantName || fallback?.name || "Restaurant";

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
        restaurant: displayName,
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
    restaurant: fallback ?? null,
    restaurantName: displayName,
    tagline: theme.tagline || fallback?.tagline,
    theme,
    menu: fallback?.menu ?? [],
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

  if (layoutsLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: theme.background }}
      >
        <p className="animate-pulse text-sm" style={{ color: theme.textSecondary }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "transparent" }}>
      <LayoutRenderer document={getLayout("welcome")} mode="live" data={layoutData} />
    </div>
  );
};

export default Welcome;
