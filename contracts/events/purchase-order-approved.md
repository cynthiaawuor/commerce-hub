# PurchaseOrderApproved

Published by **Procurement** when a purchase order is approved: the moment the business
commits to buying. Consumed by **Receiving** (to expect the delivery) and **Inventory**
(to count the goods as on order).

- Exchange: `commerce.events` (topic, durable)
- Routing key: `procurement.purchase-order-approved`
- Published once per approval. Consumers record the `eventId` they have handled, so a
  redelivery changes nothing.

## Payload

| Field | Type | Meaning |
| --- | --- | --- |
| `purchaseOrderId` | string | Procurement's id for the order |
| `purchaseOrderNumber` | string | What people quote, e.g. `PO-000123` |
| `supplierId` | string | The supplier in Vendor Management |
| `supplierName` | string | Copied onto the order when it was created |
| `paymentTerms` | string | e.g. `NET_30`, locked onto the order |
| `currency` | string | `KES` |
| `totalCents` | integer | The order total in cents |
| `approvedBy` | string | Who approved it |
| `approvedAt` | string | When |
| `products[].productId` | string | The product, as Vendor's catalog quotes it (an id or SKU) |
| `products[].productName` | string | |
| `products[].quantityOrdered` | integer | |
| `products[].unitCostCents` | integer | Locked from the supplier's catalog |
| `products[].leadTimeDays` | integer | |

```json
{
  "purchaseOrderId": "5f2c...",
  "purchaseOrderNumber": "PO-000123",
  "supplierId": "75167a96-...",
  "supplierName": "Soko Yetu Supplies",
  "paymentTerms": "NET_30",
  "currency": "KES",
  "totalCents": 12505000,
  "approvedBy": "manager@commerce.test",
  "approvedAt": "2026-09-28T09:00:00.000Z",
  "products": [
    {
      "productId": "MAIZE-2KG",
      "productName": "Maize flour 2kg",
      "quantityOrdered": 100,
      "unitCostCents": 125050,
      "leadTimeDays": 7
    }
  ]
}
```
