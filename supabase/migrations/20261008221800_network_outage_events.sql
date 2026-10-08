create or replace function private.datasub_attempt_network_availability() returns trigger
language plpgsql security definer set search_path='' as $$
declare t public.datasub_transactions; message text; network_name text;begin
 if new.response_status<>'FAILED' or new.is_ambiguous or nullif(new.provider_reference,'') is not null then return new;end if;
 message:=lower(coalesce(new.safe_response::text,''));
 if message not like '%data not available on this network currently%' and message not like '%mtn%currently not available%' then return new;end if;
 select * into t from public.datasub_transactions where id=new.transaction_id;
 select upper(network) into network_name from public.datasub_catalog_offerings where id=t.catalog_offering_id;
 if t.id is null or lower(t.service_type)<>'data' or network_name not in ('MTN','AIRTEL','GLO','T2','9MOBILE','VITEL') then return new;end if;
 insert into public.datasub_network_availability(provider_id,service_type,network,available,evidence_source)
 values(new.provider_id,'DATA',network_name,false,'Explicit provider network-unavailable response')
 on conflict(provider_id,service_type,network) do update set available=false,evidence_source=excluded.evidence_source,checked_at=now();
 return new;
end $$;
revoke all on function private.datasub_attempt_network_availability() from public,anon,authenticated;
create trigger datasub_attempt_network_availability after insert or update on public.datasub_provider_attempts for each row execute function private.datasub_attempt_network_availability();
