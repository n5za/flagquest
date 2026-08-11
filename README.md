# FlagQuest 🌍 BY Nasa & ENJO

A Duolingo-style, fully client-side web app for mastering world flags, capitals and countries. No backend, no account, no install — just open the page, play, and learn.

## Run it

```bash
npm install
npm run dev        # development
npm test           # unit tests (fuzzy matching, XP math, quiz builder, daily challenge seeds)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

The production build (`npm run build`) is a static site — drop `dist/` anywhere a static server can reach it.

## Game modes

- **📅 Daily Challenge** — one fixed, seeded 10-question quiz per calendar day: the same questions for everyone, one shot per day, +25 bonus XP on completion, and a leaderboard tab. A seeded PRNG (mulberry32 + date hash) makes each day's quiz deterministic, so results are comparable.
- **Multiple Choice** — flag shown, pick the country (4 options, weighted toward countries you haven't mastered).
- **Type It!** — flag shown, type the country. Fuzzy matching forgives typos (`Russa` → Russia), common alternate names are accepted (`Ivory Coast`, `Czech Republic`, `Turkey`, `USA`, `UK`, …), and near-misses are revealed with the correct spelling.
- **Capital Match** — 6 flags + 6 capitals, click-to-pair.
- **Timed Sprint** — 60 seconds, multiple choice, combo multiplier on streaks (up to ×~5): `score += 10 + combo·2`.
- **Reverse Mode** — country name shown, pick the flag.

## Progression

- **XP** — base by mode (MC 10 · Type 15 · Match 12 · Timed 10 · Reverse 10), scaled by the country's state (new ×1.3, learning ×1.15, mastered ×0.85) plus a +3 speed bonus for answers under 5s. Daily Challenge answers use MC XP + a flat +25 completion bonus (awarded once, guarded per day).
- **Levels** — XP needed for level N = `100 × N` (100 → 200 → 300 …). Level-up modal + fanfare + confetti.
- **Daily streak** — increments once per calendar day. Miss a day: a streak *freeze* saves you (max 1 stored, earned at 7-day milestones). 🔥 in the top bar. A missed-day freeze also unlocks the *Unbreakable* badge.
- **Country states** — Not started → Learning → Mastered. Mastered requires 3 consecutive correct answers *across sessions*; one wrong answer drops you back to Learning.
- **Badges** — 17 total: first steps, perfect round (100% on ≥6 questions), matchmaker, 7-day streak, daily grinder (5 challenges), freeze used, speed demon (20+ in one sprint), one per continent at 100% mastery, globetrotter (25 mastered), and level milestones (5/10/25).
- **Learning paths** — six continents; Path mode locks each continent until 50% mastery of the previous one (Africa → Europe → Asia → North America → South America → Oceania). Free mode unlocks everything. Mastery = weighted average (`mastered` 1, `learning` 0.5, `new` 0).
- **Leaderboard** — per-mode top 5 sessions (date, score, detail), stored locally, clearable from the Leaderboard and Settings screens.

## Offline & data

After the first successful load **everything needed for quizzes is stored on-device**:

- The country dataset (244 playable entries) is cached in **IndexedDB**.
- The app shell, dataset JSON and every flag image are runtime-cached in a **Service Worker** (Cache Storage).
- On later visits the app loads from cache instantly and refreshes data in the background if online.
- If the very first load fails (no network), a friendly retry screen appears.

Progress, settings and leaderboards live in **localStorage** (`fq:progress`, `fq:settings`, `fq:leaderboards`). Reset everything from Settings.

## Data source note

The original spec asked for `restcountries.com/v3.1`. **That API was retired in 2026** (v1–v4 are gone; the new v5 requires a paid API key). FlagQuest therefore loads the exact dataset restcountries is built on — [mledoze/countries](https://github.com/mledoze/countries) — from the keyless jsDelivr CDN, and renders flags from the free [flagcdn.com](https://flagcdn.com) CDN (SVG at `https://flagcdn.com/{cca2}.svg`). The caching/offline/fallback architecture is unchanged from the original plan.

## Edge cases & decisions

| Case | Decision |
| --- | --- |
| South Africa (3 capitals) | First capital (Pretoria) is used in Match/answers; other capitals are stored but not quizzed. |
| Countries without a capital (e.g. Bouvet Island, Heard Island, US Minor Outlying Islands) | Excluded from Capital Match only; still playable in flag quizzes. |
| Antarctic region (Antarctica, Bouvet, Heard) | Excluded entirely — no meaningful continent path. |
| Disputed/de facto territories | Included exactly as the dataset provides them: Kosovo, Palestine, Taiwan, Western Sahara, etc. Each has an `id` mapped to flagcdn and a continent path. |
| Americas region | Split by subregion: South America → its own path; Caribbean / Central America / Northern America → North America. |
| Multiple-choice distractors | Prefer same-continent countries so guesses require real flag knowledge. |
| Type mode accepted names | Common name + curated aliases map + official name, with edit-distance tolerance (≤1–2 typos depending on length; lenient near-miss auto-accepted with a “Close enough!” note). |
| Daily Challenge replay | One attempt per calendar day; replay attempts are blocked with a toast. The quiz itself is deterministic per date (seeded PRNG), so the same questions appear for every player. |

## Tech

React 18 + Vite 5, plain CSS (dark/light theme via `data-theme`), custom WebAudio sound effects (mutable from the top bar or Settings), a hand-rolled canvas confetti system, and a zero-dependency module layout:

```
src/
  api/countryData.js    dataset fetch + IndexedDB cache
  state/GameContext.jsx progression, streaks, badges, settings, leaderboards, daily challenge
  lib/                  fuzzy match, sound, confetti, IDB, storage, XP math, quiz builder (seeded RNG)
  data/                 aliases, continents, badges, modes, country mapping
  components/           screens + shared UI
public/sw.js            service worker (offline cache)
tests/                  node:test unit tests
```
