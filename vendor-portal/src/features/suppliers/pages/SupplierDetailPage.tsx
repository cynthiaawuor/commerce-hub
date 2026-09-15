import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button, buttonClass } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { PageHeader } from "../../../components/ui/PageHeader";
import { LoadingState } from "../../../components/ui/States";
import { formatDate } from "../../../lib/format";
import { CatalogSection } from "../../catalog/components/CatalogSection";
import { SupplierLoadError } from "../components/SupplierLoadError";
import { SupplierStatusBadge } from "../components/SupplierStatusBadge";
import { useDeleteSupplier, useSupplier, useUpdateSupplier } from "../hooks";

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export function SupplierDetailPage() {
  const { supplierId = "" } = useParams();
  const navigate = useNavigate();
  const { data: supplier, isPending, isError, error } = useSupplier(supplierId);
  const updateSupplier = useUpdateSupplier(supplierId);
  const deleteSupplier = useDeleteSupplier();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isPending) {
    return <LoadingState label="Loading supplier…" />;
  }

  if (isError) {
    return <SupplierLoadError error={error} />;
  }

  const isActive = supplier.status === "ACTIVE";

  const toggleStatus = () =>
    updateSupplier.mutate({ status: isActive ? "INACTIVE" : "ACTIVE" });

  const confirmDelete = () =>
    deleteSupplier.mutate(supplierId, {
      onSuccess: () => navigate("/suppliers", { replace: true }),
    });

  const cancelDelete = () => {
    setConfirmingDelete(false);
    deleteSupplier.reset();
  };

  return (
    <>
      <PageHeader
        title={supplier.name}
        description={`Added ${formatDate(supplier.createdAt)}`}
        actions={
          <>
            <Link
              to={`/suppliers/${supplier.id}/edit`}
              className={buttonClass("secondary")}
            >
              Edit
            </Link>
            <Button
              variant="secondary"
              onClick={toggleStatus}
              disabled={updateSupplier.isPending}
            >
              {updateSupplier.isPending
                ? "Saving…"
                : isActive
                  ? "Deactivate"
                  : "Activate"}
            </Button>
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              Delete
            </Button>
          </>
        }
      />

      {updateSupplier.isError && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          Could not update the status: {updateSupplier.error.message}
        </p>
      )}

      <div className="grid gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Profile</h2>
            <SupplierStatusBadge status={supplier.status} />
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Email">
              <a href={`mailto:${supplier.email}`} className="hover:underline">
                {supplier.email}
              </a>
            </DetailItem>
            <DetailItem label="Phone">
              <a href={`tel:${supplier.phone}`} className="hover:underline">
                {supplier.phone}
              </a>
            </DetailItem>
            <DetailItem label="Payment terms">
              {supplier.paymentTerms}
            </DetailItem>
            <DetailItem label="Last updated">
              {formatDate(supplier.updatedAt)}
            </DetailItem>
          </dl>
        </section>

        <CatalogSection supplierId={supplier.id} canAddItems={isActive} />
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete supplier?"
        message={`This permanently deletes ${supplier.name} together with its catalog items and delivery history. To stop ordering from them but keep their records, deactivate them instead.`}
        confirmLabel="Delete supplier"
        isPending={deleteSupplier.isPending}
        error={deleteSupplier.error?.message}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
