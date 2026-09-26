drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
on public.profiles for update to authenticated
using ((select auth.uid())=id)
with check ((select auth.uid())=id);

revoke update on public.profiles from authenticated;
grant update(first_name,middle_name,last_name,phone,sex,newsletter_opt_in,updated_at)
on public.profiles to authenticated;
