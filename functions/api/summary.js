// Cloudflare Pages Function — /api/summary
// GET  ?eventId=X  → cache-hit returns stored JSON; cache-miss proxies ESPN + stores result
// POST { eventId, matchId, data } → explicit write (used by live-game path when game ends)

const ESPN_SUMMARY = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const CACHE_HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export async function onRequestGet({ request, env, waitUntil }) {
  const eventId = new URL(request.url).searchParams.get('eventId');
  if (!eventId) return new Response('Missing eventId', { status: 400 });

  // Cache hit
  const row = await env.DB.prepare(
    'SELECT data FROM match_summaries WHERE event_id = ?'
  ).bind(eventId).first();

  if (row) {
    return new Response(row.data, {
      headers: { ...CACHE_HEADERS, 'X-Cache': 'HIT' },
    });
  }

  // Cache miss — proxy to ESPN
  let espnData;
  try {
    const res = await fetch(`${ESPN_SUMMARY}?event=${eventId}`);
    if (!res.ok) return new Response(null, { status: 502 });
    espnData = await res.text();
  } catch {
    return new Response(null, { status: 502 });
  }

  // Write to D1 — use waitUntil so the write completes after the response is sent
  waitUntil(
    env.DB.prepare(
      'INSERT OR IGNORE INTO match_summaries (event_id, match_id, data, stored_at) VALUES (?, ?, ?, ?)'
    ).bind(eventId, '', espnData, Date.now()).run().catch(() => {})
  );

  return new Response(espnData, {
    headers: { ...CACHE_HEADERS, 'X-Cache': 'MISS' },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { eventId, matchId, data } = body;
  if (!eventId || !data) return new Response('Missing eventId or data', { status: 400 });

  await env.DB.prepare(
    'INSERT OR REPLACE INTO match_summaries (event_id, match_id, data, stored_at) VALUES (?, ?, ?, ?)'
  ).bind(eventId, matchId ?? '', JSON.stringify(data), Date.now()).run();

  return new Response(JSON.stringify({ ok: true }), { headers: CACHE_HEADERS });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
