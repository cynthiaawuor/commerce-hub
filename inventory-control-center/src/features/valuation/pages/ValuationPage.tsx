import { useState } from "react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { formatCents } from "../../../lib/format";
import { useLocations } from "../../stock/hooks";
import { useValuation, useValuationLines } from "../hooks";

// "What is our stock worth?" — the figure finance asks for, and the lines behind it.
export function ValuationPage() {
  const [locationId, setLocationId] = useState("");
  const locations = useLocations();
  const summary = useValuation(locationId);
  const lines = useValuationLines(locationId);

  return (
    <>
      <PageHeader
        title="Valuation"
        description="Stock on hand at weighted average cost. Reserved stock is still ours, so it counts."
      />

      <select
        value={locationId}
        onChange={(event) => setLocationId(event.target.value)}
        className="mb-6 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">Every location</option>
        {(locations.data ?? []).map((location) => (
          <option key={location.id} value={location.id}>
            {location.code} — {location.name}
          </option>
        ))}
      </select>

      {summary.isPending ? (
        <LoadingState label="Valuing stock…" />
      ) : summary.isError ? (
        <ErrorState message={summary.error.message} />
      ) : summary.data.totalUnits === 0 ? (
        <EmptyState title="No stock held" message="Nothing to value yet." />
      ) : (
        <div className="grid gap-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Total stock value</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {formatCents(summary.data.totalValueCents)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              across {summary.data.totalUnits} units
            </p>

            <table className="mt-6 min-w-full divide-y divide-slate-200 text-sm">
              <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Location</th>
                  <th className="py-2 text-right">Units</th>
                  <th className="py-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.data.locations.map((location) => (
                  <tr key={location.locationId}>
                    <td className="py-2">
                      {location.code}
                      <span className="ml-2 text-xs text-slate-400">{location.name}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{location.units}</td>
                    <td className="py-2 text-right font-medium tabular-nums">
                      {formatCents(location.valueCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Where the value sits</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2">Product</th>
                    <th className="py-2">Location</th>
                    <th className="py-2 text-right">On hand</th>
                    <th className="py-2 text-right">Average cost</th>
                    <th className="py-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(lines.data ?? []).map((line) => (
                    <tr key={`${line.sku}-${line.locationCode}`}>
                      <td className="py-2">
                        {line.sku}
                        <span className="ml-2 text-xs text-slate-400">{line.productName}</span>
                      </td>
                      <td className="py-2 text-slate-600">{line.locationCode}</td>
                      <td className="py-2 text-right tabular-nums">{line.onHand}</td>
                      <td className="py-2 text-right tabular-nums">{formatCents(line.averageCostCents)}</td>
                      <td className="py-2 text-right font-medium tabular-nums">{formatCents(line.valueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
