import { Link } from "react-router";
import { PageHeader } from "../../../components/ui/PageHeader";

export function SuppliersListPage() {
  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Browse, add and update approved suppliers."
        actions={
          <Link to="/suppliers/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Add supplier
          </Link>
        }
      />
      {/* TODO: SupplierTable with pagination (useSuppliers) */}
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
        Supplier table
      </div>
    </>
  );
}
