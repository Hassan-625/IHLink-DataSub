import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
export function DataSubDelivery({reference}:{reference:string}){
 const [cards,setCards]=useState<any[]>([]);
 useEffect(()=>{let active=true;setCards([]);if(!supabase||!reference)return;void(async()=>{const t=await supabase!.from('datasub_transactions').select('id').eq('reference',reference).eq('status','success').maybeSingle();if(!t.data)return;const d=await supabase!.from('datasub_purchase_deliveries').select('details').eq('transaction_id',t.data.id).maybeSingle();if(active)setCards(d.data?.details?.cards||[]);})();return()=>{active=false}},[reference]);
 if(!cards.length)return null;
 return <section className="mt-4" aria-label="Delivered cards"><h3 className="font-bold">Your cards / PINs</h3><p className="text-xs">Keep these details private.</p><div className="mt-2 space-y-2">{cards.map((c,i)=><div key={i} className="rounded-lg border p-3"><p className="break-all font-mono font-bold">PIN: {c.pin}</p>{c.serial&&<p className="break-all text-xs">Serial: {c.serial}</p>}</div>)}</div></section>;
}
