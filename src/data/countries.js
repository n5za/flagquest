import { ALIASES } from './aliases.js';
import { closeEnough } from '../lib/fuzzy.js';

export function deriveContinent(c) {
  if (c.region === 'Africa' || c.region === 'Europe' || c.region === 'Asia' || c.region === 'Oceania') {
    return c.region;
  }
  if (c.region === 'Americas') {
    return c.subregion === 'South America' ? 'South America' : 'North America';
  }
  return null;
}

export function isPlayable(c) {
  return (
    !!c &&
    !!c.cca3 &&
    !!c.name &&
    !!c.name.common &&
    !!c.cca2 &&
    deriveContinent(c) !== null
  );
}

export function toGameCountry(raw) {
  const capitalAll = Array.isArray(raw.capital) && raw.capital.length ? raw.capital : [];
  const cc2 = (raw.cca2 || raw.cca3 || 'xx').toLowerCase();
  return {
    id: raw.cca3,
    name: raw.name.common,
    official: raw.name.official,
    flag: (raw.flags && raw.flags.svg) || `https://flagcdn.com/${cc2}.svg`,
    flagPng: (raw.flags && raw.flags.png) || `https://flagcdn.com/w320/${cc2}.png`,
    capital: capitalAll[0] ?? null,
    capitals: capitalAll,
    continent: deriveContinent(raw),
    subregion: raw.subregion,
    aliases: ALIASES[raw.cca3] || [],
    status: raw.status,
  };
}

export function checkAnswer(country, input, { lenient = false } = {}) {
  const targets = [country.name, ...country.aliases];
  if (targets.some((t) => closeEnough(input, t, { lenient }))) return true;
  return closeEnough(input, country.official, { lenient });
}
