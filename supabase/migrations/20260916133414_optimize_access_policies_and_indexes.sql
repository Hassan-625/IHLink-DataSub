create index audit_logs_actor_id_idx on public.audit_logs (actor_id);

drop policy "Users read own profile" on public.profiles;
drop policy "Admins read profiles" on public.profiles;
drop policy "Super admins manage profiles" on public.profiles;
drop policy "Admins read access" on public.admin_product_access;
drop policy "Super admins manage access" on public.admin_product_access;
drop policy "Authenticated users create attributed logs" on public.audit_logs;

create policy "Users and admins read profiles" on public.profiles for select to authenticated using (id = (select auth.uid()) or private.is_admin());
create policy "Super admins insert profiles" on public.profiles for insert to authenticated with check (private.is_admin(array['super_admin']::public.user_role[]));
create policy "Super admins update profiles" on public.profiles for update to authenticated using (private.is_admin(array['super_admin']::public.user_role[])) with check (private.is_admin(array['super_admin']::public.user_role[]));
create policy "Super admins delete profiles" on public.profiles for delete to authenticated using (private.is_admin(array['super_admin']::public.user_role[]));
create policy "Admins read access" on public.admin_product_access for select to authenticated using (user_id = (select auth.uid()) or private.is_admin());
create policy "Super admins insert access" on public.admin_product_access for insert to authenticated with check (private.is_admin(array['super_admin']::public.user_role[]));
create policy "Super admins update access" on public.admin_product_access for update to authenticated using (private.is_admin(array['super_admin']::public.user_role[])) with check (private.is_admin(array['super_admin']::public.user_role[]));
create policy "Super admins delete access" on public.admin_product_access for delete to authenticated using (private.is_admin(array['super_admin']::public.user_role[]));
create policy "Authenticated users create attributed logs" on public.audit_logs for insert to authenticated with check (actor_id = (select auth.uid()));

grant select, insert, update, delete on public.profiles to authenticated;
