import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Vendor Management is a separate service; these tests fake it so they exercise
// procurement alone. What it returns is covered by contract in vendor's own tests.
vi.mock("../../src/vendor/vendor.client", () => ({
  getSupplier: vi.fn(async (id: string) =>
    id === SUPPLIER.id ? SUPPLIER : null,
  ),
  getProductSuppliers: vi.fn(async (productId: string) =>
    productId === OFFER.productId ? [OFFER] : [],
  ),
}));

import { createApp } from "../../src/app";
import { db } from "../../src/prisma/db";
import { BUYER, MANAGER, OFFER, SUPPLIER, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/procurement-api/purchase-orders";

const createDraft = async () => {
  const response = await api()
    .post(base)
    .set(BUYER)
    .send({ supplierId: SUPPLIER.id })
    .expect(201);

  return response.body.data.id as string;
};

const addLine = (id: string, quantityOrdered: number) =>
  api()
    .post(`${base}/${id}/lines`)
    .set(BUYER)
    .send({ productId: OFFER.productId, quantityOrdered })
    .expect(201);

beforeEach(resetDatabase);
afterAll(async () => {
  await db.close();
});

describe("creating a purchase order", () => {
  it("locks the supplier's name and payment terms onto the order", async () => {
    const response = await api()
      .post(base)
      .set(BUYER)
      .send({ supplierId: SUPPLIER.id })
      .expect(201);

    expect(response.body.data).toMatchObject({
      supplierName: SUPPLIER.name,
      paymentTerms: SUPPLIER.paymentTerms,
      status: "DRAFT",
      totalCents: 0,
    });
    expect(response.body.data.poNumber).toMatch(/^PO-\d{6}$/);
  });

  it("refuses a supplier Vendor Management does not know", async () => {
    await api()
      .post(base)
      .set(BUYER)
      .send({ supplierId: "nope" })
      .expect(400);
  });

  it("requires the caller to identify itself", async () => {
    await api().post(base).send({ supplierId: SUPPLIER.id }).expect(400);
  });
});

describe("purchase order lines", () => {
  it("locks the catalog price in cents and totals the order", async () => {
    const id = await createDraft();

    const line = await addLine(id, 4);

    // Vendor quotes 1250.5 KES, stored as 125050 cents
    expect(line.body.data.unitCostCents).toBe(125050);

    const order = await api().get(`${base}/${id}`).set(BUYER).expect(200);
    expect(order.body.data.totalCents).toBe(500200);
  });

  it("refuses a product the supplier is not approved for", async () => {
    const id = await createDraft();

    await api()
      .post(`${base}/${id}/lines`)
      .set(BUYER)
      .send({ productId: "PROD-UNKNOWN", quantityOrdered: 1 })
      .expect(400);
  });

  it("refuses the same product twice", async () => {
    const id = await createDraft();
    await addLine(id, 1);

    await api()
      .post(`${base}/${id}/lines`)
      .set(BUYER)
      .send({ productId: OFFER.productId, quantityOrdered: 1 })
      .expect(409);
  });
});

describe("approval workflow", () => {
  it("refuses to submit an order with no lines", async () => {
    const id = await createDraft();

    await api().post(`${base}/${id}/submit`).set(BUYER).expect(409);
  });

  it("freezes the lines once the order is submitted", async () => {
    const id = await createDraft();
    const line = await addLine(id, 2);
    await api().post(`${base}/${id}/submit`).set(BUYER).expect(200);

    await api()
      .patch(`${base}/${id}/lines/${line.body.data.id}`)
      .set(BUYER)
      .send({ quantityOrdered: 5 })
      .expect(409);
  });

  it("stops the buyer approving their own order", async () => {
    const id = await createDraft();
    await addLine(id, 2);
    await api().post(`${base}/${id}/submit`).set(BUYER).expect(200);

    await api().post(`${base}/${id}/approve`).set(BUYER).expect(403);
  });

  it("stops a buyer approving above KES 100,000 but lets a manager through", async () => {
    const id = await createDraft();
    // 100 × 1250.50 = KES 125,050, above the buyer's limit
    await addLine(id, 100);
    await api().post(`${base}/${id}/submit`).set(BUYER).expect(200);

    await api().post(`${base}/${id}/approve`).set({ "x-user-id": "other@test", "x-user-role": "BUYER" }).expect(403);

    const approved = await api()
      .post(`${base}/${id}/approve`)
      .set(MANAGER)
      .expect(200);

    expect(approved.body.data).toMatchObject({
      status: "APPROVED",
      approvedBy: MANAGER["x-user-id"],
    });
  });

  it("writes an event to the outbox when an order is approved", async () => {
    const id = await createDraft();
    await addLine(id, 2);
    await api().post(`${base}/${id}/submit`).set(BUYER).expect(200);
    await api().post(`${base}/${id}/approve`).set(MANAGER).expect(200);

    const events = await db.orm.public.OutboxEvent.where({
      aggregateId: id,
    }).all();

    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe("PurchaseOrderApproved");
    expect(events[0]!.publishedAt).toBeNull();
    expect(JSON.parse(events[0]!.payload)).toMatchObject({
      supplierName: SUPPLIER.name,
      totalCents: 250100,
    });
  });

  it("requires a reason when rejecting", async () => {
    const id = await createDraft();
    await addLine(id, 1);
    await api().post(`${base}/${id}/submit`).set(BUYER).expect(200);

    await api().post(`${base}/${id}/reject`).set(MANAGER).send({}).expect(400);

    await api()
      .post(`${base}/${id}/reject`)
      .set(MANAGER)
      .send({ reason: "Budget not approved" })
      .expect(200);
  });

  it("records every step in the audit trail", async () => {
    const id = await createDraft();
    await addLine(id, 1);
    await api().post(`${base}/${id}/submit`).set(BUYER).expect(200);
    await api().post(`${base}/${id}/approve`).set(MANAGER).expect(200);

    const history = await api()
      .get(`${base}/${id}/history`)
      .set(BUYER)
      .expect(200);

    expect(
      history.body.data.map((entry: { toStatus: string }) => entry.toStatus),
    ).toEqual(["DRAFT", "PENDING_APPROVAL", "APPROVED"]);
  });
});

describe("receiving goods", () => {
  const sentOrder = async (quantityOrdered: number) => {
    const id = await createDraft();
    await addLine(id, quantityOrdered);
    await api().post(`${base}/${id}/submit`).set(BUYER).expect(200);
    await api().post(`${base}/${id}/approve`).set(MANAGER).expect(200);
    await api().post(`${base}/${id}/send`).set(MANAGER).expect(200);
    return id;
  };

  it("refuses a delivery for an order that was never sent", async () => {
    const id = await createDraft();
    await addLine(id, 5);

    await api()
      .post(`${base}/${id}/receipts`)
      .set(BUYER)
      .send({ lines: [{ productId: OFFER.productId, quantityReceived: 1 }] })
      .expect(409);
  });

  it("moves through partially received to closed", async () => {
    const id = await sentOrder(10);

    const partial = await api()
      .post(`${base}/${id}/receipts`)
      .set(BUYER)
      .send({ lines: [{ productId: OFFER.productId, quantityReceived: 4 }] })
      .expect(200);

    expect(partial.body.data.status).toBe("PARTIALLY_RECEIVED");
    expect(partial.body.data.lines[0].quantityOutstanding).toBe(6);

    const closed = await api()
      .post(`${base}/${id}/receipts`)
      .set(BUYER)
      .send({ lines: [{ productId: OFFER.productId, quantityReceived: 6 }] })
      .expect(200);

    expect(closed.body.data.status).toBe("CLOSED");
    expect(closed.body.data.lines[0].quantityOutstanding).toBe(0);
  });

  it("refuses more than was ordered", async () => {
    const id = await sentOrder(3);

    await api()
      .post(`${base}/${id}/receipts`)
      .set(BUYER)
      .send({ lines: [{ productId: OFFER.productId, quantityReceived: 4 }] })
      .expect(409);
  });

  it("lists orders a delivery can be booked against", async () => {
    const id = await sentOrder(2);

    const open = await api()
      .get(`${base}/open?supplierId=${SUPPLIER.id}`)
      .set(BUYER)
      .expect(200);

    expect(open.body.data.map((o: { id: string }) => o.id)).toContain(id);
  });
});
