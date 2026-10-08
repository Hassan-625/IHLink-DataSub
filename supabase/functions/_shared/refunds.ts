// Claim the refund before crediting, so a concurrent reconciliation cannot
// mark the same purchase delivered while its reserved money is returned.
export async function finalizeRefund(admin: any, transaction: any): Promise<boolean> {
  const { data: claimed, error: claimError } = await admin.from('datasub_transactions')
    .update({ routing_state: 'REFUND_PENDING' }).eq('id', transaction.id)
    .eq('status', 'pending').in('routing_state', ['ROUTING', 'RECONCILING', 'REFUND_PENDING'])
    .select('id').maybeSingle();
  if (claimError || !claimed) return false;
  const { data, error } = await admin.rpc('refund_datasub_wallet', {
    p_user: transaction.user_id, p_transaction: transaction.id,
    p_amount: transaction.amount, p_reference: `REFUND:${transaction.reference}`,
  });
  if (error || data !== true) {
    await admin.from('datasub_routing_events').insert({ transaction_id: transaction.id,
      event_type: 'REFUND_RETRY_REQUIRED', reason: 'Wallet credit has not been confirmed' });
    return false;
  }
  const { data: completed, error: completionError } = await admin.from('datasub_transactions')
    .update({ status: 'failed', routing_state: 'REFUNDED', last_reconciled_at: new Date().toISOString() })
    .eq('id', transaction.id).eq('status', 'pending').eq('routing_state', 'REFUND_PENDING')
    .select('id').maybeSingle();
  return !completionError && !!completed;
}
