# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

1. **Never run `supabase db reset`** unless explicitly asked. It wipes all local data (including Stripe Connect links, test accounts, etc.). To apply new migrations, use `supabase migration up` or run the SQL directly against the local database instead.

## What is Bunyan

Multi-tenant SaaS for Dutch mosque donation management. Single Next.js app serving both public donation pages (`/doneren/[slug]`) and an authenticated dashboard. Dutch is the primary UI language; dashboard routes use Dutch slugs (`/donaties`, `/donateurs`, `/fondsen`, `/instellingen`, etc.).

## Commands

```bash
pnpm dev              # Dev server with Turbopack
pnpm build            # Production build
pnpm lint             # ESLint
pnpm test             # Vitest (all tests)
pnpm test:watch       # Vitest watch mode
pnpm test -- tests/unit/money.test.ts   # Single test file
pnpm test:rls         # RLS tenant-isolation tests only
```

Local Supabase (CLI at `~/.local/bin/supabase`):
```bash
supabase start        # Start local Supabase (API :54321, Studio :54323)
supabase db reset     # Re-run all migrations + seed
supabase migration new <name>  # Create new migration
```

## Architecture

### Multi-tenancy
Shared Postgres schema with RLS. Every table has `mosque_id`. Defense-in-depth: RLS policies **and** explicit `mosque_id` filtering in every query. Never rely on RLS alone.

### Auth flow
- Supabase Auth (email/password + magic links). No Clerk/NextAuth.
- `src/proxy.ts` — Next.js proxy (replaces middleware). Validates JWT via `getUser()` once per request, sets `x-user-id` and `x-platform-admin` headers.
- `src/lib/supabase/cached.ts` — `getCachedProfile()` reads those headers via `React.cache()` to deduplicate auth across layout + page. This is the standard way to get the current user in server components.
- Three Supabase clients: `server.ts` (cookie-based, server components/actions), `client.ts` (browser), `admin.ts` (service role, bypasses RLS).

### Money
All amounts stored as **integer cents** (Stripe native format). Use `src/lib/money.ts` for conversions (`eurosToCents`, `centsToEuros`, `formatMoney`). Fee calculations in `src/lib/fees.ts`.

### Plans & feature gating
Three tiers: `free`, `starter`, `growth`. Limits defined in `src/lib/plan.ts` (`getPlanLimits()`). Free tier uses soft limits (never blocks a donation).

### i18n
Custom JSON translations (`src/lib/i18n/translations/{nl,en,tr,ar}.json`) + React context (`I18nProvider` / `useTranslation()`). Used only on public donation pages, not the dashboard. Dutch (`nl`) is the fallback. Arabic gets `dir="rtl"`.

### Payments
Stripe only (PaymentIntents + Subscriptions). iDEAL, cards, SEPA. Webhook handler at `src/app/api/webhooks/stripe/route.ts` — must be idempotent. Stripe Connect for mosque payouts (`src/lib/stripe-connect.ts`).

### Key directories
- `src/app/(dashboard)/` — authenticated dashboard pages
- `src/app/(auth)/` — login, signup, password flows
- `src/app/(onboarding)/` — mosque onboarding wizard
- `src/app/(admin)/` — platform admin panel
- `src/app/(seo)/` — SEO landing pages
- `src/app/doneren/[slug]/` — public donation pages (ISR)
- `src/app/api/` — API routes
- `src/app/go/[code]/` — QR short-link redirects
- `src/components/ui/` — shadcn/ui primitives (base-ui v2, uses `render` prop not `asChild`)
- `src/types/index.ts` — all shared TypeScript types
- `supabase/migrations/` — Postgres migrations (ordered, applied sequentially)
- `guides/` — setup guides for external services

### Data fetching
SWR for client-side data. No Supabase Realtime in MVP. Supabase JS SDK directly — no ORM.

### CSRF
`src/proxy.ts` validates `Origin` header on state-changing requests. Exempt paths listed in `CSRF_EXEMPT_PATHS` (webhooks, payment endpoints, cron).

### Security headers
Defined in `next.config.ts` — CSP, HSTS, X-Frame-Options, etc. applied to all routes.

### Email
Resend + custom HTML templates in `src/lib/email/templates/`. Send via `src/lib/email/send.ts`. Currently blocked on domain setup.

### PDF generation
`@react-pdf/renderer` for ANBI receipts. Logic in `src/lib/anbi.ts`.

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`
