import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"authorization,apikey,content-type,verif-hash","access-control-allow-methods":"POST,OPTIONS"}});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 const client=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
 const secret=Deno.env.get("FLW_SECRET_KEY"),webhookHash=Deno.env.get("FLW_WEBHOOK_HASH"),siteUrl=Deno.env.get("IHLINK_DATASUB_URL")||Deno.env.get("SITE_URL")||"https://ihlink-corporate.vercel.app";
 const body=await req.json().catch(()=>null) as Record<string,unknown>|null;
 if(!body)return json({error:"invalid_payload"},400);

 if(body.action==="initialize"){
  const jwt=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  if(!jwt)return json({error:"authentication_required"},401);
  const {data:{user}}=await client.auth.getUser(jwt);
  if(!user?.email)return json({error:"authentication_required"},401);
  if(!secret)return json({error:"gateway_not_configured",message:"Flutterwave activation is awaiting the live secret key."},503);
  const amount=Number(body.amount);
  if(!Number.isFinite(amount)||amount<100||amount>500000)return json({error:"invalid_amount",message:"Amount must be between ₦100 and ₦500,000."},400);
  const reference=`IHL-FUND-${crypto.randomUUID().replaceAll("-","").slice(0,20).toUpperCase()}`;
  const {error:insertError}=await client.from("datasub_payment_intents").insert({user_id:user.id,gateway:"flutterwave",reference,amount});
  if(insertError)return json({error:"intent_failed"},400);
  const response=await fetch("https://api.flutterwave.com/v3/payments",{method:"POST",headers:{authorization:`Bearer ${secret}`,"content-type":"application/json"},body:JSON.stringify({tx_ref:reference,amount,currency:"NGN",redirect_url:`${siteUrl.replace(/\/$/,"")}/datasub/wallet`,customer:{email:user.email,name:user.user_metadata?.full_name||user.email},customizations:{title:"IHLink DataSub Wallet",description:"Secure wallet funding"}})});
  const result=await response.json() as {status?:string;data?:{link?:string};message?:string};
  if(!response.ok||!result.data?.link){await client.from("datasub_payment_intents").update({status:"failed",gateway_payload:result}).eq("reference",reference);return json({error:"gateway_initialization_failed",message:result.message||"Unable to start payment."},502);}
  await client.from("datasub_payment_intents").update({checkout_url:result.data.link,gateway_payload:result}).eq("reference",reference);
  return json({data:{reference,checkout_url:result.data.link}},201);
 }

 if(!webhookHash||req.headers.get("verif-hash")!==webhookHash)return json({error:"invalid_signature"},401);
 const data=body.data as Record<string,unknown>|undefined;
 if(body.event!=="charge.completed"||!data?.id||!data.tx_ref)return json({received:true});
 if(!secret)return json({error:"gateway_not_configured"},503);
 const verification=await fetch(`https://api.flutterwave.com/v3/transactions/${data.id}/verify`,{headers:{authorization:`Bearer ${secret}`}});
 const verified=await verification.json() as {data?:{status?:string;amount?:number;currency?:string;tx_ref?:string;id?:number}};
 const tx=verified.data;
 if(!verification.ok||!tx||tx.currency!=="NGN"||tx.tx_ref!==data.tx_ref)return json({error:"verification_failed"},400);
 const schoolPayment=tx.tx_ref.startsWith("IHL-SCH-");
 const {data:result,error}=await client.rpc(schoolPayment?"finalize_schoolpro_payment":"finalize_datasub_payment",{p_reference:tx.tx_ref,p_gateway_transaction_id:String(tx.id),p_verified_amount:Number(tx.amount),p_status:tx.status==="successful"?"successful":"failed",p_payload:verified});
 if(error)return json({error:"processing_failed",message:error.message},400);
 return json({received:true,data:result});
});
