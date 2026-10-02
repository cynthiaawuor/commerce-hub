import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// What Inventory answers for a product's average cost; a missing product means it is down
const inventory = vi.hoisted(() => ({ costs: new Map<string, number>() }));

vi.mock("../../src/inventory/inventory.client", () => ({
  getAverageCostCents: vi.fn(async (productId: string) => {
    const cost = inventory.costs.get(productId);

    if (cost === undefined) {
      throw new Error("Inventory is unavailable");
    }

    return cost;
  }),
}));

import { createApp } from "../../src/app";
import { handleDayClosed } from "../../src/events/day-closed.consumer";
import { PermanentEventError } from "../../src/events/event-envelope";
import { handleGoodsReceived } from "../../src/events/goods-received.consumer";
import { handleItemSold } from "../../src/events/item-sold.consumer";
import { db } from "../../src/prisma/db";
import { costWaitingSales } from "../../src/sales/sales.service";
import { SEPTEMBER, dayClosed, goodsReceived, itemSold, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/financials-api";

const accounts = async () => (await api().get(`${base}/ledger/accounts`).expect(200)).body.data;

const balanceOf = async (code: string) =>
  (await accounts()).accounts.find((account: any) => account.code === code).balanceCents;

const profitAndLoss = async () =>
  (await api().get(`${base}/reports/profit-and-loss?${SEPTEMBER}`).expect(200)).body.data;

// Rice costs KES 100, oil KES 600
const inventoryIsUp = () => {
  inventory.costs = new Map([["prod-rice", 10000], ["prod-oil", 60000]]);
};

beforeEach(async () => {
  inventoryIsUp();
  await resetDatabase();
});
afterAll(async () => {
  await resetDatabase();
  await db.close();
});

describe("ItemSold", () => {
  it("books the money, the VAT, the revenue and the cost of the goods", async () => {
    await handleItemSold(itemSold());

    expect(await balanceOf("1000")).toBe(131000);
    expect(await balanceOf("2100")).toBe(18069);
    // 131,000 less the VAT
    expect(await balanceOf("4000")).toBe(112931);
    // 2 rice at 10,000 and 1 oil at 60,000
    expect(await balanceOf("5000")).toBe(80000);
    // Inventory falls by what the goods cost
    expect(await balanceOf("1200")).toBe(-80000);
  });

  it("books a split payment to cash and card", async () => {
    await handleItemSold(
      itemSold("SALE-000001", {
        payments: [
          { method: "CASH", amountCents: 31000 },
          { method: "CARD", amountCents: 100000 },
        ],
      }),
    );

    expect(await balanceOf("1000")).toBe(31000);
    expect(await balanceOf("1010")).toBe(100000);
  });

  it("books a redelivered sale once", async () => {
    const event = itemSold();

    await handleItemSold(event);
    await handleItemSold(event);

    expect(await balanceOf("4000")).toBe(112931);
  });

  it("books revenue at once when Inventory is down, and the cost once it is back", async () => {
    inventory.costs = new Map();

    await handleItemSold(itemSold());

    expect(await balanceOf("4000")).toBe(112931);
    expect(await balanceOf("5000")).toBe(0);
    expect(await profitAndLoss()).toMatchObject({ uncostedSales: 1 });

    inventoryIsUp();
    expect(await costWaitingSales()).toBe(1);

    expect(await balanceOf("5000")).toBe(80000);
    expect(await profitAndLoss()).toMatchObject({ uncostedSales: 0 });
    // A second pass finds nothing left to do
    expect(await costWaitingSales()).toBe(0);
  });

  it("rejects a sale whose payments do not add up for good", async () => {
    const event = itemSold("SALE-000001", { payments: [{ method: "CASH", amountCents: 100 }] });

    await expect(handleItemSold(event)).rejects.toBeInstanceOf(PermanentEventError);
  });
});

describe("DayClosed", () => {
  it("books a short till as an expense", async () => {
    await handleItemSold(itemSold());
    await handleDayClosed(dayClosed(-5000, "Customer paid with a fake KES 50 note"));

    expect(await balanceOf("6100")).toBe(5000);
    expect(await balanceOf("1000")).toBe(126000);
  });

  it("books nothing for a till that balanced", async () => {
    await handleDayClosed(dayClosed(0));

    const { body } = await api().get(`${base}/ledger/entries?source=DAY_CLOSED`).expect(200);
    expect(body.meta.total).toBe(0);
  });

  it("books a redelivered close once", async () => {
    const event = dayClosed(-5000, "Customer paid with a fake KES 50 note");

    await handleDayClosed(event);
    await handleDayClosed(event);

    expect(await balanceOf("6100")).toBe(5000);
  });
});

describe("reports", () => {
  // Stock bought, a sale made, and a till closed KES 50 short
  const aMonthOfBusiness = async () => {
    await handleGoodsReceived(goodsReceived("GRN-000001", 20));
    await handleItemSold(itemSold());
    await handleDayClosed(dayClosed(-5000, "Customer paid with a fake KES 50 note"));
  };

  it("keeps total debits equal to total credits", async () => {
    await aMonthOfBusiness();

    const books = await accounts();

    expect(books.balanced).toBe(true);
    expect(books.totalDebitCents).toBe(books.totalCreditCents);
    expect(books.totalDebitCents).toBeGreaterThan(0);
  });

  it("reports profit and loss for a period", async () => {
    await aMonthOfBusiness();

    expect(await profitAndLoss()).toMatchObject({
      from: "2026-09-01",
      to: "2026-09-30",
      revenueCents: 112931,
      costOfGoodsSoldCents: 80000,
      grossProfitCents: 32931,
      grossMarginPercent: 29.2,
      cashOverShortCents: 5000,
      netProfitCents: 27931,
      uncostedSales: 0,
    });
  });

  it("leaves out what happened outside the period", async () => {
    await aMonthOfBusiness();

    const { body } = await api()
      .get(`${base}/reports/profit-and-loss?from=2026-08-01&to=2026-08-31`)
      .expect(200);

    expect(body.data).toMatchObject({ revenueCents: 0, netProfitCents: 0 });
  });

  it("balances what we own against what we owe and what we kept", async () => {
    await aMonthOfBusiness();

    const { body } = await api().get(`${base}/reports/balance-sheet`).expect(200);

    expect(body.data.balanced).toBe(true);
    // Cash 126,000 + inventory 200,000 − 80,000
    expect(body.data.totalAssetsCents).toBe(246000);
    // Supplier 200,000 + VAT 18,069
    expect(body.data.totalLiabilitiesCents).toBe(218069);
    expect(body.data.totalEquityCents).toBe(27931);
  });

  it("ranks products by the profit they made", async () => {
    await aMonthOfBusiness();

    const { body } = await api().get(`${base}/reports/profitability?${SEPTEMBER}`).expect(200);

    expect(body.data.rows.map((row: any) => row.sku)).toEqual(["OIL-5L", "RICE-1KG"]);
    expect(body.data.rows[0]).toMatchObject({
      productName: "Cooking oil 5L",
      quantity: 1,
      costCents: 60000,
    });
    // The products' revenue adds back up to the sale's, to the cent
    expect(body.data.rows.reduce((sum: number, row: any) => sum + row.revenueCents, 0)).toBe(112931);
  });

  it("reports profit by store", async () => {
    await aMonthOfBusiness();

    const { body } = await api().get(`${base}/reports/profitability?by=store&${SEPTEMBER}`).expect(200);

    expect(body.data.rows).toEqual([
      expect.objectContaining({ storeCode: "STORE-3", revenueCents: 112931, costCents: 80000, grossProfitCents: 32931 }),
    ]);
  });

  it("refuses a period it cannot read", async () => {
    await api().get(`${base}/reports/profit-and-loss?from=last-month`).expect(400);
    await api().get(`${base}/reports/profit-and-loss?from=2026-09-30&to=2026-09-01`).expect(400);
    await api().get(`${base}/reports/profitability?by=cashier`).expect(400);
  });
});

describe("GET /ledger/entries", () => {
  it("lists journal entries with their lines, and finds one by reference", async () => {
    await handleGoodsReceived(goodsReceived());
    await handleItemSold(itemSold());

    const all = await api().get(`${base}/ledger/entries`).expect(200);
    // The receipt, the sale and the sale's cost
    expect(all.body.meta.total).toBe(3);

    const { body } = await api().get(`${base}/ledger/entries?reference=grn-0000`).expect(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ source: "GOODS_RECEIVED", reference: "GRN-000001" });
    expect(body.data[0].lines.map((line: any) => line.accountName)).toEqual([
      "Inventory",
      "Accounts payable",
    ]);

    await api().get(`${base}/ledger/entries/${body.data[0].id}`).expect(200);
    await api().get(`${base}/ledger/entries?source=NONSENSE`).expect(400);
  });
});
