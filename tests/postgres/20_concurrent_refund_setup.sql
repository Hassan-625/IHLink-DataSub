-- Concurrency setup for the disposable PostgreSQL job only.
-- The short trigger delay widens the overlap window so two independent psql sessions
-- contend on the same transaction row while issuing the same canonical refund.
INSERT INTO public.datasub_transactions(
  id,user_id,reference,amount,status,provider,routing_state
) VALUES (
  '50000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'PG-CONCURRENT-REFUND',10,'pending','primary_vtu','ROUTING'
);
SELECT public.reserve_datasub_wallet(
  '00000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000001',
  10,'RESERVE:PG-CONCURRENT-REFUND'
);
UPDATE public.datasub_transactions SET routing_state='REFUND_PENDING'
WHERE id='50000000-0000-0000-0000-000000000001';

CREATE FUNCTION public.audit_delay_concurrent_refund_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.entry_type='refund'
     AND NEW.transaction_id='50000000-0000-0000-0000-000000000001' THEN
    PERFORM pg_sleep(0.75);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER audit_delay_concurrent_refund_insert
BEFORE INSERT ON public.wallet_ledger
FOR EACH ROW EXECUTE FUNCTION public.audit_delay_concurrent_refund_insert();
