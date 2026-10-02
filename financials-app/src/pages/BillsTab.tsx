import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Badge, EmptyRow, Loaded, Panel, td, tdRight, th, thRight } from "../components/ui/Layout";
import { formatDate } from "../lib/dates";
import {
  getCommitments,
  getOpenBills,
  getSupplierBalances,
  recordPayment,
} from "../lib/financials-api";
import { kes, toCents, toShillings } from "../lib/money";
import type { AgeBucket, Bill } from "../types/financials";

// The usual aged-payables columns: how late the money owed is
const BUCKETS: { key: AgeBucket; label: string }[] = [
  { key: "NOT_DUE", label: "Not due" },
  { key: "1_30", label: "1–30 days" },
  { key: "31_60", label: "31–60" },
  { key: "61_90", label: "61–90" },
  { key: "OVER_90", label: "Over 90" },
];

// Accounts payable: who we owe, how late it is, and paying it
export function BillsTab() {
  const suppliers = useQuery({ queryKey: ["supplier-balances"], queryFn: getSupplierBalances });
  const bills = useQuery({ queryKey: ["bills"], queryFn: getOpenBills });
  const commitments = useQuery({ queryKey: ["commitments"], queryFn: getCommitments });
  const [paying, setPaying] = useState<Bill | null>(null);
  const [lastPaid, setLastPaid] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {lastPaid && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <span>{lastPaid}</span>
          <button type="button" onClick={() => setLastPaid(null)} className="font-medium">
            OK
          </button>
        </div>
      )}

      <Panel title="Owed to each supplier">
        <Loaded query={suppliers}>
          {(balances) => (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className={th}>Supplier</th>
                    <th className={thRight}>Bills</th>
                    <th className={th}>Next due</th>
                    {BUCKETS.map((bucket) => (
                      <th key={bucket.key} className={thRight}>
                        {bucket.label}
                      </th>
                    ))}
                    <th className={thRight}>Total owed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balances.suppliers.length === 0 && (
                    <EmptyRow columns={9}>Nothing is owed to any supplier.</EmptyRow>
                  )}
                  {balances.suppliers.map((supplier) => (
                    <tr key={supplier.supplierId ?? "unmatched"}>
                      <td className={`${td} font-medium`}>{supplier.supplierName}</td>
                      <td className={tdRight}>{supplier.billCount}</td>
                      <td className={td}>{formatDate(supplier.nextDueDate)}</td>
                      {BUCKETS.map((bucket) => (
                        <td key={bucket.key} className={tdRight}>
                          {supplier.buckets[bucket.key] === 0 ? "–" : kes(supplier.buckets[bucket.key])}
                        </td>
                      ))}
                      <td className={`${tdRight} font-medium`}>{kes(supplier.outstandingCents)}</td>
                    </tr>
                  ))}
                </tbody>
                {balances.suppliers.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-300 font-semibold">
                      <td className={td} colSpan={3}>
                        Total
                      </td>
                      {BUCKETS.map((bucket) => (
                        <td key={bucket.key} className={tdRight}>
                          {balances.totals.buckets[bucket.key] === 0
                            ? "–"
                            : kes(balances.totals.buckets[bucket.key])}
                        </td>
                      ))}
                      <td className={tdRight}>{kes(balances.totals.outstandingCents)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </Loaded>
      </Panel>

      <Panel title="Bills to pay">
        <Loaded query={bills}>
          {(open) => (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className={th}>Delivery</th>
                    <th className={th}>Supplier</th>
                    <th className={th}>Due</th>
                    <th className={th}>Status</th>
                    <th className={thRight}>Amount</th>
                    <th className={thRight}>Still owed</th>
                    <th className={th}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {open.length === 0 && <EmptyRow columns={7}>No bills are waiting to be paid.</EmptyRow>}
                  {open.map((bill) => (
                    <BillRows
                      key={bill.id}
                      bill={bill}
                      paying={paying?.id === bill.id}
                      onPay={() => setPaying(bill)}
                      onCancel={() => setPaying(null)}
                      onPaid={(message) => {
                        setPaying(null);
                        setLastPaid(message);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Loaded>
      </Panel>

      <Panel title="Ordered, not yet delivered">
        <Loaded query={commitments}>
          {(promised) => (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className={th}>Order</th>
                    <th className={th}>Supplier</th>
                    <th className={th}>Approved</th>
                    <th className={thRight}>Order total</th>
                    <th className={thRight}>Delivered</th>
                    <th className={thRight}>Still to come</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {promised.commitments.length === 0 && (
                    <EmptyRow columns={6}>Every approved order has been delivered in full.</EmptyRow>
                  )}
                  {promised.commitments.map((commitment) => (
                    <tr key={commitment.purchaseOrderId}>
                      <td className={`${td} font-medium`}>{commitment.purchaseOrderNumber}</td>
                      <td className={td}>{commitment.supplierName}</td>
                      <td className={td}>{formatDate(commitment.approvedAt)}</td>
                      <td className={tdRight}>{kes(commitment.totalCents)}</td>
                      <td className={tdRight}>{kes(commitment.receivedCents)}</td>
                      <td className={`${tdRight} font-medium`}>{kes(commitment.outstandingCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
                Not owed yet: a bill is only raised when goods are received.
              </p>
            </div>
          )}
        </Loaded>
      </Panel>
    </div>
  );
}

function BillStatus({ bill }: { bill: Bill }) {
  if (!bill.supplierName) {
    return <Badge tone="neutral">Awaiting purchase order</Badge>;
  }

  if (bill.daysOverdue > 0) {
    return <Badge tone="bad">{`${bill.daysOverdue} day(s) overdue`}</Badge>;
  }

  return <Badge tone="good">Not due yet</Badge>;
}

// A bill's row, and beneath it the payment form while it is being paid
function BillRows({
  bill,
  paying,
  onPay,
  onCancel,
  onPaid,
}: {
  bill: Bill;
  paying: boolean;
  onPay: () => void;
  onCancel: () => void;
  onPaid: (message: string) => void;
}) {
  return (
    <>
      <tr>
        <td className={td}>
          <span className="font-medium">{bill.goodsReceivedNoteNumber}</span>
          <span className="ml-2 text-slate-500">{bill.purchaseOrderNumber}</span>
        </td>
        <td className={td}>{bill.supplierName ?? "–"}</td>
        <td className={td}>{formatDate(bill.dueDate)}</td>
        <td className={td}>
          <BillStatus bill={bill} />
        </td>
        <td className={tdRight}>{kes(bill.amountCents)}</td>
        <td className={`${tdRight} font-medium`}>{kes(bill.outstandingCents)}</td>
        <td className={`${td} text-right`}>
          {/* A bill with no supplier yet cannot be paid: nobody knows who to pay */}
          {bill.supplierName && !paying && (
            <Button variant="secondary" onClick={onPay}>
              Record payment
            </Button>
          )}
        </td>
      </tr>
      {paying && (
        <tr className="bg-slate-50">
          <td colSpan={7} className="px-4 py-3">
            <PaymentForm bill={bill} onCancel={onCancel} onPaid={onPaid} />
          </td>
        </tr>
      )}
    </>
  );
}

function PaymentForm({
  bill,
  onCancel,
  onPaid,
}: {
  bill: Bill;
  onCancel: () => void;
  onPaid: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  // Start at the full amount: paying in part is the exception
  const [amount, setAmount] = useState(toShillings(bill.outstandingCents));
  const [reference, setReference] = useState("");

  const pay = useMutation({
    mutationFn: recordPayment,
    onSuccess: (updated, sent) => {
      // Bills, supplier totals, the ledger and the balance sheet all just changed
      queryClient.invalidateQueries();
      onPaid(
        updated.status === "PAID"
          ? `${bill.goodsReceivedNoteNumber} is paid in full.`
          : `${kes(sent.amountCents)} paid towards ${bill.goodsReceivedNoteNumber}; ${kes(updated.outstandingCents)} still owed.`,
      );
    },
  });

  const amountCents = toCents(amount);
  const tooMuch = amountCents !== null && amountCents > bill.outstandingCents;
  const valid = amountCents !== null && amountCents > 0 && !tooMuch;

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) pay.mutate({ billId: bill.id, amountCents, reference });
      }}
    >
      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Amount paid (KES)</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="w-40 rounded-md border border-slate-300 bg-white px-3 py-2"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Bank or cheque reference (optional)</span>
        <input
          value={reference}
          maxLength={100}
          onChange={(event) => setReference(event.target.value)}
          className="w-64 rounded-md border border-slate-300 bg-white px-3 py-2"
        />
      </label>
      <Button type="submit" disabled={!valid || pay.isPending}>
        {pay.isPending ? "Saving…" : "Save payment"}
      </Button>
      <Button variant="secondary" onClick={onCancel} disabled={pay.isPending}>
        Cancel
      </Button>

      <p className="w-full text-sm text-red-700" role="alert">
        {pay.isError
          ? pay.error.message
          : amountCents === null
            ? "Amounts look like 4250 or 4250.50"
            : tooMuch
              ? `Only ${kes(bill.outstandingCents)} is still owed`
              : ""}
      </p>
    </form>
  );
}
