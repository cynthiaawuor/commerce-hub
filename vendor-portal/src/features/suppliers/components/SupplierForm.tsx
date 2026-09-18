import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { inputClass } from "../../../components/ui/styles";
import { ApiError } from "../../../lib/api-client";
import type { CreateSupplierInput } from "../../../types/supplier";
export type SupplierFormValues = CreateSupplierInput;

const PAYMENT_TERMS = [
  { value: "COD", label: "Cash on delivery" },
  { value: "NET_7", label: "Net 7 days" },
  { value: "NET_15", label: "Net 15 days" },
  { value: "NET_30", label: "Net 30 days" },
  { value: "NET_45", label: "Net 45 days" },
  { value: "NET_60", label: "Net 60 days" },
  { value: "NET_90", label: "Net 90 days" },
];

type SupplierFormProps = {
  defaultValues?: SupplierFormValues;
  submitLabel: string;
  cancelTo: string;
  // Should throw on failure; the form shows the API error next to the right field.
  onSubmit: (values: SupplierFormValues) => Promise<unknown>;
};

const emptyValues: SupplierFormValues = { name: "", email: "", phone: "", paymentTerms: "NET_30" };
const fieldNames = Object.keys(emptyValues) as (keyof SupplierFormValues)[];

const trim = (value: string) => value.trim();

export function SupplierForm({ defaultValues = emptyValues, submitLabel, cancelTo, onSubmit }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({ defaultValues });

  // Keep an unrecognised stored value selectable instead of silently replacing it.
  const termOptions = PAYMENT_TERMS.some((term) => term.value === defaultValues.paymentTerms)
    ? PAYMENT_TERMS
    : [...PAYMENT_TERMS, { value: defaultValues.paymentTerms, label: defaultValues.paymentTerms }];

  const showServerErrors = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      setError("email", { message: error.message });
      return;
    }

    // 400 responses from service-vendor carry { field: [messages] }
    if (error instanceof ApiError && error.details && typeof error.details === "object") {
      const details = error.details as Record<string, string[] | undefined>;
      const fieldsWithErrors = fieldNames.filter((field) => details[field]?.length);

      fieldsWithErrors.forEach((field) => setError(field, { message: details[field]!.join(". ") }));
      if (fieldsWithErrors.length > 0) return;
    }

    setError("root.server", {
      message: error instanceof Error ? error.message : "Could not save the supplier. Please try again.",
    });
  };

  const submit = async (values: SupplierFormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      showServerErrors(error);
    }
  };

  const errorProps = (field: keyof SupplierFormValues) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="max-w-2xl space-y-5 rounded-lg border border-slate-200 bg-white p-6"
    >
      {errors.root?.server && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errors.root.server.message}
        </p>
      )}

      <FormField id="name" label="Supplier name" error={errors.name?.message}>
        <input
          id="name"
          className={inputClass}
          {...errorProps("name")}
          {...register("name", { required: "Supplier name is required", setValueAs: trim })}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="email" label="Email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="off"
            className={inputClass}
            {...errorProps("email")}
            {...register("email", {
              required: "Email is required",
              setValueAs: trim,
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" },
            })}
          />
        </FormField>

        <FormField
          id="phone"
          label="Phone"
          hint="International format, e.g. +254712345678"
          error={errors.phone?.message}
        >
          <input
            id="phone"
            type="tel"
            className={inputClass}
            {...errorProps("phone")}
            {...register("phone", {
              required: "Phone is required",
              setValueAs: (value: string) => value.replace(/\s+/g, ""),
              pattern: { value: /^\+[1-9]\d{7,14}$/, message: "Use international format, e.g. +254712345678" },
            })}
          />
        </FormField>
      </div>

      <FormField id="paymentTerms" label="Payment terms" error={errors.paymentTerms?.message}>
        <select
          id="paymentTerms"
          className={inputClass}
          {...errorProps("paymentTerms")}
          {...register("paymentTerms", { required: "Payment terms are required" })}
        >
          {termOptions.map((term) => (
            <option key={term.value} value={term.value}>
              {term.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        <Link to={cancelTo} className={buttonClass("secondary")}>
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
