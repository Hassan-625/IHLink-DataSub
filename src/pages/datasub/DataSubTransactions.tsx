import {isNativeApp} from '@/lib/nativeAuth';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, type SidebarSection } from '@/components/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, Pagination } from '@/components/ui/Table';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { naira, formatDateTime, statusLabel } from '@/lib/designTokens';
import { useDataSubData, type DataSubTransaction } from '@/hooks/useDataSubData';
import { ServiceLogo } from '@/components/ServiceLogo';
import { Search, Download, RefreshCw, Eye, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const sidebarSections: SidebarSection[] = [
  { title: 'Main', items: [
    { label: 'Dashboard', href: '/datasub/dashboard', icon: <FileText className="w-4 h-4" /> },
    { label: 'Wallet', href: '/datasub/wallet', icon: <FileText className="w-4 h-4" /> },
    { label: 'Transactions', href: '/datasub/transactions', icon: <FileText className="w-4 h-4" /> },
  ]},
];

export function DataSubTransactions() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selected, setSelected] = useState<DataSubTransaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const { showToast } = useToast();
  const navigate=useNavigate();
  useEffect(()=>setPage(1),[search,typeFilter,statusFilter]);
  const repeat=(item:DataSubTransaction)=>{if(item.status==="pending"){showToast("info","Purchase pending","Please wait for this purchase to be confirmed before repeating it.");return;}const type=item.type.toLowerCase();const route=type.includes('cable')?'/datasub/pay-cable':type.includes('education')?'/datasub/buy-education':type.includes('electric')?'/datasub/pay-electricity':type.includes('data')?'/datasub/buy-data':'/datasub/buy-airtime';navigate(`${route}?provider=${encodeURIComponent(item.service)}&recipient=${encodeURIComponent(item.recipient)}`);};
  const printReceipt=async()=>{if(!selected||selected.status!=='success'){showToast('error','Receipt unavailable','Receipts are issued only for successful transactions.');return;}const r=await (supabase as any).rpc('render_ihlink_template',{p_platform:'datasub',p_type:'receipt',p_values:{reference:selected.ref,transaction_reference:selected.ref,service:selected.type,network:selected.service,provider:selected.service,plan:selected.plan||selected.type,recipient:selected.recipient,phone_number:selected.recipient,amount:naira(selected.amount),status:statusLabel(selected.status),date:formatDateTime(selected.date)}});const html=r.data?.[0]?.rendered_content;if(!html){showToast('error','Receipt unavailable','Your receipt could not be opened. Please try again or contact support.');return;}const w=window.open('','_blank','width=900,height=720');if(!w)return;w.opener=null;w.document.write(`<!doctype html><html><head><title>Receipt ${selected.ref}</title><style>body{font-family:Arial,sans-serif;background:#f8fafc;color:#172033;margin:0;padding:32px}@media print{body{background:#fff;padding:0}.no-print{display:none}}</style></head><body>${html}<div class="no-print" style="text-align:center;margin-top:24px"><button onclick="window.print()" style="padding:12px 20px;border:0;border-radius:10px;background:#047857;color:white;font-weight:700">Print / Save PDF</button></div></body></html>`);w.document.close()};
  const { transactions, loading, error, refresh, userName } = useDataSubData();
  const filtered = useMemo(() => transactions.filter(t => {
    const query = search.toLowerCase();
    return (!query || `${t.ref} ${t.recipient} ${t.service}`.toLowerCase().includes(query)) && (typeFilter === 'All Types' || t.type === typeFilter) && (statusFilter === 'All Status' || t.status === statusFilter.toLowerCase());
  }), [transactions, search, typeFilter, statusFilter]);

  const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const paged=filtered.slice((page-1)*pageSize,page*pageSize);
  function exportCsv(){const esc=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`;const lines=[['Reference','Type','Service','Recipient','Amount','Status','Date'].map(esc).join(','),...filtered.map(x=>[x.ref,x.type,x.service,x.recipient,x.amount,x.status,x.date].map(esc).join(','))];const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ihlink-datasub-transactions-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);showToast('success','Export ready',`${filtered.length} transaction(s) exported.`);}
  return (
    <DashboardLayout product="datasub" sections={sidebarSections} userName={userName} userRole="Customer" pageTitle="Transactions" pageBreadcrumb={[{ label: 'History' }]}>
      <Card padding="lg">
        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by reference, recipient..." leftIcon={<Search className="w-4 h-4" />} themeClass="focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            <option>All Types</option><option>Airtime</option><option>Data</option><option>Electricity</option><option>Cable TV</option><option>Education</option>
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            <option>All Status</option><option>Success</option><option>Pending</option><option>Failed</option>
          </select>
          <Button variant="secondary" size="md" leftIcon={<Download className="w-4 h-4" />} onClick={exportCsv}>Export CSV</Button>
          <Button variant="secondary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void refresh()}>Refresh</Button>
        </div>

        {/* Table */}
        {isNativeApp()?<div className="grid gap-3">{paged.map(t=><button type="button" key={t.id} className="app-card text-left" onClick={()=>setSelected(t)}><div className="flex items-center justify-between gap-3"><b>{t.type}</b><b>{naira(t.amount)}</b></div><p className="mt-2 text-sm">{t.service}{t.plan?` · ${t.plan}`:""}</p><p className="mt-2 break-all text-sm text-muted">{t.recipient}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted">{formatDateTime(t.date)}</span><Badge variant="status" status={t.status}/></div><span className="mt-3 block text-xs font-semibold">View details</span></button>)}</div>:<Table
          headers={[
            { label: 'Reference', align: 'left' },
            { label: 'Type', align: 'left' },
            { label: 'Service', align: 'left' },
            { label: 'Recipient', align: 'left' },
            { label: 'Amount', align: 'right' },
            { label: 'Status', align: 'center' },
            { label: 'Date', align: 'left' },
            { label: 'Actions', align: 'center' },
          ]}
          rows={paged.map(t => [
            <span className="font-mono text-xs font-semibold text-ink">{t.ref}</span>,
            <span className="font-semibold text-ink">{t.type}</span>,
            <div><ServiceLogo name={t.service} size="sm" showLabel />{t.plan&&<p className="mt-1 text-xs text-muted">{t.plan}</p>}</div>,
            <span className="text-muted">{t.recipient}</span>,
            <span className="font-bold text-ink">{naira(t.amount)}</span>,
            <Badge variant="status" status={t.status} />,
            <span className="text-xs text-muted">{formatDateTime(t.date)}</span>,
            <div className="flex items-center justify-center gap-1">
              <button onClick={() => setSelected(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted"><Eye className="w-4 h-4" /></button>
              {t.status==="success"&&<button onClick={() => { setSelected(t); setReceiptOpen(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted" title="Preview receipt"><Download className="w-4 h-4" /></button>}
              {t.status!=="pending"&&<button onClick={() => repeat(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted"><RefreshCw className="w-4 h-4" /></button>}
            </div>,
          ])}
        />}
        {!loading && filtered.length === 0 && <p className="py-10 text-center text-sm text-muted">No transactions match your filters.</p>}
        <Pagination current={Math.min(page,totalPages)} total={totalPages} onChange={setPage} />
      </Card>

      {/* Details Drawer */}
      <Drawer open={!!selected && !receiptOpen} onClose={() => setSelected(null)} title="Transaction Details" width={420}>
        {selected && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 ${selected.status === 'success' ? 'bg-emerald-50 text-emerald-500' : selected.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                {selected.status === 'success' ? <FileText className="w-8 h-8" /> : selected.status === 'pending' ? <RefreshCw className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
              </div>
              <p className="text-2xl font-extrabold text-ink">{naira(selected.amount)}</p>
              <Badge variant="status" status={selected.status} />
            </div>
            <div className="space-y-3 text-sm">
              {[['Reference', selected.ref], ['Type', selected.type], ['Service', selected.service], ...(selected.plan? [['Plan', selected.plan]]:[]), ['Recipient', selected.recipient], ['Amount', naira(selected.amount)], ['Date', formatDateTime(selected.date)]].map(([k, v], i) => (
                <div key={i} className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted">{k}</span>
                  <span className="font-semibold text-ink">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {selected.status==="success"&&<Button variant="secondary" fullWidth leftIcon={<Download className="w-4 h-4" />} onClick={() => setReceiptOpen(true)}>Preview Receipt</Button>}
              {selected.status!=="pending"&&<Button fullWidth themeClass="bg-emerald-500 hover:bg-emerald-600" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => repeat(selected)}>Repeat</Button>}
            </div>
          </div>
        )}
      </Drawer>

      {/* Receipt Modal */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Transaction Receipt" size="sm"
        footer={<><Button variant="secondary" onClick={() => setReceiptOpen(false)}>Close</Button><Button themeClass="bg-emerald-500 hover:bg-emerald-600" leftIcon={<Download className="w-4 h-4" />} onClick={printReceipt}>Open Print / Save PDF</Button></>}>
        {selected && (
          <div className="print-document space-y-4 bg-white p-4 text-slate-900">
            <div className="text-center pb-4 border-b border-border">
              <p className="text-lg font-extrabold text-ink">IHLink DataSub</p>
              <p className="text-xs text-muted">Transaction Receipt</p>
            </div>
            <div className="space-y-2 text-sm">
              {[['Reference', selected.ref], ['Type', selected.type], ['Service', selected.service], ...(selected.plan? [['Plan', selected.plan]]:[]), ['Recipient', selected.recipient], ['Amount', naira(selected.amount)], ['Status', statusLabel(selected.status)], ['Date', formatDateTime(selected.date)]].map(([k, v], i) => (
                <div key={i} className="flex justify-between"><span className="text-muted">{k}</span><span className="font-semibold text-ink">{v}</span></div>
              ))}
            </div>
            <div className="pt-4 border-t border-border text-center">
              <p className="text-xs text-muted">Thank you for using IHLink DataSub.</p>
              <p className="text-xs text-muted">For support: <a className="hover:underline" href="mailto:hassanisahassan12@gmail.com">hassanisahassan12@gmail.com</a> · <a className="hover:underline" href="tel:+2348146676278">0814 667 6278</a></p>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
