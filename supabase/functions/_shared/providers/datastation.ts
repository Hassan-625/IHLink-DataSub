export type ProviderResult={state:"SUCCESS"|"FAILED"|"UNKNOWN";reference?:string;raw:Record<string,unknown>;latency:number};

const origin=()=>Deno.env.get("DATASTATION_API_BASE_URL")||"https://datastationapi.com/api";
const token=()=>(Deno.env.get("DATASTATION_API_TOKEN")||"").trim();
const networkIds:Record<string,number>={MTN:1,GLO:2,"9MOBILE":3,T2:3,AIRTEL:4,SMILE:5};
const cableIds:Record<string,number>={GOTV:1,DSTV:2,STARTIME:3,STARTIMES:3};
const discoIds:Record<string,number>={"IKEJA ELECTRIC":1,IKEDC:1,"EKO ELECTRIC":2,EKEDC:2,"ABUJA ELECTRIC":3,AEDC:3,"KANO ELECTRIC":4,KEDCO:4,"ENUGU ELECTRIC":5,EEDC:5,"PORT HARCOURT ELECTRIC":6,PHEDC:6,"IBADAN ELECTRIC":7,IBEDC:7,"KADUNA ELECTRIC":8,KAEDCO:8,"JOS ELECTRIC":9,JEDC:9,"BENIN ELECTRIC":10,BEDC:10,"YOLA ELECTRIC":11,YEDC:11};

function api(path:string){return origin().replace(/\/$/,"")+"/"+path.replace(/^\//,"")}
function site(path:string){return new URL(path,origin().replace(/\/api\/?$/,"/")).toString()}
function classify(raw:any,httpOk:boolean):"SUCCESS"|"FAILED"|"UNKNOWN"{
  const value=raw?.status??raw?.Status??raw?.transaction_status??raw?.response_status;
  const s=String(value??"").trim().toLowerCase();
  if(httpOk&&["success","successful","completed","complete","delivered"].includes(s))return "SUCCESS";
  if(!httpOk||["failed","failure","error","rejected","cancelled","canceled"].includes(s))return "FAILED";
  return "UNKNOWN";
}
function referenceOf(raw:any){const v=raw?.reference??raw?.ident??raw?.id??raw?.transaction_id??raw?.request_id;return v==null||String(v)===""?undefined:String(v)}
async function request(url:string,init:RequestInit={}):Promise<ProviderResult>{
  const started=Date.now();
  if(!token())return {state:"UNKNOWN",raw:{configuration:"DATASTATION_API_TOKEN required"},latency:0};
  try{
    const r=await fetch(url,{...init,headers:{Authorization:`Token ${token()}`,"Content-Type":"application/json",...(init.headers||{})}});
    const parsed=await r.json().catch(()=>({}));const raw={...(parsed&&typeof parsed==='object'?parsed:{}),_http_status:r.status};
    return {state:classify(raw,r.ok),reference:referenceOf(raw),raw,latency:Date.now()-started};
  }catch(e){return {state:"UNKNOWN",raw:{error:String(e)},latency:Date.now()-started}}
}
const call=(path:string,init:RequestInit={})=>request(api(path),init);

export async function health(){
  const result=await call("/user/");
  if(result.state==="UNKNOWN"&&result.raw&&typeof result.raw==="object"&&!Object.hasOwn(result.raw,"error")&&!Object.hasOwn(result.raw,"configuration"))return {...result,state:"SUCCESS" as const};
  return result;
}
export async function purchase(input:any,mapping:any,key:string){
  const svc=String(input.service||"DATA").toUpperCase(),network=networkIds[String(input.network||"").toUpperCase()];
  let path="/data/",body:any={network,mobile_number:input.recipient,plan:Number(mapping.external_plan_id),Ported_number:!!input.ported};
  if(svc==="AIRTIME"){path="/topup/";body={network,amount:input.amount,mobile_number:input.recipient,Ported_number:!!input.ported,airtime_type:"VTU"}}
  else if(svc==="CABLE"){path="/cablesub/";body={cablename:cableIds[String(input.network||"").toUpperCase()]??input.network,cableplan:Number(mapping.external_plan_id)||mapping.external_plan_id,smart_card_number:input.recipient}}
  else if(svc==="ELECTRICITY"){path="/billpayment/";body={disco_name:discoIds[String(input.network||"").toUpperCase()]??input.network,amount:input.amount,meter_number:input.recipient,MeterType:String(input.meter_type||"").toUpperCase()==="POSTPAID"?2:1}}
  else if(svc==="EXAM"){path="/epin/";body={exam_name:input.network,quantity:input.quantity||1}}
  if((svc==="DATA"||svc==="AIRTIME")&&!network)return {state:"FAILED",raw:{validation:"Unsupported DataStation network"},latency:0};
  return call(path,{method:"POST",headers:{"Idempotency-Key":key},body:JSON.stringify(body)});
}
export async function reconcile(service:string,ref:string){
  const svc=String(service||"").toUpperCase();
  const paths:Record<string,string>={DATA:`/data/${encodeURIComponent(ref)}`,AIRTIME:`/topup/${encodeURIComponent(ref)}`,CABLE:`/cablesub/${encodeURIComponent(ref)}`,ELECTRICITY:`/billpayment/${encodeURIComponent(ref)}`};
  return paths[svc]?call(paths[svc]):Promise.resolve({state:"UNKNOWN",raw:{configuration:`No verified DataStation reconciliation path for ${svc}`},latency:0} as ProviderResult);
}
export async function validateIuc(iuc:string,cable:string){const q=new URLSearchParams({smart_card_number:iuc,cablename:String(cableIds[cable.toUpperCase()]??cable)});return request(site("ajax/validate_iuc?"+q))}
export async function validateMeter(meter:string,disco:string,meterType:string){const q=new URLSearchParams({meternumber:meter,disconame:String(discoIds[disco.toUpperCase()]??disco),mtype:String(meterType).toUpperCase()==="POSTPAID"?"2":"1"});return request(site("ajax/validate_meter_number?"+q))}
