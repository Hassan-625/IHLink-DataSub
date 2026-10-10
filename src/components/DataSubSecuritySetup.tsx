import {setupReminderDeferred,deferSetupReminder} from '@/lib/securitySetupReminder';
import {useEffect,useState} from 'react';
import {useAuth} from '@/context/AuthContext';
import {supabase} from '@/lib/supabase';
import {NativeVault,securitySupported,type VaultStatus} from '@/lib/nativeVault';
import {NativeAppSecurity} from '@/components/NativeAppSecurity';
import {Modal} from '@/components/ui/Modal';
import {Button} from '@/components/ui/Button';
export function DataSubSecuritySetup(){
 const {user}=useAuth();const reminderKey='ihlink.datasub.setup-reminder.'+(user?.id||'signed-out');function dismissReminder(){deferSetupReminder(reminderKey);setDismissed(true)}
 const [hasPin,setHasPin]=useState<boolean|null>(null),[vault,setVault]=useState<VaultStatus|null>(null),[dismissed,setDismissed]=useState(false);
 const [pin,setPin]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{setHasPin(null);setVault(null);setPin('');setConfirm('');setNotice('');setDismissed(setupReminderDeferred(reminderKey));
  if(!user||!supabase)return;let active=true;
  const refresh=()=>{void supabase!.rpc('datasub_has_transaction_pin').then(r=>{if(active&&!r.error)setHasPin(r.data===true)});if(securitySupported)void NativeVault.status().then(value=>{if(active)setVault(value)}).catch(()=>{});};
  refresh();window.addEventListener('ihlink:security-changed',refresh);return()=>{active=false;window.removeEventListener('ihlink:security-changed',refresh)};
 },[user?.id]);
 if(!user)return null;
 const devicePending=Boolean(securitySupported&&vault&&(!vault.enabled||(vault.biometricAvailable&&!vault.biometricEnabled&&localStorage.getItem('ihlink.datasub.fingerprint-choice')!=='skipped')));
 const missing=hasPin===false||(securitySupported&&vault&&(!vault.enabled||(vault.biometricAvailable&&!vault.biometricEnabled&&localStorage.getItem('ihlink.datasub.fingerprint-choice')!=='skipped')));
 const open=Boolean(missing&&!dismissed);
 async function save(){if(!/^\d{4}$/.test(pin)||pin!==confirm){setNotice('Enter and confirm the same four-digit wallet PIN.');return;}setBusy(true);setNotice('');
  try{const r=await supabase!.rpc('set_datasub_transaction_pin',{p_pin:pin,p_current_pin:null});if(r.error)throw r.error;
   const check=await supabase!.rpc('datasub_has_transaction_pin');if(check.error||check.data!==true)throw Error('PIN not confirmed');setHasPin(true);setPin('');setConfirm('');setNotice('Your wallet transaction PIN is ready.');window.dispatchEvent(new Event('ihlink:security-changed'));
  }catch{setNotice('We could not save your wallet PIN. Please try again.');}finally{setBusy(false);}
 }
 return <Modal open={open} onClose={()=>{if(!busy)dismissReminder()}} title="Secure your DataSub account" size="md" footer={<Button variant="secondary" disabled={busy} onClick={dismissReminder}>Set up later</Button>}>
  <p className="mb-4 text-sm text-muted">Your six-digit passcode unlocks this device. Your separate four-digit wallet PIN confirms purchases and transfers. Fingerprint or device unlock is optional.</p>
  {securitySupported&&vault&&(!vault.enabled||(vault.biometricAvailable&&!vault.biometricEnabled&&localStorage.getItem('ihlink.datasub.fingerprint-choice')!=='skipped'))&&<NativeAppSecurity setupOnly/>}
  {hasPin===false&&!devicePending&&(!securitySupported||vault)&&<section className="rounded-xl border p-4"><h2 className="font-bold">Set your wallet transaction PIN</h2><p className="mt-2 text-sm text-muted">You need this PIN before making a purchase or transferring wallet funds.</p><div className="mt-4 grid gap-3">
  <label className="text-sm">Four-digit wallet PIN<input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} className="mt-2 w-full rounded-xl border p-3"/></label>
  <label className="text-sm">Confirm wallet PIN<input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={confirm} onChange={e=>setConfirm(e.target.value.replace(/\D/g,'').slice(0,4))} className="mt-2 w-full rounded-xl border p-3"/></label>
  <Button disabled={busy} onClick={()=>void save()}>{busy?'Saving…':'Save wallet PIN'}</Button></div></section>}
  {notice&&<p role="status" className="mt-3 text-sm">{notice}</p>}
 </Modal>;
}
