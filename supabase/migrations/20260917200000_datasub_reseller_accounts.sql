create table public.datasub_reseller_tiers (
  code text primary key check (code ~ '^[a-z_]{3,30}$'),
  name text not null unique,
  minimum_monthly_sales numeric(14,2) not null default 0 check (minimum_monthly_sales>=0),
  discount_percent numeric(5,2) not null check (discount_percent between 0 and 20),
  api_access boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100
);
create table public.datasub_reseller_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 24),
  tier_code text not null default 'bronze' references public.datasub_reseller_tiers(code),
  status text not null default 'pending' check (status in ('pending','active','suspended','rejected')),
  total_sales numeric(14,2) not null default 0 check(total_sales>=0),
  total_profit numeric(14,2) not null default 0 check(total_profit>=0),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index datasub_reseller_status_tier_idx on public.datasub_reseller_accounts(status,tier_code);
alter table public.datasub_reseller_tiers enable row level security;
alter table public.datasub_reseller_accounts enable row level security;
create policy "Authenticated users read active reseller tiers" on public.datasub_reseller_tiers for select to authenticated using (is_active or private.has_product_access('datasub','view'));
create policy "DataSub editors manage reseller tiers" on public.datasub_reseller_tiers for all to authenticated using (private.has_product_access('datasub','edit')) with check (private.has_product_access('datasub','edit'));
create policy "Owners and DataSub admins read reseller accounts" on public.datasub_reseller_accounts for select to authenticated using (user_id=(select auth.uid()) or private.has_product_access('datasub','view'));
create policy "Customers apply for reseller account" on public.datasub_reseller_accounts for insert to authenticated with check (user_id=(select auth.uid()) and status='pending');
create policy "DataSub approvers update reseller accounts" on public.datasub_reseller_accounts for update to authenticated using (private.has_product_access('datasub','approve')) with check (private.has_product_access('datasub','approve'));
grant select on public.datasub_reseller_tiers to authenticated;
grant insert,update,delete on public.datasub_reseller_tiers to authenticated;
grant select,insert,update on public.datasub_reseller_accounts to authenticated;
insert into public.datasub_reseller_tiers(code,name,minimum_monthly_sales,discount_percent,api_access,sort_order) values
('bronze','Bronze',0,1.50,false,10),('silver','Silver',250000,2.50,false,20),('gold','Gold',1000000,3.50,true,30),('enterprise','Enterprise',5000000,5.00,true,40)
on conflict(code) do nothing;
