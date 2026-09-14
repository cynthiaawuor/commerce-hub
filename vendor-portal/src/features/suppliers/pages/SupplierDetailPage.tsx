import { Link, useParams } from "react-router";
import { PageHeader } from "../../../components/ui/PageHeader";

export function SupplierDetailPage() {
  const { supplierId = "" } = useParams();

  return (
    <>
      <PageHeader
        title="Supplier details"
        description={`Supplier ID: ${supplierId}`}
        actions={
          <Link
            to={`/suppliers/${supplierId}/edit`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            Edit
          </Link>
        }
      />
      <div className="grid gap-6">
        {/* TODO: supplier profile (useSupplier) */}
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Supplier profile
        </div>
        {/* TODO: CatalogTable + CatalogItemFormDialog (useCatalogItems) */}
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Catalog items
        </div>
      </div>
    </>
  );
}
