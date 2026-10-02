drop policy if exists "Owners manage airtime conversions" on public.datasub_airtime_conversion_requests;
create policy "Owners read airtime conversions" on public.datasub_airtime_conversion_requests for select to authenticated using (user_id=(select auth.uid()));
create policy "Owners create airtime conversions" on public.datasub_airtime_conversion_requests for insert to authenticated with check (user_id=(select auth.uid()) and status='awaiting_provider' and quoted_cash_amount is null and provider_reference is null);

drop policy if exists "Owners manage voucher batches" on public.datasub_voucher_batches;
create policy "Owners read voucher batches" on public.datasub_voucher_batches for select to authenticated using (user_id=(select auth.uid()));
create policy "Owners create voucher batches" on public.datasub_voucher_batches for insert to authenticated with check (user_id=(select auth.uid()) and status='awaiting_provider' and provider_reference is null);