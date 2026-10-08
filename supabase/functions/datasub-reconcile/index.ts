import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { finalizeRefund } from "../_shared/refunds.ts";
import * as cash from "../_shared/providers/cashsub.ts";
import * as ds from "../_shared/providers/datastation.ts";
import * as legit from "../_shared/providers/legitdataway.ts";
const adapters: any = { cashsub: cash, datastation: ds, legitdataway: legit };
const serviceOf = (value: string) => ({ data: 'DATA', airtime: 'AIRTIME', cable_tv: 'CABLE', electricity: 'ELECTRICITY', education: 'EXAM' } as Record<string,string>)[value] || value.toUpperCase();
Deno.serve(async request => {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await request.json().catch(() => ({}));
  let query = admin.from('datasub_transactions').select('*')
    .in('routing_state', ['RECONCILING', 'REFUND_PENDING']).eq('status', 'pending')
    .order('last_reconciled_at', { ascending: true, nullsFirst: true }).limit(50);
  if (body.transaction_id) query = query.eq('id', body.transaction_id);
  const { data: transactions, error } = await query;
  if (error) return new Response(JSON.stringify({ error: 'Unable to check transactions' }), { status: 503 });
  for (const transaction of transactions || []) {
    if (transaction.routing_state === 'REFUND_PENDING') {
      await finalizeRefund(admin, transaction);
      continue;
    }
    const adapter = adapters[transaction.provider];
    if (!adapter || !transaction.provider_reference) continue;
    const result = await adapter.reconcile(serviceOf(transaction.service_type), transaction.provider_reference);
    await admin.from('datasub_routing_events').insert({ transaction_id: transaction.id,
      event_type: 'RECONCILIATION', reason: result.state, details: { latency: result.latency } });
    if (result.state === 'FAILED') await finalizeRefund(admin, transaction);
    else await admin.from('datasub_transactions').update({
      ...(result.state === 'SUCCESS' ? { status: 'success', routing_state: 'SETTLED' } : {}),
      last_reconciled_at: new Date().toISOString(),
    }).eq('id', transaction.id).eq('status', 'pending').eq('routing_state', 'RECONCILING');
  }
  return new Response(JSON.stringify({ checked: (transactions || []).length }), { headers: { 'content-type': 'application/json' } });
});
