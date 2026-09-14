import { Navigate, type RouteObject } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import type { FeatureFlags } from "./config/feature-flags";
import { EditSupplierPage } from "./features/suppliers/pages/EditSupplierPage";
import { NewSupplierPage } from "./features/suppliers/pages/NewSupplierPage";
import { SupplierDetailPage } from "./features/suppliers/pages/SupplierDetailPage";
import { SuppliersListPage } from "./features/suppliers/pages/SuppliersListPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// Routes are built from the flags so a disabled module never registers its pages.
export function createRoutes(flags: FeatureFlags): RouteObject[] {
  const children: RouteObject[] = flags.vendorManagement
    ? [
        { index: true, element: <Navigate to="/suppliers" replace /> },
        { path: "suppliers", element: <SuppliersListPage /> },
        { path: "suppliers/new", element: <NewSupplierPage /> },
        { path: "suppliers/:supplierId", element: <SupplierDetailPage /> },
        { path: "suppliers/:supplierId/edit", element: <EditSupplierPage /> },
        { path: "*", element: <NotFoundPage /> },
      ]
    : [
        { index: true, element: <ComingSoonPage /> },
        { path: "*", element: <ComingSoonPage /> },
      ];

  return [{ path: "/", element: <AppLayout flags={flags} />, children }];
}
