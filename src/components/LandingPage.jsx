import Icon from './Icon.jsx';
import { MODES } from '../data/modes.js';

const MODE_CARDS = [
  { key: 'mc', blurb: 'Pick the right country for each flag' },
  { key: 'type', blurb: 'Spell the country name, letter by letter' },
  { key: 'match', blurb: 'Pair every capital with its flag' },
  { key: 'timed', blurb: '60 seconds. Max correct. Go.' },
  { key: 'reverse', blurb: 'See the name — find the flag' },
  { key: 'challenge', blurb: 'The same 10 flags for everyone, daily' },
];

export default function LandingPage() {
  const play = () => {
    window.location.href = '/app';
  };

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-icon">
            <Icon name="globe" size={22} />
          </span>
          FlagQuest
        </div>
        <button className="btn btn-primary" onClick={play}>
          Play now
        </button>
      </header>

      <section className="landing-hero">
        <p className="landing-eyebrow">Flags · Capitals · Countries</p>
        <h1 className="landing-title">
          Master the world's <span className="landing-flag">flags</span> —{' '}
          <span className="landing-grade">the fun way</span>
        </h1>
        <p className="landing-sub">
          190+ countries, 6 game modes, and a global XP World Cup ladder. No account, no
          signup — just start playing.
        </p>
        <div className="landing-cta">
          <button className="btn btn-primary btn-lg" onClick={play}>
            <Icon name="play" size={18} /> Start playing — it's free
          </button>
        </div>
        <div className="landing-stats">
          <div className="landing-stat">
            <span className="landing-stat-num">190+</span>
            <span className="landing-stat-label">countries</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-num">6</span>
            <span className="landing-stat-label">game modes</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-num">∞</span>
            <span className="landing-stat-label">XP to climb</span>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-h2">Pick your mode</h2>
        <div className="landing-grid">
          {MODE_CARDS.map(({ key, blurb }) => (
            <div key={key} className="card landing-mode">
              <span className="landing-mode-icon" style={{ color: MODES[key].color }}>
                <Icon name={MODES[key].icon} size={22} />
              </span>
              <div>
                <h3 className="landing-mode-title">{MODES[key].title}</h3>
                <p className="dim small">{blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-ladder">
        <div className="landing-ladder-card">
          <span className="cup-trophy">
            <Icon name="trophy" size={26} />
          </span>
          <div>
            <h2 className="landing-h2">XP World Cup</h2>
            <p className="dim">
              Every run earns XP, synced live from the cloud. Compete on the global
              leaderboard — no login needed, you're in the ladder the moment you play.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-h2">How it works</h2>
        <div className="landing-steps">
          <div className="landing-step">
            <span className="landing-step-num">1</span>
            <p className="landing-step-text">Pick a mode and answer flag questions</p>
          </div>
          <div className="landing-step">
            <span className="landing-step-num">2</span>
            <p className="landing-step-text">Earn XP and climb the World Cup ladder</p>
          </div>
          <div className="landing-step">
            <span className="landing-step-num">3</span>
            <p className="landing-step-text">Come back daily — the challenge never repeats</p>
          </div>
        </div>
      </section>

      <section className="landing-final-cta">
        <h2 className="landing-h2">Ready to start?</h2>
        <button className="btn btn-primary btn-lg" onClick={play}>
          <Icon name="play" size={18} /> Play FlagQuest
        </button>
      </section>

      <footer className="landing-footer">
        <span>FlagQuest — free, offline-friendly, no signup.</span>
        <span className="dim small">
          Powered by a global XP ladder · <a href="/sitemap.xml">sitemap</a>
        </span>
      </footer>
    </div>
  );
}
