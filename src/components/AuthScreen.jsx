import { useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import Icon from './Icon.jsx';
import { signUp, signIn, signOut, resetPassword, setNewPassword } from '../lib/supabase.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen({ go, mode: initialMode }) {
  const { pushToast, t } = useGame();
  const [mode, setMode] = useState(initialMode === 'new-password' ? 'new-password' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === 'login' || mode === 'signup' || mode === 'forgot') {
      if (!EMAIL_RE.test(email.trim())) {
        setError(t('Enter a valid email address.'));
        return;
      }
    }
    if ((mode === 'login' || mode === 'signup') && password.length < 6) {
      setError(t('Password must be at least 6 characters.'));
      return;
    }
    if (mode === 'signup' && password !== confirm) {
      setError(t('Passwords do not match.'));
      return;
    }
    if (mode === 'new-password' && password.length < 6) {
      setError(t('Password must be at least 6 characters.'));
      return;
    }
    setBusy(true);
    let res;
    if (mode === 'signup') {
      res = await signUp(email.trim(), password);
      if (res.ok) {
        setInfo(t('Check your email to confirm your account — your XP is already attached to it.'));
        setMode('login');
        setPassword('');
        setConfirm('');
      } else {
        setError(res.error === 'network' ? t('Network error — try again.') : res.error);
      }
    } else if (mode === 'login') {
      res = await signIn(email.trim(), password);
      if (res.ok) {
        pushToast(t('Welcome back!'));
        go('settings');
      } else {
        setError(res.error === 'network' ? t('Network error — try again.') : t('Wrong email or password.'));
      }
    } else if (mode === 'forgot') {
      res = await resetPassword(email.trim());
      if (res.ok) {
        setInfo(t('Check your email for the reset link.'));
        setMode('login');
      } else {
        setError(res.error === 'network' ? t('Network error — try again.') : res.error);
      }
    } else {
      res = await setNewPassword(password);
      if (res.ok) {
        await signOut();
        pushToast(t('Password updated — sign in with it.'));
        go('settings');
      } else {
        setError(res.error === 'network' ? t('Network error — try again.') : res.error);
      }
    }
    setBusy(false);
  };

  const title =
    mode === 'login' ? t('Welcome back') :
    mode === 'signup' ? t('Create your account') :
    mode === 'forgot' ? t('Reset your password') : t('Set a new password');

  return (
    <div className="auth-wrap">
      <button className="back-btn" onClick={() => go('settings')} aria-label={t('Back')}>
        <Icon name="arrowLeft" size={20} />
      </button>
      <h1 className="page-title">{title}</h1>
      <p className="dim">
        {mode === 'signup'
          ? t('Signing up keeps your XP, name and rank on every device.')
          : mode === 'new-password'
            ? t('Choose a new password for your account.')
            : t('Your progress is anonymous until you sign in.')}
      </p>

      <form className="card auth-form" onSubmit={submit}>
        {mode !== 'new-password' && (
          <label className="auth-field">
            <span className="auth-label">{t('Email')}</span>
            <input
              type="email"
              className="room-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
        )}
        {mode !== 'forgot' && (
          <label className="auth-field">
            <span className="auth-label">{mode === 'new-password' ? t('New password') : t('Password')}</span>
            <input
              type="password"
              className="room-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'new-password' ? 'new-password' : mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              required
            />
          </label>
        )}
        {mode === 'signup' && (
          <label className="auth-field">
            <span className="auth-label">{t('Confirm password')}</span>
            <input
              type="password"
              className="room-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
          </label>
        )}

        {error && <p className="auth-error">{error}</p>}
        {info && <p className="auth-info">{info}</p>}

        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? t('One moment…') : mode === 'signup' ? t('Create account') : mode === 'forgot' ? t('Send reset link') : mode === 'new-password' ? t('Save password') : t('Sign in')}
        </button>
      </form>

      {mode === 'login' && (
        <div className="auth-switch">
          <span className="dim">{t('New here?')}</span>{' '}
          <button className="btn-link" onClick={() => { setMode('signup'); setError(null); setInfo(null); }}>{t('Create account')}</button>
          <span className="dim"> · </span>
          <button className="btn-link" onClick={() => { setMode('forgot'); setError(null); setInfo(null); }}>{t('Forgot password?')}</button>
        </div>
      )}
      {mode === 'signup' && (
        <div className="auth-switch">
          <span className="dim">{t('Already have an account?')}</span>{' '}
          <button className="btn-link" onClick={() => { setMode('login'); setError(null); setInfo(null); }}>{t('Sign in')}</button>
        </div>
      )}
      {mode === 'forgot' && (
        <div className="auth-switch">
          <button className="btn-link" onClick={() => { setMode('login'); setError(null); setInfo(null); }}>{t('Back to sign in')}</button>
        </div>
      )}
    </div>
  );
}
