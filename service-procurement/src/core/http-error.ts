// Errors thrown from services/controllers. The error handler turns them into JSON responses.
class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

class BadRequestError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(400, message, details);
  }
}

class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(403, message);
  }
}

class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}

// A service we depend on (Vendor Management) is down, too slow, or erroring.
// The caller's request was fine, so this is not a 4xx.
class ServiceUnavailableError extends HttpError {
  constructor(message: string) {
    super(503, message);
  }
}

class InternalServerError extends HttpError {
  constructor(message: string) {
    super(500, message);
  }
}

export {
  HttpError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
  InternalServerError,
};
