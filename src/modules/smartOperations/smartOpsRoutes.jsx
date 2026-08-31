/**
 * @file        smartOpsRoutes.jsx
 * @module      SmartOperations
 * @purpose     Client-side routes for the Smart Operations module.
 */

import Suppliers from './pages/Suppliers';
import SupplierDetails from './pages/SupplierDetails';
import Purchases from './pages/Purchases';
import ReorderSuggestions from './pages/ReorderSuggestions';
import ProfitAnalysis from './pages/ProfitAnalysis';
import StockHistory from './pages/StockHistory';

const smartOpsRoutes = [
  { path: '/suppliers', element: <Suppliers /> },
  { path: '/suppliers/:id', element: <SupplierDetails /> },
  { path: '/purchases', element: <Purchases /> },
  { path: '/reorder', element: <ReorderSuggestions /> },
  { path: '/profit-analysis', element: <ProfitAnalysis /> },
  { path: '/stock-history', element: <StockHistory /> }
];

export default smartOpsRoutes;
