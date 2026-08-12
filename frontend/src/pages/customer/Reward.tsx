import { Navigate, useParams } from "react-router-dom";
import { DEFAULT_RESTAURANT_SLUG } from "@/lib/defaultRestaurantSlug";
import { buildScanPath } from "@/lib/previewMode";

// Reward is now replaced by CheckedIn — redirect for backwards compat
const Reward = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return <Navigate to={buildScanPath(restaurantId || DEFAULT_RESTAURANT_SLUG, "checked-in")} replace />;
};

export default Reward;
