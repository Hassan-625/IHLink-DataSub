-- Correct a legacy catalogue classification so DStv Compact is only exposed as cable TV.
update public.datasub_products
set service_type = 'cable_tv', updated_at = now()
where id = '2975b4cd-e904-4bef-9b01-a97e224419c2'
  and provider = 'DStv'
  and name = 'DStv Compact'
  and service_type = 'data';
