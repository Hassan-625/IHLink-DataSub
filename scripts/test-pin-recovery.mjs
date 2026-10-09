import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const source = await fs.readFile('supabase/functions/datasub-pin-recovery/handler.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { createRecoveryHandler } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const user = { id: 'owner', email: 'owner@example.test', mfa: false, aal2: false };
async function run(overrides = {}, body = { password: 'verified-password', pin: '4826', user_id: 'another-user', email: 'another@example.test' }, token = 'valid') {
  const calls = [];
  const handler = createRecoveryHandler({
    authenticate: async t => { assert.equal(t, 'valid'); return user; },
    claim: async id => { calls.push(['claim', id]); return true; },
    verifyPassword: async (email, password) => { calls.push(['verify', email, password]); return 'owner'; },
    resetPin: async (id, pin) => { calls.push(['reset', id, pin]); },
    ...overrides,
  });
  const response = await handler(new Request('https://example.test', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body) }));
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  return { response, calls };
}
let r = await run(); assert.equal(r.response.status, 200); assert.deepEqual(r.calls, [['claim','owner'],['verify','owner@example.test','verified-password'],['reset','owner','4826']]);
r = await run({}, undefined, null); assert.equal(r.response.status, 401); assert.equal(r.calls.length, 0);
r = await run({ authenticate: async () => null }); assert.equal(r.response.status, 401); assert.equal(r.calls.length, 0);
r = await run({ claim: async () => false }); assert.equal(r.response.status, 429); assert.equal(r.calls.length, 0);
r = await run({ verifyPassword: async () => null }); assert.equal(r.response.status, 403); assert.ok(!r.calls.some(x => x[0] === 'reset'));
r = await run({ verifyPassword: async () => 'another-user' }); assert.equal(r.response.status, 403); assert.ok(!r.calls.some(x => x[0] === 'reset'));
r = await run({ authenticate: async () => ({ ...user, mfa: true }) }); assert.equal(r.response.status, 403); assert.equal(r.calls.length, 0);
r = await run({}, { password: 'x', pin: '12345' }); assert.equal(r.response.status, 400); assert.equal(r.calls.length, 0);
r = await run({ resetPin: async () => { throw new Error('private database failure'); } }); assert.equal(r.response.status, 503); assert.ok(!(await r.response.text()).includes('database'));
console.log('Wallet PIN recovery authorization, password, MFA, rate limit and ownership checks passed.');
