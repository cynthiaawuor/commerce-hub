import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Badge, EmptyRow, Loaded, Panel, td, tdRight, th, thRight } from "../components/ui/Layout";
import { formatDate } from "../lib/dates";
import { getAccountBalances, getJournalEntries } from "../lib/financials-api";
import { kes } from "../lib/money";
import type { Account, JournalSource } from "../types/financials";

// What caused an entry, in words an accountant would use
const SOURCES: Record<JournalSource, string> = {
  GOODS_RECEIVED: "Goods received",
  SALE: "Sale",
  SALE_COST: "Cost of sale",
  DAY_CLOSED: "Till difference",
  SUPPLIER_PAYMENT: "Supplier payment",
};

const ACCOUNT_TYPES: Record<Account["type"], string> = {
  ASSET: "Asset",
  LIABILITY: "Liability",
  REVENUE: "Revenue",
  EXPENSE: "Expense",
};

const amount = (cents: number) => (cents === 0 ? "" : kes(cents));

// The general ledger: every account's balance, and the entries behind them
export function LedgerTab() {
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: getAccountBalances });

  return (
    <div className="space-y-4">
      <Loaded query={accounts}>
        {(books) => (
          <Panel
            title="Accounts"
            aside={
              // The first check an accountant runs: in double entry the two totals must match
              <Badge tone={books.balanced ? "good" : "bad"}>
                {books.balanced ? "Debits equal credits" : "Debits do not equal credits"}
              </Badge>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className={th}>Code</th>
                    <th className={th}>Account</th>
                    <th className={th}>Type</th>
                    <th className={thRight}>Debits</th>
                    <th className={thRight}>Credits</th>
                    <th className={thRight}>Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {books.accounts.map((account) => (
                    <tr key={account.code}>
                      <td className={`${td} tabular-nums text-slate-500`}>{account.code}</td>
                      <td className={`${td} font-medium`}>{account.name}</td>
                      <td className={td}>{ACCOUNT_TYPES[account.type]}</td>
                      <td className={tdRight}>{amount(account.debitCents)}</td>
                      <td className={tdRight}>{amount(account.creditCents)}</td>
                      <td className={`${tdRight} font-medium`}>{kes(account.balanceCents)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-300 font-semibold">
                    <td className={td} colSpan={3}>
                      Total
                    </td>
                    <td className={tdRight}>{kes(books.totalDebitCents)}</td>
                    <td className={tdRight}>{kes(books.totalCreditCents)}</td>
                    <td className={td} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>
        )}
      </Loaded>

      <JournalEntries />
    </div>
  );
}

function JournalEntries() {
  const [source, setSource] = useState<JournalSource | "">("");
  const [reference, setReference] = useState("");
  const [page, setPage] = useState(1);

  const entries = useQuery({
    queryKey: ["entries", source, reference, page],
    queryFn: () => getJournalEntries({ source, reference, page }),
    // Keep the current page on screen while the next one loads
    placeholderData: keepPreviousData,
  });

  return (
    <Panel
      title="Journal entries"
      aside={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={source}
            aria-label="Kind of entry"
            onChange={(event) => {
              setSource(event.target.value as JournalSource | "");
              setPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All kinds</option>
            {Object.entries(SOURCES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={reference}
            onChange={(event) => {
              setReference(event.target.value);
              setPage(1);
            }}
            placeholder="Find a reference, e.g. GRN-000003"
            aria-label="Find a reference"
            className="w-64 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      }
    >
      <Loaded query={entries}>
        {(result) => (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>Entry</th>
                    <th className={th}>Account</th>
                    <th className={thRight}>Debit</th>
                    <th className={thRight}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.length === 0 && <EmptyRow columns={5}>No entries match.</EmptyRow>}
                  {result.data.map((entry) =>
                    entry.lines.map((line, index) => (
                      <tr key={line.id} className={index === 0 ? "border-t border-slate-200" : ""}>
                        {/* The entry's details sit beside its first line and span the rest */}
                        {index === 0 && (
                          <>
                            <td className={`${td} whitespace-nowrap align-top`} rowSpan={entry.lines.length}>
                              {formatDate(entry.occurredAt)}
                            </td>
                            <td className={`${td} align-top`} rowSpan={entry.lines.length}>
                              <p className="font-medium">
                                {SOURCES[entry.source]} · {entry.reference}
                              </p>
                              <p className="text-slate-500">{entry.description}</p>
                            </td>
                          </>
                        )}
                        {/* Credits are indented, as in a written journal */}
                        <td className={`${td} ${line.creditCents > 0 ? "pl-10" : ""}`}>
                          <span className="tabular-nums text-slate-500">{line.accountCode}</span>{" "}
                          {line.accountName}
                        </td>
                        <td className={tdRight}>{amount(line.debitCents)}</td>
                        <td className={tdRight}>{amount(line.creditCents)}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
              <p className="text-slate-500">
                {result.meta.total} entr{result.meta.total === 1 ? "y" : "ies"}
                {result.meta.totalPages > 1 && ` · page ${result.meta.page} of ${result.meta.totalPages}`}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Newer
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= result.meta.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Older
                </Button>
              </div>
            </div>
          </>
        )}
      </Loaded>
    </Panel>
  );
}
