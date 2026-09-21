# StockLow

Published by **Inventory** when a product's available quantity falls to or below its
reorder point. Consumed by **Procurement**, which turns it into a reorder suggestion for
a buyer to review.

- Exchange: `commerce.events` (topic, durable)
- Routing key: `inventory.stock-low`
- Published once when the threshold is crossed, not for every movement below it.

## Envelope

Every event on the bus shares this envelope:

```json
{
  "eventId": "e2f0c4a1-...",
  "eventType": "StockLow",
  "aggregateId": "PROD-7387",
  "occurredAt": "2026-09-20T08:15:00.000Z",
  "payload": { }
}
```

## Payload

| Field | Type | Meaning |
| --- | --- | --- |
| `productId` | string | The product that is running low |
| `productName` | string | Human-readable name, so Procurement need not call Inventory |
| `locationId` | string | Where it is low (warehouse or store) |
| `quantityAvailable` | integer | What is left, excluding reserved stock |
| `reorderPoint` | integer | The threshold that was crossed |
| `reorderQuantity` | integer | How much Inventory suggests ordering |

```json
{
  "productId": "PROD-7387",
  "productName": "Maize flour 2kg",
  "locationId": "WH-MAIN",
  "quantityAvailable": 12,
  "reorderPoint": 20,
  "reorderQuantity": 100
}
```

## How Procurement reacts

- A suggestion is keyed on `(productId, locationId)`: a repeat event updates the existing
  suggestion rather than creating a second one, so a product appears once in the buyer's list.
- Nothing is ordered automatically. A buyer converts a suggestion into a **draft** purchase
  order, which still goes through submit and approval.
- Redelivery is harmless: handling the same event twice leaves the same row.
