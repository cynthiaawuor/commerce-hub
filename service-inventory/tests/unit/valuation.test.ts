import { describe, expect, it } from "vitest";
import { summarise, toValuationLines } from "../../src/valuation/valuation";

const level = (overrides: Partial<Parameters<typeof toValuationLines>[0][number]> = {}) => ({
  locationId: "loc-1",
  locationCode: "WH-MAIN",
  locationName: "Main warehouse",
  productId: "prod-1",
  sku: "MAIZE-2KG",
  productName: "Maize flour 2kg",
  onHand: 10,
  averageCostCents: 125050,
  ...overrides,
});

describe("toValuationLines", () => {
  it("values stock at quantity times average cost", () => {
    const [line] = toValuationLines([level()]);

    expect(line!.valueCents).toBe(1250500);
  });

  it("puts the most valuable stock first", () => {
    const lines = toValuationLines([
      level({ productId: "cheap", onHand: 1, averageCostCents: 100 }),
      level({ productId: "dear", onHand: 5, averageCostCents: 100000 }),
    ]);

    expect(lines.map((line) => line.productId)).toEqual(["dear", "cheap"]);
  });

  it("values stock with no recorded cost at nothing", () => {
    const [line] = toValuationLines([level({ averageCostCents: 0 })]);

    expect(line!.valueCents).toBe(0);
  });
});

describe("summarise", () => {
  it("totals units and value across locations", () => {
    const result = summarise([
      level({ onHand: 10, averageCostCents: 1000 }),
      level({
        locationId: "loc-2",
        locationCode: "STORE-3",
        onHand: 4,
        averageCostCents: 1000,
      }),
    ]);

    expect(result.totalUnits).toBe(14);
    expect(result.totalValueCents).toBe(14000);
    expect(result.locations).toHaveLength(2);
  });

  it("adds up several products in one location", () => {
    const result = summarise([
      level({ productId: "a", onHand: 2, averageCostCents: 500 }),
      level({ productId: "b", onHand: 3, averageCostCents: 1000 }),
    ]);

    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]!.valueCents).toBe(4000);
    expect(result.totalValueCents).toBe(4000);
  });

  it("reports nothing held as zero", () => {
    expect(summarise([])).toMatchObject({ totalUnits: 0, totalValueCents: 0 });
  });
});
