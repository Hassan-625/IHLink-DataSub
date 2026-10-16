-- A stale reconciliation result must not overwrite a provider callback that has already settled the transaction.
INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
INSERT INTO public.datasub_wallets(user_id,balance)
VALUES ('00000000-0000-0000-0000-000000000005',60)
ON CONFLICT(user_id) DO UPDATE SET balance=excluded.balance;
UPDATE public.datasub_provider_connections SET is_active=true,status='online'
WHERE code IN ('primary_vtu','backup_vtu');
INSERT INTO public.datasub_transactions(id,user_id,reference,amount,status,provider,routing_state)
VALUES ('90000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005',
'PG-STALE-RECONCILE',15,'pending','primary_vtu','RECONCILING');
SELECT public.reserve_datasub_wallet('00000000-0000-0000-0000-000000000005',
'90000000-0000-0000-0000-000000000001',15,'RESERVE:PG-STALE-RECONCILE');
SELECT public.process_datasub_provider_callback('primary_vtu','PG-EVENT-STALE-SETTLE',
'PG-STALE-RECONCILE','success','provider-ref-stale',null,10,'{}'::jsonb);
-- Model the reconciliation worker's guarded failure write using its original
-- RECONCILING snapshot. A late write must affect zero rows after callback settlement.
DO $$
DECLARE changed integer;
BEGIN
  UPDATE public.datasub_transactions SET routing_state='REFUND_PENDING'
  WHERE id='90000000-0000-0000-0000-000000000001'
    AND status='pending' AND routing_state='RECONCILING';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'Stale reconciliation overwrote callback settlement'; END IF;
  IF (SELECT status::text FROM public.datasub_transactions WHERE id='90000000-0000-0000-0000-000000000001') <> 'success'
     OR (SELECT routing_state FROM public.datasub_transactions WHERE id='90000000-0000-0000-0000-000000000001') <> 'SETTLED'
     OR (SELECT balance FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000005') <> 45
     OR EXISTS (SELECT 1 FROM public.wallet_ledger WHERE transaction_id='90000000-0000-0000-0000-000000000001' AND entry_type='refund') THEN
    RAISE EXCEPTION 'Stale reconciliation safety invariant failed';
  END IF;
END $$;
