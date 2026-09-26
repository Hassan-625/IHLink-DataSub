create table public.customer_service_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product text not null check (product in ('corporate','datasub','schoolpro','consult','host','engineering')),
  status text not null default 'active' check (status in ('active','pending','suspended')),
  plan_name text,
  activated_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product)
);

create index customer_service_access_product_status_idx on public.customer_service_access (product, status);
alter table public.customer_service_access enable row level security;

create policy "Users read their service access"
on public.customer_service_access for select to authenticated
using ((select auth.uid()) = user_id or private.is_admin(array['super_admin','platform_admin']::public.user_role[]));

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

grant select on public.customer_service_access to authenticated;
grant insert, update, delete on public.customer_service_access to authenticated;

insert into public.customer_service_access (user_id, product, status, plan_name, activated_at)
select p.id, product, 'active', case when product='corporate' then 'IHLink Account' else 'Standard Access' end, now()
from public.profiles p
cross join unnest(array['corporate','datasub','schoolpro','consult','host','engineering']) as product
on conflict (user_id, product) do nothing;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id,email,first_name,last_name,requested_service,role)
  values (new.id,coalesce(new.email,''),new.raw_user_meta_data->>'first_name',new.raw_user_meta_data->>'last_name',new.raw_user_meta_data->>'requested_service',case when lower(coalesce(new.email,''))='hassanisahassan12@gmail.com' then 'super_admin'::public.user_role else 'customer'::public.user_role end);
  insert into public.datasub_wallets (user_id) values (new.id);
  insert into public.customer_service_access (user_id,product,status,plan_name,activated_at)
  select new.id,product,'active',case when product='corporate' then 'IHLink Account' else 'Standard Access' end,now()
  from unnest(array['corporate','datasub','schoolpro','consult','host','engineering']) as product;
  if lower(coalesce(new.email,''))='hassanisahassan12@gmail.com' then
    insert into public.admin_product_access (user_id,product,can_view,can_edit,can_approve)
    select new.id,product,true,true,true from unnest(array['corporate','datasub','schoolpro','consult','host','engineering']) as product;
  end if;
  return new;
end; $$;
revoke all on function private.handle_new_user() from public,anon,authenticated;
