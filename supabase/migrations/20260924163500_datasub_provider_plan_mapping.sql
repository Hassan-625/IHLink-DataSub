alter table public.datasub_products
  add column if not exists provider_plan_id text,
  add column if not exists internal_plan_id text;

update public.datasub_products
set internal_plan_id = code
where internal_plan_id is null;

create unique index if not exists datasub_products_internal_plan_id_key
  on public.datasub_products(internal_plan_id)
  where internal_plan_id is not null;

create table if not exists public.datasub_reseller_product_prices (
  reseller_user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.datasub_products(id) on delete cascade,
  reseller_plan_id text not null,
  selling_price numeric(14,2) not null check (selling_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (reseller_user_id, product_id),
  unique (reseller_user_id, reseller_plan_id)
);
alter table public.datasub_reseller_product_prices enable row level security;
grant select, insert, update, delete on public.datasub_reseller_product_prices to authenticated;
create policy "Resellers read own product prices" on public.datasub_reseller_product_prices for select to authenticated using (reseller_user_id = (select auth.uid()) or private.has_product_access('datasub','view'));
create policy "Resellers create own product prices" on public.datasub_reseller_product_prices for insert to authenticated with check ((reseller_user_id = (select auth.uid()) and exists (select 1 from public.datasub_reseller_accounts a where a.user_id = (select auth.uid()) and a.status = 'active')) or private.has_product_access('datasub','edit'));
create policy "Resellers update own product prices" on public.datasub_reseller_product_prices for update to authenticated using (reseller_user_id = (select auth.uid()) or private.has_product_access('datasub','edit')) with check ((reseller_user_id = (select auth.uid()) and exists (select 1 from public.datasub_reseller_accounts a where a.user_id = (select auth.uid()) and a.status = 'active')) or private.has_product_access('datasub','edit'));
create policy "Resellers delete own product prices" on public.datasub_reseller_product_prices for delete to authenticated using (reseller_user_id = (select auth.uid()) or private.has_product_access('datasub','edit'));
