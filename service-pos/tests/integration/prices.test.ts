import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeInventory } from "./fake-inventory";

vi.mock("../../src/inventory/inventory.client", async () => (await import("./fake-inventory")).fakeInventory);

import { createApp } from "../../src/app";
import { db } from "../../src/prisma/db";
import { CASHIER, MANAGER, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/pos-api/prices";

beforeEach(async () => {
  fakeInventory.reset();
  await resetDatabase();
});
afterAll(async () => {
  await resetDatabase();
  await db.close();
});

describe("PUT /prices/:sku", () => {
  it("lets a manager price a product Inventory knows", async () => {
    const { body } = await api().put(`${base}/rice-1kg`).set(MANAGER).send({ priceCents: 18000 }).expect(200);

    expect(body.data).toMatchObject({
      productId: "prod-rice",
      sku: "RICE-1KG",
      productName: "Rice 1kg",
      priceCents: 18000,
      updatedBy: "manager@test",
    });
  });

  it("replaces the old price", async () => {
    await api().put(`${base}/RICE-1KG`).set(MANAGER).send({ priceCents: 18000 }).expect(200);
    await api().put(`${base}/RICE-1KG`).set(MANAGER).send({ priceCents: 19500 }).expect(200);

    const { body } = await api().get(base).expect(200);

    expect(body.data).toHaveLength(1);
    expect(body.data[0].priceCents).toBe(19500);
  });

  it("refuses a cashier", async () => {
    await api().put(`${base}/RICE-1KG`).set(CASHIER).send({ priceCents: 18000 }).expect(403);
  });

  it("refuses a product Inventory does not have", async () => {
    await api().put(`${base}/NOPE`).set(MANAGER).send({ priceCents: 18000 }).expect(404);
  });

  it("refuses a product that is no longer sold", async () => {
    await api().put(`${base}/OLD-1`).set(MANAGER).send({ priceCents: 500 }).expect(409);
  });

  it("refuses a price that is not whole cents", async () => {
    const { body } = await api().put(`${base}/RICE-1KG`).set(MANAGER).send({ priceCents: 180.5 }).expect(400);

    expect(body.error.details).toHaveProperty("priceCents");
  });
});
