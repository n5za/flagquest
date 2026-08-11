const REF = 'pusrgtcpkmmzjyypvoyj';
const API = `https://${REF}.supabase.co`;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_RE = /^[\p{L}\p{N} _-]{3,24}$/u;

const limits = new Map();
function limited(key, windowMs, max) {
  const now = Date.now();
  const arr = (limits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return true;
  arr.push(now);
  limits.set(key, arr);
  return false;
}

function bad(reason, status = 400) {
  return new Response(JSON.stringify({ ok: false, reason }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function rest(path, init) {
  return fetch(`${API}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

async function adminUser(id) {
  try {
    const res = await fetch(`${API}/auth/v1/admin/users/${id}`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function POST(req) {
  if (req.method !== 'POST') return bad('method', 405);
  if (!SERVICE_KEY) return bad('config', 503);

  let body;
  try {
    body = await req.json();
  } catch {
    return bad('json');
  }

  const { anonId, accountId } = body || {};
  if (!UUID_RE.test(anonId || '') || !UUID_RE.test(accountId || '')) return bad('ids');
  if (anonId === accountId) return bad('same');

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (limited(`ip:${ip}`, 60_000, 10) || limited(`u:${anonId}`, 300_000, 5)) return bad('rate', 429);

  // The caller must be the anonymous session they claim to migrate.
  const auth = (req.headers.get('authorization') || '').replace(/^Bearer /i, '');
  if (!auth) return bad('auth', 401);
  let caller;
  try {
    const res = await fetch(`${API}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${auth}` },
    });
    caller = res.ok ? await res.json() : null;
  } catch {
    caller = null;
  }
  if (!caller || caller.id !== anonId) return bad('auth', 403);
  if (caller.is_anonymous !== true) return bad('auth', 403);

  const acct = await adminUser(accountId);
  if (!acct) return bad('account', 404);
  if (acct.is_anonymous !== false) return bad('account');

  // Never clobber an account that already has history.
  const existing = await rest(
    `xp_scores?player_id=eq.${accountId}&select=id&limit=1`,
    { method: 'GET' }
  );
  if (existing.ok) {
    const rows = await existing.json();
    if (rows.length > 0) return bad('exists', 409);
  }

  const anonRes = await rest(`players?id=eq.${anonId}&select=*`, { method: 'GET' });
  const anonRows = anonRes.ok ? await anonRes.json() : [];
  const anonName = anonRows[0]?.name;
  const safeName = typeof anonName === 'string' && NAME_RE.test(anonName) ? anonName : 'Player';

  // The account player row must exist BEFORE any row can be re-keyed onto it (FK).
  // If it already exists, keep the account's chosen name; otherwise adopt the anon's.
  const acctRes = await rest(`players?id=eq.${accountId}&select=name`, { method: 'GET' });
  const acctRows = acctRes.ok ? await acctRes.json() : [];
  const targetName = acctRows[0]?.name || safeName;
  const upsert = await rest(
    `players?on_conflict=id`,
    {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: accountId, name: targetName }),
    }
  );
  if (!upsert.ok) return bad('db', 502);

  // Re-key the anonymous player's data onto the account. Check every move; on
  // failure abort BEFORE deleting anything so no data can be lost.
  const moves = await Promise.all([
    rest(`xp_scores?player_id=eq.${anonId}`, {
      method: 'PATCH',
      body: JSON.stringify({ player_id: accountId }),
      headers: { Prefer: 'return=minimal' },
    }),
    rest(`room_members?player_id=eq.${anonId}`, {
      method: 'PATCH',
      body: JSON.stringify({ player_id: accountId }),
      headers: { Prefer: 'return=minimal' },
    }),
  ]);
  if (!moves[0].ok || !moves[1].ok) return bad('db', 502);

  await rest(`players?id=eq.${anonId}`, { method: 'DELETE' });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
