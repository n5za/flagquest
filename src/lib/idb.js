export function openDB(name, version = 1, upgrade) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (upgrade) upgrade(db);
      else if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, store, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let out;
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
    const req = fn(s);
    if (req && req.onsuccess !== undefined) {
      req.onsuccess = (e) => {
        out = e.target.result;
      };
    }
  });
}

export async function idbGet(dbName, key) {
  const db = await openDB(dbName);
  const value = await tx(db, 'kv', 'readonly', (s) => s.get(key));
  db.close();
  return value === undefined ? undefined : value;
}

export async function idbPut(dbName, key, value) {
  const db = await openDB(dbName);
  await tx(db, 'kv', 'readwrite', (s) => s.put(value, key));
  db.close();
}

export async function idbDel(dbName, key) {
  const db = await openDB(dbName);
  await tx(db, 'kv', 'readwrite', (s) => s.delete(key));
  db.close();
}
