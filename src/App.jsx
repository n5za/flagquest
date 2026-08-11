import { useCallback, useEffect, useState } from 'react';
import { GameProvider } from './state/GameContext.jsx';
import { loadCountries } from './api/countryData.js';
import TopBar from './components/TopBar.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import PathScreen from './components/PathScreen.jsx';
import QuizScreen from './components/QuizScreen.jsx';
import MatchScreen from './components/MatchScreen.jsx';
import ResultsScreen from './components/ResultsScreen.jsx';
import BadgesScreen from './components/BadgesScreen.jsx';
import LeaderboardScreen from './components/LeaderboardScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import RoomScreen from './components/RoomScreen.jsx';
import RoomSettingsScreen from './components/RoomSettingsScreen.jsx';
import RoomQuizScreen from './components/RoomQuizScreen.jsx';
import RoomResultsScreen from './components/RoomResultsScreen.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import ErrorScreen from './components/ErrorScreen.jsx';
import Toasts from './components/Toasts.jsx';
import LevelUpModal from './components/LevelUpModal.jsx';
import LandingPage from './components/LandingPage.jsx';
import { onAuthChange } from './lib/supabase.js';

const isAppPath = () => window.location.pathname === '/app' || window.location.pathname.startsWith('/app/');

const RUN_KEY_PREFIX = 'fq_run_';

function saveRun(runId, params) {
  try {
    sessionStorage.setItem(RUN_KEY_PREFIX + runId, JSON.stringify(params));
  } catch {
    /* storage unavailable */
  }
}

function loadRun(runId) {
  try {
    const raw = sessionStorage.getItem(RUN_KEY_PREFIX + runId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildHash(name, params = {}) {
  const p = params || {};
  switch (name) {
    case 'home':
      return '#/';
    case 'path':
      return `#/path/${encodeURIComponent(p.continentId ?? '')}`;
    case 'quiz': {
      const scope = p.scope || {};
      const s = scope.type === 'continent' || scope.type === 'country'
        ? `/${scope.type}/${encodeURIComponent(scope.id ?? '')}`
        : `/${scope.type || 'all'}`;
      return `#/quiz/${encodeURIComponent(p.mode ?? 'mc')}${s}`;
    }
    case 'match': {
      const scope = p.scope || {};
      const s = scope.type === 'continent' || scope.type === 'country'
        ? `/${scope.type}/${encodeURIComponent(scope.id ?? '')}`
        : `/${scope.type || 'all'}`;
      return `#/match${s}`;
    }
    case 'results': {
      const runId = p.runId || Math.random().toString(36).slice(2, 10);
      saveRun(runId, p);
      return `#/results/${runId}`;
    }
    case 'badges':
      return '#/badges';
    case 'leaderboard':
      return '#/leaderboard';
    case 'settings':
      return '#/settings';
    case 'auth':
      return p.mode === 'new-password' ? '#/auth/new-password' : '#/auth';
    case 'room':
      if (p.join) return `#/room/join/${encodeURIComponent(p.join)}`;
      if (p.roomId) return `#/room/${encodeURIComponent(p.roomId)}`;
      return '#/room';
    case 'room-settings':
      return `#/room/${encodeURIComponent(p.roomId ?? '')}/settings`;
    case 'room-quiz':
      return `#/room/${encodeURIComponent(p.roomId ?? '')}/play`;
    case 'room-results':
      return `#/room/${encodeURIComponent(p.roomId ?? '')}/results`;
    default:
      return '#/';
  }
}

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const seg = raw.split('/').filter(Boolean).map((s) => decodeURIComponent(s));
  if (seg.length === 0) return { name: 'home', params: {} };
  switch (seg[0]) {
    case 'path':
      return { name: 'path', params: { continentId: seg[1] || '' } };
    case 'quiz': {
      const mode = seg[1] || 'mc';
      const stype = seg[2] || 'all';
      const params = { mode, scope: stype === 'continent' || stype === 'country' ? { type: stype, id: seg[3] || '' } : { type: stype } };
      return { name: 'quiz', params };
    }
    case 'match': {
      const stype = seg[1] || 'all';
      const params = { scope: stype === 'continent' || stype === 'country' ? { type: stype, id: seg[2] || '' } : { type: stype } };
      return { name: 'match', params };
    }
    case 'results':
      return { name: 'results', params: { runId: seg[1] || '', saved: loadRun(seg[1] || '') } };
    case 'badges':
      return { name: 'badges', params: {} };
    case 'leaderboard':
      return { name: 'leaderboard', params: {} };
    case 'settings':
      return { name: 'settings', params: {} };
    case 'auth':
      return { name: 'auth', params: { mode: seg[1] === 'new-password' ? 'new-password' : undefined } };
    case 'room':
      if (seg[1] === 'join') return { name: 'room', params: { join: seg[2] || '' } };
      if (seg[1] === 'settings') return { name: 'room-settings', params: { roomId: seg[1] } };
      if (seg.length === 3 && seg[2] === 'settings') return { name: 'room-settings', params: { roomId: seg[1] } };
      if (seg.length === 3 && seg[2] === 'play') return { name: 'room-quiz', params: { roomId: seg[1] } };
      if (seg.length === 3 && seg[2] === 'results') return { name: 'room-results', params: { roomId: seg[1] } };
      if (seg.length === 2) return { name: 'room', params: { roomId: seg[1] } };
      return { name: 'room', params: {} };
    default:
      return { name: 'home', params: {} };
  }
}

export default function App() {
  const [data, setData] = useState({ status: 'loading', countries: [] });
  const [screen, setScreen] = useState(() => parseHash());

  const [isApp] = useState(isAppPath);

  if (!isApp) {
    return (
      <GameProvider countries={[]}>
        <LandingPage />
      </GameProvider>
    );
  }

  const load = useCallback(async (force = false) => {
    setData((d) => ({ ...d, status: 'loading' }));
    try {
      const result = await loadCountries({ forceRefresh: force });
      setData({ status: 'ready', countries: result.countries, offline: result.fromCache });
    } catch {
      setData({ status: 'error', countries: [] });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const go = useCallback((name, params = {}) => {
    const next = buildHash(name, params);
    if (window.location.hash === next) {
      setScreen(parseHash());
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      window.location.hash = next;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    const onHash = () => setScreen(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode) {
      window.history.replaceState({}, '', window.location.pathname);
      window.location.hash = `#/room/join/${encodeURIComponent(roomCode)}`;
    }
    const off = onAuthChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        go('auth', { mode: 'new-password' });
      }
    });
    return off;
  }, [go]);

  const ready = data.status === 'ready';

  const quizScreen = screen.name === 'quiz' && (
    <QuizScreen
      key={`${screen.params.mode}-${screen.params.scope?.type}-${screen.params.scope?.id ?? ''}`}
      countries={data.countries}
      mode={screen.params.mode}
      scope={screen.params.scope}
      go={go}
    />
  );

  const resultsScreen = screen.name === 'results' && screen.params.saved && (
    <ResultsScreen params={screen.params.saved} go={go} />
  );

  return (
    <GameProvider countries={ready ? data.countries : []}>
      <div className="app">
        {data.status !== 'loading' && (
          <TopBar go={go} />
        )}
        {data.status === 'loading' && <LoadingScreen />}
        {data.status === 'error' && <ErrorScreen onRetry={() => load(true)} />}
        {ready && (
          <main className="screen">
            {screen.name === 'home' && <HomeScreen countries={data.countries} go={go} />}
            {screen.name === 'path' && (
              <PathScreen
                countries={data.countries}
                continentId={screen.params.continentId}
                go={go}
              />
            )}
            {quizScreen}
            {screen.name === 'match' && (
              <MatchScreen
                key={`match-${screen.params.scope?.type}-${screen.params.scope?.id ?? ''}`}
                countries={data.countries}
                scope={screen.params.scope}
                go={go}
              />
            )}
            {resultsScreen}
            {screen.name === 'badges' && <BadgesScreen go={go} />}
            {screen.name === 'leaderboard' && <LeaderboardScreen go={go} />}
            {screen.name === 'settings' && <SettingsScreen go={go} />}
            {screen.name === 'auth' && <AuthScreen go={go} mode={screen.params.mode} />}
            {screen.name === 'room' && (
              <RoomScreen
                key={screen.params.join || screen.params.roomId || 'lobby'}
                countries={data.countries}
                joinCode={screen.params.join}
                roomId={screen.params.roomId}
                go={go}
              />
            )}
            {screen.name === 'room-settings' && (
              <RoomSettingsScreen
                key={screen.params.roomId}
                roomId={screen.params.roomId}
                countries={data.countries}
                go={go}
              />
            )}
            {screen.name === 'room-quiz' && (
              <RoomQuizScreen
                key={screen.params.roomId}
                roomId={screen.params.roomId}
                countries={data.countries}
                go={go}
              />
            )}
            {screen.name === 'room-results' && (
              <RoomResultsScreen
                key={screen.params.roomId}
                roomId={screen.params.roomId}
                countries={data.countries}
                go={go}
              />
            )}
          </main>
        )}
        <Toasts />
        <LevelUpModal />
      </div>
    </GameProvider>
  );
}
