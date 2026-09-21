import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button, buttonClass } from "../../../components/ui/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../../../components/ui/States";
import { useCreatePurchaseOrder, useSuppliers } from "../hooks";

// Creating an order only needs a supplier: prices and terms come from Vendor Management,
// and lines are added on the order itself.
export function NewPurchaseOrderPage() {
  const navigate = useNavigate();
  const suppliers = useSuppliers();
  const createOrder = useCreatePurchaseOrder();
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");

  if (suppliers.isPending) return <LoadingState label="Loading suppliers…" />;

  if (suppliers.isError) {
    return (
      <ErrorState
        title="Could not reach Vendor Management"
        message={suppliers.error.message}
        action={
          <Link to="/purchase-orders" className={buttonClass("secondary")}>
            Back to orders
          </Link>
        }
      />
    );
  }

  const active = suppliers.data.filter((supplier) => supplier.status === "ACTIVE");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const order = await createOrder.mutateAsync({ supplierId, notes: notes.trim() });
    navigate(`/purchase-orders/${order.id}`);
  };

  return (
    <>
      <PageHeader
        title="New purchase order"
        description="Pick a supplier; their payment terms are locked onto the order."
      />

      <form onSubmit={submit} className="max-w-xl space-y-5 rounded-lg border border-slate-200 bg-white p-6">
        {createOrder.isError && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {createOrder.error.message}
          </p>
        )}

        <div>
          <label htmlFor="supplier" className="mb-1 block text-sm font-medium text-slate-700">
            Supplier
          </label>
          <select
            id="supplier"
            required
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Choose a supplier…</option>
            {active.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name} — {supplier.paymentTerms}
              </option>
            ))}
          </select>
          {active.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">
              No active suppliers. Add one in the Vendor Portal first.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">
            Notes <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Link to="/purchase-orders" className={buttonClass("secondary")}>
            Cancel
          </Link>
          <Button type="submit" disabled={!supplierId || createOrder.isPending}>
            {createOrder.isPending ? "Creating…" : "Create draft"}
          </Button>
        </div>
      </form>
    </>
  );
}
