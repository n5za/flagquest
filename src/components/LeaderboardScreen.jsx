import { useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { MODES } from '../data/modes.js';
import ConfirmModal from './ConfirmModal.jsx';
import Icon from './Icon.jsx';

const MEDAL_COLORS = ['#ffc800', '#c9ccd4', '#cd7f32'];

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
  const sessions = leaderboards[tab] || [];

  return (
    <div>
      <button className="back-btn" onClick={() => go('home')} aria-label="Back to home">
        <Icon name="arrowLeft" size={20} />
      </button>
      <h1 className="page-title">Leaderboard</h1>
      <p className="dim">Top 5 sessions per mode, stored on this device.</p>

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
                  <Icon name="medal" size={22} style={{ color: MEDAL_COLORS[i] }} />
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
