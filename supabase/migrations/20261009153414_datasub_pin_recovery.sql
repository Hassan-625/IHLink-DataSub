create table public.datasub_pin_recovery_attempts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts between 1 and 6)
);
alter table public.datasub_pin_recovery_attempts enable row level security;
revoke all on public.datasub_pin_recovery_attempts from public, anon, authenticated;
grant all on public.datasub_pin_recovery_attempts to service_role;

create function public.claim_datasub_pin_recovery(p_user uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare count_used integer;
begin
  insert into public.datasub_pin_recovery_attempts as a(user_id) values(p_user)
  on conflict(user_id) do update set
    attempts = case when a.window_started_at <= now() - interval '15 minutes' then 1 else least(a.attempts + 1, 6) end,
    window_started_at = case when a.window_started_at <= now() - interval '15 minutes' then now() else a.window_started_at end
  returning attempts into count_used;
  return count_used <= 5;
end $$;

create function public.recover_datasub_transaction_pin(p_user uuid, p_pin text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if p_pin is null or p_pin !~ '^[0-9]{4}$' then raise exception 'Invalid PIN'; end if;
  insert into public.datasub_transaction_pins(user_id,pin_hash,failed_attempts,locked_until,updated_at)
  values(p_user,extensions.crypt(p_pin,extensions.gen_salt('bf')),0,null,now())
  on conflict(user_id) do update set pin_hash=excluded.pin_hash,failed_attempts=0,locked_until=null,updated_at=now();
end $$;
revoke all on function public.claim_datasub_pin_recovery(uuid) from public, anon, authenticated;
revoke all on function public.recover_datasub_transaction_pin(uuid,text) from public, anon, authenticated;
grant execute on function public.claim_datasub_pin_recovery(uuid) to service_role;
grant execute on function public.recover_datasub_transaction_pin(uuid,text) to service_role;
