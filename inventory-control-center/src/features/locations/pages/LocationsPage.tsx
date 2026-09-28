import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { useCreateLocation, useLocations } from "../../stock/hooks";

// Where stock can be. Inventory records where stock is, not what kind of place it is.
export function LocationsPage() {
  const locations = useLocations();
  const createLocation = useCreateLocation();
  const [form, setForm] = useState({ code: "", name: "" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createLocation.mutateAsync(form);
    setForm({ code: "", name: "" });
  };

  return (
    <>
      <PageHeader title="Locations" description="Warehouses and store backrooms holding stock." />

      <form onSubmit={submit} className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
        {createLocation.isError && (
          <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {createLocation.error.message}
          </p>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Code</span>
            <input
              required
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              placeholder="STORE-4"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium text-slate-700">Name</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Retail store 4"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" disabled={createLocation.isPending}>
            {createLocation.isPending ? "Saving…" : "Add location"}
          </Button>
        </div>
      </form>

      {locations.isPending ? (
        <LoadingState label="Loading locations…" />
      ) : locations.isError ? (
        <ErrorState message={locations.error.message} />
      ) : locations.data.length === 0 ? (
        <EmptyState title="No locations" message="Add a warehouse or store to hold stock." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.data.map((location) => (
                <tr key={location.id}>
                  <td className="px-4 py-3 font-medium">{location.code}</td>
                  <td className="px-4 py-3 text-slate-600">{location.name}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {location.isActive ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
