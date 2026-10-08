import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const body = await request.json().catch(() => ({}));
  const reference = String(body['request-id'] || body.request_id || body.reference || '').trim();
  if (!reference || reference.length > 256) return new Response('Invalid reference', { status: 400 });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  let transaction: any = null;
  for (const column of ['provider_reference', 'reference']) {
    const { data } = await admin.from('datasub_transactions').select('id').eq(column, reference).maybeSingle();
    if (data) { transaction = data; break; }
  }
  if (transaction) {
    const { error } = await admin.from('datasub_routing_events').insert({ transaction_id: transaction.id,
      event_type: 'PROVIDER_WEBHOOK_RECEIVED', reason: 'Callback requires authenticated provider lookup', details: { reference } });
    if (error) return new Response('Unable to record callback', { status: 503 });
  }
  // Only the authenticated reconciliation worker changes purchase/refund
  // state; callbacks cannot overwrite a completed or pending refund.
  return new Response('accepted', { status: 202 });
});
