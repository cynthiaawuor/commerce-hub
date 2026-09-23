// Every amount from the API is integer cents; the display layer is the only place
// that turns them back into money.
const formatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
});

export const formatCents = (cents: number) => formatter.format(cents / 100);

export const formatDate = (value: string) => {
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

export const formatDateTime = (value: string) => {
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-KE");
};

// PENDING_APPROVAL -> Pending approval
export const formatStatus = (status: string) =>
  status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
