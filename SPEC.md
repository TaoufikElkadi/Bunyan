# Bunyan — Technical Specification
## All-in-One Mosque Donation Management Platform

**Version:** 2.0
**Date:** March 2026
**Status:** Phase 2 in progress
**Author:** Taoufik + Claude (Architect)
**Build Mode:** Solo developer + AI pair programming

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [Multi-Tenancy](#6-multi-tenancy)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Payment Architecture (Stripe)](#8-payment-architecture-stripe)
9. [Donation Flow](#9-donation-flow)
10. [Webhook Processing](#10-webhook-processing)
11. [Donor Identity Resolution](#11-donor-identity-resolution)
12. [ANBI Tax Receipts](#12-anbi-tax-receipts)
13. [PDF Generation Pipeline](#13-pdf-generation-pipeline)
14. [Email Infrastructure](#14-email-infrastructure)
15. [QR Code System](#15-qr-code-system)
16. [Internationalization (i18n)](#16-internationalization-i18n)
17. [Recurring Donations (Stripe Subscriptions)](#17-recurring-donations-stripe-subscriptions)
18. [Dashboard & Data Fetching](#18-dashboard--data-fetching)
19. [Donation Page Architecture](#19-donation-page-architecture)
20. [Fund Management UX](#20-fund-management-ux)
21. [Onboarding Flow](#21-onboarding-flow)
22. [Pricing & Plan Enforcement](#22-pricing--plan-enforcement)
23. [Currency & Money Handling](#23-currency--money-handling)
24. [Security](#24-security)
25. [Testing Strategy](#25-testing-strategy)
26. [Environments & Deployment](#26-environments--deployment)
27. [Performance Requirements](#27-performance-requirements)
28. [Monitoring & Observability](#28-monitoring--observability)
29. [Build Phases](#29-build-phases)
30. [Open Items for ANBI Research](#30-open-items-for-anbi-research)

---

## Implementation Status Legend

- ✅ **DONE** — Implemented and working
- 🟡 **PARTIAL** — Scaffolded or partially implemented
- ❌ **TODO** — Not yet started

---

## 1. Executive Summary ✅

Bunyan is a multi-tenant SaaS platform that replaces the Dutch mosque treasurer's entire donation workflow. The MVP focuses exclusively on the donation lifecycle: accept donations (online + manual) → track them → report on them → generate ANBI tax receipts.

**Product name:** Bunyan (all user-facing, technical assets, domains, and vendor registrations use "bunyan")

**Core value proposition:** One system that tracks ALL donations (digital + cash + bank transfer) and generates ANBI tax receipts automatically.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| App structure | Monorepo, single Next.js app | Solo dev, shared DB layer, one deploy |
| Database | Supabase (free → Pro) | Managed Postgres, built-in RLS, auth, storage, realtime |
| Auth | Supabase Auth | No extra vendor, RLS integration, zero cost |
| ORM | Supabase SDK only (no ORM) | Minimal stack, RLS enforcement built-in |
| Payments | Stripe (PaymentIntents + Subscriptions) | iDEAL support, no KVK needed for test mode, global standard |
| Multi-tenancy | Shared schema + RLS, pure isolation | Simplest approach, adapt later for cross-tenant features |
| Data fetching | SWR | Revalidation on focus + intervals, no WebSocket complexity |
| i18n | Simple JSON + React context | Small string count, no library dependency |
| Email | Resend (free → Pro) | Good DX with React Email, upgrade when volume grows |
| PDF | React-PDF + queue (Supabase Edge Functions) | Avoids serverless timeouts for bulk generation |
| Hosting | Vercel (EU region: ams1) | Edge deployment from Amsterdam, serverless scaling |
| Money | Integer cents everywhere | Stripe uses cents, eliminates floating-point errors |
| Testing | Critical path unit + integration tests | Financial calculations and webhook processing |
| Environments | Local + Staging (Supabase #2) + Production (Supabase #3) | Two Supabase projects for staging/prod |

---

## 2. Architecture Overview ✅

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (ams1)                         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Donation     │  │  Dashboard   │  │  API Routes  │  │
│  │  Pages (ISR)  │  │  (SSR/CSR)   │  │  + Webhooks  │  │
│  │  /doneren/*   │  │  /dashboard/*│  │  /api/*      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│  ┌──────┴──────────────────┴──────────────────┴───────┐ │
│  │              Next.js Proxy / Middleware              │ │
│  │         (tenant resolution via slug)                 │ │
│  └─────────────────────┬───────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Supabase    │ │  Stripe      │ │  Resend      │
│  (Postgres   │ │  (Payments)  │ │  (Email)     │
│   + Auth     │ │  iDEAL/Card  │ │              │
│   + Storage) │ │  SEPA/Subs   │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Two distinct frontend surfaces in one app:**
- **Public donation pages** (`/doneren/[slug]`): ISR, mobile-first, Stripe Elements
- **Treasurer dashboard** (`/dashboard/*`): Interactive, data-heavy, authenticated, SWR-driven

---

## 3. Tech Stack ✅

| Layer | Technology | Version/Notes |
|---|---|---|
| Framework | Next.js (App Router) | 16+ with TypeScript |
| Styling | Tailwind CSS | v4+ |
| UI Components | shadcn/ui (base-ui v2) | Render prop API (not asChild) |
| Database | PostgreSQL via Supabase | Free tier → Pro at launch |
| Data access | Supabase JS SDK (`@supabase/supabase-js`) | No ORM — SDK for all queries |
| Auth | Supabase Auth | Email/password + magic links |
| File storage | Supabase Storage | ANBI PDFs, mosque logos, campaign banners |
| Payments | Stripe (`stripe` + `@stripe/react-stripe-js`) | iDEAL, cards, SEPA via PaymentIntents + Subscriptions |
| Email | Resend + React Email | Transactional emails with JSX templates |
| PDF generation | `@react-pdf/renderer` | Server-side, queued for bulk |
| Data fetching | SWR | Client-side with revalidation |
| Charts | Recharts | Dashboard visualizations |
| QR codes | `qrcode` npm package | For printable posters |
| i18n | Custom (JSON + React context) | NL, EN, TR, AR |
| Hosting | Vercel (ams1 region) | EU deployment |
| Error tracking | Sentry | Production monitoring |
| Analytics | PostHog (EU) or Plausible | GDPR-compliant product analytics |

### Not Using (and why)

| Skipped | Reason |
|---|---|
| Prisma / Drizzle | Supabase SDK handles queries with built-in RLS |
| Clerk / NextAuth | Supabase Auth integrates natively with RLS |
| Supabase Realtime | SWR revalidation is sufficient for MVP |
| Puppeteer (for PDF) | Too heavy for serverless; React-PDF is lighter |
| next-intl / Paraglide | Overkill for small translation surface; custom JSON is fine |
| Mollie | Stripe has iDEAL support, no KVK needed for test mode, simpler integration |

---

## 4. Project Structure ✅

```
bunyan/
├── src/
│   ├── app/
│   │   ├── (admin)/              # Platform admin pages
│   │   │   └── admin/page.tsx    # Mosque management
│   │   ├── (onboarding)/         # Onboarding wizard (no sidebar)
│   │   │   └── onboarding/page.tsx
│   │   ├── (dashboard)/          # Treasurer dashboard (auth required)
│   │   │   ├── dashboard/        # KPIs, charts, feed
│   │   │   ├── donaties/         # Donation list + manual entry
│   │   │   ├── donateurs/        # Donor list + profiles
│   │   │   │   └── [id]/         # Donor detail page
│   │   │   ├── fondsen/          # Fund management
│   │   │   ├── campagnes/        # Campaign management
│   │   │   ├── anbi/             # ANBI receipt generation
│   │   │   ├── qr/               # QR code management
│   │   │   ├── audit/            # Audit log viewer
│   │   │   ├── instellingen/     # Settings
│   │   │   └── layout.tsx        # Dashboard shell with sidebar
│   │   ├── (auth)/               # Login, signup
│   │   │   ├── login/
│   │   │   ├── signup/           # (referenced, not separate page)
│   │   │   └── set-password/     # Team invite accept
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/       # Stripe webhook handler
│   │   │   ├── payments/
│   │   │   │   ├── intent/       # Create PaymentIntent
│   │   │   │   └── subscribe/    # Create Stripe Subscription
│   │   │   ├── donations/        # Manual donation CRUD
│   │   │   ├── donors/[id]/      # Donor API
│   │   │   ├── funds/            # Fund CRUD
│   │   │   │   └── [id]/         # Fund update/delete
│   │   │   ├── campaigns/        # Campaign CRUD
│   │   │   │   └── [id]/         # Campaign update/delete
│   │   │   ├── anbi/             # Preview, generate, download-zip
│   │   │   ├── qr/               # QR code CRUD
│   │   │   ├── recurring/cancel/ # Self-service cancellation
│   │   │   ├── settings/         # Mosque settings + team
│   │   │   ├── dashboard/charts/ # Chart data RPC
│   │   │   ├── onboarding/       # Onboarding API
│   │   │   ├── admin/            # Platform admin APIs
│   │   │   └── cron/             # Nightly reconciliation
│   │   ├── doneren/              # Public donation pages
│   │   │   └── [slug]/           # /doneren/[slug]
│   │   │       ├── page.tsx      # Donation form (ISR)
│   │   │       ├── [campaign]/   # Campaign-specific page
│   │   │       └── bedankt/      # Thank you page
│   │   ├── annuleren/            # Recurring cancellation
│   │   │   └── [token]/
│   │   ├── go/                   # QR redirect (give.bunyan.nl/abc123)
│   │   │   └── [code]/
│   │   └── layout.tsx            # Root layout
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── donation/             # Donation page components
│   │   ├── dashboard/            # Dashboard components (sidebar, charts, banner)
│   │   ├── fund/                 # Fund cards + dialog
│   │   ├── campaign/             # Campaign cards + dialog + progress
│   │   ├── donor/                # Donor edit dialog
│   │   ├── anbi/                 # ANBI overview component
│   │   ├── recurring/            # Cancel form
│   │   ├── qr/                   # QR management
│   │   ├── settings/             # Settings forms + team section
│   │   └── auth/                 # Invite handler
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client (with cookie handling)
│   │   │   ├── admin.ts          # Service role client (for webhooks)
│   │   │   ├── cached.ts         # Cached profile fetcher
│   │   │   ├── middleware.ts     # Auth middleware
│   │   │   └── platform-admin.ts # Platform admin auth
│   │   ├── stripe.ts             # Stripe server client
│   │   ├── stripe-client.ts      # Stripe browser client
│   │   ├── fees.ts               # Fee calculation (all payment methods)
│   │   ├── email/
│   │   │   ├── send.ts           # Resend wrapper
│   │   │   └── templates/        # React Email templates
│   │   ├── pdf/
│   │   │   └── anbi-receipt.tsx  # React-PDF ANBI template
│   │   ├── money.ts              # Cents ↔ euros utilities
│   │   ├── plan.ts               # Plan limits + feature gates
│   │   ├── i18n/
│   │   │   ├── context.tsx       # Language context provider
│   │   │   ├── translations/
│   │   │   │   ├── nl.json
│   │   │   │   ├── en.json
│   │   │   │   ├── tr.json
│   │   │   │   └── ar.json
│   │   │   └── use-translation.ts # Hook
│   │   └── utils.ts              # Shared utilities
│   ├── types/
│   │   └── index.ts              # Shared types
│   └── proxy.ts                  # Request proxy (tenant resolution)
├── supabase/
│   ├── migrations/               # 11 SQL migrations
│   ├── seed.sql                  # Development seed data
│   └── config.toml               # Supabase local config
├── tests/
│   └── unit/                     # money.test.ts, fees.test.ts
├── guides/                       # Manual setup guides
├── public/                       # Static assets
├── .env.example                  # Environment template
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── vercel.json                   # Cron config
└── package.json
```

---

## 5. Database Schema ✅

All monetary values stored as **integer cents** (e.g. €25.50 = 2550).

### Tables

```sql
-- ============================================================
-- MOSQUES (tenant table)
-- ============================================================
CREATE TABLE mosques (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,        -- used in URL: /doneren/[slug]
  city          TEXT,
  address       TEXT,
  logo_url      TEXT,
  banner_url    TEXT,
  primary_color TEXT DEFAULT '#10b981',      -- hex color for branding
  welcome_msg   TEXT,                        -- custom message on donation page
  anbi_status   BOOLEAN DEFAULT FALSE,
  rsin          TEXT,                        -- tax registration number
  kvk           TEXT,                        -- chamber of commerce number
  language      TEXT DEFAULT 'nl',           -- default donation page language
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth')),
  plan_started_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mosques_slug ON mosques(slug);

-- ============================================================
-- USERS (treasurer / board members — Supabase Auth)
-- ============================================================
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mosque_id   UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_mosque ON users(mosque_id);

-- ============================================================
-- FUNDS
-- ============================================================
CREATE TABLE funds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id     UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,                         -- emoji or icon identifier
  goal_amount   INTEGER,                      -- in cents, nullable
  goal_deadline DATE,                         -- nullable
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_funds_mosque ON funds(mosque_id);

-- ============================================================
-- DONORS (not auth users — no login)
-- ============================================================
CREATE TABLE donors (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id        UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  name             TEXT,                      -- nullable (anonymous)
  email            TEXT,                      -- nullable (anonymous)
  phone            TEXT,
  address          TEXT,
  iban_hint        TEXT,                      -- last 4 digits of IBAN for identity hints
  tags             TEXT[] DEFAULT '{}',
  total_donated    INTEGER DEFAULT 0,         -- cached, in cents
  donation_count   INTEGER DEFAULT 0,         -- cached
  first_donated_at TIMESTAMPTZ,
  last_donated_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donors_mosque ON donors(mosque_id);
CREATE INDEX idx_donors_email ON donors(mosque_id, email);
CREATE INDEX idx_donors_iban ON donors(mosque_id, iban_hint);

-- ============================================================
-- RECURRINGS (Stripe Subscriptions)
-- ============================================================
CREATE TABLE recurrings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id             UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  donor_id              UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  fund_id               UUID NOT NULL REFERENCES funds(id),
  amount                INTEGER NOT NULL,        -- in cents
  frequency             TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  stripe_subscription_id TEXT,                   -- Stripe Subscription ID
  stripe_customer_id     TEXT,                   -- Stripe Customer ID
  status                TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  next_charge_at        TIMESTAMPTZ,
  cancel_token          TEXT UNIQUE,             -- for self-service cancellation links
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurrings_mosque ON recurrings(mosque_id);
CREATE INDEX idx_recurrings_donor ON recurrings(donor_id);
CREATE INDEX idx_recurrings_cancel ON recurrings(cancel_token);

-- ============================================================
-- DONATIONS
-- ============================================================
CREATE TABLE donations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id                UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  donor_id                 UUID REFERENCES donors(id) ON DELETE SET NULL,
  fund_id                  UUID NOT NULL REFERENCES funds(id),
  amount                   INTEGER NOT NULL,          -- in cents
  fee_covered              INTEGER DEFAULT 0,         -- donor-covered fee in cents
  currency                 TEXT DEFAULT 'EUR',
  method                   TEXT NOT NULL CHECK (method IN ('ideal', 'card', 'sepa', 'cash', 'bank_transfer')),
  status                   TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  is_recurring             BOOLEAN DEFAULT FALSE,
  recurring_id             UUID REFERENCES recurrings(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,               -- Stripe PaymentIntent ID (nullable for manual entries)
  notes                    TEXT,                       -- for manual entries
  created_by               UUID REFERENCES users(id), -- null for online, user_id for manual
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_mosque ON donations(mosque_id);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_fund ON donations(fund_id);
CREATE INDEX idx_donations_status ON donations(mosque_id, status);
CREATE INDEX idx_donations_created ON donations(mosque_id, created_at DESC);
CREATE INDEX idx_donations_stripe ON donations(stripe_payment_intent_id);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id       UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  fund_id         UUID NOT NULL REFERENCES funds(id),
  title           TEXT NOT NULL,
  description     TEXT,
  slug            TEXT NOT NULL,               -- e.g. "ramadan" → /doneren/[mosque]/ramadan
  goal_amount     INTEGER,                     -- in cents
  start_date      DATE,
  end_date        DATE,
  banner_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mosque_id, slug)
);

CREATE INDEX idx_campaigns_mosque ON campaigns(mosque_id);

-- ============================================================
-- ANBI RECEIPTS
-- ============================================================
CREATE TABLE anbi_receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id       UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  donor_id        UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  total_amount    INTEGER NOT NULL,            -- in cents
  fund_breakdown  JSONB NOT NULL,              -- { "fund_name": amount_cents, ... }
  pdf_url         TEXT,                        -- Supabase Storage path
  emailed_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mosque_id, donor_id, year)
);

CREATE INDEX idx_anbi_mosque_year ON anbi_receipts(mosque_id, year);

-- ============================================================
-- QR SHORT LINKS
-- ============================================================
CREATE TABLE qr_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id   UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,            -- short code (e.g. "abc123")
  fund_id     UUID REFERENCES funds(id),       -- nullable: specific fund or general page
  campaign_id UUID REFERENCES campaigns(id),   -- nullable: link to campaign
  scan_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_code ON qr_links(code);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id   UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_mosque ON audit_log(mosque_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- ============================================================
-- PLAN USAGE TRACKING (for free tier limits)
-- ============================================================
CREATE TABLE plan_usage (
  mosque_id         UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  month             DATE NOT NULL,
  online_donations  INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (mosque_id, month)
);
```

### Row-Level Security Policies ✅

```sql
-- Enable RLS on all tables
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE anbi_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_usage ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's mosque_id
CREATE OR REPLACE FUNCTION get_user_mosque_id()
RETURNS UUID AS $$
  SELECT mosque_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Example policy pattern (applied to every tenant table):
CREATE POLICY "Users can only access their mosque's data"
  ON donations FOR ALL
  USING (mosque_id = get_user_mosque_id())
  WITH CHECK (mosque_id = get_user_mosque_id());

-- PUBLIC ACCESS (donation pages — no auth required)
CREATE POLICY "Public can read active funds"
  ON funds FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Authenticated users read own mosque"
  ON mosques FOR SELECT
  USING (id = get_user_mosque_id());

-- Public view for donation pages (excludes sensitive fields)
CREATE VIEW public_mosques AS
  SELECT id, name, slug, city, logo_url, banner_url, primary_color,
         welcome_msg, anbi_status, rsin, language
  FROM mosques;

GRANT SELECT ON public_mosques TO anon;

CREATE POLICY "Public can read active campaigns"
  ON campaigns FOR SELECT
  USING (is_active = TRUE);
```

### Role-Aware RLS ✅

Viewer role is restricted from mutations (manual donations, settings changes, fund/campaign edits). Admin role has full CRUD access.

### Cached Aggregates ✅

The `donors` table has cached `total_donated` and `donation_count` fields updated via PostgreSQL trigger on donation insert/update.

### RPC Functions ✅

- `get_dashboard_metrics(p_mosque_id, p_month_start)` — KPI cards
- `get_fund_totals(p_mosque_id)` — Fund totals for fund cards
- `get_monthly_totals(p_mosque_id)` — Monthly chart data
- `get_fund_breakdown(p_mosque_id, p_month_start)` — Fund pie chart data
- `increment_plan_usage(p_mosque_id, p_month)` — Plan usage counter

---

## 6. Multi-Tenancy ✅

### Strategy: Shared schema + RLS (pure isolation)

- Single PostgreSQL database with `mosque_id` foreign key on every tenant table
- Supabase Row-Level Security enforces data isolation at the database level
- **No cross-tenant features in MVP** — if needed later, add explicit shared tables or a service layer
- Scales to thousands of mosques without operational overhead

### Routing

Public donation pages are at `/doneren/[slug]` (path-based, not subdomain).

**Dashboard routing:**
- `/dashboard/*` is the authenticated dashboard
- Auth middleware checks Supabase Auth session
- User's `mosque_id` from the `users` table determines tenant scope

### Defense-in-Depth (RLS + App-Layer Check)

Every server-side query **explicitly includes mosque_id** from the authenticated session, even though RLS already enforces it:

```typescript
// Pattern: always pass mosque_id explicitly
const { data } = await supabase
  .from('donations')
  .select('*')
  .eq('mosque_id', session.user.mosque_id)  // App-layer check
  .order('created_at', { ascending: false });
// RLS also enforces mosque_id = get_user_mosque_id()
// Both layers must agree — defense in depth
```

---

## 7. Authentication & Authorization ✅

### Stack: Supabase Auth

- **Treasurer auth:** Email/password + magic link option
- **Donor auth:** None — donors don't have accounts. Identity is by email + optional IBAN hint.
- **Session:** Supabase handles JWT tokens via `@supabase/ssr` for cookie-based session management in Next.js

### Roles ✅

| Role | Permissions |
|---|---|
| `admin` | Full access: CRUD all data, settings, team management, ANBI export, Stripe connection |
| `viewer` | Read-only: dashboard, donation list, donor list. Cannot edit settings, export data, or manage team |

### Auth Flow ✅

1. Treasurer signs up → Supabase Auth creates `auth.users` entry
2. Onboarding creates `mosques` row + `users` row (linking auth.user to mosque)
3. Inviting team members: admin sends invite email → new user signs up → linked to same mosque
4. Magic links for passwordless login (Supabase Auth built-in)

### Session in Server Components ✅

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie handlers */ } }
  );
}

// Usage in server component or API route:
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('users')
  .select('mosque_id, role')
  .eq('id', user.id)
  .single();
```

---

## 8. Payment Architecture (Stripe) ✅

### Overview

Stripe handles all payment processing. Bunyan uses Stripe PaymentIntents for one-time donations and Stripe Subscriptions for recurring donations. Stripe supports iDEAL (most common in NL), cards, and SEPA Direct Debit natively.

### Integration Architecture ✅

1. Bunyan has a single Stripe account (platform account)
2. All payments flow through Bunyan's Stripe account
3. Mosque is identified via `metadata.mosque_id` on every PaymentIntent/Subscription
4. Stripe Elements (embedded) handles payment UI — Bunyan never sees card data

### Payment Flow (One-Time) ✅

```
Donor on /doneren/[slug]
  → Frontend calls POST /api/payments/intent
      - Creates pending donation record in DB
      - Creates/finds donor record if email provided
      - Creates Stripe PaymentIntent with metadata (mosque_id, donation_id, fund_id)
      - Returns clientSecret
  → Stripe Elements renders payment form (iDEAL, card, SEPA)
  → Donor completes payment
  → Stripe sends webhook → POST /api/webhooks/stripe
      - Event: payment_intent.succeeded
      - Updates donation.status = 'completed'
      - Updates donor aggregates (via trigger)
      - Increments plan_usage counter
  → Donor redirected to /doneren/[slug]/bedankt
```

### Payment Flow (Recurring) ✅

```
Donor selects recurring on /doneren/[slug]
  → Frontend calls POST /api/payments/subscribe
      - Creates Stripe Customer (or finds existing)
      - Creates Stripe Product + Price (per mosque+fund combo)
      - Creates Stripe Subscription
      - Creates recurring record with cancel_token
      - Returns clientSecret for first payment
  → Stripe handles subsequent charges automatically
  → Webhook: invoice.payment_succeeded → creates new donation record per charge
  → Webhook: customer.subscription.deleted → marks recurring as cancelled
```

### Revenue Model (MVP)

**SaaS subscription + application fee:**
- Application fee: configurable per plan (collected via Stripe)
- Subscription: €0/€29/€49 per month (see Pricing section)

### Nightly Reconciliation ✅

Vercel cron job runs daily at 02:00 UTC (`/api/cron/reconcile`):
1. Fetches last 48h PaymentIntents from Stripe
2. Compares against `donations` table by `stripe_payment_intent_id`
3. Any mismatched status → update and log discrepancy
4. Safety net — webhooks handle 99.9% of cases

---

## 9. Donation Flow ✅

### Online Donation (happy path)

```
Donor visits /doneren/alfath
  → Selects fund (e.g. "Zakat")
  → Enters amount (€25) or picks preset
  → Optionally: name + email (for ANBI receipt)
  → Optionally: checks "Cover processing fee" → total becomes €25.29
  → Optionally: selects recurring (weekly/monthly/yearly)
  → [API] POST /api/payments/intent (or /api/payments/subscribe for recurring)
      - Creates Donation record (status: pending)
      - Creates Stripe PaymentIntent with metadata
      - Returns clientSecret
  → Stripe Elements handles payment (iDEAL, card, SEPA)
  → Donor completes payment
  → Stripe sends webhook → /api/webhooks/stripe
      - Verify payment via Stripe signature
      - Update Donation record (status: completed)
      - Create/update Donor record if email provided
      - Increment plan_usage.online_donations
      - Send confirmation email via Resend
  → Donor redirected to /doneren/alfath/bedankt
      - Shows "Jazak Allahu Khairan" + donation summary
      - Option to donate again
```

### Manual Donation Entry ✅

```
Treasurer opens /donaties → clicks "+ Handmatige donatie"
  → Modal form:
      - Donor name (optional, autocomplete from existing donors)
      - Amount
      - Fund (dropdown)
      - Method: cash | bank_transfer
      - Date (default: today)
      - Notes (optional)
  → Creates Donation record (status: completed, created_by: user_id)
  → Creates audit_log entry
  → Donor aggregates updated via trigger
```

### "Cover Fees" Calculation ✅

Simple addition approach:

```typescript
// lib/fees.ts
const FEES = {
  ideal: { fixed: 29, percentage: 0 },        // €0.29 fixed
  card: { fixed: 25, percentage: 1.8 },        // €0.25 + 1.8%
  sepa: { fixed: 25, percentage: 0 },          // €0.25 fixed (approx)
  bancontact: { fixed: 39, percentage: 0 },    // €0.39 fixed
} as const;

export function calculateCoverFee(
  amountCents: number,
  method: keyof typeof FEES
): number {
  const fee = FEES[method];
  return fee.fixed + Math.round(amountCents * fee.percentage / 100);
}

// Example: €25 iDEAL → fee = 29 cents → charge €25.29
// Not mathematically perfect (simple add, not gross-up) but close enough
```

---

## 10. Webhook Processing ✅

### Design Principles

1. **Idempotent**: Processing the same webhook twice produces the same result
2. **Signature verification**: Stripe webhook signature is verified via `stripe.webhooks.constructEvent()`
3. **Reconciliation**: Nightly cron job catches any missed webhooks

### Webhook Handler ✅

```
POST /api/webhooks/stripe
  Headers: stripe-signature (verified)

  Events handled:
  1. payment_intent.succeeded
     - Find donation by stripe_payment_intent_id
     - If already completed → return 200 (idempotent)
     - Update donation.status = 'completed'
     - Update donor aggregates (via trigger)
     - Increment plan_usage counter

  2. payment_intent.payment_failed
     - Update donation.status = 'failed'

  3. invoice.payment_succeeded (recurring)
     - Find recurring by stripe_subscription_id
     - Create new donation record linked to recurring
     - Update next_charge_at

  4. customer.subscription.deleted
     - Find recurring by stripe_subscription_id
     - Set status = 'cancelled'

  Return 200 for all handled events
```

---

## 11. Donor Identity Resolution ✅

### Strategy: Email as canonical key + IBAN hint

**Email is the unique identifier per mosque.** When a donation includes an email that matches an existing donor for that mosque, it auto-links.

**Duplicate prevention:**
- Before creating a new donor, check for existing donor with same email in that mosque
- If found, link the donation to existing donor
- If not found, create new donor record

**IBAN hint for identity suggestions:**
- Store the last 4 digits of IBAN as `iban_hint` on the donor record
- Used for dashboard suggestions when email differs or is absent

**Manual linking flow (for anonymous → identified):**
1. Treasurer opens donor profile
2. Can edit donor details and link/merge donations
3. System creates `audit_log` entry recording the action

---

## 12. ANBI Tax Receipts ✅

### Overview

ANBI (Algemeen Nut Beogende Instelling) is the Dutch equivalent of 501(c)(3) tax-exempt status. Donors to ANBI-registered organizations can deduct gifts from taxable income. The mosque must provide an annual receipt.

### Required Fields (validated — see Section 30 for full research)

The Belastingdienst does not mandate a specific template, but the following fields are required:

- Organization name and full address (as registered with KvK)
- RSIN number (tax registration)
- Donor full name
- Calendar year covered
- Total amount donated
- Breakdown per fund (recommended best practice)
- Statement that the organization holds ANBI status
- Date of issue

Digital PDF receipts are fully valid — no signature or stamp required.

**Important: Cash donations are excluded.** Per the Belastingdienst, cash gifts (contante giften) are not tax-deductible. Only donations via verifiable bank transfer are eligible. The ANBI receipt query **must** filter `method != 'cash'`.

### Generation Flow ✅

1. Treasurer navigates to `/anbi`
2. Selects year (e.g. 2026)
3. System queries all completed donations for that mosque + year, **excluding cash donations** (`method != 'cash'`), grouped by donor
4. Displays preview: list of donors with total amount
5. Treasurer clicks "Generate all receipts"
6. Backend generates PDFs via `@react-pdf/renderer`
7. When complete:
   - `anbi_receipts` records created/updated
   - "Download ZIP" button available (`/api/anbi/download-zip`)

### API Endpoints ✅

- `GET /api/anbi/preview?year=YYYY` — Preview eligible donors + totals
- `POST /api/anbi/generate` — Generate single or bulk PDF receipts
- `GET /api/anbi/download-zip?year=YYYY` — Download all receipts as ZIP

---

## 13. PDF Generation Pipeline ✅

### Solution: React-PDF in API routes

Currently PDFs are generated in-memory via `@react-pdf/renderer` in API routes. For bulk generation (200+ donors), the API processes them sequentially per donor.

**Future optimization:** Queue via Supabase Edge Functions for parallel processing if needed at scale.

---

## 14. Email Infrastructure 🟡

### Stack: Resend + React Email

**Status:** Templates scaffolded, sending skipped in dev (no domain configured yet).

**Free tier (pilot):** 100 emails/day, 1 domain
**Pro tier (launch):** €20/month, 50k emails/month

### Email Templates ✅ (scaffolded)

| Email | Trigger | Status |
|---|---|---|
| Donation confirmation | Webhook: payment completed + donor has email | 🟡 Template ready, sending blocked |
| ANBI receipt | Treasurer bulk-sends from /anbi | 🟡 Template ready |
| Team invite | Admin invites new member | 🟡 Template ready |
| Recurring cancellation | Donor self-cancels | 🟡 Template ready |
| Free tier limit warning | Online donations exceed 15/month | ❌ TODO |

### Email Architecture ✅

```typescript
// lib/email/send.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Wrapper that skips sending if no API key (local dev)
export async function sendEmail(params: EmailParams) {
  if (!process.env.RESEND_API_KEY) return; // skip in dev
  await resend.emails.send(params);
}
```

---

## 15. QR Code System ✅

### Strategy: Short redirect URLs with fund deep linking

Each QR code encodes a short URL: `/go/[code]`

**Benefits:**
- URL can be updated without reprinting poster
- Scan analytics (increment `qr_links.scan_count`)
- Fund-specific posters (pre-selects fund on donation page)

### API Endpoints ✅

- `POST /api/qr` — Create QR link, return data URL + URL string
- `GET /api/qr` — List all QR links with fund/campaign names

### Redirect Flow ✅

```
Donor scans QR → /go/[code]
  → API looks up qr_links by code
  → Increments scan_count
  → Redirects to: /doneren/[slug]?fund=[id] (302)
```

### Management UI ✅

QR management page at `/qr` with create form + list of existing QR codes with scan counts.

---

## 16. Internationalization (i18n) 🟡

### Approach: Simple JSON files + React context

**Scope:** Donor-facing pages only. Dashboard is Dutch/English only.

### Supported Languages

| Code | Language | Direction | Status |
|---|---|---|---|
| `nl` | Dutch | LTR | ✅ |
| `en` | English | LTR | 🟡 Partial |
| `tr` | Turkish | LTR | ❌ TODO |
| `ar` | Arabic | RTL (text only) | ❌ TODO |

### Implementation ✅

- Language context provider + `useTranslation` hook
- Language switcher on public donation pages
- Mosque's `language` setting determines default locale

### RTL Support ❌ TODO

**Text-only RTL** for Arabic:
- Arabic text renders right-to-left within its containers (`dir="rtl"` on text elements)
- Overall page layout remains LTR

---

## 17. Recurring Donations (Stripe Subscriptions) ✅

### Flow

1. Donor selects recurring frequency (weekly/monthly/yearly) on donation page
2. Frontend calls `POST /api/payments/subscribe`
3. API creates Stripe Customer + Product + Price + Subscription
4. Bunyan creates `recurrings` record with `stripe_subscription_id`, `stripe_customer_id`, and `cancel_token`
5. Stripe handles all subsequent charges via Subscriptions
6. Webhook `invoice.payment_succeeded` → creates new donation record per charge
7. Webhook `customer.subscription.deleted` → marks recurring as cancelled

### Self-Service Cancellation ✅

Every recurring donation has a unique `cancel_token` (UUID). Cancellation link:

```
/annuleren/[cancel_token]
```

**Cancellation page flow:**
1. Validate `cancel_token` against `recurrings` table
2. Show current recurring details (amount, frequency, fund, mosque)
3. "Annuleer" button
4. On confirm:
   - Cancel Stripe Subscription via API
   - Set `recurrings.status = 'cancelled'`
   - Send cancellation confirmation email to donor

**API:** `POST /api/recurring/cancel` with `{ cancel_token }`

---

## 18. Dashboard & Data Fetching ✅

### Strategy: SWR with revalidation

No WebSocket/Realtime for MVP. SWR provides:
- Data revalidation on window focus
- Interval-based revalidation (configurable)
- Stale-while-revalidate for instant UI with background refresh

### Dashboard KPIs ✅

```typescript
// 4 KPI cards at top of dashboard (via get_dashboard_metrics RPC)
interface DashboardKPIs {
  totalThisMonth: number;      // cents — sum of completed donations this month
  recurringMRR: number;        // cents — sum of active monthly recurring amounts
  averageGift: number;         // cents — average donation amount this month
  newDonors: number;           // count of donors with first_donated_at this month
}
```

### Dashboard Widgets ✅

| Widget | Query | Status |
|---|---|---|
| KPI cards | `get_dashboard_metrics` RPC | ✅ |
| Monthly chart | `get_monthly_totals` RPC | ✅ |
| Fund breakdown | `get_fund_breakdown` RPC | ✅ |
| Recent donations | Last 5, via RPC | ✅ |
| Upgrade banner | Plan check | ✅ |

---

## 19. Donation Page Architecture ✅

### Performance Target: < 2 seconds on 4G mobile

**Strategy: ISR + edge caching**

- Donation pages use ISR with 300s (5 min) revalidation
- Mosque data (name, logo, colors, funds, language) fetched at build/request time
- Only dynamic part: Stripe Elements for payment
- All static assets served from Vercel Edge CDN

### Mobile-First Design ✅

- Touch-friendly: minimum 48px tap targets
- Preset amount buttons are large and easy to tap
- iDEAL is the default/primary payment method (most common in NL)
- Minimal form fields: fund, amount, (optional) name + email
- Single-page flow — no multi-step wizard for donating

### Fund Selector UX ✅

- Fund cards in a responsive grid
- Each card: icon + name
- Selected fund highlighted with mosque's primary color

---

## 20. Fund Management UX ✅

### Default Funds (pre-created during onboarding)

1. **Algemeen** (General) — default fund if donor doesn't select
2. **Zakat** — obligatory charity
3. **Sadaqah** — voluntary charity

Treasurer can rename, reorder, add, or archive funds. Archived funds are hidden from the donation page but their historical data is preserved.

### Fund Goal + Progress ✅

Optional per fund:
- `goal_amount` (integer cents)
- `goal_deadline` (date)
- Shown as progress bar on fund cards
- Progress = sum of completed donations for this fund / goal_amount

### API ✅

- `POST /api/funds` — Create fund
- `PUT /api/funds/[id]` — Update fund
- `DELETE /api/funds/[id]` — Archive fund (soft delete)

---

## 21. Onboarding Flow ✅

### 4-Step Wizard

**Step 1: Mosque Basics** ✅
- Name (required)
- City (required)
- Auto-generates slug from name (editable)

**Step 2: Branding** ✅
- Pick primary color (color picker with presets)
- Optional: welcome message

**Step 3: Funds** ✅
- Pre-filled with 3 default funds (Algemeen, Zakat, Sadaqah)
- Treasurer can rename, remove, or add
- Quick setup — can always add more later

**Step 4: ANBI (skippable)** ✅
- ANBI toggle + RSIN input (if ANBI-registered)
- Skip → mosque lands on dashboard

**Post-onboarding:**
- Dashboard is immediately usable
- Donation page is live at `/doneren/[slug]`

---

## 22. Pricing & Plan Enforcement ✅

### Plans

| Feature | Free | Starter (€29/mo) | Growth (€49/mo) |
|---|---|---|---|
| Donation page | Yes | Yes | Yes |
| Funds | 1 | Unlimited | Unlimited |
| Online donations/month | 15 | Unlimited | Unlimited |
| Manual entry | Yes | Yes | Yes |
| Dashboard | Basic | Full | Full |
| Donor CRM | No | Yes | Yes |
| ANBI receipts | No | Yes | Yes |
| Recurring donations | No | Yes | Yes |
| QR posters | No | Yes | Yes |
| Campaign pages | No | Yes | Yes |
| Admin users | 1 | 2 | Unlimited |
| Custom branding | No | No | Yes (remove badge) |
| Multilingual page | No | No | Yes |
| CSV export | No | No | Yes |
| Application fee | €0.15/tx | €0.10/tx | €0.10/tx |

### Free Tier Limit Enforcement: Soft Limit + Nag ✅

When a free-tier mosque exceeds 15 online donations/month:
1. **The donation still goes through** — never block a donor from giving
2. Dashboard shows a persistent upgrade banner
3. The extra donations are processed normally

**Implementation:** `plan_usage` table tracks monthly online donation count per mosque via `increment_plan_usage` RPC. Feature gates check `getPlanLimits(plan)` in `lib/plan.ts`.

### Billing ❌ TODO

Subscription billing via Stripe. Application fees TBD.

---

## 23. Currency & Money Handling ✅

### Rule: Integer cents everywhere

```typescript
// lib/money.ts
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function centsToEuros(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
// formatMoney(2550) → "€ 25,50"

export function formatMoneyCompact(cents: number): string { ... }
// formatMoneyCompact(2550) → "€25" (if whole euro)
```

- Database: all `amount` columns are `INTEGER` (cents)
- Stripe API: uses cents natively
- Frontend: convert to euros only at the display layer
- Calculations: all in integer arithmetic — no floating point
- ANBI receipts: display in euros with 2 decimal places

---

## 24. Security ✅

### Data Isolation (Defense in Depth)

1. **Layer 1 — Database RLS:** Every table has `mosque_id`-based RLS policy
2. **Layer 2 — Application check:** Every server-side query explicitly includes `mosque_id` from authenticated session
3. **Layer 3 — Role-aware RLS:** Viewer role restricted from mutations

### Encryption

| Data | At Rest | In Transit |
|---|---|---|
| All data | Supabase default encryption (AES-256) | TLS 1.3 |
| Donor PII (email, name) | Supabase encryption | TLS 1.3 |
| Passwords | Supabase Auth (bcrypt) | TLS 1.3 |

### PCI Compliance

Bunyan **never** sees or stores card data. All payment processing happens via Stripe Elements on Stripe's PCI DSS Level 1 certified infrastructure.

### GDPR / AVG

- EU-only hosting (Vercel ams1, Supabase EU)
- Data processing agreement with Supabase and Stripe
- Donor data deletion: treasurer can delete a donor → anonymize PII but preserve financial records (7-year retention per Dutch fiscal law)
- Cookie consent: minimal cookies (Supabase auth session), no tracking cookies on donation pages

### Webhook Security ✅

Stripe webhooks are verified using `stripe.webhooks.constructEvent()` with the `stripe-signature` header. This cryptographically verifies that the webhook came from Stripe.

### Rate Limiting ❌ TODO

- Donation creation: rate limit per IP (10 per minute per mosque) to prevent abuse
- Manual entry: rate limit per user session
- Webhook endpoint: no rate limit (Stripe controls the rate)

---

## 25. Testing Strategy 🟡

### Scope: Critical path only

Focus testing effort on code where bugs have financial or legal consequences.

### Unit Tests (Vitest) ✅

| Module | What to Test | Status |
|---|---|---|
| `lib/money.ts` | Cents ↔ euros conversion, formatting, rounding edge cases | ✅ |
| `lib/fees.ts` | Fee calculation for each payment method, cover-fees logic | ✅ |
| ANBI total calculation | Sum of donations per donor per year, fund breakdown aggregation | ❌ TODO |
| Donor identity resolution | Email matching, IBAN hint matching, dedup logic | ❌ TODO |

### Integration Tests (Vitest + Supabase local) ❌ TODO

| Flow | What to Test |
|---|---|
| Webhook processing | Idempotency (process same webhook twice), status transitions, donor creation |
| Stripe payment creation | Correct amount (including cover-fees), correct metadata |
| RLS isolation | **Critical**: User from mosque A cannot read mosque B's data. Test for every table. |
| Manual donation entry | Creates donation, audit log, updates donor aggregates |
| ANBI receipt generation | Correct totals, correct fund breakdown, PDF generated |

### What We Don't Test (MVP)

- UI component rendering (trust shadcn/ui)
- Dashboard layout
- E2E browser flows (test manually during pilot)
- Email delivery (trust Resend)

### Test Data ✅

Seed script creates:
- 2 mosques (for cross-tenant isolation tests)
- 5 funds per mosque
- 50 donations with various statuses, methods, and amounts
- 10 donors with varying completeness (some anonymous, some with email)
- 2 active recurring donations

---

## 26. Environments & Deployment ✅

### Three Environments

| Environment | Supabase | Stripe | Vercel | URL |
|---|---|---|---|---|
| Local | `supabase start` (Docker) | Test API keys | `next dev` | `localhost:3000` |
| Staging | Supabase Project #2 | Test API keys | Preview deploys | `staging.bunyan.io` |
| Production | Supabase Project #3 | Live API keys | Production deploy | `bunyan.io` |

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only (webhooks, cron)

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Client-side Stripe Elements
STRIPE_SECRET_KEY=                   # Server-side Stripe API
STRIPE_WEBHOOK_SECRET=               # Webhook signature verification

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=                # https://bunyan.io
NEXT_PUBLIC_DONATE_URL=             # https://bunyan.io/doneren

# Cron
CRON_SECRET=                        # Vercel cron job auth

# Sentry
SENTRY_DSN=
```

### CI/CD

- Push to `main` → Vercel auto-deploys to production
- Push to feature branch → Vercel preview deploy (connected to staging Supabase)
- Supabase migrations run via `supabase db push`
- Tests run in GitHub Actions before merge to main

### Cron Jobs ✅

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/reconcile", "schedule": "0 2 * * *" }
  ]
}
```

---

## 27. Performance Requirements

| Metric | Target | How Achieved | Status |
|---|---|---|---|
| Donation page load | < 2s on 4G | ISR/static generation, edge CDN, minimal JS | ✅ ISR implemented |
| Dashboard load | < 3s | SWR with stale cache, lazy-load charts | ✅ |
| Payment processing | < 1s to Stripe | Single API call, no extra processing | ✅ |
| Webhook processing | < 2s | Lean handler, async email sending | ✅ |
| ANBI PDF generation | < 2s per PDF | React-PDF server-side | ✅ |

---

## 28. Monitoring & Observability ❌ TODO

| Tool | Purpose | Status |
|---|---|---|
| Sentry | Error tracking, performance monitoring | ❌ Not configured |
| Vercel Analytics | Web Vitals, page performance | ❌ Not configured |
| PostHog / Plausible | Product analytics, feature usage | ❌ Not configured |
| Supabase Dashboard | Database metrics, RLS query performance | ✅ Built-in |

---

## 29. Build Phases

### Phase 0: Validation (Weeks 1-4) — No code ✅

- Mosque conversations
- Document pain points and ANBI requirements
- Research Belastingdienst ANBI receipt requirements (see Section 30)

### Phase 1: Foundation (Weeks 5-7) ✅ COMPLETE

**Deliverables (all done):**
- ✅ Supabase project setup (local + staging)
- ✅ Database schema (11 migrations)
- ✅ RLS policies + role-aware RLS
- ✅ Supabase Auth (email/password + magic link)
- ✅ Next.js project scaffold (App Router, Tailwind, shadcn/ui)
- ✅ Auth middleware for tenant resolution
- ✅ User ↔ mosque association
- ✅ Onboarding wizard (4 steps)
- ✅ Dashboard shell with sidebar + KPI cards

### Phase 2: Core Donation Flow (Weeks 8-10) 🟡 IN PROGRESS

**Done:**
- ✅ Stripe integration (PaymentIntents + Subscriptions)
- ✅ Donation page (fund selector, amount presets, Stripe Elements)
- ✅ Stripe webhook handler (idempotent, signature-verified)
- ✅ Donation confirmation/thank you page
- ✅ Manual donation entry (modal form + audit log)
- ✅ Cover-fees checkbox + calculation
- ✅ Donor creation/matching (email key)
- ✅ Fund CRUD (create/edit/archive)
- ✅ Campaign CRUD (create/edit/archive)
- ✅ Donor profiles + editing
- ✅ Recurring donations (Stripe Subscriptions)
- ✅ Self-service recurring cancellation
- ✅ Nightly reconciliation cron job
- ✅ ANBI receipt generation + preview + bulk ZIP download
- ✅ QR code creation + redirect tracking
- ✅ Plan enforcement + upgrade banners
- ✅ Audit log

**Not done:**
- 🟡 Email sending (templates ready, Resend domain not configured)
- 🟡 Team invite flow (scaffolded, not fully wired)
- ❌ Donation page mobile optimization pass

### Phase 3: Dashboard & Reporting (Weeks 11-12) ✅ MOSTLY COMPLETE

**Done:**
- ✅ Dashboard layout (sidebar, KPI cards)
- ✅ KPI calculations (total, MRR, avg gift, new donors)
- ✅ Monthly donation chart (Recharts)
- ✅ Fund breakdown chart (Recharts)
- ✅ Recent donations feed
- ✅ Donation list with filters and search
- ✅ Donor list with profiles and donation history
- ✅ SWR data fetching
- ✅ Loading skeletons (Suspense boundaries)

### Phase 4: ANBI, Campaigns & QR (Weeks 13-14) ✅ MOSTLY COMPLETE

**Done:**
- ✅ ANBI receipt PDF template (React-PDF)
- ✅ ANBI page: year selector, preview, generate, download ZIP
- ✅ Recurring donations (Stripe Subscriptions)
- ✅ Self-service cancellation page
- ✅ Campaign CRUD + pages
- ✅ QR code system (short URLs, redirect, management UI)
- ✅ Nightly reconciliation job

**Not done:**
- ❌ Bulk PDF generation queue (Supabase Edge Functions) — currently sequential
- ❌ QR poster PDF generation (A4 printable poster)
- 🟡 ANBI email sending (template ready, Resend blocked)

### Phase 5: Polish & Pilot (Weeks 15-16) ❌ NOT STARTED

**TODO:**
- ❌ Mobile optimization pass on donation page
- ❌ Onboarding UX polish
- ❌ i18n (full Turkish + Arabic translations)
- ❌ Settings page polish (branding upload, Stripe status)
- ❌ Bug fixes from internal testing
- ❌ Pilot deployment with 3-5 mosques

### Phase 6: Launch (Week 17+) ❌ NOT STARTED

**TODO:**
- ❌ Marketing site (`bunyan.io`)
- ❌ Pricing page + subscription billing (Stripe)
- ❌ Sentry + analytics setup
- ❌ Production Supabase project
- ❌ DNS setup
- ❌ First paying customer

---

## 30. ANBI Research Findings

### 30.1 Receipt Requirements (Resolved) ✅

The Belastingdienst does **not** mandate a specific receipt template. However, an ANBI gift receipt ("schenkingsbewijs" / "jaaroverzicht giften") must include:

| Field | Required | Notes |
|---|---|---|
| Organization name + full address | Yes | As registered with KvK |
| RSIN number | Yes | Tax registration identifier |
| Donor full name | Yes | Must match Belastingdienst records |
| Calendar year | Yes | Period the receipt covers |
| Total amount donated | Yes | Sum of all gifts in the calendar year |
| Breakdown per fund | Recommended | Not strictly required but best practice for transparency |
| Statement of ANBI status | Yes | e.g. "Stichting X is aangemerkt als ANBI" |
| Date of issue | Yes | When the receipt was generated |
| Signature / stamp | No | Not required for digital receipts |

**Digital receipts (PDF via email) are fully valid** — no need for physical signatures or stamps.

### 30.2 Cash Donations Are NOT Tax-Deductible ✅

**Critical finding:** Per the Belastingdienst, cash donations (contante giften) are **not** deductible for income tax purposes. Only donations made via verifiable bank transfer (overschrijving) are eligible for ANBI tax deductions.

**Implementation:** ANBI receipt generation query filters `method != 'cash'`. Cash donations appear in dashboard/reports but not on ANBI receipts.

### 30.3 Periodieke Schenking vs. Gewone Gift

- **Gewone gift (regular gift):** One-time or irregular donations. Deductible above a threshold (1% of income, min €60).
- **Periodieke schenking (periodic gift):** Committed recurring gift for 5+ years, documented in a "schenkingsakte" (gift agreement). Fully deductible with no threshold.

**For MVP:** Recurring Stripe Subscriptions do **not** automatically qualify as "periodieke schenkingen" — that requires a formal 5-year commitment agreement. Our recurring donations are treated as regular gifts. Supporting periodieke schenkingen is a **post-MVP feature**.

### 30.4 Data Retention

Dutch fiscal law (AWR) requires financial administration records to be retained for **7 years**. This means:
- Donation records must not be hard-deleted within 7 years
- GDPR "right to erasure" conflicts: we anonymize donor PII but preserve financial records
- Our data deletion approach: anonymize donor name/email/phone but retain donation amounts, dates, and fund allocations

### 30.5 Remaining Open Items (Validate in Phase 0)

1. **Percentage of Dutch mosques with ANBI status** — validate during mosque interviews
2. **Appetite for schenkingsakte generation** — gauge interest in periodic gift support as post-MVP feature

---

*End of Technical Specification — Version 2.0 — March 2026*
