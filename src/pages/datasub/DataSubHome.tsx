import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Stepper';
import { naira } from '@/lib/designTokens';
import { networks, electricityProviders } from '@/lib/datasubServices';
import { supabase } from '@/lib/supabase';
import { loadLiveCatalogue } from '@/lib/datasubCatalogue';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { ServiceLogo } from '@/components/ServiceLogo';
import { ExperiencePhoto } from '@/components/ExperiencePhoto';
import { IH_LINK_LOGO } from '@/assets/ihlinkLogo';
import {
  Smartphone, Wifi, Zap, Tv, GraduationCap, Shield,
  Users, Code, Check, ArrowRightLeft, Printer,
} from 'lucide-react';

const faqItems = [
  { question: 'How do I fund my wallet?', answer: 'Open your wallet to activate a supported BillStack dedicated bank account. Your IHLink wallet is credited only after BillStack verifies the transfer.' },
  { question: 'How long do transactions take?', answer: 'Transaction completion time depends on the connected service provider. Your transaction history shows the current status of each submitted purchase.' },
  { question: 'What are the reseller benefits?', answer: 'Resellers can access tier-based pricing, a reseller dashboard, commission records and eligible API-access upgrades. Available rates and features depend on the configured reseller tier.' },
  { question: 'Is my money safe?', answer: 'IHLink uses authenticated accounts, database access controls and secure transport. Wallet funding is credited only after verified BillStack payment confirmation, and DataSub purchases are protected by your transaction PIN.' },
  { question: 'Which networks are supported?', answer: 'We support MTN, Airtel, Glo, and T2 for airtime and data. We also support major electricity providers and cable TV providers.' },
];

export function DataSubHome() {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number|null>(null);
  const [walletScope,setWalletScope]=useState<string|null>(null);
  const [walletLoading,setWalletLoading]=useState(false);
  const [walletError,setWalletError]=useState('');
  const [dataPlans, setDataPlans] = useState<Array<{code:string;provider:string;name:string;validity_label:string|null;retail_price:number;plan_category?:string|null}>>([]);
  useEffect(() => {
    let active=true;
    setWalletBalance(null);setWalletScope(null);setWalletError('');setWalletLoading(Boolean(user));
    if(!supabase){setWalletScope(user?.id||null);setWalletLoading(false);setWalletError('Wallet is unavailable.');return;}
    const db=supabase;
    void (async()=>{
      const products=await loadLiveCatalogue('data');
      if(!active)return;
      setDataPlans(products.map(x=>({code:x.code,provider:x.provider,name:x.name,validity_label:x.validity_label,retail_price:Number(x.retail_price),plan_category:x.plan_category})));
    })();
    if(user)void (async()=>{
      const w=await db.from('datasub_wallets').select('balance').eq('user_id',user.id).maybeSingle();
      if(!active)return;
      setWalletScope(user.id);setWalletLoading(false);
      if(w.error||!w.data||!Number.isFinite(Number(w.data.balance))){setWalletError('Wallet balance could not be loaded. Open your wallet to retry.');return;}
      setWalletBalance(Number(w.data.balance));
    })();
    return()=>{active=false;};
  },[user?.id]);
  const networkOrder=['MTN','Airtel','Glo','T2'];
  const groupedDataPlans=useMemo(()=>networkOrder.map(network=>({network,plans:dataPlans.filter(plan=>plan.provider.toLowerCase()===network.toLowerCase()||(network==='T2'&&['9mobile','t2'].includes(plan.provider.toLowerCase())))})).filter(group=>group.plans.length>0),[dataPlans]);
  return (
    <PageShell product="datasub">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-sky-500 text-white">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px]" />
        <div className="relative px-6 lg:px-10 pt-16 pb-20 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-7">
              <Badge className="bg-white/10 text-white border-white/20 mb-4">VTU & Digital Services</Badge>
              <h1 className="text-5xl font-extrabold mb-4 leading-tight">Airtime, Data, Bills & More — All in One Place</h1>
              <p className="text-lg text-emerald-50 mb-6 max-w-xl">Instant airtime top-up, data bundles, electricity bills, cable TV subscriptions and educational PINs. Built for convenient digital-service access in Nigeria.</p>
              <div className="flex flex-wrap gap-4">
                <Link to={'/datasub/dashboard'}><Button size="xl" variant="secondary" className="!bg-white !text-emerald-700 hover:!bg-emerald-50 border-white">Get Started</Button></Link>
                <Link to="/datasub/pricing"><Button size="xl" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">View Pricing</Button></Link>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5">
              {/* Quick purchase widget */}
              <Card padding="lg" className="bg-white/95 backdrop-blur"><div className="mb-4 flex items-center gap-2 border-b border-emerald-100 pb-3"><img src={IH_LINK_LOGO} alt="IHLink" className="h-9 w-9 rounded-lg object-contain"/><div><b className="block text-sm text-ink">IHLink DataSub</b><span className="text-xs text-muted">Smart digital services</span></div></div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted">Wallet Balance</p>
                    <p className="text-2xl font-extrabold text-ink">{!user?'Sign in to view your wallet':walletLoading||walletScope!==user.id?'Loading wallet…':walletBalance===null?'Balance unavailable':naira(walletBalance)}</p>
                  </div>
                  <Link to={user?'/datasub/wallet':'/signin?next=%2Fdatasub%2Fwallet'}><Button size="sm" themeClass="bg-emerald-500 hover:bg-emerald-600">{user?'Open wallet':'Sign in'}</Button></Link>
                </div>
                {user&&walletScope===user.id&&walletError&&<p role="alert" className="mb-4 text-sm text-red-700">{walletError}</p>}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: Smartphone, label: 'Airtime', href: '/datasub/buy-airtime' },
                    { icon: Wifi, label: 'Data', href: '/datasub/buy-data' },
                    { icon: Zap, label: 'Electric', href: '/datasub/pay-electricity' },
                    { icon: Tv, label: 'Cable', href: '/datasub/pay-cable' },
                  ].map((q, i) => (
                    <Link key={i} to={q.href} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-emerald-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <q.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-ink">{q.label}</span>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <ExperiencePhoto src="/images/service-scene-clean.webp" alt="IHLink DataSub branded digital services concept" illustration eyebrow="Made for everyday transactions" title="Airtime, data and bills from the device already in your hand" text="From a first airtime purchase to running a reseller business, clear screens and helpful support keep every transaction comfortable." accentClass="text-emerald-700" />

      {/* Supported Networks */}
      <section className="py-10 bg-white border-b border-border">
        <div className="px-6 lg:px-10 max-w-[1280px] mx-auto">
          <p className="text-center text-xs font-bold text-muted uppercase tracking-wide mb-4">Supported Networks</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {networks.map(network => network.name).map(name => (
              <div key={name} className="flex items-center gap-2">
                <ServiceLogo name={name} size="sm" />
                <span className="text-sm font-bold text-ink">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="px-6 lg:px-10 max-w-[1280px] mx-auto"><div className="max-w-3xl"><Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">All Data Services</Badge><h2 className="text-3xl font-extrabold text-ink">Every network and data type in one catalogue</h2><p className="mt-2 text-sm leading-6 text-muted">Compare the live MTN, Airtel, Glo and T2 catalogue in one place. SME, Gifting and Corporate Gifting remain clearly identified from the configured product data.</p></div><div className="mt-8 overflow-x-auto rounded-2xl border border-border shadow-sm"><table className="w-full min-w-[860px] text-left"><thead className="sticky top-0 z-20 bg-emerald-50 text-xs uppercase tracking-wide text-emerald-900 shadow-sm"><tr>{['Network','Data type','Plan','Validity','Smart Earner price','Action'].map(h=><th key={h} className="p-4">{h}</th>)}</tr></thead><tbody>{groupedDataPlans.flatMap(group=>group.plans.map((plan,index)=><tr key={plan.code} className="border-t align-middle hover:bg-emerald-50/40"><td className="p-4">{index===0?<div className="flex items-center gap-3"><ServiceLogo name={group.network} size="sm"/><span className="font-extrabold">{group.network}</span></div>:<span className="sr-only">{group.network}</span>}</td><td className="p-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{plan.plan_category||'Data'}</span></td><td className="p-4 font-semibold">{plan.name}</td><td className="p-4 text-sm text-muted">{plan.validity_label||'See plan details'}</td><td className="p-4 font-extrabold text-emerald-700">{naira(plan.retail_price)}</td><td className="p-4"><Link to="/datasub/buy-data" className="font-bold text-emerald-700">Buy data →</Link></td></tr>))}{!dataPlans.length&&<tr><td colSpan={6} className="p-8 text-center text-sm text-muted">No active data plans are currently available.</td></tr>}</tbody></table></div><p className="mt-3 text-xs text-muted">Catalogue rows are loaded from the live customer catalogue; plans without a currently available provider route are not advertised.</p></div>
      </section>

      {/* Data Plan Cards */}
      <section className="py-16 bg-surface">
        <div className="px-6 lg:px-10 max-w-[1280px] mx-auto">
          <div className="text-center mb-8">
            <Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">Popular Plans</Badge>
            <h2 className="text-3xl font-extrabold text-ink mb-2">Data Plans for Every Need</h2>
            <p className="text-sm text-muted">Choose from a wide range of data plans across all networks</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataPlans.map((plan) => (
              <Card key={plan.code} hover padding="lg" className="relative">
                <ServiceLogo name={plan.provider} size="sm" className="mb-3" />
                <p className="text-lg font-extrabold text-ink">{plan.name}</p>
                <p className="text-sm text-muted">{plan.provider}</p>
                <p className="text-xs text-muted mt-1">{plan.validity_label || 'See plan details'}</p>
                <p className="text-xl font-bold text-emerald-600 mt-3">{naira(plan.retail_price)}</p>
                <Link to="/datasub/buy-data"><Button size="sm" fullWidth className="mt-3" themeClass="bg-emerald-500 hover:bg-emerald-600">Buy Now</Button></Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6 lg:px-10 max-w-[1280px] mx-auto"><div className="grid gap-4 md:grid-cols-2"><Card hover padding="lg"><ArrowRightLeft className="w-8 h-8 text-emerald-600"/><h3 className="mt-3 text-lg font-bold">Airtime to Cash — Request Only</h3><p className="mt-1 mb-4 text-sm text-muted">Prepare airtime conversion requests with provider-defined rates and settlement once the conversion integration is enabled.</p><Link to="/datasub/airtime-to-cash"><Button variant="secondary">Submit Conversion Request</Button></Link></Card><Card hover padding="lg"><Printer className="w-8 h-8 text-sky-600"/><h3 className="mt-3 text-lg font-bold">Print Data & Airtime Cards — Request Only</h3><p className="mt-1 mb-4 text-sm text-muted">Prepare reseller voucher batches and printable card layouts. Provider-authorized PIN generation will activate with integration.</p><Link to="/datasub/print-cards"><Button variant="secondary">Submit Voucher Batch Request</Button></Link></Card></div></section>

      {/* Bill Services */}
      <section className="py-16 px-6 lg:px-10 max-w-[1280px] mx-auto">
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">Bill Payments</Badge>
          <h2 className="text-3xl font-extrabold text-ink mb-2">Pay All Your Bills in One Place</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card hover padding="lg">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4"><Zap className="w-6 h-6" /></div>
            <h3 className="text-lg font-bold text-ink mb-1">Electricity</h3>
            <p className="text-sm text-muted mb-3">Prepaid and postpaid electricity bill payments for all major DISCOs.</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {electricityProviders.map(({name}) => <ServiceLogo key={name} name={name} size="sm" />)}
            </div>
            <Link to="/datasub/pay-electricity"><Button size="sm" variant="secondary" fullWidth>Pay Now</Button></Link>
          </Card>
          <Card hover padding="lg">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><Tv className="w-6 h-6" /></div>
            <h3 className="text-lg font-bold text-ink mb-1">Cable TV</h3>
            <p className="text-sm text-muted mb-3">Instant subscription for DStv, GOtv, and StarTimes.</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['DStv','GOtv','StarTimes'].map(name => <ServiceLogo key={name} name={name} size="sm" />)}
            </div>
            <Link to="/datasub/pay-cable"><Button size="sm" variant="secondary" fullWidth>Subscribe</Button></Link>
          </Card>
          <Card hover padding="lg">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4"><GraduationCap className="w-6 h-6" /></div>
            <h3 className="text-lg font-bold text-ink mb-1">Education PINs</h3>
            <p className="text-sm text-muted mb-3">Access the education catalogue for WAEC, NECO, JAMB and NABTEB services as provider products are connected.</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['WAEC','NECO','JAMB','NABTEB'].map(x=><ServiceLogo key={x} name={x} size="sm" />)}
            </div>
            <Link to="/datasub/buy-education"><Button size="sm" variant="secondary" fullWidth>Buy PIN</Button></Link>
          </Card>
        </div>
      </section>

      {/* Reseller & API Benefits */}
      <section className="py-16 bg-surface">
        <div className="px-6 lg:px-10 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card padding="lg" className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4"><Users className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-ink mb-2">Become a Reseller</h3>
              <p className="text-sm text-muted mb-4">Build your VTU business with tier-based reseller pricing, commission records and a dedicated reseller dashboard.</p>
              <ul className="space-y-2 mb-4">
                {['Tier-based reseller pricing', 'Commission ledger', 'Upgrade workflow', 'Dedicated reseller dashboard'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink"><Check className="w-4 h-4 text-emerald-500" /> {f}</li>
                ))}
              </ul>
              <Link to="/datasub/reseller"><Button themeClass="bg-emerald-500 hover:bg-emerald-600">Learn More</Button></Link>
            </Card>
            <Card padding="lg" className="bg-gradient-to-br from-sky-50 to-white border-sky-100">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4"><Code className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-ink mb-2">Developer API</h3>
              <p className="text-sm text-muted mb-4">Prepare to integrate VTU services into your own platform through the DataSub API interface as production access is enabled.</p>
              <ul className="space-y-2 mb-4">
                {['API authentication workflow', 'Product catalogue interface', 'Purchase request interface', 'Usage and credential dashboard'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink"><Check className="w-4 h-4 text-sky-500" /> {f}</li>
                ))}
              </ul>
              <Link to="/datasub/api"><Button className="bg-sky-500 hover:bg-sky-600">View API Docs</Button></Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 px-6 lg:px-10 max-w-[1280px] mx-auto">
        <Card padding="lg" className="bg-navy-800 text-white border-navy-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4"><Shield className="w-6 h-6" /></div>
              <h2 className="text-2xl font-bold mb-3">Your Transactions Are Secure</h2>
              <p className="text-sm text-navy-100 mb-4">IHLink uses authenticated access, database policies and secure web transport. Provider and payment-specific controls are added as those production integrations are enabled.</p>
              <div className="grid grid-cols-2 gap-3">
                {['Secure HTTPS Transport', 'Authenticated Account Access', 'Database Access Policies', 'Transaction Status Tracking'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-emerald-400" /> {f}</div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-xl bg-white/5"><p className="text-lg font-bold text-emerald-400">Production metrics appear here when real transaction history is available.</p><p className="text-xs text-navy-100 mt-1">IHLink does not display fabricated transaction, user or uptime figures.</p></div>
            </div>
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 lg:px-10 max-w-[800px] mx-auto">
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">FAQ</Badge>
          <h2 className="text-3xl font-extrabold text-ink">Frequently Asked Questions</h2>
        </div>
        <Accordion items={faqItems} defaultOpen={0} />
      </section>
    </PageShell>
  );
}


