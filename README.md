# Parallax

Read the same Wikipedia article from **other language editions**,
machine-translated, **side by side** — and see how each edition tells the story.

You're reading *Capitalism* on English Wikipedia. Click Parallax, pick Russian,
and the page becomes a clean full-screen reading view: the English article as
the first column, the Russian article — translated into English — beside it.
Add as many language columns as you like; the comparison follows you as you
browse from article to article.

*Parallax: the apparent change in an object when viewed from a different
position. Same topic, different vantage point, different picture.*

## Private + free

Everything runs **in your browser**. What you read is never sent to a server.

- On **Chrome / Edge** (138+) translation happens **on-device** via the
  browser's built-in translator — no network, no key, no cost. The Chrome
  package contains no online-translation code at all.
- On **Firefox** translation uses a free online fallback (Firefox has no
  on-device engine for Hebrew/Arabic yet).

Desktop only (the on-device translator isn't available on mobile browsers).

## Install (development)

```
cd extension && ./build.sh
```

- **Chrome / Edge:** open `chrome://extensions`, turn on **Developer mode**,
  click **Load unpacked**, choose `extension/dist-chrome/`.
- **Firefox:** open `about:debugging` → **This Firefox** → **Load Temporary
  Add-on…** → pick `extension/dist-firefox/manifest.json`. You may need to grant
  the `translate.googleapis.com` permission in **about:addons → Permissions** for
  the translation fallback.

## Use

1. Open any Wikipedia article.
2. Click the **Parallax** toolbar icon → **Compare editions**.
3. Pick a language (the list is every parallel edition that exists for this
   article). Add more columns with **+ language**.
4. Each column shows that edition translated into your reading language, with
   Wikipedia's own structure — infoboxes, images, tables. Toggle **Original**
   to see the untranslated text. Re-opening the same article is instant (the
   translation is cached locally until the article is edited).

**Settings** (toolbar → Settings): choose which language to translate *into*, and
the translation engine (auto / on-device only / free online fallback).

## How it works

- The list of other-language editions comes from Wikipedia's own `langlinks`
  API — free and public.
- The target edition's full HTML is fetched from the MediaWiki `parse` API,
  stripped of navigation chrome, and translated block by block in place, so the
  column reads like real Wikipedia.
- Translations are cached in your browser keyed on the article's revision id, so
  they only re-translate when the article is actually edited.

## Notes

- The Firefox online fallback is unofficial and can occasionally rate-limit or
  fail; on-device Chrome/Edge is the robust path.
- Parallax is for comparison and reading. Machine translation can paraphrase —
  for anything load-bearing, check the original.

## License

**PolyForm Noncommercial License 1.0.0** — see [`LICENSE.md`](LICENSE.md). You're
free to use, modify, and share Parallax for **noncommercial purposes**. Note this
is a *source-available* license, not OSI/FSF "open source" in the strict sense,
because it restricts commercial use.

## Privacy

Parallax collects nothing. On Chrome/Edge, translation runs entirely on-device
and no article content leaves your browser. See [`PRIVACY.md`](PRIVACY.md).
