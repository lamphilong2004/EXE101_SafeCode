# SafeCode Backend (MVP)

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Install deps: `npm install`
3. Run: `npm run dev`

## Key Endpoints
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /billing/credits` (freelancer)
- `POST /files` (freelancer) create listing
- `POST /files/:fileId/upload` (freelancer) multipart: `archive` zip (+ `buildBinary` if demo type `build`)
- `GET /files/mine` (freelancer)
- `GET /files/assigned` (client)
- `GET /proxy/demo/:fileId` (client) URL demo with hard 60s cutoff
- `POST /payments/checkout/:fileId` (client)
- `POST /webhooks/stripe` (Stripe webhook; raw body)
- `GET /files/:fileId/key` (client, after Paid)
- `POST /files/decrypt` (client) multipart: `encryptedFile`, `keyB64`, `ivB64`, `authTagB64`
