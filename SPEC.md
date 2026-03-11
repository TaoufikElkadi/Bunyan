# Bunyan — Technical Specification
## All-in-One Mosque Donation Management Platform

**Version:** 1.0
**Date:** March 2026
**Status:** Pre-implementation
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
8. [Payment Architecture (Mollie Connect)](#8-payment-architecture-mollie-connect)
9. [Donation Flow](#9-donation-flow)
10. [Webhook Processing](#10-webhook-processing)
11. [Donor Identity Resolution](#11-donor-identity-resolution)
12. [ANBI Tax Receipts](#12-anbi-tax-receipts)
13. [PDF Generation Pipeline](#13-pdf-generation-pipeline)
14. [Email Infrastructure](#14-email-infrastructure)
15. [QR Code System](#15-qr-code-system)
16. [Internationalization (i18n)](#16-internationalization-i18n)
17. [Recurring Donations (SEPA)](#17-recurring-donations-sepa)
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

## 1. Executive Summary

Bunyan is a multi-tenant SaaS platform that replaces the Dutch mosque treasurer's entire donation workflow. The MVP focuses exclusively on the donation lifecycle: accept donations (online + manual) → track them → report on them → generate ANBI tax receipts.

**Product name:** Bunyan (all user-facing, technical assets, domains, and vendor registrations use "bunyan")

**Core value proposition:** One system that tracks ALL donations (digital + cash + bank transfer) and generates ANBI tax receipts automatically.

### Key Architectural Decisions (from interview)

| Decision | Choice | Rationale |
|---|---|---|
| App structure | Monorepo, single Next.js app | Solo dev, shared DB layer, one deploy |
| Database | Supabase (free → Pro) | Managed Postgres, built-in RLS, auth, storage, realtime |
| Auth | Supabase Auth | No extra vendor, RLS integration, zero cost |
| ORM | Supabase SDK only (no ORM) | Minimal stack, RLS enforcement built-in |
| Payments | Mollie Connect (OAuth) | Native iDEAL, Dutch company, SEPA mandates |
| Multi-tenancy | Shared schema + RLS, pure isolation | Simplest approach, adapt later for cross-tenant features |
| Data fetching | SWR / TanStack Query | Revalidation on focus + intervals, no WebSocket complexity |
| i18n | Simple JSON + React context | Small string count, no library dependency |
| Email | Resend (free → Pro) | Good DX with React Email, upgrade when volume grows |
| PDF | React-PDF + queue (Supabase Edge Functions) | Avoids serverless timeouts for bulk generation |
| Hosting | Vercel (EU region: ams1) | Edge deployment from Amsterdam, serverless scaling |
| Money | Integer cents everywhere | Mollie uses cents, eliminates floating-point errors |
| Testing | Critical path unit + integration tests | Financial calculations and webhook processing |
| Environments | Local + Staging (Supabase #2) + Production (Supabase #3) | Two Supabase projects for staging/prod |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (ams1)                         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Donation     │  │  Dashboard   │  │  API Routes  │  │
│  │  Pages (SSG)  │  │  (SSR/CSR)   │  │  + Webhooks  │  │
│  │  /[slug]/*    │  │  /app/*      │  │  /api/*      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│  ┌──────┴──────────────────┴──────────────────┴───────┐ │
│  │              Next.js Middleware                      │ │
│  │         (tenant resolution via slug)                 │ │
│  └─────────────────────┬───────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Supabase    │ │  Mollie      │ │  Resend      │
│  (Postgres   │ │  Connect     │ │  (Email)     │
│   + Auth     │ │  (Payments)  │ │              │
│   + Storage) │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Two distinct frontend surfaces in one app:**
- **Public donation pages** (`[slug].bunyan.nl`): Static/ISR, mobile-first, SEO-optimized, edge-cached
- **Treasurer dashboard** (`app.bunyan.nl`): Interactive, data-heavy, authenticated, SWR-driven

---

## 3. Tech Stack

| Layer | Technology | Version/Notes |
|---|---|---|
| Framework | Next.js (App Router) | 15+ with TypeScript |
| Styling | Tailwind CSS | v4+ |
| UI Components | shadcn/ui | Copy-paste components, fully customizable |
| Database | PostgreSQL via Supabase | Free tier → Pro at launch |
| Data access | Supabase JS SDK (`@supabase/supabase-js`) | No ORM — SDK for all queries |
| Auth | Supabase Auth | Email/password + magic links |
| File storage | Supabase Storage | ANBI PDFs, mosque logos, campaign banners |
| Payments | Mollie API + Mollie Connect (OAuth) | iDEAL, cards, SEPA Direct Debit |
| Email | Resend + React Email | Transactional emails with JSX templates |
| PDF generation | `@react-pdf/renderer` | Server-side, queued for bulk |
| Data fetching | SWR or TanStack Query | Client-side with revalidation |
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

---

## 4. Project Structure

```
bunyan/
├── src/
│   ├── app/
│   │   ├── (public)/              # Donation pages (no auth)
│   │   │   ├── [slug]/            # [slug].bunyan.nl
│   │   │   │   ├── page.tsx       # Main donation page
│   │   │   │   ├── [campaign]/    # Campaign pages (e.g. /ramadan)
│   │   │   │   └── bevestiging/   # Confirmation page
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/           # Treasurer dashboard (auth required)
│   │   │   ├── dashboard/         # KPIs, charts, feed
│   │   │   ├── donaties/          # Donation list + manual entry
│   │   │   ├── donateurs/         # Donor list + profiles
│   │   │   ├── fondsen/           # Fund management
│   │   │   ├── campagnes/         # Campaign management
│   │   │   ├── anbi/              # ANBI receipt generation
│   │   │   ├── instellingen/      # Settings
│   │   │   └── layout.tsx         # Dashboard shell with sidebar
│   │   ├── (auth)/                # Login, signup, onboarding
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── onboarding/        # 4-step wizard
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   └── mollie/        # Mollie webhook handler
│   │   │   ├── donations/         # Donation CRUD
│   │   │   ├── mollie/            # Mollie OAuth + payment creation
│   │   │   ├── anbi/              # PDF generation queue
│   │   │   ├── qr/                # QR code + short URL redirect
│   │   │   └── cron/              # Reconciliation jobs
│   │   ├── give/                  # Short URL redirect (give.bunyan.nl/abc123)
│   │   │   └── [code]/
│   │   └── layout.tsx             # Root layout
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── donation/              # Donation page components
│   │   ├── dashboard/             # Dashboard components
│   │   └── shared/                # Shared components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client
│   │   │   ├── server.ts          # Server client (with cookie handling)
│   │   │   ├── admin.ts           # Service role client (for webhooks)
│   │   │   └── middleware.ts      # Tenant resolution
│   │   ├── mollie/
│   │   │   ├── client.ts          # Mollie API wrapper
│   │   │   ├── connect.ts         # OAuth flow
│   │   │   ├── payments.ts        # Create/get payments
│   │   │   └── fees.ts            # Fee calculation
│   │   ├── email/
│   │   │   ├── send.ts            # Resend wrapper
│   │   │   └── templates/         # React Email templates
│   │   ├── pdf/
│   │   │   └── anbi-receipt.tsx   # React-PDF ANBI template
│   │   ├── money.ts               # Cents ↔ euros utilities
│   │   ├── i18n/
│   │   │   ├── context.tsx        # Language context provider
│   │   │   ├── translations/
│   │   │   │   ├── nl.json
│   │   │   │   ├── en.json
│   │   │   │   ├── tr.json
│   │   │   │   └── ar.json
│   │   │   └── use-translation.ts # Hook
│   │   └── utils.ts               # Shared utilities
│   ├── hooks/                     # Custom React hooks
│   ├── types/
│   │   ├── database.ts            # Generated Supabase types
│   │   └── index.ts               # Shared types
│   └── middleware.ts               # Next.js middleware (tenant resolution)
├── supabase/
│   ├── migrations/                # SQL migrations
│   ├── seed.sql                   # Development seed data
│   └── config.toml                # Supabase local config
├── tests/
│   ├── unit/                      # Financial calculations, money utils
│   ├── integration/               # Webhook processing, Mollie flows
│   └── fixtures/                  # Test data
├── public/                        # Static assets
├── .env.local                     # Local env vars
├── .env.staging                   # Staging env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Database Schema

All monetary values stored as **integer cents** (e.g. €25.50 = 2550).

### Tables

```sql
-- ============================================================
-- MOSQUES (tenant table)
-- ============================================================
CREATE TABLE mosques (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,        -- used in subdomain: [slug].bunyan.nl
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
  mollie_org_id     TEXT,                    -- Mollie organization ID
  mollie_access_token TEXT,                  -- encrypted OAuth access token
  mollie_refresh_token TEXT,                 -- encrypted OAuth refresh token
  mollie_connected_at TIMESTAMPTZ,
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
-- RECURRINGS (SEPA mandates) — created before donations
-- because donations.recurring_id references this table
-- ============================================================
CREATE TABLE recurrings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id           UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  donor_id            UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  fund_id             UUID NOT NULL REFERENCES funds(id),
  amount              INTEGER NOT NULL,        -- in cents
  frequency           TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  mollie_mandate_id   TEXT,
  mollie_customer_id  TEXT,
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  next_charge_at      TIMESTAMPTZ,
  cancel_token        TEXT UNIQUE,             -- for self-service cancellation links
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurrings_mosque ON recurrings(mosque_id);
CREATE INDEX idx_recurrings_donor ON recurrings(donor_id);
CREATE INDEX idx_recurrings_cancel ON recurrings(cancel_token);

-- ============================================================
-- DONATIONS
-- ============================================================
CREATE TABLE donations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id         UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  donor_id          UUID REFERENCES donors(id) ON DELETE SET NULL,
  fund_id           UUID NOT NULL REFERENCES funds(id),
  amount            INTEGER NOT NULL,          -- in cents
  fee_covered       INTEGER DEFAULT 0,         -- donor-covered fee in cents
  currency          TEXT DEFAULT 'EUR',
  method            TEXT NOT NULL CHECK (method IN ('ideal', 'card', 'sepa', 'cash', 'bank_transfer')),
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  is_recurring      BOOLEAN DEFAULT FALSE,
  recurring_id      UUID REFERENCES recurrings(id) ON DELETE SET NULL,
  mollie_payment_id TEXT UNIQUE,               -- nullable for manual entries
  notes             TEXT,                       -- for manual entries
  created_by        UUID REFERENCES users(id), -- null for online, user_id for manual
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_mosque ON donations(mosque_id);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_fund ON donations(fund_id);
CREATE INDEX idx_donations_status ON donations(mosque_id, status);
CREATE INDEX idx_donations_created ON donations(mosque_id, created_at DESC);
CREATE INDEX idx_donations_mollie ON donations(mollie_payment_id);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id       UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  fund_id         UUID NOT NULL REFERENCES funds(id),
  title           TEXT NOT NULL,
  description     TEXT,
  slug            TEXT NOT NULL,               -- e.g. "ramadan" → [mosque].bunyan.nl/ramadan
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
-- AUDIT LOG (for manual donation entries and donor linking)
-- ============================================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id   UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  action      TEXT NOT NULL,                   -- 'manual_donation', 'donor_link', 'donor_merge', etc.
  entity_type TEXT NOT NULL,                   -- 'donation', 'donor', etc.
  entity_id   UUID NOT NULL,
  details     JSONB,                           -- action-specific details
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_mosque ON audit_log(mosque_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- ============================================================
-- PLAN USAGE TRACKING (for free tier limits)
-- ============================================================
CREATE TABLE plan_usage (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id         UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  month             DATE NOT NULL,             -- first day of month
  online_donations  INTEGER DEFAULT 0,         -- count of online donations this month
  UNIQUE(mosque_id, month)
);

CREATE INDEX idx_usage_mosque_month ON plan_usage(mosque_id, month);
```

### Row-Level Security Policies

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

-- ============================================================
-- PUBLIC ACCESS (donation pages — no auth required)
-- ============================================================

-- Funds: public can read active funds (names/descriptions are not sensitive)
-- Note: this exposes ALL mosques' funds, not just the current tenant's.
-- Acceptable because fund names are non-sensitive. The application layer
-- filters by mosque_id via the slug, so donors only see their mosque's funds.
CREATE POLICY "Public can read active funds"
  ON funds FOR SELECT
  USING (is_active = TRUE);

-- Mosques: expose ONLY safe public fields via a view.
-- The mosques table contains sensitive columns (mollie_access_token,
-- mollie_refresh_token) so we CANNOT use a blanket public SELECT policy.
-- Instead: RLS blocks unauthenticated reads, and we expose a view.
CREATE POLICY "Authenticated users read own mosque"
  ON mosques FOR SELECT
  USING (id = get_user_mosque_id());

-- Public view for donation pages (excludes Mollie tokens and internal fields)
CREATE VIEW public_mosques AS
  SELECT id, name, slug, city, logo_url, banner_url, primary_color,
         welcome_msg, anbi_status, rsin, language
  FROM mosques;

-- Grant public access to the view (Supabase anon role)
GRANT SELECT ON public_mosques TO anon;

-- Campaigns: public can read active campaigns (same rationale as funds)
CREATE POLICY "Public can read active campaigns"
  ON campaigns FOR SELECT
  USING (is_active = TRUE);
```

### Cached Aggregates

The `donors` table has cached `total_donated` and `donation_count` fields. These are updated via a PostgreSQL trigger:

```sql
CREATE OR REPLACE FUNCTION update_donor_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.donor_id IS NOT NULL AND NEW.status = 'completed' THEN
    UPDATE donors SET
      total_donated = (
        SELECT COALESCE(SUM(amount), 0)
        FROM donations
        WHERE donor_id = NEW.donor_id AND status = 'completed'
      ),
      donation_count = (
        SELECT COUNT(*)
        FROM donations
        WHERE donor_id = NEW.donor_id AND status = 'completed'
      ),
      last_donated_at = NOW(),
      first_donated_at = COALESCE(
        (SELECT MIN(created_at) FROM donations WHERE donor_id = NEW.donor_id AND status = 'completed'),
        NOW()
      ),
      updated_at = NOW()
    WHERE id = NEW.donor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_donation_update_donor
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_donor_aggregates();
```

---

## 6. Multi-Tenancy

### Strategy: Shared schema + RLS (pure isolation)

- Single PostgreSQL database with `mosque_id` foreign key on every tenant table
- Supabase Row-Level Security enforces data isolation at the database level
- **No cross-tenant features in MVP** — if needed later, add explicit shared tables or a service layer
- Scales to thousands of mosques without operational overhead

### Subdomain Routing

Each mosque gets `[slug].bunyan.nl` for their public donation page.

**Middleware flow:**
1. Next.js middleware extracts hostname from request
2. Parses slug from subdomain (e.g. `alfath.bunyan.nl` → slug = `alfath`)
3. Queries Supabase for mosque by slug (direct DB query, no caching for MVP — ~5-10ms with indexed slug)
4. Injects `mosqueId` into request headers / cookies for downstream use
5. If slug not found → redirect to `bunyan.nl` marketing site

```
Request: alfath.bunyan.nl/ramadan
  → Middleware: slug = "alfath" → mosque_id = "uuid-xxx"
  → Route: /[slug]/[campaign] with mosque context
```

**Dashboard routing:**
- `app.bunyan.nl` is the authenticated dashboard
- Middleware checks Supabase Auth session
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

Automated tests verify cross-tenant isolation (see Testing section).

---

## 7. Authentication & Authorization

### Stack: Supabase Auth

- **Treasurer auth:** Email/password + magic link option
- **Donor auth:** None — donors don't have accounts. Identity is by email + optional IBAN hint.
- **Session:** Supabase handles JWT tokens via `@supabase/ssr` for cookie-based session management in Next.js

### Roles

| Role | Permissions |
|---|---|
| `admin` | Full access: CRUD all data, settings, team management, ANBI export, Mollie connection |
| `viewer` | Read-only: dashboard, donation list, donor list. Cannot edit settings, export data, or manage team |

### Auth Flow

1. Treasurer signs up → Supabase Auth creates `auth.users` entry
2. Onboarding creates `mosques` row + `users` row (linking auth.user to mosque)
3. Inviting team members: admin sends invite email → new user signs up → linked to same mosque
4. Magic links for passwordless login (Supabase Auth built-in)

### Session in Server Components

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

## 8. Payment Architecture (Mollie Connect)

### Overview

Mollie Connect (OAuth) is the payment backbone. Each mosque connects their own Mollie account. Money flows directly to the mosque — Bunyan never holds funds.

### OAuth Flow

1. Treasurer clicks "Connect Mollie" in settings or onboarding
2. Redirect to Mollie OAuth: `https://my.mollie.com/oauth2/authorize?client_id=...&redirect_uri=...&scope=payments.read+payments.write+refunds.read+organizations.read+mandates.read+mandates.write+subscriptions.read+subscriptions.write`
3. Treasurer approves in their Mollie dashboard
4. Callback receives authorization code → exchange for access + refresh tokens
5. Store encrypted tokens in `mosques` table
6. Mosque's donation page is now live for online payments

### Token Management

- Access tokens expire (typically 1 hour)
- Refresh tokens are long-lived
- On each Mollie API call, check if access token is expired → refresh automatically
- Store tokens encrypted at rest (Supabase Vault or application-level encryption via AES-256)

### Revenue Model (MVP)

**SaaS subscription + application fee:**
- Application fee: €0.10 per successful online donation (Starter/Growth), €0.15 (Free)
- Mollie routes the application fee to Bunyan's Mollie account automatically
- Subscription: €0/€29/€49 per month (see Pricing section)

### Mollie Disconnection Handling

When a mosque disconnects Mollie or their account is suspended:
1. **Immediately pause** all active recurring donations (`recurrings.status = 'paused'`)
2. **Send urgent email** to all mosque admins
3. **Show dashboard alert** (persistent banner until resolved)
4. **Donation page** shows bank transfer info (IBAN) as fallback
5. Manual donations still work
6. When reconnected, recurring donations can be manually reactivated by treasurer

---

## 9. Donation Flow

### Online Donation (happy path)

```
Donor visits alfath.bunyan.nl
  → Selects fund (e.g. "Zakat")
  → Enters amount (€25) or picks preset
  → Optionally: name + email (for ANBI receipt)
  → Optionally: checks "Cover processing fee" → total becomes €25.29
  → Selects payment method (iDEAL)
  → [API] POST /api/donations/create
      - Creates Donation record (status: pending)
      - Creates Mollie payment via mosque's access token
      - Application fee set on Mollie payment
      - Returns Mollie checkout URL
  → Donor redirected to iDEAL (bank environment)
  → Donor completes payment
  → Mollie sends webhook → /api/webhooks/mollie
      - Verify payment status
      - Update Donation record (status: completed)
      - Create/update Donor record if email provided
      - Increment plan_usage.online_donations
      - Send confirmation email via Resend
  → Donor redirected to alfath.bunyan.nl/bevestiging
      - Shows "Jazak Allahu Khairan" + donation summary
      - Option to donate again
```

### Manual Donation Entry

```
Treasurer opens /app/donaties → clicks "+ Handmatige donatie"
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

### "Cover Fees" Calculation

Simple addition approach:

```typescript
// lib/mollie/fees.ts
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
// The mosque receives ~€25.00 after Mollie's actual fee
// Not mathematically perfect (simple add, not gross-up) but close enough
```

---

## 10. Webhook Processing

### Design Principles

1. **Idempotent**: Processing the same webhook twice produces the same result
2. **Reconciliation**: Nightly job catches any missed webhooks

### Webhook Handler

```
POST /api/webhooks/mollie
  Body: { id: "tr_xxx" }

  1. Fetch payment details from Mollie API (using mosque's token)
     - The payment metadata contains mosque_id (set when creating payment)
  2. Find existing Donation by mollie_payment_id
  3. If not found → log error, create missing record
  4. If found and status unchanged → return 200 (idempotent)
  5. If status changed:
     - Update donation.status
     - If status = 'completed':
       - Update/create donor record
       - Update donor aggregates (via trigger)
       - Increment plan_usage counter
       - Queue confirmation email
     - If status = 'failed' or 'refunded':
       - Update donation.status
       - Recalculate donor aggregates
  6. Return 200
```

### Nightly Reconciliation

A Supabase pg_cron job (or Vercel cron) runs daily at 03:00 CET:

1. For each mosque with an active Mollie connection:
2. Fetch all Mollie payments from the last 48 hours
3. Compare against `donations` table by `mollie_payment_id`
4. Any payment in Mollie but missing in DB → create donation record + alert
5. Any payment with mismatched status → update and log discrepancy

This is the safety net — webhooks handle 99.9% of cases, reconciliation catches the rest.

---

## 11. Donor Identity Resolution

### Strategy: Email as canonical key + IBAN hint

**Email is the unique identifier per mosque.** When a donation includes an email that matches an existing donor for that mosque, it auto-links.

**IBAN hint for identity suggestions:**
- When Mollie processes an iDEAL payment, the API response includes the consumer's IBAN (partially masked) and account holder name
- We store the last 4 digits of the IBAN as `iban_hint` on the donor record
- When a new donation arrives with an IBAN that matches an existing donor but the email differs (or is absent), we create a **dashboard notification** suggesting a possible match
- The treasurer manually confirms or dismisses the match — no auto-merge

**Manual linking flow (for anonymous → identified):**
1. Treasurer opens donor profile
2. Clicks "Link donations"
3. Searches for unlinked/anonymous donations by date, amount, or IBAN hint
4. Selects donations to link
5. System creates `audit_log` entry recording the link action, who did it, and when

**Duplicate prevention:**
- Before creating a new donor, check for existing donor with same email in that mosque
- If found, link the donation to existing donor
- If not found, create new donor record

---

## 12. ANBI Tax Receipts

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

**Important: Cash donations are excluded.** Per the Belastingdienst, cash gifts (contante giften) are not tax-deductible. Only donations via verifiable bank transfer are eligible. The ANBI receipt query **must** filter `method != 'cash'`. Manually entered bank transfers are included only if they have a reference number. This is a key selling point for digital donations through Bunyan.

### Generation Flow

1. Treasurer navigates to `/app/anbi`
2. Selects year (e.g. 2026)
3. System queries all completed donations for that mosque + year, **excluding cash donations** (`method != 'cash'`), grouped by donor
4. Displays preview: list of donors with total amount
5. Treasurer clicks "Generate all receipts"
6. Backend queues a PDF generation job per donor (see PDF Pipeline section)
7. Progress shown in real-time (polling)
8. When complete:
   - All PDFs stored in Supabase Storage
   - `anbi_receipts` records created
   - "Email all" button becomes active
   - "Download ZIP" button becomes active

### Receipt PDF Content

```
┌─────────────────────────────────────────┐
│  [Mosque Logo]                          │
│  JAARLIJKSE GIFTENVERKLARING           │
│                                         │
│  Organisatie: Stichting Al-Fath         │
│  RSIN: 123456789                        │
│  Adres: Kerkstraat 1, 1234 AB Amsterdam│
│  ANBI-status: Ja                        │
│                                         │
│  Donateur: Ahmed de Vries               │
│  Periode: 1 januari 2026 –             │
│           31 december 2026              │
│                                         │
│  Overzicht giften:                      │
│  ┌──────────┬───────────┬──────────┐   │
│  │ Fonds    │ Bedrag    │ Aantal   │   │
│  ├──────────┼───────────┼──────────┤   │
│  │ Algemeen │ € 450,00  │ 12       │   │
│  │ Zakat    │ € 200,00  │ 1        │   │
│  ├──────────┼───────────┼──────────┤   │
│  │ Totaal   │ € 650,00  │ 13       │   │
│  └──────────┴───────────┴──────────┘   │
│                                         │
│  Datum uitgifte: 15 januari 2027        │
│                                         │
│  Gegenereerd door Bunyan                │
└─────────────────────────────────────────┘
```

---

## 13. PDF Generation Pipeline

### Problem

Bulk ANBI receipt generation (200+ PDFs) exceeds Vercel serverless timeouts.

### Solution: React-PDF + Supabase Edge Functions queue

**Architecture:**

```
Treasurer clicks "Generate All"
  → API creates a batch job record
  → For each donor, inserts a row into `pdf_jobs` table
  → Supabase Edge Function (or pg_cron triggered function) picks up jobs
  → Each job:
      1. Query donor's donations for the year
      2. Render React-PDF template to buffer
      3. Upload PDF to Supabase Storage
      4. Update anbi_receipts record with pdf_url
      5. Mark job as complete
  → Frontend polls batch job status via SWR
  → When all jobs complete, show "Done" + download/email buttons
```

**`pdf_jobs` table (internal, not tenant-facing):**

```sql
CREATE TABLE pdf_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id   UUID NOT NULL,
  donor_id    UUID NOT NULL,
  year        INTEGER NOT NULL,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

Each Edge Function invocation processes one PDF (~500ms). Supabase can handle parallel invocations, so 200 PDFs complete in ~1-2 minutes.

---

## 14. Email Infrastructure

### Stack: Resend + React Email

**Free tier (pilot):** 100 emails/day, 1 domain
**Pro tier (launch):** €20/month, 50k emails/month

### Email Types

| Email | Trigger | Template |
|---|---|---|
| Donation confirmation | Webhook: payment completed + donor has email | Amount, fund, mosque name, date, transaction ref |
| ANBI receipt | Treasurer bulk-sends from /anbi | Year, total amount, PDF attachment |
| Team invite | Admin invites new member | Magic link to create account |
| Mollie disconnected | Mollie OAuth revoked or account suspended | Urgent: reconnect your payment account |
| Free tier limit warning | Online donations exceed 15/month | Upgrade prompt |
| Recurring cancellation | Donor self-cancels | Confirmation of SEPA mandate revocation |

### Email Architecture

```typescript
// lib/email/send.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDonationConfirmation(params: {
  to: string;
  mosqueName: string;
  amount: number;      // cents
  fundName: string;
  method: string;
  date: string;
  isRecurring: boolean;
  frequency?: string;
}) {
  await resend.emails.send({
    from: `${params.mosqueName} via Bunyan <noreply@bunyan.nl>`,
    to: params.to,
    subject: `Bedankt voor uw donatie aan ${params.mosqueName}`,
    react: DonationConfirmationEmail(params),
  });
}
```

---

## 15. QR Code System

### Strategy: Short redirect URLs with fund deep linking

Each QR code encodes a short URL: `give.bunyan.nl/abc123?fund=zakat`

**Benefits:**
- URL can be updated without reprinting poster
- Scan analytics (increment `qr_links.scan_count`)
- Fund-specific posters (pre-selects fund on donation page)

### Redirect Flow

```
Donor scans QR → give.bunyan.nl/abc123?fund=zakat
  → API looks up qr_links by code
  → Increments scan_count
  → Redirects to: alfath.bunyan.nl?fund=zakat (302)
```

### Poster Generation

Treasurer clicks "Generate QR Poster" → selects fund (optional) → downloads A4 PDF:

```
┌─────────────────────────────┐
│    [Mosque Logo]            │
│                             │
│    Doneer aan Al-Fath       │
│                             │
│    ┌─────────────────┐      │
│    │   [QR CODE]     │      │
│    │                 │      │
│    └─────────────────┘      │
│                             │
│    Scan om te doneren       │
│    via iDEAL                │
│                             │
│    Fonds: Zakat             │
│    bunyan.nl                │
└─────────────────────────────┘
```

Generated client-side using `@react-pdf/renderer` + `qrcode` package. No server needed.

---

## 16. Internationalization (i18n)

### Approach: Simple JSON files + React context

**Scope:** Donor-facing pages only. Dashboard is Dutch/English only.

### Supported Languages

| Code | Language | Direction |
|---|---|---|
| `nl` | Dutch | LTR |
| `en` | English | LTR |
| `tr` | Turkish | LTR |
| `ar` | Arabic | RTL (text only) |

### RTL Support

**Text-only RTL** for Arabic:
- Arabic text renders right-to-left within its containers (`dir="rtl"` on text elements)
- Overall page layout remains LTR (grid, flex direction, icons stay in place)
- Form inputs get `dir="rtl"` when Arabic is active
- This is sufficient for a Dutch-Arabic bilingual audience who are accustomed to LTR interfaces

### Implementation

```typescript
// lib/i18n/context.tsx
type Locale = 'nl' | 'en' | 'tr' | 'ar';

const TranslationContext = createContext<{
  t: (key: string) => string;
  locale: Locale;
  dir: 'ltr' | 'rtl';
}>(...);

// lib/i18n/translations/nl.json
{
  "donate.title": "Doneer aan {{mosqueName}}",
  "donate.amount": "Bedrag",
  "donate.fund": "Kies een fonds",
  "donate.submit": "Doneer {{amount}}",
  "donate.cover_fees": "Dek de transactiekosten",
  "donate.anonymous": "Anoniem doneren",
  "donate.email_hint": "Voor uw ANBI-belastingontvangst",
  "confirm.title": "Jazak Allahu Khairan",
  "confirm.subtitle": "Uw donatie is ontvangen",
  ...
}
```

The mosque's `language` setting determines the default locale for their donation page. Donors can switch language via a selector in the footer.

---

## 17. Recurring Donations (SEPA)

### Flow

1. Donor selects "Maandelijks" (monthly) on donation page
2. First payment is a normal iDEAL payment (creates a Mollie customer + first-payment mandate)
3. Mollie stores the SEPA Direct Debit mandate
4. Bunyan creates `recurrings` record with `mollie_mandate_id` and `mollie_customer_id`
5. Subsequent charges are created by Bunyan via Mollie API (subscription or manual recurring payment)
6. Each charge creates a new `donations` record linked to the `recurrings` record

### Self-Service Cancellation

Every confirmation email and recurring-related email includes a cancellation link:

```
https://app.bunyan.nl/cancel/[cancel_token]
```

**Cancellation page flow:**
1. Validate `cancel_token` against `recurrings` table
2. Show current recurring details (amount, frequency, fund, mosque)
3. "Annuleer" button
4. On confirm:
   - Revoke Mollie mandate via API
   - Set `recurrings.status = 'cancelled'`
   - Send cancellation confirmation email to donor
   - Dashboard shows the cancellation

**Treasurer can also cancel** from the dashboard (same Mollie API call).

### Mollie Disconnection → Pause Recurring

When Mollie is disconnected:
1. Set all `recurrings.status = 'paused'` for that mosque
2. When Mollie is reconnected, treasurer must manually review and reactivate
3. Mandates may need to be re-established depending on how long the disconnection lasted

---

## 18. Dashboard & Data Fetching

### Strategy: SWR with revalidation

No WebSocket/Realtime for MVP. SWR provides:
- Data revalidation on window focus (treasurer switches back to tab → fresh data)
- Interval-based revalidation (configurable, e.g. 60s for dashboard)
- Stale-while-revalidate for instant UI with background refresh
- Built-in error handling and retry

### Dashboard KPIs

```typescript
// 4 KPI cards at top of dashboard
interface DashboardKPIs {
  totalThisMonth: number;      // cents — sum of completed donations this month
  recurringMRR: number;        // cents — sum of active monthly recurring amounts
  averageGift: number;         // cents — average donation amount this month
  newDonors: number;           // count of donors with first_donated_at this month
  // Each with comparison to previous month (% change)
}
```

### Dashboard Queries (all filtered by mosque_id)

| Widget | Query | Revalidation |
|---|---|---|
| KPI cards | Aggregate query on donations + recurrings | 60s interval |
| Monthly chart | Group by month, last 12 months | 5min interval |
| Fund breakdown | Group by fund_id, current month | 60s interval |
| Recent donations | Last 20, ordered by created_at DESC | 30s interval |
| Quick actions | Static UI — no data fetch | N/A |

---

## 19. Donation Page Architecture

### Performance Target: < 2 seconds on 4G mobile

**Strategy: Static generation (ISR) + edge caching**

- Donation pages are statically generated at build time (or on first request with ISR)
- Mosque data (name, logo, colors, funds, language) is fetched at build time
- Revalidation: every 5 minutes (ISR) — fund changes appear within 5 min
- Only dynamic part: the payment creation API call (server-side)
- All static assets (images, CSS, JS) served from Vercel Edge CDN

### Mobile-First Design

- 80%+ of donors use phones (during/after prayer)
- Touch-friendly: minimum 48px tap targets
- Preset amount buttons are large and easy to tap
- iDEAL is the default/primary payment method (most common in NL)
- Minimal form fields: fund, amount, (optional) name + email
- Single-page flow — no multi-step wizard for donating

### Fund Selector UX

**Grid + overflow pattern:**
- Display top 4-6 funds as visual cards in a responsive grid (2 columns on mobile)
- Each card: icon + name + short description
- If mosque has >6 funds: "Meer fondsen" expandable section
- Mosque controls sort order in fund management
- Selected fund highlighted with mosque's primary color

---

## 20. Fund Management UX

### Default Funds (pre-created during onboarding)

1. **Algemeen** (General) — default fund if donor doesn't select
2. **Zakat** — obligatory charity
3. **Sadaqah** — voluntary charity

Treasurer can rename, reorder, add, or archive funds. Archived funds are hidden from the donation page but their historical data is preserved.

### Fund Goal + Progress

Optional per fund:
- `goal_amount` (integer cents)
- `goal_deadline` (date)
- Shown as progress bar on donation page and campaign pages
- Progress = sum of completed donations for this fund / goal_amount

---

## 21. Onboarding Flow

### 4-Step Wizard (Mollie step is skippable)

**Step 1: Mosque Basics**
- Name (required)
- City (required)
- Address (optional for MVP)
- Auto-generates slug from name (editable)

**Step 2: Branding**
- Upload logo (Supabase Storage)
- Pick primary color (color picker with presets)
- Optional: banner image, welcome message

**Step 3: Funds**
- Pre-filled with 3 default funds (Algemeen, Zakat, Sadaqah)
- Treasurer can rename, remove, or add
- Quick setup — can always add more later

**Step 4: Mollie + ANBI (skippable)**
- "Connect Mollie Account" button → OAuth redirect
- If mosque doesn't have Mollie yet: show instructions to create one, with "I'll do this later" skip button
- ANBI toggle + RSIN input (if ANBI-registered)
- Skip → mosque lands on dashboard with manual donation entry available, donation page shows bank transfer details only

**Post-onboarding:**
- Dashboard is immediately usable
- Donation page is live at `[slug].bunyan.nl`
- If Mollie not connected: donation page shows IBAN for bank transfers + message "Online betaling binnenkort beschikbaar"
- Treasurer can connect Mollie anytime from Settings

---

## 22. Pricing & Plan Enforcement

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
| Embeddable widget | No | Yes | Yes |
| Admin users | 1 | 2 | Unlimited |
| Custom branding | No | No | Yes (remove badge) |
| Multilingual page | No | No | Yes |
| CSV export | No | No | Yes |
| Custom domain | No | No | Yes |
| Application fee | €0.15/tx | €0.10/tx | €0.10/tx |

### Free Tier Limit Enforcement: Soft Limit + Nag

When a free-tier mosque exceeds 15 online donations/month:
1. **The donation still goes through** — never block a donor from giving
2. Dashboard shows a persistent upgrade banner: "U heeft uw maandlimiet bereikt. Upgrade naar Starter voor onbeperkte donaties."
3. Email sent to mosque admin(s)
4. The extra donations are processed normally (with €0.15 application fee)

**Implementation:** `plan_usage` table tracks monthly online donation count per mosque. Checked after webhook processes a completed donation (not before — never block the donation).

### Billing

Subscription billing via Mollie recurring payments (eat our own dog food) or Stripe. Application fees are collected automatically by Mollie Connect per transaction.

---

## 23. Currency & Money Handling

### Rule: Integer cents everywhere

```typescript
// lib/money.ts

/** Convert euros to cents (for storage) */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/** Convert cents to euros (for display) */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/** Format cents as Dutch currency string */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
// formatMoney(2550) → "€ 25,50"
```

- Database: all `amount` columns are `INTEGER` (cents)
- Mollie API: uses cents natively
- Frontend: convert to euros only at the display layer
- Calculations: all in integer arithmetic — no floating point
- ANBI receipts: display in euros with 2 decimal places

---

## 24. Security

### Data Isolation (Defense in Depth)

1. **Layer 1 — Database RLS:** Every table has `mosque_id`-based RLS policy
2. **Layer 2 — Application check:** Every server-side query explicitly includes `mosque_id` from authenticated session
3. **Layer 3 — Automated tests:** Cross-tenant isolation tests run in CI (see Testing)

### Encryption

| Data | At Rest | In Transit |
|---|---|---|
| All data | Supabase default encryption (AES-256) | TLS 1.3 |
| Mollie tokens | Application-level AES-256 encryption before storage | TLS 1.3 |
| Donor PII (email, name) | Supabase encryption | TLS 1.3 |
| Passwords | Supabase Auth (bcrypt) | TLS 1.3 |

### PCI Compliance

Bunyan **never** sees or stores card data. All payment processing happens on Mollie's PCI DSS Level 1 certified infrastructure. Donors are redirected to Mollie's hosted payment pages.

### GDPR / AVG

- EU-only hosting (Vercel ams1, Supabase EU)
- Data processing agreement with Supabase and Mollie
- Donor data deletion: treasurer can delete a donor → cascades to donations (anonymized, not deleted — preserve financial records)
- Cookie consent: minimal cookies (Supabase auth session), no tracking cookies on donation pages
- Privacy policy page required

### Webhook Security

- Mollie webhooks: verify by fetching the payment from Mollie API (Mollie doesn't sign webhooks — the recommended approach is to fetch the payment status from the API, which we already do)
- No secret validation needed — the webhook only contains a payment ID, and we fetch the actual data from Mollie

### Rate Limiting

- Donation creation: rate limit per IP (10 per minute per mosque) to prevent abuse
- Manual entry: rate limit per user session
- Webhook endpoint: no rate limit (Mollie controls the rate)

---

## 25. Testing Strategy

### Scope: Critical path only

Focus testing effort on code where bugs have financial or legal consequences.

### Unit Tests (Vitest)

| Module | What to Test |
|---|---|
| `lib/money.ts` | Cents ↔ euros conversion, formatting, rounding edge cases |
| `lib/mollie/fees.ts` | Fee calculation for each payment method, cover-fees logic |
| ANBI total calculation | Sum of donations per donor per year, fund breakdown aggregation |
| Donor identity resolution | Email matching, IBAN hint matching, dedup logic |

### Integration Tests (Vitest + Supabase local)

| Flow | What to Test |
|---|---|
| Webhook processing | Idempotency (process same webhook twice), status transitions, donor creation |
| Mollie payment creation | Correct amount (including cover-fees), correct application fee, correct metadata |
| RLS isolation | **Critical**: User from mosque A cannot read mosque B's data. Test for every table. |
| Manual donation entry | Creates donation, audit log, updates donor aggregates |
| ANBI receipt generation | Correct totals, correct fund breakdown, PDF generated |

### What We Don't Test (MVP)

- UI component rendering (trust shadcn/ui)
- Dashboard layout
- E2E browser flows (test manually during pilot)
- Email delivery (trust Resend)

### Test Data

Seed script creates:
- 2 mosques (for cross-tenant isolation tests)
- 5 funds per mosque
- 50 donations with various statuses, methods, and amounts
- 10 donors with varying completeness (some anonymous, some with email)
- 2 active recurring donations

---

## 26. Environments & Deployment

### Three Environments

| Environment | Supabase | Mollie | Vercel | URL |
|---|---|---|---|---|
| Local | `supabase start` (Docker) | Test API keys | `next dev` | `localhost:3000` |
| Staging | Supabase Project #2 | Test API keys | Preview deploys | `staging.bunyan.nl` |
| Production | Supabase Project #3 | Live API keys | Production deploy | `bunyan.nl` |

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only (webhooks, cron)

# Mollie
MOLLIE_CLIENT_ID=                   # Mollie Connect OAuth app
MOLLIE_CLIENT_SECRET=
MOLLIE_REDIRECT_URI=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=                # https://app.bunyan.nl
NEXT_PUBLIC_DONATE_URL=             # https://bunyan.nl (for subdomains)
NEXT_PUBLIC_GIVE_URL=               # https://give.bunyan.nl (QR redirects)

# Encryption
MOLLIE_TOKEN_ENCRYPTION_KEY=        # AES-256 key for Mollie token encryption

# Sentry
SENTRY_DSN=
```

### CI/CD

- Push to `main` → Vercel auto-deploys to production
- Push to feature branch → Vercel preview deploy (connected to staging Supabase)
- Supabase migrations run via `supabase db push` (staging) and `supabase db push --linked` (production)
- Tests run in GitHub Actions before merge to main

---

## 27. Performance Requirements

| Metric | Target | How Achieved |
|---|---|---|
| Donation page load | < 2s on 4G | ISR/static generation, edge CDN, minimal JS |
| Dashboard load | < 3s | SWR with stale cache, lazy-load charts |
| Payment redirect | < 1s to Mollie | Single API call, no extra processing |
| Webhook processing | < 2s | Lean handler, async email sending |
| ANBI PDF generation | < 2s per PDF | React-PDF server-side, queued |
| Tenant resolution | < 10ms | Indexed slug query (no caching for MVP) |

### Donation Page Optimization

- Static HTML generation (ISR with 5-minute revalidation)
- Minimal client-side JavaScript (only for form interactions + payment API call)
- Images optimized via Next.js Image component
- No heavy UI framework on donation pages — keep bundle small
- Preload iDEAL bank selector data

---

## 28. Monitoring & Observability

| Tool | Purpose | Setup |
|---|---|---|
| Sentry | Error tracking, performance monitoring | `@sentry/nextjs` integration |
| Vercel Analytics | Web Vitals, page performance | Built-in |
| PostHog / Plausible | Product analytics, feature usage | GDPR-compliant, EU-hosted |
| Supabase Dashboard | Database metrics, RLS query performance | Built-in |

### Critical Alerts

| Alert | Trigger | Channel |
|---|---|---|
| Webhook failure rate > 5% | Sentry error rate on webhook endpoint | Email + Sentry |
| Mollie OAuth token refresh failed | Token refresh returns error | Email to admin |
| Database connection pool exhausted | Supabase connection errors | Sentry |
| Donation page 5xx rate > 1% | Vercel error rate | Sentry |

---

## 29. Build Phases

### Phase 0: Validation (Weeks 1-4) — No code

- 15-20 mosque conversations
- Document pain points and ANBI requirements
- Get 8+ verbal commitments
- **Research exact Belastingdienst ANBI receipt requirements** (see Section 30)
- Go/no-go decision

### Phase 1: Foundation (Weeks 5-7)

**Deliverables:**
- Supabase project setup (local + staging)
- Database schema (all migrations)
- RLS policies
- Supabase Auth (email/password + magic link)
- Next.js project scaffold (App Router, Tailwind, shadcn/ui)
- Middleware for subdomain tenant resolution
- User ↔ mosque association
- Onboarding wizard (4 steps, Mollie skippable)

**Exit criteria:** Can create mosque account, see empty dashboard, visit `[slug].localhost:3000`

### Phase 2: Core Donation Flow (Weeks 8-10)

**Deliverables:**
- Mollie Connect OAuth integration
- Donation page (fund selector, amount, payment method, donor info)
- Mollie payment creation (iDEAL, card, SEPA first payment)
- Webhook handler (idempotent)
- Donation confirmation page
- Confirmation email (Resend + React Email)
- Manual donation entry (modal form + audit log)
- Cover-fees checkbox
- Donor creation/matching (email key + IBAN hint)

**Exit criteria:** Can process a real €1 test donation end-to-end via iDEAL

### Phase 3: Dashboard & Reporting (Weeks 11-12)

**Deliverables:**
- Dashboard layout (sidebar, KPI cards)
- KPI calculations (total, MRR, avg gift, new donors)
- Monthly donation chart (Recharts)
- Fund breakdown chart
- Recent donations feed
- Donation list with filters and search
- Donor list with profiles and donation history
- SWR data fetching setup

**Exit criteria:** Treasurer can see all donation data in one place

### Phase 4: ANBI, Campaigns & QR (Weeks 13-14)

**Deliverables:**
- ANBI receipt PDF template (React-PDF, hardcoded to Belastingdienst spec)
- Bulk PDF generation queue (Supabase Edge Functions)
- ANBI page: year selector, preview, generate, email, download ZIP
- Recurring donations (SEPA mandate, weekly/monthly/yearly)
- Self-service cancellation page
- Campaign pages (Ramadan template)
- QR code system (short URLs, redirect, poster PDF generation)
- Nightly Mollie reconciliation job

**Exit criteria:** Can generate and email ANBI receipt PDF. Can set up recurring donation.

### Phase 5: Polish & Pilot (Weeks 15-16)

**Deliverables:**
- Mobile optimization pass on donation page
- Onboarding UX polish
- Plan enforcement (free tier soft limits)
- i18n (NL, EN, TR, AR with text-only RTL)
- Role-based access (admin vs viewer)
- Settings page (branding, team, Mollie status)
- Bug fixes from internal testing
- Pilot deployment with 3-5 mosques

**Exit criteria:** 3 mosques actively using the platform with real donations

### Phase 6: Launch (Week 17+)

**Deliverables:**
- Marketing site (`bunyan.nl`)
- Pricing page + subscription billing
- Sentry + analytics setup
- Production Supabase project
- DNS setup (wildcard subdomain, `give.bunyan.nl`)
- First paying customer

---

## 30. ANBI Research Findings

### 30.1 Receipt Requirements (Resolved)

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

Our hardcoded template in Section 12 already covers all mandatory fields. No changes needed.

### 30.2 Cash Donations Are NOT Tax-Deductible

**Critical finding:** Per the Belastingdienst, cash donations (contante giften) are **not** deductible for income tax purposes. Only donations made via verifiable bank transfer (overschrijving) are eligible for ANBI tax deductions.

**Implications for Bunyan:**
- This is a **key selling point** for digital donations through our platform — iDEAL and SEPA donations are automatically verifiable and tax-deductible
- ANBI receipts should **only include Mollie-verified donations** (iDEAL, card, SEPA) and bank transfers with verifiable references
- Manual cash entries are tracked for internal reporting but **excluded from ANBI receipts** by default
- Manually entered bank transfers can be included if the treasurer provides a reference number
- The donation page should communicate this: "Digitale donaties zijn fiscaal aftrekbaar bij ANBI-geregistreerde moskeeën"

**Update to Section 12:** The ANBI receipt generation query must filter: `method != 'cash'` when calculating totals for tax receipts. Cash donations appear in the dashboard/reports but not on ANBI receipts.

### 30.3 Periodieke Schenking vs. Gewone Gift

- **Gewone gift (regular gift):** One-time or irregular donations. Deductible above a threshold (1% of income, min €60).
- **Periodieke schenking (periodic gift):** Committed recurring gift for 5+ years, documented in a "schenkingsakte" (gift agreement). Fully deductible with no threshold.

**For MVP:** Recurring SEPA donations do **not** automatically qualify as "periodieke schenkingen" — that requires a formal 5-year commitment agreement. Our recurring donations are treated as regular gifts. Supporting periodieke schenkingen (with digital schenkingsakte generation) is a compelling **post-MVP feature** that would differentiate us.

### 30.4 Data Retention

Dutch fiscal law (AWR) requires financial administration records to be retained for **7 years**. This means:
- Donation records must not be hard-deleted within 7 years
- GDPR "right to erasure" conflicts: we anonymize donor PII but preserve financial records
- Our data deletion approach: anonymize donor name/email/phone but retain donation amounts, dates, and fund allocations

### 30.5 Remaining Open Items (Validate in Phase 0)

1. **Percentage of Dutch mosques with ANBI status** — validate during mosque interviews
2. **Appetite for schenkingsakte generation** — gauge interest in periodic gift support as post-MVP feature

---

*End of Technical Specification — Version 1.0 — March 2026*
