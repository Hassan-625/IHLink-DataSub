import assert from 'node:assert/strict';
import test from 'node:test';
import {quotePurchase,routeCost,transactionService} from '../supabase/functions/_shared/pricing.ts';
const electricity={markup_policy:{smart_earner_percent:5,reseller_percent:3,api_percent:2,top_seller_percent:2}};
for(const [tier,charge] of [['smart_earner',1050],['reseller',1030],['api_user',1020],['top_seller',1020]] as const){
 test(`₦1000 electricity uses ${tier} configured charge`,()=>{
  assert.deepEqual(quotePurchase('ELECTRICITY',tier,electricity,1000),{serviceAmount:1000,fee:charge-1000,charge,dynamic:true});
 });
}
test('airtime records face cost rather than zero catalogue placeholder',()=>{
 const quote=quotePurchase('AIRTIME','smart_earner',{markup_policy:{pricing_mode:'customer_amount'}},200);
 assert.equal(quote.charge,200);
 assert.equal(routeCost(quote.serviceAmount,true,{provider_cost:0}),200);
 assert.equal(routeCost(200,true,{raw_metadata:{billing:{cost_percent_of_face_value:98,fee_ngn:1}}}),197);
});
test('provider fees can make a dynamic route unprofitable',()=>{
 const quote=quotePurchase('ELECTRICITY','api_user',electricity,1000);
 assert.ok(routeCost(1000,true,{raw_metadata:{billing:{fee_ngn:30}}})>quote.charge);
});
test('invalid and unconfigured amounts are rejected before reserving money',()=>{
 for(const amount of [NaN,Infinity,-10,0,49.99,500001,100.001])assert.throws(()=>quotePurchase('AIRTIME','smart_earner',{markup_policy:{pricing_mode:'customer_amount'}},amount));
 assert.throws(()=>quotePurchase('ELECTRICITY','smart_earner',{},1000));
 assert.throws(()=>quotePurchase('DATA','smart_earner',{smart_earner_price:0},1000));
});
test('fees round up to a cent and fixed plans ignore client amounts',()=>{
 assert.equal(quotePurchase('ELECTRICITY','api_user',electricity,50.01).charge,51.02);
 assert.equal(quotePurchase('DATA','api_user',{api_price:125},1).charge,125);
 assert.equal(transactionService('EXAM'),'education');
 assert.equal(transactionService('CABLE'),'cable_tv');
});
