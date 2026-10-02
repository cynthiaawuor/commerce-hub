import { claimEvent, type Tx } from "../events/processed-events.repository";
import { postEntry } from "../ledger/ledger.repository";
import * as postings from "../ledger/postings";
import { db } from "../prisma/db";
import { dueDateFor } from "./payment-terms";

const SupplierBill = db.orm.public.SupplierBill;
const PurchaseCommitment = db.orm.public.PurchaseCommitment;

type Commitment = {
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  paymentTerms: string;
  totalCents: number;
  approvedAt: string;
};

type Receipt = {
  goodsReceivedNoteNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  receivedAt: string;
  amountCents: number;
};

// Who the supplier is and when the bill falls due, both taken from the order
const supplierFields = (
  commitment: Pick<Commitment, "supplierId" | "supplierName" | "paymentTerms">,
  receivedAt: string,
) => ({
  supplierId: commitment.supplierId,
  supplierName: commitment.supplierName,
  paymentTerms: commitment.paymentTerms,
  dueDate: dueDateFor(receivedAt, commitment.paymentTerms),
});

// An approved order is a promise to pay, not a debt, so nothing reaches the ledger yet.
// Bills that arrived before the approval did (events are not ordered across queues)
// learn their supplier and due date now. Returns null for a repeat.
const recordCommitment = async (eventId: string, eventType: string, commitment: Commitment) =>
  db.transaction(async (tx) => {
    if (!(await claimEvent(tx, eventId, eventType))) {
      return null;
    }

    const existing = await tx.orm.public.PurchaseCommitment.where({
      purchaseOrderId: commitment.purchaseOrderId,
    }).first();

    if (existing) {
      return existing;
    }

    const waiting = await tx.orm.public.SupplierBill.where({
      purchaseOrderId: commitment.purchaseOrderId,
    })
      .where((bill) => bill.supplierId.isNull())
      .all();

    for (const bill of waiting) {
      await tx.orm.public.SupplierBill.where({ id: bill.id }).update(
        supplierFields(commitment, bill.receivedAt),
      );
    }

    return tx.orm.public.PurchaseCommitment.create({
      ...commitment,
      receivedCents: waiting.reduce((sum, bill) => sum + bill.amountCents, 0),
    });
  });

// Goods taken in: Dr Inventory, Cr Accounts payable, and a bill to pay by the due date.
// Returns null for a repeat event, or for a note already billed under another event id.
const recordReceipt = async (eventId: string, eventType: string, receipt: Receipt) =>
  db.transaction(async (tx) => {
    if (!(await claimEvent(tx, eventId, eventType))) {
      return null;
    }

    const alreadyBilled = await tx.orm.public.SupplierBill.where({
      goodsReceivedNoteNumber: receipt.goodsReceivedNoteNumber,
    }).first();

    if (alreadyBilled) {
      return null;
    }

    const commitment = await tx.orm.public.PurchaseCommitment.where({
      purchaseOrderId: receipt.purchaseOrderId,
    }).first();

    const bill = await tx.orm.public.SupplierBill.create({
      goodsReceivedNoteNumber: receipt.goodsReceivedNoteNumber,
      purchaseOrderId: receipt.purchaseOrderId,
      purchaseOrderNumber: receipt.purchaseOrderNumber,
      amountCents: receipt.amountCents,
      receivedAt: receipt.receivedAt,
      // Without the order the bill is still owed; the supplier is filled in when the
      // approval arrives
      ...(commitment ? supplierFields(commitment, receipt.receivedAt) : {}),
    });

    if (commitment) {
      await tx.orm.public.PurchaseCommitment.where({
        purchaseOrderId: commitment.purchaseOrderId,
      }).update({ receivedCents: commitment.receivedCents + receipt.amountCents });
    }

    await postEntry(tx, {
      source: "GOODS_RECEIVED",
      reference: receipt.goodsReceivedNoteNumber,
      description: `Goods received against ${receipt.purchaseOrderNumber}${
        commitment ? ` from ${commitment.supplierName}` : ""
      }`,
      occurredAt: receipt.receivedAt,
      lines: postings.goodsReceived(receipt.amountCents),
    });

    return bill;
  });

type Payment = {
  amountCents: number;
  reference: string | null;
  paidAt: string;
  paidBy: string;
};

type Bill = NonNullable<Awaited<ReturnType<typeof findBillById>>>;

// Dr Accounts payable, Cr Bank. The bill is only updated if nobody else paid towards
// it since it was read, so two clerks cannot pay the same balance twice. Returns null
// when that happened.
const recordPayment = async (bill: Bill, payment: Payment) =>
  db.transaction(async (tx: Tx) => {
    const paidCents = bill.paidCents + payment.amountCents;

    const updated = await tx.orm.public.SupplierBill.where({
      id: bill.id,
      paidCents: bill.paidCents,
    }).update({ paidCents, status: paidCents >= bill.amountCents ? "PAID" : "OPEN" });

    if (!updated) {
      return null;
    }

    const entry = await postEntry(tx, {
      source: "SUPPLIER_PAYMENT",
      reference: payment.reference ?? bill.goodsReceivedNoteNumber,
      description: `Paid ${bill.supplierName ?? "supplier"} for ${bill.goodsReceivedNoteNumber}`,
      occurredAt: payment.paidAt,
      lines: postings.supplierPayment(payment.amountCents),
    });

    await tx.orm.public.SupplierPayment.create({
      supplierBillId: bill.id,
      journalEntryId: entry.id,
      amountCents: payment.amountCents,
      reference: payment.reference,
      paidAt: payment.paidAt,
      paidBy: payment.paidBy,
    });

    return updated;
  });

// Soonest due first; bills still waiting for their supplier have no due date and come last
const findBills = async (status?: "OPEN" | "PAID") => {
  const bills = status ? SupplierBill.where({ status }) : SupplierBill.where((b) => b.id.isNotNull());

  return bills
    .orderBy([(bill) => bill.dueDate.asc(), (bill) => bill.receivedAt.asc()])
    .all();
};

const findBillById = async (id: string) =>
  SupplierBill.where({ id })
    .include("payments", (payment) => payment.orderBy((p) => p.paidAt.asc()))
    .first();

// Newest orders first
const findCommitments = async () =>
  PurchaseCommitment.orderBy((commitment) => commitment.approvedAt.desc()).all();

export {
  findBillById,
  findBills,
  findCommitments,
  recordCommitment,
  recordPayment,
  recordReceipt,
  type Commitment,
  type Receipt,
};
