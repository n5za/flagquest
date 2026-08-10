import { useEffect, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { MODES } from '../data/modes.js';
import { fetchGlobalLadder } from '../lib/supabase.js';
import ConfirmModal from './ConfirmModal.jsx';
import Icon from './Icon.jsx';

const CUP_COLORS = ['#ffc800', '#c9ccd4', '#cd7f32'];

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function LeaderboardScreen({ go }) {
  const { leaderboards, clearLeaderboards } = useGame();
  const [tab, setTab] = useState('mc');
  const [confirming, setConfirming] = useState(false);
  const [global, setGlobal] = useState(null);
  const sessions = leaderboards[tab] || [];

  useEffect(() => {
    let alive = true;
    fetchGlobalLadder().then((rows) => {
      if (alive && rows) setGlobal(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  const allSessions = Object.entries(leaderboards)
    .flatMap(([mode, list]) => (list || []).map((s) => ({ mode, ...s })))
    .sort((a, b) => (b.xp ?? b.score) - (a.xp ?? a.score) || a.time - b.time)
    .slice(0, 5);

  const localTotal = allSessions.reduce((acc, s) => acc + (s.xp ?? s.score), 0);
  const globalTotal = global ? global.reduce((acc, p) => acc + p.xp, 0) : 0;

  const rows = global || allSessions.map((s) => ({ local: true, xp: s.xp ?? s.score, detail: `${MODES[s.mode]?.title || s.mode} · ${s.detail}` }));

  return (
    <div>
      <button className="back-btn" onClick={() => go('home')} aria-label="Back to home">
        <Icon name="arrowLeft" size={20} />
      </button>
      <h1 className="page-title">
        <Icon name="globe" size={24} /> Leaderboard
      </h1>
      <p className="dim">
        {global ? 'Live ladder, synced from the cloud — no login needed.' : 'Top runs on this device — stored in cache, no login needed.'}
      </p>

      <section className="cup-section">
        <div className="cup-head">
          <span className="cup-trophy">
            <Icon name="trophy" size={26} />
          </span>
          <div className="cup-head-text">
            <h2 className="section-title">XP World Cup</h2>
            <p className="dim small">
              {global
                ? `Global top players · ${globalTotal} XP on the board`
                : `Your best XP runs · ${localTotal} XP total`}
            </p>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="card empty-state">
            <p>No runs yet.</p>
            <p className="dim">Play any mode and your top XP runs will climb the ladder!</p>
          </div>
        ) : (
          <div className="lb-list">
            {rows.map((p, i) => (
              <div key={`${p.id || i}`} className={`card lb-row cup-row ${i === 0 ? 'top' : ''}`}>
                <span className="lb-rank">
                  {i < 3 ? (
                    <Icon name="trophy" size={22} style={{ color: CUP_COLORS[i] }} />
                  ) : (
                    `#${i + 1}`
                  )}
                </span>
                <div className="lb-main">
                  <span className="lb-score">
                    {p.local ? <Icon name={MODES[p.mode]?.icon || 'target'} size={13} /> : null}
                    {p.local ? MODES[p.mode]?.title : p.name}
                  </span>
                  <span className="lb-detail dim">{p.local ? p.detail : 'FlagQuest player'}</span>
                </div>
                <span className="cup-xp">+{p.xp} XP</span>
                {!p.local && p.date && <span className="lb-date dim">{fmtDate(p.date)}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <h2 className="section-title">By Mode</h2>
      <div className="lb-tabs" role="tablist">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={`lb-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon name={m.icon} size={15} /> {m.title}
          </button>
        ))}
      </div>

      {sessions.length === 0 ? (
        <div className="card empty-state">
          <p>No sessions yet in this mode.</p>
          <p className="dim">Play a round and your best runs will show up here!</p>
        </div>
      ) : (
        <div className="lb-list">
          {sessions.map((s, i) => (
            <div key={`${s.date}-${i}`} className={`card lb-row ${i === 0 ? 'top' : ''}`}>
              <span className="lb-rank">
                {i < 3 ? (
                  <Icon name="medal" size={22} style={{ color: CUP_COLORS[i] }} />
                ) : (
                  `#${i + 1}`
                )}
              </span>
              <div className="lb-main">
                <span className="lb-score">{s.score}</span>
                <span className="lb-detail dim">{s.detail}</span>
              </div>
              <span className="lb-date dim">{fmtDate(s.date)}</span>
            </div>
          ))}
        </div>
      )}

      {sessions.length > 0 && (
        <button className="btn btn-ghost danger-text" onClick={() => setConfirming(true)}>
          <Icon name="trash" size={16} /> Clear leaderboard
        </button>
      )}

      {confirming && (
        <ConfirmModal
          title="Clear leaderboard?"
          body="This removes all saved sessions for every mode on this device."
          confirmLabel="Clear"
          danger
          onConfirm={() => {
            clearLeaderboards();
            setConfirming(false);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
