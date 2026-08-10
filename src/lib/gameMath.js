export const XP_FOR_LEVEL_BASE = 100;

export function xpNeededForLevel(level) {
  return XP_FOR_LEVEL_BASE * level;
}

export function levelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpNeededForLevel(level)) {
    remaining -= xpNeededForLevel(level);
    level++;
  }
  return {
    level,
    into: remaining,
    needed: xpNeededForLevel(level),
    pct: Math.min(100, Math.round((remaining / xpNeededForLevel(level)) * 100)),
  };
}

export const BASE_XP = { mc: 10, type: 15, match: 12, timed: 10, reverse: 10 };

export const STATE_MULT = { new: 1.3, learning: 1.15, mastered: 0.85 };

export function xpForAnswer(state, mode, { speed = false, combo = 0 } = {}) {
  let xp = BASE_XP[mode] * (STATE_MULT[state] ?? 1);
  if (mode === 'timed') xp += Math.min(combo, 20) * 2;
  else if (speed) xp += 3;
  return Math.round(xp);
}

export function masteryOf(countries, continent) {
  const list = countries.filter((c) => c.continent === continent);
  if (!list.length) return 0;
  const sum = list.reduce(
    (acc, c) => acc + (c.state === 'mastered' ? 1 : c.state === 'learning' ? 0.5 : 0),
    0
  );
  return sum / list.length;
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function yesterdayKey() {
  return todayKey(new Date(Date.now() - 86400000));
}
