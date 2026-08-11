import { useGame } from '../state/GameContext.jsx';
import { CONTINENT_MAP } from '../data/continents.js';
import { MATCH_PAIRS } from '../data/modes.js';
import Icon from './Icon.jsx';

const STATE_CHIP_KEYS = {
  new: { key: 'Not started', cls: 'chip-new' },
  learning: { key: 'Learning', cls: 'chip-learning' },
  mastered: { key: 'Mastered', cls: 'chip-mastered' },
};

export default function PathScreen({ countries, continentId, go }) {
  const { stateOf, continentMastery, settings, t } = useGame();
  const continent = CONTINENT_MAP[continentId];
  const list = countries.filter((c) => c.continent === continentId);
  const mastery = continentMastery(continentId);
  const masteredCount = list.filter((c) => stateOf(c.id) === 'mastered').length;
  const scope = { type: 'continent', id: continentId };
  const free = !settings.pathMode;

  return (
    <div>
        <button className="back-btn" onClick={() => go('home')} aria-label={t('Back to home')}>
          <Icon name="arrowLeft" size={20} />
        </button>
      <section className="hero card" style={{ borderTop: `6px solid ${continent.color}` }}>
        <div className="hero-text">
          <h1>
            <Icon name={continent.icon} size={26} /> {t(continent.id)}
          </h1>
          <p className="dim">
            {t('{done} of {total} countries mastered', { done: masteredCount, total: list.length })}
          </p>
          <div className="progress-row big">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.round(mastery * 100)}%`, background: continent.color }}
              />
            </div>
            <span className="progress-pct">{Math.round(mastery * 100)}%</span>
          </div>
        </div>
      </section>

      <div className="path-actions">
        <button className="btn btn-primary" onClick={() => go('quiz', { mode: 'mc', scope })}>
          <Icon name="target" size={17} /> {t('Start Path Quiz')}
        </button>
        <button className="btn btn-purple" onClick={() => go('quiz', { mode: 'reverse', scope })}>
          <Icon name="repeat" size={17} /> {t('Reverse Quiz')}
        </button>
        <button className="btn btn-blue" onClick={() => go('match', { scope })}>
          <Icon name="puzzle" size={17} /> {t('Capital Match')}
        </button>
        <button className="btn btn-red" onClick={() => go('quiz', { mode: 'timed', scope })}>
          <Icon name="timer" size={17} /> {t('Sprint')}
        </button>
      </div>

      {free && (
        <p className="dim note">{t('Free mode is on — this path is also available for free play.')}</p>
      )}

      <h2 className="section-title">{t('Countries')}</h2>
      <div className="country-grid">
        {list.map((c) => {
          const state = stateOf(c.id);
          const chip = STATE_CHIP_KEYS[state];
          return (
            <button
              key={c.id}
              className="card country-card"
              onClick={() => go('quiz', { mode: 'mc', scope: { type: 'country', id: c.id } })}
            >
              <img className="flag-mini" src={c.flag} alt={t('Flag of {name}', { name: c.name })} loading="lazy" />
              <span className="country-name">{c.name}</span>
              <span className={`state-chip ${chip.cls}`}>{t(chip.key)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}