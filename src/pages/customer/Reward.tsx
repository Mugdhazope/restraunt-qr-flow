import { Navigate, useParams } from "react-router-dom";

// Reward is now replaced by CheckedIn — redirect for backwards compat
const Reward = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return <Navigate to={`/scan/${restaurantId || "doughandjoe"}/checked-in`} replace />;
};

export default Reward;
