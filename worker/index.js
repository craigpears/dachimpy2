/* The leaderboard: a small Cloudflare Worker in front of the static site.
   Pirates pick a name, their browser keeps a secret key, and their purse is posted here.
   The purse itself lives in the player's browser, so this is an honour system with a few
   guard rails: names are letters only, and a purse can't leap by more than a big win at once.
   The shared betting table lives in harbour.js. */
import * as harbour from './harbour.js';
export { DenCrew } from './crew.js';
export { RaceRoom } from './race-room.js';
import { RACES_TABLE } from './race-room.js';
import { NET } from '../js/race-net.js';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS pirates (
     id TEXT PRIMARY KEY, name TEXT NOT NULL, key_hash TEXT NOT NULL,
     dubs INTEGER NOT NULL DEFAULT 0, best INTEGER NOT NULL DEFAULT 0,
     created INTEGER NOT NULL, updated INTEGER NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS pirates_dubs ON pirates (dubs DESC)',
  ...harbour.SCHEMA,
];
const BOARD_SIZE = 15, MAX_DUBS = 1_000_000, JOIN_MAX = 2000;
const NAME = /^[A-Za-z]{3,16}$/;

let ready = null;
const ensureSchema = (db) => (ready ??= db.batch(SCHEMA.map((s) => db.prepare(s))).catch((e) => { ready = null; throw e; }));

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const cleanDubs = (n) => Math.max(0, Math.min(MAX_DUBS, Math.round(Number(n) || 0)));
// Puzzle Pirates style: one word, capital first letter.
const tidyName = (s) => String(s || '').trim();
const display = (s) => s[0].toUpperCase() + s.slice(1).toLowerCase();
// The biggest jump one update may make: a long-odds win on the whole purse, or 200, whichever is more.
const allowed = (prev, next) => Math.min(next, Math.max(prev + 200, prev * 21));

async function board(db, me) {
  const { results } = await db.prepare('SELECT name, dubs FROM pirates ORDER BY dubs DESC, updated ASC LIMIT ?').bind(BOARD_SIZE).all();
  let mine = null;
  if (me && NAME.test(me)) {
    const row = await db.prepare('SELECT name, dubs FROM pirates WHERE id = ?').bind(me.toLowerCase()).first();
    if (row) {
      const { n } = await db.prepare('SELECT COUNT(*) AS n FROM pirates WHERE dubs > ?').bind(row.dubs).first();
      mine = { name: row.name, dubs: row.dubs, rank: n + 1 };
    }
  }
  const { total } = await db.prepare('SELECT COUNT(*) AS total FROM pirates').first();
  return { pirates: results, me: mine, total };
}

async function join(db, body) {
  const name = tidyName(body.name);
  if (!NAME.test(name)) return json({ error: 'name', message: 'Use 3 to 16 letters, no spaces.' }, 400);
  const key = crypto.randomUUID() + crypto.randomUUID();
  const dubs = Math.min(cleanDubs(body.dubs), JOIN_MAX), now = Date.now();
  const res = await db.prepare('INSERT INTO pirates (id, name, key_hash, dubs, best, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING')
    .bind(name.toLowerCase(), display(name), await sha256(key), dubs, dubs, now, now).run();
  if (!res.meta.changes) return json({ error: 'taken', message: 'Another pirate already sails under that name.' }, 409);
  return json({ name: display(name), key, dubs });
}

// The pirate making a request, if their secret key matches.
async function signedIn(db, body) {
  const name = tidyName(body.name);
  if (!NAME.test(name) || typeof body.key !== 'string') return null;
  const row = await db.prepare('SELECT id, name, key_hash, dubs FROM pirates WHERE id = ?').bind(name.toLowerCase()).first();
  return row && row.key_hash === await sha256(body.key) ? row : null;
}

async function postPurse(db, body) {
  const row = await signedIn(db, body);
  if (!row) return json({ error: 'auth' }, 403);
  const name = row.id;
  const dubs = allowed(row.dubs, cleanDubs(body.dubs));
  await db.prepare('UPDATE pirates SET dubs = ?, best = MAX(best, ?), updated = ? WHERE id = ?')
    .bind(dubs, dubs, Date.now(), name.toLowerCase()).run();
  return json({ dubs });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    // The Pirate Den's co-op: /api/crew/CODE opens a WebSocket to that crew's room.
    const crew = url.pathname.match(/^\/api\/crew\/([A-Z]{4})$/);
    if (crew) return env.CREW.get(env.CREW.idFromName(crew[1])).fetch(request);
    // The sloop race online: /api/race/CODE opens a WebSocket to that race's room, which runs the race.
    // (a GET of it, no WebSocket: what the room's doing and who's in it)
    const race = url.pathname.match(/^\/api\/race\/([A-Z]{4})$/);
    if (race) return env.RACE.get(env.RACE.idFromName(race[1])).fetch(request);
    // The open races, anyone's to walk into (NET.LOBBIES): each one's room looked at, for the list.
    if (request.method === 'GET' && url.pathname === '/api/race-lobbies') {
      const lobbies = await Promise.all(NET.LOBBIES.map(async (l) => {
        try { return { ...l, peek: await (await env.RACE.get(env.RACE.idFromName(l.code)).fetch(new Request(`https://race-room/api/race/${l.code}`))).json() }; } catch { return { ...l, peek: null }; }
      }));
      return json({ lobbies });
    }
    // Races run online, written down (src/race-server.ts, RaceRecord): the recent ones, and one by its id
    // (kept by the room it was raced in).
    if (request.method === 'GET' && (url.pathname === '/api/races' || url.pathname.startsWith('/api/races/'))) {
      try {
        await env.DB.prepare(RACES_TABLE).run();
        const one = url.pathname.match(/^\/api\/races\/([a-z0-9]{10})$/);
        if (!one) {
          const { results } = await env.DB.prepare('SELECT id, date, code, racers, winner, time, size FROM races ORDER BY date DESC LIMIT 30').all();
          return json({ races: results });
        }
        const row = await env.DB.prepare('SELECT code FROM races WHERE id = ?').bind(one[1]).first();
        if (!row) return json({ error: 'not found' }, 404);
        return env.RACE.get(env.RACE.idFromName(row.code)).fetch(new Request(`https://race-room/record/${one[1]}`));
      } catch (e) {
        return json({ error: 'server', message: String(e && e.message || e) }, 500);
      }
    }
    try {
      await ensureSchema(env.DB);
      const route = `${request.method} ${url.pathname}`;
      if (route === 'GET /api/board') return json(await board(env.DB, url.searchParams.get('me')));
      if (route === 'GET /api/harbour') return json(await harbour.roundView(env.DB, url.searchParams.get('me')));
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        if (route === 'POST /api/pirates') return join(env.DB, body);
        if (route === 'POST /api/purse') return postPurse(env.DB, body);
        if (url.pathname.startsWith('/api/harbour/')) {
          const pirate = await signedIn(env.DB, body);
          if (!pirate) return json({ error: 'auth', message: 'Put your pirate name on the board to take a seat.' }, 403);
          if (route === 'POST /api/harbour/bet') { const r = await harbour.placeBet(env.DB, pirate, body); return json(r.body, r.status); }
          if (route === 'POST /api/harbour/claim') return json(await harbour.claim(env.DB, pirate));
        }
      }
      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: 'server', message: String(e && e.message || e) }, 500);
    }
  },
};
