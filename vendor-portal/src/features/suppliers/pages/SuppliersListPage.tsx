import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button, buttonClass } from "../../../components/ui/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { inputClass } from "../../../components/ui/styles";
import type { SupplierStatus } from "../../../types/supplier";
import { SupplierTable } from "../components/SupplierTable";
import { useSuppliers } from "../hooks";

const PAGE_SIZE = 10;

type StatusFilter = "ALL" | SupplierStatus;

export function SuppliersListPage() {
  const { data: suppliers, isPending, isError, error, refetch } = useSuppliers();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  // GET /suppliers returns every supplier, so search, filter and paginate in the browser for now.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return (suppliers ?? [])
      .filter((supplier) => status === "ALL" || supplier.status === status)
      .filter(
        (supplier) =>
          !term || supplier.name.toLowerCase().includes(term) || supplier.email.toLowerCase().includes(term),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(firstIndex, firstIndex + PAGE_SIZE);

  const addSupplierLink = (
    <Link to="/suppliers/new" className={buttonClass()}>
      Add supplier
    </Link>
  );

  const renderContent = () => {
    if (isPending) {
      return <LoadingState label="Loading suppliers…" />;
    }

    if (isError) {
      return (
        <ErrorState
          title="Could not load suppliers"
          message={error.message}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      );
    }

    if (suppliers.length === 0) {
      return (
        <EmptyState
          title="No suppliers yet"
          message="Add your first approved supplier to get started."
          action={addSupplierLink}
        />
      );
    }

    return (
      <>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            aria-label="Search suppliers"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className={`${inputClass} sm:max-w-xs`}
          />
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              setPage(1);
            }}
            className={`${inputClass} sm:max-w-44`}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No suppliers match your search" message="Try a different name, email or status." />
        ) : (
          <>
            <SupplierTable suppliers={pageItems} />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>
                Showing {firstIndex + 1}–{firstIndex + pageItems.length} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Browse, add and update approved suppliers."
        actions={addSupplierLink}
      />
      {renderContent()}
    </>
  );
}
