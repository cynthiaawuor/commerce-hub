import { describe, expect, it } from "vitest";
import { hasCrossedReorderPoint } from "../../src/stock/stock-low";

describe("hasCrossedReorderPoint", () => {
  it("fires when stock falls past the reorder point", () => {
    expect(hasCrossedReorderPoint(21, 19, 20)).toBe(true);
  });

  it("fires when stock lands exactly on the reorder point", () => {
    expect(hasCrossedReorderPoint(21, 20, 20)).toBe(true);
  });

  it("stays quiet while stock is already below the point", () => {
    expect(hasCrossedReorderPoint(19, 18, 20)).toBe(false);
  });

  it("stays quiet when stock is still above the point", () => {
    expect(hasCrossedReorderPoint(30, 25, 20)).toBe(false);
  });

  it("stays quiet when stock is rising", () => {
    expect(hasCrossedReorderPoint(5, 40, 20)).toBe(false);
  });

  it("ignores products with no reorder point set", () => {
    expect(hasCrossedReorderPoint(5, 0, 0)).toBe(false);
  });
});
