import { useState } from "react";
import { Link } from "react-router";
import { Button, buttonClass } from "../../../components/ui/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { formatStatus } from "../../../lib/format";
import type { PurchaseOrderStatus } from "../../../types/purchase-order";
import { PurchaseOrderTable } from "../components/PurchaseOrderTable";
import { usePurchaseOrders } from "../hooks";

const STATUSES: PurchaseOrderStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "PARTIALLY_RECEIVED",
  "CLOSED",
  "REJECTED",
  "CANCELLED",
];

export function PurchaseOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PurchaseOrderStatus | "">("");

  // The API pages the data, so the browser never holds more than one page
  const { data, isPending, isError, error, refetch } = usePurchaseOrders(
    page,
    status || undefined,
  );

  const renderContent = () => {
    if (isPending) return <LoadingState label="Loading purchase orders…" />;

    if (isError) {
      return (
        <ErrorState
          message={error.message}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      );
    }

    if (data.data.length === 0) {
      return (
        <EmptyState
          title="No purchase orders"
          message={status ? "No orders with this status." : "Raise your first order to get started."}
        />
      );
    }

    return (
      <>
        <PurchaseOrderTable orders={data.data} />
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <p>
            Page {data.meta.page} of {Math.max(data.meta.totalPages, 1)} · {data.meta.total} orders
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page <= 1}>
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage(page + 1)}
              disabled={page >= data.meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <PageHeader
        title="Purchase orders"
        description="What the business has committed to buy, and where each order has reached."
        actions={
          <Link to="/purchase-orders/new" className={buttonClass()}>
            New purchase order
          </Link>
        }
      />

      <div className="mb-4">
        <label className="text-sm text-slate-600">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PurchaseOrderStatus | "");
              setPage(1);
            }}
            className="ml-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {formatStatus(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {renderContent()}
    </>
  );
}
