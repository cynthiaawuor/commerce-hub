// Published when a product crosses its reorder point, not every time it is below it:
// a shop selling one unit an hour would otherwise raise an alert an hour, all day.
const hasCrossedReorderPoint = (
  availableBefore: number,
  availableAfter: number,
  reorderPoint: number,
) => {
  // A reorder point of zero means "do not watch this product"
  if (reorderPoint <= 0) {
    return false;
  }

  return availableBefore > reorderPoint && availableAfter <= reorderPoint;
};

export { hasCrossedReorderPoint };
