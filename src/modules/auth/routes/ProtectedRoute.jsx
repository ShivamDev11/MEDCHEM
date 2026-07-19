import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { AUTH_ROUTES } from "../constants/authConstants";

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  return children;
};

export default ProtectedRoute;
