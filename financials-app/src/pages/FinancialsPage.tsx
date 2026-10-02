import { useState } from "react";
import { config } from "../config/config";
import { CURRENT_USER } from "../lib/api-client";
import { thisMonth } from "../lib/dates";
import { BillsTab } from "./BillsTab";
import { LedgerTab } from "./LedgerTab";
import { OverviewTab } from "./OverviewTab";
import { ProfitabilityTab } from "./ProfitabilityTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "bills", label: "Supplier bills" },
  { key: "ledger", label: "Ledger" },
  { key: "profitability", label: "Profitability" },
] as const;

type Tab = (typeof TABS)[number]["key"];

// The spec's Finance Portal: what the business owns, what it owes, and whether it is
// making money. Everything here is read from the ledger; the only thing an accountant
// changes is recording a payment to a supplier.
export function FinancialsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  // Shared by the Overview and Profitability, so both always describe the same dates
  const [period, setPeriod] = useState(thisMonth);

  // With the phase flag off, the app shows nothing but Coming soon
  if (!config.featureFinancials) {
    return <ComingSoon />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 px-4 pt-4 text-white">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Financials</p>
            <p className="text-sm text-slate-400">What we own, what we owe, and what we earn</p>
          </div>
          <p className="hidden text-right text-sm text-slate-400 sm:block">{CURRENT_USER}</p>
        </div>
        <nav className="mx-auto mt-3 flex max-w-6xl gap-1 overflow-x-auto">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              aria-pressed={tab === item.key}
              className={`whitespace-nowrap rounded-t-md px-4 py-2.5 text-sm font-medium ${
                tab === item.key ? "bg-slate-50 text-slate-900" : "text-slate-300 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        {tab === "overview" && <OverviewTab period={period} onPeriodChange={setPeriod} />}
        {tab === "bills" && <BillsTab />}
        {tab === "ledger" && <LedgerTab />}
        {tab === "profitability" && <ProfitabilityTab period={period} onPeriodChange={setPeriod} />}
      </main>
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <h1 className="text-xl font-semibold">Coming soon</h1>
        <p className="mt-2 text-sm text-slate-500">Financials is not enabled here.</p>
      </div>
    </div>
  );
}
