import { QUIZ_LEN, COUNTRY_PRACTICE_LEN } from '../data/modes.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seedForDate(dateKey) {
  return hashString(`flagquest-daily-${dateKey}`);
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stateWeight(state) {
  return state === 'new' ? 3 : state === 'learning' ? 2 : 1;
}

export function weightedPick(pool, weights, n, rng = Math.random) {
  const arr = pool.map((c, i) => ({ c, w: Math.max(weights[i] ?? 1, 0.1) }));
  const out = [];
  while (out.length < n && arr.length) {
    const total = arr.reduce((s, x) => s + x.w, 0);
    let r = rng() * total;
    let k = 0;
    for (let i = 0; i < arr.length; i++) {
      r -= arr[i].w;
      if (r <= 0) {
        k = i;
        break;
      }
    }
    out.push(arr[k].c);
    arr.splice(k, 1);
  }
  return out;
}

export function scopePool(scope, countries, states) {
  if (scope.type === 'continent') return countries.filter((c) => c.continent === scope.id);
  if (scope.type === 'country') return countries.filter((c) => c.id === scope.id);
  return countries;
}

function pickOptionCountries(correct, countries, rng) {
  const same = shuffle(
    countries.filter((c) => c.id !== correct.id && c.continent === correct.continent),
    rng
  );
  const other = shuffle(
    countries.filter((c) => c.id !== correct.id && c.continent !== correct.continent),
    rng
  );
  const opts = [];
  for (const c of same) {
    if (opts.length >= 3) break;
    if (!opts.includes(c)) opts.push(c);
  }
  for (const c of other) {
    if (opts.length >= 3) break;
    if (!opts.includes(c)) opts.push(c);
  }
  return shuffle([correct, ...opts], rng);
}

function buildQuestion(correct, mode, countries, rng) {
  if (mode === 'type') return { mode: 'type', correct };
  const options = pickOptionCountries(correct, countries, rng);
  return { mode: mode === 'reverse' ? 'reverse' : 'mc', correct, options };
}

export function buildQuiz(mode, scope, countries, states = {}, rng = Math.random) {
  const pool = scopePool(scope, countries, states);
  const n = scope.type === 'country' ? COUNTRY_PRACTICE_LEN : QUIZ_LEN;
  const weights = pool.map((c) => stateWeight((states[c.id] || {}).s || 'new'));
  const picked = weightedPick(pool, weights, Math.min(n, pool.length), rng);
  return { questions: picked.map((c) => buildQuestion(c, mode, countries, rng)), scope };
}

export function buildDailyChallenge(countries, dateKey, states = {}) {
  return buildQuiz('mc', { type: 'challenge' }, countries, states, mulberry32(seedForDate(dateKey)));
}

export function pickMatchCountries(scope, countries, states = {}, n = 6, rng = Math.random) {
  const pool = scopePool(scope, countries, states).filter((c) => c.capital && c.capital !== c.name);
  const weights = pool.map((c) => stateWeight((states[c.id] || {}).s || 'new'));
  return weightedPick(pool, weights, Math.min(n, pool.length), rng);
}
