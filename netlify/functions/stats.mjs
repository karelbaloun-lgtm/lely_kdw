// Anonyme Nutzungsstatistik (nur Zähler, keine Namen, keine Inhalte, keine IDs, keine IP-Adressen).
//   POST /api/stats   { e: Ereignis, p: Seite, f: vorherige Seite, c: Center, d: Gerät, t: Dauer-Klasse }
//   GET  /api/stats?days=30   -> { days: { "JJJJ-MM-TT": Zähler, ... } }
// Je Tag ein Zähler-Datensatz (Netlify Blobs). Gleichzeitige Schreibzugriffe können sehr selten einen Treffer verlieren -> Zahlen sind ungefähr.
import { getStore } from "@netlify/blobs";

const PAGES = new Set(["menu", "kdw", "kunde", "auto", "bestand"]);
const DEVICES = new Set(["mobile", "desktop"]);
const NAME = /^[a-z0-9_.-]{1,40}$/;
const BUCKET = /^(<10s|10-30s|30-60s|1-3m|3-10m|>10m)$/;
const CENTER = /^[A-Za-zÄÖÜäöüß0-9 ._-]{1,30}$/;
const MAX_KEYS = 250;   // Schutz gegen unbegrenztes Wachsen
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

const inc = (obj, key, by = 1) => {
  if (!(key in obj) && Object.keys(obj).length >= MAX_KEYS) return;
  obj[key] = (obj[key] || 0) + by;
};
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);   // UTC-Tag

export function applyEvent(agg, b) {
  const e = String(b.e || ""), p = String(b.p || ""), f = String(b.f || ""), t = String(b.t || "");
  const d = DEVICES.has(b.d) ? b.d : "";
  const c = CENTER.test(String(b.c || "")) ? String(b.c) : "";
  if (!NAME.test(e) || !PAGES.has(p)) return false;
  agg.n = (agg.n || 0) + 1;
  for (const k of ["pv", "tr", "ev", "dev", "ctr", "dur", "evdur"]) agg[k] = agg[k] || {};
  if (e === "pv") {
    inc(agg.pv, p);
    inc(agg.tr, (PAGES.has(f) ? f : "start") + ">" + p);   // "start" = erste Seite eines Besuchs
    if (d) inc(agg.dev, d);
    if (c) inc(agg.ctr, c);
  } else if (e === "dur") {
    if (BUCKET.test(t)) inc(agg.dur, p + "|" + t);
  } else {
    inc(agg.ev, e);
    if (BUCKET.test(t)) inc(agg.evdur, e + "|" + t);
  }
  return true;
}

export async function handle(req, url, store) {
  if (req.method === "POST") {
    const raw = await req.text();
    if (raw.length > 2000) return json({ error: "Zu groß" }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: "Kein gültiges JSON" }, 400); }
    if (!body || typeof body !== "object") return json({ error: "Ungültig" }, 400);
    const key = "d/" + dayKey();
    const agg = (await store.get(key, { type: "json" })) || {};
    if (!applyEvent(agg, body)) return json({ error: "Ungültiges Ereignis" }, 400);
    await store.setJSON(key, agg);
    return json({ ok: true });
  }
  if (req.method === "GET") {
    const days = Math.max(1, Math.min(120, parseInt(url.searchParams.get("days") || "30", 10) || 30));
    const keys = [];
    for (let i = 0; i < days; i++) keys.push(dayKey(new Date(Date.now() - i * 86400000)));
    const out = {};
    await Promise.all(keys.map(async (k) => { const v = await store.get("d/" + k, { type: "json" }); if (v) out[k] = v; }));
    return json({ days: out });
  }
  return json({ error: "Methode nicht erlaubt" }, 405);
}

export default async (req) => handle(req, new URL(req.url), getStore({ name: "stats", consistency: "strong" }));

export const config = { path: "/api/stats" };
