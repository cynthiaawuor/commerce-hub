// When a bill falls due, and how late it is. Free of the database so it is easy to test.

const DAY_MS = 24 * 60 * 60 * 1000;

// Vendor Management stores terms as "NET_30", "COD" and so on. Anything unreadable is
// treated as due on receipt: better to pay early than to miss a due date.
const termsInDays = (paymentTerms: string) => {
  const days = /(\d+)/.exec(paymentTerms)?.[1];

  return days === undefined ? 0 : Number(days);
};

// "2026-09-28T14:23:14Z" received on NET_30 is due "2026-10-28"
const dueDateFor = (receivedAt: string, paymentTerms: string) =>
  new Date(Date.parse(receivedAt) + termsInDays(paymentTerms) * DAY_MS)
    .toISOString()
    .slice(0, 10);

// Whole days past the due date; zero or less means not yet due
const daysOverdue = (dueDate: string, today: string) =>
  Math.round((Date.parse(today) - Date.parse(dueDate)) / DAY_MS);

type AgeBucket = "NOT_DUE" | "1_30" | "31_60" | "61_90" | "OVER_90";

// The usual aged-payables columns
const ageBucket = (overdueDays: number): AgeBucket => {
  if (overdueDays <= 0) return "NOT_DUE";
  if (overdueDays <= 30) return "1_30";
  if (overdueDays <= 60) return "31_60";
  if (overdueDays <= 90) return "61_90";
  return "OVER_90";
};

export { ageBucket, daysOverdue, dueDateFor, termsInDays, type AgeBucket };
