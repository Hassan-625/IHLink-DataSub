-- Harden DataSub wallet reserve/refund invariants. Apply only through reviewed migrations.
-- SECURITY DEFINER functions remain service_role-only; all money movements are atomic with ledger writes.

create or replace function public.reserve_datasub_wallet(
  p_user uuid, p_transaction uuid, p_amount numeric, p_reference text
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  tx public.datasub_transactions%rowtype;
  existing public.wallet_ledger%rowtype;
  wallet_balance numeric;
begin
  if p_user is null or p_transaction is null or p_amount is null or p_amount <= 0 then
    return false;
  end if;

  select * into tx
  from public.datasub_transactions
  where id = p_transaction
  for update;

  if tx.id is null
     or tx.user_id <> p_user
     or tx.amount <> p_amount
     or tx.status <> 'pending'
     or tx.routing_state <> 'ROUTING'
     or p_reference is distinct from ('RESERVE:' || tx.reference) then
    return false;
  end if;

  select * into existing
  from public.wallet_ledger
  where reference = p_reference;

  if found then
    return existing.user_id = p_user
      and existing.transaction_id = p_transaction
      and existing.entry_type = 'reserve'
      and existing.amount = p_amount;
  end if;

  select balance into wallet_balance
  from public.datasub_wallets
  where user_id = p_user
  for update;

  if wallet_balance is null or wallet_balance < p_amount then
    return false;
  end if;

  update public.datasub_wallets
  set balance = balance - p_amount, updated_at = now()
  where user_id = p_user;

  insert into public.wallet_ledger(user_id, transaction_id, entry_type, amount, reference)
  values (p_user, p_transaction, 'reserve', p_amount, p_reference);

  return true;
end;
$$;

create or replace function public.refund_datasub_wallet(
  p_user uuid, p_transaction uuid, p_amount numeric, p_reference text
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  tx public.datasub_transactions%rowtype;
  existing public.wallet_ledger%rowtype;
  reserved public.wallet_ledger%rowtype;
begin
  if p_user is null or p_transaction is null or p_amount is null or p_amount <= 0 then
    return false;
  end if;

  select * into tx
  from public.datasub_transactions
  where id = p_transaction
  for update;

  if tx.id is null
     or tx.user_id <> p_user
     or tx.amount <> p_amount
     or p_reference is distinct from ('REFUND:' || tx.reference) then
    return false;
  end if;

  -- A replay is successful only when the existing canonical refund row matches
  -- every relevant attribute; a colliding arbitrary reference must never pass.
  select * into existing
  from public.wallet_ledger
  where reference = p_reference;

  if found then
    return existing.user_id = p_user
      and existing.transaction_id = p_transaction
      and existing.entry_type = 'refund'
      and existing.amount = p_amount;
  end if;

  if tx.status <> 'pending' or tx.routing_state <> 'REFUND_PENDING' then
    return false;
  end if;

  select * into reserved
  from public.wallet_ledger
  where reference = 'RESERVE:' || tx.reference
    and user_id = p_user
    and transaction_id = p_transaction
    and entry_type = 'reserve'
    and amount = p_amount;

  if not found then
    return false;
  end if;

  -- Require a wallet row and serialize balance updates. The function call's
  -- transaction commits both the wallet delta and immutable ledger entry.
  perform 1 from public.datasub_wallets where user_id = p_user for update;
  if not found then
    return false;
  end if;

  update public.datasub_wallets
  set balance = balance + p_amount, updated_at = now()
  where user_id = p_user;

  insert into public.wallet_ledger(user_id, transaction_id, entry_type, amount, reference)
  values (p_user, p_transaction, 'refund', p_amount, p_reference);

  return true;
end;
$$;

create or replace function public.process_datasub_provider_callback(
  p_provider_code text,
  p_external_event_id text,
  p_transaction_reference text,
  p_status text,
  p_provider_reference text default null,
  p_available_balance numeric default null,
  p_response_ms integer default null,
  p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  tx public.datasub_transactions%rowtype;
  event_id uuid;
  normalized_status public.datasub_transaction_status;
  refund_ok boolean;
begin
  if p_status not in ('success','failed','reversed') then
    raise exception 'Unsupported provider status';
  end if;
  if p_provider_code is null or char_length(trim(p_external_event_id)) < 3
     or char_length(trim(p_transaction_reference)) < 5 then
    raise exception 'Provider code, event ID and transaction reference are required';
  end if;
  if not exists (
    select 1 from public.datasub_provider_connections
    where code = p_provider_code and is_active
  ) then
    raise exception 'Provider connection is inactive';
  end if;

  insert into public.datasub_provider_events(
    provider_code, external_event_id, transaction_reference, provider_reference,
    received_status, response_ms, payload
  ) values (
    p_provider_code, trim(p_external_event_id), trim(p_transaction_reference),
    p_provider_reference, p_status, p_response_ms, coalesce(p_payload, '{}'::jsonb)
  )
  on conflict(provider_code, external_event_id) do nothing
  returning id into event_id;

  if event_id is null then
    return jsonb_build_object('status','duplicate','reference',trim(p_transaction_reference));
  end if;

  select * into tx
  from public.datasub_transactions
  where reference = trim(p_transaction_reference)
  for update;

  if tx.id is null then
    update public.datasub_provider_events set processing_result='rejected' where id=event_id;
    raise exception 'Transaction not found';
  end if;

  if tx.provider <> p_provider_code then
    update public.datasub_provider_events set processing_result='rejected' where id=event_id;
    raise exception 'Provider does not match transaction';
  end if;

  if tx.status <> 'pending' then
    update public.datasub_provider_events set processing_result='duplicate' where id=event_id;
    return jsonb_build_object('status','already_finalized','reference',tx.reference,'transaction_status',tx.status);
  end if;

  normalized_status := p_status::public.datasub_transaction_status;

  if normalized_status = 'success' then
    update public.datasub_transactions
    set status='success', routing_state='SETTLED',
        provider_reference=coalesce(p_provider_reference,provider_reference), updated_at=now()
    where id=tx.id;
  else
    -- A failure/reversal is refundable only if the canonical reservation exists.
    -- Raise on missing evidence so the event, transaction and wallet all roll back.
    update public.datasub_transactions
    set routing_state='REFUND_PENDING',
        provider_reference=coalesce(p_provider_reference,provider_reference), updated_at=now()
    where id=tx.id;

    refund_ok := public.refund_datasub_wallet(
      tx.user_id, tx.id, tx.amount, 'REFUND:' || tx.reference
    );

    if not refund_ok then
      raise exception 'Refund rejected: canonical reservation or transaction state is invalid';
    end if;

    update public.datasub_transactions
    set status='failed', routing_state='REFUNDED', last_reconciled_at=now(), updated_at=now()
    where id=tx.id;
  end if;

  update public.datasub_provider_events set processing_result='processed' where id=event_id;
  update public.datasub_provider_connections
  set status=case when normalized_status='success' then 'online' else 'degraded' end,
      available_balance=coalesce(p_available_balance,available_balance),
      average_response_ms=coalesce(p_response_ms,average_response_ms),
      last_callback_at=now(), updated_at=now()
  where code=p_provider_code;

  return jsonb_build_object(
    'status','processed', 'reference',tx.reference,
    'transaction_status',case when normalized_status='success' then 'success' else 'failed' end
  );
end;
$$;

revoke all on function public.reserve_datasub_wallet(uuid,uuid,numeric,text) from public, anon, authenticated;
revoke all on function public.refund_datasub_wallet(uuid,uuid,numeric,text) from public, anon, authenticated;
revoke all on function public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb) from public, anon, authenticated;
grant execute on function public.reserve_datasub_wallet(uuid,uuid,numeric,text) to service_role;
grant execute on function public.refund_datasub_wallet(uuid,uuid,numeric,text) to service_role;
grant execute on function public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb) to service_role;
