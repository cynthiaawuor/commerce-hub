class PermanentEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentEventError";
  }
}

class BrokerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrokerUnavailableError";
  }
}

export { PermanentEventError, BrokerUnavailableError };
