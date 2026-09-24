import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { db } from "../../src/prisma/db";
import { CLERK, TILL, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);

// Every test needs a product and somewhere to put it
const setUp = async (reorderPoint = 0) => {
  const product = await api()
    .post("/inventory-api/products")
    .send({ sku: `SKU-${Date.now()}`, name: "Maize flour 2kg", reorderPoint })
    .expect(201);

  const location = await api()
    .post("/inventory-api/locations")
    .send({ code: `WH-${Date.now()}`, name: "Main warehouse" })
    .expect(201);

  return {
    productId: product.body.data.id as string,
    locationId: location.body.data.id as string,
  };
};

const adjust = (productId: string, locationId: string, quantity: number) =>
  api()
    .post("/inventory-api/stock/adjustments")
    .set(CLERK)
    .send({ productId, locationId, quantity, reason: "Stock count" });

const levelFor = async (productId: string) => {
  const response = await api()
    .get(`/inventory-api/stock?productId=${productId}`)
    .expect(200);

  return response.body.data[0];
};

beforeEach(resetDatabase);
afterAll(async () => {
  await db.close();
});

describe("products", () => {
  it("stores SKUs upper case and refuses duplicates", async () => {
    const created = await api()
      .post("/inventory-api/products")
      .send({ sku: "maize-2kg", name: "Maize flour 2kg" })
      .expect(201);

    expect(created.body.data.sku).toBe("MAIZE-2KG");

    await api()
      .post("/inventory-api/products")
      .send({ sku: "MAIZE-2KG", name: "Copy" })
      .expect(409);
  });

  it("does not let a client set the average cost", async () => {
    const created = await api()
      .post("/inventory-api/products")
      .send({ sku: "RICE-1KG", name: "Rice", averageCostCents: 999999 })
      .expect(201);

    expect(created.body.data.averageCostCents).toBe(0);
  });
});

describe("stock levels", () => {
  it("has no rows until stock arrives", async () => {
    const { productId } = await setUp();

    const response = await api()
      .get(`/inventory-api/stock?productId=${productId}`)
      .expect(200);

    expect(response.body.data).toHaveLength(0);
  });

  it("records an adjustment and explains it in the ledger", async () => {
    const { productId, locationId } = await setUp();

    await adjust(productId, locationId, 50).expect(201);

    expect(await levelFor(productId)).toMatchObject({
      onHand: 50,
      allocated: 0,
      available: 50,
    });

    const movements = await api()
      .get(`/inventory-api/stock/movements?productId=${productId}`)
      .expect(200);

    expect(movements.body.data[0]).toMatchObject({
      type: "ADJUSTMENT",
      quantity: 50,
      onHandAfter: 50,
      reason: "Stock count",
      recordedBy: CLERK["x-user-id"],
    });
  });

  it("refuses an adjustment without a reason", async () => {
    const { productId, locationId } = await setUp();

    await api()
      .post("/inventory-api/stock/adjustments")
      .set(CLERK)
      .send({ productId, locationId, quantity: 5 })
      .expect(400);
  });

  it("refuses to take stock below zero", async () => {
    const { productId, locationId } = await setUp();
    await adjust(productId, locationId, 5).expect(201);

    await adjust(productId, locationId, -10).expect(409);
  });
});

describe("reservations", () => {
  it("holds stock without moving it, then releases it", async () => {
    const { productId, locationId } = await setUp();
    await adjust(productId, locationId, 10).expect(201);

    const reservation = await api()
      .post("/inventory-api/reservations")
      .set(TILL)
      .send({ productId, locationId, quantity: 3 })
      .expect(201);

    expect(await levelFor(productId)).toMatchObject({
      onHand: 10,
      allocated: 3,
      available: 7,
    });

    await api()
      .post(`/inventory-api/reservations/${reservation.body.data.id}/release`)
      .expect(200);

    expect(await levelFor(productId)).toMatchObject({ allocated: 0, available: 10 });
  });

  it("takes stock off the shelf only when the sale completes", async () => {
    const { productId, locationId } = await setUp();
    await adjust(productId, locationId, 10).expect(201);

    const reservation = await api()
      .post("/inventory-api/reservations")
      .set(TILL)
      .send({ productId, locationId, quantity: 4, reference: "TXN-1" })
      .expect(201);

    await api()
      .post(`/inventory-api/reservations/${reservation.body.data.id}/commit`)
      .set(TILL)
      .expect(200);

    expect(await levelFor(productId)).toMatchObject({
      onHand: 6,
      allocated: 0,
      available: 6,
    });

    const movements = await api()
      .get(`/inventory-api/stock/movements?productId=${productId}`)
      .expect(200);

    expect(movements.body.data[0]).toMatchObject({
      type: "SALE",
      quantity: -4,
      reference: "TXN-1",
    });
  });

  it("refuses to reserve more than is available", async () => {
    const { productId, locationId } = await setUp();
    await adjust(productId, locationId, 5).expect(201);

    await api()
      .post("/inventory-api/reservations")
      .set(TILL)
      .send({ productId, locationId, quantity: 6 })
      .expect(409);
  });

  it("refuses to use a reservation twice", async () => {
    const { productId, locationId } = await setUp();
    await adjust(productId, locationId, 5).expect(201);

    const reservation = await api()
      .post("/inventory-api/reservations")
      .set(TILL)
      .send({ productId, locationId, quantity: 2 })
      .expect(201);

    await api()
      .post(`/inventory-api/reservations/${reservation.body.data.id}/commit`)
      .set(TILL)
      .expect(200);

    await api()
      .post(`/inventory-api/reservations/${reservation.body.data.id}/release`)
      .expect(409);
  });
});

describe("valuation", () => {
  it("reports nothing when no stock is held", async () => {
    const response = await api().get("/inventory-api/valuation").expect(200);

    expect(response.body.data).toMatchObject({ totalUnits: 0, totalValueCents: 0 });
  });

  it("values stock at quantity times average cost", async () => {
    const { productId, locationId } = await setUp();
    await adjust(productId, locationId, 10).expect(201);
    // Cost only comes from receipts, so set it the way a receipt would
    await db.orm.public.Product.where({ id: productId }).update({
      averageCostCents: 1000,
    });

    const response = await api().get("/inventory-api/valuation").expect(200);

    expect(response.body.data).toMatchObject({
      totalUnits: 10,
      totalValueCents: 10000,
    });
  });
});
