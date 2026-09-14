import { useParams } from "react-router";
import { PageHeader } from "../../../components/ui/PageHeader";

export function EditSupplierPage() {
  const { supplierId = "" } = useParams();

  return (
    <>
      <PageHeader title="Edit supplier" description={`Supplier ID: ${supplierId}`} />
      {/* TODO: SupplierForm prefilled with useSupplier, saved with useUpdateSupplier */}
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
        Supplier form
      </div>
    </>
  );
}
