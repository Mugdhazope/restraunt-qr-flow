import { createContext, useContext, useState, ReactNode } from "react";

interface CustomerData {
  name: string;
  phone: string;
  restaurant: string;
  visitTimestamp: string;
}

interface CustomerContextType {
  customer: CustomerData | null;
  setCustomer: (data: CustomerData | null) => void;
  recentCheckins: CustomerData[];
  addCheckin: (data: CustomerData) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CustomerData[]>([]);

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
