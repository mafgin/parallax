/**
 * MediaWiki client + article cleaner. Runs in the content script.
 *
 * Everything here is the FREE, client-side half of Parallax: discovering the
 * parallel-language editions of the current article and fetching one of them.
 * All calls use `origin=*` so the MediaWiki API returns permissive CORS headers
 * and works cross-wiki from the content script (en.wikipedia.org → ru.wikipedia
 * .org). No API key, no backend.
 *
 * Cleaning mirrors daniel/bot/ai.py::_TextExtractor — strip chrome, keep prose —
 * but ported to the browser so nothing is sent to a server.
 */
(function () {
  const WL = (globalThis.WL = globalThis.WL || {});

  // Browsers forbid overriding User-Agent from fetch(); MediaWiki honours
  // Api-User-Agent for client-side callers. Contact UA per Wikimedia policy.
  const API_UA = "Parallax/0.1 (https://afginlabs.com; mafgin@gmail.com)";

  const apiBase = (lang) => `https://${lang}.wikipedia.org/w/api.php`;

  // Identify the current article from the DOM only — content scripts run in an
  // isolated world and can't read page JS (mw.config). Prefer the canonical
  // link (normalised title); fall back to the /wiki/<title> path.
  function getCurrentArticle() {
    const lang = location.hostname.split(".")[0];
    let title = null;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) {
      const m = canonical.href.match(/\/wiki\/(.+)$/);
      if (m) title = decodeURIComponent(m[1]);
    }
    if (!title) {
      const m = location.pathname.match(/\/wiki\/(.+)$/);
      if (m) title = decodeURIComponent(m[1]);
    }
    if (title) title = title.replace(/_/g, " ");
    return { lang, title };
  }

  const NON_ARTICLE_NS = new Set([
    "Special", "Talk", "User", "Wikipedia", "File", "Template", "Help",
    "Category", "Portal", "Draft", "MediaWiki", "Module", "Book",
  ]);

  // Mainspace check that works on EVERY language edition: MediaWiki stamps the
  // body with the numeric namespace (`ns-0` = article), which is identical on
  // he/ru/ar wikis where the namespace prefixes ("מיוחד:", "Служебная:") defeat
  // any English-name list. The name list is only a fallback.
  function isArticlePage() {
    if (!/\/wiki\//.test(location.pathname)) return false;
    const { title } = getCurrentArticle();
    if (!title) return false;
    const ns = document.body && document.body.className.match(/\bns-(-?\d+)\b/);
    if (ns) return ns[1] === "0";
    if (title.includes(":") && NON_ARTICLE_NS.has(title.split(":")[0])) return false;
    return true;
  }

  async function apiGet(lang, params) {
    const url = new URL(apiBase(lang));
    const p = { format: "json", origin: "*", ...params };
    Object.entries(p).forEach(([k, v]) => url.searchParams.set(k, v));
    const resp = await fetch(url.toString(), {
      headers: { "Api-User-Agent": API_UA },
    });
    if (!resp.ok) throw new Error(`Wikipedia API ${resp.status}`);
    return resp.json();
  }

  // All interlanguage links for the current article → the language picker.
  async function fetchLangLinks(lang, title) {
    const data = await apiGet(lang, {
      action: "query",
      prop: "langlinks",
      titles: title,
      lllimit: "500",
      llprop: "url|autonym|langname",
      redirects: "1",
    });
    const pages = data && data.query && data.query.pages;
    const page = pages && Object.values(pages)[0];
    const links = (page && page.langlinks) || [];
    return links.map((l) => ({
      lang: l.lang,
      title: l["*"],
      url: l.url,
      autonym: l.autonym || l.lang,
      langname: l.langname || l.autonym || l.lang,
    }));
  }

  function stripTags(s) {
    const doc = new DOMParser().parseFromString(s, "text/html");
    return (doc.body.textContent || "").trim();
  }

  // Fetch the article keeping its full HTML (structure + images + infobox +
  // tables) so the right pane can look like real Wikipedia, not stripped prose.
  async function fetchArticleHtml(lang, title) {
    const data = await apiGet(lang, {
      action: "parse",
      page: title,
      prop: "text|revid|displaytitle",
      formatversion: "2",
      redirects: "1",
    });
    if (data.error) throw new Error(data.error.info || "parse failed");
    return {
      lang,
      title,
      revid: (data.parse && data.parse.revid) || 0,
      displayTitle: stripTags((data.parse && data.parse.displaytitle) || title),
      html: (data.parse && data.parse.text) || "",
    };
  }

  // Drop navigation chrome but KEEP the article's structure (headings, images,
  // infobox, tables, lists). Absolutise links + image URLs so they resolve
  // outside their wiki. Returns a detached element to import into the pane.
  // Strip in-article navigation chrome but KEEP real content (prose, images,
  // infobox, content tables). ARIA roles are the most reliable signal because
  // they're identical across languages: role="navigation" = navboxes/sidebars,
  // role="note" = hatnotes/message boxes. The class list is a belt-and-braces
  // fallback for wikis that omit the roles.
  const STRIP = [
    "script", "style", "link", "meta",
    ".mw-editsection", ".mw-jump-link",
    'sup.reference', "ol.references", ".reflist", ".mw-references-wrap", ".refbegin", ".refend",
    ".navbox", ".navbox-styles", ".vertical-navbox", ".sidebar", ".side-box", ".sidebar-content",
    ".portal", ".portalbox", ".sistersitebox",
    ".hatnote", ".dablink", ".rellink", ".shortdescription",
    ".ambox", ".mbox", ".ombox", ".tmbox", ".cmbox", ".fmbox", ".dmbox", ".metadata",
    ".vector-toc", "#toc", ".toc", ".mw-empty-elt", ".noprint", ".nomobile",
    ".navigation-not-searchable", ".printfooter", ".catlinks", ".mw-hidden-catlinks",
    '[role="navigation"]', '[role="note"]',
  ].join(",");

  function buildArticleNode(html, lang) {
    const base = `https://${lang}.wikipedia.org`;
    const doc = new DOMParser().parseFromString(html, "text/html");
    const root = doc.querySelector(".mw-parser-output") || doc.body;
    root.querySelectorAll(STRIP).forEach((e) => e.remove());

    const fixUrl = (u) =>
      !u ? u : u.startsWith("//") ? "https:" + u : u.startsWith("/") ? base + u : u;

    // Belt-and-braces: MediaWiki sanitises its parser output, but strip inline
    // event handlers anyway before importing third-party HTML into the page.
    root.querySelectorAll("*").forEach((e) => {
      for (const at of [...e.attributes]) {
        if (/^on/i.test(at.name)) e.removeAttribute(at.name);
      }
    });

    root.querySelectorAll("a[href]").forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      // fixUrl, not startsWith("/"): protocol-relative sister-project links
      // (//commons.wikimedia.org/…) also start with "/" and must not get the
      // wiki base prepended.
      if (/^javascript:/i.test(href)) a.removeAttribute("href");
      else a.setAttribute("href", fixUrl(href));
      // no target=_blank: the content script intercepts clicks to navigate the
      // whole comparison set in the same window (cmd/ctrl-click still new-tabs).
      a.setAttribute("rel", "noopener noreferrer");
    });
    root.querySelectorAll("img[src]").forEach((img) => {
      img.setAttribute("src", fixUrl(img.getAttribute("src")));
      img.removeAttribute("loading");
      const ss = img.getAttribute("srcset");
      if (ss) {
        img.setAttribute(
          "srcset",
          ss
            .split(",")
            .map((s) => {
              const [u, d] = s.trim().split(/\s+/);
              return fixUrl(u) + (d ? " " + d : "");
            })
            .join(", ")
        );
      }
    });

    // Strip the source article's hard-coded direction so the column can follow
    // the READING language's direction — translating he/ar → en must flip the
    // whole layout (text, floats, infobox side) to LTR, not just the words.
    root.removeAttribute("dir");
    root.removeAttribute("lang");
    root.querySelectorAll("[dir]").forEach((e) => e.removeAttribute("dir"));
    root.querySelectorAll("[style]").forEach((e) => {
      const s = e.getAttribute("style");
      if (/direction\s*:/i.test(s) || /text-align\s*:\s*(right|left)/i.test(s)) {
        const cleaned = s
          .replace(/direction\s*:[^;]*;?/gi, "")
          .replace(/text-align\s*:\s*(right|left)[^;]*;?/gi, "");
        if (cleaned.trim()) e.setAttribute("style", cleaned);
        else e.removeAttribute("style");
      }
    });

    // Wrap wide content tables in a horizontal-scroll box so they can't blow out
    // a narrow column's width (infoboxes are left alone — they stack via CSS).
    root.querySelectorAll("table").forEach((t) => {
      if (t.classList.contains("infobox") || t.closest(".wl-tablescroll")) return;
      const wrap = doc.createElement("div");
      wrap.className = "wl-tablescroll";
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });

    return document.importNode(root, true);
  }

  WL.wiki = {
    getCurrentArticle,
    isArticlePage,
    fetchLangLinks,
    fetchArticleHtml,
    buildArticleNode,
  };
})();
