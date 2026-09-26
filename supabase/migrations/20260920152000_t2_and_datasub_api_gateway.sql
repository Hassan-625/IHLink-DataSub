update public.datasub_products
set code='T2_1GB_30D', provider='T2', description='Monthly T2 data bundle', updated_at=now()
where code='9MOBILE_1GB_30D' or lower(provider)='9mobile';

update public.datasub_transactions set provider='T2' where lower(provider)='9mobile';

create or replace function public.create_datasub_api_purchase(
  p_user_id uuid,
  p_credential_id uuid,
  p_product_code text,
  p_recipient text,
  p_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_wallet public.datasub_wallets%rowtype;
  v_product public.datasub_products%rowtype;
  v_transaction_id uuid;
  v_price numeric;
begin
  if not exists (
    select 1 from public.datasub_api_credentials
    where id=p_credential_id and user_id=p_user_id and status='active' and mode='live'
  ) then raise exception 'Active live credential required'; end if;
  if not exists (
    select 1 from public.datasub_reseller_accounts a
    join public.datasub_reseller_tiers t on t.code=a.tier_code
    where a.user_id=p_user_id and a.status='active' and t.is_active and t.api_access
  ) then raise exception 'API-enabled reseller access required'; end if;
  if not exists (
    select 1 from public.customer_service_access
    where user_id=p_user_id and product='datasub' and status='active'
  ) then raise exception 'Active DataSub access required'; end if;
  if char_length(trim(p_recipient))<5 then raise exception 'Valid recipient required'; end if;
  if char_length(trim(p_reference))<8 then raise exception 'Valid unique reference required'; end if;

  select * into v_product from public.datasub_products
  where code=upper(trim(p_product_code)) and is_active
  order by routing_priority limit 1;
  if v_product.id is null then raise exception 'Product unavailable'; end if;
  v_price:=v_product.api_price;

  select * into v_wallet from public.datasub_wallets where user_id=p_user_id for update;
  if v_wallet.user_id is null then raise exception 'Wallet not found'; end if;
  if v_wallet.balance<v_price then raise exception 'Insufficient wallet balance'; end if;

  insert into public.datasub_transactions(user_id,reference,service_type,provider,recipient,amount,status,metadata)
  values(p_user_id,trim(p_reference),v_product.service_type,v_product.provider,trim(p_recipient),v_price,'pending',
    jsonb_build_object('source','api','credential_id',p_credential_id,'product_code',v_product.code,'selection',v_product.name))
  returning id into v_transaction_id;
  update public.datasub_wallets set balance=balance-v_price,updated_at=now() where user_id=p_user_id;

  return jsonb_build_object('transaction_id',v_transaction_id,'reference',trim(p_reference),'status','pending',
    'product_code',v_product.code,'provider',v_product.provider,'amount',v_price,'balance',v_wallet.balance-v_price);
exception when unique_violation then raise exception 'Duplicate transaction reference';
end;
$$;

revoke all on function public.create_datasub_api_purchase(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.create_datasub_api_purchase(uuid,uuid,text,text,text) to service_role;
