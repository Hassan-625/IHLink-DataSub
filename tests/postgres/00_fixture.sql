-- Disposable-only prerequisites for applying the checked-in DataSub migrations under test.
-- Never run this fixture against a production database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Supabase-like roles required by the checked-in migration GRANT/REVOKE statements.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE TYPE public.datasub_transaction_status AS ENUM ('pending','success','failed','reversed');
CREATE TABLE public.datasub_products (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.datasub_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  reference text NOT NULL UNIQUE,
  amount numeric NOT NULL CHECK (amount > 0),
  status public.datasub_transaction_status NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'primary_vtu',
  provider_reference text,
  service_type text NOT NULL DEFAULT 'data',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.datasub_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
