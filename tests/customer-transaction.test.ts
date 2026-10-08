import assert from 'node:assert/strict';
import { test } from 'node:test';
import { customerService, customerTransaction } from '../src/lib/dataSubCustomerTransaction.ts';
const purchase = { id: 'tx', reference: 'IHL-test', service_type: 'data', recipient: '08000000000', amount: '78', status: 'pending', created_at: '2026-10-08', provider: 'legitdataway' };
test('dashboard, history and receipt model describes the network and purchased plan without provider details', () => {
  const result=customerTransaction({...purchase,catalog:{network:'MTN',name:'75MB Gifting - 1 day'}});
  assert.equal(result.service,'MTN');assert.equal(result.plan,'75MB Gifting - 1 day');
  assert.equal(result.amount,78);assert.equal(result.ref,'IHL-test');assert.equal(result.status,'pending');
  assert.equal(JSON.stringify(result).includes('legitdataway'),false);
});
test('legacy records and missing catalogue never substitute an internal provider for a customer service', () => {
  assert.equal(customerTransaction(purchase).service,'Data');
  assert.equal(customerTransaction({...purchase,network:'AIRTEL'}).service,'Airtel');
  assert.equal(customerTransaction({...purchase,catalog:{network:'legitdataway',name:'legitdataway internal plan'}}).plan,undefined);
  for(const provider of ['cashsub','datastation','legitdataway','routing']) assert.equal(customerService(provider),'Service');
  assert.equal(customerService('9MOBILE'),'T2');
});
