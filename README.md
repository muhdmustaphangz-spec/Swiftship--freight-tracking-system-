# SwiftShip — Consignment & Logistics Platform

A full-stack shipment booking, tracking, and delivery management application with three role-based portals: **Customer**, **Admin**, and **Driver**. Built as a final-year project demonstrating layered backend architecture, role-based access control, automated testing, and a real production database.

## Stack

- **Backend:** Node.js, Express, PostgreSQL (via `pg`), JWT auth, Zod validation, PDFKit for invoice/waybill generation, `bwip-js` for scannable Code128 barcodes, Nodemailer (Gmail SMTP) for email
- **Frontend:** React (Vite), React Router, Tailwind CSS, Leaflet for shipment route maps
- **Testing:** Vitest + Supertest — 76 automated tests (unit + integration)
- **Database:** PostgreSQL (works with any Postgres provider; developed against [Neon](https://neon.tech)'s free tier)

The backend deliberately uses the **same database engine in development and production** rather than SQLite-locally/Postgres-in-prod, which is a common source of "works on my machine" bugs. The `pg` driver is pure JavaScript — no native compiler or build tools required on any OS. All other dependencies (`bwip-js`, `pngjs`, `nodemailer`) are pure JS too, for the same reason.

## Project structure

```
consignment-app/
├── render.yaml         Render Blueprint (infra-as-code deployment config)
├── server/              Express API
│   ├── scripts/          createAdmin.js — one-time CLI to bootstrap the first admin account
│   ├── src/
│   │   ├── config/         Environment config + database connection/schema
│   │   ├── routes/          Route definitions (thin — path → middleware → controller)
│   │   ├── controllers/      HTTP layer — request/response only, no business logic
│   │   ├── services/          Business logic + data access (repository pattern)
│   │   ├── middleware/         Auth, validation, error handling, file upload
│   │   ├── validators/          Zod schemas for every input
│   │   ├── utils/                 AppError, asyncHandler
│   │   └── tests/                  Unit + integration tests
│   └── package.json
└── client/             React frontend (Vite)
    └── src/
        ├── pages/          One file per screen/portal
        ├── components/     Shared UI (Shell, Timeline, StatusBadge, SignatureCapture,
        │                    LocationInput, ShipmentMap, Skeleton, Spinner)
        ├── context/         Auth context
        └── api/              API client wrapper
```

### Architecture

Request flow: `route → middleware (auth/validation) → controller → service → repository → database`

- **Routes** only wire paths to middleware and controllers.
- **Controllers** only handle HTTP concerns (parse request, call service, send response).
- **Services** hold business logic and authorization rules (e.g. "can this driver update this shipment?").
- **Repositories** are the only files that contain raw SQL.

This separation is what makes the 76-test suite possible: services and repositories can be tested independently of HTTP, and controllers stay thin enough that bugs are easy to isolate.

## Local setup

### 1. Get a free Postgres database

1. Sign up at [neon.tech](https://neon.tech) (free, no card required, permanent free tier — not a trial).
2. Create a project. Neon gives you a connection string immediately, e.g.:
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`
3. Copy that connection string.

### 2. Backend

```bash
cd server
cp .env.example .env
# paste your Neon connection string into DATABASE_URL in .env
# generate a JWT_SECRET, e.g.: openssl rand -base64 32
npm install
npm start
```

Runs on **http://localhost:4000**. On first run it creates all tables automatically — no manual migration step needed, and the database starts **empty** (no seeded demo accounts).

### 3. Create your first admin account

Since there are no seeded accounts, run this once to create an administrator:

```bash
cd server
npm run create-admin
```

You'll be prompted for a name, email, and password (min 8 characters, at least one letter, one number, one symbol). Customer and driver accounts are created normally through the app's registration page.

### 4. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Runs on **http://localhost:5173**. Open it in your browser.

### 5. (Optional) Enable real email

Password reset links, welcome emails, and shipment status notifications are sent via Gmail SMTP. Without configuration the app works fine — it just logs what it would have sent instead of sending it. To enable real delivery:

1. Turn on 2-Step Verification on your Google account: https://myaccount.google.com/security
2. Create an App Password: https://myaccount.google.com/apppasswords
3. In `server/.env`, set `GMAIL_USER` (your Gmail address) and `GMAIL_APP_PASSWORD` (the 16-character App Password — not your real Gmail password)
4. Restart the server

### 6. Run the tests

```bash
cd server
npm test
```

Tests run against a real Postgres database (either `TEST_DATABASE_URL` if set in `.env`, or `DATABASE_URL` as a fallback — tests truncate all tables before every test, so use a dedicated test database if you don't want your dev data wiped between test runs). Create a second free Neon database for this if you want full separation.

## Deployment (Render)

This repo includes `render.yaml`, a Render Blueprint that deploys both services from one file.

1. Push this repo to GitHub.
2. In the Render dashboard: **New → Blueprint**, connect your repo. Render reads `render.yaml` and creates both services automatically.
3. On the `swiftship-api` service, set the environment variables Render couldn't infer:
   - `DATABASE_URL` → your Neon connection string
   - `CORS_ORIGIN` → your frontend's Render URL once it's deployed (e.g. `https://swiftship-web.onrender.com`)
   - `FRONTEND_URL` → same as above (used to build links inside emails)
   - `GMAIL_USER` / `GMAIL_APP_PASSWORD` → optional, for real email delivery
   - (`JWT_SECRET` is auto-generated by Render — no action needed)
4. On the `swiftship-web` service, set:
   - `VITE_API_URL` → your backend's Render URL + `/api` (e.g. `https://swiftship-api.onrender.com/api`)
5. Deploy.
6. Once the backend is live, create your first admin account by running `npm run create-admin` **locally with `DATABASE_URL` pointed at your production Neon database** (or via Render's shell, if available on your plan) — this is a one-time step; the account it creates lives in your database, not in the app's code.

**Free-tier note:** Render's free web services spin down after 15 minutes of no traffic and take 30–60 seconds to wake up on the next request. If you're presenting this live, open the backend URL a minute or two beforehand to warm it up. The static frontend does not sleep.

## Features implemented

### Customer Portal
- Book a shipment with an origin/destination location picker (geocoded autocomplete, backed by OpenStreetMap Nominatim via a backend proxy) and live price estimator (recalculates as you type — base fee + distance + weight/volumetric weight + service multiplier)
- View all my shipments, with a detail page showing a route map, and downloadable invoice/waybill PDFs
- Public tracking page (no login required) with a route map and visual status timeline: Order Placed → Picked Up → In Transit → Out for Delivery → Delivered
- Forgot/reset password via emailed link

### Admin Dashboard
- Shipment management table with advanced, combinable filters: status, driver, service type, cost range, date range, plus free-text search
- Auto-generated unique tracking numbers on booking (format `SW########`)
- Invoice & waybill PDF generation, including a genuinely scannable Code128 barcode encoding the tracking ID
- Analytics: total revenue, pending vs completed, shipments by status, top routes by volume, revenue by service type, recent activity

### Driver / Agent Portal
- View assigned active + completed deliveries
- Advance status (Picked Up → In Transit → Out for Delivery)
- Capture proof of delivery: digital signature (drawn on canvas, with undo/clear) or photo upload — either marks the shipment Delivered

### Notifications
- Welcome email on registration
- Email on every shipment status change (sent to the customer)
- Password reset emails with a single-use, time-limited link
- All email delivery is optional/feature-flagged — the app runs normally without it configured

## Security & correctness measures

- Passwords hashed with bcrypt (configurable cost factor); strong-password policy enforced server-side (min 8 characters, letter + number + symbol) — never just a frontend check
- JWT-based auth, 7-day expiry, verified on every protected route
- Every input validated with Zod before it reaches business logic (rejects malformed data with clear field-level errors, not silent misbehavior or a 500)
- Role-based access control enforced at the route layer (`requireRole`) and re-checked at the resource layer (a driver can't touch another driver's shipment even if they guess the ID; a customer can't view another customer's shipment)
- Centralized error handling — no stack traces or internal details ever reach the client in production
- Rate limiting on login/register/forgot-password endpoints (protects against brute-force, credential stuffing, and password-reset email spam)
- Security headers via Helmet
- Self-registration can never create an admin account (rejected at both the validation layer and the service layer — defense in depth); the only way to create an admin is the `npm run create-admin` CLI script, which is never exposed over HTTP
- Password reset tokens are stored as a one-way hash (never the raw token), are single-use, expire after 30 minutes, and requesting a new reset invalidates any previous outstanding one
- The forgot-password endpoint returns an identical response whether or not the email exists, to prevent account enumeration

## API overview

All endpoints under `/api`. Auth via `Authorization: Bearer <token>` header (JWT).

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `POST /auth/forgot-password`, `POST /auth/reset-password`
- `POST /estimate` — public price calculator
- `GET /geocode?q=` — public geocoding proxy (used by the location picker)
- `GET /track/:trackingId` — public tracking lookup
- `POST /shipments`, `GET /shipments`, `GET /shipments/:id`
- `PATCH /shipments/:id/status` (admin), `PATCH /shipments/:id/assign-driver` (admin)
- `PATCH /shipments/:id/driver-status` (driver)
- `POST /shipments/:id/pod/signature`, `POST /shipments/:id/pod/photo` (driver)
- `GET /shipments/:id/invoice`, `GET /shipments/:id/waybill` — PDF downloads
- `GET /drivers`, `GET /analytics` (admin)
- `GET /health` — health check (used by Render for zero-downtime deploys)

## Pricing model

`Total = (base fee + distance_km × rate + chargeable_weight × rate) × service multiplier`

Chargeable weight is `max(actual weight, volumetric weight)`, where volumetric weight = `(L×W×H) / 5000` — the standard air-freight divisor. Service multipliers: economy ×0.8, standard ×1.0, express ×1.6. Defined in `server/src/services/pricingService.js`.

## Testing

```bash
cd server
npm test
```

76 tests across 5 files:
- `pricingService.test.js` — pricing calculation logic (volumetric weight, service multipliers, rounding)
- `trackingIdService.test.js` — tracking ID format and uniqueness properties
- `barcodeService.test.js` — barcode generation, including a regression test for the specific alpha-transparency bug that made early barcodes unscannable
- `auth.test.js` — registration, login, token validation, role restrictions, forgot/reset password flow (token expiry, single-use enforcement, enumeration-safety)
- `shipments.test.js` — full booking lifecycle (including geocoded coordinates), role-scoped data access, authorization boundaries between customers/drivers/admin, driver delivery workflow, proof-of-delivery capture, PDF generation access control

Tests run against a real Postgres database (not a mock), truncating and reseeding between every test for isolation. Rate limiting is disabled in test mode specifically because the test suite reuses one long-lived app instance across many requests — a real rate limit would throttle unrelated functional tests rather than test anything meaningful.

## Extending this project

Ideas for taking it further:
- Real-time driver location tracking (device geolocation + WebSockets) rather than discrete, driver-initiated status updates
- SMS notifications alongside email
- A live payment gateway integration
- Database migrations tool (e.g. `node-pg-migrate`) instead of the current idempotent `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` approach — fine for a project this size, but a real migration history is the next step for a larger system
