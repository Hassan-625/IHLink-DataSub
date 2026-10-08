create table public.datasub_wallet_transfers(id uuid primary key default gen_random_uuid(),sender_id uuid not null references public.profiles(id),recipient_id uuid not null references public.profiles(id),recipient_account_id uuid not null references public.virtual_accounts(id),request_id uuid not null,amount numeric(14,2) not null check(amount>0),created_at timestamptz not null default now(),unique(sender_id,request_id),check(sender_id<>recipient_id));
create index datasub_wallet_transfer_recipient_idx on public.datasub_wallet_transfers(recipient_id,created_at desc);
alter table public.datasub_wallet_transfers enable row level security;
revoke all on public.datasub_wallet_transfers from anon,authenticated;
grant select on public.datasub_wallet_transfers to authenticated;
create policy "Transfer participants view history" on public.datasub_wallet_transfers for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid() or private.is_admin(array['super_admin','finance']::public.user_role[]));
create function public.datasub_transfer_recipient(p_account text,p_bank text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.virtual_accounts;begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and status='active') then raise exception 'Sign in to continue';end if;
 if p_account !~ '^[0-9]{10}$' or p_bank not in('9PSB','PALMPAY') then return null;end if;
 select * into a from public.virtual_accounts where account_number=p_account and upper(bank_id)=p_bank and provider='billstack' and platform_code='datasub' and status='active' and is_customer_visible and user_id<>auth.uid() and exists(select 1 from public.profiles p where p.id=virtual_accounts.user_id and p.status='active');
 if a.id is null then return null;end if;
 return jsonb_build_object('account_id',a.id,'account_name',a.account_name,'bank_name',a.bank_name,'account_number',a.account_number);
end;$$;
revoke all on function public.datasub_transfer_recipient(text,text) from public,anon;
grant execute on function public.datasub_transfer_recipient(text,text) to authenticated;
create function public.datasub_transfer_wallet(p_account_id uuid,p_amount numeric,p_pin text,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare sender uuid:=auth.uid();a public.virtual_accounts;t public.datasub_wallet_transfers;sb numeric;rb numeric;begin
 if sender is null or not exists(select 1 from public.profiles where id=sender and status='active') then raise exception 'Sign in to continue';end if;
 if p_request_id is null or p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) or p_amount>999999999999.99 then raise exception 'Enter a valid transfer amount';end if;
 perform pg_advisory_xact_lock(hashtextextended(sender::text||':'||p_request_id::text,0));
 select * into t from public.datasub_wallet_transfers where sender_id=sender and request_id=p_request_id;
 if t.id is not null then
  if t.recipient_account_id<>p_account_id or t.amount<>p_amount then raise exception 'This transfer reference was already used';end if;
  return jsonb_build_object('ok',true,'id',t.id,'amount',t.amount,'duplicate',true);
 end if;
 if not public.verify_datasub_transaction_pin(sender,p_pin) then return jsonb_build_object('ok',false,'message','Check your purchase PIN or wait before trying again');end if;
 select * into a from public.virtual_accounts where id=p_account_id and provider='billstack' and platform_code='datasub' and status='active' and is_customer_visible and user_id<>sender and exists(select 1 from public.profiles where id=virtual_accounts.user_id and status='active');
 if a.id is null then return jsonb_build_object('ok',false,'message','The receiving IHLinker account is unavailable');end if;
 if not exists(select 1 from public.virtual_accounts where user_id=sender and provider='billstack' and platform_code='datasub' and status='active' and is_customer_visible) then return jsonb_build_object('ok',false,'message','Activate your DataSub funding account before transferring');end if;
 insert into public.datasub_wallets(user_id) values(a.user_id) on conflict(user_id) do nothing;
 perform 1 from public.datasub_wallets where user_id in(sender,a.user_id) order by user_id for update;
 select balance into sb from public.datasub_wallets where user_id=sender;select balance into rb from public.datasub_wallets where user_id=a.user_id;
 if sb is null or sb<p_amount then return jsonb_build_object('ok',false,'message','Your available wallet balance is too low for this transfer');end if;
 insert into public.datasub_wallet_transfers(sender_id,recipient_id,recipient_account_id,request_id,amount) values(sender,a.user_id,a.id,p_request_id,p_amount) returning * into t;
 update public.datasub_wallets set balance=balance-p_amount,updated_at=now() where user_id=sender;update public.datasub_wallets set balance=balance+p_amount,updated_at=now() where user_id=a.user_id;
 insert into public.wallet_ledger(user_id,entry_type,amount,reference,platform_code,provider,internal_reference,direction,transaction_type,balance_before,balance_after,description,metadata)
 values(sender,'debit',p_amount,'IHLP2P-'||t.id::text||'-D','datasub','ihlink_wallet',t.id::text,'debit','wallet_transfer',sb,sb-p_amount,'Transfer to IHLinker wallet',jsonb_build_object('transfer_id',t.id)),(a.user_id,'credit',p_amount,'IHLP2P-'||t.id::text||'-C','datasub','ihlink_wallet',t.id::text,'credit','wallet_transfer',rb,rb+p_amount,'Transfer from IHLinker wallet',jsonb_build_object('transfer_id',t.id));
 return jsonb_build_object('ok',true,'id',t.id,'amount',t.amount,'duplicate',false);
end;$$;
revoke all on function public.datasub_transfer_wallet(uuid,numeric,text,uuid) from public,anon;
grant execute on function public.datasub_transfer_wallet(uuid,numeric,text,uuid) to authenticated;
