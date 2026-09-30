# GoodsReceived

Published by **Receiving** when a delivery has been checked against its purchase order
and a goods received note issued. Consumed by **Inventory** (stock on hand rises) and
**Procurement** (the order moves towards closed).

- Exchange: `commerce.events` (topic, durable)
- Routing key: `receiving.goods-received`
- Published once per goods received note. Consumers record the `eventId` they have
  handled, so the same delivery is never counted twice.

## Envelope

```json
{
  "eventId": "3c1f...",
  "eventType": "GoodsReceived",
  "aggregateId": "GRN-000001",
  "occurredAt": "2026-09-28T14:23:14.708Z",
  "payload": { }
}
```

## Payload

| Field | Type | Meaning |
| --- | --- | --- |
| `goodsReceivedNoteNumber` | string | The note's number, e.g. `GRN-000001` |
| `purchaseOrderId` | string | Procurement's id for the order |
| `purchaseOrderNumber` | string | e.g. `PO-000123` |
| `locationId` | string | Where the goods were taken in; a location id or code such as `WH-MAIN` |
| `receivedAt` | string | When the delivery was accepted |
| `products[].productId` | string | The product that arrived |
| `products[].quantityReceived` | integer | Units accepted into stock |
| `products[].unitCostCents` | integer | What each cost, from the purchase order |

```json
{
  "goodsReceivedNoteNumber": "GRN-000001",
  "purchaseOrderId": "5f2c...",
  "purchaseOrderNumber": "PO-000123",
  "locationId": "WH-MAIN",
  "receivedAt": "2026-09-28T14:23:14.708Z",
  "products": [
    { "productId": "MAIZE-2KG", "quantityReceived": 93, "unitCostCents": 125050 }
  ]
}
```

## What is left out, on purpose

Only **accepted** units are announced. Damaged units and products that were never ordered
stay on the goods received note and never reach sellable stock: that is the quarantine.
A delivery where nothing was accepted publishes no event at all.

## How Inventory reacts

- `onHand` rises by `quantityReceived`, and a `RECEIPT` movement records it.
- `onOrder` falls by the same amount, never below zero: a delivery of more than was
  ordered still only cancels what was outstanding.
- `averageCostCents` is recalculated as a weighted average across the stock now held,
  which is the only moment Inventory learns what stock cost.
- `productId` and `locationId` may be the id or the code/SKU; Inventory resolves either.
  An unknown product or location is a contract violation and is dead-lettered rather
  than guessed at.
