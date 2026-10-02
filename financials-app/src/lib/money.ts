// The service works in cents; people read and type shillings.

const formatter = new Intl.NumberFormat("en-KE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// A negative amount reads "-KES 50.00", so the sign is not lost beside the currency
export const kes = (cents: number) =>
  `${cents < 0 ? "-" : ""}KES ${formatter.format(Math.abs(cents) / 100)}`;

// "200" or "199.50" typed by the accountant; null when it is not an amount
export const toCents = (typed: string): number | null => {
  const trimmed = typed.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  return Math.round(Number(trimmed) * 100);
};

// Cents back into what someone would type, for prefilling a box
export const toShillings = (cents: number) => (cents / 100).toFixed(2);

export const percent = (value: number | null) => (value === null ? "–" : `${value.toFixed(1)}%`);
