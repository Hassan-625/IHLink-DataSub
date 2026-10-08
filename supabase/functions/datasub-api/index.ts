import { finalizeRefund } from "../_shared/refunds.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { quotePurchase, routeCost, transactionService } from "../_shared/pricing.ts";
import * as cash from "../_shared/providers/cashsub.ts";
import * as ds from "../_shared/providers/datastation.ts";
import * as legit from "../_shared/providers/legitdataway.ts";
const adapters:any={cashsub:cash,datastation:ds,legitdataway:legit};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store","access-control-allow-origin":"*"}});
const sha256=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,"0")).join("");
Deno.serve(async(req)=>{
 const started=Date.now(),url=new URL(req.url),endpoint=url.pathname.replace(/^\/datasub-api/,"")||"/";
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"content-type,x-ihlink-api-key","access-control-allow-methods":"GET,POST,OPTIONS"}});
 const apiKey=req.headers.get("x-ihlink-api-key")?.trim();if(!apiKey)return json({error:"missing_api_key",message:"Send your API key in x-ihlink-api-key."},401);
 const client=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
 const hash=await sha256(apiKey);const{data:credential}=await client.from("datasub_api_credentials").select("id,user_id,mode,status").eq("key_hash",hash).eq("status","active").maybeSingle();if(!credential)return json({error:"invalid_api_key",message:"The API key is invalid or revoked."},401);
 const[{data:owner},{data:access},{data:reseller}]=await Promise.all([client.from("profiles").select("status").eq("id",credential.user_id).maybeSingle(),client.from("customer_service_access").select("status").eq("user_id",credential.user_id).eq("product","datasub").maybeSingle(),client.from("datasub_reseller_accounts").select("status,api_access_approved").eq("user_id",credential.user_id).maybeSingle()]);
 if(owner?.status!=="active"||access?.status!=="active"||reseller?.status!=="active"||reseller?.api_access_approved!==true)return json({error:"api_access_inactive",message:"DataSub API access is not active for this account."},403);
 let status=200,response:any;
 try{
  if(req.method==="GET"&&endpoint==="/health")response={status:"ok",mode:credential.mode,service:"IHLink DataSub API"};
  else if(req.method==="GET"&&endpoint==="/quote"){
   const {data:p}=await client.from("datasub_catalog_offerings").select("*").eq("ihlink_plan_id",String(url.searchParams.get("product_code")||"").toUpperCase()).eq("customer_enabled",true).single();
   if(!p)throw new Error("Product unavailable");
   const quote=quotePurchase(String(p.service_type),"api_user",p,url.searchParams.get("amount"));
   response={data:{product_code:p.ihlink_plan_id,service_amount:quote.serviceAmount,fee:quote.fee,amount:quote.charge,currency:"NGN"}};
  }else if(req.method==="GET"&&endpoint==="/products"){
   const service=url.searchParams.get("service")?.toUpperCase();let q=client.from("datasub_customer_catalogue").select("ihlink_plan_id,service_type,network,plan_type,name,validity,api_price").order("service_type").order("network").order("api_price");if(service)q=q.eq("service_type",service);const{data,error}=await q;if(error)throw error;response={data:(data||[]).map((x:any)=>({plan_id:x.ihlink_plan_id,service:x.service_type,network:x.network,type:x.plan_type,name:x.name,validity:x.validity,price:Number(x.api_price)}))};
  }else if(req.method==="POST"&&endpoint==="/purchase"){
   const body=await req.json().catch(()=>null) as any;if(!body?.product_code||!body?.recipient||!body?.reference){status=400;response={error:"invalid_request",message:"product_code, recipient and reference are required."};}
   else if(credential.mode==="sandbox")response={data:{reference:body.reference,status:"simulated",product_code:body.product_code,recipient:body.recipient},mode:"sandbox"};
   else{
    const{data:existing}=await client.from("datasub_transactions").select("reference,status,amount").eq("user_id",credential.user_id).eq("reference",String(body.reference).trim()).maybeSingle();if(existing){response={data:existing,idempotent:true};}
    else{
     const{data:p}=await client.from("datasub_catalog_offerings").select("*").eq("ihlink_plan_id",String(body.product_code).trim().toUpperCase()).eq("customer_enabled",true).single();if(!p)throw new Error("Product unavailable");
     const service=String(p.service_type).toUpperCase();
     if(service==="EXAM"&&body.quantity!==undefined&&Number(body.quantity)!==1)throw new Error("Purchase one exam PIN per transaction");
     const quote=quotePurchase(service,"api_user",p,body.amount);
     const {charge:sell,serviceAmount,fee,dynamic:amountBased}=quote;
     if(body.expected_charge!==undefined&&Number(body.expected_charge)!==sell)throw new Error("The price changed. Refresh the quote before paying.");
     const{data:rr}=await client.from("datasub_catalog_routes").select("*,upstream:datasub_upstream_catalog!inner(*,provider:datasub_providers!inner(*))").eq("offering_id",p.id).eq("route_enabled",true);
     const maps=(rr||[]).map((r:any)=>{const u=Array.isArray(r.upstream)?r.upstream[0]:r.upstream;return{...r,provider_id:u.provider_id,external_plan_id:u.external_plan_id,provider_cost:u.provider_cost,active:u.active,raw_metadata:u.raw_metadata,provider:Array.isArray(u.provider)?u.provider[0]:u.provider}});
     const ids=maps.map((m:any)=>m.provider_id),{data:hs}=ids.length?await client.from("datasub_provider_health").select("*").in("provider_id",ids):{data:[]};const hm=new Map((hs||[]).map((h:any)=>[h.provider_id,h]));
     const eligible=maps.map((m:any)=>({...m,provider_cost:routeCost(serviceAmount,amountBased,m),health:hm.get(m.provider_id)})).filter((m:any)=>m.active===true&&m.provider?.is_active&&["HEALTHY","DEGRADED"].includes(m.health?.state||m.provider.state)&&Number(m.provider_cost)<=sell).sort((a:any,b:any)=>Number(a.provider_cost)-Number(b.provider_cost)||Number(b.health?.success_rate_15m||0)-Number(a.health?.success_rate_15m||0)||Number(a.health?.average_latency_ms||999999)-Number(b.health?.average_latency_ms||999999));if(!eligible.length)throw new Error("No healthy profitable route");
     const reference=String(body.reference).trim();const{data:tx,error:te}=await client.from("datasub_transactions").insert({user_id:credential.user_id,reference,service_type:transactionService(service),provider:"routing",recipient:String(body.recipient).trim(),amount:sell,product_id:null,catalog_offering_id:p.id,selling_price:sell,status:"pending",routing_state:"ROUTING",metadata:{service_amount:serviceAmount,service_fee:fee,cost_basis:amountBased?"face_value_or_configured_provider_rate":"catalogue",source:"api",credential_id:credential.id,product_code:p.ihlink_plan_id}}).select().single();if(te)throw te;
     const{data:reserved}=await client.rpc("reserve_datasub_wallet",{p_user:credential.user_id,p_transaction:tx.id,p_amount:sell,p_reference:`RESERVE:${reference}`});if(!reserved){await client.from("datasub_transactions").update({status:"failed",routing_state:"FAILED"}).eq("id",tx.id);throw new Error("Insufficient wallet balance")}
     let final:any=null;for(let i=0;i<eligible.length;i++){const m:any=eligible[i],adapter=adapters[m.provider.code];if(!adapter)continue;const requestKey=`${reference}:${m.provider.code}`;const result=await adapter.purchase({service:String(p.service_type).toUpperCase(),network:String(p.network||""),recipient:body.recipient,amount:serviceAmount,meter_type:body.meter_type,quantity:service==="EXAM"?1:body.quantity,ported:body.ported},m,requestKey);const safeRaw=JSON.parse(JSON.stringify(result.raw||{},(k,v)=>/token|authorization|password|secret|key/i.test(k)?"[REDACTED]":v));await client.from("datasub_provider_attempts").insert({transaction_id:tx.id,provider_id:m.provider_id,request_key:requestKey,provider_reference:result.reference,provider_cost:m.provider_cost,response_status:result.state,latency_ms:result.latency,safe_response:safeRaw,is_ambiguous:result.state==="UNKNOWN"});if(result.state==="SUCCESS"){await client.from("datasub_transactions").update({provider:m.provider.code,provider_reference:result.reference,provider_cost:m.provider_cost,status:"success",routing_state:"SETTLED"}).eq("id",tx.id);final={reference,status:"successful",product_code:p.ihlink_plan_id,amount:sell,service_amount:serviceAmount,fee};break}if(result.state==="UNKNOWN"){await client.from("datasub_transactions").update({provider:m.provider.code,provider_reference:result.reference,provider_cost:m.provider_cost,routing_state:"RECONCILING"}).eq("id",tx.id);final={reference,status:"pending",product_code:p.ihlink_plan_id,amount:sell,service_amount:serviceAmount,fee};break}}
     if(!final){const refunded=await finalizeRefund(client,tx);final={reference,status:refunded?"failed":"pending",product_code:p.ihlink_plan_id,amount:sell,service_amount:serviceAmount,fee,message:refunded?"The purchase failed and your wallet has been refunded.":"Your wallet refund is being completed."};}
     status=final.status==="successful"?201:final.status==="failed"?502:202;response={data:final};
    }}
  }else{status=404;response={error:"not_found",message:"Use GET /health, GET /products, GET /quote or POST /purchase."};}
 }catch(error){status=400;const message=error instanceof Error?error.message:"Request failed";response={error:"request_failed",message:/insufficient/i.test(message)?"Insufficient wallet balance.":/duplicate/i.test(message)?"The transaction reference already exists.":message};}
 await Promise.all([client.from("datasub_api_usage").insert({credential_id:credential.id,user_id:credential.user_id,endpoint,method:req.method,status_code:status,response_ms:Date.now()-started,request_units:1}),client.from("datasub_api_credentials").update({last_used_at:new Date().toISOString()}).eq("id",credential.id)]);
 return json(response,status);
});