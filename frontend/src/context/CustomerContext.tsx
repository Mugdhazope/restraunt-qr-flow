import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface CustomerData {
  name: string;
  phone: string;
  restaurant: string;
  visitTimestamp: string;
  /** From check-in / verify-otp API; drives loyalty UI on Checked-in. */
  totalVisits?: number;
  /** Restaurant slug used at check-in (for session restore). */
  restaurantSlug?: string;
}

interface CustomerContextType {
  customer: CustomerData | null;
  setCustomer: (data: CustomerData | null) => void;
  recentCheckins: CustomerData[];
  addCheckin: (data: CustomerData) => void;
}

const STORAGE_KEY = "kotak_scan_customer";

function readStoredCustomer(): CustomerData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerData;
    if (!parsed || typeof parsed.phone !== "string" || typeof parsed.name !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredCustomer(data: CustomerData | null) {
  try {
    if (!data) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomerState] = useState<CustomerData | null>(() => readStoredCustomer());
  const [recentCheckins, setRecentCheckins] = useState<CustomerData[]>([]);

  const setCustomer = (data: CustomerData | null) => {
    setCustomerState(data);
    writeStoredCustomer(data);
  };

  // Re-hydrate if another tab cleared/updated storage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setCustomerState(readStoredCustomer());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addCheckin = (data: CustomerData) => {
    setRecentCheckins((prev) => [data, ...prev]);
  };

  return (
    <CustomerContext.Provider value={{ customer, setCustomer, recentCheckins, addCheckin }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
};
