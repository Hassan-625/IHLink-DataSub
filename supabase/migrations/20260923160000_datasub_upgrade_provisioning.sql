create or replace function public.review_datasub_upgrade_request(p_request_id uuid,p_approve boolean)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_request public.datasub_upgrade_requests%rowtype;
  v_offer public.datasub_upgrade_offers%rowtype;
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null or not private.has_product_access('datasub','approve') then
    raise exception 'DataSub approval permission required';
  end if;

  select * into v_request from public.datasub_upgrade_requests where id=p_request_id for update;
  if not found then raise exception 'Upgrade request not found'; end if;
  if v_request.status <> 'pending' then raise exception 'Upgrade request has already been reviewed'; end if;
  select * into v_offer from public.datasub_upgrade_offers where code=v_request.offer_code;
  if not found then raise exception 'Upgrade offer not found'; end if;
  select * into v_profile from public.profiles where id=v_request.user_id;

  if p_approve then
    if v_offer.target_tier_code is not null then
      insert into public.datasub_reseller_accounts(user_id,business_name,phone,tier_code,status,approved_by,approved_at)
      values(
        v_request.user_id,
        coalesce(nullif(trim(concat_ws(' ',v_profile.first_name,v_profile.last_name)),''),'IHLink Reseller'),
        coalesce(nullif(v_profile.phone,''),'Not provided'),
        v_offer.target_tier_code,'active',auth.uid(),now()
      )
      on conflict(user_id) do update set
        tier_code=excluded.tier_code,status='active',approved_by=auth.uid(),approved_at=now(),updated_at=now();
    end if;

    update public.datasub_upgrade_requests
      set status='approved',reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now()
      where id=p_request_id;
  else
    update public.datasub_upgrade_requests
      set status='rejected',reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now()
      where id=p_request_id;
  end if;
end;
$$;

revoke all on function public.review_datasub_upgrade_request(uuid,boolean) from public,anon;
grant execute on function public.review_datasub_upgrade_request(uuid,boolean) to authenticated;
