create or replace function public.review_datasub_network_availability(p_provider uuid,p_service text,p_network text,p_available boolean,p_evidence text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(private.is_active_account(),false) or not coalesce(private.has_product_access('datasub','approve'),false) then raise exception 'Administrator approval access required';end if;
 if p_available is null or length(trim(coalesce(p_evidence,'')))<10 then raise exception 'Confirmed availability and review evidence required';end if;
 if upper(p_service) not in ('DATA','AIRTIME','CABLE','ELECTRICITY','EXAM') or not exists(select 1 from public.datasub_upstream_catalog where provider_id=p_provider and upper(service_type)=upper(p_service) and upper(network)=upper(p_network)) then raise exception 'Service network not found';end if;
 insert into public.datasub_network_availability(provider_id,service_type,network,available,evidence_source)
 values(p_provider,upper(p_service),upper(p_network),p_available,trim(p_evidence))
 on conflict(provider_id,service_type,network) do update set available=excluded.available,evidence_source=excluded.evidence_source,checked_at=now();
 insert into public.audit_logs(actor_id,action,product,target_type,target_id,metadata) values(auth.uid(),'datasub_network_availability_review','datasub','datasub_provider',p_provider::text,jsonb_build_object('service',upper(p_service),'network',upper(p_network),'available',p_available,'evidence',trim(p_evidence)));
 return jsonb_build_object('available',p_available,'service',upper(p_service),'network',upper(p_network));
end $$;
revoke all on function public.review_datasub_network_availability(uuid,text,text,boolean,text) from public,anon;
grant execute on function public.review_datasub_network_availability(uuid,text,text,boolean,text) to authenticated;
grant select on public.datasub_network_availability to authenticated;
create policy datasub_network_availability_admin_read on public.datasub_network_availability for select to authenticated using(private.is_active_account() and private.has_product_access('datasub','approve'));
