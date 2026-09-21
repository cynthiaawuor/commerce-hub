import { useNavigate } from "react-router";
import { Button } from "../../../components/ui/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatDateTime } from "../../../lib/format";
import { useConvertSuggestion, useDismissSuggestion, useSuggestions } from "../hooks";

// Raised automatically from Inventory's StockLow events. Nothing is ordered without a
// person: converting produces a draft that still goes through approval.
export function ReorderSuggestionsPage() {
  const navigate = useNavigate();
  const { data, isPending, isError, error, refetch } = useSuggestions("OPEN");
  const convert = useConvertSuggestion();
  const dismiss = useDismissSuggestion();

  const renderContent = () => {
    if (isPending) return <LoadingState label="Loading suggestions…" />;

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

    if (data.length === 0) {
      return (
        <EmptyState
          title="Nothing to reorder"
          message="Inventory has not reported any product below its reorder point."
        />
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Product</th>
              <th scope="col" className="px-4 py-3">Location</th>
              <th scope="col" className="px-4 py-3 text-right">Available</th>
              <th scope="col" className="px-4 py-3 text-right">Reorder point</th>
              <th scope="col" className="px-4 py-3 text-right">Suggested</th>
              <th scope="col" className="px-4 py-3">Reported</th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((suggestion) => (
              <tr key={suggestion.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="font-medium">{suggestion.productName}</span>
                  <span className="ml-2 text-xs text-slate-400">{suggestion.productId}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{suggestion.locationId}</td>
                <td className="px-4 py-3 text-right tabular-nums text-red-700">
                  {suggestion.quantityAvailable}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {suggestion.reorderPoint}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {suggestion.suggestedQuantity}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDateTime(suggestion.lastReportedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() =>
                        convert.mutate(suggestion.id, {
                          onSuccess: (order) => navigate(`/purchase-orders/${order.id}`),
                        })
                      }
                      disabled={convert.isPending}
                    >
                      Raise draft order
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        dismiss.mutate({ id: suggestion.id, reason: "Not needed" })
                      }
                      disabled={dismiss.isPending}
                    >
                      Dismiss
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Reorder suggestions"
        description="Products Inventory has reported below their reorder point."
        actions={<StatusBadge status="OPEN" />}
      />

      {(convert.isError || dismiss.isError) && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {(convert.error ?? dismiss.error)?.message}
        </p>
      )}

      {renderContent()}
    </>
  );
}
