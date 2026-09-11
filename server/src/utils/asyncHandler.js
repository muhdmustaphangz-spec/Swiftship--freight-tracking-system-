/**
 * Wraps an async Express handler so rejected promises are forwarded to next(),
 * instead of crashing the process or needing try/catch in every controller.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
