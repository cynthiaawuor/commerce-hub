// The heart of receiving: how what came off the truck compares with what was expected,
// and how much of it goes into stock.
//
// - Damaged units are recorded but never accepted: that is the quarantine.
// - Accepted never exceeds what was expected, so extra units are flagged, not taken in.
// - A product that was never ordered is recorded and accepted as zero.
type ReceivedProduct = {
  // Still outstanding on the order when the truck arrived; 0 if it was never ordered
  quantityExpected: number;
  // Counted off the truck, damaged ones included
  quantityDelivered: number;
  quantityDamaged: number;
  wasOrdered: boolean;
};

type Discrepancy = "NONE" | "LESS" | "MORE" | "NOT_ORDERED";

const checkReceivedProduct = ({
  quantityExpected,
  quantityDelivered,
  quantityDamaged,
  wasOrdered,
}: ReceivedProduct): { quantityAccepted: number; discrepancy: Discrepancy } => {
  if (!wasOrdered) {
    return { quantityAccepted: 0, discrepancy: "NOT_ORDERED" };
  }

  const goodUnits = quantityDelivered - quantityDamaged;
  const quantityAccepted = Math.max(Math.min(goodUnits, quantityExpected), 0);

  const discrepancy: Discrepancy =
    quantityDelivered < quantityExpected
      ? "LESS"
      : quantityDelivered > quantityExpected
        ? "MORE"
        : "NONE";

  return { quantityAccepted, discrepancy };
};

export { checkReceivedProduct, type Discrepancy, type ReceivedProduct };
