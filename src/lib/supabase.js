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

export async function getAccount() {
  if (!supabase) return null;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;
    const isAnon = !!session.user.is_anonymous;
    return { id: session.user.id, email: session.user.email || null, isAnon };
  } catch {
    return null;
  }
}

export async function signUp(email, password) {
  if (!supabase) return { ok: false, error: 'offline' };
  try {
    const current = (await supabase.auth.getSession()).data.session?.user;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, error: error.message };
    const accountId = data?.user?.id;
    if (current && accountId && accountId !== current.id) {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        await fetch('/api/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ anonId: current.id, accountId }),
        });
      } catch {
        /* link is best-effort; retried on next sign-in */
      }
    }
    return { ok: true, email: data?.user?.email || email };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function signIn(email, password) {
  if (!supabase) return { ok: false, error: 'offline' };
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true, email };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function signOut() {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }
}

export async function resetPassword(email) {
  if (!supabase) return { ok: false, error: 'offline' };
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function setNewPassword(password) {
  if (!supabase) return { ok: false, error: 'offline' };
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export function onAuthChange(cb) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event) => cb(event));
  return () => data?.subscription?.unsubscribe();
}

/* ---------- Room battles ---------- */

export const ROOM_COUNTS = [5, 10, 15, 20];

export const ROOM_MODES = ['mc', 'type', 'match', 'timed', 'reverse'];

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genCode(len = 6) {
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return out;
}

let modeColumnChecked = false;
let modeColumnExists = true;

async function roomModeSupported() {
  if (modeColumnChecked) return modeColumnExists;
  try {
    const { error } = await supabase.from('rooms').select('mode').limit(1);
    modeColumnExists = !error;
  } catch {
    modeColumnExists = true;
  }
  modeColumnChecked = true;
  return modeColumnExists;
}

let settingsColumnChecked = false;
let settingsColumnExists = true;

async function roomSettingsSupported() {
  if (settingsColumnChecked) return settingsColumnExists;
  try {
    const { error } = await supabase.from('rooms').select('settings').limit(1);
    settingsColumnExists = !error;
  } catch {
    settingsColumnExists = true;
  }
  settingsColumnChecked = true;
  return settingsColumnExists;
}

async function ensurePlayerRow() {
  const user = await ensurePlayer();
  if (!user) return null;
  try {
    await supabase.from('players').upsert(
      { id: user.id, name: savedName() || nicknameFor(user.id) },
      { onConflict: 'id' }
    );
  } catch {
    /* row may already exist */
  }
  return user;
}

export async function createRoom({ name, questionCount, mode = 'mc', countryIds, settings = {} }) {
  try {
    const user = await ensurePlayerRow();
    if (!user) return { ok: false, error: 'auth' };
    const payload = {
      code: genCode(),
      name: (name || '').trim() || 'Room',
      admin_id: user.id,
      question_count: questionCount,
      questions: countryIds || [],
    };
    if (await roomModeSupported()) payload.mode = mode;
    if (await roomSettingsSupported()) payload.settings = settings || {};
    const { data: room, error } = await supabase
      .from('rooms')
      .insert(payload)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    const { error: mErr } = await supabase.from('room_members').insert({
      room_id: room.id,
      player_id: user.id,
      name: savedName() || nicknameFor(user.id),
    });
    if (mErr) return { ok: false, error: mErr.message };
    return { ok: true, room };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function joinRoom(code) {
  try {
    const clean = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 4) return { ok: false, error: 'code' };
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', clean)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!room) return { ok: false, error: 'notfound' };
    const user = await ensurePlayerRow();
    if (!user) return { ok: false, error: 'auth' };
    const { error: mErr } = await supabase.from('room_members').upsert(
      { room_id: room.id, player_id: user.id, name: savedName() || nicknameFor(user.id) },
      { onConflict: 'room_id,player_id' }
    );
    if (mErr) return { ok: false, error: mErr.message };
    return { ok: true, room };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function getRoomById(id) {
  try {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function joinRoomById(roomId) {
  try {
    const user = await ensurePlayerRow();
    if (!user) return { ok: false, error: 'auth' };
    const { error } = await supabase.from('room_members').upsert(
      { room_id: roomId, player_id: user.id, name: savedName() || nicknameFor(user.id) },
      { onConflict: 'room_id,player_id' }
    );
    if (error) return { ok: false, error: error.message };
    const room = await getRoomById(roomId);
    if (!room) return { ok: false, error: 'notfound' };
    return { ok: true, room };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function updateRoom(id, patch) {
  try {
    const clean = { ...patch };
    if ('mode' in clean && !(await roomModeSupported())) delete clean.mode;
    if ('settings' in clean && !(await roomSettingsSupported())) delete clean.settings;
    const { error } = await supabase.from('rooms').update(clean).eq('id', id);
    return { ok: !error, error: error?.message };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function startRoom(roomId, questionCount, mode, countries, settings = {}) {
  const playable = mode === 'match'
    ? (countries || []).filter((c) => c.capital && c.capital !== c.name)
    : (countries || []);
  const pool = playable.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const ids = pool.slice(0, questionCount).map((c) => c.id);
  const patch = { status: 'playing', questions: ids, mode: ROOM_MODES.includes(mode) ? mode : 'mc' };
  if (settings && Object.keys(settings).length > 0) patch.settings = settings;
  return updateRoom(roomId, patch);
}

export async function setRoomScore(roomId, { score, correct, done = false }) {
  try {
    const user = await ensurePlayer();
    if (!user) return;
    await supabase
      .from('room_members')
      .update({ score, correct, done })
      .eq('room_id', roomId)
      .eq('player_id', user.id);
  } catch {
    /* silent — offline */
  }
}

export async function resetRound(roomId) {
  try {
    await supabase
      .from('room_members')
      .update({ done: false, score: 0, correct: 0 })
      .eq('room_id', roomId);
  } catch {
    /* silent */
  }
}

export function subscribeRoom(roomId, onChange) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
      (payload) => onChange('member', payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => onChange('room', payload.new)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
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
  const user = await ensurePlayer();
  if (!user) return { ok: true, name, offline: true };
  try {
    const res = await fetch('/api/name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: user.id, name }),
    });
    if (!res.ok) return { ok: true, name, offline: true };
    return { ok: true, name };
  } catch {
    return { ok: true, name, offline: true };
  } finally {
    supabase
      .from('room_members')
      .update({ name })
      .eq('player_id', user.id)
      .then(() => {})
      .catch(() => {});
  }
}

const NICKNAMES = ['Seeker', 'Nomad', 'Compass', 'Orbit', 'Voyager', 'Atlas', 'Falcon', 'Beacon', 'Zenith', 'Aurora', 'Drift', 'Pioneer'];

function nicknameFor(id) {
  const n = parseInt(id.slice(0, 8), 16) || 0;
  return `${NICKNAMES[n % NICKNAMES.length]}_${id.slice(0, 4)}`;
}

export async function syncXpRun({ mode, score, correct, total, detail, xp }) {
  if (!xp) return false;
  try {
    const user = await ensurePlayer();
    if (!user) return false;
    const res = await fetch('/api/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: user.id,
        name: savedName() || undefined,
        mode,
        score,
        correct,
        total,
        detail,
        xp,
      }),
    });
    return res.ok;
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
