drop policy if exists "Customers apply for reseller account" on public.datasub_reseller_accounts;

create policy "Customers apply for reseller account"
on public.datasub_reseller_accounts
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and tier_code = 'bronze'
  and status = 'pending'
  and total_sales = 0
  and total_profit = 0
  and approved_by is null
  and approved_at is null
);
