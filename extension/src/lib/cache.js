/**
 * IndexedDB translation cache. Loaded in the BACKGROUND context so it lives on
 * the extension origin (unified across all *.wikipedia.org), not a per-wiki
 * page origin. Keyed on (targetLang, title, revid, readingLang) — an unchanged
 * revid means the translation is still valid, so re-reads are instant and free.
 * No TTL: revid is the invalidator, and put() evicts other revids of the same
 * article so the store can't grow without bound as articles get edited.
 */
(function () {
  const WL = (globalThis.WL = globalThis.WL || {});
  const DB_NAME = "wikilens";
  const STORE = "translations";
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        // v2 added the pfx index for stale-revid eviction. Pre-release v1 data
        // is just a cache — safe to drop and rebuild.
        if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE);
        const store = db.createObjectStore(STORE, { keyPath: "key" });
        store.createIndex("pfx", "pfx");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  const keyFor = (m) => `${m.targetLang}:${m.title}:${m.revid}:${m.readingLang}`;
  const pfxFor = (m) => `${m.targetLang}:${m.title}:${m.readingLang}`;

  async function get(meta) {
    const db = await open();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(keyFor(meta));
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  }

  async function put(meta, value) {
    const db = await open();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.put({ key: keyFor(meta), pfx: pfxFor(meta), value, savedAt: Date.now() });
      // evict entries for the same (article, reading lang) at other revids
      const cur = store.index("pfx").openCursor(IDBKeyRange.only(pfxFor(meta)));
      cur.onsuccess = () => {
        const c = cur.result;
        if (!c) return;
        if (c.value.key !== keyFor(meta)) c.delete();
        c.continue();
      };
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  WL.cache = { get, put };
})();
