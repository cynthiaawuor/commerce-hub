import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { handlePurchaseOrderApproved } from "../../src/events/purchase-order-approved.consumer";
import { PermanentEventError } from "../../src/events/outbox-errors";
import { db } from "../../src/prisma/db";
import { purchaseOrderApproved, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/receiving-api/expected-deliveries";

beforeEach(resetDatabase);
afterAll(async () => {
  await resetDatabase();
  await db.close();
});

describe("PurchaseOrderApproved", () => {
  it("adds the order to the deliveries the dock expects", async () => {
    await handlePurchaseOrderApproved(purchaseOrderApproved());

    const { body } = await api().get(base).expect(200);

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      purchaseOrderNumber: "PO-000001",
      supplierName: "Soko Yetu Supplies",
      status: "OPEN",
    });
    expect(body.data[0].products).toHaveLength(2);
    expect(body.data[0].products[0]).toMatchObject({
      productName: "Maize flour 2kg",
      quantityOrdered: 10,
      quantityOutstanding: 10,
    });
  });

  it("creates the delivery once when the same event arrives twice", async () => {
    const event = purchaseOrderApproved();

    await handlePurchaseOrderApproved(event);
    await handlePurchaseOrderApproved(event);

    const { body } = await api().get(base).expect(200);

    expect(body.data).toHaveLength(1);
  });

  it("rejects an event with no products for good", async () => {
    const event = purchaseOrderApproved();
    event.payload = { ...(event.payload as object), products: [] };

    await expect(handlePurchaseOrderApproved(event)).rejects.toBeInstanceOf(
      PermanentEventError,
    );
  });
});

describe("GET /expected-deliveries/:id", () => {
  it("returns 404 for an unknown delivery", async () => {
    await api().get(`${base}/does-not-exist`).expect(404);
  });
});
