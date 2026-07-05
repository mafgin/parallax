#!/usr/bin/env python3
"""
Parallax stats collector — anonymous comparison counters.

Receives daily-batched counts from the extension:
  POST /v1/batch   {"v":1,"events":[{"d":"2026-07-05","sl":"en","st":"Capitalism","tl":"ru","n":3}]}
and serves the public aggregate dataset:
  GET  /v1/export  k-thresholded rows (titles seen < K times/week roll into "(other)")
  GET  /v1/pairs   language-pair totals only (no titles)
  GET  /healthz

Privacy invariants (these are promises made in PRIVACY.md — do not break them):
  * No IPs, user agents, cookies, or identifiers are stored OR logged.
    log_message is overridden for exactly this reason.
  * Only (day, source lang, source title, target lang, count) is kept —
    the same data class as Wikimedia's public per-article pageview dumps.
  * Timestamps are day-granularity; batches arrive at most daily per client.

Runs on the Mac mini behind the Cloudflare tunnel (stats.afginlabs.com -> :3011,
CF Access Bypass policy — public endpoint). stdlib only, no dependencies.
"""
import json
import os
import re
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 3011
BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE, "data", "stats.db")

MAX_BODY = 256 * 1024
MAX_EVENTS = 300
MAX_TITLE = 400
MAX_N = 500
MAX_AGE_DAYS = 14  # clients may flush a buffered backlog; older days are dropped
K_THRESHOLD = 5    # export: titles below this weekly count roll into "(other)"

LANG_RE = re.compile(r"^[a-z][a-z0-9-]{0,14}$")
DAY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

_tls = threading.local()


def db():
    if not hasattr(_tls, "conn"):
        conn = sqlite3.connect(DB_PATH)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=5000")
        _tls.conn = conn
    return _tls.conn


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS comparisons (
             day        TEXT NOT NULL,
             src_lang   TEXT NOT NULL,
             src_title  TEXT NOT NULL,
             dst_lang   TEXT NOT NULL,
             n          INTEGER NOT NULL DEFAULT 0,
             updated_at TEXT NOT NULL,
             PRIMARY KEY (day, src_lang, src_title, dst_lang)
           )"""
    )
    conn.commit()
    conn.close()


def utcnow():
    return datetime.now(timezone.utc)


def valid_event(ev):
    """Return a normalized (day, sl, st, tl, n) tuple or None."""
    if not isinstance(ev, dict):
        return None
    d, sl, st, tl, n = (ev.get("d"), ev.get("sl"), ev.get("st"), ev.get("tl"), ev.get("n"))
    if not (isinstance(d, str) and DAY_RE.match(d)):
        return None
    try:
        day = datetime.strptime(d, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None
    now = utcnow()
    if day > now + timedelta(days=1) or day < now - timedelta(days=MAX_AGE_DAYS):
        return None
    if not (isinstance(sl, str) and LANG_RE.match(sl)):
        return None
    if not (isinstance(tl, str) and LANG_RE.match(tl)):
        return None
    if not isinstance(st, str):
        return None
    st = st.strip()[:MAX_TITLE]
    if not st:
        return None
    if not isinstance(n, int) or n < 1 or n > MAX_N:
        return None
    return (d, sl, st, tl, n)


class Handler(BaseHTTPRequestHandler):
    server_version = "parallax-stats/1.0"

    # Privacy invariant: the default implementation logs the client address.
    # Log method + path only.
    def log_message(self, fmt, *args):
        print("%s %s %s" % (utcnow().isoformat(timespec="seconds"), self.command, self.path), flush=True)

    def _send(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/healthz":
            return self._send(200, {"ok": True})
        if path == "/v1/pairs":
            rows = db().execute(
                "SELECT src_lang, dst_lang, SUM(n) FROM comparisons GROUP BY 1, 2 ORDER BY 3 DESC"
            ).fetchall()
            return self._send(200, {
                "about": "Parallax — total cross-language Wikipedia comparisons per language pair. No titles, no users.",
                "pairs": [{"src": r[0], "dst": r[1], "n": r[2]} for r in rows],
            })
        if path == "/v1/export":
            # k-threshold: per (week, pair), titles with weekly count < K are
            # aggregated into "(other)" so rare/identifying articles never appear.
            rows = db().execute(
                """WITH weekly AS (
                     SELECT strftime('%Y-W%W', day) AS week, src_lang, src_title, dst_lang, SUM(n) AS n
                     FROM comparisons GROUP BY 1, 2, 3, 4
                   )
                   SELECT week, src_lang,
                          CASE WHEN n >= ? THEN src_title ELSE '(other)' END AS title,
                          dst_lang, SUM(n)
                   FROM weekly GROUP BY 1, 2, 3, 4 ORDER BY week DESC, 5 DESC""",
                (K_THRESHOLD,),
            ).fetchall()
            return self._send(200, {
                "about": "Parallax open dataset — which Wikipedia articles get compared across "
                         "language editions. Anonymous by construction: day-granularity counts only, "
                         "k-thresholded (rare titles aggregate into '(other)'), no user data ever collected. "
                         "Same data class as Wikimedia's public pageview statistics.",
                "k": K_THRESHOLD,
                "rows": [{"week": r[0], "src": r[1], "title": r[2], "dst": r[3], "n": r[4]} for r in rows],
            })
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path.split("?")[0] != "/v1/batch":
            return self._send(404, {"error": "not found"})
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            return self._send(413, {"error": "body size"})
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return self._send(400, {"error": "bad json"})
        events = data.get("events") if isinstance(data, dict) else None
        if not isinstance(events, list):
            return self._send(400, {"error": "bad payload"})
        now = utcnow().isoformat(timespec="seconds")
        accepted = 0
        conn = db()
        for ev in events[:MAX_EVENTS]:
            norm = valid_event(ev)
            if not norm:
                continue
            d, sl, st, tl, n = norm
            conn.execute(
                """INSERT INTO comparisons (day, src_lang, src_title, dst_lang, n, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?)
                   ON CONFLICT(day, src_lang, src_title, dst_lang)
                   DO UPDATE SET n = n + excluded.n, updated_at = excluded.updated_at""",
                (d, sl, st, tl, n, now),
            )
            accepted += 1
        conn.commit()
        return self._send(200, {"ok": True, "accepted": accepted})


def main():
    init_db()
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print("parallax-stats listening on 127.0.0.1:%d db=%s" % (PORT, DB_PATH), flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
