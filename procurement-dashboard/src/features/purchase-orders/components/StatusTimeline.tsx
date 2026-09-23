import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatDateTime } from "../../../lib/format";
import { usePurchaseOrderHistory } from "../hooks";

// The audit trail the spec asks for: who moved the order, when, and why
export function StatusTimeline({ purchaseOrderId }: { purchaseOrderId: string }) {
  const { data, isPending } = usePurchaseOrderHistory(purchaseOrderId);

  if (isPending) return <p className="text-sm text-slate-500">Loading history…</p>;

  return (
    <ol className="space-y-3">
      {(data ?? []).map((entry) => (
        <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <StatusBadge status={entry.toStatus} />
          <span className="text-slate-600">{entry.changedBy}</span>
          <span className="text-slate-400">{formatDateTime(entry.createdAt)}</span>
          {entry.reason && <span className="w-full text-slate-500">“{entry.reason}”</span>}
        </li>
      ))}
    </ol>
  );
}
