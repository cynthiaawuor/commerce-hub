import { Link } from "react-router";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatCents, formatDate } from "../../../lib/format";
import type { PurchaseOrder } from "../../../types/purchase-order";

export function PurchaseOrderTable({ orders }: { orders: PurchaseOrder[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">PO number</th>
            <th scope="col" className="px-4 py-3">Supplier</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3 text-right">Total</th>
            <th scope="col" className="px-4 py-3">Raised by</th>
            <th scope="col" className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">
                <Link to={`/purchase-orders/${order.id}`} className="hover:underline">
                  {order.poNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{order.supplierName}</td>
              <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCents(order.totalCents)}</td>
              <td className="px-4 py-3 text-slate-600">{order.createdBy}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
