import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, ExternalLink, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { ModulePage } from "@/components/ModulePage";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useAccountSections } from "./accountShared";

type Delivery = { id:string; channel:string; status:string; read_at:string|null; created_at:string; notification_campaigns:{title:string;message:string;product:string;action_label:string|null;action_url:string|null}|null };

export function NotificationsPage(){
 const accountSections=useAccountSections();
 const {user,profile}=useAuth(); const [items,setItems]=useState<Delivery[]>([]),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{if(!supabase||!user)return;const {data,error}=await supabase.from("notification_deliveries").select("id,channel,status,read_at,created_at,notification_campaigns(title,message,product,action_label,action_url)").eq("user_id",user.id).eq("channel","in_app").order("created_at",{ascending:false});setItems((data||[]) as unknown as Delivery[]);setNotice(error?.message||"");},[user]);
 useEffect(()=>{void load();},[load]); const unread=useMemo(()=>items.filter(x=>!x.read_at).length,[items]);
 async function markRead(id?:string){if(!supabase||!user)return;setBusy(true);let query=supabase.from("notification_deliveries").update({status:"read",read_at:new Date().toISOString()}).eq("user_id",user.id).eq("channel","in_app");query=id?query.eq("id",id):query.is("read_at",null);const {error}=await query;setBusy(false);setNotice(error?.message||"");if(!error)await load();}
 return <ModulePage product="corporate" sections={accountSections} title="Notification Centre" description="Updates for the IHLink services assigned to your account." userName={`${profile?.first_name||"IHLink"} ${profile?.last_name||"Customer"}`} userRole="IHLink Customer" primaryAction="Notifications">
  <div className="grid gap-4 md:grid-cols-3"><Card><p className="text-sm text-muted">All notifications</p><p className="mt-2 text-3xl font-black">{items.length}</p></Card><Card><p className="text-sm text-muted">Unread</p><p className="mt-2 text-3xl font-black text-royal-600">{unread}</p></Card><Card><p className="text-sm text-muted">Channel</p><p className="mt-2 text-lg font-black">In-app inbox</p></Card></div>
  <div className="flex flex-wrap items-center justify-between gap-3">{notice?<p className="text-sm text-rose-600">{notice}</p>:<p className="text-sm text-muted">New IHLink messages appear here after they are published.</p>}<div className="flex gap-2"><Button variant="secondary" size="sm" leftIcon={<RefreshCw className="h-4 w-4"/>} onClick={()=>void load()}>Refresh</Button><Button size="sm" disabled={busy||unread===0} leftIcon={<CheckCheck className="h-4 w-4"/>} onClick={()=>void markRead()}>Mark all read</Button></div></div>
  <Card padding="none" className="overflow-hidden"><div className="divide-y divide-border">{items.map(item=>{const c=item.notification_campaigns;return <article key={item.id} className={`p-5 ${item.read_at?"bg-white":"bg-royal-50/60"}`}><div className="flex items-start gap-4"><div className={`mt-1 rounded-xl p-2 ${item.read_at?"bg-gray-100 text-muted":"bg-royal-100 text-royal-700"}`}><Bell className="h-5 w-5"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-ink">{c?.title||"IHLink notification"}</h3><span className="text-xs text-muted">{new Date(item.created_at).toLocaleString("en-NG")}</span></div><p className="mt-2 text-sm leading-6 text-muted">{c?.message}</p><div className="mt-3 flex flex-wrap items-center gap-3"><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold capitalize text-royal-700">{c?.product}</span>{c?.action_url&&<Link to={c.action_url} className="inline-flex items-center gap-1 text-sm font-bold text-royal-700">{c.action_label||"Open"}<ExternalLink className="h-3.5 w-3.5"/></Link>}{!item.read_at&&<button type="button" onClick={()=>void markRead(item.id)} className="text-sm font-bold text-royal-700">Mark read</button>}</div></div></div></article>})}{!items.length&&<div className="p-12 text-center"><Bell className="mx-auto h-10 w-10 text-gray-300"/><h3 className="mt-3 font-bold">No notifications yet</h3><p className="mt-1 text-sm text-muted">Important service updates will appear here.</p></div>}</div></Card>
 </ModulePage>;
}
