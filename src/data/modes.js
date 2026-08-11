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

export const ROOM_MODE_SETTINGS = {
  mc: [],
  type: [
    { key: 'strict', kind: 'toggle', label: 'Strict spelling', hint: 'Accents and exact spelling required', def: false },
  ],
  match: [
    { key: 'pairs', kind: 'range', label: 'Pairs', hint: 'Pairs to match', min: 3, max: 10, step: 1, unit: '', def: MATCH_PAIRS },
  ],
  timed: [
    { key: 'seconds', kind: 'range', label: 'Time limit', hint: 'Seconds for the sprint', min: 30, max: 300, step: 10, unit: 's', def: TIMED_SECONDS },
  ],
  reverse: [
    { key: 'strict', kind: 'toggle', label: 'Strict spelling', hint: 'Accents and exact spelling required', def: false },
  ],
};

export function defaultRoomSettings(mode) {
  const out = {};
  for (const s of ROOM_MODE_SETTINGS[mode] || []) out[s.key] = s.def;
  return out;
}
