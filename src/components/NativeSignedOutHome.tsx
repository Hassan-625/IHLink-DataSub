import {Link} from 'react-router-dom';
import {Smartphone,ArrowRight} from 'lucide-react';
export function NativeSignedOutHome(){
 return <main className="app-page mx-auto w-full max-w-md"><section className="app-card"><Smartphone className="mb-4 h-12 w-12"/><h1 className="text-2xl font-extrabold">Welcome to DataSub</h1><p className="app-muted mt-3 text-sm">Sign in for data, airtime and bills, or create your account to get started.</p><div className="mt-6 grid gap-3"><Link className="app-action" to="/signin">Sign in<ArrowRight size={20}/></Link><Link className="app-action app-action-secondary" to="/register">Create account</Link></div></section></main>;
}
