create or replace function private.has_product_access(
  target_product text,
  required_permission text default 'view'
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
      and (
        p.role = 'super_admin'::public.user_role
        or exists (
          select 1
          from public.admin_product_access a
          where a.user_id = p.id
            and a.product = target_product
            and case required_permission
              when 'approve' then a.can_approve
              when 'edit' then a.can_edit
              else a.can_view
            end
        )
      )
  );
$$;

revoke all
on function private.has_product_access(text,text)
from public, anon, authenticated;

grant execute
on function private.has_product_access(text,text)
to authenticated;


-- ============================================================
-- DATASUB CUSTOMER SERVICE ACCESS
-- ============================================================

drop policy if exists "Users read their service access"
on public.customer_service_access;

drop policy if exists "Super admins create service access"
on public.customer_service_access;

drop policy if exists "Super admins update service access"
on public.customer_service_access;

drop policy if exists "Super admins delete service access"
on public.customer_service_access;

drop policy if exists "Users and scoped admins read service access"
on public.customer_service_access;

drop policy if exists "Scoped admins create service access"
on public.customer_service_access;

drop policy if exists "Scoped admins update service access"
on public.customer_service_access;

drop policy if exists "Scoped admins delete service access"
on public.customer_service_access;


create policy "Users and scoped admins read service access"
on public.customer_service_access
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or private.has_product_access(product, 'view')
);


create policy "Scoped admins create service access"
on public.customer_service_access
for insert
to authenticated
with check (
  private.has_product_access(product, 'approve')
);


create policy "Scoped admins update service access"
on public.customer_service_access
for update
to authenticated
using (
  private.has_product_access(product, 'approve')
)
with check (
  private.has_product_access(product, 'approve')
);


create policy "Scoped admins delete service access"
on public.customer_service_access
for delete
to authenticated
using (
  private.has_product_access(product, 'approve')
);