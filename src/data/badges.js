export const BADGES = [
  { id: 'first-steps', name: 'First Steps', desc: 'Answer your first question correctly', icon: 'sprout' },
  { id: 'perfect-round', name: 'Perfect Round', desc: 'Score 100% on a quiz with at least 6 questions', icon: 'target' },
  { id: 'perfect-match', name: 'Matchmaker', desc: 'Complete a matching round with no mistakes', icon: 'puzzle' },
  { id: 'seven-day-streak', name: 'On Fire', desc: 'Reach a 7-day login streak', icon: 'flame' },
  { id: 'challenge-5', name: 'Daily Grinder', desc: 'Complete 5 daily challenges', icon: 'calendar' },
  { id: 'freeze-used', name: 'Unbreakable', desc: 'Survive a missed day using a streak freeze', icon: 'snowflake' },
  { id: 'speed-demon', name: 'Speed Demon', desc: 'Get 20+ correct answers in one timed challenge', icon: 'zap' },
  { id: 'africa-explorer', name: 'Africa Explorer', desc: 'Reach 100% mastery on the Africa path', icon: 'mountain' },
  { id: 'europe-explorer', name: 'Europe Explorer', desc: 'Reach 100% mastery on the Europe path', icon: 'castle' },
  { id: 'asia-explorer', name: 'Asia Explorer', desc: 'Reach 100% mastery on the Asia path', icon: 'landmark' },
  { id: 'north-america-explorer', name: 'North America Explorer', desc: 'Reach 100% mastery on the North America path', icon: 'building2' },
  { id: 'south-america-explorer', name: 'South America Explorer', desc: 'Reach 100% mastery on the South America path', icon: 'bird' },
  { id: 'oceania-explorer', name: 'Oceania Explorer', desc: 'Reach 100% mastery on the Oceania path', icon: 'treepalm' },
  { id: 'globetrotter', name: 'Globetrotter', desc: 'Master 25 countries', icon: 'map' },
  { id: 'level-5', name: 'Rising Star', desc: 'Reach level 5', icon: 'star' },
  { id: 'level-10', name: 'World Traveler', desc: 'Reach level 10', icon: 'globe' },
  { id: 'level-25', name: 'Cartographer', desc: 'Reach level 25', icon: 'crown' },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]));
