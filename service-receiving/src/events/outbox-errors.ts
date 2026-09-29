// The event itself is broken (bad JSON, missing fields). It will fail identically on every
// retry, so it is set aside at once instead of being retried.
class PermanentEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentEventError";
  }
}

//when RabbitMQ cannot be reached
class BrokerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrokerUnavailableError";
  }
}

export { PermanentEventError, BrokerUnavailableError };
