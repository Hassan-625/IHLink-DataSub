-- ============================================================
-- IHLink DataSub Customer Profile / Smart Earner
-- ============================================================

alter table public.profiles
  add column if not exists middle_name text,
  add column if not exists phone text,
  add column if not exists sex text
    check (
      sex is null
      or sex in ('male','female','prefer_not_to_say')
    ),
  add column if not exists newsletter_opt_in boolean
    not null default true;


-- ============================================================
-- CUSTOMER PROFILE UPDATE POLICY
-- ============================================================

drop policy if exists "Users update own profile"
on public.profiles;

create policy "Users update own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
)
with check (
  (select auth.uid()) = id
);

revoke update on public.profiles from authenticated;

grant update(
  first_name,
  middle_name,
  last_name,
  phone,
  sex,
  newsletter_opt_in,
  updated_at
)
on public.profiles
to authenticated;


-- ============================================================
-- DATASUB USER PROVISIONING
-- ============================================================

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_service text :=
    coalesce(
      new.raw_user_meta_data->>'requested_service',
      'datasub'
    );

  is_owner boolean :=
    lower(coalesce(new.email,'')) =
    'hassanisahassan12@gmail.com';

begin

  -- Create DataSub customer profile
  insert into public.profiles (
    id,
    email,
    first_name,
    middle_name,
    last_name,
    phone,
    sex,
    newsletter_opt_in,
    requested_service,
    role
  )
  values (
    new.id,
    coalesce(new.email,''),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'middle_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'sex',
    coalesce(
      (new.raw_user_meta_data->>'newsletter_opt_in')::boolean,
      true
    ),
    requested_service,
    case
      when is_owner
        then 'super_admin'::public.user_role
      else 'customer'::public.user_role
    end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    first_name = excluded.first_name,
    middle_name = excluded.middle_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    sex = excluded.sex,
    newsletter_opt_in = excluded.newsletter_opt_in,
    updated_at = now();


  -- Every standalone DataSub customer receives a wallet.
  insert into public.datasub_wallets (
    user_id
  )
  values (
    new.id
  )
  on conflict (user_id) do nothing;


  -- Standalone DataSub accounts receive DataSub service access.
  insert into public.customer_service_access (
    user_id,
    product,
    status,
    plan_name,
    activated_at
  )
  values (
    new.id,
    'datasub',
    'active',
    'Smart Earner',
    now()
  )
  on conflict (user_id, product) do update
  set
    status = 'active',
    plan_name = coalesce(
      public.customer_service_access.plan_name,
      'Smart Earner'
    ),
    activated_at = coalesce(
      public.customer_service_access.activated_at,
      now()
    );


  -- Owner receives full DataSub administrative permissions.
  if is_owner then

    insert into public.admin_product_access (
      user_id,
      product,
      can_view,
      can_edit,
      can_approve
    )
    values (
      new.id,
      'datasub',
      true,
      true,
      true
    )
    on conflict (user_id, product) do update
    set
      can_view = true,
      can_edit = true,
      can_approve = true;

  end if;

  return new;

end;
$$;

revoke all
on function private.handle_new_user()
from public, anon, authenticated;