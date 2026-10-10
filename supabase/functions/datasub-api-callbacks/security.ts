export function publicAddress(ip:string):boolean {
 const v=ip.toLowerCase();
 if(v.includes(':'))return v.startsWith('2')||v.startsWith('3');
 const parts=v.split('.').map(Number);if(parts.length!==4||parts.some(n=>!Number.isInteger(n)||n<0||n>255))return false;
 const [a,b]=parts;
 return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&[0,168].includes(b)||a===100&&b>=64&&b<=127||a===198&&[18,19,51].includes(b)||a===203&&b===0);
}
export async function signature(secret:string,timestamp:string,raw:string):Promise<string>{
 const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(timestamp+'.'+raw)))).map(x=>x.toString(16).padStart(2,'0')).join('');
}
