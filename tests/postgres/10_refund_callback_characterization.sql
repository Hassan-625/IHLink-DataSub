\set ON_ERROR_STOP on
\echo 'Regression: reject mismatched owner, amount, and arbitrary refund reference.'
INSERT INTO auth.users(id) VALUES
 ('00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;
INSERT INTO public.datasub_wallets(user_id,balance) VALUES
 ('00000000-0000-0000-0000-000000000001',1000),
 ('00000000-0000-0000-0000-000000000002',50)
ON CONFLICT(user_id) DO UPDATE SET balance=excluded.balance;
INSERT INTO public.datasub_transactions(id,user_id,reference,amount,status,provider,routing_state)
VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','PG-REFUND-OWNER',100,'pending','primary_vtu','ROUTING')
ON CONFLICT(id) DO NOTHING;
DO $$
BEGIN
  IF NOT public.reserve_datasub_wallet('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',100,'RESERVE:PG-REFUND-OWNER') THEN
    RAISE EXCEPTION 'Expected valid reservation to succeed';
  END IF;
  IF NOT public.reserve_datasub_wallet('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',100,'RESERVE:PG-REFUND-OWNER') THEN
    RAISE EXCEPTION 'Exact reservation retry should be idempotent';
  END IF;
  UPDATE public.datasub_transactions SET routing_state='RECONCILING'
  WHERE id='10000000-0000-0000-0000-000000000001';
  IF NOT public.reserve_datasub_wallet('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',100,'RESERVE:PG-REFUND-OWNER') THEN
    RAISE EXCEPTION 'Exact reservation retry should remain idempotent after routing advances';
  END IF;
  UPDATE public.datasub_transactions SET routing_state='ROUTING'
  WHERE id='10000000-0000-0000-0000-000000000001';
  IF public.reserve_datasub_wallet('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001',100,'RESERVE:PG-REFUND-OWNER') THEN
    RAISE EXCEPTION 'Mismatched reservation owner unexpectedly accepted';
  END IF;
  IF public.refund_datasub_wallet('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001',999,'ARBITRARY:REFERENCE') THEN
    RAISE EXCEPTION 'Mismatched owner/amount/arbitrary reference refund unexpectedly accepted';
  END IF;
  IF (SELECT balance FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000002') <> 50 THEN
    RAISE EXCEPTION 'Rejected refund changed the non-owner wallet';
  END IF;
  IF (SELECT balance FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000001') <> 900 THEN
    RAISE EXCEPTION 'Reservation idempotency failed: wallet was debited more than once';
  END IF;
END $$;

\echo 'Regression: canonical refund requires REFUND_PENDING and matching reservation; retries do not double-credit.'
UPDATE public.datasub_transactions SET routing_state='REFUND_PENDING'
WHERE id='10000000-0000-0000-0000-000000000001';
DO $$
BEGIN
  IF NOT public.refund_datasub_wallet('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',100,'REFUND:PG-REFUND-OWNER') THEN
    RAISE EXCEPTION 'Valid canonical refund rejected';
  END IF;
  IF NOT public.refund_datasub_wallet('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',100,'REFUND:PG-REFUND-OWNER') THEN
    RAISE EXCEPTION 'Exact canonical refund retry should be idempotent';
  END IF;
  IF public.refund_datasub_wallet('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',99,'REFUND:PG-REFUND-OWNER') THEN
    RAISE EXCEPTION 'Mismatched refund amount unexpectedly accepted';
  END IF;
  IF (SELECT balance FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000001') <> 1000 THEN
    RAISE EXCEPTION 'Canonical refund balance/idempotency invariant failed';
  END IF;
  IF (SELECT count(*) FROM public.wallet_ledger WHERE transaction_id='10000000-0000-0000-0000-000000000001' AND entry_type='refund') <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one canonical refund ledger row';
  END IF;
END $$;

\echo 'Regression: failed/reversed provider callback uses the canonical ledger refund and enforces provider binding.'
UPDATE public.datasub_provider_connections SET is_active=true,status='online' WHERE code='primary_vtu';
UPDATE public.datasub_provider_connections SET is_active=true,status='online' WHERE code='backup_vtu';
INSERT INTO public.datasub_transactions(id,user_id,reference,amount,status,provider,routing_state)
VALUES ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','PG-CALLBACK-FAIL',75,'pending','primary_vtu','ROUTING')
ON CONFLICT(id) DO NOTHING;
SELECT public.reserve_datasub_wallet('00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',75,'RESERVE:PG-CALLBACK-FAIL');
SELECT public.process_datasub_provider_callback(
 'primary_vtu','PG-EVENT-FAIL-001','PG-CALLBACK-FAIL','failed','provider-ref-1',null,20,'{"fixture":true}'::jsonb
);
DO $$
BEGIN
  IF (SELECT balance FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000001') <> 1000 THEN
    RAISE EXCEPTION 'Failed callback did not restore exactly the reserved amount';
  END IF;
  IF (SELECT status FROM public.datasub_transactions WHERE id='20000000-0000-0000-0000-000000000001') <> 'failed'
     OR (SELECT routing_state FROM public.datasub_transactions WHERE id='20000000-0000-0000-0000-000000000001') <> 'REFUNDED' THEN
    RAISE EXCEPTION 'Failed callback did not reach expected terminal state';
  END IF;
  IF (SELECT count(*) FROM public.wallet_ledger WHERE transaction_id='20000000-0000-0000-0000-000000000001' AND entry_type='refund') <> 1 THEN
    RAISE EXCEPTION 'Failed callback did not create exactly one refund ledger row';
  END IF;
END $$;
SELECT public.process_datasub_provider_callback(
 'primary_vtu','PG-EVENT-FAIL-001','PG-CALLBACK-FAIL','failed','provider-ref-1',null,20,'{"fixture":true}'::jsonb
);
DO $$
BEGIN
  IF (SELECT balance FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000001') <> 1000 THEN
    RAISE EXCEPTION 'Duplicate callback changed wallet balance';
  END IF;
  IF (SELECT count(*) FROM public.wallet_ledger WHERE transaction_id='20000000-0000-0000-0000-000000000001' AND entry_type='refund') <> 1 THEN
    RAISE EXCEPTION 'Duplicate callback created an extra refund';
  END IF;
END $$;

INSERT INTO public.datasub_transactions(id,user_id,reference,amount,status,provider,routing_state)
VALUES ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','PG-CALLBACK-PROVIDER',20,'pending','primary_vtu','ROUTING')
ON CONFLICT(id) DO NOTHING;
DO $$
BEGIN
  BEGIN
    PERFORM public.process_datasub_provider_callback(
      'backup_vtu','PG-EVENT-MISMATCH-01','PG-CALLBACK-PROVIDER','failed','provider-ref-x',null,10,'{}'::jsonb
    );
    RAISE EXCEPTION 'Provider mismatch unexpectedly accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'Provider mismatch unexpectedly accepted' THEN RAISE; END IF;
    IF position('Provider does not match transaction' in SQLERRM) = 0 THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.datasub_transactions WHERE id='30000000-0000-0000-0000-000000000001') <> 'pending' THEN
    RAISE EXCEPTION 'Provider mismatch changed transaction state';
  END IF;
  IF EXISTS (SELECT 1 FROM public.datasub_provider_events WHERE external_event_id='PG-EVENT-MISMATCH-01') THEN
    RAISE EXCEPTION 'Rejected provider mismatch event was not rolled back';
  END IF;
END $$;

\echo 'Regression: missing reservation rejects failed callback without changing wallet or finalizing transaction.'
INSERT INTO public.datasub_transactions(id,user_id,reference,amount,status,provider,routing_state)
VALUES ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','PG-CALLBACK-NO-RESERVE',30,'pending','primary_vtu','ROUTING')
ON CONFLICT(id) DO NOTHING;
DO $$
BEGIN
  BEGIN
    PERFORM public.process_datasub_provider_callback(
      'primary_vtu','PG-EVENT-NO-RESERVE','PG-CALLBACK-NO-RESERVE','reversed','provider-ref-z',null,10,'{}'::jsonb
    );
    RAISE EXCEPTION 'Callback without reservation unexpectedly accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'Callback without reservation unexpectedly accepted' THEN RAISE; END IF;
    IF position('Refund rejected' in SQLERRM) = 0 THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.datasub_transactions WHERE id='40000000-0000-0000-0000-000000000001') <> 'pending' THEN
    RAISE EXCEPTION 'Rejected callback finalized a transaction with no reservation';
  END IF;
  IF EXISTS (SELECT 1 FROM public.datasub_provider_events WHERE external_event_id='PG-EVENT-NO-RESERVE') THEN
    RAISE EXCEPTION 'Rejected callback event was not rolled back';
  END IF;
  IF (SELECT balance FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000001') <> 1000 THEN
    RAISE EXCEPTION 'Rejected callback changed wallet balance';
  END IF;
END $$;


\echo 'Regression: reversed provider outcome preserves reversed terminal status while refunding exactly once.'
INSERT INTO public.datasub_transactions(id,user_id,reference,amount,status,provider,routing_state)
VALUES ('60000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','PG-CALLBACK-REVERSED',15,'pending','primary_vtu','ROUTING')
ON CONFLICT(id) DO NOTHING;
SELECT public.reserve_datasub_wallet('00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',15,'RESERVE:PG-CALLBACK-REVERSED');
SELECT public.process_datasub_provider_callback('primary_vtu','PG-EVENT-REVERSED-01','PG-CALLBACK-REVERSED','reversed','provider-ref-reversed',null,10,'{"fixture":true}'::jsonb);
DO $$
BEGIN
  IF (SELECT status FROM public.datasub_transactions WHERE id='60000000-0000-0000-0000-000000000001') <> 'reversed' THEN
    RAISE EXCEPTION 'Reversed provider outcome was incorrectly collapsed into failed';
  END IF;
  IF (SELECT routing_state FROM public.datasub_transactions WHERE id='60000000-0000-0000-0000-000000000001') <> 'REFUNDED' THEN
    RAISE EXCEPTION 'Reversed transaction was not marked refunded';
  END IF;
  IF (SELECT balance FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000001') <> 1000 THEN
    RAISE EXCEPTION 'Reversed callback did not refund the reserved amount exactly once';
  END IF;
END $$;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.wallet_ledger WHERE user_id='00000000-0000-0000-0000-000000000001' AND entry_type='reserve')
     <> (SELECT count(*) FROM public.wallet_ledger WHERE user_id='00000000-0000-0000-0000-000000000001' AND entry_type='refund') THEN
    RAISE EXCEPTION 'Wallet ledger reserve/refund entries do not reconcile in this fully-refunded fixture';
  END IF;
  IF has_function_privilege('anon','public.refund_datasub_wallet(uuid,uuid,numeric,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.refund_datasub_wallet(uuid,uuid,numeric,text)','EXECUTE') THEN
    RAISE EXCEPTION 'Untrusted role unexpectedly has refund function EXECUTE';
  END IF;
  IF NOT has_function_privilege('service_role','public.refund_datasub_wallet(uuid,uuid,numeric,text)','EXECUTE') THEN
    RAISE EXCEPTION 'service_role is missing refund function EXECUTE';
  END IF;
END $$;
\echo 'PASS: hardened refund/callback invariants hold in disposable PostgreSQL; this is not full production-schema parity.'
