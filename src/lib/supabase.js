import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

let playerPromise = null;
let playerResolved = false;

export async function ensurePlayer() {
  if (!supabase) return null;
  if (playerResolved && playerPromise) return playerPromise;
  playerPromise = (async () => {
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;
      let user = session?.user;
      if (!user) {
        const { data: anon, error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) throw anonErr;
        user = anon.user;
      }
      playerResolved = true;
      return user;
    } catch {
      playerResolved = false;
      return null;
    }
  })();
  return playerPromise;
}

const NICK_KEY = 'fq_nickname';

export function savedName() {
  try {
    return localStorage.getItem(NICK_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export async function getMe() {
  const user = await ensurePlayer();
  if (!user) return null;
  return { id: user.id, name: savedName() || nicknameFor(user.id) };
}

export async function updateNickname(raw) {
  const name = (raw || '').trim().replace(/\s+/g, ' ');
  if (name.length < 3 || name.length > 24) return { ok: false, reason: 'length' };
  if (!/^[\p{L}\p{N} _-]+$/u.test(name)) return { ok: false, reason: 'chars' };
  try {
    localStorage.setItem(NICK_KEY, name);
  } catch {
    /* storage unavailable — still try server */
  }
  if (!supabase) return { ok: true, name, offline: true };
  const user = await ensurePlayer();
  if (!user) return { ok: true, name, offline: true };
  try {
    const { error } = await supabase.from('players').upsert({ id: user.id, name }, { onConflict: 'id' });
    if (error) throw error;
    return { ok: true, name };
  } catch {
    return { ok: true, name, offline: true };
  }
}

const NICKNAMES = ['Seeker', 'Nomad', 'Compass', 'Orbit', 'Voyager', 'Atlas', 'Falcon', 'Beacon', 'Zenith', 'Aurora', 'Drift', 'Pioneer'];

function nicknameFor(id) {
  const n = parseInt(id.slice(0, 8), 16) || 0;
  return `${NICKNAMES[n % NICKNAMES.length]}_${id.slice(0, 4)}`;
}

export async function syncXpRun({ mode, score, correct, total, detail, xp }) {
  if (!supabase || !xp) return false;
  try {
    const user = await ensurePlayer();
    if (!user) return false;
    const { error } = await supabase
      .from('players')
      .upsert({ id: user.id, name: savedName() || nicknameFor(user.id) }, { onConflict: 'id' });
    if (error) throw error;
    const { error: xpErr } = await supabase.from('xp_scores').insert({
      player_id: user.id,
      mode,
      score,
      correct,
      total,
      detail,
      xp,
    });
    if (xpErr) throw xpErr;
    return true;
  } catch {
    return false;
  }
}

export async function fetchGlobalLadder() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, name, xp_scores(xp)');
    if (error) throw error;
    const rows = data
      .map((p) => ({
        id: p.id,
        name: p.name,
        xp: (p.xp_scores || []).reduce((acc, s) => acc + s.xp, 0),
      }))
      .filter((p) => p.xp > 0)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);
    return rows;
  } catch {
    return null;
  }
}
