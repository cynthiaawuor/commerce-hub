import { describe, expect, it } from "vitest";
import { nextRetryDelayMs } from "../../src/events/outbox-retry";

describe("nextRetryDelayMs", () => {
  it("doubles the wait after each failure", () => {
    expect(nextRetryDelayMs(1, 2000, 300000)).toBe(2000);
    expect(nextRetryDelayMs(2, 2000, 300000)).toBe(4000);
    expect(nextRetryDelayMs(3, 2000, 300000)).toBe(8000);
  });

  it("never waits longer than the cap", () => {
    expect(nextRetryDelayMs(20, 2000, 300000)).toBe(300000);
  });
});
