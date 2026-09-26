-- Complete unified DataSub catalogue/routing foundation for CashSub, DataStation and Legitdataway.
-- Provider credentials remain server-side; customer catalogue stays provider-agnostic.

-- Amount-based airtime products.
insert into public.datasub_products(code,service_type,provider,name,description,provider_cost,retail_price,reseller_price,api_price,routing_priority,is_active,metadata,plan_category,validity_label,sort_order)
values
('MTN_AIRTIME','airtime','MTN','MTN Airtime','Instant VTU airtime',1,1,1,1,10,true,'{"amount_based":true}'::jsonb,null,'Instant',10),
('AIRTEL_AIRTIME','airtime','Airtel','Airtel Airtime','Instant VTU airtime',1,1,1,1,10,true,'{"amount_based":true}'::jsonb,null,'Instant',20),
('GLO_AIRTIME','airtime','Glo','Glo Airtime','Instant VTU airtime',1,1,1,1,10,true,'{"amount_based":true}'::jsonb,null,'Instant',30),
('T2_AIRTIME','airtime','T2','T2 Airtime','Instant VTU airtime',1,1,1,1,10,true,'{"amount_based":true}'::jsonb,null,'Instant',40)
on conflict(code) do update set is_active=true,metadata=excluded.metadata,updated_at=now();

-- Complete electricity coverage from supplied three-provider catalogue.
with d(code,provider,label,ord) as (values
('IKEDC','IKEDC','Ikeja Electric',10),('EKEDC','EKEDC','Eko Electric',20),('AEDC','AEDC','Abuja Electricity',30),
('KEDCO','KEDCO','Kano Electricity',40),('EEDC','EEDC','Enugu Electricity',50),('PHEDC','PHEDC','Port Harcourt Electricity',60),
('IBEDC','IBEDC','Ibadan Electricity',70),('KAEDCO','KAEDCO','Kaduna Electricity',80),('JEDC','JEDC','Jos Electricity',90),
('BEDC','BEDC','Benin Electricity',100),('YEDC','YEDC','Yola Electricity',110),('ABEDC','ABEDC','Aba Power',120))
insert into public.datasub_products(code,service_type,provider,name,description,provider_cost,retail_price,reseller_price,api_price,routing_priority,is_active,metadata,plan_category,validity_label,sort_order)
select d.code||'_'||upper(t.kind), 'electricity',d.provider,d.label||' '||initcap(t.kind),'Amount-based electricity bill payment',1,1,1,1,10,true,
 jsonb_build_object('amount_based',true,'meter_type',t.kind),t.kind,'Instant',d.ord+(case when t.kind='postpaid' then 1 else 0 end)
from d cross join (values('prepaid'),('postpaid')) t(kind)
on conflict(code) do update set is_active=true,metadata=excluded.metadata,updated_at=now();

-- NABTEB product from supplied provider catalogue. Selling prices deliberately stay independent of provider cost.
insert into public.datasub_products(code,service_type,provider,name,description,provider_cost,retail_price,reseller_price,api_price,routing_priority,is_active,metadata,plan_category,validity_label,sort_order)
values('NABTEB_PIN','education','NABTEB','NABTEB Result Checker PIN','NABTEB result checker PIN',855,900,890,880,10,true,'{}','pin','Single PIN',40)
on conflict(code) do update set is_active=true,updated_at=now();

-- Exact provider mappings helper data. No fuzzy matches.
with m(provider_code,product_code,external_plan_id,cost,meta) as (values
-- Legitdataway: exact supplied data matches
('legitdataway','MTN_500MB_SME_30D','36',280::numeric,'{"source":"supplied comparison"}'::jsonb),
('legitdataway','MTN_1GB_SME_7D','37',380,'{"source":"supplied comparison"}'),
('legitdataway','MTN_1GB_SME_30D_USER','315',380,'{"source":"supplied comparison"}'),
('legitdataway','MTN_2GB_SME_30D','38',720,'{"source":"supplied comparison"}'),
('legitdataway','MTN_3GB_SME_30D','39',1050,'{"source":"supplied comparison"}'),
('legitdataway','MTN_5GB_SME_30D','40',1560,'{"source":"supplied comparison"}'),
('legitdataway','MTN_1GB_CORP_24H','46',219,'{"source":"supplied comparison"}'),
('legitdataway','MTN_1GB_CORP_30D_USER','322',210,'{"source":"supplied comparison"}'),
('legitdataway','MTN_2GB_CORP_30D_USER','323',425,'{"source":"supplied comparison"}'),
('legitdataway','MTN_3GB_CORP_30D_USER','324',630,'{"source":"supplied comparison"}'),
('legitdataway','MTN_5GB_CORP_30D_USER','325',1025,'{"source":"supplied comparison"}'),
('legitdataway','MTN_75MB_GIFT_1D_USER','262',73.5,'{"source":"supplied comparison"}'),
('legitdataway','MTN_1GB_GIFT_1D_USER','266',490,'{"source":"supplied comparison"}'),
('legitdataway','MTN_1_5GB_GIFT_2D_USER','267',588,'{"source":"supplied comparison"}'),
('legitdataway','MTN_2GB_GIFT_2D_USER','268',735,'{"source":"supplied comparison"}'),
('legitdataway','MTN_2_5GB_GIFT_2D_USER','269',882,'{"source":"supplied comparison"}'),
('legitdataway','MTN_3_2GB_GIFT_2D_USER','270',980,'{"source":"supplied comparison"}'),
('legitdataway','GLO_200MB_CORP_30D_USER','70',85,'{"source":"supplied comparison"}'),
('legitdataway','GLO_500MB_CORP_30D_USER','71',195,'{"source":"supplied comparison"}'),
('legitdataway','GLO_1GB_CORP_30D_USER','72',390,'{"source":"supplied comparison"}'),
('legitdataway','GLO_2GB_CORP_30D_USER','73',780,'{"source":"supplied comparison"}'),
('legitdataway','GLO_3GB_CORP_30D_USER','74',1170,'{"source":"supplied comparison"}'),
('legitdataway','GLO_5GB_CORP_30D_USER','75',1950,'{"source":"supplied comparison"}'),
('legitdataway','GLO_10GB_CORP_30D_USER','76',3900,'{"source":"supplied comparison"}'),
('legitdataway','AIRTEL_1_2GB_CORP_7D_USER','326',192,'{"source":"supplied comparison"}'),
('legitdataway','AIRTEL_2GB_CORP_7D_USER','327',288,'{"source":"supplied comparison"}'),
('legitdataway','AIRTEL_3_2GB_CORP_7D_USER','328',480,'{"source":"supplied comparison"}'),
('legitdataway','AIRTEL_3_2GB_CORP_30D_USER','329',480,'{"source":"supplied comparison"}'),
('legitdataway','AIRTEL_6_5GB_CORP_14D_USER','330',960,'{"source":"supplied comparison"}'),
('legitdataway','AIRTEL_20GB_CORP_30D_USER','331',2880,'{"source":"supplied comparison"}'),
('legitdataway','T2_1_1GB_SME_30D_USER','61',390,'{"source":"supplied comparison"}'),
('legitdataway','T2_2GB_SME_30D_USER','62',750,'{"source":"supplied comparison"}'),
-- DataStation exact additions beyond prior seed
('datastation','MTN_75MB_GIFT_1D_USER','321',74,'{"source":"supplied DataStation catalogue"}'),
('datastation','MTN_1GB_GIFT_1D_USER','215',485,'{"source":"supplied DataStation catalogue","note":"+1.5min"}'),
-- CashSub exact supplied IDs
('cashsub','MTN_75MB_GIFT_1D_USER','42',74.5,'{"source":"supplied CashSub catalogue"}'),
('cashsub','MTN_2_5GB_GIFT_2D_USER','47',882,'{"source":"supplied CashSub catalogue"}'),
('cashsub','MTN_3_2GB_GIFT_2D_USER','48',980,'{"source":"supplied CashSub catalogue"}'),
('cashsub','MTN_2_7GB_GIFT_30D_USER','50',1960,'{"source":"supplied CashSub catalogue"}'),
('cashsub','MTN_3_5GB_GIFT_30D_USER','51',2450,'{"source":"supplied CashSub catalogue"}'),
('cashsub','MTN_500MB_SME_30D','104',280,'{"source":"supplied CashSub catalogue"}'),
('cashsub','MTN_1GB_SME_7D','217',390,'{"source":"supplied CashSub catalogue"}'),
('cashsub','MTN_2GB_SME_30D','106',750,'{"source":"supplied CashSub catalogue"}'),
('cashsub','MTN_3GB_SME_30D','107',1100,'{"source":"supplied CashSub catalogue"}'),
('cashsub','MTN_5GB_SME_30D','108',1600,'{"source":"supplied CashSub catalogue"}'),
('cashsub','T2_1_1GB_SME_30D_USER','234',410,'{"source":"supplied CashSub catalogue"}'),
('cashsub','T2_2GB_SME_30D_USER','235',775,'{"source":"supplied CashSub catalogue"}'),
('cashsub','GLO_200MB_CORP_30D_USER','114',95,'{"source":"supplied CashSub catalogue"}'),
('cashsub','GLO_500MB_CORP_30D_USER','115',205,'{"source":"supplied CashSub catalogue"}'),
('cashsub','GLO_1GB_CORP_30D_USER','116',405,'{"source":"supplied CashSub catalogue"}'),
('cashsub','GLO_2GB_CORP_30D_USER','117',810,'{"source":"supplied CashSub catalogue"}'),
('cashsub','GLO_3GB_CORP_30D_USER','118',1190,'{"source":"supplied CashSub catalogue"}'),
('cashsub','GLO_5GB_CORP_30D_USER','119',1980,'{"source":"supplied CashSub catalogue"}'),
('cashsub','GLO_10GB_CORP_30D_USER','120',3950,'{"source":"supplied CashSub catalogue"}')
)
insert into public.datasub_provider_products(product_id,provider_id,external_plan_id,provider_cost,active,last_synced_at,raw_metadata)
select p.id,pr.id,m.external_plan_id,m.cost,true,now(),m.meta
from m join public.datasub_products p on p.code=m.product_code
join public.datasub_providers pr on pr.code=m.provider_code
on conflict(product_id,provider_id,external_plan_id) do update set provider_cost=excluded.provider_cost,active=true,last_synced_at=excluded.last_synced_at,raw_metadata=excluded.raw_metadata;

-- Exact cable mappings from supplied comparison.
with m(product_code,ds_id,ds_cost,legit_id,legit_cost) as (values
('GOTV_JINJA_USER','16',3900::numeric,'61',3900::numeric),('GOTV_JOLLI_USER','17',5800,'60',5800),
('GOTV_MAX_USER','2',8500,'59',8500),('GOTV_SMALLIE_MONTHLY_USER','34',1900,'62',1900),
('GOTV_SMALLIE_QUARTERLY_USER','35',5100,'63',5100),('GOTV_SMALLIE_YEARLY_USER','36',15000,'64',15000),
('GOTV_SUPA_MONTHLY_USER','47',11400,'65',11400),('GOTV_SUPA_PLUS_MONTHLY_USER','48',16800,'123',16900),
('STARTIMES_NOVA_WEEK_USER','37',700,'71',700),('STARTIMES_BASIC_WEEK_USER','38',1400,'72',1400),
('STARTIMES_CLASSIC_WEEK_USER','40',2000,'74',2000),('STARTIMES_SUPER_DISH_WEEK_USER','41',3300,'75',3300),
('STARTIMES_NOVA_MONTH_USER','14',2100,'66',2100),('STARTIMES_BASIC_MONTH_USER','49',4000,'67',4000),
('STARTIMES_CLASSIC_MONTH_USER','11',6000,'69',6000),('STARTIMES_SUPER_DISH_MONTH_USER','15',9800,'70',9800),
('DSTV_PADI_USER','28',4400,'1',4400),('DSTV_YANGA_ALT_USER','6',6000,'111',6000),
('DSTV_COMPACT_USER','7',19000,'4',19000),('DSTV_EXTRAVIEW_ACCESS_USER','33',6000,'32',6050),
('DSTV_CONFAM_XV_USER','26',17000,'41',17100),('DSTV_YANGA_XV_USER','27',12000,'42',12100),
('DSTV_PADI_XV_USER','28',10400,'43',10400),('DSTV_PREMIUM_XV_ALT_USER','30',50500,'90',50500)
), expanded as (
select product_code,'datastation' provider_code,ds_id external_plan_id,ds_cost cost from m
union all select product_code,'legitdataway',legit_id,legit_cost from m)
insert into public.datasub_provider_products(product_id,provider_id,external_plan_id,provider_cost,active,last_synced_at,raw_metadata)
select p.id,pr.id,e.external_plan_id,e.cost,true,now(),jsonb_build_object('source','supplied three-provider comparison')
from expanded e join public.datasub_products p on p.code=e.product_code join public.datasub_providers pr on pr.code=e.provider_code
on conflict(product_id,provider_id,external_plan_id) do update set provider_cost=excluded.provider_cost,active=true,last_synced_at=excluded.last_synced_at,raw_metadata=excluded.raw_metadata;

-- Education exact provider mappings.
with m(provider_code,product_code,external_plan_id,cost) as (values
('legitdataway','WAEC_PIN','1',5100::numeric),('legitdataway','NECO_PIN','2',2100),('legitdataway','NABTEB_PIN','3',855),
('cashsub','WAEC_PIN','1',5400),('cashsub','NECO_PIN','2',2400),('cashsub','NABTEB_PIN','3',955))
insert into public.datasub_provider_products(product_id,provider_id,external_plan_id,provider_cost,active,last_synced_at,raw_metadata)
select p.id,pr.id,m.external_plan_id,m.cost,true,now(),jsonb_build_object('source','supplied provider catalogue')
from m join public.datasub_products p on p.code=m.product_code join public.datasub_providers pr on pr.code=m.provider_code
on conflict(product_id,provider_id,external_plan_id) do update set provider_cost=excluded.provider_cost,active=true,last_synced_at=excluded.last_synced_at,raw_metadata=excluded.raw_metadata;

-- Amount-based airtime mappings: external_plan_id is provider network ID.
with n(product_code,cash_id,ds_id,legit_id) as (values
('MTN_AIRTIME','1','1','1'),('GLO_AIRTIME','2','2','3'),('T2_AIRTIME','3','3','4'),('AIRTEL_AIRTIME','4','4','2')),
e as (
select product_code,'cashsub' provider_code,cash_id external_plan_id from n union all
select product_code,'datastation',ds_id from n union all select product_code,'legitdataway',legit_id from n)
insert into public.datasub_provider_products(product_id,provider_id,external_plan_id,provider_cost,active,last_synced_at,raw_metadata)
select p.id,pr.id,e.external_plan_id,0,true,now(),jsonb_build_object('source','supplied provider identifiers','amount_based',true,'fee_unknown',true)
from e join public.datasub_products p on p.code=e.product_code join public.datasub_providers pr on pr.code=e.provider_code
on conflict(product_id,provider_id,external_plan_id) do update set active=true,last_synced_at=excluded.last_synced_at,raw_metadata=excluded.raw_metadata;

-- Electricity mappings. CashSub covers 12; DataStation 11; Legitdataway 10.
with d(code,cash_id,ds_id,legit_id) as (values
('IKEDC','4','1','1'),('EKEDC','2','2','2'),('AEDC','1','3','8'),('KEDCO','7','4','3'),('EEDC','10','5',null),
('PHEDC','8','6','4'),('IBEDC','3','7','6'),('KAEDCO','6','8','7'),('JEDC','5','9','5'),('BEDC','11','10','10'),('YEDC','9','11','9'),('ABEDC','12',null,null)),
e as (
select code,'cashsub' provider_code,cash_id external_plan_id from d where cash_id is not null union all
select code,'datastation',ds_id from d where ds_id is not null union all
select code,'legitdataway',legit_id from d where legit_id is not null)
insert into public.datasub_provider_products(product_id,provider_id,external_plan_id,provider_cost,active,last_synced_at,raw_metadata)
select p.id,pr.id,e.external_plan_id,0,true,now(),jsonb_build_object('source','supplied electricity identifiers','amount_based',true,'fee_unknown',true)
from e join public.datasub_products p on p.code like e.code||'_%' join public.datasub_providers pr on pr.code=e.provider_code
on conflict(product_id,provider_id,external_plan_id) do update set active=true,last_synced_at=excluded.last_synced_at,raw_metadata=excluded.raw_metadata;


-- Materialize customer-tier prices so checkout and future price administration use one source of truth.
insert into public.datasub_prices(product_id,customer_tier,selling_price,effective_from,active)
select p.id,t.tier,case t.tier when 'smart_earner' then p.retail_price when 'api_user' then p.api_price else p.reseller_price end,
'2026-09-24T00:00:00Z'::timestamptz,true
from public.datasub_products p cross join (values('smart_earner'),('reseller'),('api_user'),('top_seller')) t(tier)
where p.is_active
on conflict(product_id,customer_tier,effective_from) do update set selling_price=excluded.selling_price,active=true;
