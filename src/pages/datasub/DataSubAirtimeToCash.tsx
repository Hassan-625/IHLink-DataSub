import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ServiceLogo } from '@/components/ServiceLogo';
import { networks } from '@/lib/datasubServices';
import { naira } from '@/lib/designTokens';
import { ArrowRightLeft, ShieldCheck } from 'lucide-react';

export function DataSubAirtimeToCash(){
 const {user}=useAuth(); const navigate=useNavigate();
 const [network,setNetwork]=useState('MTN'),[phone,setPhone]=useState(''),[amount,setAmount]=useState(''),[saving,setSaving]=useState(false),[notice,setNotice]=useState('');
 const value=Number(amount)||0,ready=phone.replace(/\D/g,'').length>=10&&value>=100;
 async function submit(){if(!ready)return;if(!user){navigate('/signin',{state:{from:'/datasub/airtime-to-cash'}});return;}if(!supabase){setNotice('This service is temporarily unavailable.');return;}setSaving(true);const {error}=await supabase.from('datasub_airtime_conversion_requests').insert({user_id:user.id,network,sender_phone:phone,airtime_amount:value,status:'awaiting_provider'});setSaving(false);setNotice(error?'Your request could not be saved. Please try again.':'Your request has been received. We will notify you when it can be processed.');if(!error){setPhone('');setAmount('');}}
 return <PageShell product="datasub"><div className="mx-auto max-w-[1180px] px-6 py-12">
  <Badge className="mb-3 bg-emerald-50 text-emerald-700">Airtime to Cash</Badge>
  <h1 className="text-3xl font-extrabold text-ink">Convert Airtime to Cash</h1>
  <p className="mt-2 mb-8 text-sm text-muted">Prepare an airtime conversion request. Conversion rates, receiving numbers and settlement will be activated when the production conversion provider is connected.</p>
  <div className="grid gap-6 lg:grid-cols-[1fr_360px]"><Card padding="lg">
   <h2 className="font-bold">Select network</h2><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{networks.map(n=><button key={n.name} onClick={()=>setNetwork(n.name)} className={`rounded-xl border-2 p-4 ${network===n.name?'border-emerald-500 bg-emerald-50':'border-border'}`}><ServiceLogo name={n.name}/><span className="mt-2 block text-sm font-bold">{n.name}</span></button>)}</div>
   <label className="mt-6 block text-sm font-semibold">Sender phone number</label><input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="0803 123 4567" className="mt-2 w-full rounded-lg border border-border p-3"/>
   <label className="mt-4 block text-sm font-semibold">Airtime amount</label><input value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="100" placeholder="Enter amount" className="mt-2 w-full rounded-lg border border-border p-3"/>
  </Card><Card padding="lg"><ArrowRightLeft className="h-8 w-8 text-emerald-600"/><h2 className="mt-3 font-bold">Conversion summary</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted">Network</span><b>{network}</b></div><div className="flex justify-between"><span className="text-muted">Airtime</span><b>{naira(value)}</b></div><div className="flex justify-between"><span className="text-muted">Rate</span><b>Provider-defined</b></div><div className="flex justify-between border-t pt-3"><span className="text-muted">Cash value</span><b>Shown after integration</b></div></div><Button fullWidth disabled={!ready||saving} onClick={()=>void submit()} className="mt-5">{saving?'Saving…':user?'Save conversion request':'Sign in to save request'}</Button>{notice&&<p className="mt-3 text-xs font-semibold">{notice}</p>}<p className="mt-3 flex gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4"/>No airtime should be transferred until an active receiving number and rate are displayed.</p></Card></div>
 </div></PageShell>;
}
