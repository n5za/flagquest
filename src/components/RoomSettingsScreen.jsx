import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import Icon from './Icon.jsx';
import { MODES } from '../data/modes.js';
import {
  ROOM_COUNTS,
  ROOM_MODES,
  joinRoomById,
  startRoom,
  resetRound,
  updateRoom,
  subscribeRoom,
  ensurePlayer,
  supabase,
} from '../lib/supabase.js';

export default function RoomSettingsScreen({ roomId, countries, go }) {
  const { pushToast, t } = useGame();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [myId, setMyId] = useState(null);
  const startedRef = useRef(false);

  const refreshMembers = useCallback(async () => {
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
  }, [roomId]);

  useEffect(() => {
    let alive = true;
    ensurePlayer().then((u) => {
      if (alive) setMyId(u?.id || null);
    });
    joinRoomById(roomId).then((res) => {
      if (!alive) return;
      if (res.ok) {
        setRoom(res.room);
        setName(res.room.name);
      } else if (res.error === 'notfound') {
        go('room');
      }
    });
    refreshMembers();
    const unsub = subscribeRoom(roomId, (kind, row) => {
      if (!alive) return;
      if (kind === 'room') {
        setRoom((prev) => {
          const next = { ...prev, ...row };
          if (row.name && row.name !== prev?.name) setName(row.name);
          return next;
        });
      } else if (kind === 'member') {
        setMembers((prev) => {
          const rest = prev.filter((m) => m.player_id !== row.player_id);
          return [...rest, row].sort((a, b) => b.score - a.score);
        });
      }
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [roomId, go, refreshMembers]);

  useEffect(() => {
    if (room?.status === 'playing' && !startedRef.current) {
      startedRef.current = true;
      go('room-quiz', { roomId: room.id });
    } else if (room?.status === 'lobby' || room?.status === 'finished') {
      startedRef.current = false;
    }
  }, [room?.status, room?.id, go]);

  useEffect(() => {
    if (myId && room && myId !== room.admin_id) {
      go('room', { roomId });
    }
  }, [myId, room, roomId, go]);

  if (!room) {
    return (
      <div className="screen-pad">
        <div className="card empty-state"><p>{t('Loading room…')}</p></div>
      </div>
    );
  }

  const isAdmin = myId && room.admin_id === myId;

  const saveName = async () => {
    const clean = name.trim();
    if (!clean || clean === room.name) return;
    setSavingName(true);
    const res = await updateRoom(room.id, { name: clean });
    setSavingName(false);
    if (res.ok) pushToast(t('Saved!'));
    else pushToast(t('Could not update.'));
  };

  const start = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await startRoom(room.id, room.question_count, room.mode, countries);
    busyRef.current = false;
    setBusy(false);
    if (!res.ok) pushToast(t('Could not start the game.'));
  };

  return (
    <div className="screen-pad">
      <button className="back-btn" onClick={() => go('room', { roomId })} aria-label={t('Back to room')}>
        <Icon name="arrowLeft" size={20} />
      </button>
      <h1 className="page-title">
        <Icon name="settings" size={24} /> {t('Room settings')}
      </h1>

      <div className="card room-form">
        <h2 className="section-title">{t('Room name')}</h2>
        <div className="room-name-row">
          <input
            className="room-input"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            aria-label={t('Room name')}
          />
          <button className="btn btn-ghost" onClick={saveName} disabled={savingName || !name.trim() || name.trim() === room.name}>
            {savingName ? t('Saving…') : t('Save')}
          </button>
        </div>
      </div>

      <div className="card room-form">
        <h2 className="section-title">{t('Questions per round')}</h2>
        <div className="room-counts" role="radiogroup" aria-label={t('Question count')}>
          {ROOM_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={room.question_count === n}
              className={`room-count ${room.question_count === n ? 'active' : ''}`}
              disabled={room.status === 'playing'}
              onClick={async () => {
                const res = await updateRoom(room.id, { question_count: n });
                if (!res.ok) pushToast(t('Could not update.'));
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="card room-form">
        <h2 className="section-title">{t('Mode')}</h2>
        <div className="room-modes" role="radiogroup" aria-label={t('Mode')}>
          {ROOM_MODES.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={(room.mode || 'mc') === k}
              className={`room-mode ${(room.mode || 'mc') === k ? 'active' : ''}`}
              style={{ ['--mode-color']: MODES[k].color }}
              disabled={room.status === 'playing'}
              onClick={async () => {
                const res = await updateRoom(room.id, { mode: k });
                if (!res.ok) pushToast(t('Could not update.'));
              }}
            >
              <Icon name={MODES[k].icon} size={16} /> {t(MODES[k].title)}
            </button>
          ))}
        </div>
      </div>

      {room.status === 'finished' && (
        <button
          className="btn btn-ghost"
          onClick={async () => {
            await resetRound(room.id);
            await updateRoom(room.id, { status: 'lobby' });
          }}
        >
          <Icon name="repeat" size={16} /> {t('Play another round')}
        </button>
      )}

      <button className="btn btn-primary btn-lg" disabled={members.length < 1 || busy} onClick={start}>
        <Icon name="play" size={18} /> {t('Start game')}
      </button>

      <p className="dim small room-waiting">{t("You'll be the admin — you pick the questions and start.")}</p>
    </div>
  );
}