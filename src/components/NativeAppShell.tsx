import {type ReactNode,useEffect} from 'react';
import {Link,NavLink,useLocation} from 'react-router-dom';
import {Home,Wallet,Grid2X2,History,User,ArrowLeft,LifeBuoy} from 'lucide-react';
import {isNativeApp} from '@/lib/nativeAuth';
export function NativeAppShell({children}:{children:ReactNode}){
 const location=useLocation();
 useEffect(()=>{if(isNativeApp())window.scrollTo(0,0)},[location.pathname]);
 if(!isNativeApp())return <>{children}</>;
 const tabs=[{label:'Home',to:'/datasub',icon:Home},{label:'Services',to:'/datasub/services',icon:Grid2X2},{label:'Wallet',to:'/datasub/wallet',icon:Wallet},{label:'Activity',to:'/datasub/transactions',icon:History},{label:'Account',to:'/datasub/profile',icon:User}];
 return <div className="min-h-screen bg-slate-50 pb-24"><header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4"><div className="flex items-center gap-3">{location.pathname!=='/datasub'&&location.pathname!=='/'&&<Link aria-label="Back to home" to="/datasub" className="grid min-h-11 min-w-11 place-items-center"><ArrowLeft className="h-5 w-5"/></Link>}<Link to="/datasub" className="font-extrabold text-emerald-800">IHLink DataSub</Link></div><Link aria-label="Help" to="/datasub/support" className="grid min-h-11 min-w-11 place-items-center"><LifeBuoy className="h-5 w-5"/></Link></header>{children}<nav aria-label="App navigation" style={{paddingBottom:'max(8px, env(safe-area-inset-bottom))'}} className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-white px-1 pt-2">{tabs.map(({label,to,icon:Icon})=><NavLink key={to} to={to} end className={({isActive})=>'flex min-h-12 flex-col items-center justify-center gap-1 text-xs '+(isActive?'font-bold text-emerald-700':'text-slate-600')}><Icon className="h-5 w-5"/>{label}</NavLink>)}</nav></div>;
}