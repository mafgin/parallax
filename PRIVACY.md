# Parallax — Privacy Policy

_Effective: 2026-07-05_

Parallax is a browser extension that shows a Wikipedia article from other
language editions, translated, side by side. **It does not collect, transmit,
sell, or share any personal data.** There are no accounts, no user identifiers,
no tracking of who you are or what you browse.

The one thing it counts — anonymously, and you can turn it off — is **which
articles get compared between which languages**, described precisely below.

## What it accesses, and why

- **The Wikipedia article you're viewing.** When you open the panel, Parallax
  reads the current article and fetches its parallel-language editions directly
  from Wikipedia's public API, in your browser, to display the comparison.
- **On-device translation (Chrome / Edge).** Translation is performed entirely
  on your device using the browser's built-in Translator API. **Article text
  never leaves your computer.** The Chrome package contains no online-translation
  code.

## Anonymous usage statistics (default on, opt-out)

Wikimedia publishes how many times every Wikipedia article is *read* each day —
public, per-article pageview statistics. Parallax counts the same kind of thing
for *comparisons*: how many times an article was compared between two language
editions.

**What is counted:** `(day, source language, article title, compared language,
count)` — e.g. "2026-07-05, en, Capitalism, ru, 3". An event is counted only
when you actively open a comparison (the extension's own function), never from
ordinary browsing.

**What is never collected:** your identity, any user or install ID, IP address
(dropped at the server edge and never written to storage or logs), URLs,
browsing history, reading sessions, or timestamps finer than one day.

**How it's protected by construction:**
- counts accumulate on your device and are sent **at most once a day** as one
  batch, so reading sessions can't be reconstructed from arrival times;
- the published dataset applies a k-threshold — rarely-compared articles are
  aggregated into "(other)" so unusual articles can't single anyone out;
- the aggregate dataset is **public** (https://stats.afginlabs.com/v1/export),
  so what we know, everyone knows — there is no private analytics beyond it.

**Opt-out:** Settings → uncheck "Anonymous usage statistics". A one-time notice
inside the extension tells you this counting exists the first time you compare.

## What it stores locally

Parallax stores a small amount of data **locally** in your browser:

- your reading language, text size, and chosen comparison languages;
- whether the panel is open, to keep it open as you browse;
- translations of articles you've already compared (instant re-reads);
- the pending anonymous counters described above, until the daily send.

You can clear all of this by removing the extension.

## Permissions

- `activeTab` — to detect the Wikipedia article in the current tab when you
  click the toolbar button.
- `storage` — to save your preferences locally.
- `https://*.wikipedia.org/*` — to read the current article and fetch its
  parallel-language editions from Wikipedia for the comparison.
- `https://stats.afginlabs.com/*` — to send the daily anonymous counter batch.

## Firefox

Firefox does not expose an on-device translator to extensions, so **the Firefox
version of Parallax translates online**: the text of the articles you choose to
compare is sent to Google's free translation endpoint
(`translate.googleapis.com`) and the translation is returned to your browser.

- **What is sent:** only the text of the comparison articles you open (which is
  public Wikipedia content), plus the source/target language codes.
- **What is NOT sent:** nothing else — no URLs of other pages you visit, no
  identifiers, no cookies from us, no browsing history.
- This is disclosed in Firefox's install dialog (data collection) and in a
  one-time notice inside the extension the first time online translation runs.
- Translations are cached locally so the same article is not re-sent.

On Chrome / Edge this does not apply — translation is fully on-device and the
Chrome package contains no online-translation code.

## Contact

Source code and issues: https://github.com/mafgin/parallax
