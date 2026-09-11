const AppError = require('../utils/AppError');
const config = require('../config/env');

/**
 * 404 handler for unmatched routes — must be registered after all routes.
 */
function notFoundHandler(req, res, next) {
  next(AppError.notFound(`No route: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralized error handler — must be registered LAST, after all routes and
 * other middleware. Express recognizes it as an error handler by its 4-arg signature.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Known, expected errors (validation, auth, not found, etc.)
  if (err instanceof AppError) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  // SQLite constraint violations (e.g. UNIQUE email) — translate to a clean 409/400
  if (err.code && String(err.code).startsWith('SQLITE_CONSTRAINT')) {
    return res.status(409).json({ error: 'This operation conflicts with existing data (e.g. a duplicate value).' });
  }

  // multer file-size / upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

  // Anything else is unexpected — log full detail server-side, but never leak
  // internals (stack traces, SQL, file paths) to the client.
  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err);

  const body = { error: 'Something went wrong on our end. Please try again.' };
  if (config.env !== 'production') {
    body.debug = { message: err.message, stack: err.stack };
  }
  res.status(500).json(body);
}

module.exports = { notFoundHandler, errorHandler };
