export const CONTINENTS = [
  { id: 'Africa', icon: 'mountain', color: '#ff9600', order: 0 },
  { id: 'Europe', icon: 'castle', color: '#1cb0f6', order: 1 },
  { id: 'Asia', icon: 'landmark', color: '#ff4b4b', order: 2 },
  { id: 'North America', icon: 'building2', color: '#ce82ff', order: 3 },
  { id: 'South America', icon: 'bird', color: '#58cc02', order: 4 },
  { id: 'Oceania', icon: 'treepalm', color: '#2ec4b6', order: 5 },
];

export const CONTINENT_MAP = Object.fromEntries(CONTINENTS.map((c) => [c.id, c]));

export const UNLOCK_MASTERY = 0.5;
