import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { handleGoodsReceived } from "../../src/events/goods-received.consumer";
import { PermanentEventError } from "../../src/events/outbox-errors";
import { db } from "../../src/prisma/db";
import { WORKER, addShelves, goodsReceived, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/warehouse-api/putaway-tasks";

const pendingTasks = async () => (await api().get(base).expect(200)).body.data;

const shelves = async () =>
  (await api().get("/warehouse-api/shelf-locations").expect(200)).body.data;

const complete = (id: string, body: object = {}) =>
  api().post(`${base}/${id}/complete`).set(WORKER).send(body);

beforeEach(async () => {
  await resetDatabase();
  await addShelves();
});
afterAll(async () => {
  await resetDatabase();
  await db.close();
});

describe("GoodsReceived", () => {
  it("creates a putaway task with the nearest shelf that has room", async () => {
    await handleGoodsReceived(
      goodsReceived([{ productId: "PROD-1", productName: "Rice 1kg", quantityReceived: 6 }]),
    );

    const [task] = await pendingTasks();

    expect(task).toMatchObject({
      goodsReceivedNoteNumber: "GRN-000001",
      productName: "Rice 1kg",
      quantity: 6,
      suggestedShelfCode: "A-01",
      status: "PENDING",
    });
  });

  it("does not promise the same space twice", async () => {
    // A-01 holds 10: the first 6 fit, the next 6 must go to the back
    await handleGoodsReceived(
      goodsReceived([
        { productId: "PROD-1", quantityReceived: 6 },
        { productId: "PROD-2", quantityReceived: 6 },
      ]),
    );

    const tasks = await pendingTasks();
    const suggested = tasks.map((task: any) => task.suggestedShelfCode).sort();

    expect(suggested).toEqual(["A-01", "B-01"]);
  });

  it("leaves the shelf empty when nothing has room", async () => {
    await handleGoodsReceived(goodsReceived([{ productId: "PROD-1", quantityReceived: 500 }]));

    const [task] = await pendingTasks();

    expect(task.suggestedShelfCode).toBeNull();
  });

  it("creates the tasks once when the same event arrives twice", async () => {
    const event = goodsReceived([{ productId: "PROD-1", quantityReceived: 6 }]);

    await handleGoodsReceived(event);
    await handleGoodsReceived(event);

    expect(await pendingTasks()).toHaveLength(1);
  });

  it("rejects an event with no products for good", async () => {
    await expect(handleGoodsReceived(goodsReceived([]))).rejects.toBeInstanceOf(
      PermanentEventError,
    );
  });
});

describe("POST /putaway-tasks/:id/complete", () => {
  it("puts the goods on the suggested shelf", async () => {
    await handleGoodsReceived(
      goodsReceived([{ productId: "PROD-1", productName: "Rice 1kg", quantityReceived: 6 }]),
    );
    const [task] = await pendingTasks();

    const { body } = await complete(task.id).expect(200);

    expect(body.data).toMatchObject({
      status: "COMPLETED",
      shelfCode: "A-01",
      completedBy: "worker@test",
    });
    expect(await pendingTasks()).toHaveLength(0);

    const shelf = (await shelves()).find((s: any) => s.code === "A-01");
    expect(shelf).toMatchObject({ occupiedUnits: 6, freeUnits: 4 });
    expect(shelf.products).toEqual([
      expect.objectContaining({ productId: "PROD-1", productName: "Rice 1kg", quantity: 6 }),
    ]);
  });

  it("adds to what is already on the shelf", async () => {
    await handleGoodsReceived(goodsReceived([{ productId: "PROD-1", quantityReceived: 4 }], "GRN-000001"));
    await complete((await pendingTasks())[0].id).expect(200);

    await handleGoodsReceived(goodsReceived([{ productId: "PROD-1", quantityReceived: 5 }], "GRN-000002"));
    const [task] = await pendingTasks();
    expect(task.suggestedShelfCode).toBe("A-01");
    await complete(task.id).expect(200);

    const shelf = (await shelves()).find((s: any) => s.code === "A-01");
    expect(shelf.products).toHaveLength(1);
    expect(shelf.products[0].quantity).toBe(9);
  });

  it("lets the worker choose a different shelf", async () => {
    await handleGoodsReceived(goodsReceived([{ productId: "PROD-1", quantityReceived: 6 }]));
    const [task] = await pendingTasks();

    const { body } = await complete(task.id, { shelfCode: "b-01" }).expect(200);

    expect(body.data.shelfCode).toBe("B-01");
  });

  it("refuses a shelf without enough room", async () => {
    await handleGoodsReceived(goodsReceived([{ productId: "PROD-1", quantityReceived: 20 }]));
    const [task] = await pendingTasks();

    const { body } = await complete(task.id, { shelfCode: "A-01" }).expect(409);

    expect(body.error.message).toContain("room for 10 more");
  });

  it("asks for a shelf when none was suggested", async () => {
    await handleGoodsReceived(goodsReceived([{ productId: "PROD-1", quantityReceived: 500 }]));
    const [task] = await pendingTasks();

    const { body } = await complete(task.id).expect(400);

    expect(body.error.details).toHaveProperty("shelfCode");
  });

  it("refuses to put the same goods away twice", async () => {
    await handleGoodsReceived(goodsReceived([{ productId: "PROD-1", quantityReceived: 6 }]));
    const [task] = await pendingTasks();

    await complete(task.id).expect(200);
    await complete(task.id).expect(409);
  });

  it("returns 404 for an unknown shelf or task", async () => {
    await handleGoodsReceived(goodsReceived([{ productId: "PROD-1", quantityReceived: 6 }]));
    const [task] = await pendingTasks();

    await complete(task.id, { shelfCode: "Z-99" }).expect(404);
    await complete("does-not-exist").expect(404);
  });

  it("lists completed tasks on request", async () => {
    await handleGoodsReceived(goodsReceived([{ productId: "PROD-1", quantityReceived: 6 }]));
    await complete((await pendingTasks())[0].id).expect(200);

    const { body } = await api().get(`${base}?status=COMPLETED`).expect(200);

    expect(body.data).toHaveLength(1);
    await api().get(`${base}?status=LOST`).expect(400);
  });
});
