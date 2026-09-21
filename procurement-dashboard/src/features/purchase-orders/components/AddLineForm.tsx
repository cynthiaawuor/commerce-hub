import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { formatCents } from "../../../lib/format";
import { useAddLine, useSupplierCatalog } from "../hooks";

// The buyer picks a product and a quantity. The price is not asked for: the service reads
// it from the supplier's catalog and locks it onto the line.
export function AddLineForm({
  purchaseOrderId,
  supplierId,
}: {
  purchaseOrderId: string;
  supplierId: string;
}) {
  const catalog = useSupplierCatalog(supplierId);
  const addLine = useAddLine(purchaseOrderId);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await addLine.mutateAsync({ productId, quantityOrdered: quantity });
    setProductId("");
    setQuantity(1);
  };

  return (
    <form onSubmit={submit} className="mt-4 border-t border-slate-200 pt-4">
      {addLine.isError && (
        <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {addLine.error.message}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium text-slate-700">Product</span>
          <select
            required
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Choose a product…</option>
            {(catalog.data ?? []).map((item) => (
              <option key={item.id} value={item.productId}>
                {item.name} — {formatCents(Math.round(item.unitPrice * 100))}
              </option>
            ))}
          </select>
        </label>

        <label className="w-28 text-sm">
          <span className="mb-1 block font-medium text-slate-700">Quantity</span>
          <input
            type="number"
            min={1}
            required
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>

        <Button type="submit" disabled={!productId || addLine.isPending}>
          {addLine.isPending ? "Adding…" : "Add line"}
        </Button>
      </div>

      {catalog.data?.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">
          This supplier has no catalog items yet; add them in the Vendor Portal.
        </p>
      )}
    </form>
  );
}
