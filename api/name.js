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

async function isRealUser(id) {
  try {
    const res = await fetch(`${API}/auth/v1/admin/users/${id}`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function bad(reason, status = 400) {
  return new Response(JSON.stringify({ ok: false, reason }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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

  const { player_id, name } = body || {};
  if (!UUID_RE.test(player_id || '')) return bad('player');
  if (typeof name !== 'string' || !NAME_RE.test(name.trim())) return bad('name');

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (limited(`ip:${ip}`, 60_000, 30) || limited(`u:${player_id}`, 60_000, 10)) return bad('rate', 429);
  if (!(await isRealUser(player_id))) return bad('player');

  const res = await fetch(`${API}/rest/v1/players?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ id: player_id, name: name.trim() }),
  });
  if (!res.ok) return bad('db', 502);

  return new Response(JSON.stringify({ ok: true, name: name.trim() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
