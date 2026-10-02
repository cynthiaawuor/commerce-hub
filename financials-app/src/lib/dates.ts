// Report periods are whole days in UTC, the same day boundary the service uses.

export type Period = { from: string; to: string };

export const today = () => new Date().toISOString().slice(0, 10);

// This month so far, which is also what the service defaults to
export const thisMonth = (): Period => ({ from: `${today().slice(0, 8)}01`, to: today() });

// The service sends times as Postgres prints them ("2026-10-02 11:41:42.619+00"),
// which not every browser can read; this turns them into the standard form first.
const parse = (value: string) =>
  new Date(value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));

// "2 Oct 2026", for a time or a plain date such as a due date
export const formatDate = (value: string | null) => {
  if (!value) return "–";

  const date = parse(value.length === 10 ? `${value}T00:00:00+00:00` : value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};
