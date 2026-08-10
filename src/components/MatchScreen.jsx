import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { pickMatchCountries, shuffle } from '../lib/quiz.js';
import { sound } from '../lib/sound.js';
import { burst } from '../lib/confetti.js';
import { MATCH_PAIRS } from '../data/modes.js';
import Icon from './Icon.jsx';

export default function MatchScreen({ scope, countries, go }) {
  const { recordAnswer, finishQuiz } = useGame();

  const [picked] = useState(() => pickMatchCountries(scope, countries));
  const [flags] = useState(() => shuffle(picked));
  const [caps] = useState(() => shuffle(picked));
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(() => new Set());
  const [bad, setBad] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const start = useRef(Date.now());
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const timeMs = Date.now() - start.current;
    const pairs = matched.size;
    const detail = `${pairs}/${MATCH_PAIRS} pairs · ${Math.round(timeMs / 1000)}s${
      mistakes ? ` · ${mistakes} mistake${mistakes > 1 ? 's' : ''}` : ' · flawless'
    }`;
    finishQuiz('match', { score: pairs, correct: pairs, total: MATCH_PAIRS, timeMs, detail, xp: xpEarned });
    go('results', {
      mode: 'match',
      scope,
      title: 'Capital Match',
      correct: pairs,
      total: MATCH_PAIRS,
      xp: xpEarned,
      bestStreak: pairs,
      score: pairs,
      detail,
      timeMs,
      isNewBest: pairs === MATCH_PAIRS,
      isTimed: false,
    });
  }, [matched.size, mistakes, xpEarned, finishQuiz, go, scope]);

  useEffect(() => {
    if (matched.size === MATCH_PAIRS) {
      const t = setTimeout(finish, 900);
      return () => clearTimeout(t);
    }
  }, [matched.size, finish]);

  const clickFlag = (c) => {
    if (matched.has(c.id)) return;
    setSel(c);
    sound.click();
  };

  const clickCap = (c) => {
    if (!sel || matched.has(c.id)) return;
    if (sel.id === c.id) {
      setMatched((m) => new Set(m).add(c.id));
      const res = recordAnswer(c.id, true, 'match');
      setXpEarned((x) => x + res.xp);
      setSel(null);
      sound.match();
      burst(undefined, undefined, { count: 30, power: 3 });
    } else {
      setMistakes((m) => m + 1);
      setBad({ flag: sel.id, cap: c.id });
      recordAnswer(sel.id, false, 'match');
      sound.wrong();
      setTimeout(() => {
        setBad(null);
        setSel(null);
      }, 450);
    }
  };

  if (!picked.length) return null;

  return (
    <div className="match">
      <div className="quiz-top">
        <button className="icon-btn" onClick={() => go('home')} aria-label="Quit match">
          <Icon name="x" size={18} />
        </button>
        <div className="quiz-segs">
          {Array.from({ length: MATCH_PAIRS }, (_, i) => (
            <span key={i} className={`seg ${i < matched.size ? 'done' : ''}`} />
          ))}
        </div>
        <span className="counter-chip">
          {matched.size}/{MATCH_PAIRS}
        </span>
      </div>

      <div className="match-hud">
        <h1 className="match-title"><Icon name="puzzle" size={22} /> Flag → Capital</h1>
        <p className="dim">Tap a flag, then its capital. Match all {MATCH_PAIRS} pairs!</p>
      </div>

      <div className="match-grid">
        <div className="match-col">
          {flags.map((c) => (
            <button
              key={c.id}
              className={`pair ${sel?.id === c.id ? 'selected' : ''} ${matched.has(c.id) ? 'matched' : ''} ${
                bad?.flag === c.id ? 'bad' : ''
              }`}
              onClick={() => clickFlag(c)}
            >
              <img className="pair-flag" src={c.flag} alt={`Flag of ${c.name}`} loading="lazy" />
              <span className="pair-label">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="match-col">
          {caps.map((c) => (
            <button
              key={c.id}
              className={`pair ${matched.has(c.id) ? 'matched' : ''} ${bad?.cap === c.id ? 'bad' : ''}`}
              onClick={() => clickCap(c)}
            >
              <span className="pair-cap">{c.capital}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
