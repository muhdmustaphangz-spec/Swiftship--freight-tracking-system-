require('./setup');
const { query, initDatabase } = require('../config/database');
const createApp = require('../app');

let initialized = false;
let appInstance = null;

/**
 * Test database strategy: Postgres is a real network service (Neon), so unlike the
 * old SQLite ":memory:" approach, we can't cheaply spin up a brand new isolated
 * database per test. Instead we use ONE shared test database (see .env.test /
 * TEST_DATABASE_URL) and truncate + reseed all tables before every test, via
 * resetDatabase(). This is the standard approach for integration tests against a
 * real relational database and keeps tests fully isolated from each other while
 * only paying the connection-setup cost once per test run.
 */
async function resetDatabase() {
  await query('TRUNCATE TABLE shipment_events, shipments, users RESTART IDENTITY CASCADE');
  // Re-run schema/seed logic. initDatabase() memoizes internally, so call the
  // underlying pieces directly to force a fresh seed every time.
  const database = require('../config/database');
  await database.seedForTests();
}

/**
 * Returns the (singleton) Express app, after ensuring the test DB schema exists
 * and truncating + reseeding all data. Call this at the start of every test.
 */
async function freshApp() {
  if (!initialized) {
    await initDatabase();
    appInstance = createApp();
    initialized = true;
  } else {
    await resetDatabase();
  }
  return { app: appInstance };
}

module.exports = { freshApp, resetDatabase };
