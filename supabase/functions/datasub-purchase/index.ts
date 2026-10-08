import { finalizeRefund } from "../_shared/refunds.ts";
import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
import { quotePurchase, routeCost } from "../_shared/pricing.ts";
import*as cash from"../_shared/providers/cashsub.ts";
import*as ds from"../_shared/providers/datastation.ts";
import*as legit from"../_shared/providers/legitdataway.ts";

const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, idempotency-key","Content-Type":"application/json"};
const J=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:H});
const adapters:any={cashsub:cash,datastation:ds,legitdataway:legit};
const serviceOf=(v:string)=>({data:"DATA",cable_tv:"CABLE",electricity:"ELECTRICITY",education:"EXAM",airtime:"AIRTIME"}[String(v||"").toLowerCase()]||String(v||"DATA").toUpperCase());

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:H});
  const auth=req.headers.get("Authorization");
  if(!auth)return J({error:"Authentication required"},401);

  const url=Deno.env.get("SUPABASE_URL")!;
  const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const uc=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const admin=createClient(url,key);
  const{data:{user}}=await uc.auth.getUser();
  if(!user)return J({error:"Invalid session"},401);

  const{data:access}=await admin.from("customer_service_access").select("status").eq("user_id",user.id).eq("product","datasub").maybeSingle();
  if(access?.status!=="active")return J({error:"Active DataSub access required"},403);

  const body=await req.json().catch(()=>({}));
  const pin=String(body.pin||"");
  if(!/^\d{4}$/.test(pin))return J({error:"Valid 4-digit transaction PIN required"},403);
  const{data:pinOk,error:pinError}=await admin.rpc("verify_datasub_transaction_pin",{p_user:user.id,p_pin:pin});
  if(pinError||!pinOk)return J({error:"Transaction PIN is incorrect or temporarily locked"},403);
  const productId=String(body.product_id||"");
  const clientKey=String(req.headers.get("Idempotency-Key")||body.idempotency_key||"");
  if(!productId||!clientKey)return J({error:"product_id and Idempotency-Key required"},400);

  const{data:existing}=await admin.from("datasub_transactions").select("*").eq("user_id",user.id).contains("metadata",{client_idempotency_key:clientKey}).maybeSingle();
  if(existing)return J({transaction:existing,idempotent:true});

  const{data:p}=await admin.from("datasub_catalog_offerings").select("*").eq("id",productId).eq("customer_enabled",true).single();
  if(!p)return J({error:"Product unavailable"},404);
  // Exam catalogue prices and upstream plan IDs represent one PIN. Do not let
  // a client request multiple PINs while the wallet reserves a single price.
  const service=serviceOf(p.service_type);
  let recipient=String(body.recipient||"").trim();
  if(["DATA","AIRTIME"].includes(service)){
    recipient=recipient.replace(/[\s()-]/g,"").replace(/^(?:\+234|00234|234)/,"0");
    if(!/^0[789]\d{9}$/.test(recipient))return J({error:"Enter a valid Nigerian phone number."},400);
  }

  if(service==="EXAM"&&body.quantity!==undefined&&Number(body.quantity)!==1)
    return J({error:"Purchase one exam PIN per transaction"},400);

  const{data:reseller}=await admin.from("datasub_reseller_accounts").select("status,tier_code,api_access_approved").eq("user_id",user.id).maybeSingle();
  let tier="smart_earner";
  if(reseller?.status==="active"&&reseller?.tier_code==="top_seller")tier="top_seller";
  else if(reseller?.status==="active"&&reseller?.api_access_approved===true)tier="api_user";
  else if(reseller?.status==="active")tier="reseller";

  let quote;
  try { quote=quotePurchase(service,tier as any,p,body.amount); }
  catch(error) { return J({error:error instanceof Error?error.message:"Product price unavailable"},400); }
  const {charge:sell,serviceAmount,fee,dynamic:amountBased}=quote;
  if((amountBased&&body.expected_charge===undefined)||(body.expected_charge!==undefined&&Number(body.expected_charge)!==sell))
    return J({error:"The price changed. Refresh the quote before paying."},409);

  const tolerance=Math.max(0,Number(p.markup_policy?.routing_price_tolerance_ngn??10));
  const{data:alternates}=await admin.from("datasub_catalog_offerings").select("id,base_provider_cost").eq("spec_key",p.spec_key).eq("customer_enabled",true).lte("base_provider_cost",Number(p.base_provider_cost)+tolerance);
  const offeringIds=(alternates||[]).filter((x:any)=>Number(x.base_provider_cost)>=Number(p.base_provider_cost)-tolerance).map((x:any)=>x.id);
  if(!offeringIds.includes(productId))offeringIds.push(productId);
  const{data:routeRows}=await admin.from("datasub_catalog_routes").select("*,upstream:datasub_upstream_catalog!inner(*,provider:datasub_providers!inner(*))").in("offering_id",offeringIds).eq("route_enabled",true);
  const maps=(routeRows||[]).map((r:any)=>{const u=Array.isArray(r.upstream)?r.upstream[0]:r.upstream;return {...r,provider_id:u.provider_id,external_plan_id:u.external_plan_id,provider_cost:u.provider_cost,active:u.active,raw_metadata:u.raw_metadata,provider:Array.isArray(u.provider)?u.provider[0]:u.provider}});
  const ids=(maps||[]).map((m:any)=>m.provider_id);
  const{data:hs}=ids.length?await admin.from("datasub_provider_health").select("*").in("provider_id",ids):{data:[]};
  const hm=new Map((hs||[]).map((h:any)=>[h.provider_id,h]));
  const candidates=(maps||[])
    .map((m:any)=>({...m,provider_cost:routeCost(serviceAmount,amountBased,m),provider:Array.isArray(m.provider)?m.provider[0]:m.provider,health:hm.get(m.provider_id)}))
    .filter((m:any)=>m.active===true&&m.provider?.is_active&&["HEALTHY","DEGRADED"].includes(m.health?.state||m.provider.state))
    .sort((a:any,b:any)=>Number(a.provider_cost)-Number(b.provider_cost)||Number(b.health?.success_rate_15m||0)-Number(a.health?.success_rate_15m||0)||Number(a.health?.average_latency_ms||999999)-Number(b.health?.average_latency_ms||999999));
  const maxRouteCost=Number(p.base_provider_cost)+tolerance;
  const eligible=candidates.filter((m:any)=>Number(m.provider_cost)<=sell&&(amountBased||Number(m.provider_cost)<=maxRouteCost));
  if(!eligible.length)return J({error:"This service is temporarily unavailable. Please try again later."},503);

  const transactionService=({DATA:"data",CABLE:"cable_tv",ELECTRICITY:"electricity",EXAM:"education",AIRTIME:"airtime"} as Record<string,string>)[service]||String(p.service_type||"data").toLowerCase();
  const network=String(p.network||"");
  const reference="IHL-"+crypto.randomUUID();
  const{data:tx,error:te}=await admin.from("datasub_transactions").insert({
    user_id:user.id,reference,service_type:transactionService,provider:"routing",
    recipient,amount:sell,product_id:null,catalog_offering_id:p.id,selling_price:sell,status:"pending",routing_state:"ROUTING",
    metadata:{client_idempotency_key:clientKey,customer_tier:tier,service_amount:serviceAmount,service_fee:fee,cost_basis:amountBased?"face_value_or_configured_provider_rate":"catalogue",input:{network,service,meter_type:body.meter_type,quantity:service==="EXAM"?1:body.quantity,ported:body.ported}}
  }).select().single();
  if(te)return J({error:"Transaction creation failed"},500);

  const{data:reserved}=await admin.rpc("reserve_datasub_wallet",{p_user:user.id,p_transaction:tx.id,p_amount:sell,p_reference:`RESERVE:${reference}`});
  if(!reserved){
    await admin.from("datasub_transactions").update({status:"failed",routing_state:"FAILED"}).eq("id",tx.id);
    return J({error:"Insufficient wallet balance"},402);
  }

  for(let i=0;i<eligible.length;i++){
    const m:any=eligible[i],adapter=adapters[m.provider.code];
    if(!adapter)continue;
    const attemptKey=`${reference}:${m.provider.code}`;
    await admin.from("datasub_routing_events").insert({transaction_id:tx.id,provider_id:m.provider_id,event_type:i?"FALLBACK_SELECTED":"ROUTE_SELECTED",reason:i?"previous eligible route explicitly failed":"lowest healthy profitable route",details:{provider_cost:m.provider_cost}});
    const result=await adapter.purchase({service,network,recipient,amount:serviceAmount,meter_type:body.meter_type,quantity:service==="EXAM"?1:body.quantity,ported:body.ported},m,attemptKey);
    const safeRaw=JSON.parse(JSON.stringify(result.raw||{},(k,v)=>/token|authorization|password|secret|key/i.test(k)?"[REDACTED]":v));
    await admin.from("datasub_provider_attempts").insert({transaction_id:tx.id,provider_id:m.provider_id,request_key:attemptKey,provider_reference:result.reference,provider_cost:m.provider_cost,response_status:result.state,latency_ms:result.latency,safe_response:safeRaw,is_ambiguous:result.state==="UNKNOWN"});
    if(result.state==="SUCCESS"){
      await admin.from("datasub_transactions").update({provider:m.provider.code,provider_reference:result.reference,provider_cost:m.provider_cost,status:"success",routing_state:"SETTLED"}).eq("id",tx.id);
      return J({success:true,reference,status:"success",amount:sell,service_amount:serviceAmount,fee});
    }
    if(result.state==="UNKNOWN"){
      await admin.from("datasub_transactions").update({provider:m.provider.code,provider_reference:result.reference,provider_cost:m.provider_cost,routing_state:"RECONCILING"}).eq("id",tx.id);
      return J({success:false,reference,status:"pending",amount:sell,service_amount:serviceAmount,fee,message:"Your purchase is being confirmed. Please do not buy it again yet."},202);
    }
  }

  const refunded = await finalizeRefund(admin, tx);
  return J({success:false,reference,status:refunded?"failed":"pending",
    message:refunded?"The purchase could not be completed. Your money has been returned to your wallet.":"We are completing your wallet refund. Please check your transactions shortly."},refunded?502:202);
});
