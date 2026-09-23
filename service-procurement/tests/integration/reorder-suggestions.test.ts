import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/vendor/vendor.client", () => ({
  getSupplier: vi.fn(async (id: string) => (id === SUPPLIER.id ? SUPPLIER : null)),
  getProductSuppliers: vi.fn(async (productId: string) =>
    productId === OFFER.productId ? [OFFER] : [],
  ),
}));

import { createApp } from "../../src/app";
import { db } from "../../src/prisma/db";
import { handleStockLow } from "../../src/events/stock-low.consumer";
import { BUYER, OFFER, SUPPLIER, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/procurement-api/reorder-suggestions";

// What Inventory publishes; see contracts/events/stock-low.md
const stockLowEvent = (overrides: Record<string, unknown> = {}) => ({
  eventId: crypto.randomUUID(),
  eventType: "StockLow",
  aggregateId: OFFER.productId,
  occurredAt: new Date().toISOString(),
  payload: {
    productId: OFFER.productId,
    productName: OFFER.productName,
    locationId: "WH-MAIN",
    quantityAvailable: 12,
    reorderPoint: 20,
    reorderQuantity: 100,
    ...overrides,
  },
});

beforeEach(resetDatabase);
afterAll(async () => {
  await db.close();
});

describe("StockLow events", () => {
  it("raises a suggestion a buyer can see", async () => {
    await handleStockLow(stockLowEvent());

    const response = await api().get(`${base}?status=OPEN`).set(BUYER).expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      productId: OFFER.productId,
      quantityAvailable: 12,
      suggestedQuantity: 100,
      status: "OPEN",
    });
  });

  it("updates the existing suggestion when the same product is reported again", async () => {
    await handleStockLow(stockLowEvent());
    await handleStockLow(
      stockLowEvent({ quantityAvailable: 5, reorderQuantity: 150 }),
    );

    const response = await api().get(base).set(BUYER).expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      quantityAvailable: 5,
      suggestedQuantity: 150,
    });
  });

  it("keeps separate suggestions per location", async () => {
    await handleStockLow(stockLowEvent());
    await handleStockLow(stockLowEvent({ locationId: "STORE-3" }));

    const response = await api().get(base).set(BUYER).expect(200);

    expect(response.body.data).toHaveLength(2);
  });
});

describe("acting on a suggestion", () => {
  const openSuggestionId = async () => {
    await handleStockLow(stockLowEvent());
    const response = await api().get(`${base}?status=OPEN`).set(BUYER).expect(200);
    return response.body.data[0].id as string;
  };

  it("turns a suggestion into a draft order, never an approved one", async () => {
    const id = await openSuggestionId();

    const response = await api()
      .post(`${base}/${id}/convert`)
      .set(BUYER)
      .expect(201);

    expect(response.body.data).toMatchObject({
      status: "DRAFT",
      supplierName: SUPPLIER.name,
      // 100 suggested × 125050 cents
      totalCents: 12505000,
    });
  });

  it("marks the suggestion converted and refuses a second conversion", async () => {
    const id = await openSuggestionId();
    await api().post(`${base}/${id}/convert`).set(BUYER).expect(201);

    const list = await api().get(base).set(BUYER).expect(200);
    expect(list.body.data[0]).toMatchObject({ status: "CONVERTED" });
    expect(list.body.data[0].purchaseOrderId).toBeTruthy();

    await api().post(`${base}/${id}/convert`).set(BUYER).expect(409);
  });

  it("lets a buyer dismiss a suggestion with a reason", async () => {
    const id = await openSuggestionId();

    const response = await api()
      .post(`${base}/${id}/dismiss`)
      .set(BUYER)
      .send({ reason: "Being discontinued" })
      .expect(200);

    expect(response.body.data).toMatchObject({
      status: "DISMISSED",
      dismissedBy: BUYER["x-user-id"],
      dismissReason: "Being discontinued",
    });
  });

  it("reopens a dismissed suggestion when stock is reported low again", async () => {
    const id = await openSuggestionId();
    await api().post(`${base}/${id}/dismiss`).set(BUYER).send({}).expect(200);

    await handleStockLow(stockLowEvent({ quantityAvailable: 2 }));

    const list = await api().get(`${base}?status=OPEN`).set(BUYER).expect(200);
    expect(list.body.data).toHaveLength(1);
  });
});
