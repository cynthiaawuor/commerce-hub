import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "../../src/ledger/accounts";
import * as postings from "../../src/ledger/postings";

const line = (account: { code: string }, debitCents: number, creditCents: number) => ({
  accountCode: account.code,
  debitCents,
  creditCents,
});

describe("postings", () => {
  it("books goods received as stock we own and money we owe", () => {
    const lines = postings.goodsReceived(95000);

    expect(lines).toEqual([
      line(ACCOUNTS.INVENTORY, 95000, 0),
      line(ACCOUNTS.ACCOUNTS_PAYABLE, 0, 95000),
    ]);
    expect(postings.isBalanced(lines)).toBe(true);
  });

  it("splits a sale into VAT owed and revenue", () => {
    const lines = postings.sale({ cashCents: 11600, cardCents: 0, taxCents: 1600, netCents: 10000 });

    expect(lines).toEqual([
      line(ACCOUNTS.CASH, 11600, 0),
      line(ACCOUNTS.VAT_PAYABLE, 0, 1600),
      line(ACCOUNTS.SALES_REVENUE, 0, 10000),
    ]);
    expect(postings.isBalanced(lines)).toBe(true);
  });

  it("books a split payment to cash and card", () => {
    const lines = postings.sale({ cashCents: 5000, cardCents: 6600, taxCents: 1600, netCents: 10000 });

    expect(lines).toContainEqual(line(ACCOUNTS.CASH, 5000, 0));
    expect(lines).toContainEqual(line(ACCOUNTS.CARD_CLEARING, 6600, 0));
    expect(postings.isBalanced(lines)).toBe(true);
  });

  it("moves the cost of sold goods out of inventory", () => {
    expect(postings.saleCost(6000)).toEqual([
      line(ACCOUNTS.COST_OF_GOODS_SOLD, 6000, 0),
      line(ACCOUNTS.INVENTORY, 0, 6000),
    ]);
  });

  it("books a short till as an expense", () => {
    const lines = postings.dayClosed({ cashDifferenceCents: -5000, cardDifferenceCents: 0 });

    expect(lines).toEqual([
      line(ACCOUNTS.CASH_OVER_SHORT, 5000, 0),
      line(ACCOUNTS.CASH, 0, 5000),
    ]);
  });

  it("books a till that is over the other way round", () => {
    const lines = postings.dayClosed({ cashDifferenceCents: 2000, cardDifferenceCents: 0 });

    expect(lines).toEqual([
      line(ACCOUNTS.CASH, 2000, 0),
      line(ACCOUNTS.CASH_OVER_SHORT, 0, 2000),
    ]);
  });

  it("books nothing for a till that balanced", () => {
    expect(postings.dayClosed({ cashDifferenceCents: 0, cardDifferenceCents: 0 })).toEqual([]);
  });

  it("pays a supplier from the bank", () => {
    expect(postings.supplierPayment(40000)).toEqual([
      line(ACCOUNTS.ACCOUNTS_PAYABLE, 40000, 0),
      line(ACCOUNTS.BANK, 0, 40000),
    ]);
  });
});

describe("isBalanced", () => {
  it("refuses debits that do not equal credits", () => {
    expect(
      postings.isBalanced([line(ACCOUNTS.CASH, 100, 0), line(ACCOUNTS.SALES_REVENUE, 0, 90)]),
    ).toBe(false);
  });

  it("refuses an empty or one-sided entry", () => {
    expect(postings.isBalanced([])).toBe(false);
    expect(postings.isBalanced([line(ACCOUNTS.CASH, 100, 0)])).toBe(false);
  });

  it("refuses fractions of a cent", () => {
    expect(
      postings.isBalanced([line(ACCOUNTS.CASH, 10.5, 0), line(ACCOUNTS.SALES_REVENUE, 0, 10.5)]),
    ).toBe(false);
  });
});
