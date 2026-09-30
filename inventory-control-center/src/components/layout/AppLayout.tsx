import { NavLink, Outlet } from "react-router";
import type { FeatureFlags } from "../../config/feature-flags";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export function AppLayout({ flags }: { flags: FeatureFlags }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 sm:flex-row">
      <aside className="flex flex-col gap-6 bg-slate-900 p-4 sm:w-60">
        <div className="px-3">
          <p className="text-lg font-semibold text-white">Inventory</p>
          <p className="text-xs text-slate-400">Control Center</p>
        </div>

        <nav className="flex-1 space-y-1">
          {flags.inventory && (
            <>
              <NavLink to="/stock" className={linkClass}>Stock</NavLink>
              <NavLink to="/products" className={linkClass}>Products</NavLink>
              <NavLink to="/locations" className={linkClass}>Locations</NavLink>
              <NavLink to="/valuation" className={linkClass}>Valuation</NavLink>
            </>
          )}
        </nav>
      </aside>

      <main className="flex-1 p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
