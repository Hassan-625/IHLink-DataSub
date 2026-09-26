create table public.datasub_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,50}$'),
  service_type text not null check (service_type in ('airtime','data','electricity','cable_tv','education')),
  provider text not null check (char_length(provider) between 2 and 80),
  name text not null check (char_length(name) between 2 and 120),
  description text,
  provider_cost numeric(14,2) not null check (provider_cost >= 0),
  retail_price numeric(14,2) not null check (retail_price > 0),
  reseller_price numeric(14,2) not null check (reseller_price > 0),
  api_price numeric(14,2) not null check (api_price > 0),
  routing_priority integer not null default 100 check (routing_priority between 1 and 1000),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (retail_price >= provider_cost and reseller_price >= provider_cost and api_price >= provider_cost)
);
create index datasub_products_service_provider_idx on public.datasub_products(service_type,provider,routing_priority) where is_active;
create index datasub_products_active_updated_idx on public.datasub_products(is_active,updated_at desc);
alter table public.datasub_products enable row level security;
create policy "Customers read active DataSub products" on public.datasub_products for select to authenticated
using (is_active or private.has_product_access('datasub','view'));
create policy "DataSub editors create products" on public.datasub_products for insert to authenticated
with check (private.has_product_access('datasub','edit'));
create policy "DataSub editors update products" on public.datasub_products for update to authenticated
using (private.has_product_access('datasub','edit')) with check (private.has_product_access('datasub','edit'));
create policy "DataSub editors delete products" on public.datasub_products for delete to authenticated
using (private.has_product_access('datasub','edit'));
grant select,insert,update,delete on public.datasub_products to authenticated;

insert into public.datasub_products(code,service_type,provider,name,description,provider_cost,retail_price,reseller_price,api_price,routing_priority) values
('MTN_1GB_30D','data','MTN','1GB · 30 Days','Monthly MTN data bundle',470,500,490,480,10),
('AIRTEL_1GB_30D','data','Airtel','1GB · 30 Days','Monthly Airtel data bundle',475,510,495,485,20),
('GLO_1GB_30D','data','Glo','1GB · 30 Days','Monthly Glo data bundle',450,490,475,465,30),
('T2_1GB_30D','data','T2','1GB · 30 Days','Monthly T2 data bundle',460,500,485,475,40),
('DSTV_COMPACT','cable_tv','DStv','DStv Compact','Monthly cable subscription',14800,15700,15350,15150,10),
('GOTV_MAX','cable_tv','GOtv','GOtv Max','Monthly cable subscription',7800,8500,8200,8050,20),
('STARTIMES_BASIC','cable_tv','StarTimes','StarTimes Basic','Monthly cable subscription',3600,4000,3850,3750,30),
('WAEC_PIN','education','WAEC','WAEC Result Checker PIN','Single result-checker PIN',3200,3500,3400,3300,10),
('NECO_PIN','education','NECO','NECO Result Checker Token','Single result-checker token',1100,1300,1200,1150,20),
('JAMB_PIN','education','JAMB','JAMB e-PIN','Single registration e-PIN',4500,5000,4800,4650,30)
on conflict(code) do nothing;
