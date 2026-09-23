import { Link } from "react-router";
import { buttonClass } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link to="/purchase-orders" className={`${buttonClass("secondary")} mt-4`}>
        Back to purchase orders
      </Link>
    </div>
  );
}
