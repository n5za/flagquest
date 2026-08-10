import { useEffect } from 'react';
import { useGame } from '../state/GameContext.jsx';
import Ring from './Ring.jsx';
import Mascot from './Mascot.jsx';
import Icon from './Icon.jsx';
import { burst } from '../lib/confetti.js';

export default function ResultsScreen({ params, go }) {
  const { progress } = useGame();
  const acc = params.total > 0 ? Math.round((params.correct / params.total) * 100) : 0;
  const perfect = acc === 100 && params.total > 0;

  useEffect(() => {
    if (perfect) {
      burst(window.innerWidth / 2, window.innerHeight * 0.4, { count: 130, power: 7 });
    }
  }, [perfect]);

  const color = acc >= 80 ? '#58cc02' : acc >= 50 ? '#ffc800' : '#ff4b4b';

  return (
    <div className="results">
      <section className="card results-hero">
        <Mascot mood={acc >= 60 ? 'happy' : 'sad'} size={90} />
        <h1 className="results-title">{perfect ? 'Perfect round!' : acc >= 60 ? 'Great job!' : 'Keep going!'}</h1>
        <p className="dim">{params.title}{params.scope?.type === 'continent' ? ` · ${params.scope.id}` : ''}</p>
        <Ring pct={acc} color={color} size={130} />
        {params.isNewBest && params.score > 0 && (
          <span className="tag tag-new-best">
            <Icon name="trophy" size={13} /> New best!
          </span>
        )}
      </section>

      <section className="results-stats">
        <div className="card stat">
          <span className="stat-num">{params.correct}/{params.total}</span>
          <span className="stat-label dim">Correct</span>
        </div>
        <div className="card stat">
          <span className="stat-num green">+{params.xp} XP</span>
          <span className="stat-label dim">Earned</span>
        </div>
        <div className="card stat">
          <span className="stat-num"><Icon name="flame" size={17} /> {params.bestStreak}</span>
          <span className="stat-label dim">Best streak</span>
        </div>
        {params.isTimed && (
          <div className="card stat">
            <span className="stat-num blue">{params.score}</span>
            <span className="stat-label dim">Score</span>
          </div>
        )}
      </section>

      <section className="results-actions">
        {params.isChallenge ? (
          <button className="btn btn-ghost" disabled>
            <Icon name="calendar" size={18} /> Come back tomorrow
          </button>
        ) : (
          <button
            className="btn btn-green"
            onClick={() => go('quiz', { mode: params.mode, scope: params.scope })}
          >
            <Icon name="play" size={17} /> Play again
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => go('home')}>
          <Icon name="home" size={18} /> Home
        </button>
      </section>

      {params.challengeBonus > 0 && (
        <p className="dim center">Includes +{params.challengeBonus} daily bonus</p>
      )}

      <p className="dim center">
        Total XP: {progress.totalXp}
      </p>
    </div>
  );
}
