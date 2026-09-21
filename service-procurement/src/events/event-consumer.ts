import amqplib from "amqplib";
import type { Channel, ChannelModel } from "amqplib";
import { config } from "../core/config";
import { EXCHANGE, type EventEnvelope } from "./event-publisher";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

type Subscription = {
  // Durable queue owned by this service; it keeps events while the service is down
  queue: string;
  // Topic pattern, e.g. "inventory.stock-low"
  routingKey: string;
  handle: (envelope: EventEnvelope) => Promise<void>;
};

// Binds one durable queue per subscription. Messages are acked only once handled, so a
// crash mid-handling leaves the event on the queue for the next attempt.
const subscribe = async ({ queue, routingKey, handle }: Subscription) => {
  if (!connection) {
    connection = await amqplib.connect(config.rabbitmqUrl);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    // One unacked message at a time: a slow handler does not pull the whole queue
    await channel.prefetch(1);
  }

  const activeChannel = channel!;
  await activeChannel.assertQueue(queue, { durable: true });
  await activeChannel.bindQueue(queue, EXCHANGE, routingKey);

  await activeChannel.consume(queue, async (message) => {
    if (!message) {
      return;
    }

    try {
      const envelope = JSON.parse(message.content.toString()) as EventEnvelope;
      await handle(envelope);
      activeChannel.ack(message);
    } catch (err) {
      console.error(`Could not handle message on ${queue}:`, err);
      // Don't requeue: a message we cannot parse or handle would loop forever.
      // A dead-letter queue is the next step if these need inspecting.
      activeChannel.nack(message, false, false);
    }
  });

  console.log(`Subscribed ${queue} to ${routingKey}`);
};

const closeConsumers = async () => {
  await channel?.close().catch(() => undefined);
  await connection?.close().catch(() => undefined);
  channel = null;
  connection = null;
};

export { closeConsumers, subscribe, type Subscription };
