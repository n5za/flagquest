import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { getRoomById, subscribeRoom, resetRound, startRoom, ensurePlayer, supabase } from '../lib/supabase.js';
import { useGame } from '../state/GameContext.jsx';

export default function RoomResultsScreen({ roomId, countries, go }) {
  const { pushToast, t } = useGame();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [myId, setMyId] = useState(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    ensurePlayer().then((u) => {
      if (alive) setMyId(u?.id || null);
    });
    getRoomById(roomId).then((r) => {
      if (alive && r) setRoom(r);
    });
    supabase
      .from('room_members')
      .select('*')
      .eq('room_id', roomId)
      .order('score', { ascending: false })
      .then(({ data, error }) => {
        if (alive && !error && data) setMembers(data);
      });
    const unsub = subscribeRoom(roomId, (kind, row) => {
      if (!alive) return;
      if (kind === 'member') {
        setMembers((prev) => {
          const rest = prev.filter((m) => m.player_id !== row.player_id);
          return [...rest, row].sort((a, b) => b.score - a.score);
        });
      } else if (kind === 'room') {
        setRoom((prev) => ({ ...prev, ...row }));
        if (row.status === 'playing') {
          finishedRef.current = false;
          go('room-quiz', { roomId });
        }
      }
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [roomId, go]);

  if (!room) {
    return (
      <div className="screen-pad">
        <div className="card empty-state"><p>{t('Loading results…')}</p></div>
      </div>
    );
  }

  const sorted = [...members].sort((a, b) => b.score - a.score);
  const allDone = members.length > 0 && members.every((m) => m.done);
  const isAdmin = myId === room.admin_id;
  const me = members.find((m) => m.player_id === myId);
  const myRank = sorted.findIndex((m) => m.player_id === myId) + 1;

  return (
    <div className="screen-pad">
      <h1 className="page-title">
        <Icon name="trophy" size={24} /> {t('{name} — results', { name: room.name })}
      </h1>
      {!allDone && (
        <p className="dim">{t('Live standings — waiting for the others to finish…')}</p>
      )}
      {allDone && room.status !== 'finished' && <p className="dim">{t("Everyone's done! Admin can start the next round.")}</p>}

      <div className="lb-list">
        {sorted.map((m, i) => (
          <div key={m.player_id} className={`card lb-row cup-row ${i === 0 ? 'top' : ''} ${m.player_id === myId ? 'you' : ''}`}>
            <span className="lb-rank">
              {i < 3 ? (
                <Icon name="trophy" size={22} style={{ color: ['#ffc800', '#c9ccd4', '#cd7f32'][i] }} />
              ) : (
                `#${i + 1}`
              )}
            </span>
            <div className="lb-main">
              <span className="lb-score">
                {m.name}
                {m.player_id === myId && <span className="you-badge">{t('You')}</span>}
              </span>
              <span className="lb-detail dim">
                {t('{n} correct · {status}', { n: m.correct, status: m.done ? t('finished') : t('playing…') })}
              </span>
            </div>
            <span className="cup-xp">{t('{n} pts', { n: m.score })}</span>
          </div>
        ))}
      </div>

      {me && (
        <div className="card empty-state">
          <p className="landing-stat-num">#{myRank || sorted.length}</p>
          <p className="dim">{t('your rank this round')}</p>
        </div>
      )}

      {isAdmin && (
        <button
          className="btn btn-primary btn-lg"
          disabled={!allDone && room.status === 'playing'}
          onClick={async () => {
            await resetRound(roomId);
            const res = await startRoom(roomId, room.question_count, room.mode, countries);
            if (!res.ok) pushToast(t('Could not start next round.'));
          }}
        >
          <Icon name="repeat" size={18} /> {t('Next round')}
        </button>
      )}
      {!isAdmin && room.status === 'playing' && (
        <p className="dim small room-waiting">{t('Waiting for the admin to start the next round…')}</p>
      )}

      <button className="btn btn-ghost" onClick={() => go('home')}>
        <Icon name="arrowLeft" size={16} /> {t('Leave room')}
      </button>
    </div>
  );
}
