import { describe, expect, it } from "vitest";
import { ageBucket, daysOverdue, dueDateFor, termsInDays } from "../../src/payables/payment-terms";

describe("payment terms", () => {
  it("reads the days out of the terms", () => {
    expect(termsInDays("NET_30")).toBe(30);
    expect(termsInDays("NET_60")).toBe(60);
  });

  it("treats terms with no days as due on receipt", () => {
    expect(termsInDays("COD")).toBe(0);
    expect(termsInDays("whenever")).toBe(0);
  });

  it("works out when a bill falls due", () => {
    expect(dueDateFor("2026-09-28T14:23:14.000Z", "NET_30")).toBe("2026-10-28");
    expect(dueDateFor("2026-09-28T14:23:14.000Z", "COD")).toBe("2026-09-28");
  });

  it("counts whole days overdue", () => {
    expect(daysOverdue("2026-10-28", "2026-10-28")).toBe(0);
    expect(daysOverdue("2026-10-28", "2026-11-02")).toBe(5);
    expect(daysOverdue("2026-10-28", "2026-10-20")).toBe(-8);
  });

  it("puts a bill in the usual aged-payables columns", () => {
    expect(ageBucket(-3)).toBe("NOT_DUE");
    expect(ageBucket(0)).toBe("NOT_DUE");
    expect(ageBucket(1)).toBe("1_30");
    expect(ageBucket(30)).toBe("1_30");
    expect(ageBucket(31)).toBe("31_60");
    expect(ageBucket(90)).toBe("61_90");
    expect(ageBucket(91)).toBe("OVER_90");
  });
});
