import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
import*as cash from"../_shared/providers/cashsub.ts";

Deno.serve(async()=>{
  const a=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const{data:p}=await a.from("datasub_providers").select("id,is_active").eq("code","cashsub").single();
  if(!p?.is_active)return new Response(JSON.stringify({skipped:true,reason:"CashSub is disabled"}),{headers:{"Content-Type":"application/json"}});

  const r=await cash.catalogue();
  if(r.state!=="SUCCESS")return new Response(JSON.stringify({error:"catalogue unavailable"}),{status:503,headers:{"Content-Type":"application/json"}});

  let matched=0,unmatched=0;
  for(const x of (r.raw as any).results||[]){
    let q=a.from("datasub_products").select("id").eq("service_type","data").ilike("provider",String(x.network||"")).ilike("name",String(x.name||""));
    if(x.planType)q=q.ilike("plan_category",String(x.planType));
    if(x.validity)q=q.ilike("validity_label",String(x.validity));
    const{data:products}=await q.limit(1);
    if(products?.[0]){
      await a.from("datasub_provider_products").upsert({
        product_id:products[0].id,provider_id:p.id,external_plan_id:String(x.id),
        provider_cost:Number(x.price?.amount||0),active:true,last_synced_at:new Date().toISOString(),raw_metadata:x
      },{onConflict:"product_id,provider_id,external_plan_id"});
      matched++;
    }else unmatched++;
  }
  return new Response(JSON.stringify({matched,unmatched}),{headers:{"Content-Type":"application/json"}});
});
