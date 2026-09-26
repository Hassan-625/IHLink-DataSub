create table public.datasub_payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  gateway text not null check (gateway in ('flutterwave')),
  reference text not null unique,
  amount numeric(14,2) not null check (amount >= 100 and amount <= 500000),
  currency text not null default 'NGN' check (currency='NGN'),
  status text not null default 'pending' check (status in ('pending','successful','failed','cancelled')),
  checkout_url text,
  gateway_transaction_id text,
  gateway_payload jsonb not null default '{}'::jsonb,
  credited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index datasub_payment_intents_user_created_idx on public.datasub_payment_intents(user_id,created_at desc);
create index datasub_payment_intents_status_created_idx on public.datasub_payment_intents(status,created_at desc);
alter table public.datasub_payment_intents enable row level security;

create policy "Customers read own payment intents"
on public.datasub_payment_intents for select to authenticated
using (user_id=(select auth.uid()) or private.has_product_access('datasub','view'));

grant select on public.datasub_payment_intents to authenticated;

create or replace function public.finalize_datasub_payment(
  p_reference text,
  p_gateway_transaction_id text,
  p_verified_amount numeric,
  p_status text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare payment public.datasub_payment_intents%rowtype;
begin
  select * into payment from public.datasub_payment_intents where reference=trim(p_reference) for update;
  if payment.id is null then raise exception 'Payment intent not found'; end if;
  if payment.status='successful' then return jsonb_build_object('status','already_credited','reference',payment.reference); end if;
  if payment.status<>'pending' then return jsonb_build_object('status','already_finalized','reference',payment.reference); end if;

  if p_status='successful' then
    if p_verified_amount<>payment.amount then raise exception 'Verified amount does not match payment intent'; end if;
    update public.datasub_wallets set balance=balance+payment.amount,updated_at=now() where user_id=payment.user_id;
    update public.datasub_payment_intents
    set status='successful',gateway_transaction_id=p_gateway_transaction_id,gateway_payload=coalesce(p_payload,'{}'::jsonb),credited_at=now(),updated_at=now()
    where id=payment.id;
  else
    update public.datasub_payment_intents
    set status='failed',gateway_transaction_id=p_gateway_transaction_id,gateway_payload=coalesce(p_payload,'{}'::jsonb),updated_at=now()
    where id=payment.id;
  end if;
  return jsonb_build_object('status',case when p_status='successful' then 'credited' else 'failed' end,'reference',payment.reference,'amount',payment.amount);
end;
$$;

revoke all on function public.finalize_datasub_payment(text,text,numeric,text,jsonb) from public,anon,authenticated;
grant execute on function public.finalize_datasub_payment(text,text,numeric,text,jsonb) to service_role;
