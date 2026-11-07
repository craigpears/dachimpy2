/* Crew rooms for the Pirate Den's co-op: one Durable Object per crew code, holding up to four
   pirates' WebSockets. It doesn't run the game. The first pirate in also hosts: their browser
   moves the raiders and keeps the crates and wall in step for everyone. All the pirates play the
   same; it's only whose computer does the sums. If they leave, the next one in takes over.
   The room only passes messages along and says who's aboard and whose browser hosts.
   It uses hibernatable WebSockets, so who's who is kept on each socket, not in memory. */
const MAX_CREW = 4;
const NAME = /^[A-Za-z]{3,16}$/;

export class DenCrew {
  constructor(ctx) { this.ctx = ctx; }

  aboard() {
    return this.ctx.getWebSockets().map((ws) => ({ ws, ...ws.deserializeAttachment() })).filter((p) => p.id).sort((a, b) => a.joined - b.joined);
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const crew = this.aboard();
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    if (crew.length >= MAX_CREW) {
      server.send(JSON.stringify({ t: 'full' }));
      server.close(4001, 'This crew is full');
      return new Response(null, { status: 101, webSocket: client });
    }
    const raw = new URL(request.url).searchParams.get('name') || '';
    const name = NAME.test(raw) ? raw[0].toUpperCase() + raw.slice(1).toLowerCase() : 'Deckhand';
    const me = { id: crypto.randomUUID().slice(0, 8), name, joined: Date.now() };
    server.serializeAttachment(me);
    const all = [...crew, me];
    server.send(JSON.stringify({ t: 'welcome', id: me.id, host: all[0].id, crew: all.map(({ id, name }) => ({ id, name })) }));
    for (const p of crew) p.ws.send(JSON.stringify({ t: 'join', id: me.id, name }));
    return new Response(null, { status: 101, webSocket: client });
  }

  // Messages say where they're going: `to: 'host'`, `to: 'all'` (everyone else) or a pirate's id.
  // The room stamps who sent it and passes it on unread.
  webSocketMessage(ws, data) {
    if (typeof data !== 'string' || data.length > 200_000) return;
    const me = ws.deserializeAttachment();
    if (!me?.id) return;
    let msg;
    try { msg = JSON.parse(data); } catch { return; }
    msg.from = me.id;
    const crew = this.aboard();
    const out = JSON.stringify(msg);
    const to = msg.to === 'host' ? [crew[0]] : msg.to === 'all' ? crew.filter((p) => p.id !== me.id) : crew.filter((p) => p.id === msg.to);
    for (const p of to) if (p && p.id !== me.id) { try { p.ws.send(out); } catch { /* gone */ } }
  }

  webSocketClose(ws) { this.left(ws); }
  webSocketError(ws) { this.left(ws); }

  left(ws) {
    const me = ws.deserializeAttachment();
    if (!me?.id) return;
    ws.serializeAttachment({});
    try { ws.close(1000, 'bye'); } catch { /* already closed */ }
    const crew = this.aboard();
    const msg = JSON.stringify({ t: 'leave', id: me.id, host: crew[0]?.id });
    for (const p of crew) { try { p.ws.send(msg); } catch { /* gone */ } }
  }
}
