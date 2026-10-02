import { useQuery } from "@tanstack/react-query";
import { PeriodPicker } from "../components/PeriodPicker";
import { Badge, Figure, Loaded, Panel, td, tdRight } from "../components/ui/Layout";
import { formatDate, type Period } from "../lib/dates";
import {
  getBalanceSheet,
  getCommitments,
  getProfitAndLoss,
  getSupplierBalances,
} from "../lib/financials-api";
import { kes, percent } from "../lib/money";
import type { BalanceRow } from "../types/financials";

// The three questions Financials exists to answer: are we making money, what do we
// own, and what do we owe?
export function OverviewTab({
  period,
  onPeriodChange,
}: {
  period: Period;
  onPeriodChange: (period: Period) => void;
}) {
  const profit = useQuery({
    queryKey: ["profit-and-loss", period],
    queryFn: () => getProfitAndLoss(period),
  });
  // What we own and owe on the last day of the period
  const sheet = useQuery({
    queryKey: ["balance-sheet", period.to],
    queryFn: () => getBalanceSheet(period.to),
  });
  const suppliers = useQuery({ queryKey: ["supplier-balances"], queryFn: getSupplierBalances });
  const commitments = useQuery({ queryKey: ["commitments"], queryFn: getCommitments });

  return (
    <div className="space-y-4">
      <PeriodPicker period={period} onChange={onPeriodChange} />

      <Loaded query={profit}>
        {(report) => (
          <>
            {report.uncostedSales > 0 && (
              <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {report.uncostedSales} sale(s) in this period are still waiting for their cost
                from Inventory, so profit is overstated until they are booked.
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <Figure
                  lead
                  label="Net profit"
                  value={kes(report.netProfitCents)}
                  note={`${formatDate(report.from)} to ${formatDate(report.to)}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <Figure label="Sales revenue" value={kes(report.revenueCents)} note="After VAT" />
                <Figure label="Cost of goods sold" value={kes(report.costOfGoodsSoldCents)} />
                <Figure
                  label="Gross profit"
                  value={kes(report.grossProfitCents)}
                  note={`Margin ${percent(report.grossMarginPercent)}`}
                />
                <Figure
                  label="Cash over / short"
                  value={kes(Math.abs(report.cashOverShortCents))}
                  note={
                    report.cashOverShortCents === 0
                      ? "Tills balanced"
                      : report.cashOverShortCents > 0
                        ? "Tills were short overall"
                        : "Tills were over overall"
                  }
                />
              </div>
            </div>
          </>
        )}
      </Loaded>

      <Loaded query={sheet}>
        {(balance) => (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="What we own" aside={<span className="text-sm text-slate-500">on {formatDate(balance.asOf)}</span>}>
              <BalanceTable rows={balance.assets} totalLabel="Total assets" totalCents={balance.totalAssetsCents} />
            </Panel>
            <Panel
              title="What we owe, and what is ours"
              aside={
                <Badge tone={balance.balanced ? "good" : "bad"}>
                  {balance.balanced ? "Books balance" : "Books do not balance"}
                </Badge>
              }
            >
              <BalanceTable
                rows={[...balance.liabilities, ...balance.equity]}
                totalLabel="Total owed plus kept"
                totalCents={balance.totalLiabilitiesCents + balance.totalEquityCents}
              />
            </Panel>
          </div>
        )}
      </Loaded>

      <div className="grid gap-4 md:grid-cols-3">
        <Loaded query={suppliers}>
          {(balances) => (
            <>
              <Figure
                label="Owed to suppliers"
                value={kes(balances.totals.outstandingCents)}
                note={`${balances.suppliers.length} supplier(s)`}
              />
              <Figure
                label="Of which overdue"
                value={kes(balances.totals.overdueCents)}
                note={balances.totals.overdueCents > 0 ? "Past its due date" : "Nothing is late"}
              />
            </>
          )}
        </Loaded>
        <Loaded query={commitments}>
          {(promised) => (
            <Figure
              label="Ordered, not yet delivered"
              value={kes(promised.totalOutstandingCents)}
              note={`${promised.commitments.length} order(s); not owed until goods arrive`}
            />
          )}
        </Loaded>
      </div>
    </div>
  );
}

function BalanceTable({
  rows,
  totalLabel,
  totalCents,
}: {
  rows: BalanceRow[];
  totalLabel: string;
  totalCents: number;
}) {
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row.name}>
            <td className={td}>{row.name}</td>
            <td className={tdRight}>{kes(row.balanceCents)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t border-slate-300 font-semibold">
          <td className={td}>{totalLabel}</td>
          <td className={tdRight}>{kes(totalCents)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
