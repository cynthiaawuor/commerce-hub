import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button, buttonClass } from "../../../components/ui/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../components/ui/States";
import { inputClass } from "../../../components/ui/styles";
import type { SupplierStatus } from "../../../types/supplier";
import { SupplierTable } from "../components/SupplierTable";
import { useSuppliers } from "../hooks";

const PAGE_SIZE = 10;

type StatusFilter = "ALL" | SupplierStatus;

export function SuppliersListPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  // Debounce so we don't fire a request on every keystroke; reset to page 1 on new search.

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isPending, isError, error, refetch, isPlaceholderData } =
    useSuppliers({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      status: status === "ALL" ? undefined : status,
    });

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

    const { data: suppliers, meta } = data;
    const hasFilters = debouncedSearch.trim() !== "" || status !== "ALL";

    if (meta.total === 0 && !hasFilters) {
      return (
        <EmptyState
          title="No suppliers yet"
          message="Add your first approved supplier to get started."
          action={addSupplierLink}
        />
      );
    }

    const firstIndex = (meta.page - 1) * meta.limit;

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

        {meta.total === 0 ? (
          <EmptyState
            title="No suppliers match your search"
            message="Try a different name, email or status."
          />
        ) : (
          <>
            <SupplierTable suppliers={suppliers} />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>
                Showing {firstIndex + 1}–{firstIndex + suppliers.length} of{" "}
                {meta.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.page === 1 || isPlaceholderData}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={meta.page >= meta.totalPages || isPlaceholderData}
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
