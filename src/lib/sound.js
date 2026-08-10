let ctx = null;
let enabled = true;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function play(freq, dur, type, gain, when = 0, slide = null) {
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sound = {
  setEnabled(v) {
    enabled = !!v;
  },
  click() {
    if (!enabled) return;
    play(520, 0.06, 'triangle', 0.05);
  },
  correct() {
    if (!enabled) return;
    play(659, 0.12, 'sine', 0.12);
    play(988, 0.2, 'sine', 0.1, 0.09);
  },
  wrong() {
    if (!enabled) return;
    play(196, 0.18, 'sawtooth', 0.05);
    play(147, 0.28, 'sawtooth', 0.05, 0.05);
  },
  levelUp() {
    if (!enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => play(f, 0.22, 'triangle', 0.12, i * 0.11));
  },
  badge() {
    if (!enabled) return;
    [784, 988, 1319].forEach((f, i) => play(f, 0.15, 'sine', 0.1, i * 0.08));
  },
  match() {
    if (!enabled) return;
    play(880, 0.1, 'sine', 0.09);
    play(1320, 0.12, 'sine', 0.08, 0.06);
  },
  countdown() {
    if (!enabled) return;
    play(880, 0.1, 'square', 0.05);
  },
};
