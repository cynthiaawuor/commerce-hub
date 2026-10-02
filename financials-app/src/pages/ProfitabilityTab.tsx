import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PeriodPicker } from "../components/PeriodPicker";
import { EmptyRow, Loaded, Panel, td, tdRight, th, thRight } from "../components/ui/Layout";
import type { Period } from "../lib/dates";
import { getProfitability } from "../lib/financials-api";
import { kes, percent } from "../lib/money";

type By = "product" | "store";

// Which products and stores make the money, most profitable first. A table rather
// than a chart: these are exact amounts someone reads row by row.
export function ProfitabilityTab({
  period,
  onPeriodChange,
}: {
  period: Period;
  onPeriodChange: (period: Period) => void;
}) {
  const [by, setBy] = useState<By>("product");
  const report = useQuery({
    queryKey: ["profitability", by, period],
    queryFn: () => getProfitability(by, period),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PeriodPicker period={period} onChange={onPeriodChange} />
        <div className="flex rounded-md border border-slate-300 bg-white p-0.5 text-sm" role="group" aria-label="Group by">
          {(["product", "store"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={by === option}
              onClick={() => setBy(option)}
              className={`rounded px-3 py-1.5 font-medium ${
                by === option ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              By {option}
            </button>
          ))}
        </div>
      </div>

      <Panel title={by === "product" ? "Profit by product" : "Profit by store"}>
        <Loaded query={report}>
          {(data) => (
            <>
              {data.uncostedSales > 0 && (
                <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                  {data.uncostedSales} sale(s) are still waiting for their cost, so cost is
                  understated and profit overstated below.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className={th}>{by === "product" ? "Product" : "Store"}</th>
                      <th className={thRight}>Units sold</th>
                      <th className={thRight}>Revenue</th>
                      <th className={thRight}>Cost</th>
                      <th className={thRight}>Gross profit</th>
                      <th className={thRight}>Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.rows.length === 0 && (
                      <EmptyRow columns={6}>Nothing was sold in this period.</EmptyRow>
                    )}
                    {data.rows.map((row) => (
                      <tr key={row.sku ?? row.storeCode}>
                        <td className={td}>
                          {by === "product" ? (
                            <>
                              <span className="font-medium">{row.productName}</span>
                              <span className="ml-2 text-slate-500">{row.sku}</span>
                            </>
                          ) : (
                            <span className="font-medium">{row.storeCode}</span>
                          )}
                        </td>
                        <td className={tdRight}>{row.quantity}</td>
                        <td className={tdRight}>{kes(row.revenueCents)}</td>
                        <td className={tdRight}>{kes(row.costCents)}</td>
                        <td className={`${tdRight} font-medium`}>{kes(row.grossProfitCents)}</td>
                        <td className={tdRight}>{percent(row.grossMarginPercent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Loaded>
      </Panel>
    </div>
  );
}
