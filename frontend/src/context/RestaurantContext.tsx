import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { outlets as fallbackOutlets } from "@/data/mockData";
import { fetchRestaurants, type ApiRestaurant } from "@/lib/api";

export type DashboardOutlet = {
  id: number;
  name: string;
  location: string;
  restaurantId: string;
};

function mapRestaurant(r: ApiRestaurant): DashboardOutlet {
  return {
    id: r.id,
    name: r.name,
    location: r.location || "",
    restaurantId: r.slug,
  };
}

interface RestaurantContextType {
  outlets: DashboardOutlet[];
  outletsLoading: boolean;
  outletsFromApi: boolean;
  selectedOutlet: DashboardOutlet;
  setSelectedOutlet: (outlet: DashboardOutlet) => void;
  refreshOutlets: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const initialOutlet: DashboardOutlet = {
  id: fallbackOutlets[0].id,
  name: fallbackOutlets[0].name,
  location: fallbackOutlets[0].location,
  restaurantId: fallbackOutlets[0].restaurantId,
};

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const [outlets, setOutlets] = useState<DashboardOutlet[]>([initialOutlet]);
  const [outletsLoading, setOutletsLoading] = useState(true);
  const [outletsFromApi, setOutletsFromApi] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<DashboardOutlet>(initialOutlet);

  const refreshOutlets = useCallback(async () => {
    setOutletsLoading(true);
    try {
      const list = await fetchRestaurants();
      if (list.length === 0) throw new Error("empty");
      const mapped = list.map(mapRestaurant);
      setOutlets(mapped);
      setOutletsFromApi(true);
      setSelectedOutlet((prev) => mapped.find((o) => o.restaurantId === prev.restaurantId) ?? mapped[0]);
    } catch {
      if (import.meta.env.DEV) {
        console.warn(
          "[RestaurantContext] Could not load /api/restaurants/; using offline outlets. " +
            "Log in on the API origin or set localStorage kotak_api_token (or VITE_API_TOKEN) so tenant slugs match the database.",
        );
      }
      const fb = fallbackOutlets.map((o) => ({
        id: o.id,
        name: o.name,
        location: o.location,
        restaurantId: o.restaurantId,
      }));
      setOutlets(fb);
      setOutletsFromApi(false);
      setSelectedOutlet((prev) => fb.find((x) => x.restaurantId === prev.restaurantId) ?? fb[0]);
    } finally {
      setOutletsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshOutlets();
  }, [refreshOutlets]);

  return (
    <RestaurantContext.Provider
      value={{
        outlets,
        outletsLoading,
        outletsFromApi,
        selectedOutlet,
        setSelectedOutlet,
        refreshOutlets,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error("useRestaurant must be used within RestaurantProvider");
  return ctx;
};
