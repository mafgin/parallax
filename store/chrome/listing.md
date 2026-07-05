# Chrome Web Store — listing copy & submission notes

Copy-paste source for the Chrome Web Store developer console. Phase A = Chrome
(on-device only). Firefox/AMO is Phase B (separate, because of the online
fallback).

## Package

The Chrome build is **on-device only** — `manifest.chrome.json` does NOT request
`translate.googleapis.com` (translation runs through the browser's built-in
Translator API) and `build.sh` excludes the online-fallback code from the Chrome
package entirely, so nothing about what you read can leave the device.

Build + zip the upload artifact:

```
cd extension && ./build.sh
cd dist-chrome && zip -rq ../parallax-chrome-0.2.0.zip .
```

Upload `extension/parallax-chrome-0.2.0.zip` (manifest.json at the zip root).

## Item name (≤75 chars)

Parallax — Compare Wikipedia Editions

## Summary (≤132 chars)

Read the same Wikipedia article from other language editions, translated side by
side — see how each edition tells the story.

## Category

Education

## Language

English (listing); the extension itself works in any language.

## Detailed description

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

Private by design:
• Translation happens entirely on your device (Chrome's built-in translator) —
  the package contains no online-translation code.
• No accounts, no identifiers, no browsing history. The only thing counted —
  anonymously, opt-out in Settings — is which articles get compared between
  which languages (day-level counts, published as an open dataset, the same way
  Wikipedia publishes per-article pageview statistics).
• The list of editions and the article text come straight from Wikipedia's
  public API, in your browser.

Notes:
• Desktop only — the on-device translator isn't available on mobile browsers.
• Requires Chrome/Edge 138 or newer (the first translation of a language pair
  downloads a small on-device model once).
• Free and noncommercial (PolyForm Noncommercial license).

## Single purpose (required field)

Compare a Wikipedia article across language editions by displaying other
editions, machine-translated, side by side with the current article.

## Permission justifications (review form)

- **activeTab** — to detect the Wikipedia article in the current tab when the
  user clicks the toolbar button; no access until the user acts.
- **storage** — to save the user's preferences (reading language, text size,
  chosen comparison languages, panel state) locally.
- **Host permission `https://*.wikipedia.org/*`** — to read the current article
  and fetch its parallel-language editions from Wikipedia's API to build the
  side-by-side comparison.
- **Host permission `https://stats.afginlabs.com/*`** — to send the daily
  anonymous usage-counter batch (see Privacy below).

## Privacy (form answers)

- Privacy policy URL: https://github.com/mafgin/parallax/blob/main/PRIVACY.md
- Data collection disclosures: check **"Web history"** — the extension counts
  which articles are compared between which language editions: (day, source
  language, article title, target language, count). Aggregated on-device, sent
  at most once daily, with NO user/install identifiers; server stores no IPs.
  Default on, opt-out in Settings, disclosed in-product on first use. The
  aggregate dataset is public (like Wikimedia's pageview stats). Nothing else
  is collected.
- Certifications: does not sell/transfer data; no use unrelated to the single
  purpose; not for creditworthiness; complies with Developer Program Policies
  including Limited Use.

## Assets still needed (Mor)

- **Developer account** — one-time $5 registration + 2FA enabled.
- **Screenshots** — at least 1 (1280×800 or 640×400), up to 5. Suggested shots:
  (1) en + ru + he three-column compare on "Capitalism"; (2) the "+" language
  picker; (3) "Original" toggle; (4) a mobile-narrow column.
- **(Optional)** 440×280 small promo tile.
- **Icon check** — current icons predate the rename; decide whether they still
  fit "Parallax" or need a refresh before submission.

## Review risks to expect

- Broad-ish host match `*.wikipedia.org` — justified above.
- Desktop-only behavior — stated in the description to avoid "doesn't work"
  reviews from mobile users.
- Single-purpose — clean (one function).
- The string `translate.googleapis.com` appears once in content.js as a
  capability CHECK (it verifies the permission is absent and raises a clear
  error) — no fetch to that host exists in the Chrome package.
- Usage statistics: default-on but fully disclosed (privacy tab + policy +
  in-product notice + Settings opt-out), anonymous by construction (no IDs, no
  IPs stored, daily batches, k-thresholded public aggregate). Reviewer-facing
  argument: same data class as Wikimedia's own public pageview statistics.
