import { supabase } from "@/lib/supabase";
export type LiveCatalogueProduct={id:string;code:string;service_type:string;provider:string;name:string;description:string|null;plan_category:string|null;validity_label:string|null;retail_price:number;reseller_price:number;api_price:number;top_seller_price:number;markup_policy:Record<string,unknown>};
export const serviceKey=(service:string)=>({data:"DATA",cable:"CABLE",cable_tv:"CABLE",electricity:"ELECTRICITY",education:"EXAM",airtime:"AIRTIME"}[service.toLowerCase()]||service.toUpperCase());
export async function loadLiveCatalogue(service?:string){
 if(!supabase)return [] as LiveCatalogueProduct[];
 const rows:any[]=[];
 for(let offset=0;;offset+=500){
  let q=supabase.from("datasub_customer_catalogue").select("id,ihlink_plan_id,service_type,network,plan_type,name,validity,smart_earner_price,reseller_price,api_price,top_seller_price").order("service_type").order("network").order("smart_earner_price").order("id").range(offset,offset+499);
  if(service)q=q.eq("service_type",serviceKey(service));
  const {data,error}=await q;if(error)throw new Error('Available services could not be loaded. Please try again.');
  rows.push(...(data||[]));if(!data||data.length<500)break;
 }
 const policies:{data:any[]}={data:[]};
 for(let offset=0;offset<rows.length;offset+=200){
  const result=await supabase.from("datasub_catalog_offerings").select("id,markup_policy").in("id",rows.slice(offset,offset+200).map(x=>x.id));
  if(result.error)throw new Error('Service prices could not be loaded. Please try again.');
  policies.data.push(...(result.data||[]));
 }
 const policyMap=new Map((policies.data||[]).map(x=>[x.id,x.markup_policy]));
 return rows.map((x:any)=>({id:x.id,markup_policy:policyMap.get(x.id)||{},code:x.ihlink_plan_id,service_type:String(x.service_type).toLowerCase(),provider:x.network,name:x.name,description:x.plan_type||null,plan_category:x.plan_type?String(x.plan_type).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""):null,validity_label:x.validity||null,retail_price:Number(x.smart_earner_price),reseller_price:Number(x.reseller_price),api_price:Number(x.api_price),top_seller_price:Number(x.top_seller_price)})) as LiveCatalogueProduct[];
}