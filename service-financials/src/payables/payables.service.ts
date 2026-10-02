import type { CurrentUser } from "../core/current-user";
import { today } from "../core/dates";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import { RecordPaymentDto } from "./dtos/record-payment.dto";
import * as payablesRepository from "./payables.repository";
import { ageBucket, daysOverdue, type AgeBucket } from "./payment-terms";

type BillRow = Awaited<ReturnType<typeof payablesRepository.findBills>>[number];

// What is still owed and how late it is, worked out as of today
const withAging = <T extends BillRow>(bill: T, asOf = today()) => {
  const outstandingCents = bill.amountCents - bill.paidCents;
  const overdueDays =
    bill.status === "OPEN" && bill.dueDate ? Math.max(daysOverdue(bill.dueDate, asOf), 0) : 0;

  return {
    ...bill,
    outstandingCents,
    daysOverdue: overdueDays,
    // A bill with no due date yet cannot be late; it is shown apart as unmatched
    ageBucket: (bill.dueDate ? ageBucket(overdueDays) : "NOT_DUE") as AgeBucket,
  };
};

// ?status=OPEN (the default), PAID or ALL
const listBills = async (status: unknown) => {
  if (status !== undefined && status !== "OPEN" && status !== "PAID" && status !== "ALL") {
    throw new BadRequestError("Invalid filter", { status: ["must be OPEN, PAID or ALL"] });
  }

  const filter = status === "ALL" ? undefined : ((status as "OPEN" | "PAID" | undefined) ?? "OPEN");

  return (await payablesRepository.findBills(filter)).map((bill) => withAging(bill));
};

const getBill = async (id: string) => {
  const bill = await payablesRepository.findBillById(id);

  if (!bill) {
    throw new NotFoundError(`Bill ${id} not found`);
  }

  return withAging(bill);
};

const emptyBuckets = (): Record<AgeBucket, number> => ({
  NOT_DUE: 0,
  "1_30": 0,
  "31_60": 0,
  "61_90": 0,
  OVER_90: 0,
});

// Aged payables: what each supplier is owed, split by how late it is. Bills whose
// order has not been seen yet are grouped as an unknown supplier rather than dropped.
const listSupplierBalances = async () => {
  const open = await listBills("OPEN");
  const bySupplier = new Map<
    string,
    {
      supplierId: string | null;
      supplierName: string;
      billCount: number;
      outstandingCents: number;
      overdueCents: number;
      nextDueDate: string | null;
      buckets: Record<AgeBucket, number>;
    }
  >();

  for (const bill of open) {
    const key = bill.supplierId ?? "";
    const row = bySupplier.get(key) ?? {
      supplierId: bill.supplierId,
      supplierName: bill.supplierName ?? "Awaiting purchase order",
      billCount: 0,
      outstandingCents: 0,
      overdueCents: 0,
      nextDueDate: null,
      buckets: emptyBuckets(),
    };

    row.billCount += 1;
    row.outstandingCents += bill.outstandingCents;
    row.buckets[bill.ageBucket] += bill.outstandingCents;

    if (bill.daysOverdue > 0) {
      row.overdueCents += bill.outstandingCents;
    }

    if (bill.dueDate && (!row.nextDueDate || bill.dueDate < row.nextDueDate)) {
      row.nextDueDate = bill.dueDate;
    }

    bySupplier.set(key, row);
  }

  const suppliers = [...bySupplier.values()].sort(
    (a, b) => b.outstandingCents - a.outstandingCents,
  );

  const totals = suppliers.reduce(
    (sum, supplier) => {
      sum.outstandingCents += supplier.outstandingCents;
      sum.overdueCents += supplier.overdueCents;
      for (const bucket of Object.keys(sum.buckets) as AgeBucket[]) {
        sum.buckets[bucket] += supplier.buckets[bucket];
      }
      return sum;
    },
    { outstandingCents: 0, overdueCents: 0, buckets: emptyBuckets() },
  );

  return { suppliers, totals };
};

// Paying a supplier, in full or in part
const recordPayment = async (id: string, body: unknown, user: CurrentUser) => {
  if (user.role !== "FINANCE") {
    throw new ForbiddenError("Only finance can record a payment to a supplier");
  }

  const { obj, errors } = await parseAndValidate(RecordPaymentDto, body);

  if (errors) {
    throw new BadRequestError("Invalid payment", errors);
  }

  const bill = await getBill(id);

  if (bill.status === "PAID") {
    throw new ConflictError(`${bill.goodsReceivedNoteNumber} is already paid`);
  }

  if (!bill.supplierId) {
    throw new ConflictError(
      `${bill.goodsReceivedNoteNumber} has no supplier yet: its purchase order approval has not arrived`,
    );
  }

  if (obj!.amountCents > bill.outstandingCents) {
    throw new BadRequestError("Invalid payment", {
      amountCents: [`must not be more than the ${bill.outstandingCents} cents still owed`],
    });
  }

  const paidAt = obj!.paidAt ? new Date(obj!.paidAt).toISOString() : new Date().toISOString();

  if (paidAt > new Date().toISOString()) {
    throw new BadRequestError("Invalid payment", { paidAt: ["must not be in the future"] });
  }

  const updated = await payablesRepository.recordPayment(bill, {
    amountCents: obj!.amountCents,
    reference: obj!.reference || null,
    paidAt,
    paidBy: user.id,
  });

  if (!updated) {
    throw new ConflictError(
      `Someone else paid towards ${bill.goodsReceivedNoteNumber} just now. Reload and try again.`,
    );
  }

  return getBill(id);
};

// Approved orders not yet fully delivered: what the business has promised to pay
const listOpenCommitments = async () => {
  const commitments = (await payablesRepository.findCommitments())
    .map((commitment) => ({
      ...commitment,
      outstandingCents: Math.max(commitment.totalCents - commitment.receivedCents, 0),
    }))
    .filter((commitment) => commitment.outstandingCents > 0);

  return {
    commitments,
    totalOutstandingCents: commitments.reduce((sum, c) => sum + c.outstandingCents, 0),
  };
};

export { getBill, listBills, listOpenCommitments, listSupplierBalances, recordPayment };
