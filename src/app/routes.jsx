import { createBrowserRouter, Outlet, Navigate } from "react-router-dom";

import Login         from "../modules/auth/pages/Login";
import Dashboard     from "../modules/dashboard/pages/Dashboard";
import Sales         from "../modules/sales/pages/Sales";
import Expiry        from "../modules/expiry/pages/Expiry";
import Notifications from "../modules/notifications/pages/Notifications";
import Reports       from "../modules/reports/pages/Reports";

import ProtectedRoute from "../modules/auth/routes/ProtectedRoute";
import inventoryRoutes from "../modules/inventory/inventoryRoutes";
import smartOpsRoutes from "../modules/smartOperations/smartOpsRoutes";
import useAuth from "../modules/auth/hooks/useAuth";
import { AUTH_ROUTES } from "../modules/auth/constants/authConstants";

import AppLayout from "./components/AppLayout";

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
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/inventory",
        element: <Outlet />,
        children: inventoryRoutes,
      },
      {
        path: "/sales",
        element: <Sales />,
      },
      {
        path: "/expiry",
        element: <Expiry />,
      },
      {
        path: "/notifications",
        element: <Notifications />,
      },
      {
        path: "/reports",
        element: <Reports />,
      },
      ...smartOpsRoutes,
    ],
  },
]);

export default router;