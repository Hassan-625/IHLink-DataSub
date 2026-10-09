import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { createRecoveryHandler } from './handler.ts';
const url = Deno.env.get('SUPABASE_URL')!;
const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, options);
Deno.serve(createRecoveryHandler({
  async authenticate(token) {
    const auth = createClient(url, anon, options);
    const { data, error } = await auth.auth.getUser(token);
    const user = data.user;
    if (error || !user?.email) return null;
    const { data: profile, error: profileError } = await service.from('profiles').select('status').eq('id', user.id).maybeSingle();
    if (profileError || profile?.status !== 'active') return null;
    const mfa = (user.factors || []).some(f => f.status === 'verified');
    let aal2 = false;
    if (mfa) { const result = await auth.auth.getClaims(token); aal2 = !result.error && result.data?.claims.aal === 'aal2'; }
    return { id: user.id, email: user.email, mfa, aal2 };
  },
  async claim(id) {
    const { data, error } = await service.rpc('claim_datasub_pin_recovery', { p_user: id });
    if (error) throw new Error('Recovery unavailable');
    return data === true;
  },
  async verifyPassword(email, password) {
    const auth = createClient(url, anon, options);
    const { data, error } = await auth.auth.signInWithPassword({ email, password });
    try { return !error && data.session && data.user ? data.user.id : null; }
    finally { if (data.session) await auth.auth.signOut({ scope: 'local' }); }
  },
  async resetPin(id, pin) {
    const { error } = await service.rpc('recover_datasub_transaction_pin', { p_user: id, p_pin: pin });
    if (error) throw new Error('Recovery unavailable');
  },
}));
