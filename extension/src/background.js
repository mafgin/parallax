/**
 * Background broker (Chrome: classic service worker; Firefox: event page).
 *
 * Owns two things the content script can't do itself:
 *   1. The IndexedDB cache — on the extension origin, so it's unified across
 *      every *.wikipedia.org instead of fragmented per page origin.
 *   2. The free Google fallback fetch (FIREFOX BUILD ONLY — the file isn't in
 *      the Chrome package): a cross-origin request that needs the background's
 *      host_permissions powers.
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
    case "translate-google-texts": {
      if (!WL.providersGoogle) return { error: "online fallback not available in this build" };
      const r = await WL.providersGoogle.googleTranslateTexts(msg.texts, msg.src, msg.dst);
      return { texts: r.texts, failed: r.failed, failedIdx: r.failedIdx };
    }
    default:
      return { error: "unknown message" };
  }
}
