import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { naira } from '@/lib/designTokens';
import { Users, TrendingUp, DollarSign, Gift, ArrowRight, ReceiptText, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ResellerLevel={code:string;name:string;minimum_monthly_sales:number;discount_percent:number;api_access:boolean};
const fallbackLevels:ResellerLevel[]=[{code:'bronze',name:'Bronze',minimum_monthly_sales:0,discount_percent:1.5,api_access:false},{code:'silver',name:'Silver',minimum_monthly_sales:250000,discount_percent:2.5,api_access:false},{code:'gold',name:'Gold',minimum_monthly_sales:1000000,discount_percent:3.5,api_access:true},{code:'enterprise',name:'Enterprise',minimum_monthly_sales:5000000,discount_percent:5,api_access:true}];

export function DataSubReseller() {
  const [resellerLevels,setResellerLevels]=useState<ResellerLevel[]>(fallbackLevels);
  useEffect(()=>{async function load(){if(!supabase)return;const {data}=await supabase.from('datasub_reseller_tiers').select('code,name,minimum_monthly_sales,discount_percent,api_access').eq('is_active',true).order('sort_order');const levels=(data||[]).map(row=>({...row,minimum_monthly_sales:Number(row.minimum_monthly_sales),discount_percent:Number(row.discount_percent)}));setResellerLevels(levels.length?levels:fallbackLevels);}void load();},[]);
  return (
    <PageShell product="datasub">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 to-sky-500 text-white py-16">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="relative px-6 lg:px-10 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-7">
              <Badge className="bg-white/10 text-white border-white/20 mb-4">Reseller Program</Badge>
              <h1 className="text-4xl font-extrabold mb-4">Start Your Own VTU Business</h1>
              <p className="text-lg text-emerald-50 mb-6 max-w-xl">Upgrade from standard DataSub access to reseller capabilities, reseller pricing and a dedicated dashboard.</p>
              <Link to="/datasub/reseller-dashboard"><Button size="xl" className="bg-white text-emerald-600 hover:bg-gray-100">Become a Reseller</Button></Link>
            </div>
            <div className="col-span-12 lg:col-span-5"><Card className="bg-white/10 border-white/20 text-white"><h2 className="text-xl font-bold">Reseller access</h2><p className="mt-2 text-sm text-emerald-50">Available tiers and pricing are managed from the live DataSub administration catalogue.</p></Card></div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-10 max-w-[1280px] mx-auto">
        <h2 className="text-2xl font-extrabold text-ink mb-6 text-center">Reseller Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: DollarSign, title: 'Discounted Rates', desc: 'Tiered reseller discounts are designed to increase with qualifying sales volume; live rates are controlled by DataSub Operations.' },
            { icon: ReceiptText, title: 'Commission Ledger', desc: 'Review recorded reseller earnings from successful eligible sales in your reseller dashboard.' },
            { icon: BarChart3, title: 'Sales Overview', desc: 'Review recorded sales, profit, reseller pricing and recent commission activity from one dashboard.' },
            { icon: Gift, title: 'Upgrade Options', desc: 'Request available reseller or API-access upgrades as your business requirements grow.' },
            { icon: Users, title: 'Saved Beneficiaries', desc: 'Use the DataSub customer tools to keep frequently used recipients available for repeat purchases.' },
            { icon: TrendingUp, title: 'Growth Path', desc: 'Progress through the configured reseller tiers as your qualifying sales volume increases.' },
          ].map((b, i) => (
            <Card key={i} padding="lg" hover>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4"><b.icon className="w-5 h-5" /></div>
              <h3 className="text-base font-bold text-ink mb-1">{b.title}</h3>
              <p className="text-sm text-muted">{b.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="px-6 lg:px-10 max-w-[1280px] mx-auto">
          <h2 className="text-2xl font-extrabold text-ink mb-6 text-center">Reseller Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {resellerLevels.map((l, i) => (
              <Card key={i} padding="lg" className="relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-emerald-50 text-emerald-700"><span className="text-lg font-extrabold">{i + 1}</span></div>
                <h3 className="text-lg font-bold text-ink">{l.name}</h3>
                <p className="text-2xl font-extrabold text-emerald-600 mt-2">{l.discount_percent}%</p>
                <p className="text-xs text-muted">Discount Rate</p>
                <div className="mt-3 pt-3 border-t border-border"><p className="text-xs text-muted">Min Monthly Sales</p><p className="text-sm font-bold text-ink">{naira(l.minimum_monthly_sales)}</p><p className="mt-2 text-xs font-semibold text-sky-700">{l.api_access?'API access included':'Reseller access'}</p></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-10 max-w-[1280px] mx-auto">
        <Card padding="lg" className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <h2 className="text-2xl font-bold text-ink mb-2">Ready to Start Earning?</h2>
              <p className="text-sm text-muted">Join the IHLink DataSub reseller program today and build your VTU business.</p>
            </div>
            <Link to="/datasub/reseller-dashboard"><Button size="lg" themeClass="bg-emerald-500 hover:bg-emerald-600" rightIcon={<ArrowRight className="w-5 h-5" />}>Open Reseller Access</Button></Link>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
