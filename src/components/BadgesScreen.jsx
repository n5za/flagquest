import { useGame } from '../state/GameContext.jsx';
import { BADGES } from '../data/badges.js';
import Icon from './Icon.jsx';

export default function BadgesScreen({ go }) {
  const { progress, t } = useGame();
  const owned = new Set(progress.badges);
  const count = progress.badges.length;

  return (
    <div>
      <button className="back-btn" onClick={() => go('home')} aria-label={t('Back to home')}>
        <Icon name="arrowLeft" size={20} />
      </button>
      <h1 className="page-title">{t('Badges')}</h1>
      <p className="dim">
        {t('{a} of {b} unlocked', { a: count, b: BADGES.length })}
      </p>
      <div className="badge-grid">
        {BADGES.map((b) => {
          const has = owned.has(b.id);
          return (
            <div key={b.id} className={`card badge ${has ? '' : 'locked'}`} title={has ? t(b.desc) : t('Locked — keep playing to discover')}>
              <span className="badge-icon">{has ? <Icon name={b.icon} size={30} /> : <Icon name="lock" size={26} />}</span>
              <span className="badge-name">{has ? t(b.name) : '???'}</span>
              <span className="badge-desc dim">{has ? t(b.desc) : t('Keep playing to unlock')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
