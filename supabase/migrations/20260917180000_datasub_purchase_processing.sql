create or replace function private.create_datasub_purchase(p_service text,p_provider text,p_recipient text,p_amount numeric,p_metadata jsonb,p_reference text)
returns uuid language plpgsql security definer set search_path='' as $$
declare wallet public.datasub_wallets%rowtype; transaction_id uuid;
begin
  if p_service not in ('airtime','data','electricity','cable_tv','education') then raise exception 'Unsupported service'; end if;
  if p_amount<=0 or p_amount>500000 then raise exception 'Invalid transaction amount'; end if;
  if char_length(trim(p_provider))<2 or char_length(trim(p_recipient))<5 then raise exception 'Provider and recipient are required'; end if;
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

create or replace function public.create_datasub_purchase(p_service text,p_provider text,p_recipient text,p_amount numeric,p_metadata jsonb,p_reference text)
returns uuid language sql security invoker set search_path='' as $$ select private.create_datasub_purchase(p_service,p_provider,p_recipient,p_amount,p_metadata,p_reference); $$;
revoke all on function public.create_datasub_purchase(text,text,text,numeric,jsonb,text) from public,anon;
grant execute on function public.create_datasub_purchase(text,text,text,numeric,jsonb,text) to authenticated;

create or replace function private.finalize_datasub_transaction(p_transaction_id uuid,p_status public.datasub_transaction_status,p_provider_reference text default null)
returns void language plpgsql security definer set search_path='' as $$
declare tx public.datasub_transactions%rowtype;
begin
  if not private.has_product_access('datasub','approve') then raise exception 'Not authorized to finalize DataSub transactions'; end if;
  if p_status not in ('success','failed','reversed') then raise exception 'Final status must be success, failed or reversed'; end if;
  select * into tx from public.datasub_transactions where id=p_transaction_id for update;
  if tx.id is null then raise exception 'Transaction not found'; end if;
  if tx.status<>'pending' then raise exception 'Transaction has already been finalized'; end if;
  update public.datasub_transactions set status=p_status,provider_reference=p_provider_reference,updated_at=now() where id=p_transaction_id;
  if p_status in ('failed','reversed') then update public.datasub_wallets set balance=balance+tx.amount,updated_at=now() where user_id=tx.user_id; end if;
  insert into public.audit_logs(actor_id,action,product,target_type,target_id) values((select auth.uid()),'DataSub transaction finalized as '||p_status::text,'datasub','datasub_transaction',p_transaction_id::text);
end; $$;
revoke all on function private.finalize_datasub_transaction(uuid,public.datasub_transaction_status,text) from public,anon;
grant execute on function private.finalize_datasub_transaction(uuid,public.datasub_transaction_status,text) to authenticated;

create or replace function public.finalize_datasub_transaction(p_transaction_id uuid,p_status public.datasub_transaction_status,p_provider_reference text default null)
returns void language sql security invoker set search_path='' as $$ select private.finalize_datasub_transaction(p_transaction_id,p_status,p_provider_reference); $$;
revoke all on function public.finalize_datasub_transaction(uuid,public.datasub_transaction_status,text) from public,anon;
grant execute on function public.finalize_datasub_transaction(uuid,public.datasub_transaction_status,text) to authenticated;
