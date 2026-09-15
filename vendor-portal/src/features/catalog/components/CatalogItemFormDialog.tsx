import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import { FormField } from "../../../components/ui/FormField";
import { inputClass } from "../../../components/ui/styles";
import { ApiError } from "../../../lib/api-client";
import type { CatalogItem, CreateCatalogItemInput } from "../../../types/catalog-item";

export type CatalogItemFormValues = CreateCatalogItemInput;

type CatalogItemFormDialogProps = {
  open: boolean;
  // The item being edited, or null when adding a new one
  item: CatalogItem | null;
  onClose: () => void;
  // Should throw on failure; the form shows the API error next to the right field.
  onSubmit: (values: CatalogItemFormValues) => Promise<unknown>;
};

export function CatalogItemFormDialog({ open, item, onClose, onSubmit }: CatalogItemFormDialogProps) {
  return (
    <Dialog open={open} title={item ? `Edit ${item.name}` : "Add catalog item"} onClose={onClose}>
      <CatalogItemForm item={item} onCancel={onClose} onSubmit={onSubmit} />
    </Dialog>
  );
}

const fieldNames: (keyof CatalogItemFormValues)[] = ["productId", "name", "description", "unitPrice", "leadTimeDays"];

const trim = (value: string) => value.trim();

// Lives inside the Dialog, so it mounts fresh (with the right default values) every time the dialog opens.
function CatalogItemForm({
  item,
  onCancel,
  onSubmit,
}: {
  item: CatalogItem | null;
  onCancel: () => void;
  onSubmit: (values: CatalogItemFormValues) => Promise<unknown>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CatalogItemFormValues>({
    defaultValues: item
      ? {
          productId: item.productId,
          name: item.name,
          description: item.description,
          unitPrice: item.unitPrice,
          leadTimeDays: item.leadTimeDays,
        }
      : { productId: "", name: "", description: "" },
  });

  const showServerErrors = (error: unknown) => {
    // 400 responses from service-vendor carry { field: [messages] }
    if (error instanceof ApiError && error.details && typeof error.details === "object") {
      const details = error.details as Record<string, string[] | undefined>;
      const fieldsWithErrors = fieldNames.filter((field) => details[field]?.length);

      fieldsWithErrors.forEach((field) => setError(field, { message: details[field]!.join(". ") }));
      if (fieldsWithErrors.length > 0) return;
    }

    setError("root.server", {
      message: error instanceof Error ? error.message : "Could not save the catalog item. Please try again.",
    });
  };

  const submit = async (values: CatalogItemFormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      showServerErrors(error);
    }
  };

  const errorProps = (field: keyof CatalogItemFormValues) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      {errors.root?.server && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errors.root.server.message}
        </p>
      )}

      <FormField
        id="productId"
        label="Product ID"
        hint="The product's ID in the Inventory service"
        error={errors.productId?.message}
      >
        <input
          id="productId"
          className={inputClass}
          {...errorProps("productId")}
          {...register("productId", { required: "Product ID is required", setValueAs: trim })}
        />
      </FormField>

      <FormField id="name" label="Name" error={errors.name?.message}>
        <input
          id="name"
          className={inputClass}
          {...errorProps("name")}
          {...register("name", { required: "Name is required", setValueAs: trim })}
        />
      </FormField>

      {/* Optional in the UI, but the API expects a string, so a blank field is sent as "" */}
      <FormField id="description" label="Description (optional)" error={errors.description?.message}>
        <textarea
          id="description"
          rows={3}
          className={inputClass}
          {...errorProps("description")}
          {...register("description", { setValueAs: (value?: string) => value?.trim() ?? "" })}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* valueAsNumber sends a real number; the API rejects numeric strings like "10" */}
        <FormField id="unitPrice" label="Unit price (KES)" error={errors.unitPrice?.message}>
          <input
            id="unitPrice"
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            {...errorProps("unitPrice")}
            {...register("unitPrice", {
              valueAsNumber: true,
              validate: (value) => (Number.isFinite(value) && value > 0) || "Enter a price greater than 0",
            })}
          />
        </FormField>

        <FormField id="leadTimeDays" label="Lead time (days)" error={errors.leadTimeDays?.message}>
          <input
            id="leadTimeDays"
            type="number"
            step="1"
            min="0"
            className={inputClass}
            {...errorProps("leadTimeDays")}
            {...register("leadTimeDays", {
              valueAsNumber: true,
              validate: (value) => (Number.isInteger(value) && value >= 0) || "Enter whole days (0 or more)",
            })}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : item ? "Save changes" : "Add item"}
        </Button>
      </div>
    </form>
  );
}
