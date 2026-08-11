export function normalize(s, { strict = false } = {}) {
  let out = String(s ?? '').toLowerCase();
  if (!strict) {
    out = out
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
  return out
    .replace(/[^a-z0-9 àâäæçéèêëîïôœùûüÿñÀÂÄÆÇÉÈÊËÎÏÔŒÙÛÜŸÑ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export function closeEnough(input, target, { lenient = false, strict = false } = {}) {
  const t = normalize(target, { strict });
  const limit = lenient
    ? t.length >= 10
      ? 3
      : t.length >= 6
        ? 2
        : 1
    : strict
      ? 0
      : t.length >= 12
        ? 2
        : t.length >= 6
          ? 1
          : 0;
  return levenshtein(normalize(input, { strict }), t) <= limit;
}
