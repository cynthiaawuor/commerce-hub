import { describe, expect, it } from "vitest";
import { allocate } from "../../src/sales/allocation";

const sum = (parts: number[]) => parts.reduce((total, part) => total + part, 0);

describe("allocate", () => {
  it("shares an amount in proportion", () => {
    expect(allocate(10000, [1, 1])).toEqual([5000, 5000]);
    expect(allocate(10000, [3, 1])).toEqual([7500, 2500]);
  });

  it("never loses or invents a cent", () => {
    const shares = allocate(10000, [1, 1, 1]);

    expect(shares).toEqual([3334, 3333, 3333]);
    expect(sum(shares)).toBe(10000);
  });

  it("gives the leftover cents to the parts that lost most in rounding", () => {
    // Exact shares: 15517.24 and 81896.55 of 97414
    const shares = allocate(97414, [18000, 95000]);

    expect(sum(shares)).toBe(97414);
    expect(shares).toEqual([15517, 81897]);
  });

  it("splits evenly when there is nothing to weigh by", () => {
    expect(allocate(100, [0, 0])).toEqual([50, 50]);
  });

  it("returns nothing for no parts", () => {
    expect(allocate(100, [])).toEqual([]);
  });
});
