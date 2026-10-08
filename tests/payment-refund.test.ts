import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { finalizeRefund } from '../supabase/functions/_shared/refunds.ts';
import * as cash from '../supabase/functions/_shared/providers/cashsub.ts';
import * as ds from '../supabase/functions/_shared/providers/datastation.ts';
import * as legit from '../supabase/functions/_shared/providers/legitdataway.ts';

const transaction = () => ({ id: 'tx', user_id: 'owner', reference: 'IHL-test', amount: 100, status: 'pending', routing_state: 'RECONCILING', provider: 'cashsub', provider_reference: 'receipt', service_type: 'data' });
function database(row = transaction(), replies: any[] = [{ data: true, error: null }]) {
  let credit = 0, calls = 0, credited = false;
  const records: any[] = [];
  const db: any = {
    from(table: string) {
      const filters: any[] = []; let update: any;
      const result = () => {
        if (table !== 'datasub_transactions') return { data: null, error: null };
        if (!filters.every(([key, values]: any) => values.includes((row as any)[key]))) return { data: null, error: null };
        if (update) Object.assign(row, update);
        return { data: update ? { id: row.id } : [row], error: null };
      };
      const chain: any = {
        update(value: any) { update = value; return chain; }, select() { return chain; },
        eq(key: string, value: any) { filters.push([key, [value]]); return chain; },
        in(key: string, values: any[]) { filters.push([key, values]); return chain; },
        order() { return chain; }, limit() { return chain; },
        maybeSingle: async () => result(), then(resolve: any) { return Promise.resolve(result()).then(resolve); },
        insert: async (value: any) => { records.push({ table, value }); return { error: null }; },
        upsert: async (value: any) => { records.push({ table, value }); return { error: null }; },
      };
      return chain;
    },
    async rpc(name: string, params: any) {
      calls++; assert.equal(name, 'refund_datasub_wallet'); assert.equal(params.p_reference, 'REFUND:IHL-test');
      assert.equal(row.routing_state, 'REFUND_PENDING');
      const reply = replies.shift() ?? { data: true, error: null };
      if (!reply.error && reply.data === true && !credited) { credit += params.p_amount; credited = true; }
      return reply;
    },
  };
  return { db, row, records, get credit() { return credit; }, get calls() { return calls; } };
}

test('unconfirmed wallet credit stays pending; retry credits once and completes', async () => {
  const fixture = database(transaction(), [{ data: false, error: null }, { data: true, error: null }]);
  assert.equal(await finalizeRefund(fixture.db, fixture.row), false);
  assert.equal(fixture.row.status, 'pending'); assert.equal(fixture.row.routing_state, 'REFUND_PENDING'); assert.equal(fixture.credit, 0);
  assert.equal(await finalizeRefund(fixture.db, fixture.row), true);
  assert.equal(fixture.row.routing_state, 'REFUNDED'); assert.equal(fixture.credit, 100);
  assert.equal(await finalizeRefund(fixture.db, fixture.row), false); assert.equal(fixture.calls, 2);
});
test('RPC errors cannot appear as completed refunds, and successful purchases cannot be refunded', async () => {
  const fixture = database(transaction(), [{ data: true, error: { message: 'unavailable' } }]);
  assert.equal(await finalizeRefund(fixture.db, fixture.row), false); assert.equal(fixture.row.routing_state, 'REFUND_PENDING'); assert.equal(fixture.credit, 0);
  fixture.row.status = 'success'; fixture.row.routing_state = 'SETTLED';
  assert.equal(await finalizeRefund(fixture.db, fixture.row), false); assert.equal(fixture.calls, 1);
});

(globalThis as any).Deno = { env: { get: () => 'test-only' } };
for (const [name, adapter] of Object.entries({ cashsub: cash, datastation: ds, legitdataway: legit })) {
  test(`${name}: lookup errors stay unknown; actual transaction outcomes are confirmed`, async () => {
    const original = globalThis.fetch;
    try {
      for (const [http, status, expected] of [[401, 'failed', 'UNKNOWN'], [500, 'error', 'UNKNOWN'], [404, 'fail', 'UNKNOWN'], [200, 'error', 'UNKNOWN'], [200, 'pending', 'UNKNOWN'], [200, 'success', 'SUCCESS'], [200, 'failed', 'FAILED']] as const) {
        globalThis.fetch = async (url: any) => new Response(JSON.stringify(String(url).endsWith('/user')
          ? { status: 'success', AccessToken: 'test-only' } : { status, reference: 'receipt' }), { status: String(url).endsWith('/user') ? 200 : http });
        assert.equal((await adapter.reconcile('DATA', 'receipt')).state, expected);
      }
    } finally { globalThis.fetch = original; }
  });
}
test('Legitdataway authentication failure with HTTP 200 is not a failed purchase', async () => {
  const original = globalThis.fetch;
  try { globalThis.fetch = async () => new Response(JSON.stringify({ status: 'fail' }), { status: 200 });
    assert.equal((await legit.reconcile('DATA', 'receipt')).state, 'UNKNOWN');
  } finally { globalThis.fetch = original; }
});
function handler(file: string, db: any, providerResult: string = 'UNKNOWN') {
  let captured: any;
  const source = fs.readFileSync(new URL(`../supabase/functions/${file}/index.ts`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports: {}, Response, Date,
    Deno: { env: { get: () => 'test-only' }, serve: (callback: any) => { captured = callback; } },
    require: (name: string) => name.includes('supabase-js') ? { createClient: () => db }
      : name.includes('refunds') ? { finalizeRefund } : { reconcile: async () => ({ state: providerResult, latency: 1 }) },
  });
  return captured;
}
test('refund retry worker retries wallet credit without another provider purchase', async () => {
  const fixture = database(); fixture.row.routing_state = 'REFUND_PENDING';
  const response = await handler('datasub-reconcile', fixture.db, 'SUCCESS')(new Request('https://test', { method: 'POST', body: '{}' }));
  assert.equal(response.status, 200); assert.equal(fixture.row.routing_state, 'REFUNDED'); assert.equal(fixture.credit, 100);
});
test('unknown reconciliation does not refund or mark a purchase completed', async () => {
  const fixture = database();
  await handler('datasub-reconcile', fixture.db)(new Request('https://test', { method: 'POST', body: '{}' }));
  assert.equal(fixture.calls, 0); assert.equal(fixture.row.status, 'pending'); assert.equal(fixture.row.routing_state, 'RECONCILING');
});
test('unsigned callbacks never credit wallets or change transaction/attempt outcomes', async () => {
  for (const file of ['datasub-provider-webhook', 'legitdataway-webhook']) {
    const mutations: any[] = [];
    const chain: any = { select() { return chain; }, eq() { return chain; }, order() { return chain; }, limit() { return chain; },
      maybeSingle: async () => ({ data: { id: 'tx', transaction_id: 'tx', status: 'pending', routing_state: 'REFUND_PENDING' } }),
      insert: async () => ({ error: null }), upsert: async () => ({ error: null }),
      update(value: any) { mutations.push(value); return chain; } };
    const db = { from: () => chain, rpc: () => { throw new Error('Callback must not credit money'); } };
    const response = await handler(file, db)(new Request('https://test', { method: 'POST', body: JSON.stringify({ 'request-id': 'IHL-test', status: 'fail' }) }));
    assert.equal(response.status, 202); assert.deepEqual(mutations, []);
  }
});
test('provider HTTP 500 purchase response stays ambiguous instead of enabling fallback/refund', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any) => new Response(JSON.stringify(String(url).endsWith('/user') ? { status: 'success', AccessToken: 'test-only' } : { status: 'error' }), { status: String(url).endsWith('/user') ? 200 : 500 });
    for (const adapter of [cash, ds, legit]) assert.equal((await adapter.purchase({ service: 'DATA', network: 'MTN', recipient: 'TEST' }, { external_plan_id: 1 }, 'TEST')).state, 'UNKNOWN');
  } finally { globalThis.fetch = original; }
});
test('Legitdataway sends the required phone field for data and airtime', async () => {
  const original = globalThis.fetch;
  const payloads: any[] = [];
  try {
    globalThis.fetch = async (url: any, init: any) => {
      if (String(url).endsWith('/user')) return new Response(JSON.stringify({ status: 'success', AccessToken: 'test-only' }));
      const body = JSON.parse(init.body); payloads.push(body);
      return new Response(JSON.stringify(body.phone ? { status: 'success', ident: 'receipt' } : { status: 'fail', message: 'The phone field is required.' }), { status: body.phone ? 200 : 403 });
    };
    for (const service of ['DATA', 'AIRTIME']) assert.equal((await legit.purchase({ service, network: 'MTN', recipient: '08000000000', amount: 50 }, { external_plan_id: 12 }, 'TEST')).state, 'SUCCESS');
    assert.equal(payloads.length, 2);
    for (const body of payloads) { assert.equal(body.phone, '08000000000'); assert.equal(body['request-id'], 'TEST'); assert.equal(body.mobile_number, undefined); }
  } finally { globalThis.fetch = original; }
});
test('explicit missing-field validation rejection fails safely; generic forbidden responses stay ambiguous', async () => {
  const original = globalThis.fetch;
  try {
    for (const [message, expected] of [['The phone field is required.', 'FAILED'], ['Forbidden', 'UNKNOWN']] as const) {
      globalThis.fetch = async (url: any) => new Response(JSON.stringify(String(url).endsWith('/user') ? { status: 'success', AccessToken: 'test-only' } : { status: 'fail', message }), { status: String(url).endsWith('/user') ? 200 : 403 });
      assert.equal((await legit.purchase({ service: 'DATA', network: 'MTN', recipient: '08000000000' }, { external_plan_id: 12 }, 'TEST')).state, expected);
      assert.equal((await legit.reconcile('DATA', 'receipt')).state, 'UNKNOWN');
    }
  } finally { globalThis.fetch = original; }
});
test('Legitdataway data/topup requests use the complete documented provider contract', async () => {
  const original=globalThis.fetch;const captured:any[]=[];
  try {
    globalThis.fetch=async(url:any,init:any)=>{if(String(url).endsWith('/user'))return new Response(JSON.stringify({status:'success',AccessToken:'test-only'}));captured.push({url:String(url),body:JSON.parse(init.body)});return new Response(JSON.stringify({status:'success','request-id':'TEST'}));};
    await legit.purchase({service:'DATA',network:'MTN',recipient:'08000000000',ported:false},{external_plan_id:123},'TEST');
    await legit.purchase({service:'AIRTIME',network:'AIRTEL',recipient:'08000000000',amount:100,ported:false},{external_plan_id:123},'TEST');
    assert.ok(captured[0].url.endsWith('/data'));assert.deepEqual(captured[0].body,{network:1,phone:'08000000000',data_plan:123,bypass:false,'request-id':'TEST'});
    assert.ok(captured[1].url.endsWith('/topup'));assert.deepEqual(captured[1].body,{network:2,phone:'08000000000',amount:100,bypass:false,plan_type:'VTU','request-id':'TEST'});
  }finally{globalThis.fetch=original;}
});
test('data plan/bypass validation rejection cannot strand a purchase as ambiguous',async()=>{
 const original=globalThis.fetch;
 try{for(const field of ['data plan','bypass','plan type']){
 globalThis.fetch=async(url:any)=>new Response(JSON.stringify(String(url).endsWith('/user')?{status:'success',AccessToken:'test-only'}:{status:'fail',message:`The ${field} field is required.`}),{status:String(url).endsWith('/user')?200:403});
 assert.equal((await legit.purchase({service:'DATA',network:'MTN',recipient:'08000000000'},{external_plan_id:123},'TEST')).state,'FAILED');
 }}finally{globalThis.fetch=original;}
});
test('CashSub explicit unavailable service without provider debit fails; generic HTTP 503 stays ambiguous',async()=>{
 const original=globalThis.fetch;
 try{for(const [body,expected]of [[{status:'fail',message:'MTN GIFTING is currently unavailable',balance_before:'199.00',balance_after:'199.00',api_response:null},'FAILED'],[{status:'fail',message:'Service unavailable'},'UNKNOWN'],[{status:'fail',message:'MTN GIFTING is currently unavailable',balance_before:'199.00',balance_after:'125.00',api_response:null},'UNKNOWN']] as const){
 globalThis.fetch=async()=>new Response(JSON.stringify(body),{status:503});assert.equal((await cash.purchase({service:'DATA',network:'MTN',recipient:'08000000000'},{external_plan_id:1},'TEST')).state,expected);
 }}finally{globalThis.fetch=original;}
});
