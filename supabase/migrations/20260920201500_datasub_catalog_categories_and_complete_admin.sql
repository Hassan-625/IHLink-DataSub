alter table public.datasub_products
  add column if not exists plan_category text,
  add column if not exists validity_label text,
  add column if not exists sort_order integer not null default 100;

alter table public.datasub_products
  add constraint datasub_products_plan_category_check check (
    plan_category is null or plan_category in ('daily','weekly','monthly','multi_month','sme','gifting','sme_2','corporate_gifting','awoof','prepaid','postpaid','bouquet','pin')
  );

create index if not exists datasub_products_catalog_filter_idx
on public.datasub_products(service_type,provider,plan_category,sort_order) where is_active;

update public.datasub_products set plan_category='monthly',validity_label='30 Days' where service_type='data' and plan_category is null;
update public.datasub_products set plan_category='bouquet',validity_label='1 Month' where service_type='cable_tv' and plan_category is null;
update public.datasub_products set plan_category='pin',validity_label='Single PIN' where service_type='education' and plan_category is null;

insert into public.datasub_products(code,service_type,provider,name,description,provider_cost,retail_price,reseller_price,api_price,routing_priority,plan_category,validity_label,sort_order) values
('MTN_100MB_DAILY','data','MTN','100MB Daily','MTN daily data bundle',90,100,98,95,10,'daily','1 Day',10),
('MTN_350MB_WEEKLY','data','MTN','350MB Weekly','MTN weekly data bundle',280,300,295,290,11,'weekly','7 Days',20),
('MTN_2GB_MONTHLY','data','MTN','2GB Monthly','MTN monthly data bundle',900,1000,970,950,12,'monthly','30 Days',30),
('MTN_6GB_60D','data','MTN','6GB Multi-month','MTN long-validity data bundle',2800,3000,2940,2900,13,'multi_month','60 Days',40),
('MTN_1GB_SME','data','MTN','1GB SME','MTN SME data share',420,470,455,445,14,'sme','30 Days',50),
('MTN_1GB_SME2','data','MTN','1GB SME 2','MTN alternative SME route',425,475,460,450,15,'sme_2','30 Days',60),
('MTN_1GB_GIFT','data','MTN','1GB Gifting','MTN gifting bundle',460,510,495,485,16,'gifting','30 Days',70),
('MTN_2GB_CORP','data','MTN','2GB Corporate Gifting','MTN corporate gifting bundle',820,900,875,850,17,'corporate_gifting','30 Days',80),
('MTN_1_5GB_AWOOF','data','MTN','1.5GB Awoof','Promotional MTN data bundle',500,550,535,520,18,'awoof','7 Days',90),
('AIRTEL_350MB_WEEKLY','data','Airtel','350MB Weekly','Airtel weekly data bundle',280,300,295,290,20,'weekly','7 Days',20),
('AIRTEL_2GB_MONTHLY','data','Airtel','2GB Monthly','Airtel monthly data bundle',920,1000,980,960,21,'monthly','30 Days',30),
('GLO_1_5GB_MONTHLY','data','Glo','1.5GB Monthly','Glo monthly data bundle',720,800,780,760,30,'monthly','30 Days',30),
('T2_1_5GB_MONTHLY','data','T2','1.5GB Monthly','T2 monthly data bundle',730,820,795,775,40,'monthly','30 Days',30),
('DSTV_CONFAM','cable_tv','DStv','DStv Confam','DStv Confam bouquet',10600,11000,10800,10700,11,'bouquet','1 Month',20),
('DSTV_PREMIUM','cable_tv','DStv','DStv Premium','DStv Premium bouquet',28500,29500,29100,28900,12,'bouquet','1 Month',30),
('GOTV_JOLLI','cable_tv','GOtv','GOtv Jolli','GOtv Jolli bouquet',5200,5600,5450,5350,21,'bouquet','1 Month',20),
('STARTIMES_CLASSIC','cable_tv','StarTimes','StarTimes Classic','StarTimes Classic bouquet',5200,5700,5500,5400,31,'bouquet','1 Month',20),
('IKEDC_PREPAID','electricity','IKEDC','IKEDC Prepaid','Prepaid electricity token',1,1,1,1,10,'prepaid','Instant',10),
('IKEDC_POSTPAID','electricity','IKEDC','IKEDC Postpaid','Postpaid electricity bill',1,1,1,1,11,'postpaid','Instant',20),
('KEDCO_PREPAID','electricity','KEDCO','KEDCO Prepaid','Prepaid electricity token',1,1,1,1,20,'prepaid','Instant',10),
('JEDC_PREPAID','electricity','JEDC','JEDC Prepaid','Prepaid electricity token',1,1,1,1,30,'prepaid','Instant',10)
on conflict(code) do update set name=excluded.name,description=excluded.description,plan_category=excluded.plan_category,validity_label=excluded.validity_label,sort_order=excluded.sort_order;
