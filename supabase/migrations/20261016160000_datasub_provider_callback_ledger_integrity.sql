-- Repair the legacy provider callback's wallet/ledger and provider-scope invariants.
-- This migration is a draft in a review branch only; do not apply to production before
-- caller/deployment provenance and full Supabase integration are verified.
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
set search_path = ''
as $function$
declare
  tx public.datasub_transactions%rowtype;
  event_id uuid;
  normalized_status public.datasub_transaction_status;
begin
  if p_status is null or p_status not in ('success','failed','reversed') then
    raise exception 'Unsupported provider status';
  end if;
  if nullif(trim(p_external_event_id), '') is null
     or char_length(trim(p_external_event_id)) < 3
     or nullif(trim(p_transaction_reference), '') is null
     or char_length(trim(p_transaction_reference)) < 5 then
    raise exception 'Event ID and transaction reference are required';
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
    return jsonb_build_object('status', 'duplicate', 'reference', trim(p_transaction_reference));
  end if;

  select * into tx
  from public.datasub_transactions
  where reference = trim(p_transaction_reference)
  for update;

  if tx.id is null then
    update public.datasub_provider_events
    set processing_result = 'rejected'
    where id = event_id;
    return jsonb_build_object('status', 'rejected', 'reason', 'transaction_not_found');
  end if;

  -- A valid event ID is not enough: bind the callback to the provider that owns
  -- the transaction. Mismatches are recorded and cannot change transaction or wallet state.
  if tx.provider is distinct from p_provider_code then
    update public.datasub_provider_events
    set processing_result = 'rejected'
    where id = event_id;
    return jsonb_build_object('status', 'rejected', 'reason', 'provider_mismatch');
  end if;

  if tx.status <> 'pending' then
    update public.datasub_provider_events
    set processing_result = 'duplicate'
    where id = event_id;
    return jsonb_build_object(
      'status', 'already_finalized',
      'reference', tx.reference,
      'transaction_status', tx.status
    );
  end if;

  normalized_status := p_status::public.datasub_transaction_status;

  -- Failed/reversed purchases must refund through the canonical idempotent ledger
  -- RPC. A missing/mismatched reservation rejects the event and leaves the transaction
  -- pending; any exception rolls back the whole callback statement atomically.
  if normalized_status in ('failed', 'reversed') then
    if not public.refund_datasub_wallet(
      tx.user_id, tx.id, tx.amount, 'REFUND:' || tx.reference
    ) then
      update public.datasub_provider_events
      set processing_result = 'rejected'
      where id = event_id;
      return jsonb_build_object('status', 'rejected', 'reason', 'refund_not_applied');
    end if;
  end if;

  update public.datasub_transactions
  set status = normalized_status,
      provider_reference = p_provider_reference,
      updated_at = now()
  where id = tx.id;

  update public.datasub_provider_events
  set processing_result = 'processed'
  where id = event_id;

  update public.datasub_provider_connections
  set status = case when normalized_status = 'success' then 'online' else 'degraded' end,
      available_balance = coalesce(p_available_balance, available_balance),
      average_response_ms = coalesce(p_response_ms, average_response_ms),
      last_callback_at = now(),
      updated_at = now()
  where code = p_provider_code;

  return jsonb_build_object(
    'status', 'processed',
    'reference', tx.reference,
    'transaction_status', normalized_status
  );
end;
$function$;

revoke all on function public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb)
  from public, anon, authenticated;
grant execute on function public.process_datasub_provider_callback(text,text,text,text,text,numeric,integer,jsonb)
  to service_role;
