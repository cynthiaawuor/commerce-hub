# GoodsReceived

Published by **Receiving** when goods have been checked against a purchase order and
formally taken into the business (a Goods Received Note). Consumed by **Inventory**,
which raises the stock on hand and lowers what is still on order.

- Exchange: `commerce.events` (topic, durable)
- Routing key: `receiving.goods-received`
- Published once per GRN. Redelivery is safe: Inventory records the `eventId` it has
  handled, so the same arrival is never counted twice.

## Envelope

```json
{
  "eventId": "3c1f...",
  "eventType": "GoodsReceived",
  "aggregateId": "GRN-500",
  "occurredAt": "2026-09-24T08:15:00.000Z",
  "payload": { }
}
```

## Payload

| Field | Type | Meaning |
| --- | --- | --- |
| `grnId` | string | The Goods Received Note number |
| `purchaseOrderId` | string | The order these goods arrived against |
| `locationId` | string | Where the goods were taken in |
| `receivedAt` | string | When the delivery was accepted |
| `lines[].productId` | string | The product that arrived |
| `lines[].quantityReceived` | integer | How many were accepted (damaged goods are excluded) |
| `lines[].unitCostCents` | integer | What each one cost, from the purchase order |

```json
{
  "grnId": "GRN-500",
  "purchaseOrderId": "PO-000012",
  "locationId": "WH-MAIN",
  "receivedAt": "2026-09-24T08:15:00.000Z",
  "lines": [
    { "productId": "MAIZE-2KG", "quantityReceived": 95, "unitCostCents": 125050 }
  ]
}
```

## How Inventory reacts

- `onHand` rises by `quantityReceived`, and a `RECEIPT` movement records it.
- `onOrder` falls by the same amount, never below zero: a delivery of more than was
  ordered still only cancels what was outstanding.
- `averageCostCents` is recalculated as a weighted average across the stock now held,
  which is the only moment Inventory learns what stock cost.
- `productId` and `locationId` may be the id or the code/SKU; Inventory resolves either.
  An unknown product or location is a contract violation and is dead-lettered rather
  than guessed at.
