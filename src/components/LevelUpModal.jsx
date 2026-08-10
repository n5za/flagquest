import { useEffect } from 'react';
import { useGame } from '../state/GameContext.jsx';
import Mascot from './Mascot.jsx';
import { burst } from '../lib/confetti.js';

export default function LevelUpModal() {
  const { levelUp, dismissLevelUp } = useGame();
  useEffect(() => {
    if (levelUp) {
      burst(window.innerWidth / 2, window.innerHeight * 0.35, { count: 120, power: 7 });
    }
  }, [levelUp]);
  if (!levelUp) return null;
  return (
    <div className="modal-overlay" onClick={dismissLevelUp}>
      <div className="modal levelup-modal" role="dialog" aria-modal="true" aria-label="Level up">
        <Mascot mood="excited" size={110} />
        <h2>Level Up!</h2>
        <p>
          You reached level <strong>{levelUp.to}</strong>
        </p>
        <p className="dim">
          {levelUp.from} → {levelUp.to} · keep going!
        </p>
        <button className="btn btn-green" onClick={dismissLevelUp}>
          Continue
        </button>
      </div>
    </div>
  );
}
