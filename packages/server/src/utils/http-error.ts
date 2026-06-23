/** Base class for errors that map to a specific HTTP status. */
export class AppError extends Error {
  readonly statusCode: number;
  readonly expose: boolean;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    options: { expose?: boolean; details?: unknown } = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.expose = options.expose ?? statusCode < 500;
    this.details = options.details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(message, 400, { expose: true, details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404, { expose: true });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, { expose: true });
  }
}
