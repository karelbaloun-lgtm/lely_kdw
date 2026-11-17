// Auto-Bestand pro Lagerort (Netlify Blobs). Aufruf: GET/PUT /api/autobestand/<Lagerort>   (z. B. /api/autobestand/LAD)
// Kein Passwort (bewusst, kleiner Kreis): Wer den Link kennt, kann lesen und schreiben.
// Gespeichert wird je Lagerort ein JSON-Datensatz { lagerort, updated, items, log, source }.
// PUT mit älterem "updated" als gespeichert -> 409 + aktueller Datensatz (der Client übernimmt ihn).
import { getStore } from "@netlify/blobs";

const LAGERORT = /^[A-Z0-9]{2,8}$/;
const MAX_BYTES = 600000;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function handle(req, lagerort, store) {
  const lo = String(lagerort || "").toUpperCase();
  if (!LAGERORT.test(lo)) return json({ error: "Ungültiger Lagerort" }, 400);

  if (req.method === "GET") {
    return json((await store.get(lo, { type: "json" })) ?? null);
  }
  if (req.method === "PUT") {
    const raw = await req.text();
    if (raw.length > MAX_BYTES) return json({ error: "Zu groß" }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: "Kein gültiges JSON" }, 400); }
    if (!body || typeof body !== "object" || typeof body.updated !== "number" || !body.items || typeof body.items !== "object") {
      return json({ error: "Ungültiger Datensatz" }, 400);
    }
    const cur = await store.get(lo, { type: "json" });
    if (cur && typeof cur.updated === "number" && cur.updated > body.updated) return json(cur, 409);
    body.lagerort = lo;
    await store.setJSON(lo, body);
    return json({ ok: true });
  }
  return json({ error: "Methode nicht erlaubt" }, 405);
}

// consistency "strong": Blobs liest sonst eventuell (verzögert) -> Lesen direkt nach dem Schreiben lieferte alten/leeren Stand
export default async (req, context) => handle(req, context.params.lagerort, getStore({ name: "autobestand", consistency: "strong" }));

export const config = { path: "/api/autobestand/:lagerort" };
