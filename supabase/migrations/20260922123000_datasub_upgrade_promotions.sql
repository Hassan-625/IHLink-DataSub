create table public.datasub_upgrade_offers (
  code text primary key check (code ~ '^[a-z_]{3,30}$'),
  name text not null unique,
  description text not null default '',
  base_price numeric(14,2) not null check (base_price >= 0),
  promo_discount_percent numeric(5,2) not null default 0 check (promo_discount_percent between 0 and 100),
  promo_starts_at timestamptz,
  promo_ends_at timestamptz,
  target_tier_code text references public.datasub_reseller_tiers(code),
  api_access boolean not null default false,
  benefits jsonb not null default '[]'::jsonb check (jsonb_typeof(benefits) = 'array'),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  updated_at timestamptz not null default now(),
  check (promo_ends_at is null or promo_starts_at is null or promo_ends_at > promo_starts_at)
);

create table public.datasub_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer_code text not null references public.datasub_upgrade_offers(code),
  quoted_price numeric(14,2) not null check (quoted_price >= 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index datasub_upgrade_requests_one_pending_idx
on public.datasub_upgrade_requests(user_id, offer_code) where status='pending';
create index datasub_upgrade_requests_status_created_idx
on public.datasub_upgrade_requests(status, created_at desc);

alter table public.datasub_upgrade_offers enable row level security;
alter table public.datasub_upgrade_requests enable row level security;

create policy "Anyone reads active upgrade offers"
on public.datasub_upgrade_offers for select
to anon, authenticated
using (is_active or (select auth.uid()) is not null and private.has_product_access('datasub','view'));

create policy "DataSub editors create upgrade offers"
on public.datasub_upgrade_offers for insert to authenticated
with check (private.has_product_access('datasub','edit'));
create policy "DataSub editors update upgrade offers"
on public.datasub_upgrade_offers for update to authenticated
using (private.has_product_access('datasub','edit'))
with check (private.has_product_access('datasub','edit'));
create policy "DataSub editors delete upgrade offers"
on public.datasub_upgrade_offers for delete to authenticated
using (private.has_product_access('datasub','edit'));

create policy "Customers read own upgrade requests"
on public.datasub_upgrade_requests for select to authenticated
using ((select auth.uid())=user_id or private.has_product_access('datasub','view'));
create policy "Customers request upgrades"
on public.datasub_upgrade_requests for insert to authenticated
with check ((select auth.uid())=user_id and status='pending');
create policy "Customers cancel pending upgrades"
on public.datasub_upgrade_requests for update to authenticated
using ((select auth.uid())=user_id and status='pending')
with check ((select auth.uid())=user_id and status='cancelled');
create policy "DataSub approvers review upgrade requests"
on public.datasub_upgrade_requests for update to authenticated
using (private.has_product_access('datasub','approve'))
with check (private.has_product_access('datasub','approve'));

grant select on public.datasub_upgrade_offers to anon, authenticated;
grant insert, update, delete on public.datasub_upgrade_offers to authenticated;
grant select, insert, update on public.datasub_upgrade_requests to authenticated;

insert into public.datasub_reseller_tiers(code,name,minimum_monthly_sales,discount_percent,api_access,sort_order)
values ('top_seller','Top Seller',2500000,4.25,true,35)
on conflict(code) do update set
  name=excluded.name,
  minimum_monthly_sales=excluded.minimum_monthly_sales,
  discount_percent=excluded.discount_percent,
  api_access=excluded.api_access,
  sort_order=excluded.sort_order;

insert into public.datasub_upgrade_offers(
  code,name,description,base_price,promo_discount_percent,promo_starts_at,promo_ends_at,
  target_tier_code,api_access,benefits,sort_order
) values
('reseller','Reseller','For VTU businesses that need reseller pricing and sales tools',5000,10,now(),now()+interval '90 days','bronze',false,
 '["Reseller catalogue prices","Sales and profit dashboard","Bulk purchase tools","Priority support"]'::jsonb,10),
('api_developer','API Developer','For developers integrating IHLink products into websites and applications',10000,15,now(),now()+interval '90 days','gold',true,
 '["All reseller benefits","Live REST API access","Sandbox credentials","Usage dashboard and webhooks"]'::jsonb,20),
('top_seller','Top Seller','Performance tier for high-volume resellers',25000,20,now(),now()+interval '90 days','top_seller',true,
 '["Enhanced reseller discount","API access","Performance promotions","Priority account support"]'::jsonb,30)
on conflict(code) do nothing;
