import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {publicAddress,signature} from '../supabase/functions/datasub-api-callbacks/security.ts';
test('callback dispatch rejects private, loopback and mapped addresses',()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','172.16.0.1','192.168.1.2','169.254.169.254','100.64.0.1','0.0.0.0','::1','fc00::1','fe80::1','::ffff:127.0.0.1','999.1.1.1'])assert.equal(publicAddress(ip),false,ip);
 assert.equal(publicAddress('8.8.8.8'),true);assert.equal(publicAddress('2606:4700::1111'),true);
});
test('callback signature matches raw-body HMAC and detects body changes',async()=>{
 const secret='fixture-only',raw='{"id":"event-1","data":{"reference":"ORDER-1001"}}',time='1791657600';
 const value=await signature(secret,time,raw);assert.equal(value,createHmac('sha256',secret).update(time+'.'+raw).digest('hex'));
 assert.notEqual(value,await signature(secret,time,raw+' '));assert.notEqual(value,await signature(secret,time+'1',raw));
});
