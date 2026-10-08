import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BrowserVault} from '../src/lib/browserVault.ts';
const entries=new Map<string,string>();
(globalThis as any).localStorage={getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>{entries.set(key,value);(globalThis as any).localStorage[key]=value;},removeItem:(key:string)=>{entries.delete(key);delete (globalThis as any).localStorage[key];}};
test('browser passcode encrypts auth storage, survives lock/unlock and rekeys without losing the session',async()=>{
 await BrowserVault.reset();await BrowserVault.setItem({key:'sb-example-auth-token',value:'PRIVATE-SESSION'});
 await BrowserVault.configure({pin:'123456'});assert.equal(localStorage.getItem('sb-example-auth-token'),null);
 assert.equal(JSON.stringify([...entries]).includes('PRIVATE-SESSION'),false);
 await BrowserVault.lock();await assert.rejects(()=>BrowserVault.getItem({key:'sb-example-auth-token'}));
 await assert.rejects(()=>BrowserVault.unlock({pin:'000000'}));await BrowserVault.unlock({pin:'123456'});
 assert.equal((await BrowserVault.getItem({key:'sb-example-auth-token'})).value,'PRIVATE-SESSION');
 await BrowserVault.configure({pin:'654321',currentPin:'123456'});await BrowserVault.lock();await BrowserVault.unlock({pin:'654321'});
 assert.equal((await BrowserVault.getItem({key:'sb-example-auth-token'})).value,'PRIVATE-SESSION');
 for(let i=0;i<5;i++)await assert.rejects(()=>BrowserVault.unlock({pin:'000000'}));
 assert.equal((await BrowserVault.status()).enabled,false);assert.equal([...entries.keys()].some(key=>key.startsWith('ihlink.browser.vault.v1.')),false);
});
test('unsupported browser authenticator never enables biometric unlock',async()=>{
 await BrowserVault.configure({pin:'123456'});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{credentials:{create:async()=>({rawId:new Uint8Array(16),getClientExtensionResults:()=>({})}),get:async()=>({getClientExtensionResults:()=>({})})}}});
 await assert.rejects(()=>BrowserVault.biometric({enable:true}));assert.equal((await BrowserVault.status()).biometricEnabled,false);await BrowserVault.reset();
});
