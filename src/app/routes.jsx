/**
 * @file        routes.jsx
 * @module      App
 * @purpose     Root application router. Defines all top-level routes and
 *              delegates module-specific child routes to their own route
 *              config files. Inventory sub-routes are nested under /inventory
 *              using React Router's <Outlet /> pattern.
 * @dependencies react-router-dom, all module route configs and page components
 * @exports     router (default) — BrowserRouter instance
 */

import { createBrowserRouter, Outlet } from "react-router-dom";

// ── Non-inventory module pages (preserved from original routes) ──────────────
import Login         from "../modules/auth/pages/Login";
import Dashboard     from "../modules/dashboard/pages/Dashboard";
import Sales         from "../modules/sales/pages/Sales";
import Expiry        from "../modules/expiry/pages/Expiry";
import Notifications from "../modules/notifications/pages/Notifications";

// ── Inventory module — self-contained route config ───────────────────────────
// inventoryRoutes exports an array of child RouteObjects:
//   index        → /inventory           (Inventory list)
//   add          → /inventory/add       (Add Medicine form)
//   edit/:id     → /inventory/edit/:id  (Edit Medicine form)
//   details/:id  → /inventory/details/:id (Read-only detail view)
import inventoryRoutes from "../modules/inventory/inventoryRoutes";

// ─────────────────────────────────────────────────────────────────────────────
// ROOT ROUTER
// Each module owns its own route config. The root router only knows about
// top-level paths — child routing is delegated to the module files.
// ─────────────────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },

  // ── Inventory module ───────────────────────────────────────────────────────
  // <Outlet /> renders the matched child route component.
  // The parent /inventory path itself has no UI — the index child handles it.
  {
    path: "/inventory",
    element: <Outlet />,
    children: inventoryRoutes,
  },

  // ── Other modules (routes unchanged) ──────────────────────────────────────
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
]);

export default router;