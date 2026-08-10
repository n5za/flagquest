import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { buildDailyChallenge, buildQuiz } from '../lib/quiz.js';
import { checkAnswer } from '../data/countries.js';
import { sound } from '../lib/sound.js';
import { burst } from '../lib/confetti.js';
import { MODES, QUIZ_LEN, TIMED_SECONDS, SPEED_MS, CHALLENGE_BONUS } from '../data/modes.js';
import { todayKey } from '../lib/gameMath.js';
import Mascot from './Mascot.jsx';
import Icon from './Icon.jsx';

const PRAISE = ['Correct!', 'Nice!', 'Bravo!', 'You got it!', 'Legend!', 'Boom!'];

function scopeTitle(scope) {
  if (scope.type === 'continent') return scope.id;
  if (scope.type === 'country') return 'Practice';
  if (scope.type === 'challenge') return 'Daily Challenge';
  return 'Free play';
}

export default function QuizScreen({ mode, scope, countries, go }) {
  const { recordAnswer, finishQuiz, leaderboards, progress, pushToast } = useGame();
  const isTimed = mode === 'timed';
  const isChallenge = scope.type === 'challenge';
  const meta = MODES[mode];

  const [round, setRound] = useState(() =>
    isChallenge ? buildDailyChallenge(countries, todayKey()) : buildQuiz(mode, scope, countries)
  );
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('question');
  const [picked, setPicked] = useState(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [stats, setStats] = useState({
    correct: 0,
    total: 0,
    xp: 0,
    streak: 0,
    best: 0,
    score: 0,
    start: Date.now(),
  });
  const [timeLeft, setTimeLeft] = useState(isTimed ? TIMED_SECONDS : null);

  const statsRef = useRef(stats);
  statsRef.current = stats;
  const qStart = useRef(Date.now());
  const timers = useRef([]);
  const finished = useRef(false);

  const bestBefore = useRef(leaderboards[mode]?.[0]?.score ?? -1);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (isChallenge && progress.daily?.date === todayKey()) {
      pushToast('Daily challenge already completed — come back tomorrow!', 'calendar');
      go('home');
    }
  }, [isChallenge, progress.daily, go, pushToast]);

  const finish = useCallback(
    (st) => {
      if (finished.current) return;
      finished.current = true;
      const acc = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
      const detail = isTimed
        ? `${st.correct} correct · best combo ${st.best}`
        : `${st.correct}/${st.total} · ${acc}%`;
      const timeMs = Date.now() - st.start;
      const xp = isChallenge ? st.xp + CHALLENGE_BONUS : st.xp;
      finishQuiz(mode, {
        score: st.score,
        correct: st.correct,
        total: st.total,
        timeMs,
        detail,
        answerXp: st.xp,
      });
      go('results', {
        mode,
        scope,
        title: meta.title,
        correct: st.correct,
        total: st.total,
        xp,
        bestStreak: st.best,
        score: st.score,
        detail,
        timeMs,
        isNewBest: st.score > bestBefore.current,
        isTimed,
        isChallenge,
        challengeBonus: isChallenge ? CHALLENGE_BONUS : 0,
      });
    },
    [finishQuiz, go, isTimed, isChallenge, meta.title, mode, scope]
  );

  useEffect(() => {
    if (!isTimed || timeLeft == null) return;
    if (timeLeft <= 0) {
      finish(statsRef.current);
      return;
    }
    const t = setTimeout(() => {
      setTimeLeft((s) => {
        if (s <= 6) sound.countdown();
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [isTimed, timeLeft, finish]);

  const advance = useCallback(() => {
    const nextIdx = idx + 1;
    setPhase('question');
    setPicked(null);
    setInput('');
    setFeedback(null);
    qStart.current = Date.now();
    if (nextIdx >= round.questions.length) {
      if (isTimed) {
        const extra = buildQuiz('timed', scope, countries);
        setRound((r) => ({ ...r, questions: [...r.questions, ...extra.questions] }));
        setIdx(nextIdx);
      } else {
        finish(statsRef.current);
      }
      return;
    }
    setIdx(nextIdx);
  }, [finish, isTimed, scope, countries, idx, round.questions.length]);

  const answer = useCallback(
    (choice, isText = false) => {
      if (phase !== 'question') return;
      const q = round.questions[idx];
      if (!q) return;
      const answerTime = Date.now() - qStart.current;
      let ok = false;
      let note = null;
      if (isText) {
        ok = checkAnswer(q.correct, input);
        if (!ok && checkAnswer(q.correct, input, { lenient: true })) {
          ok = true;
          note = 'Close enough!';
        }
      } else {
        ok = q.options[choice].id === q.correct.id;
      }

      setPhase('feedback');
      setPicked(choice);
      setFeedback({ ok, note });

      if (ok) {
        const combo = statsRef.current.streak;
        const res = recordAnswer(q.correct.id, true, isChallenge ? 'mc' : mode, {
          speed: answerTime <= SPEED_MS && !isTimed,
          combo: isTimed ? combo : 0,
        });
        const newStreak = statsRef.current.streak + 1;
        const points = isTimed ? 10 + Math.min(newStreak, 20) * 2 : isChallenge ? 1 : 0;
        setStats((s) => ({
          ...s,
          correct: s.correct + 1,
          total: s.total + 1,
          xp: s.xp + res.xp,
          streak: newStreak,
          best: Math.max(s.best, newStreak),
          score: s.score + points,
        }));
        sound.correct();
        const rect = document.querySelector('.q-card')?.getBoundingClientRect();
        burst(
          (rect ? rect.left + rect.width / 2 : window.innerWidth / 2) + (Math.random() * 120 - 60),
          (rect ? rect.top + rect.height / 2 : window.innerHeight / 2) + (Math.random() * 80 - 40),
          { count: 40, power: 4 }
        );
      } else {
        recordAnswer(q.correct.id, false, isChallenge ? 'mc' : mode);
        setStats((s) => ({ ...s, total: s.total + 1, streak: 0 }));
        sound.wrong();
      }
      timers.current.push(setTimeout(advance, ok ? 950 : 1800));
    },
    [phase, round, idx, input, recordAnswer, mode, isTimed, isChallenge, advance]
  );

  const q = round.questions[idx];
  const totalQs = round.questions.length;
  const progressPct = isTimed ? 1 - timeLeft / TIMED_SECONDS : idx / totalQs;

  if (!q) return null;

  return (
    <div className="quiz">
      <div className="quiz-top">
        <button
          className="icon-btn"
          onClick={() => go('home')}
          aria-label="Quit quiz"
        >
          <Icon name="x" size={18} />
        </button>
        <div className="quiz-segs">
          {isTimed ? (
            <div className="timed-track">
              <div className="timed-fill" style={{ width: `${progressPct * 100}%` }} />
            </div>
          ) : (
            Array.from({ length: totalQs }, (_, i) => (
              <span
                key={i}
                className={`seg ${i < idx ? 'done' : i === idx ? 'current' : ''}`}
              />
            ))
          )}
        </div>
        {isTimed ? (
          <span className={`timer-chip ${timeLeft <= 10 ? 'urgent' : ''}`}>
            <Icon name="timer" size={15} /> {timeLeft}
          </span>
        ) : (
          <span className="counter-chip">
            {idx + 1}/{totalQs}
          </span>
        )}
      </div>

      {isTimed && (
        <div className="timed-hud">
          <span className="hud-score">Score {stats.score}</span>
          <span className={`hud-combo ${stats.streak >= 2 ? 'active' : ''}`}>
            <Icon name="flame" size={15} /> combo {stats.streak}
          </span>
        </div>
      )}

      <div className={`q-card card ${phase === 'feedback' ? 'feedback-phase' : ''}`}>
        <div className="q-prompt">
          {q.mode === 'reverse' ? (
            <>
              <h2 className="q-name">{q.correct.name}</h2>
              {q.correct.capital && <p className="dim">Capital: {q.correct.capital}</p>}
              <p className="q-hint">Pick the right flag</p>
            </>
          ) : (
            <>
              <img className="q-flag" src={q.correct.flag} alt="Which country is this?" />
              {q.mode === 'type' && <p className="q-hint">Type the country name</p>}
            </>
          )}
        </div>

        {q.mode === 'type' ? (
          <form
            className="type-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() && phase === 'question') answer(null, true);
            }}
          >
            <input
              className="type-input"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Country name…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              disabled={phase !== 'question'}
            />
            <button
              className="btn btn-blue"
              type="submit"
              disabled={!input.trim() || phase !== 'question'}
            >
              Check
            </button>
          </form>
        ) : (
          <div className="options">
            {q.options.map((o, i) => {
              const isCorrect = o.id === q.correct.id;
              const isPicked = picked === i;
              let cls = 'option';
              if (phase === 'feedback') {
                if (isCorrect) cls += ' correct';
                else if (isPicked) cls += ' wrong';
                else cls += ' dimmed';
              }
              return (
                <button
                  key={o.id}
                  className={cls}
                  onClick={() => answer(i)}
                  disabled={phase !== 'question'}
                >
                  {q.mode === 'reverse' ? (
                    <img className="opt-flag" src={o.flag} alt={`Flag of ${o.name}`} loading="lazy" />
                  ) : (
                    o.name
                  )}
                </button>
              );
            })}
          </div>
        )}

        {phase === 'feedback' && (
          <div className={`feedback-overlay ${feedback.ok ? 'ok' : 'no'}`}>
            <Mascot mood={feedback.ok ? 'happy' : 'sad'} size={72} />
            <h2>{feedback.ok ? PRAISE[(Math.random() * PRAISE.length) | 0] : 'Not quite'}</h2>
            {feedback.note && <p className="feedback-note">{feedback.note}</p>}
            {!feedback.ok && (
              <p className="feedback-answer">
                {q.mode === 'reverse' ? <img className="opt-flag" src={q.correct.flag} alt="" /> : null}
                It's <strong>{q.correct.name}</strong>
                {q.correct.capital ? ` · ${q.correct.capital}` : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
