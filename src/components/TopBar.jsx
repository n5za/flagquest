import { useGame } from '../state/GameContext.jsx';
import Mascot from './Mascot.jsx';
import { levelFromXp } from '../lib/gameMath.js';

export default function TopBar({ go, offline }) {
  const { progress, settings, setSetting } = useGame();
  const { level, pct } = levelFromXp(progress.totalXp);
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="icon-btn" onClick={() => go('home')} aria-label="Home">
          <Mascot mood="idle" size={38} />
        </button>
        <div className="level-chip" title={`Level ${level} — ${progress.totalXp} XP`}>
          <span className="level-num">Lv {level}</span>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="chip" title="Daily login streak">
          <span className="flame">🔥</span>
          <span>{progress.dailyStreak}</span>
          {progress.freezes > 0 && (
            <span className="freeze-chip" title="Streak freezes">
              ❄️ {progress.freezes}
            </span>
          )}
        </div>
        <div className="chip xp-chip" title="Total XP">
          <span>⭐</span>
          <span>{progress.totalXp}</span>
        </div>
        <button
          className="icon-btn"
          onClick={() => setSetting('sound', !settings.sound)}
          aria-label={settings.sound ? 'Mute sounds' : 'Unmute sounds'}
        >
          {settings.sound ? '🔊' : '🔇'}
        </button>
        {offline && (
          <span className="chip offline-chip" title="Using cached data — you are offline">
            📴
          </span>
        )}
      </div>
    </header>
  );
}
