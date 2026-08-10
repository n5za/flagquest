import Mascot from './Mascot.jsx';

export default function LoadingScreen() {
  return (
    <div className="center-screen">
      <div className="bounce">
        <Mascot mood="idle" size={110} />
      </div>
      <p className="dim">Loading flags from around the world…</p>
      <div className="spinner" aria-label="Loading" />
    </div>
  );
}
