import type { SupplierStatus } from "../../../types/supplier";

const styles: Record<SupplierStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-slate-200 text-slate-700",
};

const labels: Record<SupplierStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export function SupplierStatusBadge({ status }: { status: SupplierStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.INACTIVE}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
