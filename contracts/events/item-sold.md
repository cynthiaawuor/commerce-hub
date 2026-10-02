# ItemSold

Published by **Point of Sale** when a sale has been paid for and its stock has left the
store. Consumed by **Sales Audit** (the register's expected takings rise) and
**Financials** (revenue, VAT and the cost of the goods are booked).

- Exchange: `commerce.events` (topic, durable)
- Routing key: `pos.item-sold`
- Published once per completed sale, in the same transaction that records the sale.
  Consumers record the `eventId` they have handled, so the same sale is never counted
  twice.

## Envelope

```json
{
  "eventId": "d4a5...",
  "eventType": "ItemSold",
  "aggregateId": "SALE-000007",
  "occurredAt": "2026-10-02T11:41:45.512Z",
  "payload": { }
}
```

## Payload

| Field | Type | Meaning |
| --- | --- | --- |
| `saleId` | string | Point of Sale's id for the sale |
| `saleNumber` | string | What people quote, e.g. `SALE-000007` |
| `storeCode` | string | The store's location code in Inventory, e.g. `STORE-3` |
| `registerCode` | string | The till, e.g. `REG-2` |
| `cashierId` | string | Who rang it up |
| `soldAt` | string | When it was paid |
| `totalCents` | integer | What the customer paid, VAT included |
| `taxCents` | integer | The VAT inside `totalCents` |
| `products[].productId` | string | Inventory's id for the product |
| `products[].sku` | string | e.g. `RICE-1KG` |
| `products[].productName` | string | As it was on the price list |
| `products[].quantity` | integer | Units sold |
| `products[].unitPriceCents` | integer | The shelf price when scanned, VAT included |
| `products[].totalCents` | integer | `quantity` × `unitPriceCents` |
| `payments[].method` | string | `CASH` or `CARD` |
| `payments[].amountCents` | integer | What stayed with the business (see below) |

```json
{
  "saleId": "7b0e...",
  "saleNumber": "SALE-000007",
  "storeCode": "STORE-3",
  "registerCode": "REG-2",
  "cashierId": "cashier@commerce.test",
  "soldAt": "2026-10-02T11:41:45.512Z",
  "totalCents": 120000,
  "taxCents": 16552,
  "products": [
    {
      "productId": "fef9...",
      "sku": "TEA-500G",
      "productName": "Tea leaves 500g",
      "quantity": 3,
      "unitPriceCents": 40000,
      "totalCents": 120000
    }
  ],
  "payments": [{ "method": "CASH", "amountCents": 120000 }]
}
```

## Payments are net of change

A customer who hands over KES 1,500 for a KES 1,200 sale and gets KES 300 back appears as
one `CASH` payment of `120000`, not `150000`. At most one entry per method is sent, and the
amounts always add up to `totalCents`. A consumer that finds they do not should treat the
event as broken rather than guess.

## What is left out, on purpose

- **The cost of the goods.** Point of Sale does not know it. Financials asks Inventory for
  each product's average cost.
- **Cancelled and open sales.** Only a paid sale is announced.

## Inventory must not act on this event

Stock has **already left** by the time this is published: the till commits its
reservations in Inventory (a direct call) before the sale completes. An Inventory consumer
that also deducted stock here would count every sale twice.

## How consumers react

- **Sales Audit** adds the sale to its register's day, using the date of `soldAt` in UTC:
  `salesCount` rises, cash and card are added to what the register should hold. A sale
  that arrives after the day was closed is recorded but leaves the signed-off figures
  alone.
- **Financials** books Dr Cash / Card settlements due, Cr VAT payable (`taxCents`),
  Cr Sales revenue (`totalCents` − `taxCents`), then Dr Cost of goods sold, Cr Inventory
  once Inventory has said what the goods cost.
