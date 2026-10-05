# Commerce Hub — Merchandise Management System

A retail business buys goods from suppliers, stores them in a warehouse, and sells them in
shops. Today that runs on spreadsheets, paper receipts and re-typing: stock counts are
stale, payments are late, and nobody can see what the business is actually making.

This repository replaces that with a **suite of independent services**, each owning one
part of the business, each with its own database, talking over HTTP and a message bus.
No service reads another's tables.

## Architecture

```
                 ┌──────────────────┐        REST         ┌────────────────────┐
  Vendor Portal ─▶│ Vendor Management│◀────────────────────│    Procurement     │◀─ Procurement
   (React)        │   :3000          │  "who supplies X?"  │      :3001         │    Dashboard
                 └──────────────────┘                      └─────────┬──────────┘
                          │                                          │
                   vendor-db :5434                          procurement-db :5435
                                                                     │
                                                    publishes        │        consumes
                                            PurchaseOrderApproved    │        StockLow
                                                                     ▼
                                              ┌──────────────────────────────────┐
                                              │  RabbitMQ  "commerce.events"     │
                                              │  topic exchange, durable queues  │
                                              └──────────────────────────────────┘
                                                 ▲                        │
                                                 │                        ▼
                                         StockLow│            ┌────────────────────┐
                                                 └────────────│     Inventory      │
                                                              │      :3002         │
                                                              └─────────┬──────────┘
                                                                        │
                                                                inventory-db :5436

                                     Receiving :3003 (receiving-db :5437) · (future) Warehouse, POS, Audit, Financials
```

**Synchronous (REST)** when the caller needs an answer to continue: Procurement asks Vendor
Management for a supplier's terms and catalog price before it can create an order.

**Asynchronous (events)** when something has happened and others may care: an approved
purchase order is announced once; Receiving, Inventory and Financials react in their own
time. A subscriber that is down misses nothing, because its queue holds the messages.

## Modules

| Module                   | Path                                                    | Purpose                                                    | Phase | Status      |
| ------------------------ | ------------------------------------------------------- | ---------------------------------------------------------- | ----- | ----------- |
| Vendor Management        | [`service-vendor/`](service-vendor)                     | Approved suppliers, their terms and catalogs               | 1     | Built       |
| Vendor Portal            | [`vendor-portal/`](vendor-portal)                       | Back-office UI for suppliers and catalogs                  | 1     | Built       |
| Procurement              | [`service-procurement/`](service-procurement)           | Purchase orders, approvals, receipts                       | 1     | Built       |
| Procurement Dashboard    | [`procurement-dashboard/`](procurement-dashboard)       | Buyer UI for orders and approvals                          | 1     | Built       |
| Inventory                | [`service-inventory/`](service-inventory)               | Product master, stock levels, reservations, valuation      | 1     | Built       |
| Inventory Control Center | [`inventory-control-center/`](inventory-control-center) | Stock, products, locations and valuation UI                | 1     | Built       |
| Receiving                | [`service-receiving/`](service-receiving)               | Expected deliveries, goods received notes, `GoodsReceived` | 2     | Built (MVP) |
| Receiving App            | [`receiving-app/`](receiving-app)                       | Dock clerk UI: count a delivery against its order          | 2     | Built (MVP) |
| Warehouse Operations     | —                                                       | Putaway, picking, transfers                                | 2     | Not started |
| Retail Sales (POS)       | —                                                       | Sales and returns                                          | 3     | Not started |
| Sales Audit              | —                                                       | Cash reconciliation                                        | 3     | Not started |
| Financials               | —                                                       | Ledger, payables, profitability                            | 4     | Not started |

## Running it locally

Requires Docker, Node 22 and [Task](https://taskfile.dev).

```bash
task infra:up     # Postgres per service + RabbitMQ, waits until each is ready
task dev          # all services and frontends in watch mode
```

| Service                  | URL                                    |
| ------------------------ | -------------------------------------- |
| Vendor API               | http://localhost:3000/vendor-api       |
| Procurement API          | http://localhost:3001/procurement-api  |
| Inventory API            | http://localhost:3002/inventory-api    |
| Receiving API            | http://localhost:3003/receiving-api    |
| Vendor Portal            | http://localhost:5173                  |
| Procurement Dashboard    | http://localhost:5174                  |
| Inventory Control Center | http://localhost:5175                  |
| Receiving App            | http://localhost:5176                  |
| RabbitMQ management      | http://localhost:15672 (guest / guest) |

First time in each service directory: `cp .env.example .env`, then `npm install` and
`npm run db:migrate`.

Other tasks: `task infra:down`, `task infra:logs`, `task --list`.

## Feature flags

Modules are built in phases, and an unfinished one must not show up in a running system.
Each service reads its own flag; the frontends read theirs at build time.

| Flag                             | Where                           | Effect when off                                                          |
| -------------------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| `FEATURE_PROCUREMENT`            | `service-procurement/.env`      | Routes are not mounted and events are not consumed; health still answers |
| `FEATURE_INVENTORY`              | `service-inventory/.env`        | The same, for inventory                                                  |
| `FEATURE_RECEIVING`              | `service-receiving/.env`        | The same, for receiving                                                  |
| `VITE_FEATURE_VENDOR_MANAGEMENT` | `vendor-portal/.env`            | The portal shows "Coming soon" and hides its menu                        |
| `VITE_FEATURE_PROCUREMENT`       | `procurement-dashboard/.env`    | The same, for the buyer dashboard                                        |
| `VITE_FEATURE_INVENTORY`         | `inventory-control-center/.env` | The same, for the control center                                         |
| `VITE_FEATURE_RECEIVING`         | `receiving-app/.env`            | The app shows "Coming soon"                                              |

Set a flag to `false` to hide a module without removing it.

## API documentation

OpenAPI specifications live in [`contracts/openapi/`](contracts/openapi) and event contracts
in [`contracts/events/`](contracts/events), so a service's contract is readable without
reading its code.

Each running service serves its own spec as a browsable page:

| Service | Spec | Live page |
| --- | --- | --- |
| Vendor Management | [`vendor.yaml`](contracts/openapi/vendor.yaml) | http://localhost:3000/vendor-api/docs |
| Procurement | [`procurement.yaml`](contracts/openapi/procurement.yaml) | http://localhost:3001/procurement-api/docs |
| Inventory | [`inventory.yaml`](contracts/openapi/inventory.yaml) | http://localhost:3002/inventory-api/docs |
| Receiving | [`receiving.yaml`](contracts/openapi/receiving.yaml) | http://localhost:3003/receiving-api/docs |
| Warehouse Operations | [`warehouse.yaml`](contracts/openapi/warehouse.yaml) | http://localhost:3004/warehouse-api/docs |
| Point of Sale | [`pos.yaml`](contracts/openapi/pos.yaml) | http://localhost:3005/pos-api/docs |
| Sales Audit | [`sales-audit.yaml`](contracts/openapi/sales-audit.yaml) | http://localhost:3006/sales-audit-api/docs |
| Financials | [`financials.yaml`](contracts/openapi/financials.yaml) | http://localhost:3007/financials-api/docs |

Events, with who publishes and who listens:

| Event | Published by | Consumed by |
| --- | --- | --- |
| [`PurchaseOrderApproved`](contracts/events/purchase-order-approved.md) | Procurement | Receiving, Inventory, Financials |
| [`GoodsReceived`](contracts/events/goods-received.md) | Receiving | Procurement, Inventory, Warehouse Operations, Financials |
| [`StockLow`](contracts/events/stock-low.md) | Inventory | Procurement |
| [`ItemSold`](contracts/events/item-sold.md) | Point of Sale | Sales Audit, Financials |
| [`DayClosed`](contracts/events/day-closed.md) | Sales Audit | Financials |

CI parses every spec and checks its `$ref`s resolve, so a malformed contract fails the
build rather than surprising someone in a browser.

## Testing

```bash
cd service-procurement     # or service-inventory
npm run test:unit          # pure rules: state machines, limits, valuation maths
npm run test:integration   # real HTTP + real database
npm test                   # both
```

Receiving works the same way (`cd service-receiving`): unit tests cover the discrepancy
rules, integration tests the events and goods received notes.

Integration tests create and migrate their own database (`service-procurement-test`,
`service-inventory-test`, `service-receiving-test`), so they never touch development
data. The same commands run in CI on every pull request; see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## How the services talk today

```
Inventory  stock crosses its reorder point ──StockLow──▶ Procurement raises a suggestion
Procurement  order approved ──PurchaseOrderApproved──▶ Inventory raises quantity on order
Receiving  delivery accepted ──GoodsReceived──▶ Inventory takes stock in and updates average cost
Procurement ──REST──▶ Vendor  "who supplies this product, at what price and terms?"
```

Events carry an `eventId`, and consumers record the ones they have handled, so a
redelivered message never counts stock twice. Anything a service cannot handle is
dead-lettered to `<queue>.dead` rather than dropped.

## Conventions

- **Money is integer cents.** KES 1,250.50 is `125050`. Floats are never used for money.
- **Layering:** router → controller → service → repository. Routers map paths, controllers
  translate HTTP, services hold the rules, repositories own the queries.
- **Cross-service ids are soft references.** `supplierId` in Procurement has no foreign key,
  because that table lives in another database. Events may quote a code or SKU instead of
  an id, and the receiving service resolves either.
- **Stock quantities are kept apart**: on hand, allocated and on order are stored;
  available is always calculated.
- **Prices and terms are frozen** onto a purchase order when it is created, so an order
  always reflects what was agreed on the day.

## Known limitations

- **Receiving:** two clerks recording notes for the same delivery at the same moment could
  undercount what was received, because each reads the running total before adding to it.
  With one clerk per delivery this does not happen; a row lock would fix it.
