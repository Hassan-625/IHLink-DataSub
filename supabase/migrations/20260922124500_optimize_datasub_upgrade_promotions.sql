create index datasub_upgrade_offers_target_tier_idx
on public.datasub_upgrade_offers(target_tier_code);

create index datasub_upgrade_requests_offer_idx
on public.datasub_upgrade_requests(offer_code);

create index datasub_upgrade_requests_reviewer_idx
on public.datasub_upgrade_requests(reviewed_by);

drop policy if exists "Customers cancel pending upgrades" on public.datasub_upgrade_requests;
drop policy if exists "DataSub approvers review upgrade requests" on public.datasub_upgrade_requests;

create policy "Owners cancel and DataSub approvers review upgrades"
on public.datasub_upgrade_requests for update to authenticated
using (
  ((select auth.uid())=user_id and status='pending')
  or private.has_product_access('datasub','approve')
)
with check (
  ((select auth.uid())=user_id and status='cancelled')
  or private.has_product_access('datasub','approve')
);
