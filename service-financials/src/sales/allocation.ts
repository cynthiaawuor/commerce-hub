// Splits an amount across parts in proportion to their weights, in whole cents, so
// the parts always add back up to the amount exactly. Used to share a sale's revenue
// (net of VAT and any sale-wide discount) across its products.
//
// Largest remainder: every part gets its rounded-down share, and the cents left over
// go to the parts that lost the most in rounding.
const allocate = (amountCents: number, weights: number[]): number[] => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (weights.length === 0) {
    return [];
  }

  // Nothing to weigh by: split evenly
  const effective = totalWeight > 0 ? weights : weights.map(() => 1);
  const effectiveTotal = totalWeight > 0 ? totalWeight : weights.length;

  const exact = effective.map((weight) => (amountCents * weight) / effectiveTotal);
  const shares = exact.map(Math.floor);

  let leftover = amountCents - shares.reduce((sum, share) => sum + share, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (const { index } of byRemainder) {
    if (leftover <= 0) break;
    shares[index]! += 1;
    leftover -= 1;
  }

  return shares;
};

export { allocate };
