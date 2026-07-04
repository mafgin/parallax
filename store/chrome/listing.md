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
cd dist-chrome && zip -rq ../parallax-chrome-0.1.0.zip .
```

Upload `extension/parallax-chrome-0.1.0.zip` (manifest.json at the zip root).

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
• Nothing about what you read is sent to any server. No accounts, no tracking,
  no analytics.
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

## Privacy

- Privacy policy URL: https://github.com/mafgin/parallax/blob/main/PRIVACY.md
- Data collection disclosures: **does not collect or transmit** any user data.
  Article content is accessed but processed locally and never transmitted.
- Certifications: does not sell/transfer data; no use unrelated to the single
  purpose; complies with the Developer Program Policies.

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
