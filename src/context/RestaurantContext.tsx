import { createContext, useContext, useState, ReactNode } from "react";
import { outlets } from "@/data/mockData";

interface Outlet {
  id: number;
  name: string;
  location: string;
  restaurantId: string;
}

interface RestaurantContextType {
  selectedOutlet: Outlet;
  setSelectedOutlet: (outlet: Outlet) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const [selectedOutlet, setSelectedOutlet] = useState(outlets[0]);

  return (
    <RestaurantContext.Provider value={{ selectedOutlet, setSelectedOutlet }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error("useRestaurant must be used within RestaurantProvider");
  return ctx;
};
