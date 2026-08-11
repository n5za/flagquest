import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import Icon from './Icon.jsx';
import ModeSettingsEditor from './ModeSettingsEditor.jsx';
import { MODES, defaultRoomSettings } from '../data/modes.js';
import {
  ROOM_COUNTS,
  ROOM_MODES,
  createRoom,
  joinRoom,
  joinRoomById,
  subscribeRoom,
  ensurePlayer,
  startRoom,
  supabase,
} from '../lib/supabase.js';

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function RoomScreen({ go, countries, joinCode, roomId }) {
  const { pushToast, t } = useGame();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState('mc');
  const [settings, setSettings] = useState(() => defaultRoomSettings('mc'));
  const [codeInput, setCodeInput] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [myId, setMyId] = useState(null);
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    ensurePlayer().then((user) => {
      if (alive) setMyId(user?.id || null);
    });
    if (joinCode) {
      setBusy(true);
      joinRoom(joinCode).then((res) => {
        setBusy(false);
        if (!alive) return;
        if (res.ok) setRoom(res.room);
        else pushToast(res.error === 'notfound' ? t('No room with that code.') : res.error === 'finished' ? t('That room already finished.') : t('Could not join the room.'));
      });
    } else if (roomId) {
      joinRoomById(roomId).then((res) => {
        if (!alive) return;
        if (res.ok) setRoom(res.room);
        else pushToast(t('Could not join the room.'));
      });
    }
    return () => {
      alive = false;
    };
  }, [joinCode, roomId, pushToast, t]);

  const refreshMembers = useCallback(async (roomId) => {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .order('score', { ascending: false });
      if (!error && data) setMembers(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!room) return;
    let alive = true;
    refreshMembers(room.id);
    const unsub = subscribeRoom(room.id, (kind, row) => {
      if (!alive) return;
      if (kind === 'member') {
        setMembers((prev) => {
          const rest = prev.filter((m) => m.player_id !== row.player_id);
          return [...rest, row].sort((a, b) => b.score - a.score);
        });
      } else if (kind === 'room') {
        setRoom((prev) => ({ ...prev, ...row }));
      }
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [room?.id, refreshMembers]);

  useEffect(() => {
    if (room?.status === 'playing' && !startedRef.current) {
      startedRef.current = true;
      go('room-quiz', { roomId: room.id });
    } else if (room?.status === 'lobby' || room?.status === 'finished') {
      startedRef.current = false;
    }
  }, [room?.status, room?.id, go]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await createRoom({
      name: roomName,
      questionCount: count,
      mode,
      settings,
      countryIds: shuffle(countries).slice(0, count).map((c) => c.id),
    });
    busyRef.current = false;
    setBusy(false);
    if (res.ok) go('room', { roomId: res.room.id });
    else pushToast(t('Could not create the room.'));
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const res = await joinRoom(codeInput);
    setBusy(false);
    if (res.ok) go('room', { roomId: res.room.id });
    else if (res.error === 'notfound') pushToast(t('No room with that code.'));
    else if (res.error === 'finished') pushToast(t('That room already finished.'));
    else pushToast(t('Could not join the room.'));
  };

  const shareUrl = room
    ? `${window.location.origin}/app?room=${room.code}`
    : '';

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: t('Join my FlagQuest room'), text: t('Room {code} — join me!', { code: room.code }), url: shareUrl });
        return;
      }
    } catch {
      /* cancelled */
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast(t('Copy the link: {url}', { url: shareUrl }));
    }
  };

  const isAdmin = myId && room?.admin_id === myId;
  const me = members.find((m) => m.player_id === myId);

  const start = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await startRoom(room.id, room.question_count, room.mode, countries);
    busyRef.current = false;
    setBusy(false);
    if (!res.ok) pushToast(t('Could not start the game.'));
  };

  if (!room) {
    return (
      <div>
        <button className="back-btn" onClick={() => go('home')} aria-label={t('Back to home')}>
          <Icon name="arrowLeft" size={20} />
        </button>
        <h1 className="page-title">
          <Icon name="users" size={24} /> {t('Room Battle')}
        </h1>
        <p className="dim">{t('Race your friends on the same flags — live scores, no login needed.')}</p>

        <form className="card room-form" onSubmit={handleCreate}>
          <h2 className="section-title">{t('Create a room')}</h2>
          <input
            className="room-input"
            placeholder={t('Room name (optional)')}
            value={roomName}
            maxLength={30}
            onChange={(e) => setRoomName(e.target.value)}
            aria-label={t('Room name')}
          />
          <div className="room-counts" role="radiogroup" aria-label={t('Question count')}>
            {ROOM_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={count === n}
                className={`room-count ${count === n ? 'active' : ''}`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="dim small">{t('Mode')}</p>
          <div className="room-modes" role="radiogroup" aria-label={t('Mode')}>
            {ROOM_MODES.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={mode === k}
                className={`room-mode ${mode === k ? 'active' : ''}`}
                style={{ ['--mode-color']: MODES[k].color }}
                onClick={() => {
                  setMode(k);
                  setSettings(defaultRoomSettings(k));
                }}
              >
                <Icon name={MODES[k].icon} size={16} /> {t(MODES[k].title)}
              </button>
            ))}
          </div>
          <ModeSettingsEditor mode={mode} settings={settings} onChange={setSettings} />
          <p className="dim small">{t("You'll be the admin — you pick the questions and start.")}</p>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? t('Creating…') : <>{t('Create room')}</>}
          </button>
        </form>

        <form className="card room-form" onSubmit={handleJoin}>
          <h2 className="section-title">{t('Join with code')}</h2>
          <input
            className="room-input"
            placeholder={t('e.g. AB12CD')}
            value={codeInput}
            maxLength={6}
            autoCapitalize="characters"
            onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            aria-label={t('Room code')}
          />
          <button className="btn btn-ghost" disabled={busy || codeInput.length < 4}>
            {busy ? t('Joining…') : <>{t('Join room')}</>}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <button className="back-btn" onClick={() => go('home')} aria-label={t('Leave room')}>
        <Icon name="arrowLeft" size={20} />
      </button>
      <h1 className="page-title">
        <Icon name="users" size={24} /> {room.name}
      </h1>

      <div className="card room-invite">
        <div className="room-code-block">
          <span className="room-code-label dim">{t('Room code')}</span>
          <span className="room-code">{room.code}</span>
        </div>
        <button className="btn btn-primary" onClick={share}>
          <Icon name="share" size={16} /> {copied ? t('Copied!') : t('Invite friends')}
        </button>
      </div>

      <h2 className="section-title">
        {t('Players ({n})', { n: members.length })}
        <span className="dim small"> · {t('live')}</span>
      </h2>
      <div className="lb-list">
        {members.map((m, i) => (
          <div key={m.player_id} className={`card lb-row cup-row ${m.player_id === myId ? 'you' : ''}`}>
            <span className="lb-rank">{i === 0 ? <Icon name="crown" size={20} style={{ color: '#ffc800' }} /> : `#${i + 1}`}</span>
            <div className="lb-main">
              <span className="lb-score">
                {m.name}
                {m.player_id === room.admin_id && <span className="you-badge">{t('Admin')}</span>}
                {m.player_id === myId && <span className="you-badge">{t('You')}</span>}
              </span>
              <span className="lb-detail dim">{m.done ? t('Finished ✓') : t('Playing…')}</span>
            </div>
            <span className="cup-xp">{t('{n} pts', { n: m.score })}</span>
          </div>
        ))}
      </div>

      <div className="card room-info">
        <span className="room-info-item">
          <Icon name={MODES[room.mode || 'mc'].icon} size={16} style={{ color: MODES[room.mode || 'mc'].color }} />
          {t(MODES[room.mode || 'mc'].title)}
        </span>
        <span className="room-info-item">
          <Icon name="target" size={16} /> {t('{n} questions', { n: room.question_count })}
        </span>
        <span className="room-info-item">
          <Icon name="users" size={16} /> {members.length}
        </span>
      </div>

      {isAdmin && (
        <div className="admin-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={start}
            disabled={busy || room.status !== 'lobby'}
          >
            <Icon name="play" size={18} /> {busy ? t('Starting…') : t('Start game')}
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => go('room-settings', { roomId: room.id })}>
            <Icon name="settings" size={18} /> {t('Room settings')}
          </button>
        </div>
      )}

      {!isAdmin && room.status === 'lobby' && (
        <p className="dim small room-waiting">{t('Waiting for the admin to start…')}</p>
      )}

      {me?.done && room.status === 'playing' && (
        <p className="dim small room-waiting">{t('You finished! Waiting for the others…')}</p>
      )}
    </div>
  );
}
