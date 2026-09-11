require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-not-for-production';
process.env.BCRYPT_ROUNDS = '4'; // fast hashing in tests — security strength irrelevant here

// Tests run against a real Postgres database (see testApp.js for the truncate/reseed
// strategy). Prefer a dedicated TEST_DATABASE_URL if provided, so tests never touch
// dev/demo data; fall back to DATABASE_URL for convenience if only one is configured
// (e.g. in CI with a single throwaway Postgres instance).
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error(
    '\nFATAL: No DATABASE_URL (or TEST_DATABASE_URL) set for tests.\n' +
    'Create a free Postgres database (e.g. at neon.tech), then either:\n' +
    '  - set TEST_DATABASE_URL in server/.env to a dedicated test database, or\n' +
    '  - set DATABASE_URL if you\'re fine tests truncating your dev database.\n'
  );
  process.exit(1);
}
