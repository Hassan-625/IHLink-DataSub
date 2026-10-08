// Only an authenticated, successful transaction lookup can confirm delivery
// or failure. HTTP/API/authentication errors leave the reservation pending.
export function verifiedReconciliation<T extends { state: string; raw: Record<string, unknown> }>(result: T): T {
  const raw = result.raw;
  const http = Number(raw?._http_status);
  const status = String(raw?.transaction_status ?? raw?.status ?? raw?.Status ?? raw?.response_status ?? '').trim().toLowerCase();
  const successes = ['success', 'successful', 'completed', 'complete', 'delivered'];
  const failures = ['fail', 'failed', 'failure', 'rejected', 'cancelled', 'canceled'];
  const valid = http >= 200 && http < 300 && !raw?._authentication_failed;
  const state = valid && successes.includes(status) ? 'SUCCESS'
    : valid && failures.includes(status) ? 'FAILED' : 'UNKNOWN';
  return { ...result, state };
}
