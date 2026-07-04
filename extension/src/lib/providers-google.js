/**
 * Free keyless Google fallback — FIREFOX ONLY. Runs in the BACKGROUND (the
 * cross-origin fetch needs host_permissions). Unofficial / fragile — the
 * documented weak link.
 *
 * This file is excluded from the Chrome build entirely (build.sh) so the Chrome
 * package contains no code path that could send article text off-device.
 */
(function () {
  const WL = (globalThis.WL = globalThis.WL || {});

  function splitForUrl(text, max) {
    max = max || 1400;
    if (text.length <= max) return [text];
    const parts = [];
    let rest = text;
    while (rest.length > max) {
      let cut = rest.lastIndexOf(" ", max);
      if (cut < max * 0.5) cut = max;
      parts.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    if (rest) parts.push(rest);
    return parts;
  }

  async function googleOne(text, src, dst) {
    const results = [];
    for (const part of splitForUrl(text)) {
      const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t" +
        `&sl=${encodeURIComponent(src)}&tl=${encodeURIComponent(dst)}` +
        `&q=${encodeURIComponent(part)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`google ${resp.status}`);
      const data = await resp.json();
      results.push((data[0] || []).map((seg) => seg[0]).join(""));
    }
    return results.join("");
  }

  // Returns { texts, failed, failedIdx }: failed blocks keep the ORIGINAL text
  // and are reported by index, so the caller can show them without caching them.
  async function googleTranslateTexts(texts, src, dst, onProgress) {
    const out = [];
    let failed = 0;
    const failedIdx = [];
    for (let i = 0; i < texts.length; i++) {
      try {
        out.push(await googleOne(texts[i], src, dst));
      } catch {
        out.push(texts[i]);
        failed++;
        failedIdx.push(i);
      }
      if (onProgress) onProgress(i + 1, texts.length);
      await new Promise((r) => setTimeout(r, 90)); // pace the unofficial endpoint
    }
    return { texts: out, failed, failedIdx };
  }

  WL.providersGoogle = { googleTranslateTexts };
})();
