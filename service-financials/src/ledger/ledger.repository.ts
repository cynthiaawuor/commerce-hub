import type { Tx } from "../events/processed-events.repository";
import { db } from "../prisma/db";
import { isBalanced, type PostingLine } from "./postings";

type JournalSource =
  | "GOODS_RECEIVED"
  | "SALE"
  | "SALE_COST"
  | "DAY_CLOSED"
  | "SUPPLIER_PAYMENT";

type NewEntry = {
  source: JournalSource;
  reference: string;
  description: string;
  storeCode?: string | null;
  occurredAt: string;
  lines: PostingLine[];
};

// The only way anything reaches the ledger. Always inside the caller's transaction,
// so an entry is written together with whatever it records, or not at all.
const postEntry = async (tx: Tx, entry: NewEntry) => {
  // A programming error, not bad input: an unbalanced ledger is worse than a failed event
  if (!isBalanced(entry.lines)) {
    throw new Error(`Refusing to post an unbalanced entry for ${entry.reference}`);
  }

  const created = await tx.orm.public.JournalEntry.create({
    source: entry.source,
    reference: entry.reference,
    description: entry.description,
    storeCode: entry.storeCode ?? null,
    occurredAt: entry.occurredAt,
  });

  for (const line of entry.lines) {
    await tx.orm.public.JournalLine.create({
      journalEntryId: created.id,
      accountCode: line.accountCode,
      debitCents: line.debitCents,
      creditCents: line.creditCents,
      occurredAt: entry.occurredAt,
    });
  }

  return created;
};

// Total debits and credits per account, up to the end of a moment (inclusive)
const sumByAccount = async (before?: string) => {
  let lines = db.orm.public.JournalLine.where((line) => line.id.isNotNull());

  if (before) {
    lines = lines.where((line) => line.occurredAt.lt(before));
  }

  const rows = await lines
    .groupBy("accountCode")
    .aggregate((a) => ({ debits: a.sum("debitCents"), credits: a.sum("creditCents") }));

  return rows.map((row) => ({
    accountCode: row.accountCode,
    // Postgres sums int4 as bigint, which arrives as a string
    debitCents: Number(row.debits ?? 0),
    creditCents: Number(row.credits ?? 0),
  }));
};

// Debits and credits per account between two moments: [from, to)
const sumByAccountBetween = async (from: string, to: string) => {
  const rows = await db.orm.public.JournalLine.where((line) => line.occurredAt.gte(from))
    .where((line) => line.occurredAt.lt(to))
    .groupBy("accountCode")
    .aggregate((a) => ({ debits: a.sum("debitCents"), credits: a.sum("creditCents") }));

  return rows.map((row) => ({
    accountCode: row.accountCode,
    debitCents: Number(row.debits ?? 0),
    creditCents: Number(row.credits ?? 0),
  }));
};

type EntryFilters = { source?: JournalSource | undefined; reference?: string | undefined };

const filteredEntries = ({ source, reference }: EntryFilters) => {
  let entries = db.orm.public.JournalEntry.where((entry) => entry.id.isNotNull());

  if (source) {
    entries = entries.where({ source });
  }

  if (reference) {
    entries = entries.where((entry) => entry.reference.ilike(`%${reference}%`));
  }

  return entries;
};

// Newest first, each with its lines
const findEntries = async (filters: EntryFilters, limit: number, offset: number) =>
  filteredEntries(filters)
    .orderBy([(entry) => entry.occurredAt.desc(), (entry) => entry.createdAt.desc()])
    .include("lines", (line) => line.orderBy((l) => l.creditCents.asc()))
    .limit(limit)
    .offset(offset)
    .all();

const countEntries = async (filters: EntryFilters) =>
  (await filteredEntries(filters).aggregate((a) => ({ total: a.count() }))).total;

const findEntryById = async (id: string) =>
  db.orm.public.JournalEntry.where({ id })
    .include("lines", (line) => line.orderBy((l) => l.creditCents.asc()))
    .first();

export {
  countEntries,
  findEntries,
  findEntryById,
  postEntry,
  sumByAccount,
  sumByAccountBetween,
  type JournalSource,
};
