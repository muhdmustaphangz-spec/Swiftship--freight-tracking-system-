const AppError = require('../utils/AppError');

/**
 * Validates req[source] (default: body) against a Zod schema.
 * On success, replaces req[source] with the parsed/coerced data so downstream
 * handlers can trust types (e.g. numeric strings become numbers).
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(AppError.badRequest('Validation failed', details));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
