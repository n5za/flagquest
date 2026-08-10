import { isPlayable, toGameCountry } from '../data/countries.js';
import { idbGet, idbPut } from '../lib/idb.js';

const DB = 'flagquest';
const KEY = 'countries-v1';
const API = 'https://cdn.jsdelivr.net/gh/mledoze/countries@master/dist/countries.json';
const MAX_AGE = 7 * 24 * 3600 * 1000;

async function fetchApi() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  const raw = await res.json();
  const countries = raw
    .filter(isPlayable)
    .map(toGameCountry)
    .sort((a, b) => a.name.localeCompare(b.name));
  await idbPut(DB, KEY, { countries, fetchedAt: Date.now() });
  return countries;
}

function refreshInBackground() {
  fetchApi().catch(() => {});
}

export async function loadCountries({ forceRefresh = false } = {}) {
  const cached = await idbGet(DB, KEY);
  const fresh = cached && Date.now() - cached.fetchedAt < MAX_AGE;

  if (cached && (fresh || !navigator.onLine)) {
    if (!fresh && navigator.onLine && !forceRefresh) refreshInBackground();
    return { countries: cached.countries, fromCache: true, stale: !fresh };
  }

  if (cached) {
    try {
      const countries = await fetchApi();
      return { countries, fromCache: false, stale: false };
    } catch {
      return { countries: cached.countries, fromCache: true, stale: true };
    }
  }

  const countries = await fetchApi();
  return { countries, fromCache: false, stale: false };
}
