import { config } from "../core/config";
import type { CurrentUser } from "../core/current-user";
import { isUniqueViolation } from "../core/db-errors";
import { BadRequestError, ConflictError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import * as expectedDeliveryRepository from "../expected-deliveries/expected-deliveries.repository";
import { checkReceivedProduct } from "./discrepancy";
import {
  CreateGoodsReceivedNoteDto,
  ReceivedProductDto,
} from "./dtos/create-goods-received-note.dto";
import * as goodsReceivedNoteRepository from "./goods-received-notes.repository";
import type { ReceivedProductRecord } from "./goods-received-notes.repository";

const NUMBER_ATTEMPTS = 5;
const RECENT_LIMIT = 50;

const formatNumber = (sequence: number) =>
  `GRN-${String(sequence).padStart(6, "0")}`;

// Validates each product on its own, so the clerk sees exactly which entry is wrong
const parseReceivedProducts = async (products: unknown[]) => {
  const parsed: ReceivedProductDto[] = [];
  const errors: Record<string, string[]> = {};

  for (const [index, product] of products.entries()) {
    const result = await parseAndValidate(ReceivedProductDto, product);

    if (result.errors) {
      for (const [field, messages] of Object.entries(result.errors)) {
        errors[`products[${index}].${field}`] = messages;
      }
      continue;
    }

    const damaged = result.obj!.quantityDamaged ?? 0;

    if (damaged > result.obj!.quantityDelivered) {
      errors[`products[${index}].quantityDamaged`] = [
        "cannot be more than the quantity delivered",
      ];
      continue;
    }

    parsed.push(result.obj!);
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestError("Unprocessable delivery", errors);
  }

  return parsed;
};

// The truck has been checked: compare it with the order, record the note, and tell
// the business what entered stock.
const createGoodsReceivedNote = async (body: unknown, user: CurrentUser) => {
  const { obj, errors } = await parseAndValidate(CreateGoodsReceivedNoteDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable delivery", errors);
  }

  const received = await parseReceivedProducts(obj!.products);

  const delivery = await expectedDeliveryRepository.findById(obj!.expectedDeliveryId);

  if (!delivery) {
    throw new NotFoundError(`Expected delivery ${obj!.expectedDeliveryId} not found`);
  }

  if (delivery.status !== "OPEN") {
    throw new ConflictError(
      `Everything on ${delivery.purchaseOrderNumber} has already been received`,
    );
  }

  const products: ReceivedProductRecord[] = received.map((item) => {
    const expected = delivery.products.find(
      (product) => product.productId === item.productId,
    );

    const quantityExpected = expected
      ? Math.max(expected.quantityOrdered - expected.quantityReceived, 0)
      : 0;
    const quantityDamaged = item.quantityDamaged ?? 0;

    const { quantityAccepted, discrepancy } = checkReceivedProduct({
      quantityExpected,
      quantityDelivered: item.quantityDelivered,
      quantityDamaged,
      wasOrdered: Boolean(expected),
    });

    return {
      productId: item.productId,
      productName: expected?.productName ?? item.productId,
      quantityExpected,
      quantityDelivered: item.quantityDelivered,
      quantityDamaged,
      quantityAccepted,
      discrepancy,
      unitCostCents: expected?.unitCostCents ?? 0,
      expectedProductId: expected?.id ?? null,
    };
  });

  // Anything ordered but not counted at all arrived as zero: a shortage worth recording
  for (const expected of delivery.products) {
    const outstanding = expected.quantityOrdered - expected.quantityReceived;
    const counted = products.some((product) => product.productId === expected.productId);

    if (!counted && outstanding > 0) {
      products.push({
        productId: expected.productId,
        productName: expected.productName,
        quantityExpected: outstanding,
        quantityDelivered: 0,
        quantityDamaged: 0,
        quantityAccepted: 0,
        discrepancy: "LESS",
        unitCostCents: expected.unitCostCents,
        expectedProductId: expected.id,
      });
    }
  }

  // Numbered from the count. Two clerks finishing at the same moment can land on the
  // same number, so retry when the unique index rejects it.
  for (let attempt = 0; attempt < NUMBER_ATTEMPTS; attempt += 1) {
    const sequence = (await goodsReceivedNoteRepository.count()) + 1 + attempt;

    try {
      const note = await goodsReceivedNoteRepository.insert({
        goodsReceivedNoteNumber: formatNumber(sequence),
        expectedDeliveryId: delivery.id,
        purchaseOrderId: delivery.purchaseOrderId,
        purchaseOrderNumber: delivery.purchaseOrderNumber,
        supplierId: delivery.supplierId,
        locationCode: obj!.locationCode ?? config.defaultLocationCode,
        receivedBy: user.id,
        notes: obj!.notes ?? null,
        products,
      });

      return getGoodsReceivedNote(note.id);
    } catch (err) {
      if (!isUniqueViolation(err)) {
        throw err;
      }
    }
  }

  throw new ConflictError("Could not allocate a note number. Please try again.");
};

const getGoodsReceivedNote = async (id: string) => {
  const note = await goodsReceivedNoteRepository.findById(id);

  if (!note) {
    throw new NotFoundError(`Goods received note ${id} not found`);
  }

  return note;
};

const listGoodsReceivedNotes = async () =>
  goodsReceivedNoteRepository.findRecent(RECENT_LIMIT);

export { createGoodsReceivedNote, getGoodsReceivedNote, listGoodsReceivedNotes };
