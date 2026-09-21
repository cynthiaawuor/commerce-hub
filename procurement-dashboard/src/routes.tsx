import { Navigate, type RouteObject } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import type { FeatureFlags } from "./config/feature-flags";
import { ApprovalsPage } from "./features/purchase-orders/pages/ApprovalsPage";
import { NewPurchaseOrderPage } from "./features/purchase-orders/pages/NewPurchaseOrderPage";
import { PurchaseOrderDetailPage } from "./features/purchase-orders/pages/PurchaseOrderDetailPage";
import { PurchaseOrdersPage } from "./features/purchase-orders/pages/PurchaseOrdersPage";
import { ReorderSuggestionsPage } from "./features/reorder-suggestions/pages/ReorderSuggestionsPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// With the module's flag off, every route shows "Coming soon" and the menu is empty,
// which is how the spec asks unfinished modules to behave.
export function createRoutes(flags: FeatureFlags): RouteObject[] {
  return [
    {
      path: "/",
      element: <AppLayout flags={flags} />,
      children: flags.procurement
        ? [
            { index: true, element: <Navigate to="/purchase-orders" replace /> },
            { path: "purchase-orders", element: <PurchaseOrdersPage /> },
            { path: "purchase-orders/new", element: <NewPurchaseOrderPage /> },
            { path: "purchase-orders/:purchaseOrderId", element: <PurchaseOrderDetailPage /> },
            { path: "approvals", element: <ApprovalsPage /> },
            { path: "reorder-suggestions", element: <ReorderSuggestionsPage /> },
            { path: "*", element: <NotFoundPage /> },
          ]
        : [
            { index: true, element: <ComingSoonPage /> },
            { path: "*", element: <ComingSoonPage /> },
          ],
    },
  ];
}
