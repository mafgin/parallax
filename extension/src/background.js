/**
 * Background broker (Chrome: classic service worker; Firefox: event page).
 *
 * Owns three things the content script can't do itself:
 *   1. The IndexedDB cache — on the extension origin, so it's unified across
 *      every *.wikipedia.org instead of fragmented per page origin.
 *   2. The free Google fallback fetch (FIREFOX BUILD ONLY — the file isn't in
 *      the Chrome package): a cross-origin request that needs the background's
 *      host_permissions powers.
 *   3. Anonymous usage counters — see stats section below.
 *
 * On-device translation does NOT happen here — it runs in the content script,
 * the one context where Chrome's Translator global is reliably exposed.
 */
try {
  // Chrome classic SW: load shared libs synchronously. providers-google.js is
  // deliberately absent from the Chrome build (on-device only).
  importScripts("lib/browser-polyfill.js", "lib/cache.js");
} catch (e) {
  // Firefox loads these via manifest background.scripts[]; importScripts is
  // undefined there → ignore.
}

/* ------------------------- anonymous usage stats -------------------------
 *
 * What is collected (default ON, opt-out in Settings — disclosed in the
 * privacy policy, the store listing, and a one-time in-product notice):
 *   (day, source lang, source article title, compared lang, count)
 * — the same data class as Wikimedia's public per-article pageview stats.
 *
 * What is NEVER collected: user/install identifiers, IPs (server drops them),
 * URLs, sessions, timestamps finer than a day, any page the user merely visits.
 * Events fire only on the extension's own action (opening a comparison).
 *
 * Counts accumulate locally and flush AT MOST once a day as one batch, so the
 * server can't reconstruct reading sessions from arrival times.
 */
const STATS_URL = "https://stats.afginlabs.com/v1/batch";
const STATS_FLUSH_MS = 20 * 60 * 60 * 1000; // ~daily
const STATS_BUF_CAP = 2000;
const STATS_SEP = "\u0001"; // control char - never appears in titles/langs

async function statCount(sl, st, tl) {
  if (!sl || !st || !tl) return;
  const { wlStatsEnabled } = await browser.storage.local.get("wlStatsEnabled");
  if (wlStatsEnabled === false) return;
  const d = new Date().toISOString().slice(0, 10);
  const key = [d, sl, st, tl].join(STATS_SEP);
  const { wlStatsBuf } = await browser.storage.local.get("wlStatsBuf");
  const buf = wlStatsBuf || {};
  if (!(key in buf) && Object.keys(buf).length >= STATS_BUF_CAP) return; // cap, drop new
  buf[key] = (buf[key] || 0) + 1;
  await browser.storage.local.set({ wlStatsBuf: buf });
  statsFlush(false).catch(() => {});
}

async function statsFlush(force) {
  const got = await browser.storage.local.get(["wlStatsEnabled", "wlStatsBuf", "wlStatsLastFlush"]);
  if (got.wlStatsEnabled === false) return;
  const buf = got.wlStatsBuf || {};
  const keys = Object.keys(buf);
  if (!keys.length) return;
  if (!force && Date.now() - (got.wlStatsLastFlush || 0) < STATS_FLUSH_MS) return;
  const events = keys.slice(0, 300).map((k) => {
    const [d, sl, st, tl] = k.split(STATS_SEP);
    return { d, sl, st, tl, n: Math.min(buf[k], 500) };
  });
  try {
    const resp = await fetch(STATS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ v: 1, events }),
    });
    if (!resp.ok) return; // server refused — keep buffer, retry next window
    const cur = (await browser.storage.local.get("wlStatsBuf")).wlStatsBuf || {};
    events.forEach((e) => delete cur[[e.d, e.sl, e.st, e.tl].join(STATS_SEP)]);
    await browser.storage.local.set({ wlStatsBuf: cur, wlStatsLastFlush: Date.now() });
  } catch (e) {
    // offline / endpoint unreachable — keep buffer (day-keyed counts merge fine)
  }
}

// Runs on every service-worker wake (Chrome) / event-page load (Firefox):
// flush a pending backlog even if the user stopped comparing.
statsFlush(false).catch(() => {});

/* ------------------------------ messages -------------------------------- */

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handle(msg)
    .then(sendResponse)
    .catch((e) => sendResponse({ error: String((e && e.message) || e) }));
  return true; // keep the channel open for the async response
});

async function handle(msg) {
  switch (msg && msg.type) {
    case "cache-get":
      return { value: await WL.cache.get(msg.meta) };
    case "cache-put":
      await WL.cache.put(msg.meta, msg.value);
      return { ok: true };
    case "stat-count":
      await statCount(msg.sl, msg.st, msg.tl);
      return { ok: true };
    case "translate-google-texts": {
      if (!WL.providersGoogle) return { error: "online fallback not available in this build" };
      const r = await WL.providersGoogle.googleTranslateTexts(msg.texts, msg.src, msg.dst);
      return { texts: r.texts, failed: r.failed, failedIdx: r.failedIdx };
    }
    default:
      return { error: "unknown message" };
  }
}
