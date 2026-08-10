import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { storageGet, storageSet } from '../lib/storage.js';
import { sound } from '../lib/sound.js';
import { xpForAnswer, levelFromXp, todayKey, yesterdayKey } from '../lib/gameMath.js';
import { CHALLENGE_BONUS } from '../data/modes.js';
import { BADGE_MAP } from '../data/badges.js';
import { CONTINENTS } from '../data/continents.js';

const P_KEY = 'fq:progress';
const S_KEY = 'fq:settings';
const L_KEY = 'fq:leaderboards';

const DEFAULT_PROGRESS = {
  totalXp: 0,
  dailyStreak: 0,
  lastActiveDay: null,
  freezes: 0,
  badges: [],
  countries: {},
  daily: null,
  challengesDone: 0,
};

const DEFAULT_SETTINGS = { sound: true, theme: 'dark', pathMode: true };

const DEFAULT_LEADERBOARDS = { mc: [], type: [], match: [], timed: [], reverse: [], challenge: [] };

const GameCtx = createContext(null);

export function GameProvider({ countries, children }) {
  const [progress, setProgress] = useState(() => storageGet(P_KEY, DEFAULT_PROGRESS));
  const [settings, setSettings] = useState(() => storageGet(S_KEY, DEFAULT_SETTINGS));
  const [leaderboards, setLeaderboards] = useState(() => storageGet(L_KEY, DEFAULT_LEADERBOARDS));
  const [toasts, setToasts] = useState([]);
  const [levelUp, setLevelUp] = useState(null);

  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => storageSet(P_KEY, progress), [progress]);
  useEffect(() => storageSet(S_KEY, settings), [settings]);
  useEffect(() => storageSet(L_KEY, leaderboards), [leaderboards]);
  useEffect(() => sound.setEnabled(settings.sound), [settings.sound]);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const pushToast = useCallback((message, icon = 'party') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const unlockBadge = useCallback(
    (id) => {
      if (!BADGE_MAP[id]) return false;
      if (progressRef.current.badges.includes(id)) return false;
      setProgress((p) => ({ ...p, badges: [...p.badges, id] }));
      sound.badge();
      pushToast(`Badge unlocked: ${BADGE_MAP[id].name}`, BADGE_MAP[id].icon);
      return true;
    },
    [pushToast]
  );

  useEffect(() => {
    if (!countries.length) return;
    const states = progressRef.current.countries;
    for (const cont of CONTINENTS) {
      const list = countries.filter((c) => c.continent === cont.id);
      const weight = list.reduce((acc, c) => {
        const s = states[c.id];
        return acc + (s ? (s.s === 'mastered' ? 1 : s.s === 'learning' ? 0.5 : 0) : 0);
      }, 0);
      if (list.length && weight / list.length >= 1) {
        unlockBadge(`${cont.id.toLowerCase().replaceAll(' ', '-')}-explorer`);
      }
    }
    const mastered = Object.values(states).filter((c) => c.s === 'mastered').length;
    if (mastered >= 25) unlockBadge('globetrotter');
  }, [countries, progress.countries, unlockBadge]);

  const ensureDaily = useCallback(() => {
    const p = progressRef.current;
    const today = todayKey();
    if (p.lastActiveDay === today) return { changed: false, streak: p.dailyStreak };

    let streak;
    let freezes = p.freezes;
    let consumed = false;

    if (p.lastActiveDay === null) {
      streak = 1;
    } else if (p.lastActiveDay === yesterdayKey()) {
      streak = p.dailyStreak + 1;
    } else {
      if (freezes > 0) {
        freezes -= 1;
        consumed = true;
        streak = p.dailyStreak;
      } else {
        streak = 1;
      }
    }
    streak = Math.max(streak, 1);
    if (streak > 0 && streak % 7 === 0 && freezes < 1) freezes = Math.min(1, freezes + 1);

    setProgress((prev) => ({ ...prev, dailyStreak: streak, freezes, lastActiveDay: today }));
    if (streak >= 7) unlockBadge('seven-day-streak');
    if (consumed) unlockBadge('freeze-used');
    return { changed: true, streak, consumed };
  }, [unlockBadge]);

  useEffect(() => {
    const r = ensureDaily();
    if (r.changed) {
      if (r.consumed) pushToast('Streak saved by a freeze!', 'snowflake');
      else pushToast(`${r.streak}-day streak!`, 'flame');
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') ensureDaily();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [ensureDaily, pushToast]);

  const recordAnswer = useCallback(
    (cca3, correct, mode, { speed = false, combo = 0 } = {}) => {
      const p = progressRef.current;
      const prev = p.countries[cca3] || { s: 'new', streak: 0, correct: 0, seen: 0 };
      const next = { ...prev, seen: prev.seen + 1 };
      if (correct) {
        next.correct = prev.correct + 1;
        next.streak = prev.streak + 1;
        if (next.streak >= 3) next.s = 'mastered';
        else if (next.s === 'new') next.s = 'learning';
      } else {
        next.streak = 0;
        if (next.s === 'mastered') next.s = 'learning';
      }
      const xp = correct ? xpForAnswer(prev.s, mode, { speed, combo }) : 0;
      const { level: oldLevel } = levelFromXp(p.totalXp);
      const newTotal = p.totalXp + xp;
      const { level: newLevel } = levelFromXp(newTotal);
      setProgress((prevP) => ({
        ...prevP,
        totalXp: newTotal,
        countries: { ...prevP.countries, [cca3]: next },
      }));
      if (correct) unlockBadge('first-steps');
      if (newLevel > oldLevel) {
        setLevelUp({ from: oldLevel, to: newLevel });
        sound.levelUp();
      }
      if (newLevel >= 5) unlockBadge('level-5');
      if (newLevel >= 10) unlockBadge('level-10');
      if (newLevel >= 25) unlockBadge('level-25');
      return { xp, leveledUp: newLevel > oldLevel, from: oldLevel, to: newLevel };
    },
    [unlockBadge]
  );

  const addSession = useCallback((mode, session) => {
    setLeaderboards((lb) => {
      const list = [...(lb[mode] || []), session]
        .sort((a, b) => b.score - a.score || a.time - b.time)
        .slice(0, 5);
      return { ...lb, [mode]: list };
    });
  }, []);

  const finishQuiz = useCallback(
    (mode, { score, correct, total, timeMs, detail, answerXp = 0, xp = 0 }) => {
      addSession(mode, {
        date: new Date().toISOString(),
        score,
        time: timeMs,
        detail,
        xp,
      });
      const acc = total > 0 ? correct / total : 0;
      if (mode === 'challenge') {
        const done = (progressRef.current.challengesDone || 0) + 1;
        setProgress((p) => ({
          ...p,
          totalXp: p.totalXp + CHALLENGE_BONUS,
          challengesDone: done,
          daily: { date: todayKey(), score, correct, total, xp: answerXp + CHALLENGE_BONUS },
        }));
        if (done >= 5) unlockBadge('challenge-5');
      }
      if (mode === 'match') {
        if (correct === total && total >= 6) unlockBadge('perfect-match');
      } else if (mode !== 'timed' && total >= 6 && acc === 1) {
        unlockBadge('perfect-round');
      }
      if (mode === 'timed' && correct >= 20) unlockBadge('speed-demon');
    },
    [addSession, unlockBadge]
  );

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  const clearLeaderboards = useCallback(() => {
    setLeaderboards(DEFAULT_LEADERBOARDS);
  }, []);

  const setSetting = useCallback((key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  const dismissLevelUp = useCallback(() => setLevelUp(null), []);

  const stateOf = useCallback(
    (cca3) => (progress.countries[cca3] ? progress.countries[cca3].s : 'new'),
    [progress.countries]
  );

  const continentMastery = useCallback(
    (continentId) => {
      const list = countries.filter((c) => c.continent === continentId);
      if (!list.length) return 0;
      const sum = list.reduce((acc, c) => {
        const s = stateOf(c.id);
        return acc + (s === 'mastered' ? 1 : s === 'learning' ? 0.5 : 0);
      }, 0);
      return sum / list.length;
    },
    [countries, stateOf]
  );

  return (
    <GameCtx.Provider
      value={{
        progress,
        settings,
        leaderboards,
        toasts,
        levelUp,
        ensureDaily,
        recordAnswer,
        finishQuiz,
        resetProgress,
        clearLeaderboards,
        setSetting,
        unlockBadge,
        pushToast,
        dismissLevelUp,
        stateOf,
        continentMastery,
      }}
    >
      {children}
    </GameCtx.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
