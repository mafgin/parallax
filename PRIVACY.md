# Parallax — Privacy Policy

_Effective: 2026-07-04_

Parallax is a browser extension that shows a Wikipedia article from other
language editions, translated, side by side. **It does not collect, transmit,
sell, or share any personal data.** There are no accounts, no analytics, no
tracking, and no servers operated by us.

## What it accesses, and why

- **The Wikipedia article you're viewing.** When you open the panel, Parallax
  reads the current article and fetches its parallel-language editions directly
  from Wikipedia's public API, in your browser, to display the comparison. This
  content is processed locally and is **not** sent to us or to any third party.
- **On-device translation (Chrome / Edge).** Translation is performed entirely
  on your device using the browser's built-in Translator API. **Article text
  never leaves your computer.** The Chrome package contains no online-translation
  code.

## What it stores

Parallax stores a small amount of data **locally** in your browser
(`storage.local` and a local translation cache), never transmitted anywhere:

- your reading language, text size, and chosen comparison languages;
- whether the panel is open, to keep it open as you browse;
- translations of articles you've already compared, so re-reads are instant.

You can clear this at any time by removing the extension.

## Data we collect

**None.** Parallax does not collect or transmit personal or sensitive
information, browsing history, or web-content data. It does not use your data
for advertising or any purpose unrelated to its single function (comparing
Wikipedia language editions).

## Permissions

- `activeTab` — to detect the Wikipedia article in the current tab when you
  click the toolbar button.
- `storage` — to save your preferences locally.
- `https://*.wikipedia.org/*` — to read the current article and fetch its
  parallel-language editions from Wikipedia for the comparison.

## Firefox

Firefox does not expose an on-device translator to extensions, so **the Firefox
version of Parallax translates online**: the text of the articles you choose to
compare is sent to Google's free translation endpoint
(`translate.googleapis.com`) and the translation is returned to your browser.

- **What is sent:** only the text of the comparison articles you open (which is
  public Wikipedia content), plus the source/target language codes.
- **What is NOT sent:** nothing else — no URLs of other pages you visit, no
  identifiers, no cookies from us, no browsing history.
- This is disclosed in Firefox's install dialog (data collection: website
  content) and in a one-time notice inside the extension the first time online
  translation runs.
- Translations are cached locally so the same article is not re-sent.

On Chrome / Edge this does not apply — translation is fully on-device and the
Chrome package contains no online-translation code.

## Contact

Source code and issues: https://github.com/mafgin/parallax
