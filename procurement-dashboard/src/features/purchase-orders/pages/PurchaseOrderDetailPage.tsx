import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button, buttonClass } from "../../../components/ui/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../../../components/ui/States";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ApiError } from "../../../lib/api-client";
import { formatCents, formatDate } from "../../../lib/format";
import { AddLineForm } from "../components/AddLineForm";
import { StatusTimeline } from "../components/StatusTimeline";
import {
  useDeleteDraft,
  usePurchaseOrder,
  usePurchaseOrderAction,
  useRemoveLine,
} from "../hooks";

export function PurchaseOrderDetailPage() {
  const { purchaseOrderId = "" } = useParams();
  const navigate = useNavigate();
  const { data: order, isPending, isError, error } = usePurchaseOrder(purchaseOrderId);
  const action = usePurchaseOrderAction(purchaseOrderId);
  const removeLine = useRemoveLine(purchaseOrderId);
  const deleteDraft = useDeleteDraft();
  const [reason, setReason] = useState("");

  if (isPending) return <LoadingState label="Loading purchase order…" />;

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        title={notFound ? "Purchase order not found" : "Could not load the order"}
        message={notFound ? "It may have been deleted." : error.message}
        action={
          <Link to="/purchase-orders" className={buttonClass("secondary")}>
            Back to orders
          </Link>
        }
      />
    );
  }

  const isDraft = order.status === "DRAFT";
  const run = (name: "submit" | "approve" | "cancel" | "send") =>
    action.mutate({ action: name });

  const reject = () => {
    action.mutate({ action: "reject", body: { reason } });
    setReason("");
  };

  return (
    <>
      <PageHeader
        title={order.poNumber}
        description={`${order.supplierName} · ${order.paymentTerms} · raised by ${order.createdBy} on ${formatDate(order.createdAt)}`}
        actions={
          <>
            {isDraft && (
              <Button onClick={() => run("submit")} disabled={action.isPending}>
                Submit for approval
              </Button>
            )}
            {order.status === "PENDING_APPROVAL" && (
              <Button onClick={() => run("approve")} disabled={action.isPending}>
                Approve
              </Button>
            )}
            {order.status === "APPROVED" && (
              <Button onClick={() => run("send")} disabled={action.isPending}>
                Mark as sent
              </Button>
            )}
            {!["CLOSED", "CANCELLED"].includes(order.status) && (
              <Button variant="secondary" onClick={() => run("cancel")} disabled={action.isPending}>
                Cancel order
              </Button>
            )}
            {isDraft && (
              <Button
                variant="danger"
                onClick={() =>
                  deleteDraft.mutate(order.id, {
                    onSuccess: () => navigate("/purchase-orders", { replace: true }),
                  })
                }
              >
                Delete draft
              </Button>
            )}
          </>
        }
      />

      {action.isError && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {action.error.message}
        </p>
      )}

      <div className="grid gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Order</h2>
            <StatusBadge status={order.status} />
          </div>

          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Total</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {formatCents(order.totalCents)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Approved by</dt>
              <dd className="mt-1 text-sm">{order.approvedBy ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Notes</dt>
              <dd className="mt-1 text-sm">{order.notes ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Lines</h2>

          {order.lines && order.lines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="py-2">Product</th>
                    <th scope="col" className="py-2 text-right">Ordered</th>
                    <th scope="col" className="py-2 text-right">Received</th>
                    <th scope="col" className="py-2 text-right">Unit cost</th>
                    <th scope="col" className="py-2 text-right">Line total</th>
                    {isDraft && <th scope="col" className="py-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="py-2">
                        {line.productName}
                        <span className="ml-2 text-xs text-slate-400">{line.productId}</span>
                      </td>
                      <td className="py-2 text-right tabular-nums">{line.quantityOrdered}</td>
                      <td className="py-2 text-right tabular-nums">{line.quantityReceived}</td>
                      <td className="py-2 text-right tabular-nums">{formatCents(line.unitCostCents)}</td>
                      <td className="py-2 text-right tabular-nums">
                        {formatCents(line.unitCostCents * line.quantityOrdered)}
                      </td>
                      {isDraft && (
                        <td className="py-2 text-right">
                          <Button
                            variant="secondary"
                            onClick={() => removeLine.mutate(line.id)}
                            disabled={removeLine.isPending}
                          >
                            Remove
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No lines yet. An order needs at least one line before it can be submitted.
            </p>
          )}

          {isDraft && (
            <AddLineForm purchaseOrderId={order.id} supplierId={order.supplierId} />
          )}
        </section>

        {order.status === "PENDING_APPROVAL" && (
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-2 text-lg font-semibold">Reject this order</h2>
            <p className="mb-3 text-sm text-slate-500">
              A reason is required, so the buyer knows what to change.
            </p>
            <div className="flex flex-wrap gap-3">
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                placeholder="e.g. Budget not approved for Q4"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <Button variant="danger" onClick={reject} disabled={!reason.trim() || action.isPending}>
                Reject
              </Button>
            </div>
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">History</h2>
          <StatusTimeline purchaseOrderId={order.id} />
        </section>
      </div>
    </>
  );
}
