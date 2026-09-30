import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { handlePurchaseOrderApproved } from "../../src/events/purchase-order-approved.consumer";
import { db } from "../../src/prisma/db";
import { DOCK_CLERK, purchaseOrderApproved, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/receiving-api/goods-received-notes";

// The delivery the dock is waiting for after Procurement approves PO-000001
const expectedDelivery = async () => {
  await handlePurchaseOrderApproved(purchaseOrderApproved());

  const { body } = await api().get("/receiving-api/expected-deliveries").expect(200);

  return body.data[0].id as string;
};

const receive = (expectedDeliveryId: string, products: object[]) =>
  api().post(base).set(DOCK_CLERK).send({ expectedDeliveryId, products });

const outboxEvents = () => db.orm.public.OutboxEvent.all();

beforeEach(resetDatabase);
afterAll(async () => {
  await resetDatabase();
  await db.close();
});

describe("POST /goods-received-notes", () => {
  it("records what arrived and announces only the accepted units", async () => {
    const deliveryId = await expectedDelivery();

    const { body } = await receive(deliveryId, [
      { productId: "PROD-1", quantityDelivered: 7, quantityDamaged: 1 },
      { productId: "PROD-2", quantityDelivered: 5 },
    ]).expect(201);

    expect(body.data.goodsReceivedNoteNumber).toBe("GRN-000001");
    expect(body.data.receivedBy).toBe("dock-clerk@test");

    const maize = body.data.products.find((p: any) => p.productId === "PROD-1");
    expect(maize).toMatchObject({
      quantityExpected: 10,
      quantityDelivered: 7,
      quantityDamaged: 1,
      quantityAccepted: 6,
      discrepancy: "LESS",
    });

    const events = await outboxEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("GoodsReceived");
    expect(JSON.parse(events[0]!.payload).products).toEqual([
      { productId: "PROD-1", quantityReceived: 6, unitCostCents: 125050 },
      { productId: "PROD-2", quantityReceived: 5, unitCostCents: 18000 },
    ]);
  });

  it("records a product that was not counted as short", async () => {
    const deliveryId = await expectedDelivery();

    const { body } = await receive(deliveryId, [
      { productId: "PROD-1", quantityDelivered: 10 },
    ]).expect(201);

    const rice = body.data.products.find((p: any) => p.productId === "PROD-2");
    expect(rice).toMatchObject({ quantityDelivered: 0, discrepancy: "LESS" });
  });

  it("keeps unordered goods off the event", async () => {
    const deliveryId = await expectedDelivery();

    const { body } = await receive(deliveryId, [
      { productId: "PROD-1", quantityDelivered: 10 },
      { productId: "PROD-2", quantityDelivered: 5 },
      { productId: "PROD-9", quantityDelivered: 3 },
    ]).expect(201);

    const extra = body.data.products.find((p: any) => p.productId === "PROD-9");
    expect(extra).toMatchObject({ quantityAccepted: 0, discrepancy: "NOT_ORDERED" });

    const [event] = await outboxEvents();
    const announced = JSON.parse(event!.payload).products.map((p: any) => p.productId);
    expect(announced).not.toContain("PROD-9");
  });

  it("closes the delivery once everything has arrived", async () => {
    const deliveryId = await expectedDelivery();

    await receive(deliveryId, [
      { productId: "PROD-1", quantityDelivered: 6 },
      { productId: "PROD-2", quantityDelivered: 5 },
    ]).expect(201);

    // Still open: 4 maize flour outstanding
    const open = await api().get(`/receiving-api/expected-deliveries/${deliveryId}`).expect(200);
    expect(open.body.data.status).toBe("OPEN");

    const second = await receive(deliveryId, [
      { productId: "PROD-1", quantityDelivered: 4 },
    ]).expect(201);
    expect(second.body.data.goodsReceivedNoteNumber).toBe("GRN-000002");

    const closed = await api().get(`/receiving-api/expected-deliveries/${deliveryId}`).expect(200);
    expect(closed.body.data.status).toBe("CLOSED");

    // Nothing left to receive against
    await receive(deliveryId, [{ productId: "PROD-1", quantityDelivered: 1 }]).expect(409);
  });

  it("rejects more damaged than delivered", async () => {
    const deliveryId = await expectedDelivery();

    const { body } = await receive(deliveryId, [
      { productId: "PROD-1", quantityDelivered: 2, quantityDamaged: 3 },
    ]).expect(400);

    expect(body.error.details).toHaveProperty("products[0].quantityDamaged");
  });

  it("rejects the same product listed twice", async () => {
    const deliveryId = await expectedDelivery();

    const { body } = await receive(deliveryId, [
      { productId: "PROD-1", quantityDelivered: 5 },
      { productId: "PROD-1", quantityDelivered: 5 },
    ]).expect(400);

    expect(body.error.details).toHaveProperty("products[1].productId");
  });

  it("returns 404 for an unknown delivery", async () => {
    await receive("does-not-exist", [{ productId: "PROD-1", quantityDelivered: 1 }]).expect(404);
  });

  it("requires the clerk to identify themselves", async () => {
    const deliveryId = await expectedDelivery();

    await api()
      .post(base)
      .send({ expectedDeliveryId: deliveryId, products: [{ productId: "PROD-1", quantityDelivered: 1 }] })
      .expect(400);
  });
});
