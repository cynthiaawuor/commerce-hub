import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { formatDateTime, formatMovementType } from "../../../lib/format";
import { useProducts } from "../../products/hooks";
import { useAdjustStock, useLocations, useMovements, useStockByProduct } from "../hooks";

// The question this page answers: how much of a product do we have, and where?
// Then: correct it, and show the ledger that explains the number.
export function StockPage() {
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const products = useProducts(1, search);
  const locations = useLocations();
  const levels = useStockByProduct(productId);
  const movements = useMovements(productId);
  const adjust = useAdjustStock();

  const [form, setForm] = useState({ locationId: "", quantity: "", reason: "", reference: "" });

  const selected = products.data?.data.find((product) => product.id === productId);

  const submitAdjustment = async (event: React.FormEvent) => {
    event.preventDefault();
    await adjust.mutateAsync({
      productId,
      locationId: form.locationId,
      quantity: Number(form.quantity),
      reason: form.reason.trim(),
      ...(form.reference.trim() ? { reference: form.reference.trim() } : {}),
    });
    setForm({ ...form, quantity: "", reason: "", reference: "" });
  };

  return (
    <>
      <PageHeader
        title="Stock"
        description="How much of each product the business holds, and where it is."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products by SKU or name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:max-w-xs"
        />
        <select
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-sm"
        >
          <option value="">Choose a product…</option>
          {(products.data?.data ?? []).map((product) => (
            <option key={product.id} value={product.id}>
              {product.sku} — {product.name}
            </option>
          ))}
        </select>
      </div>

      {!productId ? (
        <EmptyState
          title="Choose a product"
          message="Pick a product to see where its stock is and correct a quantity."
        />
      ) : levels.isPending ? (
        <LoadingState label="Loading stock…" />
      ) : levels.isError ? (
        <ErrorState message={levels.error.message} />
      ) : (
        <div className="grid gap-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {selected?.name ?? "Stock"}{" "}
              <span className="text-sm font-normal text-slate-500">
                reorder point {selected?.reorderPoint ?? 0}
              </span>
            </h2>

            {levels.data.length === 0 ? (
              <p className="text-sm text-slate-500">
                No stock anywhere yet. A location appears here once stock arrives.
              </p>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2">Location</th>
                    <th className="py-2 text-right">On hand</th>
                    <th className="py-2 text-right">Allocated</th>
                    <th className="py-2 text-right">Available</th>
                    <th className="py-2 text-right">On order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {levels.data.map((level) => (
                    <tr key={level.locationId}>
                      <td className="py-2">{level.location?.code ?? level.locationId}</td>
                      <td className="py-2 text-right tabular-nums">{level.onHand}</td>
                      <td className="py-2 text-right tabular-nums text-amber-700">{level.allocated}</td>
                      <td className="py-2 text-right font-medium tabular-nums">{level.available}</td>
                      <td className="py-2 text-right tabular-nums text-slate-500">{level.onOrder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-1 text-lg font-semibold">Correct a quantity</h2>
            <p className="mb-4 text-sm text-slate-500">
              A stock count, damage or shrinkage. A reason is required, so every change to
              stock can be explained later.
            </p>

            {adjust.isError && (
              <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {adjust.error.message}
              </p>
            )}

            <form onSubmit={submitAdjustment} className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Location</span>
                <select
                  required
                  value={form.locationId}
                  onChange={(event) => setForm({ ...form, locationId: event.target.value })}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Choose…</option>
                  {(locations.data ?? []).map((location) => (
                    <option key={location.id} value={location.id}>{location.code}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Quantity</span>
                <input
                  type="number"
                  required
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                  placeholder="+10 or -3"
                  className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="flex-1 text-sm">
                <span className="mb-1 block font-medium text-slate-700">Reason</span>
                <input
                  required
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  placeholder="Stock count, damaged in handling…"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Reference</span>
                <input
                  value={form.reference}
                  onChange={(event) => setForm({ ...form, reference: event.target.value })}
                  placeholder="COUNT-001"
                  className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <Button type="submit" disabled={adjust.isPending}>
                {adjust.isPending ? "Recording…" : "Record adjustment"}
              </Button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Movement history</h2>
            {(movements.data ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Nothing recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="py-2 pr-6 whitespace-nowrap">When</th>
                      <th className="py-2 pr-6 whitespace-nowrap">Type</th>
                      <th className="py-2 pr-6 text-right whitespace-nowrap">Change</th>
                      <th className="py-2 pr-6 text-right whitespace-nowrap">On hand after</th>
                      <th className="py-2 pr-6 whitespace-nowrap">Why</th>
                      <th className="py-2 whitespace-nowrap">By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(movements.data ?? []).map((movement) => (
                      <tr key={movement.id}>
                        <td className="py-2 pr-6 whitespace-nowrap text-slate-500">{formatDateTime(movement.createdAt)}</td>
                        <td className="py-2 pr-6 whitespace-nowrap">{formatMovementType(movement.type)}</td>
                        <td className={`py-2 pr-6 text-right tabular-nums ${movement.quantity < 0 ? "text-red-700" : "text-green-700"}`}>
                          {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                        </td>
                        <td className="py-2 pr-6 text-right tabular-nums">{movement.onHandAfter}</td>
                        <td className="py-2 pr-6 text-slate-600">{movement.reason ?? movement.reference ?? "—"}</td>
                        <td className="py-2 text-slate-500">{movement.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
