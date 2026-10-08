import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Smartphone,Phone,Zap,Tv,GraduationCap,Wifi,MessageSquare,Printer,Ticket,ChevronDown,ChevronUp,type LucideIcon} from 'lucide-react';
import {loadLiveCatalogue} from '@/lib/datasubCatalogue';
const names:Record<string,string>={DATA:'Buy data',AIRTIME:'Airtime',CABLE:'Cable TV',ELECTRICITY:'Electricity',EXAM:'Education PIN',SMILE:'Smile',KIRANI:'Kirani',BULK_SMS:'Bulk SMS',DATA_CARD:'Data cards',RECHARGE_CARD:'Recharge cards',ALPHA:'Alpha'};
const icons:Record<string,LucideIcon>={DATA:Smartphone,AIRTIME:Phone,CABLE:Tv,ELECTRICITY:Zap,EXAM:GraduationCap,SMILE:Wifi,KIRANI:Wifi,BULK_SMS:MessageSquare,DATA_CARD:Ticket,RECHARGE_CARD:Printer};
const routes:Record<string,string>={DATA:'/datasub/buy/data',AIRTIME:'/datasub/buy/airtime',CABLE:'/datasub/buy/cable',ELECTRICITY:'/datasub/buy/electricity',EXAM:'/datasub/buy/education'};
const order=['DATA','AIRTIME','CABLE','ELECTRICITY','EXAM','SMILE','KIRANI','BULK_SMS','DATA_CARD','RECHARGE_CARD','ALPHA'];
export function NativeServiceGrid({categories,onSelect}:{categories?:string[];onSelect?:(value:string)=>void}){
 const [live,setLive]=useState<string[]>([]),[expanded,setExpanded]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{if(categories)return;let active=true;void loadLiveCatalogue().then(items=>{if(active)setLive([...new Set(items.map(x=>x.service_type.toUpperCase()))]);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[categories]);
 const all=[...(categories||live)].sort((a,b)=>(order.indexOf(a)<0?99:order.indexOf(a))-(order.indexOf(b)<0?99:order.indexOf(b)));
 const shown=expanded?all:all.slice(0,8);
 return <section aria-label="Available services"><div className="grid grid-cols-4 gap-2">{shown.map((service,index)=>{const Icon=icons[service]||Ticket;const content=<><span className={`app-service-icon app-service-color-${index%4}`}><Icon size={25} strokeWidth={1.8}/></span><span>{names[service]||service.replaceAll('_',' ')}</span></>;return onSelect?<button type="button" key={service} className="app-service" onClick={()=>onSelect(service)}>{content}</button>:<Link key={service} className="app-service" to={routes[service]||`/datasub/services?category=${encodeURIComponent(service)}`}>{content}</Link>;})}</div>{all.length>8&&<button type="button" aria-expanded={expanded} className="mx-auto mt-2 flex min-h-11 items-center gap-2 px-4 text-sm font-semibold" onClick={()=>setExpanded(value=>!value)}>{expanded?'Show less':'View more'}{expanded?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</button>}{!all.length&&<p role="status" className="app-muted py-3 text-sm">{error?'Services could not be loaded. Please try again shortly.':'Loading available services…'}</p>}</section>;
}
