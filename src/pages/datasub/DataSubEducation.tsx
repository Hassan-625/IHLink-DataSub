import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { naira } from '@/lib/designTokens';
import { supabase } from '@/lib/supabase'; import { loadLiveCatalogue } from '@/lib/datasubCatalogue'; import { useDataSubTier } from '@/hooks/useDataSubTier';
import { ArrowRight } from 'lucide-react';
import { ServiceLogo } from '@/components/ServiceLogo';
type Product={id:string;provider:string;name:string;description:string|null;retail_price:number;reseller_price:number;api_price:number};
export function DataSubEducation(){
 const {priceFor}=useDataSubTier();
 const [products,setProducts]=useState<Product[]>([]),[selectedId,setSelectedId]=useState(''),[quantity,setQuantity]=useState(1);
 useEffect(()=>{async function load(){if(!supabase)return;const rows=await loadLiveCatalogue('education');setProducts(rows);if(rows[0])setSelectedId(rows[0].id);}void load();},[]);
 const selected=useMemo(()=>products.find(p=>p.id===selectedId)||null,[products,selectedId]);const total=(selected?priceFor(selected):0)*quantity;
 return <PageShell product="datasub"><div className="px-6 lg:px-10 py-12 max-w-[1280px] mx-auto"><Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">Educational Services</Badge><h1 className="text-3xl font-extrabold mb-2">Buy Education PINs</h1><p className="text-sm text-muted mb-8">WAEC, NECO, JAMB and NABTEB services are supported in the website catalogue. Purchasable products appear as provider pricing is connected.</p>
 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{products.map(p=><Card key={p.id} hover padding="lg"><ServiceLogo name={p.provider} className="mb-4"/><h3 className="text-lg font-bold">{p.name}</h3><p className="text-xs text-muted mb-3">{p.description||p.provider}</p><p className="text-xl font-bold text-emerald-600 mb-3">{naira(priceFor(p))}</p><Button size="sm" fullWidth onClick={()=>setSelectedId(p.id)}>Select</Button></Card>)}</div>
 {!products.length&&<div className="rounded-xl bg-amber-50 p-6 text-center text-sm text-amber-800">Education services are website-ready. Live PIN products and pricing will appear here when the provider catalogue is connected.</div>}
 {selected&&<Card padding="lg"><h2 className="text-lg font-bold mb-4">Purchase Details</h2><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold mb-1.5">Product</label><select value={selectedId} onChange={e=>setSelectedId(e.target.value)} className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border">{products.map(p=><option value={p.id} key={p.id}>{p.provider} — {p.name}</option>)}</select></div><div><label className="block text-sm font-semibold mb-1.5">Quantity</label><input value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(10,Number(e.target.value)||1)))} type="number" min={1} max={10} className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border"/></div></div><div className="flex items-center justify-between mt-4 pt-4 border-t"><span className="text-sm font-bold">Total: {naira(total)}</span><Link to={`/datasub/buy/education?provider=${encodeURIComponent(selected.provider)}&product=${encodeURIComponent(selected.name)}&amount=${total}&quantity=${quantity}`}><Button rightIcon={<ArrowRight className="w-4 h-4"/>}>Continue to Pay</Button></Link></div></Card>}
 </div></PageShell>;
}