do $$declare c record;begin
for c in select conname from pg_constraint where conrelid='public.datasub_transactions'::regclass and contype='c' and pg_get_constraintdef(oid) like '%service_type%' loop execute format('alter table public.datasub_transactions drop constraint %I',c.conname);end loop;
end $$;
alter table public.datasub_transactions add constraint datasub_transactions_supported_service check(service_type in ('airtime','data','electricity','cable_tv','education','smile','alpha','kirani','data_card','recharge_card','bulk_sms'));
create table public.datasub_purchase_deliveries(transaction_id uuid primary key references public.datasub_transactions(id),user_id uuid not null references auth.users(id),details jsonb not null,created_at timestamptz not null default now());
alter table public.datasub_purchase_deliveries enable row level security;
revoke all on public.datasub_purchase_deliveries from public,anon,authenticated;
grant select on public.datasub_purchase_deliveries to authenticated;
grant all on public.datasub_purchase_deliveries to service_role;
create policy "Customers read their delivered vouchers" on public.datasub_purchase_deliveries for select to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.datasub_transactions t where t.id=transaction_id and t.user_id=(select auth.uid()) and t.status='success'));
create index on public.datasub_purchase_deliveries(user_id);
