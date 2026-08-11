import { ROOM_MODE_SETTINGS } from '../data/modes.js';
import { useGame } from '../state/GameContext.jsx';

export default function ModeSettingsEditor({ mode, settings, onChange }) {
  const { t } = useGame();
  const defs = ROOM_MODE_SETTINGS[mode] || [];
  if (defs.length === 0) return null;

  return (
    <div className="mode-settings">
      {defs.map((s) => {
        const value = settings?.[s.key] ?? s.def;
        if (s.kind === 'toggle') {
          return (
            <label key={s.key} className="mode-setting-row">
              <div>
                <span className="mode-setting-label">{t(s.label)}</span>
                {s.hint && <span className="mode-setting-hint">{t(s.hint)}</span>}
              </div>
              <input
                type="checkbox"
                role="switch"
                aria-label={t(s.label)}
                checked={!!value}
                onChange={(e) => onChange({ ...settings, [s.key]: e.target.checked })}
              />
            </label>
          );
        }
        return (
          <div key={s.key} className="mode-setting-row">
            <div>
              <span className="mode-setting-label">{t(s.label)}</span>
              <span className="mode-setting-hint">{t(s.hint)}</span>
            </div>
            <div className="mode-setting-range">
              <input
                type="range"
                aria-label={t(s.label)}
                min={s.min}
                max={s.max}
                step={s.step}
                value={value}
                onChange={(e) => onChange({ ...settings, [s.key]: Number(e.target.value) })}
              />
              <span className="mode-setting-value">{value}{s.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
