-- Standalone PostgreSQL 16 integration fixture. Synthetic data only.
create schema if not exists public;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;

create type public.datasub_transaction_status as enum ('pending','success','failed','reversed');
create table public.datasub_wallets (
  user_id uuid primary key,
  balance numeric(14,2) not null,
  updated_at timestamptz not null default now()
);
create table public.datasub_transactions (
  id uuid primary key,
  user_id uuid not null,
  reference text not null unique,
  amount numeric(14,2) not null,
  status public.datasub_transaction_status not null default 'pending',
  provider text not null,
  provider_reference text,
  updated_at timestamptz not null default now()
);
create table public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  transaction_id uuid not null references public.datasub_transactions(id),
  entry_type text not null check (entry_type in ('reserve','refund')),
  amount numeric(14,2) not null,
  reference text not null unique,
  created_at timestamptz not null default now()
);
create table public.datasub_provider_connections (
  code text primary key,
  status text not null default 'offline',
  is_active boolean not null default false,
  available_balance numeric(14,2),
  average_response_ms integer,
  last_callback_at timestamptz,
  updated_at timestamptz not null default now()
);
create table public.datasub_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider_code text not null references public.datasub_provider_connections(code),
  external_event_id text not null,
  transaction_reference text,
  provider_reference text,
  received_status text not null,
  processing_result text not null default 'received'
    check (processing_result in ('received','processed','duplicate','rejected')),
  response_ms integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(provider_code, external_event_id)
);

-- Minimal fixture for the live canonical refund contract: reserve proof, amount/user binding,
-- transaction lock, unique REFUND reference, wallet lock and atomic ledger+balance credit.
create or replace function public.refund_datasub_wallet(p_user uuid,p_transaction uuid,p_amount numeric,p_reference text)
returns boolean language plpgsql security definer set search_path = '' as $function$
declare t public.datasub_transactions%rowtype; prior public.wallet_ledger%rowtype;
begin
  if p_user is null or p_transaction is null or p_amount is null or p_amount <= 0 or p_amount <> round(p_amount,2) then return false; end if;
  select * into t from public.datasub_transactions where id=p_transaction for update;
  if t.id is null or t.user_id<>p_user or t.amount<>p_amount or p_reference is distinct from 'REFUND:'||t.reference then return false; end if;
  select * into prior from public.wallet_ledger where reference=p_reference;
  if prior.id is not null then return prior.user_id=p_user and prior.transaction_id=p_transaction and prior.amount=p_amount and prior.entry_type='refund'; end if;
  if t.status='success' or not exists(select 1 from public.wallet_ledger where reference='RESERVE:'||t.reference and user_id=p_user and transaction_id=p_transaction and amount=p_amount and entry_type='reserve') then return false; end if;
  perform 1 from public.datasub_wallets where user_id=p_user for update;
  if not found then raise exception 'DataSub wallet not found'; end if;
  insert into public.wallet_ledger(user_id,transaction_id,entry_type,amount,reference) values(p_user,p_transaction,'refund',p_amount,p_reference);
  update public.datasub_wallets set balance=balance+p_amount,updated_at=now() where user_id=p_user;
  return true;
end;
$function$;
grant execute on function public.refund_datasub_wallet(uuid,uuid,numeric,text) to service_role;

insert into public.datasub_provider_connections(code,is_active) values ('cashsub',true),('datastation',true);

create function public.fail_processed_event_for_test() returns trigger language plpgsql as $trigger$
begin
  if new.external_event_id='evt-rollback-01' and new.processing_result='processed' then
    raise exception 'FORCED_CALLBACK_ROLLBACK';
  end if;
  return new;
end;
$trigger$;
create trigger test_force_callback_rollback before update on public.datasub_provider_events
for each row execute function public.fail_processed_event_for_test();

\ir ../../supabase/migrations/20261016160000_datasub_provider_callback_ledger_integrity.sql

-- Seed one normal reserved purchase, one provider mismatch purchase, one missing-reservation
-- purchase and one rollback-trigger purchase.
insert into public.datasub_wallets(user_id,balance) values
('10000000-0000-0000-0000-000000000001',900),
('10000000-0000-0000-0000-000000000002',900),
('10000000-0000-0000-0000-000000000003',900),
('10000000-0000-0000-0000-000000000004',900),
('10000000-0000-0000-0000-000000000005',900);
insert into public.datasub_transactions(id,user_id,reference,amount,status,provider) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','REF-FAILED',100,'pending','cashsub'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','REF-MISMATCH',100,'pending','cashsub'),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','REF-NORESERVE',100,'pending','cashsub'),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004','REF-ROLLBACK',100,'pending','cashsub'),
('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000005','REF-REVERSED',100,'pending','cashsub');
insert into public.wallet_ledger(user_id,transaction_id,entry_type,amount,reference) values
('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','reserve',100,'RESERVE:REF-FAILED'),
('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','reserve',100,'RESERVE:REF-MISMATCH'),
('10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','reserve',100,'RESERVE:REF-ROLLBACK'),
('10000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000005','reserve',100,'RESERVE:REF-REVERSED');

do $$
declare r jsonb; n integer; failed boolean := false;
begin
  r := public.process_datasub_provider_callback('cashsub','evt-failed-001','REF-FAILED','failed','upstream-failed');
  if r->>'status' <> 'processed' then raise exception 'FAIL: expected failed callback processed, got %',r; end if;
  if (select status from public.datasub_transactions where reference='REF-FAILED') <> 'failed' then raise exception 'FAIL: transaction not marked failed'; end if;
  if (select balance from public.datasub_wallets where user_id='10000000-0000-0000-0000-000000000001') <> 1000 then raise exception 'FAIL: wallet not restored exactly once'; end if;
  if (select count(*) from public.wallet_ledger where reference='REFUND:REF-FAILED' and entry_type='refund' and amount=100) <> 1 then raise exception 'FAIL: canonical refund ledger entry missing or duplicated'; end if;

  r := public.process_datasub_provider_callback('cashsub','evt-failed-001','REF-FAILED','failed','upstream-failed');
  if r->>'status' <> 'duplicate' then raise exception 'FAIL: duplicate event not recognized'; end if;
  if (select balance from public.datasub_wallets where user_id='10000000-0000-0000-0000-000000000001') <> 1000 then raise exception 'FAIL: duplicate callback credited wallet twice'; end if;
  if (select count(*) from public.wallet_ledger where reference='REFUND:REF-FAILED') <> 1 then raise exception 'FAIL: duplicate callback created another refund'; end if;

  r := public.process_datasub_provider_callback('datastation','evt-mismatch-01','REF-MISMATCH','failed','wrong-provider-ref');
  if r->>'status' <> 'rejected' or r->>'reason' <> 'provider_mismatch' then raise exception 'FAIL: provider mismatch not rejected: %',r; end if;
  if (select status from public.datasub_transactions where reference='REF-MISMATCH') <> 'pending' then raise exception 'FAIL: provider mismatch changed transaction state'; end if;
  if (select balance from public.datasub_wallets where user_id='10000000-0000-0000-0000-000000000002') <> 900 then raise exception 'FAIL: provider mismatch changed wallet balance'; end if;
  if exists(select 1 from public.wallet_ledger where reference='REFUND:REF-MISMATCH') then raise exception 'FAIL: provider mismatch created refund ledger entry'; end if;

  r := public.process_datasub_provider_callback('cashsub','evt-noreserve-01','REF-NORESERVE','reversed','upstream-noreserve');
  if r->>'status' <> 'rejected' or r->>'reason' <> 'refund_not_applied' then raise exception 'FAIL: missing reservation not rejected: %',r; end if;
  if (select status from public.datasub_transactions where reference='REF-NORESERVE') <> 'pending' then raise exception 'FAIL: missing reservation changed transaction state'; end if;
  if (select balance from public.datasub_wallets where user_id='10000000-0000-0000-0000-000000000003') <> 900 then raise exception 'FAIL: missing reservation changed wallet balance'; end if;

  r := public.process_datasub_provider_callback('cashsub','evt-reversed-01','REF-REVERSED','reversed','upstream-reversed');
  if r->>'status' <> 'processed' then raise exception 'FAIL: expected reversed callback processed, got %',r; end if;
  if (select status from public.datasub_transactions where reference='REF-REVERSED') <> 'reversed' then raise exception 'FAIL: transaction not marked reversed'; end if;
  if (select balance from public.datasub_wallets where user_id='10000000-0000-0000-0000-000000000005') <> 1000 then raise exception 'FAIL: reversed transaction wallet not restored'; end if;
  if (select count(*) from public.wallet_ledger where reference='REFUND:REF-REVERSED' and entry_type='refund') <> 1 then raise exception 'FAIL: reversed transaction refund ledger entry missing'; end if;

  begin
    perform public.process_datasub_provider_callback('cashsub','evt-rollback-01','REF-ROLLBACK','reversed','upstream-rollback');
  exception when others then
    if sqlerrm='FORCED_CALLBACK_ROLLBACK' then failed := true; else raise; end if;
  end;
  if not failed then raise exception 'FAIL: rollback test did not trigger'; end if;
  if (select status from public.datasub_transactions where reference='REF-ROLLBACK') <> 'pending' then raise exception 'FAIL: transaction change survived callback rollback'; end if;
  if (select balance from public.datasub_wallets where user_id='10000000-0000-0000-0000-000000000004') <> 900 then raise exception 'FAIL: wallet credit survived callback rollback'; end if;
  if exists(select 1 from public.wallet_ledger where reference='REFUND:REF-ROLLBACK') then raise exception 'FAIL: refund ledger entry survived callback rollback'; end if;
  if exists(select 1 from public.datasub_provider_events where external_event_id='evt-rollback-01') then raise exception 'FAIL: callback event survived statement rollback'; end if;
end $$;

do $$ begin
  if has_function_privilege('anon','public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb)','EXECUTE') then raise exception 'FAIL: anon can execute callback RPC'; end if;
  if has_function_privilege('authenticated','public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb)','EXECUTE') then raise exception 'FAIL: authenticated can execute callback RPC'; end if;
  if not has_function_privilege('service_role','public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb)','EXECUTE') then raise exception 'FAIL: service_role cannot execute callback RPC'; end if;
end $$;

select 'PASS: callback provider binding, idempotent refund ledger, and statement rollback are enforced.' as result;
