import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// The broker is faked: these tests are about what the worker does with the answer
vi.mock("../../src/events/event-publisher", () => ({
  EXCHANGE: "commerce.events",
  publish: vi.fn(),
  close: vi.fn(),
}));

import * as eventPublisher from "../../src/events/event-publisher";
import { BrokerUnavailableError } from "../../src/events/outbox-errors";
import { publishPendingEvents } from "../../src/events/outbox-worker";
import { db } from "../../src/prisma/db";
import { resetDatabase } from "./helpers";

const publish = vi.mocked(eventPublisher.publish);
const Outbox = db.orm.public.OutboxEvent;

const insertEvent = (payload: string) =>
  Outbox.create({
    eventType: "PurchaseOrderApproved",
    aggregateId: "po-1",
    payload,
  });

const reload = async (id: string) => (await Outbox.where({ id }).first())!;

beforeEach(async () => {
  await resetDatabase();
  publish.mockReset();
  publish.mockResolvedValue(undefined);
});

afterAll(async () => {
  await db.close();
});

describe("outbox worker", () => {
  it("dead-letters a malformed event without blocking the ones behind it", async () => {
    const broken = await insertEvent("{not json");
    const healthy = await insertEvent(
      JSON.stringify({ poNumber: "PO-000001" }),
    );

    await publishPendingEvents();

    expect((await reload(broken.id)).status).toBe("DEAD");
    expect((await reload(healthy.id)).status).toBe("PUBLISHED");
  });

  it("backs off after a failure instead of retrying on the next tick", async () => {
    publish.mockRejectedValueOnce(new Error("broker refused the message"));
    const event = await insertEvent("{}");

    await publishPendingEvents();
    expect(await reload(event.id)).toMatchObject({
      status: "PENDING",
      attempts: 1,
    });

    // Its retry time is in the future, so the next pass leaves it alone
    await publishPendingEvents();
    expect(publish).toHaveBeenCalledTimes(1);
  });

  it("gives up after the maximum number of attempts", async () => {
    publish.mockRejectedValue(new Error("broker refused the message"));
    const event = await insertEvent("{}");
    // One short of the default limit of 5, and due now
    await Outbox.where({ id: event.id }).update({ attempts: 4 });

    await publishPendingEvents();

    expect(await reload(event.id)).toMatchObject({
      status: "DEAD",
      attempts: 5,
    });
  });

  it("does not count a broker outage against the event", async () => {
    publish.mockRejectedValue(
      new BrokerUnavailableError("RabbitMQ is unreachable"),
    );
    const event = await insertEvent("{}");

    await publishPendingEvents();

    expect(await reload(event.id)).toMatchObject({
      status: "PENDING",
      attempts: 0,
    });
  });
});
