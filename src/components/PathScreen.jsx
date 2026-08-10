import { useGame } from '../state/GameContext.jsx';
import { CONTINENT_MAP } from '../data/continents.js';
import { MATCH_PAIRS } from '../data/modes.js';
import Icon from './Icon.jsx';

const STATE_CHIP = {
  new: { label: 'Not started', cls: 'chip-new' },
  learning: { label: 'Learning', cls: 'chip-learning' },
  mastered: { label: 'Mastered', cls: 'chip-mastered' },
};

export default function PathScreen({ countries, continentId, go }) {
  const { stateOf, continentMastery, settings } = useGame();
  const continent = CONTINENT_MAP[continentId];
  const list = countries.filter((c) => c.continent === continentId);
  const mastery = continentMastery(continentId);
  const masteredCount = list.filter((c) => stateOf(c.id) === 'mastered').length;
  const scope = { type: 'continent', id: continentId };
  const free = !settings.pathMode;

  return (
    <div>
        <button className="back-btn" onClick={() => go('home')} aria-label="Back to home">
          <Icon name="arrowLeft" size={20} />
        </button>
      <section className="hero card" style={{ borderTop: `6px solid ${continent.color}` }}>
        <div className="hero-text">
          <h1>
            <Icon name={continent.icon} size={26} /> {continent.id}
          </h1>
          <p className="dim">
            {masteredCount} of {list.length} countries mastered
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
        <button className="btn btn-green" onClick={() => go('quiz', { mode: 'mc', scope })}>
          <Icon name="target" size={17} /> Start Path Quiz
        </button>
        <button className="btn btn-purple" onClick={() => go('quiz', { mode: 'reverse', scope })}>
          <Icon name="repeat" size={17} /> Reverse Quiz
        </button>
        <button className="btn btn-blue" onClick={() => go('match', { scope })}>
          <Icon name="puzzle" size={17} /> Capital Match
        </button>
        <button className="btn btn-red" onClick={() => go('quiz', { mode: 'timed', scope })}>
          <Icon name="timer" size={17} /> Sprint
        </button>
      </div>

      {free && (
        <p className="dim note">Free mode is on — this path is also available for free play.</p>
      )}

      <h2 className="section-title">Countries</h2>
      <div className="country-grid">
        {list.map((c) => {
          const state = stateOf(c.id);
          const chip = STATE_CHIP[state];
          return (
            <button
              key={c.id}
              className="card country-card"
              onClick={() => go('quiz', { mode: 'mc', scope: { type: 'country', id: c.id } })}
            >
              <img className="flag-mini" src={c.flag} alt={`Flag of ${c.name}`} loading="lazy" />
              <span className="country-name">{c.name}</span>
              <span className={`state-chip ${chip.cls}`}>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
