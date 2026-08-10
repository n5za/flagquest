const REF = 'pusrgtcpkmmzjyypvoyj';
const API = `https://${REF}.supabase.co`;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MODES = ['mc', 'type', 'match', 'timed', 'reverse', 'challenge'];
const MAX_XP = 300;
const MAX_DETAIL = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_RE = /^[\p{L}\p{N} _-]{3,24}$/u;
const NICKNAMES = ['Seeker', 'Nomad', 'Compass', 'Orbit', 'Voyager', 'Atlas', 'Falcon', 'Beacon', 'Zenith', 'Aurora', 'Drift', 'Pioneer'];

function nicknameFor(id) {
  const n = parseInt(id.slice(0, 8), 16) || 0;
  return `${NICKNAMES[n % NICKNAMES.length]}_${id.slice(0, 4)}`;
}

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

function rest(path, body, prefer) {
  return fetch(`${API}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: JSON.stringify(body),
  });
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

export async function POST(req) {
  if (req.method !== 'POST') return bad('method', 405);
  if (!SERVICE_KEY) return bad('config', 503);

  let body;
  try {
    body = await req.json();
  } catch {
    return bad('json');
  }

  const { player_id, name, mode, score, correct, total, detail, xp } = body || {};

  if (!UUID_RE.test(player_id || '')) return bad('player');
  if (!MODES.includes(mode)) return bad('mode');
  if (!Number.isInteger(xp) || xp < 1 || xp > MAX_XP) return bad('xp');
  if (
    !Number.isInteger(score) ||
    !Number.isInteger(correct) ||
    !Number.isInteger(total) ||
    total < 1 ||
    total > 1000 ||
    correct < 0 ||
    correct > total ||
    score < 0
  ) {
    return bad('stats');
  }
  if (typeof detail !== 'string' || detail.length > MAX_DETAIL) return bad('detail');

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (limited(`ip:${ip}`, 60_000, 60) || limited(`u:${player_id}`, 60_000, 20)) return bad('rate', 429);
  if (!(await isRealUser(player_id))) return bad('player');

  const safeName = typeof name === 'string' && NAME_RE.test(name.trim()) ? name.trim() : nicknameFor(player_id);

  const upsert = await rest(`players?on_conflict=id`, { id: player_id, name: safeName }, 'resolution=merge-duplicates');
  if (!upsert.ok) return bad('db', 502);

  const insert = await rest('xp_scores', { player_id, mode, score, correct, total, detail, xp }, 'return=minimal');
  if (!insert.ok) return bad('db', 502);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
