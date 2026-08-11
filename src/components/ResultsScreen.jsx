import { useEffect } from 'react';
import { useGame } from '../state/GameContext.jsx';
import Ring from './Ring.jsx';
import Mascot from './Mascot.jsx';
import Icon from './Icon.jsx';
import { burst } from '../lib/confetti.js';

export default function ResultsScreen({ params, go }) {
  const { progress, t } = useGame();
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
        <h1 className="results-title">{perfect ? t('Perfect round!') : acc >= 60 ? t('Great job!') : t('Keep going!')}</h1>
        <p className="dim">{params.title}{params.scope?.type === 'continent' ? ` · ${t(params.scope.id)}` : ''}</p>
        <Ring pct={acc} color={color} size={130} />
        {params.isNewBest && params.score > 0 && (
          <span className="tag tag-new-best">
            <Icon name="trophy" size={13} /> {t('New best!')}
          </span>
        )}
      </section>

      <section className="results-stats">
        <div className="card stat">
          <span className="stat-num">{params.correct}/{params.total}</span>
          <span className="stat-label dim">{t('Correct')}</span>
        </div>
        <div className="card stat">
          <span className="stat-num green">+{params.xp} XP</span>
          <span className="stat-label dim">{t('Earned')}</span>
        </div>
        <div className="card stat">
          <span className="stat-num"><Icon name="flame" size={17} /> {params.bestStreak}</span>
          <span className="stat-label dim">{t('Best streak')}</span>
        </div>
        {params.isTimed && (
          <div className="card stat">
            <span className="stat-num blue">{params.score}</span>
            <span className="stat-label dim">{t('Score')}</span>
          </div>
        )}
      </section>

      <section className="results-actions">
        {params.isChallenge ? (
          <button className="btn btn-ghost" disabled>
            <Icon name="calendar" size={18} /> {t('Come back tomorrow')}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => go('quiz', { mode: params.mode, scope: params.scope })}
          >
            <Icon name="play" size={17} /> {t('Play again')}
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => go('home')}>
          <Icon name="home" size={18} /> {t('Home')}
        </button>
      </section>

      {params.challengeBonus > 0 && (
        <p className="dim center">{t('Includes +{bonus} daily bonus', { bonus: params.challengeBonus })}</p>
      )}

      <p className="dim center">
        {t('Total XP: {xp}', { xp: progress.totalXp })}
      </p>
    </div>
  );
}
