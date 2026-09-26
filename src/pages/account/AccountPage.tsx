import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Briefcase, Cpu, GraduationCap, Server, Smartphone, Printer, Box, Bot } from "lucide-react";
import { ModulePage } from "@/components/ModulePage";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import type { ProductKey } from "@/lib/designTokens";
import { supabase } from "@/lib/supabase";
import { useAccountSections } from "./accountShared";
import { deployedPlatform, platformExploreUrl, platformRegistrationUrl, platformUrl, type PlatformKey } from "@/lib/platformUrls";
import { openPlatformWithHandoff } from "@/lib/platformHandoff";

const services = [
  { product:"corporate", icon:Building2, name:"IHLink Corporate", text:"Company services, support and opportunities", href:platformUrl("corporate","/services"), color:"from-royal-600 to-sky-500" },
  { product:"datasub", icon:Smartphone, name:"IHLink DataSub", text:"Wallet, airtime, data and digital payments", href:platformUrl("datasub","/datasub/dashboard"), color:"from-emerald-500 to-cyan-500" },
  { product:"schoolpro", icon:GraduationCap, name:"IHLink SchoolPro", text:"School operations, academics and results", href:platformUrl("schoolpro","/schoolpro/proprietor-dashboard"), color:"from-purple-600 to-indigo-600" },
  { product:"consult", icon:Briefcase, name:"IHLink Consult", text:"Projects, proposals and consulting support", href:platformUrl("consult","/consult/portal"), color:"from-orange-500 to-pink-600" },
  { product:"host", icon:Server, name:"IHLink Host", text:"Domains, hosting and cloud services", href:platformUrl("host","/host/dashboard"), color:"from-cyan-600 to-blue-700" },
  { product:"engineering", icon:Cpu, name:"IHLink Engineering", text:"Engineering projects, quotations and support", href:platformUrl("engineering","/engineering/dashboard"), color:"from-amber-500 to-orange-700" },
  { product:"business_centre", icon:Building2, name:"Business & Innovation Centre", text:"Unified workspace for business, production and innovation services", href:"/business-centre/workspace", color:"from-orange-500 to-sky-600" },
  { product:"print", icon:Printer, name:"Print & Branding", text:"Printing, branding, signage and production requests", href:platformUrl("print","/print/order"), color:"from-pink-500 to-purple-600" },
  { product:"fabrication", icon:Box, name:"3D & Fabrication Lab", text:"CAD, prototyping, parts and fabrication jobs", href:platformUrl("fabrication"), color:"from-slate-600 to-cyan-600" },
  { product:"compute", icon:Bot, name:"AI & Compute", text:"AI, data and compute service requests", href:platformUrl("compute"), color:"from-indigo-600 to-cyan-500" },
  { product:"academy", icon:GraduationCap, name:"IHLink Academy", text:"Practical learning, enrolment and training sessions", href:platformUrl("academy"), color:"from-violet-600 to-blue-600" },
  { product:"digital_business", icon:Smartphone, name:"Digital Business Centre", text:"Documents, applications and everyday digital business services", href:platformUrl("digital_business"), color:"from-teal-600 to-emerald-500" },
] as const;

type ServiceAccess = { product:string; status:"active"|"pending"|"suspended"; plan_name:string|null; activated_at:string|null };

export function AccountPage(){
 const accountSections=useAccountSections();
  const { profile, user, adminAccess } = useAuth();
  const [accessRows,setAccessRows] = useState<ServiceAccess[]>([]);
  const [accessLoading,setAccessLoading] = useState(true);
  useEffect(()=>{let active=true;async function load(){if(!supabase||!user){setAccessLoading(false);return;}const {data}=await supabase.from("customer_service_access").select("product,status,plan_name,activated_at").eq("user_id",user.id);if(active){setAccessRows((data||[]) as ServiceAccess[]);setAccessLoading(false);}}void load();return()=>{active=false};},[user]);
  const accessByProduct=useMemo(()=>Object.fromEntries(accessRows.map(row=>[row.product,row])),[accessRows]);
  const activeServices=accessRows.filter(row=>row.status==="active").length;
  const userName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email : "IHLink Customer";
  const isAdmin = profile?.role === "super_admin" || profile?.role === "platform_admin";
  const adminAccessByProduct = useMemo(()=>Object.fromEntries(adminAccess.map(row=>[row.product,row])),[adminAccess]);
  const hasAdminPlatformAccess = (product:string) => profile?.role === "super_admin" || (profile?.role === "platform_admin" && Boolean(adminAccessByProduct[product]?.can_view));

  if (deployedPlatform !== "corporate") {
    if (isAdmin) {
      const allowed = hasAdminPlatformAccess(deployedPlatform);
      return <ModulePage product={deployedPlatform as ProductKey} sections={accountSections} title="Administrator Platform Access" eyebrow="IHLink administration identity" description="Your IHLink administrator credentials are shared across the ecosystem. Platform access is determined by Super Admin permissions." userName={userName} userRole={profile?.role === "super_admin" ? "Super Administrator" : "Platform Administrator"} primaryAction="Open Platform" metrics={[{label:"Platform",value:deployedPlatform},{label:"Admin Access",value:allowed?"Granted":"Not granted"}]}><Card><h3 className="text-lg font-bold">{allowed?"Administrator access granted":"Administrator access not granted"}</h3><p className="mt-2 text-sm text-muted">{allowed?"Use the same IHLink administrator email and password on this platform. No separate administrator registration is required.":"This administrator account has not been granted access to this platform. Super Admin must grant the platform permission; do not create another administrator account."}</p>{allowed&&<a className="mt-5 inline-flex font-bold text-royal-600" href={platformUrl(deployedPlatform)}>Open platform <ArrowRight className="ml-2 h-4 w-4"/></a>}</Card></ModulePage>;
    }
 const active = accessByProduct[deployedPlatform]?.status === "active"; return <ModulePage product={deployedPlatform as ProductKey} sections={accountSections} title="Platform Account" eyebrow="Dedicated customer account" description="Customer access on this site is limited to this platform." userName={userName} userRole="Customer" primaryAction="Open Platform" metrics={[{label:"Platform",value:deployedPlatform},{label:"Access",value:active?"Active":"Not active"}]}><Card><h3 className="text-lg font-bold">{active?"Your platform access is active":"Platform registration required"}</h3><p className="mt-2 text-sm text-muted">{active?"Use this platform without exposing unrelated IHLink products.":"Create or activate an account for this platform before using its private dashboard."}</p><a className="mt-5 inline-flex font-bold text-royal-600" href={active?platformUrl(deployedPlatform):platformRegistrationUrl(deployedPlatform)}>{active?"Open dashboard":"Sign up for this platform"} <ArrowRight className="ml-2 h-4 w-4"/></a></Card></ModulePage>; }

  return <ModulePage product="corporate" sections={accountSections} title="IHLink Customer Dashboard" eyebrow={isAdmin ? "One administrator identity · Permission-controlled ecosystem" : "Platform-specific customer registrations"} description={isAdmin ? "Use the same administrator credentials across every IHLink platform you are authorized to manage." : "Customer access is registered per platform. Register for each additional IHLink service you want to use."} userName={userName} userRole={isAdmin ? "IHLink Administrator" : "IHLink Customer"} primaryAction="Explore Services" metrics={[{label:"Active Platforms",value:isAdmin ? String(profile?.role === "super_admin" ? services.length : adminAccess.filter(row=>row.can_view).length) : (accessLoading?"…":String(activeServices))},{label:"Account Status",value:profile?.status === "active" ? "Active" : "Protected"},{label:"Access Type",value:isAdmin ? "Administrator" : "Customer"},{label:"Identity",value:isAdmin ? "Shared admin login" : "Platform registration"}]}>
    <section>
      <div className="mb-4"><h3 className="text-xl font-extrabold text-ink">Your IHLink platforms</h3><p className="mt-1 text-sm text-muted">{isAdmin ? "Your administrator login remains the same. Only platforms granted to this administrator can be opened." : "Each service requires its own platform registration before private customer access is activated."}</p></div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {services.map(service=>{const access=accessByProduct[service.product];const status=isAdmin ? (hasAdminPlatformAccess(service.product) ? "active" : "pending") : (accessLoading?"checking":access?.status||"pending");const statusStyle=status==="active"?"bg-emerald-50 text-emerald-700":status==="suspended"?"bg-rose-50 text-rose-700":"bg-amber-50 text-amber-700";return <Card hover={status==="active"} key={service.name} className="group flex min-h-64 flex-col">
          <div className="flex items-start justify-between gap-4"><div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-white ${service.color}`}><service.icon className="h-6 w-6"/></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyle}`}>{status}</span></div>
          <div className="mt-5">{["corporate","datasub","schoolpro","consult","host","engineering"].includes(service.product)?<Logo product={service.product as ProductKey} variant="full" size="sm" disableLink/>:<h3 className="text-lg font-extrabold">{service.name}</h3>}<p className="mt-3 text-sm leading-6 text-muted">{service.text}</p>{!isAdmin&&access?.plan_name&&<p className="mt-2 text-xs font-semibold text-ink">{access.plan_name}</p>}</div>
          {status==="active"?(isAdmin && service.product!=="corporate"?<button type="button" onClick={()=>void openPlatformWithHandoff(service.product as PlatformKey,new URL(service.href,window.location.origin).pathname)} className="mt-auto inline-flex items-center gap-2 pt-6 text-left text-sm font-bold text-royal-600 group-hover:text-royal-700">Open platform <ArrowRight className="h-4 w-4"/></button>:<a className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-royal-600 group-hover:text-royal-700" href={service.href}>Open platform <ArrowRight className="h-4 w-4"/></a>):isAdmin?<div className="mt-auto pt-6 text-sm font-bold text-muted">Admin access not granted</div>:<div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-6 text-sm font-bold"><a className="text-royal-600" href={platformExploreUrl(service.product as import("@/lib/platformUrls").PlatformKey)}>Explore</a><a className="text-emerald-700" href={platformRegistrationUrl(service.product as import("@/lib/platformUrls").PlatformKey)}>Register for platform</a><Link className="text-muted" to="/account/support">Contact support</Link></div>}
        </Card>})}
      </div>
    </section>
    {isAdmin&&<Card className="border-royal-200 bg-royal-50"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="font-bold text-navy-900">You are also an IHLink administrator</h3><p className="mt-1 text-sm text-muted">Switch to the central administration workspace without signing in again.</p></div><Link to="/admin" className="inline-flex items-center gap-2 font-bold text-royal-700">Open Super Admin <ArrowRight className="h-4 w-4"/></Link></div></Card>}
  </ModulePage>;
}
