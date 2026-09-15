import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import type { CatalogItem } from "../../../types/catalog-item";
import { useCatalogItems, useCreateCatalogItem, useDeleteCatalogItem, useUpdateCatalogItem } from "../hooks";
import { CatalogItemFormDialog, type CatalogItemFormValues } from "./CatalogItemFormDialog";
import { CatalogTable } from "./CatalogTable";

// A supplier's catalog on the detail page: list, add, edit and remove items.
export function CatalogSection({ supplierId }: { supplierId: string }) {
  const { data: items, isPending, isError, error, refetch } = useCatalogItems(supplierId);
  const createItem = useCreateCatalogItem(supplierId);
  const updateItem = useUpdateCatalogItem(supplierId);
  const deleteItem = useDeleteCatalogItem(supplierId);

  // null = form closed, "new" = adding an item, CatalogItem = editing that item
  const [formTarget, setFormTarget] = useState<CatalogItem | "new" | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);

  const saveItem = async (values: CatalogItemFormValues) => {
    if (formTarget === "new") {
      await createItem.mutateAsync(values);
    } else if (formTarget) {
      await updateItem.mutateAsync({ id: formTarget.id, input: values });
    }
    // Only reached when the save succeeded; on failure the form stays open and shows the error
    setFormTarget(null);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    deleteItem.mutate(itemToDelete.id, { onSuccess: () => setItemToDelete(null) });
  };

  const cancelDelete = () => {
    setItemToDelete(null);
    deleteItem.reset();
  };

  const renderContent = () => {
    if (isPending) {
      return <LoadingState label="Loading catalog…" />;
    }

    if (isError) {
      return (
        <ErrorState
          title="Could not load the catalog"
          message={error.message}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      );
    }

    if (items.length === 0) {
      return (
        <EmptyState title="No catalog items yet" message="Add the products this supplier is approved to provide." />
      );
    }

    return <CatalogTable items={items} onEdit={setFormTarget} onDelete={setItemToDelete} />;
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Catalog items</h2>
        <Button onClick={() => setFormTarget("new")}>Add item</Button>
      </div>

      {renderContent()}

      <CatalogItemFormDialog
        open={formTarget !== null}
        item={formTarget === "new" ? null : formTarget}
        onClose={() => setFormTarget(null)}
        onSubmit={saveItem}
      />

      <ConfirmDialog
        open={itemToDelete !== null}
        title="Remove catalog item?"
        message={`${itemToDelete?.name ?? "This item"} will no longer be listed as supplied by this supplier.`}
        confirmLabel="Remove item"
        isPending={deleteItem.isPending}
        error={deleteItem.error?.message}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </section>
  );
}
