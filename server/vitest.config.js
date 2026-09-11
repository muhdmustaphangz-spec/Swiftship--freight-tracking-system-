const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 10000,
    // Run test files serially within a single process; each file gets its own
    // isolated in-memory SQLite DB (see tests/setup.js), so no cross-file DB
    // contention, but we avoid parallel worker overhead for this small suite.
    fileParallelism: false,
  },
});
