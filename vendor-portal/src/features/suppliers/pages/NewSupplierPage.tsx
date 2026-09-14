import { PageHeader } from "../../../components/ui/PageHeader";

export function NewSupplierPage() {
  return (
    <>
      <PageHeader title="Add supplier" description="Register a new approved supplier." />
      {/* TODO: SupplierForm (useCreateSupplier) */}
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
        Supplier form
      </div>
    </>
  );
}
