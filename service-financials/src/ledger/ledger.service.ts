import { endOf, parseAsOf } from "../core/dates";
import { BadRequestError, NotFoundError } from "../core/http-error";
import { CHART, normalBalance } from "./accounts";
import * as ledgerRepository from "./ledger.repository";
import type { JournalSource } from "./ledger.repository";

const SOURCES: JournalSource[] = [
  "GOODS_RECEIVED",
  "SALE",
  "SALE_COST",
  "DAY_CLOSED",
  "SUPPLIER_PAYMENT",
];

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const accountName = (code: string) =>
  CHART.find((account) => account.code === code)?.name ?? code;

// Every account with what has been debited and credited to it up to the end of a day.
// Total debits equal total credits when the books are sound, which is the point of
// double entry: this is the check an accountant runs first.
const getAccountBalances = async (asOfQuery: unknown) => {
  const asOf = parseAsOf(asOfQuery);
  const sums = await ledgerRepository.sumByAccount(endOf(asOf));

  const accounts = CHART.map((account) => {
    const sum = sums.find((row) => row.accountCode === account.code);
    const debitCents = sum?.debitCents ?? 0;
    const creditCents = sum?.creditCents ?? 0;

    return {
      ...account,
      debitCents,
      creditCents,
      balanceCents: normalBalance(account.type, debitCents, creditCents),
    };
  });

  const totalDebitCents = accounts.reduce((sum, account) => sum + account.debitCents, 0);
  const totalCreditCents = accounts.reduce((sum, account) => sum + account.creditCents, 0);

  return {
    asOf,
    accounts,
    totalDebitCents,
    totalCreditCents,
    balanced: totalDebitCents === totalCreditCents,
  };
};

type Entry = NonNullable<Awaited<ReturnType<typeof ledgerRepository.findEntryById>>>;

// Lines carry the account's name, so a reader does not need the chart beside them
const withAccountNames = (entry: Entry) => ({
  ...entry,
  lines: entry.lines.map((line) => ({ ...line, accountName: accountName(line.accountCode) })),
});

const positiveWholeNumber = (value: unknown, fallback: number) => {
  if (value === undefined) return fallback;

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
};

// ?source=SALE&reference=GRN-000001&page=1&limit=25, newest first
const listEntries = async (query: Record<string, unknown>) => {
  const errors: Record<string, string[]> = {};
  const { source, reference } = query;

  if (source !== undefined && !SOURCES.includes(source as JournalSource)) {
    errors["source"] = [`must be one of ${SOURCES.join(", ")}`];
  }

  if (reference !== undefined && typeof reference !== "string") {
    errors["reference"] = ["must be text"];
  }

  const page = positiveWholeNumber(query["page"], 1);
  const limit = positiveWholeNumber(query["limit"], DEFAULT_LIMIT);

  if (page === null) errors["page"] = ["must be a whole number from 1"];
  if (limit === null || limit > MAX_LIMIT) errors["limit"] = [`must be between 1 and ${MAX_LIMIT}`];

  if (Object.keys(errors).length > 0) {
    throw new BadRequestError("Invalid filter", errors);
  }

  const filters = {
    source: source as JournalSource | undefined,
    reference: (reference as string | undefined)?.trim() || undefined,
  };

  const [entries, total] = await Promise.all([
    ledgerRepository.findEntries(filters, limit!, (page! - 1) * limit!),
    ledgerRepository.countEntries(filters),
  ]);

  return {
    data: entries.map(withAccountNames),
    meta: { page: page!, limit: limit!, total, totalPages: Math.ceil(total / limit!) },
  };
};

const getEntry = async (id: string) => {
  const entry = await ledgerRepository.findEntryById(id);

  if (!entry) {
    throw new NotFoundError(`Journal entry ${id} not found`);
  }

  return withAccountNames(entry);
};

export { getAccountBalances, getEntry, listEntries };
