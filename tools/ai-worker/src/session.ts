/**
 * Turnstile e sessione breve del pannello.
 *
 * Il primo messaggio porta un token di Turnstile (monouso), verificato con siteverify; il Worker
 * risponde con un gettone di sessione firmato (HMAC-SHA256, 2 ore, legato all'hash dell'IP) che il
 * pannello rimanda nei messaggi successivi: così non serve una verifica di Turnstile a ogni domanda.
 * Nessuno stato sul server: la firma basta.
 */

export const SESSION_TTL_MS = 2 * 3_600_000;
export const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const enc = new TextEncoder();

const b64url = (buf: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

/** Hash dell'IP (con un sale segreto): l'IP in chiaro non si salva né si confronta mai. */
export async function hashIp(ip: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`${salt}|${ip}`));
  return b64url(digest).slice(0, 22);
}

export async function issueSession(secret: string, ipHash: string, now: number): Promise<string> {
  const payload = `v1.${now + SESSION_TTL_MS}.${ipHash}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

/** Confronto a tempo costante (per le firme). */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkSession(
  token: string | null,
  secret: string,
  ipHash: string,
  now: number,
): Promise<boolean> {
  if (!token || token.length > 200) return false;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return false;
  const [, exp, ip, sig] = parts as [string, string, string, string];
  if (!(Number(exp) > now) || ip !== ipHash) return false;
  return same(sig, await hmac(secret, `v1.${exp}.${ip}`));
}

export async function verifyTurnstile(
  fetchFn: typeof fetch,
  secret: string,
  token: string,
  ip: string,
): Promise<boolean> {
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  try {
    const res = await fetchFn(SITEVERIFY_URL, { method: 'POST', body: form });
    if (!res.ok) return false;
    const out = (await res.json()) as { success?: boolean };
    return out.success === true;
  } catch {
    return false;
  }
}
