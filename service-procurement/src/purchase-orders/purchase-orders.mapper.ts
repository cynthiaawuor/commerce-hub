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

export { toPurchaseOrderResponse };
