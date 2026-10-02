import { describe, expect, it } from "vitest";
import { checkClose, describeDifference } from "../../src/register-days/close-rules";

const expected = { expectedCashCents: 500000, expectedCardCents: 200000 };

describe("checkClose", () => {
  it("closes a count that balances, with no explanation", () => {
    const result = checkClose({
      ...expected,
      countedCashCents: 500000,
      countedCardCents: 200000,
      explanation: null,
    });

    expect(result).toEqual({
      ok: true,
      cashDifferenceCents: 0,
      cardDifferenceCents: 0,
      differenceCents: 0,
    });
  });

  it("refuses a shortage with no explanation, and says how much", () => {
    const result = checkClose({
      ...expected,
      countedCashCents: 495000,
      countedCardCents: 200000,
      explanation: null,
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain("cash KES 50.00 short");
  });

  it("closes a shortage once it is explained", () => {
    const result = checkClose({
      ...expected,
      countedCashCents: 495000,
      countedCardCents: 200000,
      explanation: "Gave a customer change for 1000 instead of 500",
    });

    expect(result).toMatchObject({ ok: true, cashDifferenceCents: -5000, differenceCents: -5000 });
  });

  it("refuses an explanation too short to mean anything", () => {
    const result = checkClose({
      ...expected,
      countedCashCents: 495000,
      countedCardCents: 200000,
      explanation: "  oops  ",
    });

    expect(result.ok).toBe(false);
  });

  it("still asks when cash over and card short cancel out", () => {
    const result = checkClose({
      ...expected,
      countedCashCents: 510000,
      countedCardCents: 190000,
      explanation: null,
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain("cash KES 100.00 over, card slips KES 100.00 short");
  });
});

describe("describeDifference", () => {
  it("reads naturally", () => {
    expect(describeDifference(0)).toBe("balanced");
    expect(describeDifference(-5000)).toBe("KES 50.00 short");
    expect(describeDifference(2550)).toBe("KES 25.50 over");
  });
});
