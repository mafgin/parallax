/**
 * On-device translation provider: the Chrome/Edge (138+) built-in Translator
 * API — free, private, covers Hebrew/Russian/Arabic. Runs in the CONTENT
 * context, the one place Chrome reliably exposes the Translator global.
 *
 * The keyless Google fallback lives in lib/providers-google.js and ships ONLY
 * in the Firefox build (excluded by build.sh): the Chrome package is
 * on-device-only, exactly as its store listing claims.
 */
(function () {
  const WL = (globalThis.WL = globalThis.WL || {});

  function builtinAvailable() {
    return typeof self !== "undefined" && "Translator" in self;
  }

  async function builtinStatus(src, dst) {
    if (!builtinAvailable()) return "unavailable";
    try {
      return await self.Translator.availability({
        sourceLanguage: src,
        targetLanguage: dst,
      });
    } catch {
      return "unavailable";
    }
  }

  const _translators = new Map();
  async function getTranslator(src, dst, onDownload) {
    const k = `${src}>${dst}`;
    if (_translators.has(k)) return _translators.get(k);
    const t = await self.Translator.create({
      sourceLanguage: src,
      targetLanguage: dst,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          if (onDownload) onDownload(e.loaded, e.total);
        });
      },
    });
    _translators.set(k, t);
    return t;
  }

  // Translate an array of strings on-device with bounded concurrency. Workers
  // pull in array order, so when the caller passes blocks in document order the
  // top of the article finishes first. `onResult(i, text)` fires per block so
  // the caller can paint each paragraph the moment it's ready (progressive).
  // `shouldStop()` lets a superseded run (language switch, navigation) abort.
  // Returns { failed }: blocks whose translation threw keep the ORIGINAL text —
  // counted so the UI can say so instead of silently showing untranslated text.
  async function translateBuiltinTexts(texts, src, dst, onProgress, onDownload, onResult, shouldStop) {
    const t = await getTranslator(src, dst, onDownload);
    const out = new Array(texts.length);
    let next = 0;
    let done = 0;
    let failed = 0;
    const CONC = 6;
    async function worker() {
      while (next < texts.length) {
        if (shouldStop && shouldStop()) return;
        const i = next++;
        let ok = true;
        try {
          out[i] = await t.translate(texts[i]);
        } catch {
          out[i] = texts[i];
          ok = false;
          failed++;
        }
        if (onResult) onResult(i, out[i], ok);
        done++;
        if (onProgress && done % 4 === 0) onProgress(done, texts.length);
      }
    }
    await Promise.all(Array.from({ length: CONC }, worker));
    if (onProgress) onProgress(texts.length, texts.length);
    return { texts: out, failed };
  }

  WL.providers = {
    builtinAvailable,
    builtinStatus,
    translateBuiltinTexts,
  };
})();
