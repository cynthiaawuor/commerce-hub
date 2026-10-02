// Every amount from the API is integer cents; this is the only place they become money.
const money = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
});

export const formatCents = (cents: number) => money.format(cents / 100);

export const formatDateTime = (value: string) => {
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-KE");
};

export const formatMovementType = (type: string) =>
  type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ");
