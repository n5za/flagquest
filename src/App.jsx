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
import LoadingScreen from './components/LoadingScreen.jsx';
import ErrorScreen from './components/ErrorScreen.jsx';
import Toasts from './components/Toasts.jsx';
import LevelUpModal from './components/LevelUpModal.jsx';
import LandingPage from './components/LandingPage.jsx';

const isAppPath = () => window.location.pathname === '/app' || window.location.pathname.startsWith('/app/');

export default function App() {
  const [data, setData] = useState({ status: 'loading', countries: [] });
  const [screen, setScreen] = useState({ name: 'home', params: {} });

  const [isApp] = useState(isAppPath);

  if (!isApp) return <LandingPage />;

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
    setScreen({ name, params });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const ready = data.status === 'ready';

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
            {screen.name === 'quiz' && (
              <QuizScreen
                key={`${screen.params.mode}-${screen.params.scope?.type}-${screen.params.scope?.id ?? ''}`}
                countries={data.countries}
                mode={screen.params.mode}
                scope={screen.params.scope}
                go={go}
              />
            )}
            {screen.name === 'match' && (
              <MatchScreen
                key={`match-${screen.params.scope?.type}-${screen.params.scope?.id ?? ''}`}
                countries={data.countries}
                scope={screen.params.scope}
                go={go}
              />
            )}
            {screen.name === 'results' && <ResultsScreen params={screen.params} go={go} />}
            {screen.name === 'badges' && <BadgesScreen go={go} />}
            {screen.name === 'leaderboard' && <LeaderboardScreen go={go} />}
            {screen.name === 'settings' && <SettingsScreen go={go} />}
          </main>
        )}
        <Toasts />
        <LevelUpModal />
      </div>
    </GameProvider>
  );
}
