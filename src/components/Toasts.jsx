import { useGame } from '../state/GameContext.jsx';
import Icon from './Icon.jsx';

export default function Toasts() {
  const { toasts } = useGame();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="toast-icon">
            <Icon name={t.icon} size={18} />
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
