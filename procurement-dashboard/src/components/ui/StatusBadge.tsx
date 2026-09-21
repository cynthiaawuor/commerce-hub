import { formatStatus } from "../../lib/format";
import type { PurchaseOrderStatus } from "../../types/purchase-order";

// Colour carries meaning: grey is in progress, amber is waiting on a person,
// green has been agreed, red stopped, blue is in motion.
const styles: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SENT: "bg-blue-100 text-blue-800",
  PARTIALLY_RECEIVED: "bg-indigo-100 text-indigo-800",
  CLOSED: "bg-slate-800 text-white",
  CANCELLED: "bg-red-50 text-red-700",
  OPEN: "bg-amber-100 text-amber-800",
  DISMISSED: "bg-slate-200 text-slate-700",
  CONVERTED: "bg-green-100 text-green-800",
};

export function StatusBadge({ status }: { status: PurchaseOrderStatus | string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.DRAFT}`}
    >
      {formatStatus(status)}
    </span>
  );
}
