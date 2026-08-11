import Mascot from './Mascot.jsx';
import Icon from './Icon.jsx';
import { useGame } from '../state/GameContext.jsx';

export default function ErrorScreen({ onRetry }) {
  const { t } = useGame();
  return (
    <div className="center-screen">
      <Mascot mood="sad" size={110} />
      <h2>{t("Couldn't load flags")}</h2>
      <p className="dim center">
        {t('FlagQuest needs to reach the flag database the first time it runs.')}
        <br />
        {t('Check your internet connection and try again.')}
      </p>
      <button className="btn btn-blue" onClick={onRetry}>
        <Icon name="refresh" size={18} /> {t('Retry')}
      </button>
    </div>
  );
}
