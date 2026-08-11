import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import Icon from './Icon.jsx';
import { checkAnswer } from '../data/countries.js';
import { TIMED_SECONDS } from '../data/modes.js';
import { getRoomById, setRoomScore, subscribeRoom, ensurePlayer, supabase } from '../lib/supabase.js';

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function RoomQuizScreen({ roomId, countries, go }) {
  const { pushToast, t } = useGame();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [phase, setPhase] = useState('answer');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [options, setOptions] = useState([]);
  const [flags, setFlags] = useState([]);
  const [caps, setCaps] = useState([]);
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(() => new Set());
  const [bad, setBad] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const myIdRef = useRef(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const streakRef = useRef(0);
  const finishedRef = useRef(false);

  const mode = room?.mode || 'mc';
  const isMatch = mode === 'match';
  const isTimed = mode === 'timed';
  const isType = mode === 'type';
  const isReverse = mode === 'reverse';

  const qCountries = (room?.questions || [])
    .map((id) => countries.find((c) => c.id === id))
    .filter(Boolean);

  const pushScore = (extra = {}) => {
    setRoomScore(roomId, {
      score: scoreRef.current,
      correct: correctRef.current,
      ...extra,
    });
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setDone(true);
    pushScore({ done: true });
    go('room-results', { roomId });
  };

  useEffect(() => {
    if (!qCountries.length) return;
    const q = qCountries[qIdx];
    if (isMatch) return;
    const distractors = shuffle(countries.filter((c) => c.id !== q.id)).slice(0, 3);
    setOptions(shuffle([q, ...distractors]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, room?.id, mode]);

  useEffect(() => {
    if (!isMatch || !qCountries.length) return;
    setFlags(shuffle(qCountries));
    setCaps(shuffle(qCountries));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, mode]);

  useEffect(() => {
    if (isMatch && matched.size > 0 && matched.size === qCountries.length) {
      const tm = setTimeout(() => {
        scoreRef.current = matched.size * 10;
        correctRef.current = matched.size;
        setScore(scoreRef.current);
        setCorrectCount(correctRef.current);
        finish();
      }, 900);
      return () => clearTimeout(tm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched.size, isMatch, qCountries.length]);

  useEffect(() => {
    if (!isTimed || timeLeft == null) return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const to = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimed, timeLeft]);

  useEffect(() => {
    if (isTimed && room?.status === 'playing') setTimeLeft(TIMED_SECONDS);
  }, [isTimed, room?.status]);

  useEffect(() => {
    let alive = true;
    ensurePlayer().then((u) => {
      if (alive) myIdRef.current = u?.id || null;
    });
    getRoomById(roomId).then((r) => {
      if (alive && r) setRoom(r);
    });
    supabase
      .from('room_members')
      .select('*')
      .eq('room_id', roomId)
      .order('score', { ascending: false })
      .then(({ data, error }) => {
        if (alive && !error && data) setMembers(data);
      });
    const unsub = subscribeRoom(roomId, (kind, row) => {
      if (!alive) return;
      if (kind === 'member') {
        setMembers((prev) => {
          const rest = prev.filter((m) => m.player_id !== row.player_id);
          return [...rest, row].sort((a, b) => b.score - a.score);
        });
      } else if (kind === 'room') {
        setRoom((prev) => ({ ...prev, ...row }));
        if (row.status === 'lobby' || row.status === 'finished') {
          finishedRef.current = true;
          go('room-results', { roomId });
        }
      }
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [roomId, go]);

  if (!room) {
    return (
      <div className="screen-pad">
        <div className="card empty-state"><p>{t('Loading room…')}</p></div>
      </div>
    );
  }

  if (qCountries.length === 0) {
    return (
      <div className="screen-pad">
        <div className="card empty-state">
          <p>{t('No questions yet.')}</p>
          <p className="dim">{t('The admin is setting up the round.')}</p>
          <button className="btn btn-ghost" onClick={() => go('room', { roomId })}>
            {t('Back to lobby')}
          </button>
        </div>
      </div>
    );
  }

  const q = qCountries[qIdx];
  const totalQs = qCountries.length;

  const correct = (choice) => {
    const pts = isTimed ? 10 + Math.min(streakRef.current, 20) * 2 : 10;
    streakRef.current += 1;
    setStreak(streakRef.current);
    scoreRef.current += pts;
    correctRef.current += 1;
    setScore(scoreRef.current);
    setCorrectCount(correctRef.current);
    pushScore();
    setPicked(choice);
    setPhase('feedback');
  };

  const wrong = (choice) => {
    streakRef.current = 0;
    setStreak(0);
    pushScore();
    setPicked(choice);
    setPhase('feedback');
  };

  const answer = (choice) => {
    if (phase !== 'answer' || !choice) return;
    const ok = choice.cca2 === q.cca2;
    if (ok) correct(choice);
    else wrong(choice);
  };

  const submitType = (e) => {
    e.preventDefault();
    if (phase !== 'answer' || !input.trim()) return;
    const ok = checkAnswer(q.correct, input);
    const lenient = !ok && checkAnswer(q.correct, input, { lenient: true });
    if (ok || lenient) {
      correct(q);
    } else {
      wrong(q);
      setPicked(null);
    }
  };

  const next = async () => {
    if (qIdx + 1 < totalQs) {
      setPicked(null);
      setPhase('answer');
      setInput('');
      setQIdx((i) => i + 1);
      return;
    }
    finish();
  };

  const clickFlag = (c) => {
    if (matched.has(c.id)) return;
    setSel(c);
  };

  const clickCap = (c) => {
    if (!sel || matched.has(c.id)) return;
    if (sel.id === c.id) {
      setMatched((m) => new Set(m).add(c.id));
      setSel(null);
      setBad(null);
    } else {
      setMistakes((m) => m + 1);
      setBad({ flag: sel.id, cap: c.id });
      setTimeout(() => {
        setBad(null);
        setSel(null);
      }, 450);
    }
  };

  const me = members.find((m) => m.player_id === myIdRef.current);
  const podium = members.slice(0, 3);

  return (
    <div className="screen-pad">
      <div className="room-quiz-top">
        <span className="dim small">
          {room.name} · {isMatch ? `${matched.size}/${totalQs}` : `${qIdx + 1}/${totalQs}`}
          {isTimed && (
            <span className={`timer-chip ${timeLeft <= 10 ? 'urgent' : ''}`}>
              <Icon name="timer" size={15} /> {timeLeft}
            </span>
          )}
        </span>
        <span className="room-quiz-score">
          <Icon name="star" size={14} /> {t('{n} pts', { n: score })}
        </span>
      </div>

      {members.length > 1 && (
        <div className="room-live">
          {podium.map((m, i) => (
            <span key={m.player_id} className={`room-live-chip ${m.player_id === myIdRef.current ? 'me' : ''}`}>
              {i === 0 && <Icon name="crown" size={11} style={{ color: '#ffc800' }} />} {m.name} {m.score}
            </span>
          ))}
        </div>
      )}

      {isMatch ? (
        <div className="match">
          <div className="match-hud">
            <h1 className="match-title"><Icon name="puzzle" size={22} /> {t('Flag → Capital')}</h1>
            <p className="dim">{t('Tap a flag, then its capital. Match all {n} pairs!', { n: totalQs })}</p>
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
                  <img className="pair-flag" src={c.flag} alt={t('Flag of {name}', { name: c.name })} loading="lazy" />
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
      ) : (
        <>
          <div className="q-card card">
            <div className="q-prompt">
              {isReverse ? (
                <>
                  <h2 className="q-name">{q.name}</h2>
                  {q.capital && <p className="dim">{t('Capital: {name}', { name: q.capital })}</p>}
                  <p className="q-hint">{t('Pick the right flag')}</p>
                </>
              ) : (
                <>
                  <img className="q-flag" src={q.flagPng || q.flag} alt={t('Which country is this?')} />
                  {isType && <p className="q-hint">{t('Type the country name')}</p>}
                </>
              )}
            </div>

            {isType ? (
              <form
                className="type-form"
                onSubmit={submitType}
              >
                <input
                  className="type-input"
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('Country name…')}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  disabled={phase !== 'answer'}
                />
                <button className="btn btn-blue" type="submit" disabled={!input.trim() || phase !== 'answer'}>
                  {t('Check')}
                </button>
              </form>
            ) : (
              <div className="options-grid">
                {options.map((c) => {
                  let cls = 'option';
                  if (picked) {
                    if (c.cca2 === q.cca2) cls += ' correct';
                    else if (c.cca2 === picked.cca2) cls += ' wrong';
                    else cls += ' dimmed';
                  }
                  return (
                    <button
                      key={c.cca2}
                      className={cls}
                      disabled={!!picked}
                      onClick={() => answer(c)}
                    >
                      {isReverse ? (
                        <img className="opt-flag" src={c.flagPng || c.flag} alt={t('Flag of {name}', { name: c.name })} loading="lazy" />
                      ) : (
                        c.name
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {phase === 'feedback' && (
              <div className={`feedback-overlay ${picked?.cca2 === q.cca2 ? 'ok' : 'no'}`}>
                <h2>{picked?.cca2 === q.cca2 ? t('Correct!') : t("It's {name}", { name: q.name })}</h2>
                <button className="btn btn-primary btn-lg" onClick={next}>
                  {qIdx + 1 < totalQs ? t('Next') : t('Finish')}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {!me && !done && <p className="dim small room-waiting">{t('Joining…')}</p>}
    </div>
  );
}