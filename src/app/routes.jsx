import { createBrowserRouter } from "react-router-dom";

import Login from "../modules/auth/pages/Login";
import Dashboard from "../modules/dashboard/pages/Dashboard";
import Inventory from "../modules/inventory/pages/Inventory";
import Sales from "../modules/sales/pages/Sales";
import Expiry from "../modules/expiry/pages/Expiry";
import Notifications from "../modules/notifications/pages/Notifications";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/dashboard",
        element: <Dashboard />
    },
    {
        path: "/inventory",
        element: <Inventory />
    },
    {
        path: "/sales",
        element: <Sales />
    },
    {
        path: "/expiry",
        element: <Expiry />
    },
    {
        path: "/notifications",
        element: <Notifications />
    }
]);

export default router;