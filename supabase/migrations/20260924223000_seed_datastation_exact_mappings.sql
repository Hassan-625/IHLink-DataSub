-- DataStation mappings from supplied provider catalogue. Only exact canonical matches are routed.
insert into public.datasub_provider_products(product_id,provider_id,external_plan_id,provider_cost,active,last_synced_at,raw_metadata)
select p.id, provider.id, v.plan_id, v.cost, true, now(), jsonb_build_object('source','DataStation supplied catalogue 2026-09-24','network',p.provider,'plan_type',p.plan_category,'validity',p.validity_label)
from (values
 ('MTN_1_5GB_GIFT_2D_USER','364',582.00::numeric),('MTN_2GB_GIFT_2D_USER','318',727.50::numeric),('MTN_2_5GB_GIFT_2D_USER','317',882.00::numeric),('MTN_3_2GB_GIFT_2D_USER','216',980.00::numeric),
 ('GLO_500MB_CORP_30D_USER','203',195.00::numeric),('GLO_1GB_CORP_30D_USER','194',390.00::numeric),('GLO_2GB_CORP_30D_USER','195',780.00::numeric),('GLO_3GB_CORP_30D_USER','196',1170.00::numeric),('GLO_5GB_CORP_30D_USER','197',1950.00::numeric),('GLO_10GB_CORP_30D_USER','200',3900.00::numeric)
) v(code,plan_id,cost)
join public.datasub_products p on p.code=v.code
cross join lateral (select id from public.datasub_providers where code='datastation') provider
on conflict (product_id,provider_id,external_plan_id) do update set provider_cost=excluded.provider_cost,active=true,last_synced_at=excluded.last_synced_at,raw_metadata=excluded.raw_metadata;
