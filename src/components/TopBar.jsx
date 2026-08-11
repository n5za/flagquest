import { useGame } from '../state/GameContext.jsx';
import Mascot from './Mascot.jsx';
import Icon from './Icon.jsx';
import { levelFromXp } from '../lib/gameMath.js';

export default function TopBar({ go }) {
  const { progress, settings, setSetting, t } = useGame();
  const { level, pct } = levelFromXp(progress.totalXp);
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="icon-btn" onClick={() => go('home')} aria-label={t('Home')}>
          <Mascot mood="idle" size={38} />
        </button>
        <div className="level-chip" title={t('Level {l} — {xp} XP', { l: level, xp: progress.totalXp })}>
          <span className="level-num">{t('Lv {l}', { l: level })}</span>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="chip" title={t('Daily login streak')}>
          <Icon name="flame" size={15} />
          <span>{progress.dailyStreak}</span>
          {progress.freezes > 0 && (
            <span className="freeze-chip" title={t('Streak freezes')}>
              <Icon name="snowflake" size={12} /> {progress.freezes}
            </span>
          )}
        </div>
        <div className="chip xp-chip" title={t('Total XP')}>
          <Icon name="star" size={15} />
          <span>{progress.totalXp}</span>
        </div>
        <button
          className="icon-btn"
          onClick={() => setSetting('sound', !settings.sound)}
          aria-label={settings.sound ? t('Mute sounds') : t('Unmute sounds')}
        >
          {settings.sound ? <Icon name="volume2" size={19} /> : <Icon name="volumeX" size={19} />}
        </button>
        <button
          className="icon-btn"
          onClick={() => go('settings')}
          aria-label={t('Settings')}
        >
          <Icon name="gear" size={19} />
        </button>
        <button
          className="icon-btn"
          onClick={() => go('leaderboard')}
          aria-label={t('Leaderboard')}
        >
          <Icon name="trophy" size={19} />
        </button>
      </div>
    </header>
  );
}