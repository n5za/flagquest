import { useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import { UNLOCK_MASTERY } from '../data/continents.js';

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="settings-row">
      <div>
        <div className="settings-label">{label}</div>
        {hint && <div className="settings-hint dim">{hint}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}

export default function SettingsScreen({ go }) {
  const { settings, setSetting, resetProgress, clearLeaderboards } = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmLb, setConfirmLb] = useState(false);

  return (
    <div>
      <button className="back-btn" onClick={() => go('home')} aria-label="Back to home">
        ←
      </button>
      <h1 className="page-title">Settings</h1>

      <div className="card settings-card">
        <Toggle
          checked={settings.sound}
          onChange={(v) => setSetting('sound', v)}
          label="🔊 Sound effects"
          hint="Chimes, buzzes and level-up fanfares"
        />
        <Toggle
          checked={settings.theme === 'light'}
          onChange={(v) => setSetting('theme', v ? 'light' : 'dark')}
          label="☀️ Light theme"
          hint="Bright theme for daytime flag hunting"
        />
        <Toggle
          checked={settings.pathMode}
          onChange={(v) => setSetting('pathMode', v)}
          label="🗺️ Path mode"
          hint={`Continents unlock progressively at ${Math.round(UNLOCK_MASTERY * 100)}% mastery. Off = free mode (everything unlocked)`}
        />
      </div>

      <h2 className="section-title">Data</h2>
      <div className="card settings-card">
        <div className="settings-row">
          <div>
            <div className="settings-label">🗑 Leaderboard</div>
            <div className="settings-hint dim">Clear all saved sessions</div>
          </div>
          <button className="btn btn-small btn-red" onClick={() => setConfirmLb(true)}>
            Clear
          </button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">⚠️ Reset progress</div>
            <div className="settings-hint dim">Erases XP, level, streaks, badges and mastery</div>
          </div>
          <button className="btn btn-small btn-red" onClick={() => setConfirmReset(true)}>
            Reset
          </button>
        </div>
      </div>

      <h2 className="section-title">How it works</h2>
      <div className="card settings-card">
        <p className="dim small">
          Countries go from <b>Not started</b> → <b>Learning</b> → <b>Mastered</b>. Mastered
          requires 3 correct answers in a row. Answering wrong drops you back to Learning.
          <br />
          <br />
          XP depends on mode, the country's level and quick answers. A daily login streak protects
          you once with a freeze if you miss a day. All progress lives in your browser —
          nothing is uploaded.
        </p>
      </div>

      {confirmReset && (
        <ConfirmModal
          title="Reset all progress?"
          body="This permanently deletes XP, level, streak, badges and country mastery. Settings and leaderboard are kept."
          confirmLabel="Reset everything"
          danger
          onConfirm={() => {
            resetProgress();
            setConfirmReset(false);
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
      {confirmLb && (
        <ConfirmModal
          title="Clear leaderboard?"
          body="All saved sessions on this device will be removed."
          confirmLabel="Clear"
          danger
          onConfirm={() => {
            clearLeaderboards();
            setConfirmLb(false);
          }}
          onCancel={() => setConfirmLb(false)}
        />
      )}
    </div>
  );
}
