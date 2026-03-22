# FIRS E-Invoicing Platform

## Overview

Full-stack government e-invoicing platform for Nigerian businesses to submit invoices to the Federal Inland Revenue Service (FIRS). Simulates a system like Remita for government tax compliance.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React 18 + Vite + Tailwind CSS v4
- **State management**: TanStack Query v5
- **Routing**: Wouter
- **UI components**: Shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

## Architecture

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   └── einvoice/           # React + Vite frontend (port 18550)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── ...
```

## Features

1. **User Authentication** - Email/password with session cookies
2. **Onboarding Flow** - 3-step wizard: Business Profile → FIRS Integration → Subscription
3. **Customer Management** - Add/view customers with TIN lookup simulation
4. **Invoice Creation** - Dynamic line items, auto-calculation, VAT (7.5%)
5. **Real-Time Validation** - Required fields, TIN checks, tax accuracy
6. **FIRS Submission** - Simulated API call with success/rejection states
7. **Status Tracking** - Invoice history with Pending/Accepted/Rejected tags

## Database Schema

- `users` - Authentication accounts
- `sessions` - Session tokens with expiry
- `business_profiles` - Company profile, TIN, FIRS connection status
- `customers` - Customer records per user
- `invoices` - Invoice records with line items (JSONB), status, FIRS reference IDs

## API Routes

All routes are under `/api`:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET/POST /api/business/profile` - Business profile
- `POST /api/business/firs-connect` - Connect to FIRS (simulated)
- `POST /api/business/subscription` - Select plan
- `GET/POST /api/customers` - Customer CRUD
- `GET /api/customers/tin/:tin` - TIN lookup (simulated)
- `GET/POST /api/invoices` - Invoice CRUD
- `POST /api/invoices/:id/validate` - Validate invoice
- `POST /api/invoices/:id/submit` - Submit to FIRS (simulated)

## Authentication

Uses session cookies (httpOnly). The `custom-fetch.ts` in `lib/api-client-react` always sends `credentials: "include"`.

## Running Codegen

After changing `lib/api-spec/openapi.yaml`:
```bash
pnpm --filter @workspace/api-spec run codegen
```

## Database Migrations

```bash
pnpm --filter @workspace/db run push
```
