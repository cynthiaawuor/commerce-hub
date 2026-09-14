import { NavLink } from "react-router";
import type { FeatureFlags } from "../../config/feature-flags";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export function Sidebar({ flags }: { flags: FeatureFlags }) {
  return (
    <aside className="bg-slate-900 p-4 sm:w-60">
      <p className="mb-6 px-3 text-lg font-semibold text-white">Vendor Portal</p>

      {/* Menu items for disabled modules are hidden */}
      <nav className="space-y-1">
        {flags.vendorManagement && (
          <NavLink to="/suppliers" className={linkClass}>
            Suppliers
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
