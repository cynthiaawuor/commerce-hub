import { describe, expect, it } from "vitest";
import {
  canTransition,
  isEditable,
  isFinal,
} from "../../src/purchase-orders/purchase-order-state";

describe("canTransition", () => {
  it("lets a buyer submit a draft for approval", () => {
    expect(canTransition("DRAFT", "PENDING_APPROVAL")).toBe(true);
  });

  it("lets an approver approve or reject a submitted order", () => {
    expect(canTransition("PENDING_APPROVAL", "APPROVED")).toBe(true);
    expect(canTransition("PENDING_APPROVAL", "REJECTED")).toBe(true);
  });

  it("refuses to skip approval", () => {
    expect(canTransition("DRAFT", "APPROVED")).toBe(false);
    expect(canTransition("DRAFT", "SENT")).toBe(false);
  });

  it("sends a rejected order back to draft", () => {
    expect(canTransition("REJECTED", "DRAFT")).toBe(true);
  });

  it("refuses to reopen a closed or cancelled order", () => {
    expect(canTransition("CLOSED", "DRAFT")).toBe(false);
    expect(canTransition("CANCELLED", "DRAFT")).toBe(false);
  });

  it("follows receiving from sent to closed", () => {
    expect(canTransition("SENT", "PARTIALLY_RECEIVED")).toBe(true);
    expect(canTransition("PARTIALLY_RECEIVED", "CLOSED")).toBe(true);
  });
});

describe("isEditable", () => {
  it("allows edits only while the order is a draft", () => {
    expect(isEditable("DRAFT")).toBe(true);
    expect(isEditable("PENDING_APPROVAL")).toBe(false);
    expect(isEditable("APPROVED")).toBe(false);
  });
});

describe("isFinal", () => {
  it("marks closed and cancelled as the end of the line", () => {
    expect(isFinal("CLOSED")).toBe(true);
    expect(isFinal("CANCELLED")).toBe(true);
    expect(isFinal("SENT")).toBe(false);
  });
});
