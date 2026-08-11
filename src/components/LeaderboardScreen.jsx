import { useEffect, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { MODES } from '../data/modes.js';
import { fetchGlobalLadder, getMe, updateNickname } from '../lib/supabase.js';
import ConfirmModal from './ConfirmModal.jsx';
import Icon from './Icon.jsx';

const CUP_COLORS = ['#ffc800', '#c9ccd4', '#cd7f32'];

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function LeaderboardScreen({ go }) {
  const { leaderboards, clearLeaderboards, t } = useGame();
  const [tab, setTab] = useState('mc');
  const [confirming, setConfirming] = useState(false);
  const [global, setGlobal] = useState(null);
  const [me, setMe] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [editMsg, setEditMsg] = useState(null);
  const sessions = leaderboards[tab] || [];

  useEffect(() => {
    let alive = true;
    fetchGlobalLadder().then((rows) => {
      if (alive && rows) setGlobal(rows);
    });
    getMe().then((m) => {
      if (alive && m) setMe(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  const startEdit = () => {
    setDraft(me?.name || '');
    setEditMsg(null);
    setEditing(true);
  };

  const saveName = async (e) => {
    e.preventDefault();
    const res = await updateNickname(draft);
    if (!res.ok) {
      setEditMsg(res.reason === 'chars' ? t('Letters, numbers, spaces, _ and - only.') : t('3–24 characters, please.'));
      return;
    }
    setMe((m) => ({ id: m?.id, name: res.name }));
    setEditing(false);
    setEditMsg(res.offline ? t('Saved on this device — will sync when online.') : null);
    fetchGlobalLadder().then((rows) => {
      if (rows) setGlobal(rows);
    });
  };

  const allSessions = Object.entries(leaderboards)
    .flatMap(([mode, list]) => (list || []).map((s) => ({ mode, ...s })))
    .sort((a, b) => (b.xp ?? b.score) - (a.xp ?? a.score) || a.time - b.time)
    .slice(0, 5);

  const localTotal = allSessions.reduce((acc, s) => acc + (s.xp ?? s.score), 0);
  const globalTotal = global ? global.reduce((acc, p) => acc + p.xp, 0) : 0;

  const rows = global || allSessions.map((s) => ({ local: true, xp: s.xp ?? s.score, detail: `${MODES[s.mode]?.title || s.mode} · ${s.detail}` }));

  return (
    <div>
      <button className="back-btn" onClick={() => go('home')} aria-label={t('Back to home')}>
        <Icon name="arrowLeft" size={20} />
      </button>
      <h1 className="page-title">
        <Icon name="globe" size={24} /> {t('Leaderboard')}
      </h1>
      <p className="dim">
        {global ? t('Live ladder, synced from the cloud — no login needed.') : t('Top runs on this device — stored in cache, no login needed.')}
      </p>

      <section className="cup-section">
        <div className="cup-head">
          <span className="cup-trophy">
            <Icon name="trophy" size={26} />
          </span>
          <div className="cup-head-text">
            <h2 className="section-title">{t('XP World Cup')}</h2>
            <p className="dim small">
              {global
                ? t('Global top players · {xp} XP on the board', { xp: globalTotal })
                : t('Your best XP runs · {xp} XP total', { xp: localTotal })}
            </p>
          </div>
        </div>
        {me && (
          <div className="card name-editor">
            {editing ? (
              <form className="name-editor-form" onSubmit={saveName}>
                <input
                  className="name-editor-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={24}
                  autoFocus
                  aria-label={t('Your name')}
                />
                <button type="submit" className="icon-btn" aria-label={t('Save name')}>
                  <Icon name="check" size={18} />
                </button>
                <button type="button" className="icon-btn" aria-label={t('Cancel')} onClick={() => setEditing(false)}>
                  <Icon name="x" size={18} />
                </button>
              </form>
            ) : (
              <>
                <div className="name-editor-display">
                  <span className="name-editor-label">{t('You play as')}</span>
                  <span className="name-editor-name">{me.name}</span>
                </div>
                <button className="icon-btn" aria-label={t('Edit your name')} onClick={startEdit}>
                  <Icon name="pencil" size={16} />
                </button>
              </>
            )}
            {editMsg && <p className="name-editor-msg">{editMsg}</p>}
          </div>
        )}
        {rows.length === 0 ? (
          <div className="card empty-state">
            <p>{t('No runs yet.')}</p>
            <p className="dim">{t('Play any mode and your top XP runs will climb the ladder!')}</p>
          </div>
        ) : (
          <div className="lb-list">
            {rows.map((p, i) => (
              <div key={`${p.id || i}`} className={`card lb-row cup-row ${i === 0 ? 'top' : ''} ${p.id && me?.id === p.id ? 'you' : ''}`}>
                <span className="lb-rank">
                  {i < 3 ? (
                    <Icon name="trophy" size={22} style={{ color: CUP_COLORS[i] }} />
                  ) : (
                    `#${i + 1}`
                  )}
                </span>
                <div className="lb-main">
                  <span className="lb-score">
                    {p.local ? <Icon name={MODES[p.mode]?.icon || 'target'} size={13} /> : null}
                    {p.local ? t(MODES[p.mode]?.title) : p.name}
                    {!p.local && me?.id === p.id && <span className="you-badge">{t('You')}</span>}
                  </span>
                  <span className="lb-detail dim">{p.local ? p.detail : t('FlagQuest player')}</span>
                </div>
                <span className="cup-xp">+{p.xp} XP</span>
                {!p.local && p.date && <span className="lb-date dim">{fmtDate(p.date)}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <h2 className="section-title">{t('By Mode')}</h2>
      <div className="lb-tabs" role="tablist">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={`lb-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon name={m.icon} size={15} /> {t(m.title)}
          </button>
        ))}
      </div>

      {sessions.length === 0 ? (
        <div className="card empty-state">
          <p>{t('No sessions yet in this mode.')}</p>
          <p className="dim">{t('Play a round and your best runs will show up here!')}</p>
        </div>
      ) : (
        <div className="lb-list">
          {sessions.map((s, i) => (
            <div key={`${s.date}-${i}`} className={`card lb-row ${i === 0 ? 'top' : ''}`}>
              <span className="lb-rank">
                {i < 3 ? (
                  <Icon name="medal" size={22} style={{ color: CUP_COLORS[i] }} />
                ) : (
                  `#${i + 1}`
                )}
              </span>
              <div className="lb-main">
                <span className="lb-score">{s.score}</span>
                <span className="lb-detail dim">{s.detail}</span>
              </div>
              <span className="lb-date dim">{fmtDate(s.date)}</span>
            </div>
          ))}
        </div>
      )}

      {sessions.length > 0 && (
        <button className="btn btn-ghost danger-text" onClick={() => setConfirming(true)}>
          <Icon name="trash" size={16} /> {t('Clear leaderboard')}
        </button>
      )}

      {confirming && (
        <ConfirmModal
          title={t('Clear leaderboard?')}
          body={t('This removes all saved sessions for every mode on this device.')}
          confirmLabel={t('Clear')}
          danger
          onConfirm={() => {
            clearLeaderboards();
            setConfirming(false);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
