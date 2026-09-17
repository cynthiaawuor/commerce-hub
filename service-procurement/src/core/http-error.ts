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
  InternalServerError,
};
