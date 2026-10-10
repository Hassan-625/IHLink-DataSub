import {createClient} from 'jsr:@supabase/supabase-js@2';
import {publicAddress,signature} from './security.ts';
import {request as httpsRequest} from 'node:https';
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json'}});
Deno.serve(async req=>{
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data:expected,error:tokenError}=await admin.rpc('ihlink_worker_token');
 const received=req.headers.get('authorization')?.replace(/^Bearer /,'');
 if(tokenError||!expected||!received||await signature(expected,'auth',received)!==await signature(expected,'auth',expected))return json({error:'Unauthorized'},401);
 const {data:jobs,error}=await admin.rpc('claim_datasub_api_callbacks');if(error)return json({error:'Unable to load callbacks'},503);
 let delivered=0;
 for(const job of jobs||[]){
  let code:number|null=null,ok=false;
  try{
   const u=new URL(job.url);
   if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')throw new Error('Invalid endpoint');
   const addresses=(await Promise.allSettled([Deno.resolveDns(u.hostname,'A'),Deno.resolveDns(u.hostname,'AAAA')])).flatMap(x=>x.status==='fulfilled'?x.value:[]);
   if(!addresses.length||addresses.some(ip=>!publicAddress(ip)))throw new Error('Invalid endpoint');
   const raw=JSON.stringify({id:job.id,...job.payload}),t=String(Math.floor(Date.now()/1000));
   const headers={'content-type':'application/json','content-length':String(new TextEncoder().encode(raw).length),'x-ihlink-event-id':job.id,'x-ihlink-timestamp':t,'x-ihlink-signature':await signature(job.secret,t,raw)};
   // Pin the validated address for this request; prevent DNS rebinding and redirects.
   const address=addresses[0],family=address.includes(':')?6:4;
   code=await new Promise<number>((resolve,reject)=>{
    const outgoing=httpsRequest(u,{method:'POST',agent:false,family,lookup:(_host,_options,callback)=>callback(null,address,family),headers},response=>{response.resume();resolve(response.statusCode||0)});
    outgoing.setTimeout(8000,()=>outgoing.destroy(new Error('Callback timed out')));
    outgoing.on('error',reject);outgoing.end(raw);
   });
   ok=code>=200&&code<300;
  }catch{/* Private endpoint and transport details never enter customer messages. */}
  const attempts=Number(job.attempts),terminal=attempts>=8;
  await admin.from('datasub_webhook_deliveries').update({status:ok?'delivered':terminal?'failed':'pending',delivered_at:ok?new Date().toISOString():null,last_status_code:code,last_error:ok?null:'Your callback endpoint did not accept this event.',next_attempt_at:new Date(Date.now()+Math.min(3600000,60000*2**attempts)).toISOString(),locked_at:null}).eq('id',job.id).eq('status','processing');
  if(ok)delivered++;
 }
 return json({checked:(jobs||[]).length,delivered});
});
