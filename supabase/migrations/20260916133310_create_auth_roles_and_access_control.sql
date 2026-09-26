create extension if not exists "pgcrypto";
create schema if not exists private;

create type public.user_role as enum ('super_admin', 'platform_admin', 'support', 'finance', 'customer');
create type public.account_status as enum ('active', 'suspended', 'invited');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text,
  last_name text,
  role public.user_role not null default 'customer',
  status public.account_status not null default 'active',
  requested_service text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_product_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product text not null check (product = 'datasub'),
  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_approve boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, product)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  product text,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.admin_product_access enable row level security;
alter table public.audit_logs enable row level security;

create or replace function private.is_admin(required_roles public.user_role[] default array['super_admin','platform_admin']::public.user_role[])
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = any(required_roles) and status = 'active'); $$;

revoke all on function private.is_admin(public.user_role[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin(public.user_role[]) to authenticated;

create policy "Users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Admins read profiles" on public.profiles for select to authenticated using (private.is_admin());
create policy "Super admins manage profiles" on public.profiles for all to authenticated using (private.is_admin(array['super_admin']::public.user_role[])) with check (private.is_admin(array['super_admin']::public.user_role[]));
create policy "Admins read access" on public.admin_product_access for select to authenticated using (user_id = auth.uid() or private.is_admin());
create policy "Super admins manage access" on public.admin_product_access for all to authenticated using (private.is_admin(array['super_admin']::public.user_role[])) with check (private.is_admin(array['super_admin']::public.user_role[]));
create policy "Admins read audit logs" on public.audit_logs for select to authenticated using (private.is_admin());
create policy "Authenticated users create attributed logs" on public.audit_logs for insert to authenticated with check (actor_id = auth.uid());

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.admin_product_access to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, requested_service, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'requested_service',
    case when lower(coalesce(new.email,'')) = 'hassanisahassan12@gmail.com' then 'super_admin'::public.user_role else 'customer'::public.user_role end
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure private.handle_new_user();

insert into public.profiles (id, email, first_name, last_name, role)
select id, coalesce(email,''), raw_user_meta_data->>'first_name', raw_user_meta_data->>'last_name',
  case when lower(coalesce(email,'')) = 'hassanisahassan12@gmail.com' then 'super_admin'::public.user_role else 'customer'::public.user_role end
from auth.users
on conflict (id) do update set role = excluded.role
where lower(excluded.email) = 'hassanisahassan12@gmail.com';
