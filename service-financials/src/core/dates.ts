import { BadRequestError } from "./http-error";

// Report periods are whole days, midnight to midnight UTC: the same day boundary Point
// of Sale and Sales Audit use.

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const today = () => new Date().toISOString().slice(0, 10);

const isDate = (value: unknown): value is string =>
  typeof value === "string" && DATE.test(value) && !Number.isNaN(Date.parse(value));

// The moment a day ends, which is where "up to and including this day" stops
const endOf = (date: string) => new Date(Date.parse(date) + DAY_MS).toISOString();

const startOf = (date: string) => new Date(Date.parse(date)).toISOString();

// ?asOf=2026-09-30, defaulting to today
const parseAsOf = (asOf: unknown) => {
  if (asOf === undefined) {
    return today();
  }

  if (!isDate(asOf)) {
    throw new BadRequestError("Invalid date", { asOf: ["must look like 2026-09-30"] });
  }

  return asOf;
};

// ?from=2026-09-01&to=2026-09-30, both days included. Defaults to this month so far.
const parsePeriod = (from: unknown, to: unknown) => {
  const errors: Record<string, string[]> = {};

  if (from !== undefined && !isDate(from)) errors["from"] = ["must look like 2026-09-01"];
  if (to !== undefined && !isDate(to)) errors["to"] = ["must look like 2026-09-30"];

  if (Object.keys(errors).length > 0) {
    throw new BadRequestError("Invalid period", errors);
  }

  const period = {
    from: (from as string | undefined) ?? `${today().slice(0, 8)}01`,
    to: (to as string | undefined) ?? today(),
  };

  if (period.from > period.to) {
    throw new BadRequestError("Invalid period", { from: ["must not be after to"] });
  }

  return { ...period, startsAt: startOf(period.from), endsBefore: endOf(period.to) };
};

export { endOf, isDate, parseAsOf, parsePeriod, today };
