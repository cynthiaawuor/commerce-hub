import { describe, expect, it } from "vitest";
import { checkReceivedProduct } from "../../src/goods-received-notes/discrepancy";

const check = (
  quantityExpected: number,
  quantityDelivered: number,
  quantityDamaged = 0,
  wasOrdered = true,
) =>
  checkReceivedProduct({ quantityExpected, quantityDelivered, quantityDamaged, wasOrdered });

describe("checkReceivedProduct", () => {
  it("accepts a delivery that matches the order", () => {
    expect(check(100, 100)).toEqual({ quantityAccepted: 100, discrepancy: "NONE" });
  });

  it("flags a short delivery and accepts what came", () => {
    // The spec's example: ordered 100, received 95
    expect(check(100, 95)).toEqual({ quantityAccepted: 95, discrepancy: "LESS" });
  });

  it("flags extra units and accepts only what was expected", () => {
    expect(check(100, 110)).toEqual({ quantityAccepted: 100, discrepancy: "MORE" });
  });

  it("keeps damaged units out of stock", () => {
    expect(check(100, 100, 3)).toEqual({ quantityAccepted: 97, discrepancy: "NONE" });
  });

  it("uses spare good units to cover damaged ones in an over-delivery", () => {
    expect(check(100, 105, 3)).toEqual({ quantityAccepted: 100, discrepancy: "MORE" });
  });

  it("accepts nothing of a product that was never ordered", () => {
    expect(check(0, 12, 0, false)).toEqual({
      quantityAccepted: 0,
      discrepancy: "NOT_ORDERED",
    });
  });

  it("accepts nothing when everything arrived damaged", () => {
    expect(check(10, 10, 10)).toEqual({ quantityAccepted: 0, discrepancy: "NONE" });
  });
});
