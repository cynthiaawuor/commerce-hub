import amqplib from "amqplib";
import type { Channel, ChannelModel } from "amqplib";
import { config } from "../core/config";
import { EXCHANGE, type EventEnvelope } from "./event-publisher";
import { PermanentEventError } from "./outbox-errors";

// Messages a service gives up on are kept, never dropped: each subscription gets a
// "<queue>.dead" queue fed by this exchange, for someone to inspect and replay.
const DEAD_LETTER_EXCHANGE = "commerce.events.dead";
const RETRY_HEADER = "x-retry-count";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

type Subscription = {
  queue: string;
  routingKey: string;
  handle: (envelope: EventEnvelope) => Promise<void>;
};

const subscribe = async ({ queue, routingKey, handle }: Subscription) => {
  if (!connection) {
    connection = await amqplib.connect(config.rabbitmqUrl);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    await channel.assertExchange(DEAD_LETTER_EXCHANGE, "direct", {
      durable: true,
    });
    // One unacked message at a time: a slow handler does not pull the whole queue
    await channel.prefetch(1);
  }

  const activeChannel = channel!;
  const deadQueue = `${queue}.dead`;
  const retryQueue = `${queue}.retry`;

  // Where messages go once we give up on them
  await activeChannel.assertQueue(deadQueue, { durable: true });
  await activeChannel.bindQueue(deadQueue, DEAD_LETTER_EXCHANGE, queue);

  // A waiting room: messages sit here for the retry delay, then expire back into the
  // main queue (the default exchange routes by queue name)
  await activeChannel.assertQueue(retryQueue, {
    durable: true,
    arguments: {
      "x-message-ttl": config.consumerRetryDelayMs,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": queue,
    },
  });

  // Anything the main queue rejects goes to the dead-letter exchange instead of vanishing
  await activeChannel.assertQueue(queue, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": DEAD_LETTER_EXCHANGE,
      "x-dead-letter-routing-key": queue,
    },
  });
  await activeChannel.bindQueue(queue, EXCHANGE, routingKey);

  await activeChannel.consume(queue, async (message) => {
    if (!message) {
      return;
    }

    const retries = Number(message.properties.headers?.[RETRY_HEADER] ?? 0);

    try {
      let envelope: EventEnvelope;

      try {
        envelope = JSON.parse(message.content.toString()) as EventEnvelope;
      } catch {
        throw new PermanentEventError("Message is not valid JSON");
      }

      await handle(envelope);
      activeChannel.ack(message);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);

      // Broken messages, and ones that keep failing, go to <queue>.dead
      if (
        err instanceof PermanentEventError ||
        retries >= config.consumerMaxRetries
      ) {
        console.error(
          `Dead-lettering message on ${queue} after ${retries} retries: ${reason}`,
        );
        activeChannel.nack(message, false, false);
        return;
      }

      // Probably transient (the database blipped): park it, then try again
      activeChannel.sendToQueue(retryQueue, message.content, {
        persistent: true,
        contentType: "application/json",
        ...(message.properties.messageId
          ? { messageId: message.properties.messageId }
          : {}),
        headers: {
          ...(message.properties.headers ?? {}),
          [RETRY_HEADER]: retries + 1,
        },
      });
      activeChannel.ack(message);

      console.warn(
        `Retrying message on ${queue} (${retries + 1}/${config.consumerMaxRetries}): ${reason}`,
      );
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
