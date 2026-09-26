import { useEffect, useMemo, useState } from "react";
import { Bell, Briefcase, Cpu, CreditCard, GraduationCap, LayoutDashboard, LifeBuoy, LockKeyhole, Server, Smartphone, UserRound, Printer, Box, Bot, Building2 } from "lucide-react";
import type { SidebarSection } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const workspaceItems=[
 {product:"datasub",label:"DataSub",href:"/datasub/dashboard",icon:<Smartphone className="h-4 w-4"/>},
 {product:"schoolpro",label:"SchoolPro",href:"/schoolpro/proprietor-dashboard",icon:<GraduationCap className="h-4 w-4"/>},
 {product:"consult",label:"Consult",href:"/consult/portal",icon:<Briefcase className="h-4 w-4"/>},
 {product:"host",label:"Host",href:"/host/dashboard",icon:<Server className="h-4 w-4"/>},
 {product:"engineering",label:"Engineering",href:"/engineering/dashboard",icon:<Cpu className="h-4 w-4"/>},
 {product:"business_centre",label:"Business & Innovation",href:"/business-centre/workspace",icon:<Building2 className="h-4 w-4"/>},
 {product:"print",label:"Print & Branding",href:"/print/order",icon:<Printer className="h-4 w-4"/>},
 {product:"fabrication",label:"3D & Fabrication",href:"/fabrication",icon:<Box className="h-4 w-4"/>},
 {product:"compute",label:"AI & Compute",href:"/compute",icon:<Bot className="h-4 w-4"/>},
 {product:"academy",label:"Academy",href:"/academy",icon:<GraduationCap className="h-4 w-4"/>},
 {product:"digital_business",label:"Digital Business",href:"/business-centre/digital-services",icon:<Smartphone className="h-4 w-4"/>},
] as const;

const baseItems=[{label:"Customer Dashboard",href:"/account",icon:<LayoutDashboard className="h-4 w-4"/>},{label:"Profile & Security",href:"/account/profile",icon:<UserRound className="h-4 w-4"/>},{label:"Notifications",href:"/account/notifications",icon:<Bell className="h-4 w-4"/>},{label:"Billing",href:"/account/billing",icon:<CreditCard className="h-4 w-4"/>},{label:"Security",href:"/account/security",icon:<LockKeyhole className="h-4 w-4"/>},{label:"Support",href:"/account/support",icon:<LifeBuoy className="h-4 w-4"/>}];

export function useAccountSections():SidebarSection[]{
 const {user,profile,adminAccess}=useAuth(); const [active,setActive]=useState<string[]>([]);
 const superAdmin=profile?.role==="super_admin";
 const platformAdmin=profile?.role==="platform_admin";
 useEffect(()=>{let mounted=true;async function load(){if(!supabase||!user){if(mounted)setActive([]);return;}const {data}=await supabase.from("customer_service_access").select("product").eq("user_id",user.id).eq("status","active");if(mounted)setActive((data||[]).map(x=>x.product));}void load();return()=>{mounted=false};},[user]);
 return useMemo(()=>[{items:baseItems},{title:"Platform workspaces",items:workspaceItems.filter(x=>superAdmin||active.includes(x.product)||(platformAdmin&&adminAccess.some(a=>a.product===x.product&&a.can_view))).map(({product:_,...item})=>item)}],[active,superAdmin,platformAdmin,adminAccess]);
}
