import amqplib from "amqplib";
import type { Channel, ChannelModel } from "amqplib";
import { config } from "../core/config";

// One durable topic exchange for the whole system. Publishers never know who listens:
// subscribers bind their own queues to the patterns they care about.
const EXCHANGE = "commerce.events";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

// Opened on first use and reused. A dropped connection is cleared so the next publish
// reconnects rather than failing forever.
const getChannel = async () => {
  if (channel) {
    return channel;
  }

  connection = await amqplib.connect(config.rabbitmqUrl);

  connection.on("error", () => {
    connection = null;
    channel = null;
  });
  connection.on("close", () => {
    connection = null;
    channel = null;
  });

  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });

  return channel;
};

type EventEnvelope = {
  eventId: string;
  eventType: string;
  aggregateId: string;
  occurredAt: string;
  payload: unknown;
};

// persistent: true writes the message to disk, so it survives a broker restart
const publish = async (routingKey: string, envelope: EventEnvelope) => {
  const activeChannel = await getChannel();

  activeChannel.publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(envelope)),
    { persistent: true, contentType: "application/json", messageId: envelope.eventId },
  );
};

const close = async () => {
  await channel?.close().catch(() => undefined);
  await connection?.close().catch(() => undefined);
  channel = null;
  connection = null;
};

export { EXCHANGE, close, publish, type EventEnvelope };
