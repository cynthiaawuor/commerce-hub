import { useEffect, useState } from "react";
import { useProduct, useProductSearch } from "../../features/products/hooks";
import type { InventoryProduct } from "../../features/products/api";
import { inputClass } from "./styles";

type ProductPickerProps = {
  // The chosen product's id in Inventory, or "" when nothing is chosen yet
  value: string;
  onChange: (product: InventoryProduct | null) => void;
  invalid?: boolean;
};

// Nobody can remember a UUID. This searches Inventory as you type and hands back the
// product, so the form stores an id while the user only ever sees SKUs and names.
export function ProductPicker({ value, onChange, invalid }: ProductPickerProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  // Wait for a pause in typing rather than searching on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const results = useProductSearch(debounced);
  // When editing an existing item we start with an id and no name to show
  const chosen = useProduct(value);

  if (value && chosen.data && !open) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-slate-300 bg-slate-50 px-3 py-2">
        <span className="text-sm">
          <span className="font-medium">{chosen.data.sku}</span>
          <span className="ml-2 text-slate-600">{chosen.data.name}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setSearch("");
          }}
          className="text-sm text-slate-600 underline hover:text-slate-900"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="search"
        value={search}
        autoComplete="off"
        onChange={(event) => {
          setSearch(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search by SKU or name, e.g. MAIZE"
        className={inputClass}
        aria-invalid={invalid ? true : undefined}
      />

      {open && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {results.isPending ? (
            <li className="px-3 py-2 text-sm text-slate-500">Searching…</li>
          ) : results.isError ? (
            <li className="px-3 py-2 text-sm text-red-700">
              Could not reach Inventory: {results.error.message}
            </li>
          ) : results.data.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">
              No products match. They are created in the Inventory Control Center.
            </li>
          ) : (
            results.data.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(product);
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                >
                  <span className="font-medium">{product.sku}</span>
                  <span className="ml-2 text-slate-600">{product.name}</span>
                  <span className="ml-2 text-xs text-slate-400">per {product.unitOfMeasure}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
