/**
 * AppError represents an expected, handled error (bad input, not found, forbidden, etc).
 * Anything NOT thrown as an AppError is treated as an unexpected bug by the error handler
 * and logged with full detail, while the client only ever sees a generic message for those.
 */
class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details; // optional structured info, e.g. validation field errors
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new AppError(message, 400, details);
  }
  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401);
  }
  static forbidden(message = 'You do not have permission to do this') {
    return new AppError(message, 403);
  }
  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }
  static conflict(message) {
    return new AppError(message, 409);
  }
}

module.exports = AppError;
