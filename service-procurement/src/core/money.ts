// Vendor Management stores prices as KES floats (e.g. 1250.5), while every amount inside
// procurement is integer cents (125050). Convert once, at the boundary.
export const toCents = (amount: number) => Math.round(amount * 100);
