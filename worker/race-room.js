/* The Pirate Den's sloop race online, on Cloudflare: one room per race code (a Durable Object), up to six
   pirates' WebSockets. Only a thin adapter (the user, 12 Nov: a modular monolith, the server apart, to move
   later): the room's logic is src/race-server.ts (RaceServer, compiled to js/race-server.js and bundled in here
   by wrangler), and this hands it each socket's coming and going, what it sends and the clock, and sends what
   it answers. A timer ticks it eight times a second only while a race is counting down or on; otherwise
   there's none, and the room sleeps between messages (hibernatable WebSockets: each socket keeps its
   connection's id and what the server keeps of its pirate, to wake up with). A race finished is written down
   (src/race-server.ts, RaceRecord) and kept in the room's own storage, a row for it in D1 (the races table:
   worker/index.js lists them, and hands one out from here). */
import { RaceServer } from '../js/race-server.js';
import { TICK_MS } from '../js/race-link.js';

/** A stored value's piece of a race's record, in characters; and the races table in D1. */
const PART = 100_000;
export const RACES_TABLE = 'CREATE TABLE IF NOT EXISTS races (id TEXT PRIMARY KEY, date INTEGER NOT NULL, code TEXT NOT NULL, racers TEXT NOT NULL, winner TEXT, time REAL, size INTEGER)';

export class RaceRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.server = null;
    this.timer = null;
  }

  /** The server, woken up with whoever's still aboard. */
  room(code) {
    if (!this.server) {
      const all = this.ctx.getWebSockets();
      this.server = new RaceServer(code ?? all[0]?.deserializeAttachment()?.code ?? '', Math.random);
      for (const ws of all) {
        const a = ws.deserializeAttachment();
        if (!a?.conn) continue;
        this.server.join(a.conn);
        if (a.kept) this.server.restore(a.conn, a.kept);
      }
    }
    return this.server;
  }
  socket(conn) { return this.ctx.getWebSockets().find((ws) => ws.deserializeAttachment()?.conn === conn); }
  /** Races finished, written down: kept here (in pieces, a stored value holds 128 KB), a row in D1. */
  async save() {
    for (const rec of this.server.records()) {
      const text = JSON.stringify(rec), parts = Math.ceil(text.length / PART);
      const put = { [`rec:${rec.id}`]: parts };
      for (let k = 0; k < parts; k++) put[`rec:${rec.id}:${k}`] = text.slice(k * PART, (k + 1) * PART);
      await this.ctx.storage.put(put);
      const win = rec.places.find((p) => p.place === 1);
      try {
        await this.env.DB.prepare(RACES_TABLE).run();
        await this.env.DB.prepare('INSERT OR REPLACE INTO races (id, date, code, racers, winner, time, size) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(rec.id, rec.date, this.server.code, rec.racers.map((r) => r.name).join(', '), win ? rec.racers[win.i].name : null, win?.time ?? null, text.length).run();
      } catch { /* (no D1 here: the record's still kept in the room) */ }
    }
  }
  /** One race, as written down, if it's this room's. */
  async record(id) {
    const parts = await this.ctx.storage.get(`rec:${id}`);
    if (!parts) return new Response('{"error":"not found"}', { status: 404, headers: { 'content-type': 'application/json' } });
    const got = await this.ctx.storage.get(Array.from({ length: parts }, (_, k) => `rec:${id}:${k}`));
    const text = Array.from({ length: parts }, (_, k) => got.get(`rec:${id}:${k}`)).join('');
    return new Response(text, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } });
  }
  /** What the server answered, sent. */
  send(outs) {
    const text = new Map();
    for (const o of outs) {
      const ws = this.socket(o.to);
      if (!ws) continue;
      if (!text.has(o.msg)) text.set(o.msg, JSON.stringify(o.msg));
      try { ws.send(text.get(o.msg)); } catch { /* gone */ }
      if (o.msg.t === 'closed') { try { ws.close(4002, 'Joined again'); } catch { /* */ } }
    }
  }
  keep() {
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (!a?.conn) continue;
      let kept = this.server.kept(a.conn);
      if (kept && JSON.stringify(kept).length > 1800) kept = { ...kept, look: null };   // (an attachment holds 2 KB)
      ws.serializeAttachment({ conn: a.conn, code: a.code, kept });
    }
  }
  /** The clock, while a race is counting down or on. */
  clock() {
    if (this.server.ticking && !this.timer) {
      this.timer = setInterval(() => {
        this.send(this.server.tick(Date.now() / 1000));
        if (!this.server.ticking) { clearInterval(this.timer); this.timer = null; this.keep(); }
        this.ctx.waitUntil?.(this.save());
      }, TICK_MS);
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    const rec = url.pathname.match(/^\/record\/([a-z0-9]{10})$/);
    if (rec) return this.record(rec[1]);
    const code = url.pathname.split('/').pop();
    // (looked at from outside, for the open races' list: what it's doing and who's in)
    if (request.headers.get('Upgrade') !== 'websocket') return new Response(JSON.stringify(this.room(code).peek()), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    const conn = crypto.randomUUID();
    server.serializeAttachment({ conn, code });
    this.send(this.room(code).join(conn));
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, data) {
    const a = ws.deserializeAttachment();
    if (!a?.conn) return;
    const R = this.room(a.code);
    this.send(R.message(a.conn, data));
    if (typeof data === 'string' && !data.includes('"pose"')) { this.keep(); this.ctx.waitUntil?.(this.save()); }
    this.clock();
  }
  webSocketClose(ws) { this.left(ws); }
  webSocketError(ws) { this.left(ws); }
  left(ws) {
    const a = ws.deserializeAttachment();
    ws.serializeAttachment({});
    try { ws.close(1000, 'bye'); } catch { /* already closed */ }
    if (!a?.conn) return;
    this.send(this.room(a.code).leave(a.conn));
    this.keep();
    this.ctx.waitUntil?.(this.save());
  }
}
