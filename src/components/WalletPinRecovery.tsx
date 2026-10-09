import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
export function WalletPinRecovery({ onRecovered }: { onRecovered: () => void }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [visible, setVisible] = useState(false);
  const [password, setPassword] = useState(''), [pin, setPin] = useState(''), [confirm, setConfirm] = useState(''), [message, setMessage] = useState('');
  function close() { if (busy) return; setOpen(false); setPassword(''); setPin(''); setConfirm(''); setMessage(''); setVisible(false); }
  async function recover() {
    if (!supabase || busy) return;
    if (!password || !/^\d{4}$/.test(pin) || pin !== confirm) { setMessage('Enter your account password and four matching PIN digits.'); return; }
    setBusy(true); setMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('datasub-pin-recovery', { body: { password, pin } });
      if (error || !data?.success) {
        let feedback = data?.message;
        if (!feedback && error?.context instanceof Response) { const result = await error.context.clone().json().catch(() => null); feedback = result?.message; }
        setMessage(typeof feedback === 'string' ? feedback : 'Your PIN could not be reset. Please try again later.');
        return;
      }
      setPassword(''); setPin(''); setConfirm(''); setVisible(false); setOpen(false); onRecovered();
    } catch { setMessage('Your PIN could not be reset. Please try again later.'); }
    finally { setBusy(false); }
  }
  return <><Button variant="secondary" onClick={() => setOpen(true)}>Forgot wallet PIN?</Button><Modal open={open} onClose={close} title="Reset wallet PIN" description="Confirm your account password to choose a new wallet PIN." footer={<><Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button><Button disabled={busy} onClick={() => void recover()}>{busy ? 'Verifying…' : 'Reset PIN'}</Button></>}><div className="grid gap-4"><label className="text-sm font-semibold">Account password<div className="mt-1 flex rounded-lg border"><input className="min-w-0 flex-1 rounded-lg p-3" type={visible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/><button type="button" className="min-w-11 p-2" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div></label><label className="text-sm font-semibold">New four-digit PIN<input className="mt-1 w-full rounded-lg border p-3" type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0,4))} disabled={busy}/></label><label className="text-sm font-semibold">Confirm new PIN<input className="mt-1 w-full rounded-lg border p-3" type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={confirm} onChange={e => setConfirm(e.target.value.replace(/\D/g, '').slice(0,4))} disabled={busy}/></label>{message && <p role="alert" className="text-sm text-rose-700">{message}</p>}<Link className="text-sm underline" to="/reset-password" onClick={close}>Forgot account password?</Link></div></Modal></>;
}
