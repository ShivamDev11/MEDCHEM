import { createBrowserRouter, Outlet, Navigate } from "react-router-dom";

import Login         from "../modules/auth/pages/Login";
import Dashboard     from "../modules/dashboard/pages/Dashboard";
import Sales         from "../modules/sales/pages/Sales";
import Expiry        from "../modules/expiry/pages/Expiry";
import Notifications from "../modules/notifications/pages/Notifications";

import ProtectedRoute from "../modules/auth/routes/ProtectedRoute";
import inventoryRoutes from "../modules/inventory/inventoryRoutes";
import useAuth from "../modules/auth/hooks/useAuth";
import { AUTH_ROUTES } from "../modules/auth/constants/authConstants";

const RootRedirect = () => {
  const { currentUser } = useAuth();
  return currentUser ? (
    <Navigate to={AUTH_ROUTES.DASHBOARD} replace />
  ) : (
    <Navigate to={AUTH_ROUTES.LOGIN} replace />
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/inventory",
    element: (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    ),
    children: inventoryRoutes,
  },
  {
    path: "/sales",
    element: (
      <ProtectedRoute>
        <Sales />
      </ProtectedRoute>
    ),
  },
  {
    path: "/expiry",
    element: (
      <ProtectedRoute>
        <Expiry />
      </ProtectedRoute>
    ),
  },
  {
    path: "/notifications",
    element: (
      <ProtectedRoute>
        <Notifications />
      </ProtectedRoute>
    ),
  },
]);

export default router;