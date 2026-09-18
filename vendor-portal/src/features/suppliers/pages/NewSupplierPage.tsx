import { useNavigate } from "react-router";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SupplierForm } from "../components/SupplierForm";
import { useCreateSupplier } from "../hooks";

export function NewSupplierPage() {
  const navigate = useNavigate();
  const createSupplier = useCreateSupplier();

  return (
    <>
      <PageHeader title="Add supplier" description="Register a new approved supplier." />
      <SupplierForm
        submitLabel="Create supplier"
        cancelTo="/suppliers"
        onSubmit={async (values) => {
          const supplier = await createSupplier.mutateAsync(values);
          navigate(`/suppliers/${supplier.id}`);
        }}
      />
    </>
  );
}
