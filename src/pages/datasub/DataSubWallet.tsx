import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout, type SidebarSection } from '@/components/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { naira, formatDate } from '@/lib/designTokens';
import { useDataSubData } from '@/hooks/useDataSubData';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Wallet, Plus, CreditCard, Building2, ArrowDownRight, Shield } from 'lucide-react';

const sidebarSections: SidebarSection[] = [
  { title: 'Main', items: [
    { label: 'Dashboard', href: '/datasub/dashboard', icon: <Wallet className="w-4 h-4" /> },
    { label: 'Wallet', href: '/datasub/wallet', icon: <Wallet className="w-4 h-4" /> },
    { label: 'Transactions', href: '/datasub/transactions', icon: <Wallet className="w-4 h-4" /> },
  ]},
];

export function DataSubWallet() {
  const [fundModal, setFundModal] = useState(false);
  const [amount,setAmount]=useState('');
  const [paymentReference,setPaymentReference]=useState('');
  const [method,setMethod]=useState<'bank_transfer'|'card'>('bank_transfer');
  const [submitting,setSubmitting]=useState(false);const[hasPin,setHasPin]=useState(false),[pinForm,setPinForm]=useState({current:"",next:"",confirm:""}),[pinSaving,setPinSaving]=useState(false);
  const [fundingRequests,setFundingRequests]=useState<{id:string;amount:number;payment_method:string;payment_reference:string;status:string;created_at:string}[]>([]);
  const { showToast } = useToast();
  const {user}=useAuth();
  const {wallet,transactions,userName,loading,error,refresh}=useDataSubData();
  const loadFunding=useCallback(async()=>{if(!supabase||!user)return;const {data}=await supabase.from('datasub_wallet_funding_requests').select('id,amount,payment_method,payment_reference,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false});setFundingRequests((data||[]).map(row=>({...row,amount:Number(row.amount)})));},[user]);
  useEffect(()=>{void loadFunding();if(supabase)void supabase.rpc("datasub_has_transaction_pin").then(r=>setHasPin(Boolean(r.data)));},[loadFunding]);
  async function savePin(){if(!supabase)return;if(!/^\d{4}$/.test(pinForm.next)||pinForm.next!==pinForm.confirm){showToast("error","Invalid PIN","Use exactly 4 digits and make sure both new PIN entries match.");return}setPinSaving(true);const r=await supabase.rpc("set_datasub_transaction_pin",{p_pin:pinForm.next,p_current_pin:hasPin?pinForm.current:null});setPinSaving(false);if(r.error)showToast("error","PIN not changed",r.error.message);else{setHasPin(true);setPinForm({current:"",next:"",confirm:""});showToast("success","Transaction PIN secured","Your 4-digit PIN will now be verified before every DataSub wallet purchase.")}}
  async function submitFunding(){if(!supabase||!user)return;const value=Number(amount);if(!Number.isFinite(value)||value<100){showToast('error','Invalid amount','Enter at least ₦100.');return;}setSubmitting(true);if(method==='card'){const {data,error:paymentError}=await supabase.functions.invoke('datasub-payment',{body:{action:'initialize',amount:value}});setSubmitting(false);if(paymentError||!data?.data?.checkout_url){showToast('error','Payment unavailable',data?.message||paymentError?.message||'The payment gateway is not configured yet.');return;}window.location.assign(data.data.checkout_url);return;}if(paymentReference.trim().length<4){setSubmitting(false);showToast('error','Reference required','Enter the bank transfer reference.');return;}const {error:requestError}=await supabase.from('datasub_wallet_funding_requests').insert({user_id:user.id,amount:value,payment_method:method,payment_reference:paymentReference.trim()});setSubmitting(false);if(requestError)showToast('error','Request not submitted',requestError.message);else{setFundModal(false);setAmount('');setPaymentReference('');showToast('success','Funding request submitted','An authorized DataSub administrator will verify the bank transfer before your wallet is credited.');await loadFunding();}}

  return (
    <DashboardLayout product="datasub" sections={sidebarSections} userName={userName} userRole="Customer" pageTitle="Wallet" pageBreadcrumb={[{ label: 'Overview' }]}>
      {error&&<div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          {/* Wallet Card */}
          <Card padding="lg" className="mb-6 bg-gradient-to-br from-emerald-700 via-emerald-600 to-sky-500 text-white border-0">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-sm text-emerald-100">Available Balance</p>
                <p className="text-4xl font-extrabold mt-1">{loading?'…':naira(wallet.balance)}</p>
              </div>
              <Wallet className="w-8 h-8 text-emerald-200" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-100">Account Holder</p>
                <p className="text-sm font-semibold">{userName}</p>
              </div>
              <Button className="bg-white text-emerald-600 hover:bg-gray-100" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setFundModal(true)}>Fund Wallet</Button>
            </div>
          </Card>

          {/* Funding status */}
          <Card padding="lg" className="mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div><h3 className="text-lg font-bold text-ink">Verified wallet funding</h3><p className="mt-1 text-sm text-muted">Card payments are verified by the configured payment gateway before credit. Bank-transfer requests remain pending until an authorized DataSub administrator verifies them. A virtual account will only be shown after a payment provider actually assigns one to your account.</p></div>
            </div>
          </Card>

          {/* Wallet History */}
          <Card padding="lg">
            <h3 className="text-lg font-bold text-ink mb-4">Wallet History</h3>
            <div className="space-y-2">
              {fundingRequests.map(w => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${w.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : w.status==='rejected'?'bg-rose-50 text-rose-600':'bg-amber-50 text-amber-600'}`}>
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">Wallet funding · {w.payment_reference}</p>
                    <p className="text-xs text-muted">{formatDate(w.created_at)} · {w.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{naira(w.amount)}</p>
                    <p className="text-xs text-muted capitalize">{w.payment_method.replace('_',' ')}</p>
                  </div>
                </div>
              ))}
              {!fundingRequests.length&&<p className="py-8 text-center text-sm text-muted">No wallet funding requests yet.</p>}
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <Card padding="lg" className="mb-4"><h3 className="font-bold">Transaction PIN</h3><p className="mt-1 text-xs text-muted">{hasPin?"Change your secured 4-digit purchase PIN.":"Set a 4-digit PIN before making wallet purchases."}</p><div className="mt-3 grid gap-2">{hasPin&&<input type="password" inputMode="numeric" maxLength={4} value={pinForm.current} onChange={e=>setPinForm({...pinForm,current:e.target.value.replace(/\D/g,"").slice(0,4)})} placeholder="Current PIN" className="rounded-lg border p-2"/>}<input type="password" inputMode="numeric" maxLength={4} value={pinForm.next} onChange={e=>setPinForm({...pinForm,next:e.target.value.replace(/\D/g,"").slice(0,4)})} placeholder="New 4-digit PIN" className="rounded-lg border p-2"/><input type="password" inputMode="numeric" maxLength={4} value={pinForm.confirm} onChange={e=>setPinForm({...pinForm,confirm:e.target.value.replace(/\D/g,"").slice(0,4)})} placeholder="Confirm new PIN" className="rounded-lg border p-2"/><Button disabled={pinSaving} onClick={()=>void savePin()}>{pinSaving?"Saving…":hasPin?"Change PIN":"Set transaction PIN"}</Button></div></Card><Card padding="lg" className="bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Security Notice</p>
                <p className="text-xs text-amber-700 mt-1">Never share your wallet details or transaction PIN with anyone. IHLink staff will never ask for your PIN.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Fund Wallet Modal */}
      <Modal open={fundModal} onClose={() => setFundModal(false)} title="Fund Your Wallet" description="Choose a payment method to add funds to your wallet."
        footer={<><Button variant="secondary" onClick={() => setFundModal(false)}>Cancel</Button><Button disabled={submitting} themeClass="bg-emerald-500 hover:bg-emerald-600" onClick={()=>void submitFunding()}>{submitting?'Submitting…':method==='card'?'Continue to secure payment':'Submit for verification'}</Button></>}>
        <div className="space-y-3">
          {[
            { icon: Building2, title: 'Bank Transfer', desc: 'Submit a bank transfer reference for administrator verification', recommended: false },
            { icon: CreditCard, title: 'Card Payment', desc: 'Pay with your debit or credit card' },
          ].map((m, i) => (
            <button type="button" onClick={()=>setMethod(i===0?'bank_transfer':'card')} key={i} className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${(i===0?'bank_transfer':'card')===method ? 'border-emerald-400 bg-emerald-50' : 'border-border hover:border-emerald-300'}`}>
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-600"><m.icon className="w-5 h-5" /></div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">{m.title}</p>
                <p className="text-xs text-muted">{m.desc}</p>
              </div>
              {m.recommended && <Badge className="bg-emerald-100 text-emerald-700">Recommended</Badge>}
            </button>
          ))}
          <div className="pt-2">
            <label className="block text-sm font-semibold text-ink mb-1.5">Amount</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[1000, 5000, 10000, 20000].map(a => <button type="button" onClick={()=>setAmount(String(a))} key={a} className="px-3 py-2 text-sm font-semibold border border-border rounded-lg hover:border-emerald-400 hover:bg-emerald-50">{naira(a)}</button>)}
            </div>
            <input type="number" min="100" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Enter custom amount" className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            {method==='bank_transfer'&&<input value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder="Bank transfer reference / narration" className="mt-2 w-full px-3.5 py-2.5 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
