import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
const json=(value:unknown,status=200)=>Response.json(value,{status});
Deno.serve(async req=>{
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const bearer=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 const {data:expected}=await admin.rpc('ihlink_worker_token');
 const digest=async(v:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
 const [a,b]=await Promise.all([digest(bearer),digest(String(expected||''))]);let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];
 if(!bearer||!expected||difference)return json({error:'Unauthorized'},401);
 const base=(Deno.env.get('LEGITDATAWAY_API_BASE_URL')||'https://legitdataway.com/api').replace(/\/$/,'');
 const username=Deno.env.get('LEGITDATAWAY_USERNAME')||'',password=Deno.env.get('LEGITDATAWAY_PASSWORD')||'';
 if(!username||!password)return json({error:'Provider configuration missing'},503);
 let stage='authentication';
 try{
 const login=await fetch(base+'/user',{method:'POST',headers:{Authorization:'Basic '+btoa(username+':'+password),'Content-Type':'application/json'},signal:AbortSignal.timeout(15000)});
 const credentials=await login.json();const token=credentials.AccessToken||credentials.access_token;
 if(!login.ok||!token)return json({error:'Provider authentication failed',http_status:login.status},503);
 const {data:provider,error:pe}=await admin.from('datasub_providers').select('id').eq('code','legitdataway').single();if(pe||!provider)throw new Error('Provider missing');
 const summary:any[]=[];
 for(const type of ['smile','alpha','kirani']){
 stage='catalogue-'+type;const response=await fetch(base+'/get/SmileAlphaKiraniPlans',{method:'POST',headers:{Authorization:'Token '+token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({plan_type:type}),signal:AbortSignal.timeout(15000)});
 const raw=await response.json();const candidates=Array.isArray(raw)?raw:[raw.data,raw.plans,raw.results,raw[type]].find(Array.isArray);
 if(!response.ok||!candidates){summary.push({service:type,http_status:response.status,imported:0,response_keys:Object.keys(raw||{}),sample:raw});continue;}
 let imported=0;const invalid:any[]=[];
 for(const plan of candidates){const id=plan.id??plan.plan_id??plan.plan;const price=Number(plan.price?.amount??plan.price??plan.amount??plan.cost);const name=String(plan.name??plan.plan_name??plan.description??'').trim();
 if(id==null||!Number.isFinite(price)||price<=0||!name){if(invalid.length<2)invalid.push(plan);continue;}
 const row={provider_id:provider.id,service_type:type.toUpperCase(),external_plan_id:String(id),network:type.toUpperCase(),plan_type:type.toUpperCase(),name,validity:String(plan.validity??plan.duration??''),provider_cost:price,currency:'NGN',active:plan.active!==false,raw_metadata:plan,last_synced_at:new Date().toISOString()};
 stage='save-'+type;const saved=await admin.from('datasub_upstream_catalog').upsert(row,{onConflict:'provider_id,service_type,external_plan_id'});if(saved.error)throw saved.error;imported++;
 }
 summary.push({service:type,imported,total:candidates.length,invalid});
 }
 return json({ok:true,summary});
 }catch(error){return json({error:'Provider catalogue could not be synchronized',stage,diagnostic:error instanceof Error?error.message:String((error as any)?.message||'unknown')},503);}
});

