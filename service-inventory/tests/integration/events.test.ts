import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import type { EventEnvelope } from "../../src/events/event-publisher";
import { handleGoodsReceived } from "../../src/events/goods-received.consumer";
import { PermanentEventError } from "../../src/events/outbox-errors";
import { handlePurchaseOrderApproved } from "../../src/events/purchase-order-approved.consumer";
import { db } from "../../src/prisma/db";
import { resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);

// The product and the default receiving location the events refer to by code
const setUp = async () => {
  const product = await api()
    .post("/inventory-api/products")
    .send({ sku: "MAIZE-2KG", name: "Maize flour 2kg" })
    .expect(201);

  await api()
    .post("/inventory-api/locations")
    .send({ code: "WH-MAIN", name: "Main warehouse" })
    .expect(201);

  return product.body.data.id as string;
};

const levelFor = async (productId: string) =>
  (await api().get(`/inventory-api/stock?productId=${productId}`).expect(200)).body.data[0];

const envelope = (eventType: string, payload: unknown): EventEnvelope => ({
  eventId: crypto.randomUUID(),
  eventType,
  aggregateId: "order-1",
  occurredAt: new Date().toISOString(),
  payload,
});

// What Procurement publishes; see contracts/events/purchase-order-approved.md
const purchaseOrderApproved = (quantityOrdered: number) =>
  envelope("PurchaseOrderApproved", {
    purchaseOrderId: "order-1",
    purchaseOrderNumber: "PO-000001",
    supplierId: "sup-1",
    supplierName: "Soko Yetu Supplies",
    products: [
      {
        productId: "MAIZE-2KG",
        productName: "Maize flour 2kg",
        quantityOrdered,
        unitCostCents: 125050,
        leadTimeDays: 7,
      },
    ],
  });

// What Receiving publishes; see contracts/events/goods-received.md
const goodsReceived = (quantityReceived: number) =>
  envelope("GoodsReceived", {
    goodsReceivedNoteNumber: "GRN-000001",
    purchaseOrderId: "order-1",
    purchaseOrderNumber: "PO-000001",
    locationId: "WH-MAIN",
    receivedAt: new Date().toISOString(),
    products: [{ productId: "MAIZE-2KG", quantityReceived, unitCostCents: 125050 }],
  });

beforeEach(resetDatabase);
afterAll(async () => {
  await resetDatabase();
  await db.close();
});

describe("PurchaseOrderApproved", () => {
  it("raises what is on order", async () => {
    const productId = await setUp();

    await handlePurchaseOrderApproved(purchaseOrderApproved(100));

    expect(await levelFor(productId)).toMatchObject({ onOrder: 100, onHand: 0 });
  });

  it("counts a redelivered order once", async () => {
    const productId = await setUp();
    const event = purchaseOrderApproved(100);

    await handlePurchaseOrderApproved(event);
    await handlePurchaseOrderApproved(event);

    expect((await levelFor(productId)).onOrder).toBe(100);
  });

  it("rejects an order with no products for good", async () => {
    await setUp();
    const event = purchaseOrderApproved(100);
    event.payload = { ...(event.payload as object), products: [] };

    await expect(handlePurchaseOrderApproved(event)).rejects.toBeInstanceOf(PermanentEventError);
  });

  it("rejects a product Inventory does not know for good", async () => {
    await setUp();
    const event = purchaseOrderApproved(100);
    event.payload = {
      ...(event.payload as object),
      products: [{ productId: "NOT-A-PRODUCT", quantityOrdered: 1 }],
    };

    await expect(handlePurchaseOrderApproved(event)).rejects.toBeInstanceOf(PermanentEventError);
  });
});

describe("GoodsReceived", () => {
  it("takes goods into stock and off what is on order", async () => {
    const productId = await setUp();
    await handlePurchaseOrderApproved(purchaseOrderApproved(100));

    await handleGoodsReceived(goodsReceived(95));

    expect(await levelFor(productId)).toMatchObject({ onHand: 95, onOrder: 5 });
  });

  it("counts a redelivered receipt once", async () => {
    const productId = await setUp();
    const event = goodsReceived(95);

    await handleGoodsReceived(event);
    await handleGoodsReceived(event);

    expect((await levelFor(productId)).onHand).toBe(95);
  });
});
