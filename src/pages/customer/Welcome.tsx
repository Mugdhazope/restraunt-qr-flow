import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";
import { restaurants } from "@/data/menuData";

const Welcome = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { setCustomer } = useCustomer();
  const restaurant = restaurants[restaurantId || "doughandjoe"];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

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

  const handleContinue = () => {
    if (!validate()) return;
    setCustomer({
      name: name.trim(),
      phone: phone.replace(/\D/g, ""),
      restaurant: restaurant?.name || "Dough & Joe",
      visitTimestamp: new Date().toISOString(),
    });
    navigate(`/scan/${restaurantId || "doughandjoe"}/otp`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome to {restaurant?.name || "Dough & Joe"}</h1>
          <p className="text-muted-foreground text-sm mt-1.5">{restaurant?.tagline || "Scan, check in, and enjoy your visit."}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
              className={`w-full px-4 py-3 rounded-lg bg-background border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all ${
                errors.name ? "border-destructive focus:ring-destructive" : "border-border focus:ring-ring"
              }`}
            />
            {errors.name && <p className="text-destructive text-xs mt-1.5">{errors.name}</p>}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm shrink-0">+91</span>
              <input
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => { handlePhoneChange(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: undefined })); }}
                className={`w-full px-4 py-3 rounded-lg bg-background border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all ${
                  errors.phone ? "border-destructive focus:ring-destructive" : "border-border focus:ring-ring"
                }`}
              />
            </div>
            {errors.phone && <p className="text-destructive text-xs mt-1.5">{errors.phone}</p>}
          </div>
          <button
            onClick={handleContinue}
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
