-- Characterize the dangerous gap between refund RPC commit and finalizeRefund's status update.
-- The refund RPC is a separate transaction; then a success callback arrives before the
-- Edge Function's final status update. This test must reject a success/refund split-brain.
INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
INSERT INTO public.datasub_wallets(user_id,balance)
VALUES ('00000000-0000-0000-0000-000000000006',70)
ON CONFLICT(user_id) DO UPDATE SET balance=excluded.balance;
UPDATE public.datasub_provider_connections SET is_active=true,status='online'
WHERE code IN ('primary_vtu','backup_vtu');
INSERT INTO public.datasub_transactions(id,user_id,reference,amount,status,provider,routing_state)
VALUES ('a0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000006',
'PG-LATE-SUCCESS-AFTER-REFUND',20,'pending','primary_vtu','ROUTING');
SELECT public.reserve_datasub_wallet('00000000-0000-0000-0000-000000000006',
'a0000000-0000-0000-0000-000000000001',20,'RESERVE:PG-LATE-SUCCESS-AFTER-REFUND');
UPDATE public.datasub_transactions SET routing_state='REFUND_PENDING'
WHERE id='a0000000-0000-0000-0000-000000000001';
-- Simulate finalizeRefund's successful wallet RPC commit.
SELECT public.refund_datasub_wallet('00000000-0000-0000-0000-000000000006',
'a0000000-0000-0000-0000-000000000001',20,'REFUND:PG-LATE-SUCCESS-AFTER-REFUND');
-- A success callback arrives before finalizeRefund performs its final status update.
SELECT public.process_datasub_provider_callback('primary_vtu','PG-EVENT-LATE-SUCCESS',
'PG-LATE-SUCCESS-AFTER-REFUND','success','provider-ref-late-success',null,10,'{}'::jsonb);
DO $$
DECLARE s text; r text; b numeric; refunds integer;
BEGIN
 SELECT status::text,routing_state INTO s,r FROM public.datasub_transactions
 WHERE id='a0000000-0000-0000-0000-000000000001';
 SELECT balance INTO b FROM public.datasub_wallets WHERE user_id='00000000-0000-0000-0000-000000000006';
 SELECT count(*) INTO refunds FROM public.wallet_ledger WHERE transaction_id='a0000000-0000-0000-0000-000000000001' AND entry_type='refund';
 IF s='failed' AND r='REFUNDED' AND b=70 AND refunds=1 THEN RETURN; END IF;
 RAISE EXCEPTION 'Late-success/refund race produced inconsistent outcome: status %, routing %, balance %, refunds %',s,r,b,refunds;
END $$;
