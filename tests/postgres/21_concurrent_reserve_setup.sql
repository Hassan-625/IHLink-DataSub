-- Concurrency setup for two simultaneous attempts to reserve the same transaction.
-- Disposable PostgreSQL only; a brief trigger delay widens the race window.
INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
INSERT INTO public.datasub_wallets(user_id,balance)
VALUES ('00000000-0000-0000-0000-000000000003',50)
ON CONFLICT(user_id) DO UPDATE SET balance=excluded.balance;
INSERT INTO public.datasub_transactions(
  id,user_id,reference,amount,status,provider,routing_state
) VALUES (
  '70000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'PG-CONCURRENT-RESERVE',10,'pending','primary_vtu','ROUTING'
);
CREATE FUNCTION public.audit_delay_concurrent_reserve_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.entry_type='reserve'
     AND NEW.transaction_id='70000000-0000-0000-0000-000000000001' THEN
    PERFORM pg_sleep(0.75);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER audit_delay_concurrent_reserve_insert
BEFORE INSERT ON public.wallet_ledger
FOR EACH ROW EXECUTE FUNCTION public.audit_delay_concurrent_reserve_insert();
