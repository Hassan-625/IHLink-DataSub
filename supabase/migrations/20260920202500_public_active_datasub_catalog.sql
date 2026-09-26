create view public.datasub_public_catalog as
select id,code,service_type,provider,name,description,retail_price,plan_category,validity_label,sort_order
from public.datasub_products
where is_active;

revoke all on public.datasub_public_catalog from public;
grant select on public.datasub_public_catalog to anon,authenticated;

grant select(id,service_type,provider,name,description,retail_price,plan_category,validity_label,sort_order,is_active) on public.datasub_products to anon;
create policy "Public reads active DataSub products" on public.datasub_products for select to anon using (is_active);
