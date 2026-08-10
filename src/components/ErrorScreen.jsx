import Mascot from './Mascot.jsx';

export default function ErrorScreen({ onRetry }) {
  return (
    <div className="center-screen">
      <Mascot mood="sad" size={110} />
      <h2>Couldn't load flags</h2>
      <p className="dim center">
        FlagQuest needs to reach the flag database the first time it runs.
        <br />
        Check your internet connection and try again.
      </p>
      <button className="btn btn-blue" onClick={onRetry}>
        🔄 Retry
      </button>
    </div>
  );
}
