import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { db } from "../../src/prisma/db";
import { SUPERVISOR, WORKER, addShelves, resetDatabase } from "./helpers";

const app = createApp();
const api = () => request(app);
const base = "/warehouse-api/shelf-locations";

const newShelf = { code: " c-01 ", zone: "c", distanceFromDock: 50, capacityUnits: 300 };

beforeEach(resetDatabase);
afterAll(async () => {
  await resetDatabase();
  await db.close();
});

describe("GET /shelf-locations", () => {
  it("lists shelves nearest the dock first, with the room left", async () => {
    await addShelves();

    const { body } = await api().get(base).expect(200);

    expect(body.data.map((shelf: any) => shelf.code)).toEqual(["A-01", "B-01"]);
    expect(body.data[0]).toMatchObject({ capacityUnits: 10, occupiedUnits: 0, freeUnits: 10 });
  });
});

describe("POST /shelf-locations", () => {
  it("lets a supervisor add a shelf", async () => {
    const { body } = await api().post(base).set(SUPERVISOR).send(newShelf).expect(201);

    expect(body.data).toMatchObject({ code: "C-01", zone: "C", freeUnits: 300 });
  });

  it("refuses a worker", async () => {
    await api().post(base).set(WORKER).send(newShelf).expect(403);
  });

  it("refuses a code that is already used", async () => {
    await api().post(base).set(SUPERVISOR).send(newShelf).expect(201);
    await api().post(base).set(SUPERVISOR).send(newShelf).expect(409);
  });

  it("refuses a shelf with no capacity", async () => {
    const { body } = await api()
      .post(base)
      .set(SUPERVISOR)
      .send({ ...newShelf, capacityUnits: 0 })
      .expect(400);

    expect(body.error.details).toHaveProperty("capacityUnits");
  });
});
