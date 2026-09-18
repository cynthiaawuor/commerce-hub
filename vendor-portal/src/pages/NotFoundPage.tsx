import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
      <Link to="/suppliers" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
        Back to suppliers
      </Link>
    </div>
  );
}
