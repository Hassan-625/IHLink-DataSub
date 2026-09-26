create type public.wallet_funding_status as enum ('pending','approved','rejected');

create table public.datasub_wallet_funding_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 100 and amount <= 5000000),
  payment_method text not null check (payment_method in ('bank_transfer','card')),
  payment_reference text not null check (char_length(payment_reference) between 4 and 100),
  status public.wallet_funding_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id,payment_reference)
);
create index datasub_funding_user_created_idx on public.datasub_wallet_funding_requests(user_id,created_at desc);
create index datasub_funding_status_created_idx on public.datasub_wallet_funding_requests(status,created_at desc);
alter table public.datasub_wallet_funding_requests enable row level security;

create policy "Customers read own funding requests" on public.datasub_wallet_funding_requests for select to authenticated
using (user_id=(select auth.uid()) or private.has_product_access('datasub','view'));
create policy "Customers create own funding requests" on public.datasub_wallet_funding_requests for insert to authenticated
with check (user_id=(select auth.uid()) and status='pending' and exists (select 1 from public.customer_service_access c where c.user_id=(select auth.uid()) and c.product='datasub' and c.status='active'));
grant select,insert on public.datasub_wallet_funding_requests to authenticated;

create or replace function public.review_datasub_wallet_funding(request_id uuid, decision public.wallet_funding_status)
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
revoke all on function public.review_datasub_wallet_funding(uuid,public.wallet_funding_status) from public,anon;
grant execute on function public.review_datasub_wallet_funding(uuid,public.wallet_funding_status) to authenticated;
