import assert from 'node:assert/strict';
import test from 'node:test';
import * as cash from '../supabase/functions/_shared/providers/cashsub.ts';
import * as legit from '../supabase/functions/_shared/providers/legitdataway.ts';
test('special-service providers use their documented endpoints and field names',async()=>{
 const originalFetch=globalThis.fetch,originalDeno=(globalThis as any).Deno,calls:any[]=[];
 (globalThis as any).Deno={env:{get:(name:string)=>({CASHSUB_API_TOKEN:'fixture-token',LEGITDATAWAY_USERNAME:'fixture-user',LEGITDATAWAY_PASSWORD:'fixture-password'} as any)[name]}};
 globalThis.fetch=async(url:any,init:any)=>{calls.push({url:String(url),body:JSON.parse(init.body||'{}')});return new Response(JSON.stringify(String(url).endsWith('/user')?{status:'success',AccessToken:'fixture-access-token'}:{status:'success',reference:'fixture-reference'}),{status:200});};
 try{
 await cash.purchase({service:'SMILE',recipient:'08031234567',account_type:'PhoneNumber'},{external_plan_id:'25'},'fixture-request');assert.equal(calls.at(-1).url,'https://api.cashsub.ng/api/smile/');assert.deepEqual(calls.at(-1).body,{plan:25,account_value:'08031234567',account_type:'PhoneNumber','request-id':'fixture-request'});
 await cash.purchase({service:'RECHARGE_CARD',network:'MTN',quantity:20,card_name:'IHLink'},{external_plan_id:'2'},'fixture-request');assert.equal(calls.at(-1).url,'https://api.cashsub.ng/api/rechargecard/');assert.equal(calls.at(-1).body.quantity,20);
 await legit.purchase({service:'KIRANI',recipient:'08031234567'},{external_plan_id:'5'},'fixture-request');assert.equal(calls.at(-1).url,'https://legitdataway.com/api/buy_smile_alpha_Kirani');assert.deepEqual(calls.at(-1).body,{plan:5,service_type:'kirani',accountValue:'08031234567','request-id':'fixture-request'});
 await legit.purchase({service:'SMILE',recipient:'08031234567',account_type:'PhoneNumber'},{external_plan_id:'25'},'smile-request');assert.equal(calls.at(-1).body.accountType,'PhoneNumber');
 await legit.purchase({service:'DATA_CARD',network:'MTN',quantity:2,card_name:'IHLink'},{external_plan_id:'1'},'data-card-request');assert.equal(calls.at(-1).url,'https://legitdataway.com/api/data_card');assert.deepEqual(calls.at(-1).body,{network:1,plan_type:1,quantity:2,card_name:'IHLink','request-id':'data-card-request'});
 await legit.purchase({service:'RECHARGE_CARD',network:'MTN',quantity:2,card_name:'IHLink'},{external_plan_id:'1'},'recharge-card-request');assert.equal(calls.at(-1).url,'https://legitdataway.com/api/recharge_card');
 await legit.purchase({service:'BULK_SMS',recipient:'08031234567',sender:'IHLink',message:'Hello'},{external_plan_id:'1'},'sms-request');assert.deepEqual(calls.at(-1).body,{sender:'IHLink',number:'08031234567',message:'Hello','request-id':'sms-request'});
 const before=calls.length;assert.equal((await legit.purchase({service:'VITEL'},{external_plan_id:'1'},'fixture-request')).state,'FAILED');assert.equal(calls.length,before);
 }finally{globalThis.fetch=originalFetch;(globalThis as any).Deno=originalDeno;}
});

