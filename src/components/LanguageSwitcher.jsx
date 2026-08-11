import { useGame } from '../state/GameContext.jsx';

const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦' }
];

export default function LanguageSwitcher({ compact = false }) {
  const { settings, setSetting } = useGame();
  return (
    <div className={`lang-switch ${compact ? 'lang-switch-compact' : ''}`}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          className={`lang-btn ${settings.lang === l.code ? 'active' : ''}`}
          onClick={() => setSetting('lang', l.code)}
          aria-pressed={settings.lang === l.code}
        >
          <span className="lang-flag">{l.flag}</span>
          {!compact && <span className="lang-label">{l.label}</span>}
        </button>
      ))}
    </div>
  );
}