import { describe, expect, it } from "vitest";
import { settlePayments, vatInside } from "../../src/sales/checkout-rules";

describe("vatInside", () => {
  it("finds the VAT inside a VAT-inclusive price", () => {
    // KES 116.00 at 16% holds KES 16.00 of VAT
    expect(vatInside(11600, 16)).toBe(1600);
  });

  it("rounds to the nearest cent", () => {
    // 18000 × 16 / 116 = 2482.76
    expect(vatInside(18000, 16)).toBe(2483);
  });

  it("is zero for an empty sale", () => {
    expect(vatInside(0, 16)).toBe(0);
  });
});

describe("settlePayments", () => {
  it("gives change from cash", () => {
    expect(settlePayments(18000, [{ method: "CASH", amountCents: 20000 }])).toEqual({
      ok: true,
      paidCents: 20000,
      changeCents: 2000,
    });
  });

  it("accepts an exact card payment", () => {
    expect(settlePayments(18000, [{ method: "CARD", amountCents: 18000 }])).toMatchObject({
      ok: true,
      changeCents: 0,
    });
  });

  it("accepts part cash and part card", () => {
    const result = settlePayments(18000, [
      { method: "CASH", amountCents: 5000 },
      { method: "CARD", amountCents: 13000 },
    ]);

    expect(result).toMatchObject({ ok: true, paidCents: 18000, changeCents: 0 });
  });

  it("refuses to overcharge a card", () => {
    const result = settlePayments(18000, [{ method: "CARD", amountCents: 20000 }]);

    expect(result).toEqual({
      ok: false,
      reason: "Charge the card KES 180.00 at most; change is only given in cash",
    });
  });

  it("refuses a card for more than cash left over", () => {
    const result = settlePayments(18000, [
      { method: "CASH", amountCents: 10000 },
      { method: "CARD", amountCents: 10000 },
    ]);

    expect(result.ok).toBe(false);
  });

  it("says how much is still to pay", () => {
    expect(settlePayments(18000, [{ method: "CASH", amountCents: 15000 }])).toEqual({
      ok: false,
      reason: "KES 30.00 still to pay",
    });
  });
});
