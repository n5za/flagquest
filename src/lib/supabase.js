import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

let playerPromise = null;

export async function ensurePlayer() {
  if (!supabase) return null;
  if (playerPromise) return playerPromise;
  playerPromise = (async () => {
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;
      if (!session?.user) {
        const { data: anon, error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) throw anonErr;
        return anon.user;
      }
      return session.user;
    } catch {
      return null;
    }
  })();
  return playerPromise;
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
      .upsert({ id: user.id, name: nicknameFor(user.id) }, { onConflict: 'id' });
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
