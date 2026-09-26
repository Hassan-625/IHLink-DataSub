create or replace function private.create_datasub_purchase(p_service text,p_provider text,p_recipient text,p_amount numeric,p_metadata jsonb,p_reference text)
returns uuid language plpgsql security definer set search_path='' as $$
declare wallet public.datasub_wallets%rowtype; transaction_id uuid; catalog_price numeric; selected_name text:=nullif(trim(coalesce(p_metadata->>'selection','')),'');
begin
  if p_service not in ('airtime','data','electricity','cable_tv','education') then raise exception 'Unsupported service'; end if;
  if p_amount<=0 or p_amount>500000 then raise exception 'Invalid transaction amount'; end if;
  if char_length(trim(p_provider))<2 or char_length(trim(p_recipient))<5 then raise exception 'Provider and recipient are required'; end if;
  if p_service in ('data','cable_tv','education') then
    if selected_name is null then raise exception 'Select an active product'; end if;
    select retail_price into catalog_price from public.datasub_products where service_type=p_service and lower(provider)=lower(trim(p_provider)) and name=selected_name and is_active order by routing_priority limit 1;
    if catalog_price is null then raise exception 'Selected product is unavailable'; end if;
    if catalog_price<>p_amount then raise exception 'Product price has changed. Refresh and try again'; end if;
  end if;
  if not exists(select 1 from public.customer_service_access where user_id=(select auth.uid()) and product='datasub' and status='active') then raise exception 'Active DataSub access is required'; end if;
  select * into wallet from public.datasub_wallets where user_id=(select auth.uid()) for update;
  if wallet.user_id is null then raise exception 'Wallet not found'; end if;
  if wallet.balance<p_amount then raise exception 'Insufficient wallet balance'; end if;
  insert into public.datasub_transactions(user_id,reference,service_type,provider,recipient,amount,status,metadata)
  values((select auth.uid()),p_reference,p_service,trim(p_provider),trim(p_recipient),p_amount,'pending',coalesce(p_metadata,'{}'::jsonb)) returning id into transaction_id;
  update public.datasub_wallets set balance=balance-p_amount,updated_at=now() where user_id=(select auth.uid());
  return transaction_id;
exception when unique_violation then raise exception 'Duplicate transaction reference';
end; $$;
revoke all on function private.create_datasub_purchase(text,text,text,numeric,jsonb,text) from public,anon;
grant execute on function private.create_datasub_purchase(text,text,text,numeric,jsonb,text) to authenticated;
