import { Outlet } from "react-router";
import type { FeatureFlags } from "../../config/feature-flags";
import { Sidebar } from "./Sidebar";

export function AppLayout({ flags }: { flags: FeatureFlags }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 sm:flex-row">
      <Sidebar flags={flags} />
      <main className="flex-1 p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
