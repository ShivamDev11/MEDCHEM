/**
 * @file        inventoryRoutes.jsx
 * @module      Inventory
 * @purpose     Defines all client-side routes for the Inventory module as a
 *              self-contained route config array. Exported and nested under
 *              the /inventory path inside src/app/routes.jsx (File 4).
 *              Keeps routing logic co-located with the module — not scattered
 *              in the global router.
 * @dependencies react-router-dom (JSX usage), four Inventory page components
 * @exports     inventoryRoutes (default) — RouteObject[]
 */

import Inventory      from "./pages/Inventory";
import AddMedicine    from "./pages/AddMedicine";
import EditMedicine   from "./pages/EditMedicine";
import MedicineDetails from "./pages/MedicineDetails";

/**
 * Route configuration array for the Inventory module.
 *
 * Nested under  path="/inventory"  in src/app/routes.jsx.
 * The parent route in routes.jsx must render <Outlet /> to display children.
 *
 * Resulting URL map:
 * ┌─────────────────────────────┬─────────────────────────────────────────┐
 * │ URL                         │ Component                               │
 * ├─────────────────────────────┼─────────────────────────────────────────┤
 * │ /inventory                  │ Inventory   — List + stats + search      │
 * │ /inventory/add              │ AddMedicine — New medicine form           │
 * │ /inventory/edit/:id         │ EditMedicine — Edit pre-filled form       │
 * │ /inventory/details/:id      │ MedicineDetails — Read-only detail view   │
 * └─────────────────────────────┴─────────────────────────────────────────┘
 */
const inventoryRoutes = [
  {
    // index: true renders <Inventory /> when the URL is exactly /inventory
    index: true,
    element: <Inventory />,
  },
  {
    path: "add",
    element: <AddMedicine />,
  },
  {
    path: "edit/:id",
    element: <EditMedicine />,
  },
  {
    path: "details/:id",
    element: <MedicineDetails />,
  },
];

export default inventoryRoutes;
