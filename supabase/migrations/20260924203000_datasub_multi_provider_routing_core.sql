-- Multi-provider DataSub routing core. Provider credentials remain Edge Function secrets only.
create table if not exists public.datasub_providers (
  id uuid primary key default gen_random_uuid(), code text unique not null, display_name text not null,
  state text not null default 'DISABLED' check (state in ('HEALTHY','DEGRADED','SUSPENDED','PROBING','DISABLED')),
  priority integer not null default 100, is_active boolean not null default false,
  available_balance numeric, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.datasub_provider_products (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.datasub_products(id) on delete cascade,
  provider_id uuid not null references public.datasub_providers(id) on delete cascade, external_plan_id text not null,
  provider_cost numeric not null check(provider_cost>=0), active boolean not null default true, last_synced_at timestamptz,
  raw_metadata jsonb not null default '{}'::jsonb, unique(product_id,provider_id,external_plan_id)
);
create table if not exists public.datasub_prices (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.datasub_products(id) on delete cascade,
 customer_tier text not null check(customer_tier in ('smart_earner','reseller','api_user','top_seller')), selling_price numeric not null check(selling_price>=0),
 effective_from timestamptz not null default now(), active boolean not null default true, unique(product_id,customer_tier,effective_from)
);
create table if not exists public.datasub_provider_health (
 provider_id uuid primary key references public.datasub_providers(id) on delete cascade,state text not null default 'DISABLED' check(state in ('HEALTHY','DEGRADED','SUSPENDED','PROBING','DISABLED')),
 success_rate_15m numeric,success_rate_1h numeric,success_rate_24h numeric,timeout_rate_15m numeric,average_latency_ms integer,p95_latency_ms integer,consecutive_failures integer not null default 0,last_success timestamptz,last_failure timestamptz,available_balance numeric,updated_at timestamptz not null default now()
);
create table if not exists public.datasub_provider_attempts(id uuid primary key default gen_random_uuid(),transaction_id uuid not null references public.datasub_transactions(id) on delete cascade,provider_id uuid not null references public.datasub_providers(id),request_key text not null unique,provider_reference text,provider_cost numeric not null,response_status text not null,latency_ms integer,safe_response jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create table if not exists public.datasub_routing_events(id uuid primary key default gen_random_uuid(),transaction_id uuid references public.datasub_transactions(id) on delete cascade,provider_id uuid references public.datasub_providers(id),event_type text not null,reason text not null,details jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create table if not exists public.wallet_ledger(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,transaction_id uuid references public.datasub_transactions(id),entry_type text not null check(entry_type in ('reserve','debit','credit','refund','adjustment')),amount numeric not null check(amount>0),reference text not null unique,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
alter table public.datasub_provider_products enable row level security;alter table public.datasub_prices enable row level security;alter table public.datasub_providers enable row level security;alter table public.datasub_provider_health enable row level security;alter table public.datasub_provider_attempts enable row level security;alter table public.datasub_routing_events enable row level security;alter table public.wallet_ledger enable row level security;
insert into public.datasub_providers(code,display_name,state,is_active,priority) values ('cashsub','CashSub','DISABLED',false,10),('datastation','DataStation','DISABLED',false,20),('legitdataway','Legitdataway','DISABLED',false,30) on conflict(code) do update set display_name=excluded.display_name;
create index if not exists idx_datasub_provider_products_product on public.datasub_provider_products(product_id,active,provider_cost);create index if not exists idx_datasub_prices_product_tier on public.datasub_prices(product_id,customer_tier,active,effective_from desc);create index if not exists idx_datasub_attempts_transaction on public.datasub_provider_attempts(transaction_id,created_at);create index if not exists idx_datasub_routing_transaction on public.datasub_routing_events(transaction_id,created_at);create index if not exists idx_wallet_ledger_user on public.wallet_ledger(user_id,created_at desc);