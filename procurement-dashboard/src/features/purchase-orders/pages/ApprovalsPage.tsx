import { Button } from "../../../components/ui/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { PurchaseOrderTable } from "../components/PurchaseOrderTable";
import { usePurchaseOrders } from "../hooks";

// Everything waiting on a decision, in one place. Approving happens on the order itself,
// where the buyer can see the lines they are agreeing to.
export function ApprovalsPage() {
  const { data, isPending, isError, error, refetch } = usePurchaseOrders(
    1,
    "PENDING_APPROVAL",
  );

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Orders waiting for a decision. Orders above KES 100,000 need a manager, and nobody may approve an order they raised."
      />

      {isPending ? (
        <LoadingState label="Loading approvals…" />
      ) : isError ? (
        <ErrorState
          message={error.message}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : data.data.length === 0 ? (
        <EmptyState title="Nothing waiting" message="No orders are pending approval." />
      ) : (
        <PurchaseOrderTable orders={data.data} />
      )}
    </>
  );
}
