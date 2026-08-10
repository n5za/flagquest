import { useGame } from '../state/GameContext.jsx';
import Mascot from './Mascot.jsx';
import Icon from './Icon.jsx';
import { levelFromXp } from '../lib/gameMath.js';

export default function TopBar({ go }) {
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
          <Icon name="flame" size={15} />
          <span>{progress.dailyStreak}</span>
          {progress.freezes > 0 && (
            <span className="freeze-chip" title="Streak freezes">
              <Icon name="snowflake" size={12} /> {progress.freezes}
            </span>
          )}
        </div>
        <div className="chip xp-chip" title="Total XP">
          <Icon name="star" size={15} />
          <span>{progress.totalXp}</span>
        </div>
        <button
          className="icon-btn"
          onClick={() => setSetting('sound', !settings.sound)}
          aria-label={settings.sound ? 'Mute sounds' : 'Unmute sounds'}
        >
          {settings.sound ? <Icon name="volume2" size={19} /> : <Icon name="volumeX" size={19} />}
        </button>
      </div>
    </header>
  );
}
