import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Stepper';
import { ServiceLogo } from '@/components/ServiceLogo';
import { IH_LINK_LOGO } from '@/assets/ihlinkLogo';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { naira } from '@/lib/designTokens';
import { networks } from '@/lib/datasubServices';
import { Wifi, Smartphone, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

const featuredServices = [
  { name: 'Mobile data', description: 'Choose your network, data type and available plan.', href: '/datasub/buy-data', action: 'Buy data', icon: Wifi },
  { name: 'Airtime', description: 'Top up your phone from your DataSub wallet.', href: '/datasub/buy-airtime', action: 'Buy airtime', icon: Smartphone },
  { name: 'Electricity', description: 'Find your provider and pay a supported meter.', href: '/datasub/pay-electricity', action: 'Pay electricity', icon: Zap },
];
const faqItems = [
  { question: 'How do I find the right data plan?', answer: 'Choose Buy data, select your network, then choose SME, Corporate Gifting, Gifting or another available data type. Only matching live plans are shown.' },
  { question: 'How do I fund my wallet?', answer: 'Open your wallet to use a supported BillStack dedicated bank account. Your wallet is credited only after the transfer is verified.' },
  { question: 'Where can I find other services?', answer: 'Open Explore services to browse the full DataSub service list. Your dashboard and transaction history remain available from your account.' },
];

export function DataSubHome() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<{userId:string;balance:number|null;error:string}|null>(null);
  const [hero, setHero] = useState<{title?:string;subtitle?:string}|null>(null);
  useEffect(() => {
    let active = true;
    if (supabase) void supabase.from('site_content_blocks').select('title,subtitle').eq('page_key','datasub').eq('page_path','/').eq('section_key','hero').eq('is_visible',true).maybeSingle().then(({data})=>{if(active)setHero(data);});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    setWallet(null);
    if (user && supabase) {
      const userId=user.id;
      void supabase.from('datasub_wallets').select('balance').eq('user_id',userId).maybeSingle().then(({data,error})=>{
        if (!active) return;
        const balance=Number(data?.balance);
        setWallet({userId,balance:!error&&data&&Number.isFinite(balance)?balance:null,error:error||!data?'Open your wallet to retry.':''});
      });
    }
    return () => { active = false; };
  }, [user?.id]);
  const balanceText=!user?'Sign in to view your wallet':wallet?.userId!==user.id?'Loading wallet…':wallet.balance===null?'Balance unavailable':naira(wallet.balance);
  return <PageShell product="datasub">
    <section className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-sky-600 text-white">
      <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-10">
        <div>
          <p className="mb-3 text-sm font-bold text-emerald-100">IHLink DataSub</p>
          <h1 className="max-w-xl text-3xl font-extrabold leading-tight sm:text-5xl">{hero?.title||'Data, airtime and electricity, made simple.'}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-emerald-50">{hero?.subtitle||'Start with the everyday services you use most. Choose a plan, confirm its price and follow each transaction in your account.'}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/datasub/buy-data"><Button size="xl" variant="secondary" className="!bg-white !text-emerald-800">Buy data</Button></Link>
            <Link to="/datasub/services"><Button size="xl" variant="secondary" className="border-white/30 bg-white/10 text-white">Explore services</Button></Link>
          </div>
        </div>
        <Card padding="lg" className="min-w-0 bg-white text-ink">
          <div className="mb-5 flex items-center gap-3"><img src={IH_LINK_LOGO} alt="IHLink" className="h-10 w-10 object-contain"/><div><b className="block">Your DataSub account</b><span className="text-xs text-muted">Wallet, purchases and transaction history</span></div></div>
          <p className="text-xs text-muted">Wallet balance</p>
          <p className="mt-1 break-words text-xl font-extrabold sm:text-2xl">{balanceText}</p>
          {user&&wallet?.userId===user.id&&wallet.error?<p role="alert" className="mt-2 text-sm text-red-700">{wallet.error}</p>:null}
          <Link to={user?'/datasub/wallet':'/signin?next=%2Fdatasub%2Fwallet'}><Button fullWidth className="mt-4" themeClass="bg-emerald-600 hover:bg-emerald-700">{user?'Open wallet':'Sign in'}</Button></Link>
          {!user?<p className="mt-4 text-center text-sm text-muted">New here? <Link to="/register" className="font-bold text-emerald-700">Create your account</Link></p>:null}
        </Card>
      </div>
    </section>
    <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-10">
      <h2 className="text-2xl font-extrabold text-ink">Start with an everyday service</h2>
      <p className="mt-2 text-sm text-muted">A few favourites here. The full service list is one tap away.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">{featuredServices.map(service=><Card key={service.href} padding="lg" className="flex flex-col">
        <service.icon className="mb-4 h-8 w-8 text-emerald-600" aria-hidden="true"/>
        <h3 className="text-xl font-bold text-ink">{service.name}</h3>
        <p className="mb-5 mt-2 flex-1 text-sm leading-6 text-muted">{service.description}</p>
        <Link to={service.href} className="inline-flex min-h-11 items-center gap-2 font-bold text-emerald-700">{service.action}<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link>
      </Card>)}</div>
      <Link to="/datasub/services" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-emerald-700">Explore all services<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-5 rounded-2xl border border-border bg-white p-5">{networks.map(network=><div key={network.code} className="flex items-center gap-2"><ServiceLogo name={network.name} size="sm"/><span className="text-sm font-semibold">{network.name}</span></div>)}</div>
    </section>
    <section className="border-y border-border bg-white"><div className="mx-auto flex max-w-[1280px] items-start gap-3 px-4 py-8 sm:px-6 lg:px-10"><ShieldCheck className="h-7 w-7 shrink-0 text-emerald-600" aria-hidden="true"/><div><h2 className="font-bold text-ink">Confirm the details before you pay</h2><p className="mt-1 text-sm leading-6 text-muted">Review your recipient, selected plan and total. Completed purchases and verified wallet funding appear in your transaction history.</p></div></div></section>
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><h2 className="mb-6 text-2xl font-extrabold text-ink">Helpful answers</h2><Accordion items={faqItems}/></section>
  </PageShell>;
}
