import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Check, Code, Copy, ExternalLink, Key, Search, Shield } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { ServiceLogo } from '@/components/ServiceLogo';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase'; import { loadLiveCatalogue } from '@/lib/datasubCatalogue';
import { naira } from '@/lib/designTokens';
import { networks, cableProviders, electricityProviders } from '@/lib/datasubServices';

type ApiProduct = { id:string; code:string; service_type:string; provider:string; name:string; plan_category:string|null; validity_label:string|null; api_price:number };
type ApiCredential = { key_prefix:string; status:string; mode:string };
const apiBase='https://lnqsroyiybutkfngbyge.supabase.co/functions/v1/datasub-api';
const sectionNames:Record<string,string>={data:'Data plans',airtime:'Airtime services',cable_tv:'Cable plans',electricity:'Electricity plans',education:'Exam PIN plans'};
const websiteServices=[...networks.map(x=>x.name),...cableProviders.map(x=>x.name),...electricityProviders.map(x=>x.name),'WAEC','NECO','JAMB','NABTEB'];
const codeExamples:Record<string,string>={
 curl:`curl -X POST ${apiBase}/purchase \\
  -H "x-ihlink-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_code":"YOUR_PRODUCT_CODE","recipient":"08031234567","reference":"ORDER-1001"}'`,
 javascript:`const response = await fetch('${apiBase}/purchase', {
  method: 'POST',
  headers: {
    'x-ihlink-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product_code: 'YOUR_PRODUCT_CODE',
    recipient: '08031234567',
    reference: 'ORDER-1001'
  })
});

const result = await response.json();`,
 php:`$payload = json_encode([
  'product_code' => 'YOUR_PRODUCT_CODE',
  'recipient' => '08031234567',
  'reference' => 'ORDER-1001'
]);

$ch = curl_init('${apiBase}/purchase');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['x-ihlink-api-key: YOUR_API_KEY', 'Content-Type: application/json'],
  CURLOPT_POSTFIELDS => $payload
]);

$result = curl_exec($ch);`,
 python:`import requests

response = requests.post(
    '${apiBase}/purchase',
    headers={'x-ihlink-api-key': 'YOUR_API_KEY'},
    json={
        'product_code': 'YOUR_PRODUCT_CODE',
        'recipient': '08031234567',
        'reference': 'ORDER-1001'
    }
)

print(response.json())`,
};

export function DataSubApi(){
 const {user}=useAuth();
 const [products,setProducts]=useState<ApiProduct[]>([]),[credential,setCredential]=useState<ApiCredential|null>(null),[search,setSearch]=useState(''),[loading,setLoading]=useState(true),[copied,setCopied]=useState<string|null>(null);
 useEffect(()=>{const client=supabase;async function load(){if(!client){setLoading(false);return;}const productRequest=loadLiveCatalogue();const credentialRequest=user?client.from('datasub_api_credentials').select('key_prefix,status,mode').eq('user_id',user.id).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle():Promise.resolve({data:null});const [productResult,credentialResult]=await Promise.all([productRequest,credentialRequest]);setProducts(((productResult||[]) as any[]).map(row=>({id:row.id,code:row.code,service_type:row.service_type==='cable'?'cable_tv':row.service_type==='exam'?'education':row.service_type,provider:row.provider,name:row.name,plan_category:row.plan_category,validity_label:row.validity_label,api_price:Number(row.api_price)})));setCredential((credentialResult.data||null) as ApiCredential|null);setLoading(false);}void load();if(!client)return;const channel=client.channel('developer-api-catalogue').on('postgres_changes',{event:'*',schema:'public',table:'datasub_catalog_offerings'},()=>void load()).subscribe();return()=>{void client.removeChannel(channel);};},[user]);
 const filtered=useMemo(()=>{const term=search.trim().toLowerCase();return term?products.filter(product=>[product.code,product.service_type,product.provider,product.name,product.plan_category,product.validity_label].some(value=>value?.toLowerCase().includes(term))):products;},[products,search]);
 const grouped=useMemo(()=>Object.entries(sectionNames).map(([key,label])=>({key,label,rows:filtered.filter(product=>product.service_type===key)})).filter(section=>section.rows.length),[filtered]);
 async function copy(value:string,name:string){await navigator.clipboard.writeText(value);setCopied(name);window.setTimeout(()=>setCopied(null),1800);}
 return <PageShell product="datasub">
  <section className="border-b border-slate-200 bg-slate-50"><div className="mx-auto max-w-[1360px] px-6 py-10 lg:px-10"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><Badge className="mb-3 border-sky-200 bg-sky-50 text-sky-700">Developer platform</Badge><h1 className="text-3xl font-extrabold text-ink md:text-4xl">API credentials and plans</h1><p className="mt-3 max-w-3xl text-base text-muted">The developer interface is prepared for server-side API credentials and provider-backed plans. Live purchasing becomes available as the production provider integration is enabled.</p></div><a href="#documentation"><Button variant="secondary" rightIcon={<ExternalLink className="h-4 w-4"/>}>Read API documentation</Button></a></div></div></section>
  <main className="mx-auto max-w-[1360px] space-y-8 px-6 py-10 lg:px-10">
   <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
    <Card padding="lg"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-muted">API credentials</p><h2 className="mt-1 text-xl font-bold text-ink">Authenticate every request with one token.</h2></div><div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-600"><Key className="h-5 w-5"/></div></div><div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wide text-muted">{credential?'Active credential':'Not created'}</span>{credential&&<Badge variant="status" status={credential.status}/>}</div><p className="mt-3 font-mono text-sm font-semibold text-ink">{credential?`${credential.key_prefix}••••••••••••`:'No API token created'}</p>{credential&&<p className="mt-1 text-xs capitalize text-muted">{credential.mode} mode · full secret hidden</p>}</div><Link to={user?'/datasub/api-dashboard':'/signin'} className="mt-4 block"><Button fullWidth>{credential?'Manage API credentials':user?'Create API token':'Sign in to create token'}</Button></Link></Card>
    <Card padding="lg"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-muted">Base URL</p><h2 className="mt-1 text-xl font-bold text-ink">Integration endpoint</h2></div><Shield className="h-6 w-6 text-emerald-600"/></div><div className="mt-5 flex items-center gap-2 rounded-xl bg-navy-900 p-4 text-emerald-300"><code className="min-w-0 flex-1 break-all text-sm">{apiBase}</code><button onClick={()=>void copy(apiBase,'base')} className="rounded-lg p-2 hover:bg-white/10" aria-label="Copy API base URL">{copied==='base'?<Check className="h-4 w-4"/>:<Copy className="h-4 w-4"/>}</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{[['GET','/health','Health check'],['GET','/products','List catalogue'],['POST','/purchase','Submit purchase']].map(([method,path,label])=><div key={path} className="rounded-xl border border-slate-200 p-3"><Badge className={method==='GET'?'bg-emerald-50 text-emerald-700':'bg-sky-50 text-sky-700'}>{method}</Badge><code className="mt-2 block text-xs font-bold text-ink">{path}</code><p className="mt-1 text-xs text-muted">{label}</p></div>)}</div><p className="mt-4 text-xs text-muted">Send <code className="font-semibold text-ink">x-ihlink-api-key: YOUR_API_KEY</code>. Keep live credentials on your server—never in browser or mobile client code.</p></Card>
   </div>
   <section><div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-sky-700">API catalogue</p><h2 className="mt-1 text-2xl font-extrabold text-ink">Search API plans</h2><p className="mt-1 text-sm text-muted">Live API-priced plans appear here once connected. The supported-service catalogue remains visible during integration.</p></div><label className="relative block w-full md:w-[440px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/><input value={search} onChange={event=>setSearch(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" placeholder="Search by plan ID, service, network, name or type"/></label></div><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-ink">{filtered.length} of {products.length} plans</p>{loading&&<span className="text-sm text-muted">Loading live catalogue…</span>}</div><div className="space-y-6">{grouped.map(section=><Card key={section.key} padding="none" className="overflow-hidden"><div className="border-b border-slate-200 px-5 py-4"><h3 className="text-lg font-bold text-ink">{section.label}</h3><p className="text-xs text-muted">{section.rows.length} active {section.rows.length===1?'plan':'plans'}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">Plan ID</th><th className="px-5 py-3">Network / product</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Validity</th><th className="px-5 py-3 text-right">API price</th></tr></thead><tbody>{section.rows.map(product=><tr key={product.id} className="border-t border-slate-100 hover:bg-sky-50/40"><td className="px-5 py-3 font-mono text-xs font-semibold text-sky-700">{product.code}</td><td className="px-5 py-3"><ServiceLogo name={product.provider} size="sm" showLabel/></td><td className="px-5 py-3 font-semibold text-ink">{product.name}</td><td className="px-5 py-3 uppercase text-muted">{product.plan_category?.replaceAll('_',' ')||product.service_type.replaceAll('_',' ')}</td><td className="px-5 py-3 text-muted">{product.validity_label||'—'}</td><td className="px-5 py-3 text-right font-bold text-ink">{naira(product.api_price)}</td></tr>)}</tbody></table></div></Card>)}{!loading&&!grouped.length&&<Card padding="lg"><div className="text-center"><Search className="mx-auto h-8 w-8 text-slate-300"/><h3 className="mt-3 font-bold text-ink">Live API pricing is pending integration</h3><p className="mt-1 text-sm text-muted">Supported services remain visible below. API product IDs and prices will populate from the production provider catalogue.</p></div><div className="mt-5 flex flex-wrap justify-center gap-2">{websiteServices.map(name=><div key={name} className="rounded-xl border border-slate-200 bg-white px-3 py-2"><ServiceLogo name={name} size="sm" showLabel/></div>)}</div></Card>}</div></section>
   <section id="documentation" className="scroll-mt-24"><div className="mb-5"><p className="text-sm font-semibold text-sky-700">Documentation</p><h2 className="mt-1 text-2xl font-extrabold text-ink">Prepare your first request</h2></div><div className="grid gap-6 lg:grid-cols-[1.45fr_.75fr]"><Card padding="lg"><Tabs tabs={[{label:'cURL',value:'curl'},{label:'JavaScript',value:'javascript'},{label:'PHP',value:'php'},{label:'Python',value:'python'}]} content={Object.fromEntries(Object.entries(codeExamples).map(([key,value])=>[key,<div className="relative" key={key}><pre className="overflow-x-auto rounded-xl bg-navy-900 p-5 text-xs leading-relaxed text-emerald-300">{value}</pre><button onClick={()=>void copy(value,key)} className="absolute right-3 top-3 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20" aria-label={`Copy ${key} example`}>{copied===key?<Check className="h-4 w-4"/>:<Copy className="h-4 w-4"/>}</button></div>]))}/></Card><Card padding="lg"><Code className="h-6 w-6 text-sky-600"/><h3 className="mt-3 text-lg font-bold text-ink">Response rules</h3><ul className="mt-4 space-y-3 text-sm text-muted"><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/>JSON request and response bodies</li><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/>Unique reference for idempotency</li><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/>Standard HTTP status codes</li><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/>Sandbox and live credential modes</li><li className="flex gap-2"><Activity className="mt-0.5 h-4 w-4 shrink-0 text-sky-600"/>Request activity appears in your API dashboard</li></ul><Link to="/datasub/api-dashboard" className="mt-6 block"><Button fullWidth>Open API dashboard</Button></Link></Card></div></section>
  </main>
 </PageShell>;
}

