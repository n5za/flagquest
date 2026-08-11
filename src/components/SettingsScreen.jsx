import { useEffect, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { UNLOCK_MASTERY } from '../data/continents.js';
import { getMe, updateNickname, getAccount, signOut } from '../lib/supabase.js';
import { levelFromXp } from '../lib/gameMath.js';
import Icon from './Icon.jsx';

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
  const { settings, setSetting, resetProgress, clearLeaderboards, progress, pushToast, t } = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmLb, setConfirmLb] = useState(false);
  const [me, setMe] = useState(null);
  const [account, setAccount] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameMsg, setNameMsg] = useState(null);
  const { level } = levelFromXp(progress.totalXp);

  useEffect(() => {
    let alive = true;
    getMe().then((m) => {
      if (alive && m) setMe(m);
    });
    getAccount().then((a) => {
      if (alive && a) setAccount(a);
    });
    return () => {
      alive = false;
    };
  }, []);

  const saveName = async (e) => {
    e.preventDefault();
    const res = await updateNickname(nameDraft);
    if (!res.ok) {
      setNameMsg(res.reason === 'chars' ? t('Letters, numbers, spaces, _ and - only.') : t('3–24 characters, please.'));
      return;
    }
    setMe((m) => ({ ...m, name: res.name }));
    setEditingName(false);
    setNameMsg(res.offline ? t('Saved on this device — will sync when online.') : null);
  };

  const handleSignOut = async () => {
    await signOut();
    setAccount(null);
    pushToast(t('Signed out.'));
  };

  return (
    <div>
      <button className="back-btn" onClick={() => go('home')} aria-label={t('Back to home')}>
        <Icon name="arrowLeft" size={20} />
      </button>
      <h1 className="page-title">{t('Settings')}</h1>

      <h2 className="section-title">{t('Language')}</h2>
      <div className="card settings-card">
        <div className="settings-row">
          <div>
            <div className="settings-label"><Icon name="globe" size={16} /> {t('Language')}</div>
            <div className="settings-hint dim">{t('App language')}</div>
          </div>
        </div>
        <LanguageSwitcher />
      </div>

      <h2 className="section-title">{t('Profile')}</h2>
      <div className="card settings-card">
        <div className="settings-row">
          <div>
            <div className="settings-label"><Icon name="user" size={16} /> {t('Name')}</div>
            <div className="settings-hint dim">
              {editingName ? t('Shown on the world ladder and in rooms') : (me?.name || '—')}
            </div>
          </div>
          {editingName ? (
            <form className="name-editor-form" onSubmit={saveName}>
              <input
                className="name-editor-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={24}
                autoFocus
                aria-label={t('Your name')}
              />
              <button type="submit" className="icon-btn" aria-label={t('Save name')}><Icon name="check" size={18} /></button>
              <button type="button" className="icon-btn" aria-label={t('Cancel')} onClick={() => setEditingName(false)}><Icon name="x" size={18} /></button>
            </form>
          ) : (
            <button className="btn btn-small" onClick={() => { setNameDraft(me?.name || ''); setNameMsg(null); setEditingName(true); }}>
              <Icon name="pencil" size={14} /> {t('Change')}
            </button>
          )}
        </div>
        {nameMsg && <p className="auth-info">{nameMsg}</p>}
        <div className="settings-row">
          <div>
            <div className="settings-label"><Icon name="star" size={16} /> {t('Stats')}</div>
            <div className="settings-hint dim">{t('Level {l} · {xp} XP · streak {s}', { l: level, xp: progress.totalXp, s: progress.dailyStreak })}</div>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label"><Icon name="lock" size={16} /> {t('Account')}</div>
            <div className="settings-hint dim">
              {account?.isAnon ? t('Playing anonymously — XP lives on this device') : account?.email ? t('Signed in as {email}', { email: account.email }) : t('No session')}
            </div>
          </div>
          {account?.isAnon || !account ? (
            <button className="btn btn-small" onClick={() => go('auth')}>
              <Icon name="login" size={14} /> {t('Sign in / Sign up')}
            </button>
          ) : (
            <button className="btn btn-small btn-red" onClick={handleSignOut}>
              <Icon name="logout" size={14} /> {t('Sign out')}
            </button>
          )}
        </div>
      </div>

      <h2 className="section-title">{t('Gameplay')}</h2>
      <div className="card settings-card">
        <Toggle
          checked={settings.sound}
          onChange={(v) => setSetting('sound', v)}
          label={<><Icon name="volume2" size={16} /> {t('Sound effects')}</>}
          hint={t('Chimes, buzzes and level-up fanfares')}
        />
        <Toggle
          checked={settings.theme === 'light'}
          onChange={(v) => setSetting('theme', v ? 'light' : 'dark')}
          label={<><Icon name="sun" size={16} /> {t('Light theme')}</>}
          hint={t('Bright theme for daytime flag hunting')}
        />
        <Toggle
          checked={settings.pathMode}
          onChange={(v) => setSetting('pathMode', v)}
          label={<><Icon name="map" size={16} /> {t('Path mode')}</>}
          hint={t('Continents unlock progressively at {pct}% mastery. Off = free mode (everything unlocked)', { pct: Math.round(UNLOCK_MASTERY * 100) })}
        />
      </div>

      <h2 className="section-title">{t('Data')}</h2>
      <div className="card settings-card">
        <div className="settings-row">
          <div>
            <div className="settings-label"><Icon name="trash" size={16} /> {t('Leaderboard')}</div>
            <div className="settings-hint dim">{t('Clear all saved sessions')}</div>
          </div>
          <button className="btn btn-small btn-red" onClick={() => setConfirmLb(true)}>
            {t('Clear')}
          </button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label"><Icon name="alert" size={16} /> {t('Reset progress')}</div>
            <div className="settings-hint dim">{t('Erases XP, level, streaks, badges and mastery')}</div>
          </div>
          <button className="btn btn-small btn-red" onClick={() => setConfirmReset(true)}>
            {t('Reset')}
          </button>
        </div>
      </div>

      <h2 className="section-title">{t('How it works')}</h2>
      <div className="card settings-card">
          <p className="dim small">
            {t('Countries go from Not started → Learning → Mastered. Mastered requires 3 correct answers in a row. Answering wrong drops you back to Learning.')}
            <br />
            <br />
            {t("XP depends on mode, the country's level and quick answers. A daily login streak protects you once with a freeze if you miss a day. Progress lives in your browser; the world ladder and room battles sync through the cloud.")}
          </p>
      </div>

      {confirmReset && (
        <ConfirmModal
          title={t('Reset all progress?')}
          body={t('This permanently deletes XP, level, streak, badges and country mastery. Settings and leaderboard are kept.')}
          confirmLabel={t('Reset everything')}
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
          title={t('Clear leaderboard?')}
          body={t('All saved sessions on this device will be removed.')}
          confirmLabel={t('Clear')}
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