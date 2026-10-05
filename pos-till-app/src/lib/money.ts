// The service works in cents; people read and type shillings.

const formatter = new Intl.NumberFormat("en-KE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const kes = (cents: number) => `KES ${formatter.format(cents / 100)}`;

// "200" or "199.50" typed by the cashier; null when it is not an amount
export const toCents = (typed: string): number | null => {
  const trimmed = typed.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  return Math.round(Number(trimmed) * 100);
};

// Cents back into what the cashier would type, for prefilling a box
export const toShillings = (cents: number) => (cents / 100).toFixed(2);
