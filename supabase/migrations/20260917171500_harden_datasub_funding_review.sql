create or replace function private.review_datasub_wallet_funding(request_id uuid, decision public.wallet_funding_status)
returns void language plpgsql security definer set search_path='' as $$
declare funding public.datasub_wallet_funding_requests%rowtype;
begin
  if not private.has_product_access('datasub','approve') then raise exception 'Not authorized to approve DataSub funding'; end if;
  if decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
  select * into funding from public.datasub_wallet_funding_requests where id=request_id for update;
  if funding.id is null then raise exception 'Funding request not found'; end if;
  if funding.status <> 'pending' then raise exception 'Funding request has already been reviewed'; end if;
  update public.datasub_wallet_funding_requests set status=decision,reviewed_by=(select auth.uid()),reviewed_at=now(),updated_at=now() where id=request_id;
  if decision='approved' then
    insert into public.datasub_wallets(user_id,balance) values(funding.user_id,funding.amount)
    on conflict(user_id) do update set balance=public.datasub_wallets.balance+excluded.balance,updated_at=now();
  end if;
  insert into public.audit_logs(actor_id,action,product,target_type,target_id)
  values((select auth.uid()),'Wallet funding '||decision::text,'datasub','wallet_funding_request',request_id::text);
end; $$;
revoke all on function private.review_datasub_wallet_funding(uuid,public.wallet_funding_status) from public,anon;
grant execute on function private.review_datasub_wallet_funding(uuid,public.wallet_funding_status) to authenticated;

create or replace function public.review_datasub_wallet_funding(request_id uuid, decision public.wallet_funding_status)
returns void language sql security invoker set search_path='' as $$
  select private.review_datasub_wallet_funding(request_id,decision);
$$;
revoke all on function public.review_datasub_wallet_funding(uuid,public.wallet_funding_status) from public,anon;
grant execute on function public.review_datasub_wallet_funding(uuid,public.wallet_funding_status) to authenticated;
