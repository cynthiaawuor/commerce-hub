import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/vendor/vendor.client", () => ({
  getSupplier: vi.fn(async (id: string) => (id === SUPPLIER.id ? SUPPLIER : null)),
  getProductSuppliers: vi.fn(async (productId: string) =>
    productId === OFFER.productId ? [OFFER] : [],
  ),
}));

import { createApp } from "../../src/app";
import { handleGoodsReceived } from "../../src/events/goods-received.consumer";
import { db } from "../../src/prisma/db";
import { BUYER, MANAGER, OFFER, SUPPLIER, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/procurement-api/purchase-orders";

// An order approved by a manager, the way Receiving would find it
const approvedOrder = async (quantityOrdered: number) => {
  const created = await api().post(base).set(BUYER).send({ supplierId: SUPPLIER.id }).expect(201);
  const id = created.body.data.id as string;

  await api()
    .post(`${base}/${id}/lines`)
    .set(BUYER)
    .send({ productId: OFFER.productId, quantityOrdered })
    .expect(201);
  await api().post(`${base}/${id}/submit`).set(BUYER).expect(200);
  await api().post(`${base}/${id}/approve`).set(MANAGER).expect(200);

  return { id, purchaseOrderNumber: created.body.data.poNumber as string };
};

// What Receiving publishes; see contracts/events/goods-received.md
const goodsReceived = (
  order: { id: string; purchaseOrderNumber: string },
  quantityReceived: number,
  eventId = crypto.randomUUID(),
) => ({
  eventId,
  eventType: "GoodsReceived",
  aggregateId: "GRN-000001",
  occurredAt: new Date().toISOString(),
  payload: {
    goodsReceivedNoteNumber: "GRN-000001",
    purchaseOrderId: order.id,
    purchaseOrderNumber: order.purchaseOrderNumber,
    locationId: "WH-MAIN",
    receivedAt: new Date().toISOString(),
    products: [{ productId: OFFER.productId, quantityReceived, unitCostCents: 125050 }],
  },
});

const statusOf = async (id: string) =>
  (await api().get(`${base}/${id}`).set(BUYER).expect(200)).body.data;

beforeEach(resetDatabase);
afterAll(async () => {
  await db.close();
});

describe("GoodsReceived from Receiving", () => {
  it("receives against an approved order, marking it sent first", async () => {
    const order = await approvedOrder(10);

    await handleGoodsReceived(goodsReceived(order, 4));

    const updated = await statusOf(order.id);
    expect(updated.status).toBe("PARTIALLY_RECEIVED");
    expect(updated.lines[0].quantityReceived).toBe(4);

    const history = await api().get(`${base}/${order.id}/history`).set(BUYER).expect(200);
    expect(history.body.data.map((entry: { toStatus: string }) => entry.toStatus)).toEqual([
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "SENT",
      "PARTIALLY_RECEIVED",
    ]);
  });

  it("closes the order once everything has arrived", async () => {
    const order = await approvedOrder(10);

    await handleGoodsReceived(goodsReceived(order, 4));
    await handleGoodsReceived(goodsReceived(order, 6));

    expect((await statusOf(order.id)).status).toBe("CLOSED");
  });

  it("counts a redelivered event only once", async () => {
    const order = await approvedOrder(10);
    const event = goodsReceived(order, 4);

    await handleGoodsReceived(event);
    await handleGoodsReceived(event);

    expect((await statusOf(order.id)).lines[0].quantityReceived).toBe(4);
  });

  it("refuses to guess at an order it has never heard of", async () => {
    const unknown = { id: "00000000-0000-0000-0000-000000000000", purchaseOrderNumber: "PO-X" };

    await expect(handleGoodsReceived(goodsReceived(unknown, 1))).rejects.toThrow(
      /not found/,
    );
  });
});
