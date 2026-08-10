export const CONTINENTS = [
  { id: 'Africa', emoji: '🦁', color: '#ff9600', order: 0 },
  { id: 'Europe', emoji: '🏰', color: '#1cb0f6', order: 1 },
  { id: 'Asia', emoji: '🐉', color: '#ff4b4b', order: 2 },
  { id: 'North America', emoji: '🗽', color: '#ce82ff', order: 3 },
  { id: 'South America', emoji: '🦜', color: '#58cc02', order: 4 },
  { id: 'Oceania', emoji: '🏝️', color: '#2ec4b6', order: 5 },
];

export const CONTINENT_MAP = Object.fromEntries(CONTINENTS.map((c) => [c.id, c]));

export const UNLOCK_MASTERY = 0.5;
