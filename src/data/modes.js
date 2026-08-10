export const MODES = {
  mc: { title: 'Multiple Choice', icon: '🎯', desc: 'Pick the right country', color: '#58cc02' },
  type: { title: 'Type It!', icon: '⌨️', desc: 'Spell the country name', color: '#1cb0f6' },
  match: { title: 'Capital Match', icon: '🧩', desc: 'Pair flags & capitals', color: '#ce82ff' },
  timed: { title: 'Timed Sprint', icon: '⏱️', desc: '60s. Max correct.', color: '#ff4b4b' },
  reverse: { title: 'Reverse Mode', icon: '🔁', desc: 'Name → flag', color: '#ff9600' },
  challenge: { title: 'Daily Challenge', icon: '📅', desc: 'Same 10 for everyone', color: '#ffc800' },
};

export const QUIZ_LEN = 10;
export const COUNTRY_PRACTICE_LEN = 5;
export const TIMED_SECONDS = 60;
export const MATCH_PAIRS = 6;
export const SPEED_MS = 5000;
export const CHALLENGE_BONUS = 25;
