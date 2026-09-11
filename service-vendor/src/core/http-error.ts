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

export { HttpError, BadRequestError, NotFoundError, ConflictError };
