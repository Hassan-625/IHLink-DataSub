create table public.datasub_api_credentials (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 2 and 60), key_prefix text not null, key_hash text not null unique,
  mode text not null check (mode in ('sandbox','live')), status text not null default 'active' check (status in ('active','revoked')),
  last_used_at timestamptz, expires_at timestamptz, created_at timestamptz not null default now(), revoked_at timestamptz
);
create index datasub_api_credentials_user_status_idx on public.datasub_api_credentials(user_id,status,created_at desc);

create table public.datasub_api_usage (
  id bigint generated always as identity primary key, credential_id uuid not null references public.datasub_api_credentials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, endpoint text not null,
  method text not null check (method in ('GET','POST','PUT','PATCH','DELETE')), status_code integer not null check (status_code between 100 and 599),
  response_ms integer not null default 0 check (response_ms >= 0), request_units integer not null default 1 check (request_units > 0),
  created_at timestamptz not null default now()
);
create index datasub_api_usage_user_created_idx on public.datasub_api_usage(user_id,created_at desc);
create index datasub_api_usage_credential_created_idx on public.datasub_api_usage(credential_id,created_at desc);
alter table public.datasub_api_credentials enable row level security;
alter table public.datasub_api_usage enable row level security;
create policy "Owners and DataSub admins read API credentials" on public.datasub_api_credentials for select to authenticated using ((select auth.uid()) = user_id or private.has_product_access('datasub','view'));
create policy "Owners and DataSub admins read API usage" on public.datasub_api_usage for select to authenticated using ((select auth.uid()) = user_id or private.has_product_access('datasub','view'));
revoke all on public.datasub_api_credentials from anon, authenticated;
revoke all on public.datasub_api_usage from anon, authenticated;
grant select (id,user_id,label,key_prefix,mode,status,last_used_at,expires_at,created_at,revoked_at) on public.datasub_api_credentials to authenticated;
grant select on public.datasub_api_usage to authenticated;

create or replace function public.create_datasub_api_credential(p_label text,p_mode text default 'sandbox') returns jsonb
language plpgsql security definer set search_path = pg_catalog, public, private, extensions as $$
declare v_user_id uuid := auth.uid(); v_secret text; v_id uuid; v_prefix text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_mode not in ('sandbox','live') then raise exception 'Invalid API mode'; end if;
  if char_length(trim(p_label)) not between 2 and 60 then raise exception 'Label must contain 2 to 60 characters'; end if;
  if not exists (select 1 from public.datasub_reseller_accounts a join public.datasub_reseller_tiers t on t.code=a.tier_code where a.user_id=v_user_id and a.status='active' and t.is_active and t.api_access) then raise exception 'An active API-enabled reseller tier is required'; end if;
  if (select count(*) from public.datasub_api_credentials where user_id=v_user_id and status='active') >= 5 then raise exception 'Maximum of five active API keys reached'; end if;
  v_secret := 'ihl_' || p_mode || '_sk_' || encode(extensions.gen_random_bytes(24),'hex'); v_prefix := left(v_secret,18);
  insert into public.datasub_api_credentials(user_id,label,key_prefix,key_hash,mode) values(v_user_id,trim(p_label),v_prefix,encode(extensions.digest(v_secret,'sha256'),'hex'),p_mode) returning id into v_id;
  return jsonb_build_object('id',v_id,'label',trim(p_label),'mode',p_mode,'key_prefix',v_prefix,'secret',v_secret);
end; $$;

create or replace function public.revoke_datasub_api_credential(p_credential_id uuid) returns void
language plpgsql security definer set search_path = pg_catalog, public, private as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.datasub_api_credentials set status='revoked',revoked_at=now() where id=p_credential_id and (user_id=auth.uid() or private.has_product_access('datasub','approve')) and status='active';
  if not found then raise exception 'Credential not found or access denied'; end if;
end; $$;
revoke all on function public.create_datasub_api_credential(text,text) from public, anon;
revoke all on function public.revoke_datasub_api_credential(uuid) from public, anon;
grant execute on function public.create_datasub_api_credential(text,text) to authenticated;
grant execute on function public.revoke_datasub_api_credential(uuid) to authenticated;
