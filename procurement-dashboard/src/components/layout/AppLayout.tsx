import { NavLink, Outlet } from "react-router";
import type { FeatureFlags } from "../../config/feature-flags";
import { UserSwitcher } from "./UserSwitcher";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export function AppLayout({ flags }: { flags: FeatureFlags }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 sm:flex-row">
      <aside className="flex flex-col gap-6 bg-slate-900 p-4 sm:w-60">
        <p className="px-3 text-lg font-semibold text-white">Procurement</p>

        <nav className="flex-1 space-y-1">
          {flags.procurement && (
            <>
              <NavLink to="/purchase-orders" className={linkClass}>
                Purchase orders
              </NavLink>
              <NavLink to="/approvals" className={linkClass}>
                Approvals
              </NavLink>
              <NavLink to="/reorder-suggestions" className={linkClass}>
                Reorder suggestions
              </NavLink>
            </>
          )}
        </nav>

        <UserSwitcher />
      </aside>

      <main className="flex-1 p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
