type Identity = { id: string; email: string; mfa: boolean; aal2: boolean };
export type RecoveryDependencies = {
  authenticate: (token: string) => Promise<Identity | null>;
  claim: (id: string) => Promise<boolean>;
  verifyPassword: (email: string, password: string) => Promise<string | null>;
  resetPin: (id: string, pin: string) => Promise<void>;
};
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
function reply(status: number, message: string) { return new Response(JSON.stringify({ success: status === 200, message }), { status, headers }); }
export function createRecoveryHandler(deps: RecoveryDependencies) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') return reply(405, 'Please try again.');
    try {
      const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
      const user = token ? await deps.authenticate(token) : null;
      if (!user) return reply(401, 'Please sign in again.');
      if (user.mfa && !user.aal2) return reply(403, 'Complete your account verification before resetting your PIN.');
      const body = await req.json().catch(() => null);
      if (!body || typeof body.password !== 'string' || !body.password || body.password.length > 1024 || typeof body.pin !== 'string' || !/^\d{4}$/.test(body.pin)) return reply(400, 'Enter your account password and a four-digit PIN.');
      if (!await deps.claim(user.id)) return reply(429, 'Too many attempts. Please wait 15 minutes and try again.');
      if (await deps.verifyPassword(user.email, body.password) !== user.id) return reply(403, 'Your password could not be verified. Please check it and try again.');
      await deps.resetPin(user.id, body.pin);
      return reply(200, 'Your wallet PIN has been reset.');
    } catch { return reply(503, 'Your PIN could not be reset. Please try again later.'); }
  };
}
