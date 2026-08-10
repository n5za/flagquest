import { useGame } from '../state/GameContext.jsx';
import { BADGES } from '../data/badges.js';

export default function BadgesScreen({ go }) {
  const { progress } = useGame();
  const owned = new Set(progress.badges);
  const count = progress.badges.length;

  return (
    <div>
      <button className="back-btn" onClick={() => go('home')} aria-label="Back to home">
        ←
      </button>
      <h1 className="page-title">Badges</h1>
      <p className="dim">
        {count} of {BADGES.length} unlocked
      </p>
      <div className="badge-grid">
        {BADGES.map((b) => {
          const has = owned.has(b.id);
          return (
            <div key={b.id} className={`card badge ${has ? '' : 'locked'}`} title={has ? b.desc : 'Locked — keep playing to discover'}>
              <span className="badge-icon">{has ? b.icon : '🔒'}</span>
              <span className="badge-name">{has ? b.name : '???'}</span>
              <span className="badge-desc dim">{has ? b.desc : 'Keep playing to unlock'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
