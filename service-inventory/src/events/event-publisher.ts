// Copied verbatim from service-procurement/src/events/. Keep the copies in step:
// a shared package is the proper fix once the schedule allows.
import amqplib from "amqplib";
import type { ChannelModel, ConfirmChannel } from "amqplib";
import { config } from "../core/config";
import { BrokerUnavailableError } from "./outbox-errors";

// One durable topic exchange for the whole system. Publishers never know who listens:
// subscribers bind their own queues to the patterns they care about.
const EXCHANGE = "commerce.events";

let connection: ChannelModel | null = null;
// A confirm channel: RabbitMQ acknowledges each message once it has taken responsibility
// for it, so we only mark an event published when it really is.
let channel: ConfirmChannel | null = null;

const reset = () => {
  connection = null;
  channel = null;
};

// Opened on first use and reused. A dropped connection is cleared so the next publish
// reconnects rather than failing forever.
const getChannel = async () => {
  if (channel) {
    return channel;
  }

  try {
    connection = await amqplib.connect(config.rabbitmqUrl);
    connection.on("error", reset);
    connection.on("close", reset);

    channel = await connection.createConfirmChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });

    return channel;
  } catch (err) {
    reset();
    const message = err instanceof Error ? err.message : String(err);
    throw new BrokerUnavailableError(`RabbitMQ is unreachable: ${message}`);
  }
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
    {
      persistent: true,
      contentType: "application/json",
      messageId: envelope.eventId,
    },
  );

  try {
    // Resolves once RabbitMQ has the message; rejects if it refused it
    await activeChannel.waitForConfirms();
  } catch (err) {
    // The connection dropped mid-publish: the broker's problem, not the event's
    if (!channel) {
      throw new BrokerUnavailableError(
        "Connection to RabbitMQ was lost while publishing",
      );
    }
    throw err;
  }
};

const close = async () => {
  await channel?.close().catch(() => undefined);
  await connection?.close().catch(() => undefined);
  reset();
};

export { EXCHANGE, close, publish, type EventEnvelope };
