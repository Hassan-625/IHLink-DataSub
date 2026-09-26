create type public.datasub_transaction_status as enum ('pending','success','failed','reversed');

create table public.datasub_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table public.datasub_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reference text not null unique,
  service_type text not null check (service_type in ('airtime','data','electricity','cable_tv','education')),
  provider text not null,
  recipient text not null,
  amount numeric(14,2) not null check (amount > 0),
  status public.datasub_transaction_status not null default 'pending',
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index datasub_transactions_user_created_idx
  on public.datasub_transactions(user_id, created_at desc);
create index datasub_transactions_status_created_idx
  on public.datasub_transactions(status, created_at desc);

create table public.customer_service_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product text not null check (product = 'datasub'),
  status text not null default 'active' check (status in ('active','pending','suspended')),
  plan_name text,
  activated_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product)
);

create index customer_service_access_product_status_idx
  on public.customer_service_access(product, status);

alter table public.datasub_wallets enable row level security;
alter table public.datasub_transactions enable row level security;
alter table public.customer_service_access enable row level security;

create policy "Customers read own wallet"
on public.datasub_wallets for select to authenticated
using (user_id = (select auth.uid()));

create policy "Customers read own transactions"
on public.datasub_transactions for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users read their service access"
on public.customer_service_access for select to authenticated
using (
  (select auth.uid()) = user_id
  or private.is_admin(array['super_admin','platform_admin']::public.user_role[])
);

create policy "Super admins create service access"
on public.customer_service_access for insert to authenticated
with check (private.is_admin(array['super_admin']::public.user_role[]));

create policy "Super admins update service access"
on public.customer_service_access for update to authenticated
using (private.is_admin(array['super_admin']::public.user_role[]))
with check (private.is_admin(array['super_admin']::public.user_role[]));

create policy "Super admins delete service access"
on public.customer_service_access for delete to authenticated
using (private.is_admin(array['super_admin']::public.user_role[]));

grant select on public.datasub_wallets to authenticated;
grant select on public.datasub_transactions to authenticated;
grant select, insert, update, delete on public.customer_service_access to authenticated;

insert into public.datasub_wallets(user_id)
select id from public.profiles
on conflict(user_id) do nothing;

insert into public.customer_service_access(user_id, product, status, plan_name, activated_at)
select id, 'datasub', 'active', 'Smart Earner', now()
from public.profiles
on conflict(user_id, product) do nothing;

insert into public.admin_product_access(user_id, product, can_view, can_edit, can_approve)
select id, 'datasub', true, true, true
from public.profiles
where role = 'super_admin'::public.user_role
on conflict(user_id, product) do update
set can_view = true, can_edit = true, can_approve = true;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_owner boolean := lower(coalesce(new.email,'')) = 'hassanisahassan12@gmail.com';
begin
  insert into public.profiles(id,email,first_name,last_name,requested_service,role)
  values (
    new.id,
    coalesce(new.email,''),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    coalesce(new.raw_user_meta_data->>'requested_service','datasub'),
    case when is_owner then 'super_admin'::public.user_role else 'customer'::public.user_role end
  );

  insert into public.datasub_wallets(user_id)
  values(new.id)
  on conflict(user_id) do nothing;

  insert into public.customer_service_access(user_id,product,status,plan_name,activated_at)
  values(new.id,'datasub','active','Smart Earner',now())
  on conflict(user_id,product) do nothing;

  if is_owner then
    insert into public.admin_product_access(user_id,product,can_view,can_edit,can_approve)
    values(new.id,'datasub',true,true,true)
    on conflict(user_id,product) do update
    set can_view=true,can_edit=true,can_approve=true;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public,anon,authenticated;
