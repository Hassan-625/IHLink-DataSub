import {useState} from 'react';
import {Modal} from '@/components/ui/Modal';
import {Button} from '@/components/ui/Button';
import {naira} from '@/lib/designTokens';
import {printSchoolDocument} from '@/lib/nativePrint';
import {schoolFileName} from '@/lib/schoolDownloads';
export function DataSubReceiptPreview({open,onClose,reference,service,network,plan,recipient,amount,date}:{open:boolean;onClose:()=>void;reference:string;service:string;network:string;plan:string;recipient:string;amount:number;date:string}){
 const [busy,setBusy]=useState(false);
 async function print(){setBusy(true);try{await printSchoolDocument({name:schoolFileName(['IHLink DataSub','Receipt',reference],'pdf')});}finally{setBusy(false);}}
 return <Modal open={open} onClose={onClose} title="Transaction receipt" footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button disabled={busy} onClick={()=>void print()}>Print / Save PDF</Button></>}><article className="print-document rounded-xl bg-white p-4 text-slate-900"><h2 className="text-xl font-bold">IHLink DataSub</h2><p className="mb-4">Successful purchase receipt</p><dl className="space-y-3">{[['Reference',reference],['Service',service],['Network',network],['Plan',plan],['Recipient',recipient],['Amount',naira(amount)],['Date',date],['Status','Successful']].filter(([,value])=>value).map(([label,value])=><div key={label} className="grid grid-cols-[auto_1fr] gap-3 border-b pb-2 text-sm"><dt>{label}</dt><dd className="break-words text-right font-semibold">{value}</dd></div>)}</dl><p className="mt-5 text-xs">Thank you for using IHLink DataSub. Keep this reference for your records.</p></article></Modal>;
}
