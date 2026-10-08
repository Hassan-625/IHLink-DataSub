import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await request.json().catch(() => null);
  const requestId = String(body?.['request-id'] ?? '').trim();
  const status = String(body?.status ?? '').trim().toLowerCase();
  if (!requestId || requestId.length > 256 || !['success', 'fail'].includes(status)) return json({ error: 'Invalid callback payload' }, 400);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: provider } = await admin.from('datasub_providers').select('id').eq('code', 'legitdataway').maybeSingle();
  if (!provider) return json({ error: 'Provider not configured' }, 503);
  let attempt: any = null;
  for (const column of ['request_key', 'provider_reference']) {
    const { data } = await admin.from('datasub_provider_attempts').select('id,transaction_id')
      .eq('provider_id', provider.id).eq(column, requestId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (data) { attempt = data; break; }
  }
  let transaction: any = null;
  if (attempt) {
    const { data } = await admin.from('datasub_transactions').select('id,status,routing_state').eq('id', attempt.transaction_id).maybeSingle();
    transaction = data;
  }
  if (!transaction) for (const column of ['reference', 'provider_reference']) {
    const { data } = await admin.from('datasub_transactions').select('id,status,routing_state')
      .eq('provider', 'legitdataway').eq(column, requestId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (data) { transaction = data; break; }
  }
  // This provider callback has no verified signature. It is a notification,
  // never proof of delivery or authority to credit a wallet.
  const { error } = await admin.from('datasub_provider_webhook_events').upsert({
    provider_id: provider.id, request_id: requestId, status,
    response_text: String(typeof body.response === 'string' ? body.response : JSON.stringify(body.response ?? '')).slice(0, 4000),
    payload: body, transaction_id: transaction?.id ?? null, processed: false, processed_at: null,
  }, { onConflict: 'provider_id,request_id,status' });
  if (error) return json({ error: 'Unable to record callback' }, 503);
  if (transaction) await admin.from('datasub_routing_events').insert({ transaction_id: transaction.id,
    provider_id: provider.id, event_type: 'PROVIDER_WEBHOOK_RECEIVED',
    reason: 'Callback requires authenticated provider lookup', details: { request_id: requestId, reported_status: status } });
  // Pending ambiguous purchases are already queued for the reconciliation
  // worker. Do not interrupt in-flight purchases or a confirmed refund.
  return json({ received: true, verification_pending: !!transaction && transaction.routing_state === 'RECONCILING' }, 202);
});
