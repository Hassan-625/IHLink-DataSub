create table public.datasub_reseller_commissions (
  id uuid primary key default gen_random_uuid(),
  reseller_user_id uuid not null references public.datasub_reseller_accounts(user_id) on delete cascade,
  transaction_id uuid not null unique references public.datasub_transactions(id) on delete cascade,
  sale_amount numeric(14,2) not null check (sale_amount > 0),
  commission_amount numeric(14,2) not null check (commission_amount >= 0),
  tier_code text not null references public.datasub_reseller_tiers(code),
  calculation_basis text not null check (calculation_basis in ('catalog_margin','tier_discount')),
  created_at timestamptz not null default now()
);

create index datasub_reseller_commissions_user_created_idx
  on public.datasub_reseller_commissions(reseller_user_id,created_at desc);

alter table public.datasub_reseller_commissions enable row level security;

create policy "Resellers and DataSub admins read commissions"
on public.datasub_reseller_commissions for select to authenticated
using (reseller_user_id=(select auth.uid()) or private.has_product_access('datasub','view'));

grant select on public.datasub_reseller_commissions to authenticated;

create or replace function private.record_datasub_reseller_commission()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  reseller public.datasub_reseller_accounts%rowtype;
  tier public.datasub_reseller_tiers%rowtype;
  product public.datasub_products%rowtype;
  earned numeric(14,2);
  basis text;
begin
  if new.status<>'success' or old.status='success' then return new; end if;

  select * into reseller from public.datasub_reseller_accounts
  where user_id=new.user_id and status='active';
  if reseller.user_id is null then return new; end if;

  select * into tier from public.datasub_reseller_tiers
  where code=reseller.tier_code and is_active;
  if tier.code is null then return new; end if;

  select * into product from public.datasub_products
  where is_active and (
    code=upper(coalesce(new.metadata->>'product_code',''))
    or (
      service_type=new.service_type
      and lower(provider)=lower(new.provider)
      and name=coalesce(new.metadata->>'selection','')
    )
  )
  order by routing_priority
  limit 1;

  if product.id is not null then
    earned:=greatest(product.retail_price-new.amount,0);
    basis:='catalog_margin';
  else
    earned:=round(new.amount*(tier.discount_percent/100),2);
    basis:='tier_discount';
  end if;

  insert into public.datasub_reseller_commissions(
    reseller_user_id,transaction_id,sale_amount,commission_amount,tier_code,calculation_basis
  ) values(new.user_id,new.id,new.amount,earned,tier.code,basis)
  on conflict(transaction_id) do nothing;

  if found then
    update public.datasub_reseller_accounts
    set total_sales=total_sales+new.amount,
        total_profit=total_profit+earned,
        updated_at=now()
    where user_id=new.user_id;
  end if;

  return new;
end;
$$;

revoke all on function private.record_datasub_reseller_commission() from public,anon,authenticated;

create trigger record_datasub_reseller_commission_after_success
after update of status on public.datasub_transactions
for each row execute function private.record_datasub_reseller_commission();
