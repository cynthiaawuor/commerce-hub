import { describe, expect, it } from "vitest";
import {
  BUYER_APPROVAL_LIMIT_CENTS,
  canApprove,
  isSelfApproval,
  requiredRoleFor,
} from "../../src/purchase-orders/approval-authority";

describe("canApprove", () => {
  it("lets a buyer approve an order at or below KES 100,000", () => {
    expect(canApprove("BUYER", 5_000_000n)).toBe(true);
    expect(canApprove("BUYER", BUYER_APPROVAL_LIMIT_CENTS)).toBe(true);
  });

  it("stops a buyer one cent above the limit", () => {
    expect(canApprove("BUYER", BUYER_APPROVAL_LIMIT_CENTS + 1n)).toBe(false);
  });

  it("lets a manager approve any amount", () => {
    expect(canApprove("MANAGER", 500_000_000n)).toBe(true);
  });

  it("refuses an unknown role", () => {
    expect(canApprove("WAREHOUSE", 1n)).toBe(false);
  });
});

describe("isSelfApproval", () => {
  it("spots the buyer approving their own order", () => {
    expect(isSelfApproval("buyer@test", "buyer@test")).toBe(true);
  });

  it("allows anyone else to approve it", () => {
    expect(isSelfApproval("buyer@test", "manager@test")).toBe(false);
  });
});

describe("requiredRoleFor", () => {
  it("names the role an order of that size needs", () => {
    expect(requiredRoleFor(BUYER_APPROVAL_LIMIT_CENTS)).toBe("BUYER");
    expect(requiredRoleFor(BUYER_APPROVAL_LIMIT_CENTS + 1n)).toBe("MANAGER");
  });
});
