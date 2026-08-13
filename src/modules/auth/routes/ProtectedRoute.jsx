import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { AUTH_ROUTES } from "../constants/authConstants";
import useAutoExpiryNotifications from "../../notifications/hooks/useAutoExpiryNotifications";

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  // 🔔 Auto-generate expiry notifications once per day (silent background task)
  useAutoExpiryNotifications();

  if (!currentUser) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  return children;
};

export default ProtectedRoute;
