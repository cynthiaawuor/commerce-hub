import { DAY_CLOSED, type DayClosedPayload } from "../events/event-types";
import { newOutboxEvent } from "../events/outbox.repository";
import { claimEvent } from "../events/processed-events.repository";
import { db } from "../prisma/db";

const RegisterDay = db.orm.public.RegisterDay;

const RECENT_LIMIT = 50;

type SoldSale = {
  saleNumber: string;
  storeCode: string;
  registerCode: string;
  businessDate: string;
  cashierId: string;
  totalCents: number;
  cashCents: number;
  cardCents: number;
  soldAt: string;
};

// Oldest first: yesterday's unclosed register is the one to deal with first
const findOpen = async () =>
  RegisterDay.where({ status: "OPEN" })
    .orderBy([(day) => day.businessDate.asc(), (day) => day.registerCode.asc()])
    .all();

// The discrepancy log, newest first
const findRecentlyClosed = async () =>
  RegisterDay.where({ status: "CLOSED" })
    .orderBy((day) => day.closedAt.desc())
    .limit(RECENT_LIMIT)
    .all();

const findById = async (id: string) =>
  RegisterDay.where({ id })
    .include("sales", (sale) => sale.orderBy((s) => s.soldAt.asc()))
    .first();

// A paid sale is added to its register's day. Claiming the event, recording the sale
// and raising the day's figures happen together, so a redelivered ItemSold is counted
// once. Returns null for a repeat.
const recordSale = async (eventId: string, eventType: string, sale: SoldSale) =>
  db.transaction(async (tx) => {
    if (!(await claimEvent(tx, eventId, eventType))) {
      return null;
    }

    let day = await tx.orm.public.RegisterDay.where({
      registerCode: sale.registerCode,
      businessDate: sale.businessDate,
    }).first();

    // Events are handled one at a time (prefetch 1), so two cannot race to create the day
    if (!day) {
      day = await tx.orm.public.RegisterDay.create({
        storeCode: sale.storeCode,
        registerCode: sale.registerCode,
        businessDate: sale.businessDate,
      });
    }

    await tx.orm.public.RecordedSale.create({
      registerDayId: day.id,
      saleNumber: sale.saleNumber,
      cashierId: sale.cashierId,
      totalCents: sale.totalCents,
      cashCents: sale.cashCents,
      cardCents: sale.cardCents,
      soldAt: sale.soldAt,
    });

    // A closed day keeps its signed-off figures; the late sale is counted so a manager
    // sees the close needs a second look
    return tx.orm.public.RegisterDay.where({ id: day.id }).update(
      day.status === "CLOSED"
        ? { salesAfterClose: day.salesAfterClose + 1 }
        : {
            salesCount: day.salesCount + 1,
            expectedCashCents: day.expectedCashCents + sale.cashCents,
            expectedCardCents: day.expectedCardCents + sale.cardCents,
          },
    );
  });

type Closing = {
  countedCashCents: number;
  countedCardCents: number;
  cashDifferenceCents: number;
  cardDifferenceCents: number;
  explanation: string | null;
  closedBy: string;
  closedAt: string;
  checkedWithPos: boolean;
};

// The close and the DayClosed event are written together. Returns null when the day
// was no longer open (another manager closed it first).
const close = async (id: string, closing: Closing, event: DayClosedPayload) =>
  db.transaction(async (tx) => {
    const closed = await tx.orm.public.RegisterDay.where({ id, status: "OPEN" }).update({
      status: "CLOSED",
      ...closing,
    });

    if (!closed) {
      return null;
    }

    await tx.orm.public.OutboxEvent.create(
      newOutboxEvent(DAY_CLOSED, `${event.registerCode}/${event.businessDate}`, event),
    );

    return closed;
  });

export { close, findById, findOpen, findRecentlyClosed, recordSale, type SoldSale };
