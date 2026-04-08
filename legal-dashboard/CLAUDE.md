# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js Version

This project uses **Next.js 16** with **React 19**, which differs substantially from earlier versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. APIs, file conventions, and behaviors may differ from training data.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest (single run, CI)
npx playwright test  # E2E tests (requires dev server on :3000)
npx playwright test e2e/app.spec.ts  # Run single E2E file
```

Unit tests live in `tests/` and match `tests/**/*.test.ts`. E2E tests live in `e2e/`.

## Architecture

**Legal Dashboard** — a Next.js App Router SaaS for Brazilian lawyers. Lawyers enter their OAB credentials to view process health metrics fetched from the Escavador API. There is also a shop where they can purchase report SKUs via Stripe.

### Data flow

1. User enters OAB state + number on the homepage (no auth required)
2. `GET /api/processes` returns health metrics (currently mock data; real calls go through `EscavadorClient` in `src/lib/escavador.ts`)
3. Case details, parties, documents, and movement history are fetched per-process from `/api/case-detail/[numero]`, etc.
4. Shop at `/shop` lets anonymous or authenticated users purchase SKUs via `/api/checkout` → Stripe → webhook at `/api/webhooks/stripe`

### Auth & middleware

- Auth is Supabase-based. Middleware checks for the `sb-access-token` cookie.
- Public routes: `/login`, `/api/auth`, `/api/skus`, `/api/checkout`, `/_next`, `/favicon.ico`.
- All other `/api/*` routes require the cookie.
- **Two Supabase clients**: `src/utils/supabase/client.ts` (browser) and `src/utils/supabase/server.ts` (server). The server file also exports `createServiceClient()` which uses `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS — use this only in trusted server contexts (webhooks, admin routes).

### Supabase / database

Migrations in `migrations/` are applied manually to Supabase. Key tables:
- `sku_catalog` — product catalog with RLS (public read for active SKUs)
- `orders` — order records, user-owned via RLS; supports anonymous orders (`user_id IS NULL`)
- `order_items` — line items linked to orders
- `audit_logs` — written on order status changes

Order status machine (enforced in the Stripe webhook handler):
`created → payment_pending → paid → processing → delivered/failed`
`created/payment_pending → cancelled`

### Shop / Stripe

- `POST /api/checkout` creates a Supabase order record, then a Stripe Checkout session. Supports both authenticated and anonymous buyers (guest checkout).
- `POST /api/webhooks/stripe` verifies signature and transitions order status. Writes to `audit_logs` on every transition.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` must be set. Missing `STRIPE_SECRET_KEY` throws at module load.

### Shared utilities

- `src/lib/cache.ts` — in-memory TTL cache (default 5 min), used to cache Escavador responses
- `src/lib/rate-limit.ts` — in-memory rate limiter (500 req/min per identifier)
- `src/lib/lgpd.ts` — LGPD masking helpers for CPF, CNPJ, name, phone (display only)
- `src/types/index.ts` — canonical types for processes, health metrics, etc.
- `src/types/orders.ts` — order-specific types including `OrderStatus`

### State management

- Server state: `@tanstack/react-query` (v5)
- Client state: `zustand` (v4)
- `src/components/Providers.tsx` wraps the app with QueryClient

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Bypasses RLS |
| `STRIPE_SECRET_KEY` | Yes | Throws at startup if missing |
| `STRIPE_WEBHOOK_SECRET` | Yes | For webhook signature verification |
| `ESCAVADOR_API_TOKEN` | Yes (prod) | Bearer token for Escavador API v2 |
| `NEXT_PUBLIC_BASE_URL` | Optional | Overrides protocol+host for Stripe redirect URLs |
