import { Link } from 'react-router-dom';
import { DashboardLayout, type SidebarSection } from '@/components/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard, BarChart, DonutChart, AnimatedCounter } from '@/components/ui/Charts';
import { useToast } from '@/components/ui/Toast';
import { naira } from '@/lib/designTokens';
import { useDataSubData } from '@/hooks/useDataSubData';
import { ServiceLogo } from '@/components/ServiceLogo';
import {
  Wallet, Smartphone, Wifi, Zap, Tv, GraduationCap, ArrowRight, Plus,
  TrendingUp, Users, Gift, LifeBuoy, ArrowRightLeft, Printer,
} from 'lucide-react';

const sidebarSections: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/datasub/dashboard', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Wallet', href: '/datasub/wallet', icon: <Wallet className="w-4 h-4" /> },
      { label: 'Transactions', href: '/datasub/transactions', icon: <Smartphone className="w-4 h-4" /> },
      { label: 'All Services', href: '/datasub/services', icon: <Gift className="w-4 h-4" /> },
      { label: 'Customer Tools', href: '/datasub/customer-tools', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Services',
    items: [
      { label: 'Buy Airtime', href: '/datasub/buy-airtime', icon: <Smartphone className="w-4 h-4" /> },
      { label: 'Buy Data', href: '/datasub/buy-data', icon: <Wifi className="w-4 h-4" /> },
      { label: 'Pay Electricity', href: '/datasub/pay-electricity', icon: <Zap className="w-4 h-4" /> },
      { label: 'Pay Cable', href: '/datasub/pay-cable', icon: <Tv className="w-4 h-4" /> },
      { label: 'Education PIN', href: '/datasub/buy-education', icon: <GraduationCap className="w-4 h-4" /> },
      { label: 'Airtime to Cash', href: '/datasub/airtime-to-cash', icon: <ArrowRightLeft className="w-4 h-4" /> },
      { label: 'Print Cards', href: '/datasub/print-cards', icon: <Printer className="w-4 h-4" /> },
      { label: 'Smile, Kirani, Bulk SMS & More', href: '/datasub/services', icon: <Gift className="w-4 h-4" /> },
    ],
  },
];

export function DataSubDashboard() {
  const { showToast } = useToast();
  const { wallet, transactions, beneficiaries, loading, error, userName } = useDataSubData();
  const successful = transactions.filter(t => t.status === 'success');
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthSpent = successful.filter(t => new Date(t.date) >= monthStart).reduce((sum, t) => sum + t.amount, 0);
  const spendingData = Array.from({ length: 7 }, (_, index) => { const day = new Date(); day.setDate(day.getDate() - (6 - index)); const value = successful.filter(t => new Date(t.date).toDateString() === day.toDateString()).reduce((sum, t) => sum + t.amount, 0); return { label: day.toLocaleDateString('en-NG', { weekday: 'short' }), value }; });
  const categoryColors: Record<string,string> = { Airtime:'#10B981', Data:'#22C55E', Electricity:'#0EA5E9', 'Cable TV':'#6366F1', Education:'#F59E0B' };
  const spendingByCategory = Object.entries(successful.reduce<Record<string,number>>((totals, t) => ({ ...totals, [t.type]: (totals[t.type] || 0) + t.amount }), {})).map(([label,value]) => ({ label, value, color: categoryColors[label] || '#64748B' }));
  return (
    <DashboardLayout
      product="datasub"
      sections={sidebarSections}
      userName={userName}
      userRole="Smart Earner"
      pageTitle="Dashboard"
      pageBreadcrumb={[{ label: 'Overview' }]}
      rightActions={<Button size="sm" themeClass="bg-emerald-500 hover:bg-emerald-600" leftIcon={<Plus className="w-4 h-4" />} onClick={() => showToast('info', 'Wallet funding', 'A secure payment provider will be connected in the next payment phase.')}>Fund Wallet</Button>}
    >
      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {/* Wallet Balance Hero */}
      <Card padding="lg" className="mb-6 bg-gradient-to-br from-emerald-600 to-sky-500 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-50">Wallet Balance</p>
            <p className="text-4xl font-extrabold mt-1"><AnimatedCounter value={wallet.balance} prefix="₦" /></p>
            <p className="text-xs text-emerald-100 mt-2">Referral Balance: {naira(wallet.referralBalance)}</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-white text-emerald-600 hover:bg-gray-100" leftIcon={<Plus className="w-4 h-4" />} onClick={() => showToast('info', 'Wallet funding', 'A secure payment provider will be connected in the next payment phase.')}>Fund Wallet</Button>
            <Link to="/datasub/pricing"><Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20" leftIcon={<Gift className="w-4 h-4" />}>Reseller / API</Button></Link>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { icon: Smartphone, label: 'Airtime', href: '/datasub/buy-airtime', color: 'bg-emerald-50 text-emerald-600' },
          { icon: Wifi, label: 'Data', href: '/datasub/buy-data', color: 'bg-sky-50 text-sky-600' },
          { icon: Zap, label: 'Electricity', href: '/datasub/pay-electricity', color: 'bg-amber-50 text-amber-600' },
          { icon: Tv, label: 'Cable TV', href: '/datasub/pay-cable', color: 'bg-indigo-50 text-indigo-600' },
          { icon: GraduationCap, label: 'Education', href: '/datasub/buy-education', color: 'bg-purple-50 text-purple-600' },
        ].map((q, i) => (
          <Link key={i} to={q.href}>
            <Card padding="md" hover className="flex flex-col items-center gap-2 cursor-pointer">
              <div className={`w-10 h-10 rounded-xl ${q.color} flex items-center justify-center`}><q.icon className="w-5 h-5" /></div>
              <span className="text-sm font-semibold text-ink">{q.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="This Month Spent" value={<AnimatedCounter value={monthSpent} prefix="₦" />} icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Transactions" value={<AnimatedCounter value={transactions.length} />} icon={<Smartphone className="w-5 h-5" />} iconBg="bg-sky-50" iconColor="text-sky-600" />
        <StatCard label="Beneficiaries" value={<AnimatedCounter value={beneficiaries.length} />} icon={<Users className="w-5 h-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard label="Referral Earnings" value={<AnimatedCounter value={wallet.referralBalance} prefix="₦" />} icon={<Gift className="w-5 h-5" />} iconBg="bg-purple-50" iconColor="text-purple-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-12 lg:col-span-8">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink">Spending This Week</h3>
              <Badge variant="dot" dotColor="bg-emerald-500">Last 7 days</Badge>
            </div>
            <BarChart data={spendingData} height={240} formatValue={(v) => naira(v)} themeColor="#10B981" />
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Card padding="lg">
            <h3 className="text-lg font-bold text-ink mb-4">By Category</h3>
            {spendingByCategory.length ? <DonutChart data={spendingByCategory} size={160} centerLabel="Total" centerValue={naira(successful.reduce((sum,t)=>sum+t.amount,0))} /> : <p className="py-16 text-center text-sm text-muted">No spending yet</p>}
          </Card>
        </div>
      </div>

      {/* Recent Transactions & Beneficiaries */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink">Recent Transactions</h3>
              <Link to="/datasub/transactions"><Button size="sm" variant="ghost" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>View All</Button></Link>
            </div>
            <div className="space-y-2">
              {transactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50">
                  <ServiceLogo name={t.service} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{t.type} · {t.service}</p>
                    <p className="text-xs text-muted">{t.recipient}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink">{naira(t.amount)}</p>
                    <Badge variant="status" status={t.status} />
                  </div>
                </div>
              ))}
              {!loading && transactions.length === 0 && <p className="py-8 text-center text-sm text-muted">Your completed purchases will appear here.</p>}
            </div>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Card padding="lg" className="mb-4">
            <h3 className="text-lg font-bold text-ink mb-4">Saved Beneficiaries</h3>
            <div className="space-y-2">
              {beneficiaries.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{b.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{b.name}</p>
                    <p className="text-xs text-muted">{b.recipient}</p>
                  </div>
                  <Badge>{b.type}</Badge>
                </div>
              ))}
              {!loading && beneficiaries.length === 0 && <p className="py-5 text-center text-sm text-muted">No saved beneficiaries yet.</p>}
            </div>
          </Card>
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><LifeBuoy className="w-5 h-5" /></div>
              <div><h3 className="text-sm font-bold text-ink">Need Help?</h3><p className="text-xs text-muted">Account and transaction support</p></div>
            </div>
            <Link to="/datasub/support"><Button size="sm" variant="secondary" fullWidth>Contact Support</Button></Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
