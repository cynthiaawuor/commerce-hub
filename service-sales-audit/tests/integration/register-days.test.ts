import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// What Point of Sale answers when asked for a register's day; null means it is down
const posSummary = vi.hoisted(() => ({ current: null as null | { salesCount: number } }));

vi.mock("../../src/pos/pos.client", () => ({
  getRegisterSummary: vi.fn(async () => posSummary.current),
}));

import { createApp } from "../../src/app";
import { handleItemSold } from "../../src/events/item-sold.consumer";
import { PermanentEventError } from "../../src/events/outbox-errors";
import { db } from "../../src/prisma/db";
import { CASHIER, MANAGER, itemSold, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/sales-audit-api/register-days";

const openDays = async () => (await api().get(base).expect(200)).body.data;

const close = (id: string, body: object) =>
  api().post(`${base}/${id}/close`).set(MANAGER).send(body);

// Register 2 took KES 500 cash (after change) and KES 150 on card
const aDayOfSales = async () => {
  await handleItemSold(itemSold([{ method: "CASH", amountCents: 20000 }]));
  await handleItemSold(itemSold([{ method: "CASH", amountCents: 30000 }]));
  await handleItemSold(itemSold([{ method: "CARD", amountCents: 15000 }]));

  return (await openDays())[0];
};

beforeEach(async () => {
  posSummary.current = null;
  await resetDatabase();
});
afterAll(async () => {
  await resetDatabase();
  await db.close();
});

describe("ItemSold", () => {
  it("builds each register's expected takings for the day", async () => {
    const day = await aDayOfSales();

    expect(day).toMatchObject({
      registerCode: "REG-2",
      businessDate: "2026-09-30",
      status: "OPEN",
      salesCount: 3,
      expectedCashCents: 50000,
      expectedCardCents: 15000,
      expectedTotalCents: 65000,
    });
  });

  it("keeps registers and days apart", async () => {
    await handleItemSold(itemSold([{ method: "CASH", amountCents: 100 }], { registerCode: "REG-1" }));
    await handleItemSold(itemSold([{ method: "CASH", amountCents: 100 }], { registerCode: "REG-2" }));
    await handleItemSold(
      itemSold([{ method: "CASH", amountCents: 100 }], { soldAt: "2026-10-01T09:00:00.000Z" }),
    );

    const days = await openDays();

    expect(days.map((d: any) => `${d.registerCode} ${d.businessDate}`)).toEqual([
      "REG-1 2026-09-30",
      "REG-2 2026-09-30",
      "REG-2 2026-10-01",
    ]);
  });

  it("counts a redelivered sale once", async () => {
    const event = itemSold([{ method: "CASH", amountCents: 20000 }]);

    await handleItemSold(event);
    await handleItemSold(event);

    expect((await openDays())[0].salesCount).toBe(1);
  });

  it("rejects a sale with no register for good", async () => {
    const event = itemSold([{ method: "CASH", amountCents: 100 }]);
    event.payload = { ...(event.payload as object), registerCode: "" };

    await expect(handleItemSold(event)).rejects.toBeInstanceOf(PermanentEventError);
  });

  it("keeps a closed day's figures and flags a late sale", async () => {
    const day = await aDayOfSales();
    await close(day.id, { countedCashCents: 50000, countedCardCents: 15000 }).expect(200);

    await handleItemSold(itemSold([{ method: "CASH", amountCents: 999 }]));

    const { body } = await api().get(`${base}/${day.id}`).expect(200);
    expect(body.data).toMatchObject({ salesCount: 3, expectedCashCents: 50000, salesAfterClose: 1 });
  });
});

describe("POST /register-days/:id/close", () => {
  it("closes a day that balances and announces DayClosed", async () => {
    const day = await aDayOfSales();
    posSummary.current = { salesCount: 3 };

    const { body } = await close(day.id, { countedCashCents: 50000, countedCardCents: 15000 }).expect(200);

    expect(body.data).toMatchObject({
      status: "CLOSED",
      differenceCents: 0,
      closedBy: "manager@test",
      checkedWithPos: true,
    });

    const [event] = await db.orm.public.OutboxEvent.all();
    expect(event!.eventType).toBe("DayClosed");
    expect(JSON.parse(event!.payload)).toMatchObject({
      registerCode: "REG-2",
      businessDate: "2026-09-30",
      differenceCents: 0,
    });
  });

  it("will not close a shortage until it is explained", async () => {
    const day = await aDayOfSales();

    const refused = await close(day.id, { countedCashCents: 45000, countedCardCents: 15000 }).expect(400);
    expect(refused.body.error.message).toContain("cash KES 50.00 short");
    expect(await db.orm.public.OutboxEvent.all()).toHaveLength(0);

    const { body } = await close(day.id, {
      countedCashCents: 45000,
      countedCardCents: 15000,
      explanation: "Customer paid with a fake KES 50 note",
    }).expect(200);

    expect(body.data).toMatchObject({
      cashDifferenceCents: -5000,
      differenceCents: -5000,
      explanation: "Customer paid with a fake KES 50 note",
    });
  });

  it("waits while sales are still on their way from Point of Sale", async () => {
    const day = await aDayOfSales();
    posSummary.current = { salesCount: 4 };

    const { body } = await close(day.id, { countedCashCents: 50000, countedCardCents: 15000 }).expect(409);

    expect(body.error.message).toContain("only 3 have arrived here");
  });

  it("still closes when Point of Sale is down, and says it was not checked", async () => {
    const day = await aDayOfSales();

    const { body } = await close(day.id, { countedCashCents: 50000, countedCardCents: 15000 }).expect(200);

    expect(body.data.checkedWithPos).toBe(false);
  });

  it("only lets a manager close", async () => {
    const day = await aDayOfSales();

    await api()
      .post(`${base}/${day.id}/close`)
      .set(CASHIER)
      .send({ countedCashCents: 50000, countedCardCents: 15000 })
      .expect(403);
  });

  it("refuses to close a day twice", async () => {
    const day = await aDayOfSales();
    await close(day.id, { countedCashCents: 50000, countedCardCents: 15000 }).expect(200);

    await close(day.id, { countedCashCents: 50000, countedCardCents: 15000 }).expect(409);
  });

  it("lists closed days as the discrepancy log", async () => {
    const day = await aDayOfSales();
    await close(day.id, {
      countedCashCents: 49000,
      countedCardCents: 15000,
      explanation: "Float was short when the shift started",
    }).expect(200);

    const { body } = await api().get(`${base}?status=CLOSED`).expect(200);

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ differenceCents: -1000 });
    expect(await openDays()).toHaveLength(0);
  });

  it("refuses a count that is not whole cents", async () => {
    const day = await aDayOfSales();

    const { body } = await close(day.id, { countedCashCents: 500.5, countedCardCents: 15000 }).expect(400);

    expect(body.error.details).toHaveProperty("countedCashCents");
  });
});
