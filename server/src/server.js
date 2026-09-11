const createApp = require('./app');
const config = require('./config/env');
const { initDatabase } = require('./config/database');

async function main() {
  await initDatabase();

  const app = createApp();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`SwiftShip API listening on port ${config.port} [${config.env}]`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('FATAL: failed to start server', err);
  process.exit(1);
});
