export const MODES = {
  mc: { title: 'Multiple Choice', icon: 'target', desc: 'Pick the right country', color: '#58cc02' },
  type: { title: 'Type It!', icon: 'keyboard', desc: 'Spell the country name', color: '#1cb0f6' },
  match: { title: 'Capital Match', icon: 'puzzle', desc: 'Pair flags & capitals', color: '#ce82ff' },
  timed: { title: 'Timed Sprint', icon: 'timer', desc: '60s. Max correct.', color: '#ff4b4b' },
  reverse: { title: 'Reverse Mode', icon: 'repeat', desc: 'Name → flag', color: '#ff9600' },
  challenge: { title: 'Daily Challenge', icon: 'calendar', desc: 'Same 10 for everyone', color: '#ffc800' },
  room: { title: 'Room Battle', icon: 'users', desc: 'Race friends live', color: '#ff9600' },
};

export const QUIZ_LEN = 10;
export const COUNTRY_PRACTICE_LEN = 5;
export const TIMED_SECONDS = 60;
export const MATCH_PAIRS = 6;
export const SPEED_MS = 5000;
export const CHALLENGE_BONUS = 25;
