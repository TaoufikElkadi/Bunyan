-- ============================================================
-- MOSQUES (tenant table)
-- ============================================================
CREATE TABLE mosques (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  city          TEXT,
  address       TEXT,
  logo_url      TEXT,
  banner_url    TEXT,
  primary_color TEXT DEFAULT '#10b981',
  welcome_msg   TEXT,
  anbi_status   BOOLEAN DEFAULT FALSE,
  rsin          TEXT,
  kvk           TEXT,
  language      TEXT DEFAULT 'nl',
  mollie_org_id     TEXT,
  mollie_access_token TEXT,
  mollie_refresh_token TEXT,
  mollie_connected_at TIMESTAMPTZ,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth')),
  plan_started_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mosques_slug ON mosques(slug);

-- ============================================================
-- USERS (treasurer / board members — links to Supabase Auth)
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
  icon          TEXT,
  goal_amount   INTEGER,
  goal_deadline DATE,
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
  name             TEXT,
  email            TEXT,
  phone            TEXT,
  address          TEXT,
  iban_hint        TEXT,
  tags             TEXT[] DEFAULT '{}',
  total_donated    INTEGER DEFAULT 0,
  donation_count   INTEGER DEFAULT 0,
  first_donated_at TIMESTAMPTZ,
  last_donated_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donors_mosque ON donors(mosque_id);
CREATE INDEX idx_donors_email ON donors(mosque_id, email);
CREATE INDEX idx_donors_iban ON donors(mosque_id, iban_hint);

-- ============================================================
-- RECURRINGS (SEPA mandates)
-- ============================================================
CREATE TABLE recurrings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id           UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  donor_id            UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  fund_id             UUID NOT NULL REFERENCES funds(id),
  amount              INTEGER NOT NULL,
  frequency           TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  mollie_mandate_id   TEXT,
  mollie_customer_id  TEXT,
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  next_charge_at      TIMESTAMPTZ,
  cancel_token        TEXT UNIQUE,
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
  amount            INTEGER NOT NULL,
  fee_covered       INTEGER DEFAULT 0,
  currency          TEXT DEFAULT 'EUR',
  method            TEXT NOT NULL CHECK (method IN ('ideal', 'card', 'sepa', 'cash', 'bank_transfer')),
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  is_recurring      BOOLEAN DEFAULT FALSE,
  recurring_id      UUID REFERENCES recurrings(id) ON DELETE SET NULL,
  mollie_payment_id TEXT UNIQUE,
  notes             TEXT,
  created_by        UUID REFERENCES users(id),
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
  slug            TEXT NOT NULL,
  goal_amount     INTEGER,
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
  total_amount    INTEGER NOT NULL,
  fund_breakdown  JSONB NOT NULL,
  pdf_url         TEXT,
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
  code        TEXT NOT NULL UNIQUE,
  fund_id     UUID REFERENCES funds(id),
  campaign_id UUID REFERENCES campaigns(id),
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
-- PLAN USAGE TRACKING
-- ============================================================
CREATE TABLE plan_usage (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id         UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  month             DATE NOT NULL,
  online_donations  INTEGER DEFAULT 0,
  UNIQUE(mosque_id, month)
);

CREATE INDEX idx_usage_mosque_month ON plan_usage(mosque_id, month);
