create table if not exists public.datasub_network_availability (
 provider_id uuid not null references public.datasub_providers(id), service_type text not null,
 network text not null, available boolean not null, evidence_source text not null,
 checked_at timestamptz not null default now(), primary key(provider_id,service_type,network)
);
alter table public.datasub_network_availability enable row level security;
revoke all on public.datasub_network_availability from anon,authenticated;
grant all on public.datasub_network_availability to service_role;
insert into public.datasub_network_availability(provider_id,service_type,network,available,evidence_source)
select id,'DATA','MTN',false,'Provider dashboard network unavailable, verified 2026-10-08'
from public.datasub_providers where code in ('datastation','cashsub','legitdataway')
on conflict(provider_id,service_type,network) do update set available=false,evidence_source=excluded.evidence_source,checked_at=now();
create or replace function private.refresh_datasub_service_availability() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.datasub_catalog_availability(offering_id,provider_available,healthy_route_count,updated_at)
 select o.id,count(r.id)>0,count(r.id)::integer,now()
 from public.datasub_catalog_offerings o
 left join (select r.id,r.offering_id from public.datasub_catalog_routes r
  join public.datasub_upstream_catalog u on u.id=r.upstream_catalog_id
  join public.datasub_providers p on p.id=u.provider_id
  join public.datasub_provider_health h on h.provider_id=p.id
  left join public.datasub_network_availability a on a.provider_id=p.id and a.service_type=upper(u.service_type) and a.network=upper(u.network)
  where r.route_enabled and u.active and p.is_active and h.state in ('HEALTHY','DEGRADED') and coalesce(a.available,true)
 ) r on r.offering_id=o.id
 group by o.id
 on conflict(offering_id) do update set provider_available=excluded.provider_available,healthy_route_count=excluded.healthy_route_count,updated_at=excluded.updated_at;
 return null;
end $$;
revoke all on function private.refresh_datasub_service_availability() from public,anon,authenticated;
create trigger datasub_network_availability_refresh after insert or update or delete on public.datasub_network_availability for each statement execute function private.refresh_datasub_service_availability();
create trigger datasub_route_availability_refresh after insert or update or delete on public.datasub_catalog_routes for each statement execute function private.refresh_datasub_service_availability();
create trigger datasub_upstream_availability_refresh after insert or update or delete on public.datasub_upstream_catalog for each statement execute function private.refresh_datasub_service_availability();
create trigger datasub_provider_availability_refresh after insert or update or delete on public.datasub_providers for each statement execute function private.refresh_datasub_service_availability();
create trigger datasub_health_availability_refresh after insert or update or delete on public.datasub_provider_health for each statement execute function private.refresh_datasub_service_availability();
update public.datasub_network_availability set checked_at=checked_at;
