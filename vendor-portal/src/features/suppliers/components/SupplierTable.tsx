import { Link } from "react-router";
import { formatDate } from "../../../lib/format";
import type { Supplier } from "../../../types/supplier";
import { SupplierStatusBadge } from "./SupplierStatusBadge";

const headers = ["Name", "Email", "Phone", "Payment terms", "Status", "Added"];

export function SupplierTable({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium whitespace-nowrap">
                <Link to={`/suppliers/${supplier.id}`} className="text-slate-900 hover:underline">
                  {supplier.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{supplier.email}</td>
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{supplier.phone}</td>
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{supplier.paymentTerms}</td>
              <td className="px-4 py-3">
                <SupplierStatusBadge status={supplier.status} />
              </td>
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(supplier.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
