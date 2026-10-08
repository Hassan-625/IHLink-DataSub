import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Smartphone,Phone,Zap,Tv,GraduationCap,Grid2X2,Eye,EyeOff,RefreshCw,ArrowUpRight,ChevronRight} from 'lucide-react';
import {useAuth} from '@/context/AuthContext';
import {useDataSubData} from '@/hooks/useDataSubData';
import {naira} from '@/lib/designTokens';
const services=[{label:'Buy data',to:'/datasub/buy/data',icon:Smartphone},{label:'Airtime',to:'/datasub/buy/airtime',icon:Phone},{label:'Electricity',to:'/datasub/buy/electricity',icon:Zap},{label:'Cable TV',to:'/datasub/buy/cable',icon:Tv},{label:'Education',to:'/datasub/buy/education',icon:GraduationCap},{label:'All services',to:'/datasub/services',icon:Grid2X2}];
export function NativeAppHome(){
 const {user,profile}=useAuth();
 const {wallet,transactions,loading,error,refresh}=useDataSubData();
 const [balanceVisible,setBalanceVisible]=useState(false);
 return <main className="app-page">
  <section><p className="app-muted text-sm">Good to see you</p><h1 className="mt-1 text-2xl font-extrabold">{user?`Hello, ${profile?.first_name||'there'}`:'Your DataSub account'}</h1></section>
  <section className="app-card"><div className="flex items-center justify-between"><p className="app-muted text-sm">{user?'Available balance':'Data, airtime and bills'}</p>{user&&<button type="button" aria-label={balanceVisible?'Hide balance':'Show balance'} aria-pressed={balanceVisible} className="grid min-h-11 min-w-11 place-items-center" onClick={()=>setBalanceVisible(v=>!v)}>{balanceVisible?<EyeOff size={20}/>:<Eye size={20}/>}</button>}</div>
   <p className="mt-2 text-3xl font-extrabold" aria-live="polite">{user?(loading?'Updating…':error?'Balance unavailable':balanceVisible?naira(wallet.balance):'₦ ••••••'):'Everyday payments, made easy'}</p>
   <div className="mt-5 grid grid-cols-2 gap-3"><Link className="app-action" to={user?'/datasub/wallet':'/signin'}>{user?'Fund wallet':'Sign in'}<ArrowUpRight size={18}/></Link>{user?<button type="button" className="app-action app-action-secondary" disabled={loading} onClick={()=>void refresh()}><RefreshCw size={18} className={loading?'animate-spin':''}/>Refresh</button>:<Link className="app-action app-action-secondary" to="/register">Create account</Link>}</div>
   {error&&user&&<p role="status" className="mt-3 text-sm text-rose-700">{error}</p>}
  </section>
  <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Quick services</h2><Link to="/datasub/services" className="flex min-h-11 items-center gap-1 text-sm font-semibold">View all<ChevronRight size={16}/></Link></div><div className="grid grid-cols-3 gap-3">{services.map(({label,to,icon:Icon})=><Link key={to} to={to} className="app-service"><Icon size={26}/>{label}</Link>)}</div></section>
  <section className="app-card"><div className="flex items-center justify-between gap-2"><h2 className="font-bold">Recent activity</h2><Link to={user?'/datasub/transactions':'/signin'} className="flex min-h-11 items-center gap-1 text-sm">History<ChevronRight size={16}/></Link></div>{!user?<p className="app-muted py-4 text-sm">Sign in to see your purchases and wallet.</p>:loading?<p role="status" className="app-muted py-4 text-sm">Loading activity…</p>:error?<p className="app-muted py-4 text-sm">Refresh to see your latest activity.</p>:!transactions.length?<p className="app-muted py-4 text-sm">No purchases yet. Your activity will appear here.</p>:transactions.slice(0,3).map(t=><Link key={t.id} to="/datasub/transactions" className="app-list-row"><div className="min-w-0"><p className="truncate font-semibold">{t.type}</p><p className="app-muted mt-1 text-xs">{new Date(t.date).toLocaleDateString('en-NG')} · {t.status==='success'?'Successful':t.status==='reversed'?'Reversed':t.status==='failed'?'Unsuccessful':'Pending'}</p></div><b className="shrink-0 text-sm">{naira(t.amount)}</b></Link>)}</section>
 </main>;
}
