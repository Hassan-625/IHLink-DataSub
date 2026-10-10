-- API approval is explicit and independent of reseller price bands.
create or replace function public.create_datasub_api_credential(p_label text,p_mode text default 'sandbox') returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=(select auth.uid()); secret text; key_id uuid;
begin
 if u is null or not private.is_active_account() then raise exception 'Active account required'; end if;
 if p_mode not in ('sandbox','live') or p_label is null or char_length(trim(p_label)) not between 2 and 60 then raise exception 'Valid label and API mode required'; end if;
 if not exists(select 1 from public.datasub_reseller_accounts where user_id=u and status='active' and api_access_approved) or not exists(select 1 from public.customer_service_access where user_id=u and product='datasub' and status='active') then raise exception 'Approved API access required'; end if;
 perform 1 from public.profiles where id=u for update;
 if (select count(*) from public.datasub_api_credentials where user_id=u and status='active')>=5 then raise exception 'Maximum of five active API keys reached'; end if;
 secret:='ihl_'||p_mode||'_sk_'||encode(extensions.gen_random_bytes(32),'hex');
 insert into public.datasub_api_credentials(user_id,label,key_prefix,key_hash,mode) values(u,trim(p_label),left(secret,18),encode(extensions.digest(secret,'sha256'),'hex'),p_mode) returning id into key_id;
 return jsonb_build_object('id',key_id,'secret',secret,'mode',p_mode,'key_prefix',left(secret,18));
end $$;
revoke all on function public.create_datasub_api_credential(text,text) from public,anon;
grant execute on function public.create_datasub_api_credential(text,text) to authenticated;

create table private.datasub_webhook_keys(webhook_id uuid primary key references public.datasub_api_webhooks(id) on delete cascade,secret text not null);
revoke all on private.datasub_webhook_keys from public,anon,authenticated;
create table private.datasub_api_limits(user_id uuid primary key references auth.users(id) on delete cascade,window_start timestamptz not null,calls integer not null);
revoke all on private.datasub_api_limits from public,anon,authenticated;
create or replace function public.consume_datasub_api_request(p_user_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into private.datasub_api_limits values(p_user_id,date_trunc('minute',now()),1)
 on conflict(user_id) do update set window_start=date_trunc('minute',now()),calls=case when datasub_api_limits.window_start=date_trunc('minute',now()) then datasub_api_limits.calls+1 else 1 end returning calls into n;
 return n<=60;
end $$;
revoke all on function public.consume_datasub_api_request(uuid) from public,anon,authenticated;
grant execute on function public.consume_datasub_api_request(uuid) to service_role;
create table public.datasub_webhook_deliveries(
 id uuid primary key default gen_random_uuid(),webhook_id uuid not null references public.datasub_api_webhooks(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,transaction_id uuid not null references public.datasub_transactions(id),
 event_type text not null,payload jsonb not null,status text not null default 'pending' check(status in ('pending','processing','delivered','failed','cancelled')),
 attempts integer not null default 0,next_attempt_at timestamptz not null default now(),locked_at timestamptz,
 delivered_at timestamptz,last_status_code integer,last_error text,created_at timestamptz not null default now(),
 unique(webhook_id,transaction_id,event_type));
alter table public.datasub_webhook_deliveries enable row level security;
create index datasub_callbacks_ready on public.datasub_webhook_deliveries(next_attempt_at) where status in ('pending','processing');
create policy "Own API delivery history" on public.datasub_webhook_deliveries for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.datasub_webhook_deliveries from public,anon,authenticated;
grant select on public.datasub_webhook_deliveries to authenticated;
grant all on public.datasub_webhook_deliveries to service_role;
revoke all on public.datasub_api_webhooks from public,anon,authenticated;
grant select(id,user_id,url,events,active,created_at) on public.datasub_api_webhooks to authenticated;

create or replace function public.configure_datasub_api_webhook(p_url text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=(select auth.uid()); wid uuid; secret text;
begin
 if u is null or not private.is_active_account() or not exists(select 1 from public.datasub_reseller_accounts where user_id=u and status='active' and api_access_approved) or not exists(select 1 from public.customer_service_access where user_id=u and product='datasub' and status='active') then raise exception 'Approved API access required'; end if;
 if p_url is null or length(p_url)>2048 or p_url !~ '^https://[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z0-9-]+)+(/[^[:space:]#]*)?$' or lower(p_url) ~ '^https://[^/]*\.(local|internal|localhost)(/|$)' then raise exception 'A public HTTPS callback URL is required'; end if;
 perform 1 from public.profiles where id=u for update;
 select id into wid from public.datasub_api_webhooks where user_id=u order by created_at limit 1;
 secret:='ihl_whsec_'||encode(extensions.gen_random_bytes(32),'hex');
 if wid is null then insert into public.datasub_api_webhooks(user_id,url,events,secret_hash,active) values(u,p_url,array['transaction.success','transaction.failed'],encode(extensions.digest(secret,'sha256'),'hex'),true) returning id into wid;
 else update public.datasub_api_webhooks set url=p_url,events=array['transaction.success','transaction.failed'],secret_hash=encode(extensions.digest(secret,'sha256'),'hex'),active=true where id=wid; end if;
 insert into private.datasub_webhook_keys values(wid,secret) on conflict(webhook_id) do update set secret=excluded.secret;
 return jsonb_build_object('id',wid,'secret',secret,'url',p_url);
end $$;
create or replace function public.disable_datasub_api_webhook(p_webhook_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 update public.datasub_api_webhooks set active=false where id=p_webhook_id and user_id=(select auth.uid());
 if not found then raise exception 'Callback not found'; end if;
 update public.datasub_webhook_deliveries set status='cancelled' where webhook_id=p_webhook_id and status in ('pending','processing');
end $$;
revoke all on function public.configure_datasub_api_webhook(text),public.disable_datasub_api_webhook(uuid) from public,anon;
grant execute on function public.configure_datasub_api_webhook(text),public.disable_datasub_api_webhook(uuid) to authenticated;

create or replace function private.queue_datasub_api_callback() returns trigger language plpgsql security definer set search_path='' as $$
declare e text; payload jsonb;
begin
 if coalesce(new.metadata->>'source','')<>'api' or new.status not in ('success','failed') or (tg_op='UPDATE' and new.status=old.status) then return new; end if;
 e:=case when new.status='success' then 'transaction.success' else 'transaction.failed' end;
 payload:=jsonb_build_object('event',e,'created_at',now(),'data',jsonb_build_object('reference',coalesce(new.metadata->>'api_reference',new.reference),'status',case when new.status='success' then 'successful' else 'failed' end,'product_code',new.metadata->>'product_code','recipient',new.recipient,'amount',new.amount,'currency','NGN','refund_status',case when new.routing_state='REFUNDED' then 'refunded' else null end));
 insert into public.datasub_webhook_deliveries(webhook_id,user_id,transaction_id,event_type,payload)
 select id,new.user_id,new.id,e,payload from public.datasub_api_webhooks w where w.user_id=new.user_id and w.active and e=any(w.events) and exists(select 1 from private.datasub_webhook_keys k where k.webhook_id=w.id)
 on conflict(webhook_id,transaction_id,event_type) do nothing;
 return new;
end $$;
create trigger datasub_api_callback after insert or update of status on public.datasub_transactions for each row execute function private.queue_datasub_api_callback();

create or replace function public.claim_datasub_api_callbacks() returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 with picked as(select d.id from public.datasub_webhook_deliveries d join public.datasub_api_webhooks w on w.id=d.webhook_id and w.active join public.datasub_reseller_accounts a on a.user_id=d.user_id and a.status='active' and a.api_access_approved join public.profiles p on p.id=d.user_id and p.status='active' where d.attempts<8 and ((d.status='pending' and d.next_attempt_at<=now()) or (d.status='processing' and d.locked_at<now()-interval '2 minutes')) order by d.created_at limit 20 for update of d skip locked), claimed as(update public.datasub_webhook_deliveries d set status='processing',locked_at=now(),attempts=attempts+1 from picked where d.id=picked.id returning d.*)
 select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('url',w.url,'secret',k.secret)),'[]'::jsonb) into result from claimed c join public.datasub_api_webhooks w on w.id=c.webhook_id join private.datasub_webhook_keys k on k.webhook_id=w.id;
 return result;
end $$;
create or replace function public.ihlink_worker_token() returns text language sql security definer set search_path='' as $$select decrypted_secret from vault.decrypted_secrets where name='ihlink_delivery_worker_token' limit 1$$;
revoke all on function public.claim_datasub_api_callbacks(),public.ihlink_worker_token() from public,anon,authenticated;
grant execute on function public.claim_datasub_api_callbacks(),public.ihlink_worker_token() to service_role;
do $$begin if not exists(select 1 from vault.secrets where name='ihlink_delivery_worker_token') then perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'ihlink_delivery_worker_token'); end if; end$$;
select cron.schedule('datasub-api-callbacks-1m','* * * * *',$job$select net.http_post(url:='https://lnqsroyiybutkfngbyge.supabase.co/functions/v1/datasub-api-callbacks',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='ihlink_delivery_worker_token')),body:='{}'::jsonb);$job$);
