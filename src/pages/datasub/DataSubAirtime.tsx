import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { naira } from '@/lib/designTokens';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Check } from 'lucide-react';
import { ServiceLogo } from '@/components/ServiceLogo';

type AirtimeProduct={id:string;provider:string;name:string;retail_price:number};
const quickAmounts=[100,200,500,1000,2000,5000];

export function DataSubAirtime(){
 const [products,setProducts]=useState<AirtimeProduct[]>([]),[provider,setProvider]=useState(''),[phone,setPhone]=useState(''),[amount,setAmount]=useState('');
 useEffect(()=>{async function load(){if(!supabase)return;const {data}=await supabase.from('datasub_products').select('id,provider,name,retail_price').eq('service_type','airtime').eq('is_active',true).order('sort_order');const rows=(data||[]).map(x=>({...x,retail_price:Number(x.retail_price)}));setProducts(rows);if(!provider&&rows[0])setProvider(rows[0].provider);}void load();},[]);
 const providers=useMemo(()=>Array.from(new Set(products.map(p=>p.provider))).map(name=>({name,isConfigured:true})),[products]);
 const value=Number(amount)||0,ready=provider&&phone.replace(/\D/g,'').length>=10&&value>=50;
 return <PageShell product="datasub"><div className="px-6 lg:px-10 py-12 max-w-[1280px] mx-auto">
  <Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">Airtime Catalogue</Badge><h1 className="text-3xl font-extrabold text-ink mb-2">Buy Airtime Instantly</h1><p className="text-sm text-muted mb-8">Choose a network and amount. Purchases are routed securely through IHLink's live multi-provider backend.</p>
  <div className="grid grid-cols-12 gap-6"><div className="col-span-12 lg:col-span-8"><Card padding="lg"><h2 className="text-lg font-bold text-ink mb-4">Select Network</h2>
   <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">{providers.map(item=><button type="button" onClick={()=>setProvider(item.name)} key={item.name} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${provider===item.name?'border-emerald-500 bg-emerald-50':'border-border hover:border-emerald-400'}`}><ServiceLogo name={item.name}/><span className="text-sm font-semibold">{item.name}</span></button>)}</div>
   
   <label className="block text-sm font-semibold mb-1.5">Phone Number</label><input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="0803 123 4567" className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border"/>
   <label className="block text-sm font-semibold mt-4 mb-1.5">Amount</label><div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-2">{quickAmounts.map(a=><button type="button" onClick={()=>setAmount(String(a))} key={a} className={`px-3 py-2 text-sm font-semibold border rounded-lg ${amount===String(a)?'border-emerald-500 bg-emerald-50':'border-border'}`}>{naira(a)}</button>)}</div><input value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="50" placeholder="Enter custom amount" className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border"/>
  </Card></div><div className="col-span-12 lg:col-span-4"><Card padding="lg"><h2 className="text-lg font-bold mb-4">Summary</h2><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted">Network</span><b>{provider||'Not selected'}</b></div><div className="flex justify-between"><span className="text-muted">Phone</span><b>{phone||'Not entered'}</b></div><div className="flex justify-between border-t pt-3"><b>Total</b><b className="text-emerald-600">{naira(value)}</b></div></div>
  {ready?<Link to={`/datasub/buy/airtime?provider=${encodeURIComponent(provider)}&recipient=${encodeURIComponent(phone)}&amount=${value}`}><Button fullWidth className="mt-4" rightIcon={<ArrowRight className="w-4 h-4"/>}>Continue to Pay</Button></Link>:<Button fullWidth disabled className="mt-4">Complete the details</Button>}<div className="flex items-center gap-2 mt-3 text-xs text-muted"><Check className="w-3.5 h-3.5 text-emerald-500"/>Wallet checkout uses the live IHLink routing service.</div></Card></div></div>
 </div></PageShell>;
}