create index if not exists datasub_reseller_accounts_approved_by_idx on public.datasub_reseller_accounts(approved_by);
create index if not exists datasub_reseller_accounts_tier_code_idx on public.datasub_reseller_accounts(tier_code);
create index if not exists datasub_wallet_funding_reviewed_by_idx on public.datasub_wallet_funding_requests(reviewed_by);

drop policy if exists "Authenticated users read active reseller tiers" on public.datasub_reseller_tiers;
drop policy if exists "DataSub editors manage reseller tiers" on public.datasub_reseller_tiers;

create policy "Users read available reseller tiers"
on public.datasub_reseller_tiers for select to authenticated
using (is_active or private.has_product_access('datasub','view'));

create policy "DataSub editors create reseller tiers"
on public.datasub_reseller_tiers for insert to authenticated
with check (private.has_product_access('datasub','edit'));

create policy "DataSub editors update reseller tiers"
on public.datasub_reseller_tiers for update to authenticated
using (private.has_product_access('datasub','edit'))
with check (private.has_product_access('datasub','edit'));

create policy "DataSub editors delete reseller tiers"
on public.datasub_reseller_tiers for delete to authenticated
using (private.has_product_access('datasub','edit'));
