import { supabase } from "@/lib/supabase";
export type LiveCatalogueProduct={id:string;code:string;service_type:string;provider:string;name:string;description:string|null;plan_category:string|null;validity_label:string|null;retail_price:number;reseller_price:number;api_price:number;top_seller_price:number};
export const serviceKey=(service:string)=>({data:"DATA",cable:"CABLE",cable_tv:"CABLE",electricity:"ELECTRICITY",education:"EXAM",airtime:"AIRTIME"}[service.toLowerCase()]||service.toUpperCase());
export async function loadLiveCatalogue(service?:string){
 if(!supabase)return [] as LiveCatalogueProduct[];
 let q=supabase.from("datasub_customer_catalogue").select("id,ihlink_plan_id,service_type,network,plan_type,name,validity,smart_earner_price,reseller_price,api_price,top_seller_price").order("service_type").order("network").order("smart_earner_price");
 if(service)q=q.eq("service_type",serviceKey(service));
 const {data,error}=await q;if(error)throw error;
 return (data||[]).map((x:any)=>({id:x.id,code:x.ihlink_plan_id,service_type:String(x.service_type).toLowerCase(),provider:x.network,name:x.name,description:x.plan_type||null,plan_category:x.plan_type?String(x.plan_type).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""):null,validity_label:x.validity||null,retail_price:Number(x.smart_earner_price),reseller_price:Number(x.reseller_price),api_price:Number(x.api_price),top_seller_price:Number(x.top_seller_price)})) as LiveCatalogueProduct[];
}