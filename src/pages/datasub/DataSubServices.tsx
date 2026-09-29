import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, type SidebarSection } from '@/components/Sidebar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { naira } from '@/lib/designTokens';
import { useAuth } from '@/context/AuthContext';
import { Grid3X3, Wallet, ReceiptText, Search } from 'lucide-react';

type Offering={id:string;service_type:string;network:string|null;plan_type:string|null;name:string;validity:string|null;smart_earner_price:number;customer_enabled:boolean};
const labels:Record<string,string>={AIRTIME:'Airtime',DATA:'Mobile Data',CABLE:'Cable TV',ELECTRICITY:'Electricity',EXAM:'Education PIN',SMILE:'Smile',KIRANI:'Kirani',BULK_SMS:'Bulk SMS',DATA_CARD:'Data Cards',RECHARGE_CARD:'Recharge Cards',ALPHA:'Alpha'};
const buyRoutes:Record<string,string>={AIRTIME:'/datasub/buy/airtime',DATA:'/datasub/buy/data',CABLE:'/datasub/buy/cable',ELECTRICITY:'/datasub/buy/electricity',EXAM:'/datasub/buy/education'};
const sections:SidebarSection[]=[{title:'Customer',items:[{label:'Dashboard',href:'/datasub/dashboard',icon:<Grid3X3 className="h-4 w-4"/>},{label:'All Services',href:'/datasub/services',icon:<Grid3X3 className="h-4 w-4"/>},{label:'Wallet',href:'/datasub/wallet',icon:<Wallet className="h-4 w-4"/>},{label:'Transactions',href:'/datasub/transactions',icon:<ReceiptText className="h-4 w-4"/>}]}];

export function DataSubServices(){
 const {profile}=useAuth(); const [items,setItems]=useState<Offering[]>([]),[available,setAvailable]=useState<Set<string>>(new Set()),[query,setQuery]=useState(''),[service,setService]=useState('ALL'),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{void (async()=>{if(!supabase){setError('Catalogue unavailable.');setLoading(false);return;}const [catalogue,live]=await Promise.all([supabase.from('datasub_catalog_offerings').select('id,service_type,network,plan_type,name,validity,smart_earner_price,customer_enabled').eq('customer_enabled',true).order('service_type').order('network').order('smart_earner_price'),supabase.from('datasub_customer_catalogue').select('id')]);if(catalogue.error||live.error)setError(catalogue.error?.message||live.error?.message||'Catalogue unavailable.');setItems((catalogue.data||[]) as Offering[]);setAvailable(new Set((live.data||[]).map(x=>x.id)));setLoading(false);})();},[]);
 const services=useMemo(()=>Array.from(new Set(items.map(x=>x.service_type))),[items]);
 const filtered=useMemo(()=>items.filter(x=>(service==='ALL'||x.service_type===service)&&(!query||[x.name,x.network,x.plan_type,x.validity,x.service_type].some(v=>String(v||'').toLowerCase().includes(query.toLowerCase())))),[items,query,service]);
 const counts=useMemo(()=>services.map(s=>({service:s,count:items.filter(x=>x.service_type===s).length})),[items,services]);
 const name=profile?[profile.first_name,profile.last_name].filter(Boolean).join(' ')||profile.email:'IHLink Customer';
 return <DashboardLayout product="datasub" sections={sections} userName={name} userRole="Smart Earner" pageTitle="All DataSub Services" pageBreadcrumb={[{label:'Services'}]}>
  <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{counts.map(x=><button key={x.service} onClick={()=>setService(x.service)} className={`rounded-xl border p-4 text-left transition ${service===x.service?'border-emerald-500 bg-emerald-50':'border-border bg-white hover:border-emerald-200'}`}><p className="font-bold">{labels[x.service]||x.service.replaceAll('_',' ')}</p><p className="mt-1 text-xs text-muted">{x.count} catalogue item{x.count===1?'':'s'}</p></button>)}</div>
  <Card padding="lg" className="mb-5"><div className="flex flex-col gap-3 md:flex-row md:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search plans, networks and services…" className="w-full rounded-xl border border-border py-2.5 pl-10 pr-3 text-sm"/></div><button onClick={()=>setService('ALL')} className="rounded-xl border px-4 py-2.5 text-sm font-bold">Show all</button></div></Card>
  {error&&<p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
  {loading?<p className="py-12 text-center text-muted">Loading the live IHLink catalogue…</p>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(x=><Card key={x.id} padding="lg"><div className="flex items-start justify-between gap-3"><div><Badge>{labels[x.service_type]||x.service_type.replaceAll('_',' ')}</Badge><h3 className="mt-3 font-extrabold text-ink">{x.name}</h3><p className="mt-1 text-xs text-muted">{[x.network,x.plan_type,x.validity].filter(Boolean).join(' · ')}</p></div>{Number(x.smart_earner_price)>0&&<span className="font-extrabold text-emerald-700">{naira(Number(x.smart_earner_price))}</span>}</div><div className="mt-5">{buyRoutes[x.service_type]&&available.has(x.id)?<Link to={buyRoutes[x.service_type]}><Button fullWidth>Open service</Button></Link>:<Button fullWidth variant="secondary" disabled>Provider activation pending</Button>}</div></Card>)}</div>}
  {!loading&&!filtered.length&&<p className="py-12 text-center text-muted">No catalogue items match this filter.</p>}
 </DashboardLayout>;
}
