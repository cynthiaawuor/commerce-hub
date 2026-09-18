import { Button } from "../../../components/ui/Button";
import { formatCurrency } from "../../../lib/format";
import type { CatalogItem } from "../../../types/catalog-item";

type CatalogTableProps = {
  items: CatalogItem[];
  onEdit: (item: CatalogItem) => void;
  onDelete: (item: CatalogItem) => void;
};

const headers = ["Product ID", "Name", "Unit price", "Lead time", ""];

// Display only: the parent decides what Edit and Delete do.
export function CatalogTable({ items, onEdit, onDelete }: CatalogTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col" className="px-4 py-3 whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} className="align-top hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{item.productId}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{item.name}</p>
                {item.description && <p className="mt-0.5 text-slate-500">{item.description}</p>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {item.leadTimeDays} {item.leadTimeDays === 1 ? "day" : "days"}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => onDelete(item)} aria-label={`Remove ${item.name}`}>
                    Remove
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
