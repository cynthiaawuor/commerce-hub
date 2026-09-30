import { Navigate, type RouteObject } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import type { FeatureFlags } from "./config/feature-flags";
import { LocationsPage } from "./features/locations/pages/LocationsPage";
import { ProductsPage } from "./features/products/pages/ProductsPage";
import { StockPage } from "./features/stock/pages/StockPage";
import { ValuationPage } from "./features/valuation/pages/ValuationPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// With the module's flag off, every page shows "Coming soon" and the menu is empty.
export function createRoutes(flags: FeatureFlags): RouteObject[] {
  return [
    {
      path: "/",
      element: <AppLayout flags={flags} />,
      children: flags.inventory
        ? [
            { index: true, element: <Navigate to="/stock" replace /> },
            { path: "stock", element: <StockPage /> },
            { path: "products", element: <ProductsPage /> },
            { path: "locations", element: <LocationsPage /> },
            { path: "valuation", element: <ValuationPage /> },
            { path: "*", element: <NotFoundPage /> },
          ]
        : [
            { index: true, element: <ComingSoonPage /> },
            { path: "*", element: <ComingSoonPage /> },
          ],
    },
  ];
}
