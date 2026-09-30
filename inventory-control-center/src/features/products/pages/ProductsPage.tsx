import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { formatCents } from "../../../lib/format";
import { useCreateProduct, useProducts, useUpdateProduct } from "../hooks";

const emptyForm = { sku: "", name: "", unitOfMeasure: "each", reorderPoint: "", reorderQuantity: "" };

// The product master: the record every other service's productId points at.
export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const products = useProducts(page, search);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createProduct.mutateAsync({
      sku: form.sku,
      name: form.name,
      unitOfMeasure: form.unitOfMeasure,
      ...(form.reorderPoint ? { reorderPoint: Number(form.reorderPoint) } : {}),
      ...(form.reorderQuantity ? { reorderQuantity: Number(form.reorderQuantity) } : {}),
    });
    setForm(emptyForm);
    setShowForm(false);
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="What the business deals in. Other services quote these SKUs."
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add product"}
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={submit} className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          {createProduct.isError && (
            <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {createProduct.error.message}
            </p>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">SKU</span>
              <input
                required
                value={form.sku}
                onChange={(event) => setForm({ ...form, sku: event.target.value })}
                placeholder="MAIZE-2KG"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex-1 text-sm">
              <span className="mb-1 block font-medium text-slate-700">Name</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Unit</span>
              <input
                value={form.unitOfMeasure}
                onChange={(event) => setForm({ ...form, unitOfMeasure: event.target.value })}
                className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Reorder at</span>
              <input
                type="number"
                min={0}
                value={form.reorderPoint}
                onChange={(event) => setForm({ ...form, reorderPoint: event.target.value })}
                className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Order qty</span>
              <input
                type="number"
                min={0}
                value={form.reorderQuantity}
                onChange={(event) => setForm({ ...form, reorderQuantity: event.target.value })}
                className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <Button type="submit" disabled={createProduct.isPending}>
              {createProduct.isPending ? "Saving…" : "Create"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Average cost is not set here: it comes from goods received.
          </p>
        </form>
      )}

      <input
        type="search"
        value={search}
        onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        placeholder="Search by SKU or name"
        className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:max-w-xs"
      />

      {products.isPending ? (
        <LoadingState label="Loading products…" />
      ) : products.isError ? (
        <ErrorState message={products.error.message} />
      ) : products.data.data.length === 0 ? (
        <EmptyState title="No products" message="Add the first product to get started." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Reorder at</th>
                  <th className="px-4 py-3 text-right">Average cost</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.data.data.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{product.sku}</td>
                    <td className="px-4 py-3 text-slate-600">{product.name}</td>
                    <td className="px-4 py-3 text-slate-500">{product.unitOfMeasure}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{product.reorderPoint}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCents(product.averageCostCents)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${product.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}>
                        {product.isActive ? "Active" : "Retired"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        onClick={() => updateProduct.mutate({ id: product.id, input: { isActive: !product.isActive } })}
                        disabled={updateProduct.isPending}
                      >
                        {product.isActive ? "Retire" : "Restore"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <p>Page {products.data.meta.page} of {Math.max(products.data.meta.totalPages, 1)} · {products.data.meta.total} products</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button>
              <Button variant="secondary" onClick={() => setPage(page + 1)} disabled={page >= products.data.meta.totalPages}>Next</Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
