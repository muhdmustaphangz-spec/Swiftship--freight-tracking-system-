// Postgres connection (via Neon or any standard Postgres instance).
//
// This project deliberately uses the same database engine (Postgres) in both
// development and production rather than SQLite-locally/Postgres-in-prod: running
// two different DB code paths is a common source of "works on my machine, breaks
// in deployment" bugs, and the `pg` driver is pure JavaScript (no native addon,
// no compiler needed), so there's no local setup cost to using it everywhere —
// point DATABASE_URL at a free Neon project for local dev too (see README).
const { Pool, types } = require('pg');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

// By default, `pg` returns NUMERIC/DECIMAL columns as strings (not JS numbers),
// to avoid silently losing precision on values too large/precise for a JS float.
// This app only stores currency with 2 decimal places well within float-safe
// range, so we opt back into plain numbers globally — otherwise every endpoint
// returning `cost` would hand the frontend a string ("43.75") instead of a
// number, breaking anything that calls .toFixed()/arithmetic on it.
// OID 1700 = numeric. See: https://github.com/brianc/node-postgres/issues/811
types.setTypeParser(1700, (val) => parseFloat(val));

if (!config.databaseUrl) {
  // eslint-disable-next-line no-console
  console.error(
    'FATAL: DATABASE_URL is not set. Create a free Postgres database (e.g. at neon.tech) ' +
    'and set DATABASE_URL in your .env file. See README.md for setup instructions.'
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  max: config.env === 'test' ? 5 : 10,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] Unexpected error on idle Postgres client', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

// ---------- SCHEMA ----------
async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer','admin','driver')),
      phone TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS shipments (
      id SERIAL PRIMARY KEY,
      tracking_id TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      driver_id INTEGER REFERENCES users(id),
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      origin_lat REAL,
      origin_lng REAL,
      destination_lat REAL,
      destination_lng REAL,
      distance_km REAL NOT NULL,
      weight_kg REAL NOT NULL,
      length_cm REAL,
      width_cm REAL,
      height_cm REAL,
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      recipient_address TEXT NOT NULL,
      service_type TEXT NOT NULL DEFAULT 'standard',
      cost NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'Order Placed'
        CHECK(status IN ('Order Placed','Picked Up','In Transit','Out for Delivery','Delivered','Cancelled')),
      pod_type TEXT,
      pod_data TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Migration for databases created before coordinates were added: these
  // columns are nullable, so existing shipment rows (booked before this
  // change) simply have no map data rather than failing to load.
  await query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS origin_lat REAL;');
  await query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS origin_lng REAL;');
  await query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS destination_lat REAL;');
  await query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS destination_lng REAL;');

  await query(`
    CREATE TABLE IF NOT EXISTS shipment_events (
      id SERIAL PRIMARY KEY,
      shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query('CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer_id);');
  await query('CREATE INDEX IF NOT EXISTS idx_shipments_driver ON shipments(driver_id);');
  await query('CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_id);');
  await query('CREATE INDEX IF NOT EXISTS idx_events_shipment ON shipment_events(shipment_id);');
  await query('CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);');
}

// ---------- SEED ----------
// Seed data is used ONLY in the automated test suite (see seedForTests(), called
// from src/tests/testApp.js after each TRUNCATE) so that tests have known,
// predictable accounts and shipments to assert against. It is deliberately
// NEVER run automatically against the real development or production database —
// a real deployment has no built-in demo accounts. To create the first
// administrator account on a fresh deployment, run: npm run create-admin
async function seedTestData() {
  const { rows } = await query('SELECT COUNT(*)::int AS c FROM users');
  if (rows[0].c > 0) return;

  const hash = (pw) => bcrypt.hashSync(pw, config.bcryptRounds);
  const insertUser = async (name, email, pw, role, phone) => {
    const { rows } = await query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [name, email, hash(pw), role, phone]
    );
    return rows[0].id;
  };

  const adminId = await insertUser('Admin User', 'admin@swiftship.com', 'Admin1234!', 'admin', '555-0100');
  const driver1Id = await insertUser('Chidi Okonkwo', 'driver1@swiftship.com', 'Driver1234!', 'driver', '555-0200');
  const driver2Id = await insertUser('Wei Zhang', 'driver2@swiftship.com', 'Driver1234!', 'driver', '555-0201');
  const custId = await insertUser('Priya Sharma', 'customer@swiftship.com', 'Customer1234!', 'customer', '555-0300');

  const insertShipment = async (d) => {
    const { rows } = await query(
      `INSERT INTO shipments
       (tracking_id, customer_id, driver_id, origin, destination, distance_km, weight_kg,
        length_cm, width_cm, height_cm, recipient_name, recipient_phone, recipient_address,
        service_type, cost, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id`,
      d
    );
    return rows[0].id;
  };
  const insertEvent = (shipmentId, status, note) =>
    query('INSERT INTO shipment_events (shipment_id, status, note) VALUES ($1,$2,$3)', [shipmentId, status, note]);

  const demo = [
    ['SW1001AB', custId, driver1Id, 'Lagos, Nigeria', 'London, England', 5040, 4.5, 30, 20, 15, 'Adaeze Okafor', '+234-801-234-5678', '14 Baker Street, London, England', 'express', 42.75, 'In Transit'],
    ['SW1002CD', custId, driver2Id, 'Accra, Ghana', 'Paris, France', 5100, 2.1, 25, 15, 10, 'Kwame Mensah', '+33-6-12-34-56-78', '25 Rue de Rivoli, Paris, France', 'standard', 18.4, 'Delivered'],
    ['SW1003EF', custId, null, 'Mumbai, India', 'Tokyo, Japan', 6750, 12.0, 40, 30, 25, 'Kenji Tanaka', '+81-3-1234-5678', '1 Chome, Shibuya, Tokyo, Japan', 'standard', 71.2, 'Order Placed'],
  ];

  for (const d of demo) {
    const status = d[15];
    const shipmentId = await insertShipment(d);
    await insertEvent(shipmentId, 'Order Placed', 'Shipment booked by customer');
    if (status !== 'Order Placed') await insertEvent(shipmentId, 'Picked Up', 'Package picked up by driver');
    if (status === 'In Transit') await insertEvent(shipmentId, 'In Transit', 'Package in transit to destination hub');
    if (status === 'Delivered') {
      await insertEvent(shipmentId, 'In Transit', 'Package in transit to destination hub');
      await insertEvent(shipmentId, 'Out for Delivery', 'Package out for delivery');
      await insertEvent(shipmentId, 'Delivered', 'Package delivered successfully');
    }
  }
}

let readyPromise = null;

/**
 * Call once at startup (and awaited before the app starts accepting requests).
 * Safe to call multiple times — subsequent calls reuse the same in-flight promise.
 * Does NOT seed any data — a fresh deployment starts with an empty users table.
 * Create the first administrator account with: npm run create-admin
 */
function initDatabase() {
  if (!readyPromise) {
    readyPromise = ensureSchema();
  }
  return readyPromise;
}

/**
 * Test-only helper: seeds known accounts and shipments for the automated test
 * suite. Called from src/tests/testApp.js after TRUNCATE. Never called from
 * initDatabase(), so it never runs against a real dev/production database.
 */
async function seedForTests() {
  await seedTestData();
}

module.exports = { query, pool, initDatabase, seedForTests };
