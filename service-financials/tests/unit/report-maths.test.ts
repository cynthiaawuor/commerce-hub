import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "../../src/ledger/accounts";
import { balanceSheet, marginPercent, profitAndLoss, withProfit } from "../../src/reports/report-maths";

const sum = (account: { code: string }, debitCents: number, creditCents: number) => ({
  accountCode: account.code,
  debitCents,
  creditCents,
});

// Bought KES 950 of stock on credit, sold KES 600 of it for KES 1,160 cash
// (KES 160 of that is VAT), and one till was KES 50 short
const books = [
  sum(ACCOUNTS.INVENTORY, 95000, 60000),
  sum(ACCOUNTS.ACCOUNTS_PAYABLE, 0, 95000),
  sum(ACCOUNTS.CASH, 116000, 5000),
  sum(ACCOUNTS.VAT_PAYABLE, 0, 16000),
  sum(ACCOUNTS.SALES_REVENUE, 0, 100000),
  sum(ACCOUNTS.COST_OF_GOODS_SOLD, 60000, 0),
  sum(ACCOUNTS.CASH_OVER_SHORT, 5000, 0),
];

describe("profitAndLoss", () => {
  it("works out gross and net profit", () => {
    expect(profitAndLoss(books)).toEqual({
      revenueCents: 100000,
      costOfGoodsSoldCents: 60000,
      grossProfitCents: 40000,
      grossMarginPercent: 40,
      cashOverShortCents: 5000,
      netProfitCents: 35000,
    });
  });

  it("is all zeros with nothing booked", () => {
    expect(profitAndLoss([])).toMatchObject({ revenueCents: 0, netProfitCents: 0, grossMarginPercent: null });
  });
});

describe("balanceSheet", () => {
  it("balances: what we own equals what we owe plus what we kept", () => {
    const sheet = balanceSheet(books);

    // Cash 111,000 + inventory 35,000
    expect(sheet.totalAssetsCents).toBe(146000);
    // Suppliers 95,000 + VAT 16,000
    expect(sheet.totalLiabilitiesCents).toBe(111000);
    expect(sheet.totalEquityCents).toBe(35000);
    expect(sheet.balanced).toBe(true);
  });
});

describe("withProfit", () => {
  it("adds profit and margin, most profitable first", () => {
    const rows = withProfit([
      { sku: "RICE-1KG", quantity: 10, revenueCents: 10000, costCents: 9000 },
      { sku: "OIL-5L", quantity: 2, revenueCents: 20000, costCents: 12000 },
    ]);

    expect(rows.map((row) => row.sku)).toEqual(["OIL-5L", "RICE-1KG"]);
    expect(rows[0]).toMatchObject({ grossProfitCents: 8000, grossMarginPercent: 40 });
  });
});

describe("marginPercent", () => {
  it("rounds to one decimal place", () => {
    expect(marginPercent(1, 3)).toBe(33.3);
  });

  it("has no answer without revenue", () => {
    expect(marginPercent(0, 0)).toBeNull();
  });
});
