-- Payment integrity audit: exact amounts, invoice scope, and replay-safe wallets.
CREATE OR REPLACE FUNCTION public.finalize_host_billstack_payment(p_intent uuid, p_transaction_ref text, p_amount numeric, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare i public.host_payment_intents%rowtype;o public.host_orders%rowtype;pid uuid;act text;provider text;
begin
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) or nullif(btrim(p_transaction_ref),'') is null then raise exception 'Valid amount and transaction reference required'; end if;

 if nullif(btrim(p_transaction_ref),'') is null then raise exception 'Payment transaction reference required'; end if;
 select * into i from public.host_payment_intents where id=p_intent for update;
 if i.id is null then raise exception 'Host payment intent not found'; end if;
 if i.status='paid' then return jsonb_build_object('status','already_paid','order_id',i.order_id); end if;
 if i.status<>'pending' or i.amount<>p_amount then raise exception 'Host payment mismatch'; end if;
 select * into o from public.host_orders where id=i.order_id for update;
 if o.id is null or o.user_id<>i.user_id or o.amount<>p_amount then raise exception 'Host order mismatch'; end if;
 if not exists(select 1 from public.host_invoices v where v.id=i.invoice_id and v.order_id=i.order_id and v.user_id=i.user_id and v.amount=p_amount and v.currency='NGN' and v.status<>'paid') then raise exception 'Host invoice mismatch'; end if;
 if exists(select 1 from public.host_payments where transaction_ref=p_transaction_ref) then raise exception 'Payment reference already processed'; end if;
 insert into public.host_payments(user_id,invoice_id,amount,currency,provider_reference,status,paid_at,virtual_account_id,transaction_ref,verified_at,provider_payload)
 values(i.user_id,i.invoice_id,p_amount,'NGN',p_transaction_ref,'verified',now(),i.virtual_account_id,p_transaction_ref,now(),p_payload) returning id into pid;
 update public.host_invoices set status='paid',paid_at=now(),payment_reference=p_transaction_ref,payment_id=pid,updated_at=now() where id=i.invoice_id and status<>'paid';
 update public.host_orders set payment_status='paid',status='paid',provisioning_status='pending',paid_at=now(),updated_at=now() where id=i.order_id;
 update public.host_payment_intents set status='paid',transaction_ref=p_transaction_ref,paid_at=now(),updated_at=now() where id=i.id;
 act:=case when o.renewal_service_id is not null then 'renew' when o.order_type='domain_registration' then 'domain_register' else 'hosting_provision' end;
 provider:=case when o.order_type='domain_registration' and o.domain_name like '%.ng' then 'nira' when o.order_type='domain_registration' then 'international_registrar' else 'cpanel_whm' end;
 insert into public.host_provisioning_jobs(order_id,user_id,action,provider_code,status)
 values(o.id,o.user_id,act,provider,'queued')
 on conflict(order_id,action) do update set status=case when public.host_provisioning_jobs.status='completed' then 'completed' else 'queued' end,updated_at=now();
 return jsonb_build_object('status','paid','invoice_id',i.invoice_id,'order_id',i.order_id,'provisioning_status','queued');
end $function$;

CREATE OR REPLACE FUNCTION public.finalize_print_billstack_payment(p_intent uuid, p_transaction_ref text, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare i public.print_payment_intents%rowtype; inv public.print_invoices%rowtype; begin
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) or nullif(btrim(p_transaction_ref),'') is null then raise exception 'Valid amount and transaction reference required'; end if;
 select * into i from public.print_payment_intents where id=p_intent for update;if not found or i.status<>'pending' then raise exception 'invalid intent';end if;if p_amount<>i.amount then raise exception 'amount mismatch';end if;select * into inv from public.print_invoices where id=i.invoice_id for update;if inv.id is null or inv.order_id<>i.order_id or inv.currency<>'NGN' or not exists(select 1 from public.print_orders p where p.id=i.order_id and p.user_id=i.user_id) then raise exception 'Invoice scope mismatch'; end if; if p_amount>inv.amount-coalesce(inv.amount_paid,0) then raise exception 'Payment exceeds outstanding invoice balance'; end if; update public.print_invoices set amount_paid=least(amount,amount_paid+p_amount),status=case when amount_paid+p_amount>=amount then 'paid' else 'part_paid' end,updated_at=now() where id=inv.id;update public.print_payment_intents set status='paid',transaction_ref=p_transaction_ref,paid_at=now(),updated_at=now() where id=i.id;update public.print_orders set status=case when status in ('request','quoted','awaiting_payment') then 'artwork' else status end,updated_at=now() where id=i.order_id;insert into public.print_notifications(user_id,order_id,title,body,kind) values(i.user_id,i.order_id,'Payment received','Your Print & Branding payment has been verified.','payment');end $function$;

CREATE OR REPLACE FUNCTION public.finalize_consult_billstack_payment(p_intent uuid, p_transaction_ref text, p_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare i public.consult_payment_intents; inv public.consult_invoices; begin
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) or nullif(btrim(p_transaction_ref),'') is null then raise exception 'Valid amount and transaction reference required'; end if;
 select * into i from public.consult_payment_intents where id=p_intent for update;if not found or i.status<>'pending' then raise exception 'Payment intent unavailable';end if;if i.amount<>p_amount then raise exception 'Amount mismatch';end if;select * into inv from public.consult_invoices where id=i.invoice_id for update;if not found then raise exception 'Invoice unavailable';end if;if inv.id is null or inv.project_id<>i.project_id or inv.currency<>'NGN' or not exists(select 1 from public.consult_projects p where p.id=i.project_id and p.user_id=i.user_id) then raise exception 'Invoice scope mismatch'; end if; if p_amount>inv.amount-coalesce(inv.amount_paid,0) then raise exception 'Payment exceeds outstanding invoice balance'; end if; if exists(select 1 from public.consult_payments where payment_reference=p_transaction_ref) then raise exception 'Duplicate transaction';end if;insert into public.consult_payments(project_id,payment_reference,amount,description,status,paid_at) values(i.project_id,p_transaction_ref,p_amount,'BillStack payment for '||inv.invoice_number,'paid',now());update public.consult_invoices set amount_paid=least(amount,amount_paid+p_amount),status=case when amount_paid+p_amount>=amount then 'paid' else 'part_paid' end,paid_at=case when amount_paid+p_amount>=amount then now() else paid_at end,payment_reference=p_transaction_ref,updated_at=now() where id=inv.id;update public.consult_payment_intents set status='paid',transaction_ref=p_transaction_ref,paid_at=now(),updated_at=now() where id=i.id;update public.consult_projects set status=case when status in('pending','planning','quoted') then 'active' else status end,stage=case when stage in('proposal','quotation','planning') then 'delivery' else stage end,updated_at=now() where id=i.project_id and (select status from public.consult_invoices where id=inv.id)='paid';return jsonb_build_object('status','paid','invoice_id',inv.id,'project_id',i.project_id);end $function$;

CREATE OR REPLACE FUNCTION public.finalize_engineering_billstack_payment(p_intent uuid, p_transaction_ref text, p_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare i public.engineering_payment_intents%rowtype; inv public.engineering_invoices%rowtype; new_paid numeric;
begin
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) or nullif(btrim(p_transaction_ref),'') is null then raise exception 'Valid amount and transaction reference required'; end if;

  select * into i from public.engineering_payment_intents where id=p_intent for update;
  if i.id is null then raise exception 'Engineering payment intent not found'; end if;
  if i.status='paid' then return jsonb_build_object('status','already_paid','intent_id',i.id); end if;
  if i.status<>'pending' then raise exception 'Engineering payment intent is not pending'; end if;
  if round(i.amount,2)<>round(p_amount,2) then raise exception 'Engineering payment amount mismatch'; end if;
  select * into inv from public.engineering_invoices where id=i.invoice_id for update;
  if inv.id is null then raise exception 'Engineering invoice not found'; end if;
  if inv.id is null or inv.project_id<>i.project_id or inv.currency<>'NGN' or not exists(select 1 from public.engineering_projects p where p.id=i.project_id and p.user_id=i.user_id) then raise exception 'Invoice scope mismatch'; end if; if p_amount>inv.amount-coalesce(inv.amount_paid,0) then raise exception 'Payment exceeds outstanding invoice balance'; end if; 
  new_paid := least(inv.amount, coalesce(inv.amount_paid,0)+p_amount);
  update public.engineering_invoices set amount_paid=new_paid,status=case when new_paid>=amount then 'paid' else 'partially_paid' end,updated_at=now() where id=inv.id;
  update public.engineering_payment_intents set status='paid',transaction_ref=p_transaction_ref,paid_at=now(),updated_at=now() where id=i.id;
  insert into public.engineering_notifications(user_id,project_id,title,body,kind)
  values(i.user_id,i.project_id,'Engineering payment received','Payment for invoice '||inv.invoice_number||' has been verified.','payment');
  return jsonb_build_object('status','paid','intent_id',i.id,'invoice_id',inv.id,'amount',p_amount);
end $function$;

create unique index if not exists print_payment_transaction_unique on public.print_payment_intents(transaction_ref) where transaction_ref is not null;
create unique index if not exists engineering_payment_transaction_unique on public.engineering_payment_intents(transaction_ref) where transaction_ref is not null;

create or replace function public.reserve_datasub_wallet(p_user uuid,p_transaction uuid,p_amount numeric,p_reference text)
returns boolean language plpgsql security definer set search_path='' as $$
declare t public.datasub_transactions%rowtype; prior public.wallet_ledger%rowtype; balance_now numeric;
begin
 if p_user is null or p_transaction is null or p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) then return false; end if;
 select * into t from public.datasub_transactions where id=p_transaction for update;
 if t.id is null or t.user_id<>p_user or t.amount<>p_amount or p_reference is distinct from 'RESERVE:'||t.reference then return false; end if;
 select * into prior from public.wallet_ledger where reference=p_reference;
 if prior.id is not null then return prior.user_id=p_user and prior.transaction_id=p_transaction and prior.amount=p_amount and prior.entry_type='reserve'; end if;
 if t.status<>'pending' then return false; end if;
 select balance into balance_now from public.datasub_wallets where user_id=p_user for update;
 if balance_now is null or balance_now<p_amount then return false; end if;
 insert into public.wallet_ledger(user_id,transaction_id,entry_type,amount,reference) values(p_user,p_transaction,'reserve',p_amount,p_reference);
 update public.datasub_wallets set balance=balance-p_amount,updated_at=now() where user_id=p_user;
 return true;
end $$;

create or replace function public.refund_datasub_wallet(p_user uuid,p_transaction uuid,p_amount numeric,p_reference text)
returns boolean language plpgsql security definer set search_path='' as $$
declare t public.datasub_transactions%rowtype; prior public.wallet_ledger%rowtype;
begin
 if p_user is null or p_transaction is null or p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) then return false; end if;
 select * into t from public.datasub_transactions where id=p_transaction for update;
 if t.id is null or t.user_id<>p_user or t.amount<>p_amount or p_reference is distinct from 'REFUND:'||t.reference then return false; end if;
 select * into prior from public.wallet_ledger where reference=p_reference;
 if prior.id is not null then return prior.user_id=p_user and prior.transaction_id=p_transaction and prior.amount=p_amount and prior.entry_type='refund'; end if;
 if t.status='success' or not exists(select 1 from public.wallet_ledger where reference='RESERVE:'||t.reference and user_id=p_user and transaction_id=p_transaction and amount=p_amount and entry_type='reserve') then return false; end if;
 perform 1 from public.datasub_wallets where user_id=p_user for update;
 if not found then raise exception 'DataSub wallet not found'; end if;
 insert into public.wallet_ledger(user_id,transaction_id,entry_type,amount,reference) values(p_user,p_transaction,'refund',p_amount,p_reference);
 update public.datasub_wallets set balance=balance+p_amount,updated_at=now() where user_id=p_user;
 return true;
end $$;
revoke all on function public.reserve_datasub_wallet(uuid,uuid,numeric,text), public.refund_datasub_wallet(uuid,uuid,numeric,text) from public,anon,authenticated;
grant execute on function public.reserve_datasub_wallet(uuid,uuid,numeric,text), public.refund_datasub_wallet(uuid,uuid,numeric,text) to service_role;

