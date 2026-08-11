import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closeEnough, normalize, levenshtein } from '../src/lib/fuzzy.js';
import { levelFromXp, xpForAnswer, masteryOf } from '../src/lib/gameMath.js';
import { checkAnswer, toGameCountry } from '../src/data/countries.js';
import { buildQuiz, pickMatchCountries, buildDailyChallenge, mulberry32, seedForDate, hashString } from '../src/lib/quiz.js';

test('normalize strips diacritics and punctuation', () => {
  assert.equal(normalize("Côte d'Ivoire"), 'cote d ivoire');
  assert.equal(normalize('São Tomé & Príncipe'), 'sao tome principe');
  assert.equal(normalize('  USA  '), 'usa');
});

test('levenshtein basics', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(levenshtein('russia', 'russia'), 0);
});

test('fuzzy accepts typos, rejects wrong countries', () => {
  assert.ok(closeEnough('Russa', 'Russia'));
  assert.ok(closeEnough('czechia', 'Czechia'));
  assert.ok(closeEnough('brasil', 'Brazil', { lenient: true }));
  assert.ok(!closeEnough('Banana', 'Russia'));
  assert.ok(!closeEnough('Argentina', 'Armenia'));
});

test('level thresholds: XP needed = 100 * level', () => {
  assert.equal(levelFromXp(0).level, 1);
  assert.equal(levelFromXp(99).level, 1);
  assert.equal(levelFromXp(100).level, 2);
  assert.equal(levelFromXp(299).level, 2);
  assert.equal(levelFromXp(300).level, 3);
  assert.equal(levelFromXp(100).into, 0);
  assert.equal(levelFromXp(50).pct, 50);
});

test('xp scales by state and speed', () => {
  assert.equal(xpForAnswer('new', 'mc'), 13);
  assert.equal(xpForAnswer('new', 'mc', { speed: true }), 16);
  assert.equal(xpForAnswer('mastered', 'mc'), 9);
  assert.equal(xpForAnswer('new', 'type'), 20);
  assert.equal(xpForAnswer('new', 'timed', { combo: 5 }), 23);
  assert.ok(xpForAnswer('new', 'timed', { combo: 40 }) > xpForAnswer('new', 'timed', { combo: 0 }));
});

test('mastery weights mastered=1 learning=0.5 new=0', () => {
  const list = [
    { state: 'mastered', continent: 'Africa' },
    { state: 'learning', continent: 'Africa' },
    { state: 'new', continent: 'Africa' },
    { state: 'mastered', continent: 'Europe' },
  ];
  assert.equal(masteryOf(list, 'Africa'), 0.5);
  assert.equal(masteryOf(list, 'Europe'), 1);
});

function mk(name, opts = {}) {
  const id = opts.id || name.slice(0, 3).toUpperCase();
  return toGameCountry({
    cca2: opts.cca2 || id.slice(0, 2),
    cca3: id,
    name: { common: name, official: opts.official || `Official ${name}` },
    flags: opts.flags || { svg: 'https://flagcdn.com/xx.svg', png: 'https://flagcdn.com/w320/xx.png' },
    capital: opts.capital !== undefined ? opts.capital : [opts.cap || `${name} City`],
    region: opts.region || 'Africa',
    subregion: opts.subregion || 'Western Africa',
    status: 'officially-assigned',
  });
}

test('aliases and typo acceptance for type-the-country', () => {
  const civ = mk("Côte d'Ivoire", { id: 'CIV' });
  assert.ok(checkAnswer(civ, 'ivory coast'));
  assert.ok(checkAnswer(civ, "cote d'ivoire"));
  assert.ok(checkAnswer(civ, 'cote divoire'));
  assert.ok(checkAnswer(civ, 'ivory coast', { lenient: true }));
  assert.ok(!checkAnswer(civ, 'ghana'));
  assert.ok(!checkAnswer(civ, 'ivory costs'));
  assert.ok(!checkAnswer(civ, 'mauritania'));
});

test('official name accepted exactly, typos forgiven on near-miss', () => {
  const ger = mk('Germany', { official: 'Federal Republic of Germany', region: 'Europe', subregion: 'Western Europe' });
  assert.ok(checkAnswer(ger, 'Federal Republic of Germany'));
  assert.ok(checkAnswer(ger, 'Federal Republic of Germany', { lenient: true }));
  assert.ok(checkAnswer(ger, 'Federal Repubic of Germany', { lenient: true }));
  assert.ok(!checkAnswer(ger, 'Republic of France'));
});

test('Antarctic region excluded as unplayable', () => {
  const raw = {
    cca3: 'ATA',
    name: { common: 'Antarctica', official: 'Antarctica' },
    flags: { svg: 'x', png: 'y' },
    region: 'Antarctic',
    subregion: '',
    status: 'officially-assigned',
  };
  assert.equal(deriveContinent(raw), null);
});

import { deriveContinent } from '../src/data/countries.js';

test('Americas split by subregion', () => {
  assert.equal(deriveContinent({ region: 'Americas', subregion: 'South America' }), 'South America');
  assert.equal(deriveContinent({ region: 'Americas', subregion: 'Caribbean' }), 'North America');
  assert.equal(deriveContinent({ region: 'Europe' }), 'Europe');
});

test('quiz builder produces valid questions', () => {
  const countries = [
    mk('Nigeria', { id: 'NGA' }),
    mk('Ghana', { id: 'GHA' }),
    mk('Togo', { id: 'TGO' }),
    mk('Benin', { id: 'BEN' }),
    mk('France', { id: 'FRA', region: 'Europe', subregion: 'Western Europe' }),
    mk('Spain', { id: 'ESP', region: 'Europe', subregion: 'Southern Europe' }),
    mk('Italy', { id: 'ITA', region: 'Europe', subregion: 'Southern Europe' }),
    mk('Germany', { id: 'DEU', region: 'Europe', subregion: 'Western Europe' }),
    mk('Kenya', { id: 'KEN' }),
    mk('Egypt', { id: 'EGY' }),
  ];
  const quiz = buildQuiz('mc', { type: 'continent', id: 'Africa' }, countries);
  assert.ok(quiz.questions.length > 0);
  for (const q of quiz.questions) {
    assert.equal(q.mode, 'mc');
    assert.equal(q.options.length, 4);
    assert.ok(q.options.some((o) => o.id === q.correct.id));
    assert.equal(new Set(q.options.map((o) => o.id)).size, 4);
  }
  const reverse = buildQuiz('reverse', { type: 'free' }, countries);
  assert.equal(reverse.questions[0].mode, 'reverse');
  const type = buildQuiz('type', { type: 'free' }, countries);
  assert.equal(type.questions[0].mode, 'type');
  assert.equal(type.questions[0].options, undefined);
});

test('match picks only countries with capitals, unique', () => {
  const countries = [
    mk('Nigeria', { id: 'NGA' }),
    mk('Ghana', { id: 'GHA' }),
    mk('Togo', { id: 'TGO' }),
    mk('Benin', { id: 'BEN' }),
    mk('Kenya', { id: 'KEN' }),
    mk('Egypt', { id: 'EGY' }),
    mk('Nauru', { id: 'NRU', capital: [] }),
    mk('France', { id: 'FRA', region: 'Europe', subregion: 'Western Europe' }),
    mk('Spain', { id: 'ESP', region: 'Europe', subregion: 'Southern Europe' }),
    mk('Italy', { id: 'ITA', region: 'Europe', subregion: 'Southern Europe' }),
    mk('Germany', { id: 'DEU', region: 'Europe', subregion: 'Western Europe' }),
    mk('Norway', { id: 'NOR', region: 'Europe', subregion: 'Northern Europe' }),
  ];
  const six = pickMatchCountries({ type: 'continent', id: 'Africa' }, countries);
  assert.equal(six.length, 6);
  assert.ok(six.every((c) => c.capital));
  assert.equal(new Set(six.map((c) => c.id)).size, 6);
});

test('match avoids countries whose capital repeats the country name', () => {
  const countries = [
    mk('Nigeria', { id: 'NGA' }),
    mk('Ghana', { id: 'GHA' }),
    mk('Togo', { id: 'TGO' }),
    mk('Benin', { id: 'BEN' }),
    mk('Kenya', { id: 'KEN' }),
    mk('Egypt', { id: 'EGY' }),
    mk('Gibraltar', { id: 'GIB', cap: 'Gibraltar' }),
  ];
  const picked = pickMatchCountries({ type: 'free' }, countries, {}, 6, mulberry32(1));
  assert.equal(picked.length, 6);
  assert.ok(!picked.some((c) => c.name === c.capital));
});

test('mulberry32 is deterministic per seed and differs between seeds', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  assert.equal(a(), b());
  assert.equal(a(), b());
  const c = mulberry32(43);
  assert.notEqual(a(), c());
});

test('seedForDate varies by date and is stable for the same date', () => {
  assert.equal(seedForDate('2026-08-10'), seedForDate('2026-08-10'));
  assert.notEqual(seedForDate('2026-08-10'), seedForDate('2026-08-11'));
  assert.equal(typeof hashString('x'), 'number');
});

test('daily challenge is deterministic per date and differs across dates', () => {
  const countries = [
    mk('Nigeria', { id: 'NGA' }),
    mk('Ghana', { id: 'GHA' }),
    mk('Togo', { id: 'TGO' }),
    mk('Benin', { id: 'BEN' }),
    mk('Kenya', { id: 'KEN' }),
    mk('Egypt', { id: 'EGY' }),
    mk('France', { id: 'FRA', region: 'Europe', subregion: 'Western Europe' }),
    mk('Spain', { id: 'ESP', region: 'Europe', subregion: 'Southern Europe' }),
    mk('Italy', { id: 'ITA', region: 'Europe', subregion: 'Southern Europe' }),
    mk('Germany', { id: 'DEU', region: 'Europe', subregion: 'Western Europe' }),
  ];
  const d1a = buildDailyChallenge(countries, '2026-08-10');
  const d1b = buildDailyChallenge(countries, '2026-08-10');
  const d2 = buildDailyChallenge(countries, '2026-08-11');
  assert.equal(d1a.questions.length, 10);
  const qids = (q) => q.questions.map((x) => x.correct.id).join(',');
  assert.equal(qids(d1a), qids(d1b));
  assert.notEqual(qids(d1a), qids(d2));
  for (const q of d1a.questions) {
    assert.equal(q.options.length, 4);
    assert.ok(q.options.some((o) => o.id === q.correct.id));
  }
});
