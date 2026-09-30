import { describe, expect, it } from "vitest";
import { suggestShelf, type ShelfOption } from "../../src/putaway-tasks/suggest-shelf";

const shelf = (
  code: string,
  distanceFromDock: number,
  freeUnits: number,
  holdsProduct = false,
): ShelfOption => ({ code, distanceFromDock, freeUnits, holdsProduct });

describe("suggestShelf", () => {
  it("picks the shelf nearest the dock", () => {
    const shelves = [shelf("B-01", 30, 100), shelf("A-01", 5, 100)];

    expect(suggestShelf(shelves, 10)).toBe("A-01");
  });

  it("keeps a product with the same product, even further away", () => {
    const shelves = [shelf("A-01", 5, 100), shelf("B-01", 30, 100, true)];

    expect(suggestShelf(shelves, 10)).toBe("B-01");
  });

  it("skips shelves without room for everything", () => {
    const shelves = [shelf("A-01", 5, 9, true), shelf("B-01", 30, 100)];

    expect(suggestShelf(shelves, 10)).toBe("B-01");
  });

  it("suggests nothing when no shelf has room", () => {
    const shelves = [shelf("A-01", 5, 3), shelf("B-01", 30, 9)];

    expect(suggestShelf(shelves, 10)).toBeNull();
  });

  it("uses a shelf that fits exactly", () => {
    expect(suggestShelf([shelf("A-01", 5, 10)], 10)).toBe("A-01");
  });

  it("breaks a tie on distance by shelf code", () => {
    const shelves = [shelf("A-02", 5, 50), shelf("A-01", 5, 50)];

    expect(suggestShelf(shelves, 10)).toBe("A-01");
  });
});
