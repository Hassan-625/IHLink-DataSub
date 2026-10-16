\set ON_ERROR_STOP on
\echo 'CHARACTERIZATION: current refund function accepts caller-supplied user, amount and reference without validating transaction ownership/state.'
INSERT INTO auth.users(id) VALUES
 ('00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;
INSERT INTO public.datasub_wallets(user_id,balance) VALUES
 ('00000000-0000-0000-0000-000000000001',1000),
 ('00000000-0000-0000-0000-000000000002',50)
ON CONFLICT(user_id) DO UPDATE SET balance=excluded.balance;
INSERT INTO public.datasub_transactions(id,user_id,reference,amount,status,provider)
VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','PG-REFUND-OWNER',100,'pending','primary_vtu')
ON CONFLICT(id) DO NOTHING;
SELECT public.reserve_datasub_wallet('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',100,'RESERVE:PG-REFUND-OWNER');
SELECT public.refund_datasub_wallet('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001',999,'ARBITRARY:REFERENCE');
DO $$
BEGIN
  IF (SELECT balance FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000002') <> 1049 THEN
    RAISE EXCEPTION 'Expected current-source characterization: mismatched refund did not credit the supplied user/amount';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.wallet_ledger WHERE reference='ARBITRARY:REFERENCE' AND user_id='00000000-0000-0000-0000-000000000002' AND amount=999) THEN
    RAISE EXCEPTION 'Expected current-source characterization: mismatched refund ledger row was not recorded';
  END IF;
END $$;
\echo 'KNOWN GAP REPRODUCED: mismatched transaction owner and amount are accepted by current source function.'
\echo 'CHARACTERIZATION: legacy provider callback credits failed/reversed transactions directly, without the canonical refund ledger path.'
UPDATE public.datasub_provider_connections SET is_active=true,status='online' WHERE code='primary_vtu';
INSERT INTO public.datasub_transactions(id,user_id,reference,amount,status,provider)
VALUES ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','PG-CALLBACK-FAIL',75,'pending','primary_vtu')
ON CONFLICT(id) DO NOTHING;
SELECT public.process_datasub_provider_callback(
 'primary_vtu','PG-EVENT-FAIL-001','PG-CALLBACK-FAIL','failed','provider-ref-1',null,20,'{"fixture":true}'::jsonb
);
DO $$
BEGIN
  IF (SELECT balance FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000001') <> 975 THEN
    RAISE EXCEPTION 'Expected current-source characterization: callback did not directly credit wallet by transaction amount';
  END IF;
  IF EXISTS (SELECT 1 FROM public.wallet_ledger WHERE transaction_id='20000000-0000-0000-0000-000000000001' AND entry_type='refund') THEN
    RAISE EXCEPTION 'Expected current-source characterization: legacy callback unexpectedly used the canonical refund ledger';
  END IF;
  IF (SELECT status FROM public.datasub_transactions WHERE id='20000000-0000-0000-0000-000000000001') <> 'failed' THEN
    RAISE EXCEPTION 'Callback did not finalize transaction status';
  END IF;
END $$;
\echo 'KNOWN GAP REPRODUCED: callback failure changed wallet balance without a refund ledger row.'
\echo 'PASS: isolated database applied checked-in SQL and reproduced the two documented current-source integrity gaps.'
