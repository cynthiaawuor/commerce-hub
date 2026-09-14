import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../../components/ui/PageHeader";
import { LoadingState } from "../../../components/ui/States";
import { SupplierForm } from "../components/SupplierForm";
import { SupplierLoadError } from "../components/SupplierLoadError";
import { useSupplier, useUpdateSupplier } from "../hooks";

export function EditSupplierPage() {
  const { supplierId = "" } = useParams();
  const navigate = useNavigate();
  const { data: supplier, isPending, isError, error } = useSupplier(supplierId);
  const updateSupplier = useUpdateSupplier(supplierId);

  if (isPending) {
    return <LoadingState label="Loading supplier…" />;
  }

  if (isError) {
    return <SupplierLoadError error={error} />;
  }

  const { name, email, phone, paymentTerms } = supplier;

  return (
    <>
      <PageHeader title={`Edit ${supplier.name}`} description="Update contact details and payment terms." />
      {/* Rendered only once the supplier is loaded, so the form starts with its current values */}
      <SupplierForm
        defaultValues={{ name, email, phone, paymentTerms }}
        submitLabel="Save changes"
        cancelTo={`/suppliers/${supplierId}`}
        onSubmit={async (values) => {
          await updateSupplier.mutateAsync(values);
          navigate(`/suppliers/${supplierId}`);
        }}
      />
    </>
  );
}
