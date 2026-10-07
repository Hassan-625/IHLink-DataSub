import { dataNetworkKey, dataPlanType, dataPlanTypeLabel, matchesPlanCategory } from '@/lib/dataPlanFilters';
import { networks } from '@/lib/datasubServices';
import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout, type SidebarSection } from '@/components/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Stepper } from '@/components/ui/Stepper';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { naira } from '@/lib/designTokens';
import { ServiceLogo } from '@/components/ServiceLogo';
import { useDataSubData } from '@/hooks/useDataSubData';
import { useDataSubTier } from '@/hooks/useDataSubTier';
import { supabase } from '@/lib/supabase'; import { loadLiveCatalogue } from '@/lib/datasubCatalogue';
import { quotePurchase } from '../../../supabase/functions/_shared/pricing';
import { Check, Smartphone, Wifi, Zap, Tv, GraduationCap, Lock, ArrowRight, ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface PurchaseFlowProps {
  service: 'airtime' | 'data' | 'electricity' | 'cable' | 'education';
}
type LiveProduct={id:string;provider:string;name:string;retail_price:number;reseller_price:number;api_price:number;description:string|null;plan_category:string|null;validity_label:string|null;markup_policy:Record<string,unknown>};

const serviceConfig: Record<string, { title: string; icon: typeof Smartphone; steps: { label: string }[] }> = {
  airtime: { title: 'Buy Airtime', icon: Smartphone, steps: [{ label: 'Service' }, { label: 'Details' }, { label: 'Amount' }, { label: 'Payment' }, { label: 'PIN' }, { label: 'Confirm' }] },
  data: { title: 'Buy Data', icon: Wifi, steps: [{ label: 'Service' }, { label: 'Details' }, { label: 'Plan' }, { label: 'Payment' }, { label: 'PIN' }, { label: 'Confirm' }] },
  electricity: { title: 'Pay Electricity', icon: Zap, steps: [{ label: 'Provider' }, { label: 'Meter' }, { label: 'Amount' }, { label: 'Payment' }, { label: 'PIN' }, { label: 'Confirm' }] },
  cable: { title: 'Pay Cable TV', icon: Tv, steps: [{ label: 'Provider' }, { label: 'IUC' }, { label: 'Package' }, { label: 'Payment' }, { label: 'PIN' }, { label: 'Confirm' }] },
  education: { title: 'Buy Education PIN', icon: GraduationCap, steps: [{ label: 'Exam' }, { label: 'Details' }, { label: 'Quantity' }, { label: 'Payment' }, { label: 'PIN' }, { label: 'Confirm' }] },
};

const sidebarSections: SidebarSection[] = [
  { title: 'Main', items: [
    { label: 'Dashboard', href: '/datasub/dashboard', icon: <Smartphone className="w-4 h-4" /> },
    { label: 'Wallet', href: '/datasub/wallet', icon: <Smartphone className="w-4 h-4" /> },
  { label: 'Transactions', href: '/datasub/transactions', icon: <Smartphone className="w-4 h-4" /> },
  ]},
];

export function PurchaseFlow({ service }: PurchaseFlowProps) {
  const [params]=useSearchParams();
  const config = serviceConfig[service];
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<'none' | 'success' | 'failed' | 'pending'>('none');
  const [provider,setProvider]=useState('');
  const [dataType,setDataType]=useState('all');
  const [recipient,setRecipient]=useState('');
  const [amount,setAmount]=useState('');
  const [selection,setSelection]=useState('');
  const [pin,setPin]=useState('');
  const [reference,setReference]=useState('');
  const [failureMessage,setFailureMessage]=useState('');
  const [refunded,setRefunded]=useState(false);
  const [processing,setProcessing]=useState(false);const[hasTransactionPin,setHasTransactionPin]=useState<boolean|null>(null);
  const [liveProducts,setLiveProducts]=useState<LiveProduct[]>([]);
  const [productsLoading,setProductsLoading]=useState(true);
  const providers=service==='data' ? Array.from(new Map([...networks.map(n=>n.name),...liveProducts.map(p=>p.provider)].map(name=>[dataNetworkKey(name),name])).values()) : Array.from(new Set(liveProducts.map(p=>p.provider)));
  const networkProducts=liveProducts.filter(p=>service==='data'?dataNetworkKey(p.provider)===dataNetworkKey(provider):p.provider===provider);
  const typeKeys=Array.from(new Set(['all','sme','corporate_gifting','gifting',...networkProducts.map(dataPlanType).filter(Boolean)]));
  const visibleProducts=service==='data'?networkProducts.filter(p=>matchesPlanCategory(p,dataType)):networkProducts;
  function changeProvider(name:string){setProvider(name);setDataType('all');setSelection('');setAmount('');setPin('');setChargedAmount(null);}
  function changeDataType(key:string){setDataType(key);setSelection('');setAmount('');setPin('');setChargedAmount(null);}
  const typeFilters=service==='data'&&provider?<div className="my-5"><h4 className="mb-2 text-sm font-bold">Data type for {provider}</h4><div className="flex flex-wrap gap-2" role="group" aria-label="Data type">{typeKeys.map(key=>{const count=key==='all'?networkProducts.length:networkProducts.filter(p=>matchesPlanCategory(p,key)).length;return <button type="button" key={key} aria-pressed={dataType===key} onClick={()=>changeDataType(key)} className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold ${dataType===key?'border-emerald-600 bg-emerald-600 text-white':'border-border bg-white text-ink'}`}>{dataPlanTypeLabel(key)} <span className="text-xs">({count})</span></button>})}</div><p className="mt-2 text-xs text-muted">Only currently available plans for this network and data type are listed.</p></div>:null;
  const { showToast } = useToast();
  const {wallet,userName,refresh}=useDataSubData();
  const {tier,priceFor}=useDataSubTier();
  const requestKey=useRef({signature:'',key:''});
  const [chargedAmount,setChargedAmount]=useState<number|null>(null);
  const [catalogueError,setCatalogueError]=useState('');
  useEffect(()=>{setProvider(params.get('provider')||'');setRecipient(params.get('recipient')||'');setAmount(params.get('amount')||'');setSelection(params.get('product_id')||'');setDataType('all');},[params,service]);
  useEffect(()=>{if(supabase)void supabase.rpc("datasub_has_transaction_pin").then(r=>setHasTransactionPin(Boolean(r.data)));},[]);
  useEffect(()=>{let active=true;setProductsLoading(true);setLiveProducts([]);async function loadProducts(){try{if(!supabase)throw new Error('Unavailable');const rows=await loadLiveCatalogue(service);if(!active)return;setCatalogueError('');setLiveProducts(rows);const requested=params.get('product_id');const selected=rows.find(row=>row.id===requested);if(selected){setProvider(selected.provider);setSelection(selected.id);setDataType(dataPlanType(selected)||'all');setAmount(String(priceFor(selected)));setStep(service==='data'||service==='cable'||service==='education'?1:0);}}catch{if(active)setCatalogueError('Available plans could not be loaded. Please refresh before paying.');}finally{if(active)setProductsLoading(false);}}void loadProducts();return()=>{active=false;};},[service,params,priceFor]);

  const chosen=(service==='data'||service==='cable'||service==='education')
    ? liveProducts.find(p=>p.id===selection)
    : liveProducts.find(p=>p.provider===provider && (service!=='electricity'||p.plan_category===String(params.get('meterType')||'prepaid').toLowerCase())) || liveProducts.find(p=>p.provider===provider);
  let quote:{charge:number;serviceAmount:number;fee:number}|null=null;
  if(chosen){try{quote=quotePurchase(service,tier,{...chosen,smart_earner_price:chosen.retail_price},Number(amount));}catch{/* Do not offer payment until a valid quote exists. */}}
  const total=chargedAmount??quote?.charge??0;

  const canContinue=()=>{if(productsLoading||catalogueError){showToast('error','Plans unavailable','Wait for the plans to load, or refresh and try again.');return false;}if(step===0&&!provider){showToast('error','Select a service','Choose a provider or network before continuing.');return false;}if(step===1&&recipient.trim().length<5){showToast('error','Enter valid details','Enter a valid recipient, meter, IUC or phone number.');return false;}if(step===2){if((service==='data'||service==='cable'||service==='education')&&(!chosen||(service==='data'?dataNetworkKey(chosen.provider)!==dataNetworkKey(provider):chosen.provider!==provider)||(service==='data'&&!matchesPlanCategory(chosen,dataType)))){showToast('error','Select a product',`Choose a ${service==='data'?'plan':service==='cable'?'package':'product'} before continuing.`);return false;}if((service==='airtime'||service==='electricity')&&(!Number.isFinite(Number(amount))||Number(amount)<=0)){showToast('error','Enter an amount','Enter a valid amount before continuing.');return false;}}if(step===4&&!/^\d{4}$/.test(pin)){showToast('error','PIN required','Enter your 4-digit confirmation PIN.');return false;}return true;};

  const handleConfirm = async () => {
    if(!supabase)return;
    const value=Number(amount);
    if(!provider||recipient.trim().length<5||!Number.isFinite(value)||value<=0){showToast('error','Incomplete transaction','Select a provider and enter valid recipient and amount details.');return;}
    if(!/^\d{4}$/.test(pin)){showToast('error','PIN required','Enter your 4-digit confirmation PIN.');return;}
    if(!chosen||(service==='data'&&dataNetworkKey(chosen.provider)!==dataNetworkKey(provider))){showToast('error','Product unavailable','This product is not active in the live IHLink catalogue.');return;}
    if(!quote){showToast('error','Price unavailable','Refresh the catalogue and choose a valid amount.');return;}
    const signature=JSON.stringify({product:chosen.id,recipient:recipient.trim(),amount:value,meterType:params.get('meterType')});
    if(requestKey.current.signature!==signature)requestKey.current={signature,key:crypto.randomUUID()};
    const idempotencyKey=requestKey.current.key;
    setProcessing(true);
    const {data,error}=await supabase.functions.invoke('datasub-purchase',{
      headers:{'Idempotency-Key':idempotencyKey},
      body:{product_id:chosen.id,recipient:recipient.trim(),amount:value,expected_charge:quote.charge,pin,meter_type:params.get('meterType')||undefined,quantity:service==='education'?1:undefined}
    });
    setProcessing(false);
    if(error){setReference(idempotencyKey);setChargedAmount(quote.charge);setRefunded(false);setFailureMessage('We could not confirm the outcome. Check your transaction history before trying again.');setResult('pending');showToast('error','Confirmation unavailable','Check your transaction history before trying again.');return;}
    const transactionReference=String(data?.reference||data?.transaction?.reference||'');
    setReference(transactionReference);
    setChargedAmount(Number(data?.amount??data?.transaction?.amount??quote.charge));
    const status=String(data?.status||data?.transaction?.status||'pending').toLowerCase();
    setFailureMessage(status==='failed'?'This purchase could not be completed. Check your wallet and contact support with the reference if you need help.':'');setRefunded(String(data?.routing_state||data?.transaction?.routing_state||'').toUpperCase()==='REFUNDED'||data?.refunded===true);setResult(status==='successful'||status==='success'?'success':status==='failed'?'failed':'pending');
    await refresh();
  };

  const previewReceipt=async()=>{if(result!=='success'||!supabase)return;const values={reference,transaction_reference:reference,service:'Data',network:provider,provider,plan:chosen?.name||selection,recipient,phone_number:recipient,amount:naira(total),status:'Successful',date:new Date().toLocaleString('en-NG')};const r=await (supabase as any).rpc('render_ihlink_template',{p_platform:'datasub',p_type:'receipt',p_values:values});const html=r.data?.[0]?.rendered_content;if(!html){showToast('error','Receipt unavailable','Your receipt could not be opened. Please try again or contact support.');return;}const w=window.open('','_blank','width=900,height=720');if(!w)return;w.opener=null;w.document.write(`<!doctype html><html><head><title>Receipt ${reference}</title><style>body{font-family:Arial,sans-serif;background:#f8fafc;color:#172033;margin:0;padding:32px}@media print{body{background:#fff;padding:0}.no-print{display:none}}</style></head><body>${html}<div class="no-print" style="text-align:center;margin-top:24px"><button onclick="window.print()" style="padding:12px 20px;border:0;border-radius:10px;background:#047857;color:white;font-weight:700">Print / Save PDF</button></div></body></html>`);w.document.close()};

  if (result !== 'none') {
    return (
      <DashboardLayout product="datasub" sections={sidebarSections} userName={userName} userRole="Customer" pageTitle={config.title} pageBreadcrumb={[{ label: 'Result' }]}>
        <Card padding="lg" className="max-w-lg mx-auto">
          {result === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full bg-emerald-200 animate-pulse-ring" />
                <CheckCircle2 className="w-10 h-10 relative" />
              </div>
              <h2 className="text-2xl font-extrabold text-ink mb-2">Transaction Successful!</h2>
              <p className="text-sm text-muted mb-6">Your {config.title.toLowerCase()} purchase of {naira(total)} was completed successfully.</p>
              <div className="p-4 rounded-xl bg-surface mb-6 text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted">Reference</span><span className="font-mono font-semibold">{reference}</span></div>
                <div className="flex justify-between"><span className="text-muted">Amount</span><span className="font-semibold">{naira(total)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Date</span><span className="font-semibold">{new Date().toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-muted">Status</span><Badge variant="status" status="success" /></div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={()=>void previewReceipt()}>Preview Receipt</Button>
                <Link to="/datasub/transactions"><Button variant="secondary">Transactions</Button></Link>
                <Link to="/datasub/dashboard"><Button themeClass="bg-emerald-500 hover:bg-emerald-600">Back to Dashboard</Button></Link>
              </div>
            </div>
          )}
          {result === 'pending' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mx-auto mb-4">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className="text-2xl font-extrabold text-ink mb-2">Transaction Submitted</h2>
              <p className="text-sm text-muted">We are checking the outcome of your purchase. View your transaction history before making another payment.</p>
              <p className="mt-3 font-mono text-xs font-semibold text-ink">{reference}</p>
              <div className="mt-6 flex justify-center gap-3"><Link to="/datasub/transactions"><Button variant="secondary">View transaction</Button></Link><Link to="/datasub/dashboard"><Button>Dashboard</Button></Link></div>
            </div>
          )}
          {result === 'failed' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-4">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-ink mb-2">Transaction Failed</h2>
              <p className="text-sm text-muted mb-4">This purchase could not be completed. Check your wallet and transaction history for the latest update.</p><div className="mb-6 rounded-xl bg-rose-50 p-4 text-left text-sm"><div className="flex justify-between gap-4"><span className="text-muted">Reference</span><span className="break-all font-mono font-semibold">{reference||"Unavailable"}</span></div><div className="mt-2 flex justify-between gap-4"><span className="text-muted">Network</span><b>{provider||"—"}</b></div><div className="mt-2 flex justify-between gap-4"><span className="text-muted">Plan</span><b>{chosen?.name||"—"}</b></div><div className="mt-2 flex justify-between gap-4"><span className="text-muted">Recipient</span><b>{recipient||"—"}</b></div><div className="mt-2 flex justify-between gap-4"><span className="text-muted">Amount</span><b>{naira(total)}</b></div>{refunded&&<p className="mt-3 rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-700">Wallet debit reversed automatically. The reserved amount has been refunded.</p>}{failureMessage&&<p className="mt-3 border-t border-rose-200 pt-3 text-rose-700">{failureMessage}</p>}</div>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => { setResult('none'); setStep(0); }}>Try Again</Button>
                <Link to="/datasub/support"><Button>Contact Support</Button></Link>
              </div>
            </div>
          )}
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout product="datasub" sections={sidebarSections} userName={userName} userRole="Customer" pageTitle={config.title} pageBreadcrumb={[{ label: 'Purchase' }]}>{catalogueError&&<p role="alert">{catalogueError}</p>}
      <div className="max-w-2xl mx-auto">
        <Card padding="lg">
          <div className="mb-8">
            <Stepper steps={config.steps} current={step} themeClass="bg-emerald-500 border-emerald-500 text-white" />
          </div>

          {/* Step content */}
          <div className="min-h-[200px]">
            {step === 0 && (
              <div>
                <h3 className="text-lg font-bold text-ink mb-4">Select {service === 'airtime' || service === 'data' ? 'Network' : service === 'electricity' ? 'Provider' : service === 'cable' ? 'Provider' : 'Exam'}</h3>
                {productsLoading?<p role="status" className="mb-4 text-sm text-muted">Loading available plans…</p>:!catalogueError&&!liveProducts.length&&<div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">This service is temporarily unavailable. Please try again shortly or choose another service.</div>}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {providers.map((name, i) => (
                    
                    <button type="button" aria-pressed={service==='data'?dataNetworkKey(provider)===dataNetworkKey(name):provider===name} onClick={()=>changeProvider(name)} key={name} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${(service==='data'?dataNetworkKey(provider)===dataNetworkKey(name):provider===name)?'border-emerald-500 bg-emerald-50':'border-border hover:border-emerald-400'}`}>
                      <ServiceLogo name={name} />
                      <span className="text-sm font-semibold text-ink">{name}</span>
                    </button>
                  ))}
                </div>
                {typeFilters}
              </div>
            )}
            {step === 1 && (
              <div>
                <h3 className="text-lg font-bold text-ink mb-4">Enter Details</h3>
                <div className="space-y-4">
                  <Input value={recipient} onChange={e=>setRecipient(e.target.value)} label={service === 'electricity' ? 'Meter Number' : service === 'cable' ? 'IUC / Smart Card Number' : 'Phone Number'} placeholder={service === 'electricity' ? '04512345678' : service === 'cable' ? '7012345678' : '0803 123 4567'} themeClass="focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <Input label="Email (optional)" placeholder="you@example.com" type="email" themeClass="focus:ring-emerald-500/20 focus:border-emerald-500" />
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <h3 className="text-lg font-bold text-ink mb-4">{service === 'data' ? 'Select Plan' : service === 'cable' ? 'Select Package' : 'Enter Amount'}</h3>
                {typeFilters}
                {service === 'data' || service === 'cable' || service === 'education' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {visibleProducts.map((p) => (
                      <button type="button" aria-pressed={selection===p.id} onClick={()=>{setSelection(p.id);setAmount(String(priceFor(p)));setPin('');setChargedAmount(null);}} key={p.id} className={`p-4 rounded-xl border-2 text-left ${selection===p.id?'border-emerald-500 bg-emerald-50':'border-border hover:border-emerald-400'}`}>
                        <p className="text-base font-bold text-ink">{p.name}</p>
                        <p className="text-xs text-muted">{service==='data'?dataPlanTypeLabel(dataPlanType(p)):p.description||p.provider}{p.validity_label?` · ${p.validity_label}`:''}</p>
                        <p className="text-sm font-bold text-emerald-600 mt-1">{naira(priceFor(p))}</p>
                      </button>
                    ))}
                    {!visibleProducts.length&&<p className="sm:col-span-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">No available plan matches this network and data type. Choose another data type or try again later.</p>}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[100, 200, 500, 1000, 2000, 5000, 10000, 20000].map(a => <button onClick={()=>setAmount(String(a))} key={a} className="px-3 py-2 text-sm font-semibold border border-border rounded-lg hover:border-emerald-400 hover:bg-emerald-50">{naira(a)}</button>)}
                    </div>
                    <Input value={amount} onChange={e=>setAmount(e.target.value)} label="Custom Amount" type="number" placeholder="Enter amount" themeClass="focus:ring-emerald-500/20 focus:border-emerald-500" />
                  </div>
                )}
              </div>
            )}
            {step === 3 && (
              <div>
                <h3 className="text-lg font-bold text-ink mb-4">Payment Method</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Wallet Balance', desc: `Available: ${naira(wallet.balance)}`, recommended: true },
                  ].map((m, i) => (
                    <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${i === 0 ? 'border-emerald-400 bg-emerald-50' : 'border-border hover:border-emerald-300'}`}>
                      <input type="radio" name="payment" defaultChecked={i === 0} className="w-4 h-4 text-emerald-500" />
                      <div className="flex-1"><p className="text-sm font-bold text-ink">{m.label}</p><p className="text-xs text-muted">{m.desc}</p></div>
                      {m.recommended && <Badge className="bg-emerald-100 text-emerald-700">Recommended</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step === 4 && (
              <div>
                <h3 className="text-lg font-bold text-ink mb-4">Enter Transaction PIN</h3>
                <p className="text-sm text-muted mb-4">Enter your 4-digit transaction PIN to authorize this payment.</p>{hasTransactionPin===false&&<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">You have not set a transaction PIN yet. <Link to="/datasub/wallet" className="font-bold underline">Set it securely in Wallet</Link> before confirming a purchase.</div>}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <input value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} type="password" inputMode="numeric" maxLength={4} className="w-48 h-14 text-center tracking-[1em] text-2xl font-bold rounded-xl border-2 border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted"><Lock className="w-3.5 h-3.5" /> Your PIN is used only to authorize this transaction. Do not share it with anyone.</div>
              </div>
            )}
            {step === 5 && (
              <div>
                <h3 className="text-lg font-bold text-ink mb-4">Confirm Transaction</h3>
                <div className="p-4 rounded-xl bg-surface space-y-3 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-muted">Service</span><span className="font-semibold">{config.title}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Provider</span><span className="font-semibold">{provider||'Not selected'}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Recipient</span><span className="font-semibold">{recipient||'Not entered'}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Service value</span><span className="font-semibold">{naira(quote?.serviceAmount??(Number(amount)||0))}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Service fee</span><span className="font-semibold">{naira(quote?.fee??0)}</span></div><div className="flex justify-between"><span className="text-muted">Payment</span><span className="font-semibold">Wallet</span></div>
                  <div className="flex justify-between border-t border-border pt-2"><span className="font-bold">Total</span><span className="font-bold text-emerald-600">{naira(total)}</span></div>
                </div>
                <AlertBox amount={total} />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />} disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
            {step < 5 ? (
              <Button themeClass="bg-emerald-500 hover:bg-emerald-600" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={() => {if(canContinue())setStep(step + 1);}}>Continue</Button>
            ) : (
              <Button disabled={processing||productsLoading||!quote} themeClass="bg-emerald-500 hover:bg-emerald-600" leftIcon={<Check className="w-4 h-4" />} onClick={()=>void handleConfirm()}>{processing?'Processing…':'Confirm & Pay'}</Button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function AlertBox({amount}:{amount:number}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
      <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700">Submitting this purchase requests a wallet transaction of {naira(amount)}. Confirm the final wallet and provider status in your transaction history.</p>
    </div>
  );
}
