-- Scope DataSub upstream catalogue and routing visibility to authorized DataSub administrators
drop policy if exists "admins read upstream catalogue" on public.datasub_upstream_catalog;
drop policy if exists "datasub scoped admins read upstream catalogue" on public.datasub_upstream_catalog;
create policy "datasub scoped admins read upstream catalogue" on public.datasub_upstream_catalog for select to authenticated using (private.has_product_access('datasub','view'));
drop policy if exists "admins read catalogue routes" on public.datasub_catalog_routes;
drop policy if exists "datasub scoped admins read catalogue routes" on public.datasub_catalog_routes;
create policy "datasub scoped admins read catalogue routes" on public.datasub_catalog_routes for select to authenticated using (private.has_product_access('datasub','view'));