import test from 'node:test';
import assert from 'node:assert/strict';
import {savePurchaseDelivery} from '../supabase/functions/_shared/extraServices.ts';
test('LegitDataWay comma separated card pins and serials are stored only for their transaction owner',async()=>{
 let saved:any;const client={from:(table:string)=>{assert.equal(table,'datasub_purchase_deliveries');return{upsert:async(row:any)=>{saved=row;return{error:null}}}}};
 await savePurchaseDelivery(client,{id:'transaction-one',user_id:'owner-one'},{pin:'12345,67890',serial:'serial-a,serial-b',load_pin:'*555*',check_balance:'*556#'});
 assert.equal(saved.transaction_id,'transaction-one');assert.equal(saved.user_id,'owner-one');assert.deepEqual(saved.details.cards,[{pin:'12345',serial:'serial-a'},{pin:'67890',serial:'serial-b'}]);assert.equal(saved.details.load_pin,'*555*');
});
