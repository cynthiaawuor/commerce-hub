# DayClosed

Published by **Sales Audit** when a manager has counted a register, explained any
difference and signed the day off. Consumed by **Financials** (a shortage or surplus is
booked to Cash over / short).

- Exchange: `commerce.events` (topic, durable)
- Routing key: `sales-audit.day-closed`
- Published once per register per day, in the same transaction that closes the day.
  Consumers record the `eventId` they have handled, so a close is never booked twice.

## Envelope

```json
{
  "eventId": "2db3...",
  "eventType": "DayClosed",
  "aggregateId": "REG-2/2026-09-30",
  "occurredAt": "2026-09-30T18:02:11.094Z",
  "payload": { }
}
```

## Payload

| Field | Type | Meaning |
| --- | --- | --- |
| `registerDayId` | string | Sales Audit's id for the register's day |
| `storeCode` | string | e.g. `STORE-3` |
| `registerCode` | string | e.g. `REG-2` |
| `businessDate` | string | The day the sales happened, e.g. `2026-09-30` (UTC) |
| `salesCount` | integer | Sales counted towards the day |
| `expectedCashCents` | integer | Cash the register should hold, net of change given |
| `expectedCardCents` | integer | Card takings Point of Sale recorded |
| `countedCashCents` | integer | Cash the manager counted |
| `countedCardCents` | integer | Total of the card slips |
| `cashDifferenceCents` | integer | Counted minus expected, for cash |
| `cardDifferenceCents` | integer | Counted minus expected, for card slips |
| `differenceCents` | integer | The two differences added together |
| `explanation` | string or null | The manager's reason; always present when anything differs |
| `closedBy` | string | The manager who signed off |
| `closedAt` | string | When the day was closed |

```json
{
  "registerDayId": "9a41...",
  "storeCode": "STORE-3",
  "registerCode": "REG-2",
  "businessDate": "2026-09-30",
  "salesCount": 150,
  "expectedCashCents": 500000,
  "expectedCardCents": 0,
  "countedCashCents": 495000,
  "countedCardCents": 0,
  "cashDifferenceCents": -5000,
  "cardDifferenceCents": 0,
  "differenceCents": -5000,
  "explanation": "Customer paid with a fake KES 50 note",
  "closedBy": "manager@commerce.test",
  "closedAt": "2026-09-30T18:02:11.094Z"
}
```

## Reading the differences

Differences are **counted minus expected**: negative is short, positive is over.

Cash and card slips are reported separately because they can cancel out. A register KES 100
over on cash and KES 100 short on card slips has a `differenceCents` of `0`, yet money is
in the wrong place and both figures matter. Consumers should use the two separate
differences, not the total.

## What is left out, on purpose

- **The individual sales.** They were announced one by one as `ItemSold`.
- **Days that are still open.** Only a signed-off day is announced.
- **Sales that arrive after the close.** Sales Audit records them against the day but does
  not publish again; the signed-off figures stand.

## How Financials reacts

- A shortage is booked Dr Cash over / short, Cr Cash in registers (or Card settlements
  due); a surplus is booked the other way round.
- A register that balanced books nothing.
- The entry is dated `closedAt` and its reference is the register and date, e.g.
  `REG-2/2026-09-30`.
