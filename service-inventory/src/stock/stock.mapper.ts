type Level = {
  onHand: number;
  allocated: number;
};

// available is always calculated, never stored, so it cannot drift from the quantities
// it is derived from. It never reads below zero: a damaged-stock adjustment can leave
// onHand under what is already reserved, and "minus two available" would help nobody.
const toStockResponse = <T extends Level>(level: T) => ({
  ...level,
  available: Math.max(level.onHand - level.allocated, 0),
});

export { toStockResponse };
