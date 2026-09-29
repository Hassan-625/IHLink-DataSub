import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
import*as cash from"../_shared/providers/cashsub.ts";

const net=(v:any)=>{const s=String(v||"").toUpperCase().replace(/[^A-Z0-9]/g,"");return s==="9MOBILE"?"T2":s};
const category=(v:any)=>{const s=String(v||"").toLowerCase().replace(/[^a-z0-9]/g,"");if(s.includes("corporate"))return"corporategifting";if(s.includes("sme"))return"sme";if(s.includes("gifting"))return"gifting";if(s.includes("awoof"))return"awoof";return s};
const capacityMb=(v:any)=>{const s=String(v||"").toUpperCase();const m=s.match(/(\d+(?:\.\d+)?)\s*(GB|MB)\b/);if(!m)return null;return Math.round(Number(m[1])*(m[2]==="GB"?1000:1))};
const days=(v:any)=>{const s=String(v||"").toLowerCase();const m=s.match(/(\d+(?:\.\d+)?)\s*(hour|hr|day|week|month)/);if(!m)return null;const n=Number(m[1]);return Math.round(n*(m[2].startsWith("hour")||m[2].startsWith("hr")?1/24:m[2].startsWith("week")?7:m[2].startsWith("month")?30:1))};

Deno.serve(async(req)=>{
 const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const auth=req.headers.get("authorization")||"";
 const a=createClient(Deno.env.get("SUPABASE_URL")!,serviceKey);
 if(auth!==`Bearer ${serviceKey}`){
   const token=auth.replace(/^Bearer\s+/i,"");
   const{data:{user}}=await a.auth.getUser(token);
   if(!user)return Response.json({error:"authentication_required"},{status:401});
   const{data:profile}=await a.from("profiles").select("role,status").eq("id",user.id).maybeSingle();
   if(profile?.role!=="super_admin"||profile.status!=="active")return Response.json({error:"permission_denied"},{status:403});
 }
 const{data:p}=await a.from("datasub_providers").select("id,is_active").eq("code","cashsub").single();
 if(!p)return Response.json({error:"CashSub provider missing"},{status:404});
 const pages:any[]=[];let page=1,totalCount:number|null=null;
 while(page<=10){const r=await cash.catalogue("DATA",undefined,page);if(r.state!=="SUCCESS")return Response.json({error:"catalogue unavailable",page,diagnostic:{http_status:(r.raw as any)?._http_status||null}},{status:503});const raw:any=r.raw||{};if(totalCount===null&&Number.isFinite(Number(raw.count)))totalCount=Number(raw.count);pages.push(...(Array.isArray(raw.results)?raw.results:[]));if(!raw.next)break;page=Number(raw.next)||page+1;}
 const providerId=p.id;
 for(const x of pages){await a.from("datasub_upstream_catalog").upsert({provider_id:providerId,service_type:"data",external_plan_id:String(x.id),network:net(x.network),plan_type:String(x.planType||""),name:String(x.name||x.id),validity:String(x.validity||""),provider_cost:Number(x.price?.amount||0),currency:String(x.price?.currency||"NGN"),active:true,raw_metadata:x,last_synced_at:new Date().toISOString()},{onConflict:"provider_id,service_type,external_plan_id"});}
 const{data:products}=await a.from("datasub_products").select("id,provider,name,plan_category,validity_label").eq("service_type","data").eq("is_active",true);
 let matched=0,unmatched=0;const unmatchedSamples:any[]=[];const ambiguous:any[]=[];const candidateMappings:any[]=[];
 for(const x of pages){
   const xn=net(x.network),xc=category(x.planType),xcap=capacityMb(x.name),xd=days(x.validity);
   const candidates=(products||[]).filter((q:any)=>net(q.provider)===xn&&category(q.plan_category)===xc&&capacityMb(q.name)===xcap&&days(q.validity_label)===xd);
   if(candidates.length===1){
     // A normalized match is a review candidate, not provider ID verification.
     // Never activate a CashSub legacy route from a catalogue sync.
     if(candidateMappings.length<20)candidateMappings.push({external_plan_id:String(x.id),legacy_product_id:candidates[0].id,network:xn,category:xc,capacity_mb:xcap,validity_days:xd});
     matched++;
   }else{
     unmatched++;
     const sample={id:x.id,name:x.name,network:x.network,planType:x.planType,validity:x.validity,price:x.price,candidate_count:candidates.length};
     if(candidates.length>1&&ambiguous.length<20)ambiguous.push(sample);
     else if(unmatchedSamples.length<20)unmatchedSamples.push(sample);
   }
 }
 return Response.json({upstreamImported:pages.length,matchedCandidates:matched,unmatchedLegacy:unmatched,candidateMappings,ambiguous,unmatchedSamples,catalogueMeta:{count:totalCount,returned:pages.length,pages:page}});
});
