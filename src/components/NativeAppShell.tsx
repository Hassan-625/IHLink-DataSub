import {Navigate} from 'react-router-dom';
import {NativeSignedOutHome} from './NativeSignedOutHome';
import {signedOutNativeAccess} from '@/lib/nativeEntry';
import {Logo} from '@/components/Logo';
import {type ReactNode,useEffect,useState} from 'react';
import {Link,NavLink,useLocation,useNavigate} from 'react-router-dom';
import {Home,Wallet,Grid2X2,History,User,ArrowLeft,LifeBuoy,Bell} from 'lucide-react';
import {isNativeApp} from '@/lib/nativeAuth';
import {useAuth} from '@/context/AuthContext';
export function NativeAppShell({children}:{children:ReactNode}){
 const [keyboardOpen,setKeyboardOpen]=useState(false);
 const location=useLocation();const navigate=useNavigate();const {user,loading}=useAuth();
 useEffect(()=>{if(isNativeApp())window.scrollTo(0,0)},[location.pathname]);
 useEffect(()=>{
  if(!isNativeApp())return;
  let baseline=window.visualViewport?.height||window.innerHeight;
  const update=()=>{
   const height=window.visualViewport?.height||window.innerHeight;
   const typing=document.activeElement instanceof HTMLElement&&document.activeElement.matches('input:not([type=checkbox]):not([type=radio]),textarea,[contenteditable=true]');
   if(!typing)baseline=Math.max(baseline,height);
   setKeyboardOpen(Boolean(typing&&baseline-height>120));
  };
  window.visualViewport?.addEventListener('resize',update);window.addEventListener('resize',update);document.addEventListener('focusin',update);document.addEventListener('focusout',update);
  return()=>{window.visualViewport?.removeEventListener('resize',update);window.removeEventListener('resize',update);document.removeEventListener('focusin',update);document.removeEventListener('focusout',update);};
 },[]);
 if(!isNativeApp())return <>{children}</>;
 if(loading)return <main className="app-page"><p role="status">Opening your account…</p></main>;
 const entry=signedOutNativeAccess(location.pathname);
 if(!user&&entry==='welcome')return <NativeSignedOutHome/>;
 if(!user&&entry==='signin')return <Navigate to="/signin" replace/>;
 const home='/datasub'; const atHome=location.pathname===home||location.pathname==='/';
 const tabs=[{label:'Home',to:home,icon:Home},{label:'Services',to:'/datasub/services',icon:Grid2X2},{label:'Wallet',to:'/datasub/wallet',icon:Wallet},{label:'Activity',to:'/datasub/transactions',icon:History},{label:'Account',to:'/datasub/profile',icon:User}];
 return <div className={`${keyboardOpen?"native-shell keyboard-open":"native-shell"}${!user?" signed-out":""}`}><header className="native-header"><div className="flex min-w-0 items-center gap-2">{!atHome&&<button type="button" aria-label="Go back" onClick={()=>window.history.length>1?navigate(-1):navigate(home)}><ArrowLeft size={20}/></button>}<Link to={home} className="gap-2 text-sm font-extrabold"><Logo product="datasub" variant="icon" size="sm" disableLink/>IHLink DataSub</Link></div><div className="flex items-center">{user&&<Link aria-label="Notifications" to="/datasub/notifications"><Bell size={20}/></Link>}<Link aria-label="Help" to="/datasub/support"><LifeBuoy size={20}/></Link></div></header>{!user&&entry==='welcome'?<NativeSignedOutHome/>:children}{user&&<nav aria-label="App navigation" className="native-nav" style={{gridTemplateColumns:`repeat(${tabs.length}, minmax(0, 1fr))`}}>{tabs.map(({label,to,icon:Icon})=><NavLink key={to} to={to} end className={({isActive})=>isActive||(label==='Home'&&atHome)?'app-tab-active':''}><Icon size={21}/><span>{label}</span></NavLink>)}</nav>}</div>;
}
