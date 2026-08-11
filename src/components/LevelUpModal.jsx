import { useEffect } from 'react';
import { useGame } from '../state/GameContext.jsx';
import Mascot from './Mascot.jsx';
import { burst } from '../lib/confetti.js';

export default function LevelUpModal() {
  const { levelUp, dismissLevelUp, t } = useGame();
  useEffect(() => {
    if (levelUp) {
      burst(window.innerWidth / 2, window.innerHeight * 0.35, { count: 120, power: 7 });
    }
  }, [levelUp]);
  if (!levelUp) return null;
  return (
    <div className="modal-overlay" onClick={dismissLevelUp}>
      <div className="modal levelup-modal" role="dialog" aria-modal="true" aria-label={t('Level Up!')}>
        <Mascot mood="excited" size={110} />
        <h2>{t('Level Up!')}</h2>
        <p>{t('You reached level {to}', { to: levelUp.to })}</p>
        <p className="dim">
          {t('{from} → {to} · keep going!', { from: levelUp.from, to: levelUp.to })}
        </p>
        <button className="btn btn-primary" onClick={dismissLevelUp}>
          {t('Continue')}
        </button>
      </div>
    </div>
  );
}
