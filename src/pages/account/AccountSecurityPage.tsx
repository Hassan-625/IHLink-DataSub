import { Link } from "react-router-dom";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { ModulePage } from "@/components/ModulePage";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useAccountSections } from "./accountShared";

export function AccountSecurityPage(){
 const {profile,user,signOut}=useAuth(); const sections=useAccountSections();
 const name=[profile?.first_name,profile?.last_name].filter(Boolean).join(" ")||profile?.email||"IHLink Customer";
 const verified=Boolean(user?.email_confirmed_at);
 return <ModulePage product="corporate" sections={sections} title="Account Security" description="Manage password recovery, verification and authenticated access for your IHLink account." userName={name} userRole={profile?.role==="super_admin"||profile?.role==="platform_admin"?"IHLink Administrator":"IHLink Customer"} primaryAction="Security">
  <div className="grid gap-6 lg:grid-cols-2"><Card><ShieldCheck className="h-7 w-7 text-emerald-600"/><h2 className="mt-4 text-xl font-black">Email verification</h2><p className="mt-2 text-sm text-muted">{verified?"Your signed-in email address is verified.":"Your account does not currently report a verified email address."}</p><p className="mt-3 break-all text-sm font-semibold">{user?.email||profile?.email||"—"}</p></Card>
  <Card><KeyRound className="h-7 w-7 text-royal-600"/><h2 className="mt-4 text-xl font-black">Password & session</h2><p className="mt-2 text-sm text-muted">Use password recovery to securely set a new password. Signing out ends the current browser session.</p><div className="mt-5 flex flex-wrap gap-3"><Link to="/reset-password"><Button>Change password</Button></Link><Button variant="secondary" leftIcon={<LogOut className="h-4 w-4"/>} onClick={()=>void signOut()}>Sign out</Button></div></Card></div>
 </ModulePage>;
}