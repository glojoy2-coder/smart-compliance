-- Smart Compliance LLC -- PostgreSQL Schema
-- Run once against your Railway PostgreSQL database

CREATE TABLE IF NOT EXISTS customers (
  id               SERIAL PRIMARY KEY,
  agency_name      TEXT NOT NULL,
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  website          TEXT,
  referral_source  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreements (
  id               SERIAL PRIMARY KEY,
  customer_id      INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  agreement_type   TEXT NOT NULL CHECK (agreement_type IN ('terms_of_agreement','service_agreement')),
  signature_data   TEXT NOT NULL,
  signed_at        TIMESTAMPTZ NOT NULL,
  ip_address       TEXT,
  user_agent       TEXT,
  UNIQUE (customer_id, agreement_type)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                    SERIAL PRIMARY KEY,
  customer_id           INT NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  plan                  TEXT NOT NULL,
  price_cents           INT NOT NULL,
  stripe_customer_id    TEXT,
  stripe_sub_id         TEXT,
  status                TEXT NOT NULL DEFAULT 'pending',
  current_period_end    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activations (
  id                SERIAL PRIMARY KEY,
  customer_id       INT NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  activation_token  TEXT NOT NULL UNIQUE,
  is_active         BOOLEAN NOT NULL DEFAULT FALSE,
  activated_at      TIMESTAMPTZ DEFAULT NOW(),
  revoked_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           SERIAL PRIMARY KEY,
  customer_id  INT REFERENCES customers(id) ON DELETE SET NULL,
  event_type   TEXT NOT NULL,
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id             SERIAL PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE VIEW customer_gate_status AS
  SELECT
    c.id,
    c.agency_name,
    c.full_name,
    c.email,
    c.created_at,
    (SELECT COUNT(DISTINCT agreement_type) FROM agreements WHERE customer_id = c.id) >= 2  AS both_agreements_signed,
    (SELECT status FROM subscriptions WHERE customer_id = c.id)                            AS subscription_status,
    (SELECT plan   FROM subscriptions WHERE customer_id = c.id)                            AS plan,
    (SELECT is_active FROM activations WHERE customer_id = c.id)                           AS is_active,
    (SELECT activation_token FROM activations WHERE customer_id = c.id)                    AS activation_token,
    (
      (SELECT COUNT(DISTINCT agreement_type) FROM agreements WHERE customer_id = c.id) >= 2
      AND (SELECT status FROM subscriptions WHERE customer_id = c.id) = 'active'
      AND (SELECT is_active FROM activations WHERE customer_id = c.id) = TRUE
    ) AS all_gates_passed
  FROM customers c;
