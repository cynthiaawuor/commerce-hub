import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeInventory } from "./fake-inventory";

vi.mock("../../src/inventory/inventory.client", async () => (await import("./fake-inventory")).fakeInventory);

import { createApp } from "../../src/app";
import { ServiceUnavailableError } from "../../src/core/http-error";
import { db } from "../../src/prisma/db";
import { CASHIER, MANAGER, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/pos-api/sales";

// Rice at KES 180, oil at KES 950, as a manager would set them
const setPrices = async () => {
  await api().put("/pos-api/prices/RICE-1KG").set(MANAGER).send({ priceCents: 18000 }).expect(200);
  await api().put("/pos-api/prices/OIL-5L").set(MANAGER).send({ priceCents: 95000 }).expect(200);
};

const openSale = async () =>
  (await api().post(base).set(CASHIER).send({ registerCode: "reg-2" }).expect(201)).body.data;

const scan = (saleId: string, sku: string, quantity: number) =>
  api().post(`${base}/${saleId}/products`).set(CASHIER).send({ sku, quantity });

const pay = (saleId: string, payments: object[]) =>
  api().post(`${base}/${saleId}/pay`).set(CASHIER).send({ payments });

const available = (productId: string) => fakeInventory.state.available.get(productId);
const onHand = (productId: string) => fakeInventory.state.onHand.get(productId);

beforeEach(async () => {
  fakeInventory.reset();
  await resetDatabase();
  await setPrices();
});
afterAll(async () => {
  await resetDatabase();
  await db.close();
});

describe("scanning products", () => {
  it("opens a numbered sale for the cashier at a register", async () => {
    const sale = await openSale();

    expect(sale).toMatchObject({
      saleNumber: "SALE-000001",
      registerCode: "REG-2",
      storeCode: "STORE-3",
      cashierId: "cashier@test",
      status: "OPEN",
      totalCents: 0,
    });
  });

  it("holds the stock in Inventory and keeps the total", async () => {
    const sale = await openSale();

    const { body } = await scan(sale.id, "rice-1kg", 2).expect(201);

    expect(body.data.totalCents).toBe(36000);
    // 36000 × 16 / 116
    expect(body.data.taxCents).toBe(4966);
    expect(body.data.products[0]).toMatchObject({ productName: "Rice 1kg", quantity: 2, unitPriceCents: 18000 });
    // Available falls at once; nothing has left the shelf yet
    expect(available("prod-rice")).toBe(8);
    expect(onHand("prod-rice")).toBe(10);
  });

  it("passes on Inventory's answer when stock is short", async () => {
    const sale = await openSale();

    const { body } = await scan(sale.id, "OIL-5L", 6).expect(409);

    expect(body.error.message).toBe("Only 5 available at this location, 6 requested");
  });

  it("refuses a product with no price", async () => {
    const sale = await openSale();

    await scan(sale.id, "SUGAR-1KG", 1).expect(404);
  });

  it("gives the stock back when a product is removed", async () => {
    const sale = await openSale();
    const scanned = (await scan(sale.id, "RICE-1KG", 3).expect(201)).body.data;

    const { body } = await api()
      .delete(`${base}/${sale.id}/products/${scanned.products[0].id}`)
      .set(CASHIER)
      .expect(200);

    expect(body.data.products).toHaveLength(0);
    expect(body.data.totalCents).toBe(0);
    expect(available("prod-rice")).toBe(10);
  });

  it("returns 503 when Inventory is down", async () => {
    const sale = await openSale();
    const reserve = vi
      .spyOn(fakeInventory, "reserve")
      .mockRejectedValueOnce(new ServiceUnavailableError("Inventory is unavailable. Please try again shortly."));

    await scan(sale.id, "RICE-1KG", 1).expect(503);

    reserve.mockRestore();
  });
});

describe("paying", () => {
  it("sells the stock, records the payment and announces ItemSold", async () => {
    const sale = await openSale();
    await scan(sale.id, "RICE-1KG", 1).expect(201);

    const { body } = await pay(sale.id, [{ method: "CASH", amountCents: 20000 }]).expect(200);

    expect(body.data).toMatchObject({ status: "COMPLETED", paidCents: 20000, changeCents: 2000 });
    expect(onHand("prod-rice")).toBe(9);

    const [event] = await db.orm.public.OutboxEvent.all();
    expect(event!.eventType).toBe("ItemSold");
    expect(JSON.parse(event!.payload)).toMatchObject({
      saleNumber: "SALE-000001",
      registerCode: "REG-2",
      totalCents: 18000,
      products: [{ sku: "RICE-1KG", quantity: 1, totalCents: 18000 }],
      // What stayed in the drawer, not what was handed over
      payments: [{ method: "CASH", amountCents: 18000 }],
    });
  });

  it("splits a payment between cash and card", async () => {
    const sale = await openSale();
    await scan(sale.id, "OIL-5L", 1).expect(201);

    await pay(sale.id, [
      { method: "CASH", amountCents: 50000 },
      { method: "CARD", amountCents: 45000 },
    ]).expect(200);

    const [event] = await db.orm.public.OutboxEvent.all();
    expect(JSON.parse(event!.payload).payments).toEqual([
      { method: "CASH", amountCents: 50000 },
      { method: "CARD", amountCents: 45000 },
    ]);
  });

  it("refuses too little money and takes nothing from stock", async () => {
    const sale = await openSale();
    await scan(sale.id, "RICE-1KG", 1).expect(201);

    const { body } = await pay(sale.id, [{ method: "CASH", amountCents: 10000 }]).expect(400);

    expect(body.error.message).toBe("KES 80.00 still to pay");
    expect(onHand("prod-rice")).toBe(10);
  });

  it("refuses to pay for an empty sale", async () => {
    const sale = await openSale();

    await pay(sale.id, [{ method: "CASH", amountCents: 100 }]).expect(409);
  });

  it("refuses to take payment twice", async () => {
    const sale = await openSale();
    await scan(sale.id, "RICE-1KG", 1).expect(201);
    await pay(sale.id, [{ method: "CARD", amountCents: 18000 }]).expect(200);

    await pay(sale.id, [{ method: "CARD", amountCents: 18000 }]).expect(409);
  });

  it("asks for a rescan when a hold ran out, without selling anything twice", async () => {
    const sale = await openSale();
    await scan(sale.id, "RICE-1KG", 1).expect(201);
    const oil = (await scan(sale.id, "OIL-5L", 1).expect(201)).body.data.products[1];
    fakeInventory.expire(oil.reservationId);

    const { body } = await pay(sale.id, [{ method: "CARD", amountCents: 113000 }]).expect(409);
    expect(body.error.message).toContain("Remove it and scan it again");
    // The rice was taken before the oil failed
    expect(onHand("prod-rice")).toBe(9);

    await api().delete(`${base}/${sale.id}/products/${oil.id}`).set(CASHIER).expect(200);
    await scan(sale.id, "OIL-5L", 1).expect(201);
    await pay(sale.id, [{ method: "CARD", amountCents: 113000 }]).expect(200);

    // Rice was not sold a second time
    expect(onHand("prod-rice")).toBe(9);
    expect(onHand("prod-oil")).toBe(4);
  });
});

describe("cancelling", () => {
  it("gives every hold back", async () => {
    const sale = await openSale();
    await scan(sale.id, "RICE-1KG", 2).expect(201);
    await scan(sale.id, "OIL-5L", 1).expect(201);

    const { body } = await api().post(`${base}/${sale.id}/cancel`).set(CASHIER).expect(200);

    expect(body.data.status).toBe("CANCELLED");
    expect(available("prod-rice")).toBe(10);
    expect(available("prod-oil")).toBe(5);
    await scan(sale.id, "RICE-1KG", 1).expect(409);
  });
});

describe("GET /registers/:registerCode/summary", () => {
  it("adds up what the register should hold today", async () => {
    const first = await openSale();
    await scan(first.id, "RICE-1KG", 1).expect(201);
    await pay(first.id, [{ method: "CASH", amountCents: 20000 }]).expect(200);

    const second = await openSale();
    await scan(second.id, "OIL-5L", 1).expect(201);
    await pay(second.id, [{ method: "CARD", amountCents: 95000 }]).expect(200);

    // Open and cancelled sales do not count
    const third = await openSale();
    await scan(third.id, "RICE-1KG", 1).expect(201);

    const { body } = await api().get("/pos-api/registers/reg-2/summary").expect(200);

    expect(body.data).toMatchObject({
      registerCode: "REG-2",
      salesCount: 2,
      totalCents: 113000,
      // KES 200 handed over, KES 20 given back
      cashCents: 18000,
      cardCents: 95000,
    });
  });

  it("refuses a date it cannot read", async () => {
    await api().get("/pos-api/registers/REG-2/summary?date=yesterday").expect(400);
  });
});
