# Firefox Add-ons (AMO) — listing copy & submission notes

Copy-paste source for addons.mozilla.org devhub. Phase B. The Firefox build
uses the keyless Google online endpoint (no on-device translator is exposed to
Firefox extensions, and Mozilla's engine lacks Hebrew/Arabic) — **disclosed**,
not hidden: `data_collection_permissions: ["websiteContent"]` (install-dialog
consent), PRIVACY.md §Firefox, and a one-time in-product notice.

## Package

```
cd extension && ./build.sh
cd dist-firefox && zip -rq ../parallax-firefox-0.1.0.zip .
```

Upload `extension/parallax-firefox-0.1.0.zip`. No source-code package needed —
vanilla JS, no bundler/minification (the zip IS the source).

Pre-flight: `web-ext lint --source-dir dist-firefox` must be clean.

## Name

Parallax — Compare Wikipedia Editions

## Summary (≤250 chars)

Read the same Wikipedia article from other language editions, machine-translated
side by side — and see how each edition tells the story. Free, no account, no
tracking.

## Description

Parallax lets you read the same Wikipedia article from other language editions,
machine-translated into your language, side by side — so you can see how
Wikipedia's different language editions tell the same story differently.

Parallax: the apparent change in an object when viewed from a different
position. Same topic, different vantage point, different picture.

Open any Wikipedia article, click Parallax, and the page becomes a clean,
Wikipedia-style reading view with the source article and the editions you choose
(Russian, Hebrew, Arabic, German, …) as equal columns. Add languages with "+",
switch a column's language, toggle the untranslated original, resize text, and
browse from article to article with the comparison following you.

Privacy — read this:
• On Firefox, translation uses Google's free online translation endpoint: the
  text of the (public Wikipedia) articles you compare is sent to Google and the
  translation comes back to your browser. Nothing else is sent — no browsing
  history, no identifiers, no other pages.
• Parallax itself has no server, no account, no analytics, and collects nothing.
• Translations are cached locally, keyed on the article revision, so re-reads
  don't re-send anything.
• The list of editions and the article text come straight from Wikipedia's
  public API, in your browser.

Notes:
• The online translation service is a free public endpoint and may occasionally
  rate-limit; failed paragraphs stay in the original language and are marked.
• Free and noncommercial (PolyForm Noncommercial license). Source:
  https://github.com/mafgin/parallax

## Categories

Education; Language Tools (per AMO's picker — "Language & Translation" family)

## Data collection disclosure (AMO form + manifest)

- Manifest: `data_collection_permissions.required = ["websiteContent"]` —
  Firefox shows this in the install dialog.
- Form: transmits website content (article text of pages the user explicitly
  compares) to a third-party translation service (Google). No PII, no browsing
  activity, no telemetry. Not sold, not shared beyond the translation request.
- Privacy policy URL: https://github.com/mafgin/parallax/blob/main/PRIVACY.md

## Permission justifications

- **activeTab** — detect the Wikipedia article in the current tab on toolbar
  click; no access until the user acts.
- **storage** — preferences (reading language, text size, chosen languages,
  panel state) + one-time-notice flag, all local.
- **`https://*.wikipedia.org/*`** — read the current article and fetch its
  parallel-language editions from Wikipedia's API.
- **`https://translate.googleapis.com/*`** — the online translation request
  (Firefox only; the Chrome build translates on-device and omits this entirely).

## Review risks to expect

- **Unofficial Google endpoint** — the main one. Mitigations already in place:
  full disclosure (manifest + policy + in-product notice), graceful failure
  (paragraphs keep original text + are counted in the status), local caching to
  minimize calls, 90ms pacing between requests. If a reviewer objects outright,
  the fallback plan is NOT BYOK (product rule: never ask users for an API key) —
  it's waiting for Mozilla to expose the built-in translator to extensions.
- Mixed on-device/online story — the description is explicit that Firefox =
  online, Chrome = on-device.
- Android: `gecko_android` was dropped for v1 (untested, docs say desktop-only).
  `web-ext lint` still emits ONE warning (KEY_FIREFOX_ANDROID_UNSUPPORTED…)
  because it projects the desktop `strict_min_version: 140` onto Android, where
  `data_collection_permissions` needs 142. Warning ≠ error; AMO accepts it.
  Keep Android compatibility OFF in the AMO listing for v1.

## Assets still needed (Mor)

- Mozilla Add-ons account (free).
- Screenshots — reuse the Chrome set (1280×800 works on AMO too).
- Submit: devhub → new add-on → upload zip → listed → fill forms above.
