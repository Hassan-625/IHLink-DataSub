create table public.datasub_provider_connections (
  code text primary key check (code ~ '^[a-z0-9_]{3,40}$'),
  display_name text not null check (char_length(display_name) between 2 and 100),
  status text not null default 'setup_required' check (status in ('setup_required','online','degraded','offline')),
  token_hash text,
  token_prefix text,
  priority integer not null default 100 check (priority between 1 and 1000),
  available_balance numeric(14,2) check (available_balance is null or available_balance >= 0),
  success_rate numeric(5,2) not null default 100 check (success_rate between 0 and 100),
  average_response_ms integer check (average_response_ms is null or average_response_ms >= 0),
  is_active boolean not null default false,
  last_callback_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.datasub_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider_code text not null references public.datasub_provider_connections(code) on delete restrict,
  external_event_id text not null,
  transaction_reference text,
  provider_reference text,
  received_status text not null,
  processing_result text not null default 'received' check (processing_result in ('received','processed','duplicate','rejected')),
  response_ms integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(provider_code,external_event_id)
);

create index datasub_provider_events_created_idx on public.datasub_provider_events(created_at desc);
create index datasub_provider_events_transaction_idx on public.datasub_provider_events(transaction_reference);

alter table public.datasub_provider_connections enable row level security;
alter table public.datasub_provider_events enable row level security;

create policy "DataSub admins read provider connections"
on public.datasub_provider_connections for select to authenticated
using (private.has_product_access('datasub','view'));

create policy "DataSub editors update provider connections"
on public.datasub_provider_connections for update to authenticated
using (private.has_product_access('datasub','edit'))
with check (private.has_product_access('datasub','edit'));

create policy "DataSub admins read provider events"
on public.datasub_provider_events for select to authenticated
using (private.has_product_access('datasub','view'));

grant select,update on public.datasub_provider_connections to authenticated;
grant select on public.datasub_provider_events to authenticated;

insert into public.datasub_provider_connections(code,display_name,priority)
values ('primary_vtu','Primary VTU Provider',10),('backup_vtu','Backup VTU Provider',20)
on conflict(code) do nothing;

create or replace function public.rotate_datasub_provider_token(p_provider_code text)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $$
declare
  secret text;
begin
  if not private.has_product_access('datasub','edit') then
    raise exception 'Not authorized to manage provider credentials';
  end if;
  secret:='ihp_live_'||encode(extensions.gen_random_bytes(24),'hex');
  update public.datasub_provider_connections
  set token_hash=encode(extensions.digest(secret,'sha256'),'hex'),
      token_prefix=left(secret,17),
      status='offline',
      is_active=true,
      updated_at=now()
  where code=p_provider_code;
  if not found then raise exception 'Provider connection not found'; end if;
  return jsonb_build_object('provider_code',p_provider_code,'token',secret);
end;
$$;

revoke all on function public.rotate_datasub_provider_token(text) from public,anon;
grant execute on function public.rotate_datasub_provider_token(text) to authenticated;

create or replace function public.process_datasub_provider_callback(
  p_provider_code text,
  p_external_event_id text,
  p_transaction_reference text,
  p_status text,
  p_provider_reference text default null,
  p_available_balance numeric default null,
  p_response_ms integer default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  tx public.datasub_transactions%rowtype;
  event_id uuid;
  normalized_status public.datasub_transaction_status;
begin
  if p_status not in ('success','failed','reversed') then raise exception 'Unsupported provider status'; end if;
  if char_length(trim(p_external_event_id))<3 or char_length(trim(p_transaction_reference))<5 then
    raise exception 'Event ID and transaction reference are required';
  end if;
  if not exists(select 1 from public.datasub_provider_connections where code=p_provider_code and is_active) then
    raise exception 'Provider connection is inactive';
  end if;

  insert into public.datasub_provider_events(
    provider_code,external_event_id,transaction_reference,provider_reference,received_status,response_ms,payload
  ) values (
    p_provider_code,trim(p_external_event_id),trim(p_transaction_reference),p_provider_reference,p_status,p_response_ms,coalesce(p_payload,'{}'::jsonb)
  )
  on conflict(provider_code,external_event_id) do nothing
  returning id into event_id;
  if event_id is null then return jsonb_build_object('status','duplicate','reference',trim(p_transaction_reference)); end if;

  select * into tx from public.datasub_transactions where reference=trim(p_transaction_reference) for update;
  if tx.id is null then
    update public.datasub_provider_events set processing_result='rejected' where id=event_id;
    raise exception 'Transaction not found';
  end if;
  if tx.status<>'pending' then
    update public.datasub_provider_events set processing_result='duplicate' where id=event_id;
    return jsonb_build_object('status','already_finalized','reference',tx.reference,'transaction_status',tx.status);
  end if;

  normalized_status:=p_status::public.datasub_transaction_status;
  update public.datasub_transactions
  set status=normalized_status,provider_reference=p_provider_reference,updated_at=now()
  where id=tx.id;
  if normalized_status in ('failed','reversed') then
    update public.datasub_wallets set balance=balance+tx.amount,updated_at=now() where user_id=tx.user_id;
  end if;

  update public.datasub_provider_events set processing_result='processed' where id=event_id;
  update public.datasub_provider_connections
  set status=case when normalized_status='success' then 'online' else 'degraded' end,
      available_balance=coalesce(p_available_balance,available_balance),
      average_response_ms=coalesce(p_response_ms,average_response_ms),
      last_callback_at=now(),
      updated_at=now()
  where code=p_provider_code;

  return jsonb_build_object('status','processed','reference',tx.reference,'transaction_status',normalized_status);
end;
$$;

revoke all on function public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb) from public,anon,authenticated;
grant execute on function public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb) to service_role;
