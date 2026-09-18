import { Link } from "react-router";
import { buttonClass } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/States";
import { ApiError } from "../../../lib/api-client";

// Shown by the detail and edit pages when the supplier can't be loaded.
export function SupplierLoadError({ error }: { error: Error }) {
  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <ErrorState
      title={notFound ? "Supplier not found" : "Could not load supplier"}
      message={notFound ? "It may have been deleted." : error.message}
      action={
        <Link to="/suppliers" className={buttonClass("secondary")}>
          Back to suppliers
        </Link>
      }
    />
  );
}
