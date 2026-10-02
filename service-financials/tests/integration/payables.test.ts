import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { PermanentEventError } from "../../src/events/event-envelope";
import { handleGoodsReceived } from "../../src/events/goods-received.consumer";
import { handlePurchaseOrderApproved } from "../../src/events/purchase-order-approved.consumer";
import { db } from "../../src/prisma/db";
import { CASHIER, FINANCE, goodsReceived, purchaseOrderApproved, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/financials-api";

const bills = async (status = "OPEN") =>
  (await api().get(`${base}/bills?status=${status}`).expect(200)).body.data;

const balanceOf = async (code: string) => {
  const { body } = await api().get(`${base}/ledger/accounts`).expect(200);
  return body.data.accounts.find((account: any) => account.code === code).balanceCents;
};

const pay = (billId: string, body: object) =>
  api().post(`${base}/bills/${billId}/payments`).set(FINANCE).send(body);

beforeEach(resetDatabase);
afterAll(async () => {
  await resetDatabase();
  await db.close();
});

describe("PurchaseOrderApproved", () => {
  it("records a commitment and leaves the ledger alone", async () => {
    await handlePurchaseOrderApproved(purchaseOrderApproved());

    const { body } = await api().get(`${base}/commitments`).expect(200);

    expect(body.data.totalOutstandingCents).toBe(200000);
    expect(body.data.commitments[0]).toMatchObject({
      purchaseOrderNumber: "PO-000001",
      supplierName: "Soko Yetu Supplies",
      outstandingCents: 200000,
    });
    // A promise to pay is not a debt yet
    expect(await balanceOf("2000")).toBe(0);
  });
});

describe("GoodsReceived", () => {
  it("books stock we own and a bill we owe, due on the order's terms", async () => {
    await handlePurchaseOrderApproved(purchaseOrderApproved());
    await handleGoodsReceived(goodsReceived());

    const [bill] = await bills();

    expect(bill).toMatchObject({
      goodsReceivedNoteNumber: "GRN-000001",
      supplierName: "Soko Yetu Supplies",
      amountCents: 100000,
      outstandingCents: 100000,
      // Received 10 September on 30-day terms
      dueDate: "2026-10-10",
      status: "OPEN",
    });
    expect(await balanceOf("1200")).toBe(100000);
    expect(await balanceOf("2000")).toBe(100000);

    // Half the order has now arrived
    const { body } = await api().get(`${base}/commitments`).expect(200);
    expect(body.data.totalOutstandingCents).toBe(100000);
  });

  it("books a redelivered event once", async () => {
    const event = goodsReceived();

    await handleGoodsReceived(event);
    await handleGoodsReceived(event);

    expect(await bills()).toHaveLength(1);
    expect(await balanceOf("2000")).toBe(100000);
  });

  it("still books a delivery that arrives before its order, and names the supplier later", async () => {
    await handleGoodsReceived(goodsReceived());

    const [waiting] = await bills();
    expect(waiting).toMatchObject({ supplierName: null, dueDate: null, amountCents: 100000 });
    expect(await balanceOf("2000")).toBe(100000);

    await handlePurchaseOrderApproved(purchaseOrderApproved());

    const [matched] = await bills();
    expect(matched).toMatchObject({ supplierName: "Soko Yetu Supplies", dueDate: "2026-10-10" });
  });

  it("rejects a delivery with nothing in it for good", async () => {
    const event = goodsReceived();
    event.payload = { ...(event.payload as object), products: [] };

    await expect(handleGoodsReceived(event)).rejects.toBeInstanceOf(PermanentEventError);
  });
});

describe("POST /bills/:id/payments", () => {
  const aBill = async () => {
    await handlePurchaseOrderApproved(purchaseOrderApproved());
    await handleGoodsReceived(goodsReceived());
    return (await bills())[0];
  };

  it("pays part of a bill, then the rest", async () => {
    const bill = await aBill();

    const part = await pay(bill.id, { amountCents: 40000, reference: "BANK-123" }).expect(201);
    expect(part.body.data).toMatchObject({ status: "OPEN", paidCents: 40000, outstandingCents: 60000 });
    expect(await balanceOf("2000")).toBe(60000);

    const rest = await pay(bill.id, { amountCents: 60000 }).expect(201);
    expect(rest.body.data).toMatchObject({ status: "PAID", outstandingCents: 0 });
    expect(rest.body.data.payments).toHaveLength(2);

    expect(await balanceOf("2000")).toBe(0);
    // Paid from the bank, which no capital has been recorded in
    expect(await balanceOf("1020")).toBe(-100000);
    expect(await bills()).toHaveLength(0);
  });

  it("refuses to pay more than is owed", async () => {
    const bill = await aBill();

    const { body } = await pay(bill.id, { amountCents: 100001 }).expect(400);

    expect(body.error.details).toHaveProperty("amountCents");
  });

  it("refuses to pay a bill twice", async () => {
    const bill = await aBill();
    await pay(bill.id, { amountCents: 100000 }).expect(201);

    await pay(bill.id, { amountCents: 1 }).expect(409);
  });

  it("refuses a bill whose supplier is not known yet", async () => {
    await handleGoodsReceived(goodsReceived());
    const [bill] = await bills();

    await pay(bill.id, { amountCents: 1000 }).expect(409);
  });

  it("only lets finance pay", async () => {
    const bill = await aBill();

    await api().post(`${base}/bills/${bill.id}/payments`).set(CASHIER).send({ amountCents: 1000 }).expect(403);
  });
});

describe("GET /bills/suppliers", () => {
  it("adds up what each supplier is owed", async () => {
    await handlePurchaseOrderApproved(purchaseOrderApproved());
    await handleGoodsReceived(goodsReceived("GRN-000001", 10));
    await handleGoodsReceived(goodsReceived("GRN-000002", 5));

    const { body } = await api().get(`${base}/bills/suppliers`).expect(200);

    expect(body.data.totals.outstandingCents).toBe(150000);
    expect(body.data.suppliers).toHaveLength(1);
    expect(body.data.suppliers[0]).toMatchObject({
      supplierName: "Soko Yetu Supplies",
      billCount: 2,
      outstandingCents: 150000,
      nextDueDate: "2026-10-10",
    });
  });
});
