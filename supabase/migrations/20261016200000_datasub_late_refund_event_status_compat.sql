-- Forward fix: prevent a late success callback from settling an already-refunded purchase.
-- Apply only after review; this migration has not been deployed to production.
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

  if tx.provider is distinct from p_provider_code then
    update public.datasub_provider_events set processing_result='rejected' where id=event_id;
    raise exception 'Provider does not match transaction';
  end if;

  -- The refund RPC commits wallet credit before its caller finalizes status.
  -- Treat the exact canonical refund ledger entry as authoritative against late success.
  if exists (
    select 1 from public.wallet_ledger
    where reference = 'REFUND:' || tx.reference
      and user_id = tx.user_id
      and transaction_id = tx.id
      and entry_type = 'refund'
      and amount = tx.amount
  ) then
    update public.datasub_transactions
    set status = 'failed', routing_state = 'REFUNDED',
        last_reconciled_at = now(), updated_at = now()
    where id = tx.id and status = 'pending';
    update public.datasub_provider_events set processing_result='duplicate' where id=event_id;
    return jsonb_build_object('status','already_refunded','reference',tx.reference,'transaction_status','failed');
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

    -- Preserve the provider's terminal outcome: 'reversed' must not be silently
    -- collapsed into 'failed', because callers and reconciliation distinguish them.
    update public.datasub_transactions
    set status=normalized_status, routing_state='REFUNDED', last_reconciled_at=now(), updated_at=now()
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
    'transaction_status',normalized_status
  );
end;
$$;


revoke all on function public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb) from public, anon, authenticated;
grant execute on function public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb) to service_role;
