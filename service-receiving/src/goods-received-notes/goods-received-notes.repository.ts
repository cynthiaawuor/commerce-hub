import { GOODS_RECEIVED, type GoodsReceivedPayload } from "../events/event-types";
import { db } from "../prisma/db";
import type { Discrepancy } from "./discrepancy";

const GoodsReceivedNote = db.orm.public.GoodsReceivedNote;

type ReceivedProductRecord = {
  productId: string;
  productName: string;
  quantityExpected: number;
  quantityDelivered: number;
  quantityDamaged: number;
  quantityAccepted: number;
  discrepancy: Discrepancy;
  unitCostCents: number;
  // The expected product this counts against; null for products never ordered
  expectedProductId: string | null;
};

type NewGoodsReceivedNote = {
  goodsReceivedNoteNumber: string;
  expectedDeliveryId: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  locationCode: string;
  receivedBy: string;
  notes: string | null;
  products: ReceivedProductRecord[];
};

const count = async () =>
  (await GoodsReceivedNote.aggregate((a) => ({ total: a.count() }))).total;

const findById = async (id: string) =>
  GoodsReceivedNote.where({ id })
    .include("products", (product) =>
      product.orderBy((p) => p.productName.asc()),
    )
    .first();

// Newest first: the latest delivery is what anyone checking the dock wants
const findRecent = async (limit: number) =>
  GoodsReceivedNote.orderBy((note) => note.createdAt.desc())
    .include("products", (product) => product)
    .limit(limit)
    .all();

// The note, the running totals on the expected delivery and the GoodsReceived event
// are written together: the event can never announce stock that was not recorded,
// and a recorded note can never be missing its event.
const insert = async (note: NewGoodsReceivedNote) =>
  db.transaction(async (tx) => {
    const created = await tx.orm.public.GoodsReceivedNote.create({
      goodsReceivedNoteNumber: note.goodsReceivedNoteNumber,
      expectedDeliveryId: note.expectedDeliveryId,
      purchaseOrderId: note.purchaseOrderId,
      purchaseOrderNumber: note.purchaseOrderNumber,
      supplierId: note.supplierId,
      locationCode: note.locationCode,
      receivedBy: note.receivedBy,
      notes: note.notes,
    });

    for (const product of note.products) {
      await tx.orm.public.GoodsReceivedNoteProduct.create({
        goodsReceivedNoteId: created.id,
        productId: product.productId,
        productName: product.productName,
        quantityExpected: product.quantityExpected,
        quantityDelivered: product.quantityDelivered,
        quantityDamaged: product.quantityDamaged,
        quantityAccepted: product.quantityAccepted,
        discrepancy: product.discrepancy,
        unitCostCents: product.unitCostCents,
      });

      if (product.expectedProductId && product.quantityAccepted > 0) {
        const expected = await tx.orm.public.ExpectedProduct.where({
          id: product.expectedProductId,
        }).first();

        await tx.orm.public.ExpectedProduct.where({
          id: product.expectedProductId,
        }).update({
          quantityReceived: (expected?.quantityReceived ?? 0) + product.quantityAccepted,
        });
      }
    }

    // Close the delivery once nothing is outstanding on any product
    const expectedProducts = await tx.orm.public.ExpectedProduct.where({
      expectedDeliveryId: note.expectedDeliveryId,
    }).all();

    const complete = expectedProducts.every(
      (product) => product.quantityReceived >= product.quantityOrdered,
    );

    if (complete) {
      await tx.orm.public.ExpectedDelivery.where({
        id: note.expectedDeliveryId,
      }).update({ status: "CLOSED" });
    }

    // Only accepted units are announced. Damaged and unordered goods stay on the note
    // and never reach sellable stock.
    const accepted = note.products.filter((product) => product.quantityAccepted > 0);

    if (accepted.length > 0) {
      const payload: GoodsReceivedPayload = {
        goodsReceivedNoteNumber: note.goodsReceivedNoteNumber,
        purchaseOrderId: note.purchaseOrderId,
        purchaseOrderNumber: note.purchaseOrderNumber,
        locationId: note.locationCode,
        receivedAt: new Date().toISOString(),
        products: accepted.map((product) => ({
          productId: product.productId,
          quantityReceived: product.quantityAccepted,
          unitCostCents: product.unitCostCents,
        })),
      };

      await tx.orm.public.OutboxEvent.create({
        eventType: GOODS_RECEIVED,
        aggregateId: note.goodsReceivedNoteNumber,
        payload: JSON.stringify(payload),
      });
    }

    return created;
  });

export { count, findById, findRecent, insert, type ReceivedProductRecord };
