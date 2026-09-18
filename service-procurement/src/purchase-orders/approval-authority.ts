// Approval limits, in cents. A buyer signs off routine orders; anything above
// KES 100,000 needs a manager.
const BUYER_APPROVAL_LIMIT_CENTS = 10_000_000n; // KES 100,000.00

const canApprove = (role: string, totalCents: bigint | number) => {
  if (role === "MANAGER") {
    return true;
  }

  if (role !== "BUYER") {
    return false;
  }

  return BigInt(totalCents) <= BUYER_APPROVAL_LIMIT_CENTS;
};

// Separation of duties: whoever raised an order cannot be the one who signs it off,
// whatever their role. Approval is a second pair of eyes, not a formality.
const isSelfApproval = (createdBy: string, approverId: string) =>
  createdBy === approverId;

// Used in the error message when someone approves above their limit
const requiredRoleFor = (totalCents: bigint | number) =>
  BigInt(totalCents) > BUYER_APPROVAL_LIMIT_CENTS ? "MANAGER" : "BUYER";

export {
  BUYER_APPROVAL_LIMIT_CENTS,
  canApprove,
  isSelfApproval,
  requiredRoleFor,
};