require('dotenv').config();

const REQUIRED_IN_PRODUCTION = ['JWT_SECRET', 'DATABASE_URL'];

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || null,
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
     email: {
     enabled: !!(process.env.BREVO_API_KEY && process.env.EMAIL_FROM_ADDRESS),
     brevoApiKey: process.env.BREVO_API_KEY || null,
     fromAddress: process.env.EMAIL_FROM_ADDRESS || null,
     fromName: process.env.EMAIL_FROM_NAME || 'SwiftShip Logistics',
   },,
};

if (config.env === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Fail loudly rather than silently running with an insecure default secret in prod.
    // eslint-disable-next-line no-console
    console.error(`FATAL: Missing required environment variables in production: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = config;
