import { Navigate, useParams } from "react-router-dom";
import { DEFAULT_RESTAURANT_SLUG } from "@/lib/defaultRestaurantSlug";

// Reward is now replaced by CheckedIn — redirect for backwards compat
const Reward = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return <Navigate to={`/scan/${restaurantId || DEFAULT_RESTAURANT_SLUG}/checked-in`} replace />;
};

export default Reward;
