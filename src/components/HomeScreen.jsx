import { useGame } from '../state/GameContext.jsx';
import { MODES, CHALLENGE_BONUS } from '../data/modes.js';
import { CONTINENTS, UNLOCK_MASTERY } from '../data/continents.js';
import { BADGES } from '../data/badges.js';
import { levelFromXp, todayKey } from '../lib/gameMath.js';
import Mascot from './Mascot.jsx';
import Icon from './Icon.jsx';

function scopeFor(mode) {
  return { type: 'free' };
}

export default function HomeScreen({ countries, go }) {
  const { progress, settings, leaderboards, continentMastery, t } = useGame();
  const { level, pct } = levelFromXp(progress.totalXp);
  const daily = progress.daily;
  const challengeDone = daily?.date === todayKey();

  const pathLocked = (order) => {
    if (!settings.pathMode || order === 0) return false;
    const prev = CONTINENTS.find((c) => c.order === order - 1);
    return continentMastery(prev.id) < UNLOCK_MASTERY;
  };

  return (
    <div className="home">
      <section className="hero card">
        <Mascot mood="happy" size={84} />
        <div className="hero-text">
          <h1>FlagQuest</h1>
          <p className="dim">
            {progress.totalXp === 0
              ? t('Master the flags of the world — one answer at a time.')
              : t('Level {l} · {pct}% to level {next}', { l: level, pct, next: level + 1 })}
          </p>
        </div>
      </section>

      <section>
        <div className="nav-grid">
          <button className="card nav-card nav-card-small" onClick={() => go('badges')}>
            <span className="nav-icon nav-icon-small">
              <Icon name="award" size={16} />
            </span>
            <div>
              <span className="nav-name">{t('Badges')}</span>
            </div>
          </button>
          <button className="card nav-card nav-card-small" onClick={() => go('leaderboard')}>
            <span className="nav-icon nav-icon-small">
              <Icon name="trophy" size={16} />
            </span>
            <div>
              <span className="nav-name">{t('Leaderboard')}</span>
            </div>
          </button>
          <button className="card nav-card nav-card-small" onClick={() => go('settings')}>
            <span className="nav-icon nav-icon-small">
              <Icon name="settings" size={16} />
            </span>
            <div>
              <span className="nav-name">{t('Settings')}</span>
            </div>
          </button>
        </div>
      </section>

      <section>
        <button
          className={`card challenge-card ${challengeDone ? 'done' : ''}`}
          onClick={() =>
            !challengeDone && go('quiz', { mode: 'challenge', scope: { type: 'challenge' } })
          }
        >
          <span className="challenge-emoji">
            <Icon name="calendar" size={26} />
          </span>
          <span className="challenge-main">
            <span className="challenge-title">
              {t('Daily Challenge')}
              <span className="challenge-tag tag">{t('+{bonus} bonus XP', { bonus: CHALLENGE_BONUS })}</span>
            </span>
            <span className="challenge-desc">
              {challengeDone
                ? t('Done! {correct}/{total} · +{xp} XP — come back tomorrow', { correct: daily.correct, total: daily.total, xp: daily.xp })
                : t('10 questions · same for everyone · one shot per day')}
            </span>
          </span>
          <span className="challenge-cta">
            {challengeDone ? <><Icon name="check" size={14} /> {t('Done')}</> : <><Icon name="play" size={14} /> {t('Play')}</>}
          </span>
        </button>
      </section>

      <section>
        <button
          className="card challenge-card"
          onClick={() => go('room')}
        >
          <span className="challenge-emoji">
            <Icon name="users" size={26} />
          </span>
          <span className="challenge-main">
            <span className="challenge-title">
              {t('Room Battle')}
              <span className="challenge-tag tag">{t('Multiplayer')}</span>
            </span>
            <span className="challenge-desc">
              {t('Create a room, share the code, and race your friends — live scores on the same flags.')}
            </span>
          </span>
          <span className="challenge-cta">
            <><Icon name="play" size={14} /> {t('Play')}</>
          </span>
        </button>
      </section>

      <section>
        <h2 className="section-title">{t('Game Modes')}</h2>
        <div className="mode-grid">
          {Object.entries(MODES)
            .filter(([key]) => key !== 'challenge' && key !== 'room')
            .map(([key, m]) => {
            const best = leaderboards[key]?.[0];
            return (
              <button
                key={key}
                className="card mode-card"
                style={{ ['--mode-color']: m.color }}
                onClick={() => go('quiz', { mode: key, scope: scopeFor(key) })}
              >
                <span className="mode-icon">
                  <Icon name={m.icon} size={32} />
                </span>
                <span className="mode-name">{t(m.title)}</span>
                <span className="mode-desc">{t(m.desc)}</span>
                {best && <span className="mode-best"><Icon name="trophy" size={13} /> {best.score}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="section-title">
          {t('Learning Paths')}{' '}
          {!settings.pathMode && <span className="tag tag-free">{t('Free mode')}</span>}
        </h2>
        <div className="path-grid">
          {[...CONTINENTS].sort((a, b) => a.order - b.order).map((cont) => {
            const locked = pathLocked(cont.order);
            const mastery = continentMastery(cont.id);
            const count = countries.filter((c) => c.continent === cont.id).length;
            const prev = CONTINENTS.find((c) => c.order === cont.order - 1);
            return (
              <button
                key={cont.id}
                className={`card path-card ${locked ? 'locked' : ''}`}
                onClick={() => !locked && go('path', { continentId: cont.id })}
              >
                <div className="path-emoji" style={{ background: `${cont.color}22` }}>
                  {locked ? <Icon name="lock" size={22} /> : <Icon name={cont.icon} size={26} />}
                </div>
                <div className="path-info">
                  <span className="path-name">{t(cont.id)}</span>
                  <div className="progress-row">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.round(mastery * 100)}%`, background: cont.color }}
                      />
                    </div>
                    <span className="progress-pct">{Math.round(mastery * 100)}%</span>
                  </div>
                  <span className="path-count dim">{t('{count} countries', { count })}</span>
                  {locked && (
                    <span className="path-lock-note">
                      {t('Reach {pct}% in {name} to unlock', { pct: Math.round(UNLOCK_MASTERY * 100), name: t(prev.id) })}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}