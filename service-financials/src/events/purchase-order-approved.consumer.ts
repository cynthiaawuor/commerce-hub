import * as payablesRepository from "../payables/payables.repository";
import { subscribe } from "./event-consumer";
import { PermanentEventError, type EventEnvelope } from "./event-envelope";
import { SUBSCRIPTIONS, type PurchaseOrderApprovedPayload } from "./event-types";
import { isAmount, isText, isTime } from "./payload-checks";

// A payload missing fields will be missing them on every retry
const parsePayload = (payload: unknown): PurchaseOrderApprovedPayload => {
  const candidate = payload as Partial<PurchaseOrderApprovedPayload> | null;

  if (
    !candidate ||
    !isText(candidate.purchaseOrderId) ||
    !isText(candidate.purchaseOrderNumber) ||
    !isText(candidate.supplierId) ||
    !isText(candidate.supplierName) ||
    !isText(candidate.paymentTerms) ||
    !isAmount(candidate.totalCents) ||
    !isTime(candidate.approvedAt)
  ) {
    throw new PermanentEventError(
      "PurchaseOrderApproved payload is missing its order, supplier, terms, total or approval time",
    );
  }

  return candidate as PurchaseOrderApprovedPayload;
};

// The spec's "Financials listens so it knows a liability is coming". Nothing is owed
// until goods arrive, so this records a commitment, not a ledger entry.
const handlePurchaseOrderApproved = async (envelope: EventEnvelope) => {
  const payload = parsePayload(envelope.payload);

  const commitment = await payablesRepository.recordCommitment(
    envelope.eventId,
    envelope.eventType,
    {
      purchaseOrderId: payload.purchaseOrderId,
      purchaseOrderNumber: payload.purchaseOrderNumber,
      supplierId: payload.supplierId,
      supplierName: payload.supplierName,
      paymentTerms: payload.paymentTerms,
      totalCents: payload.totalCents,
      approvedAt: payload.approvedAt,
    },
  );

  console.log(
    commitment
      ? `Recorded the commitment for ${payload.purchaseOrderNumber} to ${payload.supplierName}`
      : `Ignored a repeat delivery of ${envelope.eventType} ${envelope.eventId}`,
  );
};

const startPurchaseOrderApprovedConsumer = () =>
  subscribe({ ...SUBSCRIPTIONS.purchaseOrderApproved, handle: handlePurchaseOrderApproved });

export { handlePurchaseOrderApproved, startPurchaseOrderApprovedConsumer };
