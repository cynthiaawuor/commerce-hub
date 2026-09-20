// totalCents is a Postgres bigint, which reaches us as a JavaScript bigint, and
// JSON.stringify() throws on those. Convert before responding. The value stays in
// cents (an integer) and the client decides how to display it.
const toPurchaseOrderResponse = <T extends { totalCents: bigint }>({
  totalCents,
  ...purchaseOrder
}: T) => ({
  ...purchaseOrder,
  totalCents: Number(totalCents),
});

type LineWithQuantities = {
  quantityOrdered: number;
  quantityReceived: number;
};

// Receiving needs to know what is still expected, not just what was ordered,
// so each line carries the outstanding quantity.
const toPurchaseOrderWithOutstanding = <
  T extends { totalCents: bigint; lines: LineWithQuantities[] },
>(
  purchaseOrder: T,
) => ({
  ...toPurchaseOrderResponse(purchaseOrder),
  lines: purchaseOrder.lines.map((line) => ({
    ...line,
    quantityOutstanding: line.quantityOrdered - line.quantityReceived,
  })),
});

export { toPurchaseOrderResponse, toPurchaseOrderWithOutstanding };
