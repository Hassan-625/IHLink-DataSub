-- Race a successful provider callback against a reversed callback for one reserved transaction.
-- Disposable PostgreSQL only.
INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;
INSERT INTO public.datasub_wallets(user_id,balance)
VALUES ('00000000-0000-0000-0000-000000000004',50)
ON CONFLICT(user_id) DO UPDATE SET balance=excluded.balance;
UPDATE public.datasub_provider_connections SET is_active=true,status='online'
WHERE code IN ('primary_vtu','backup_vtu');
INSERT INTO public.datasub_transactions(
  id,user_id,reference,amount,status,provider,routing_state
) VALUES (
  '80000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000004',
  'PG-CALLBACK-RACE',10,'pending','primary_vtu','ROUTING'
);
SELECT public.reserve_datasub_wallet(
  '00000000-0000-0000-0000-000000000004',
  '80000000-0000-0000-0000-000000000001',
  10,'RESERVE:PG-CALLBACK-RACE'
);
