/* Pirate Den: the sloop race online, its links: how a browser reaches its race's room (src/race-net.ts, Link).
   TypeScript, compiled to js/race-link.js; tested in tests/race-net.test.ts. Two transports, the same to the
   race's code on either end (the user, 12 Nov: a modular monolith, the server apart, to move later):
   - wsLink: a WebSocket to the den's room on Cloudflare (worker/race-room.js), the one players race on;
   - LocalRoom: the room itself (src/race-server.ts, RaceServer) run in the same tab, as many links into it
     as you like: the tests' several pretend browsers (one dropping messages), and one day the race alone.
   Everything goes as text both ways, as it would over the wire, so nothing's shared by accident. */
import { NET } from './race-net.js';
import { RaceServer } from './race-server.js';
/** A WebSocket to `url` (wss://.../api/race/CODE). What's sent before it's open waits for it; closed, it
    says `closed`. */
export function wsLink(url) {
    const ws = new WebSocket(url), waiting = [];
    let hear = () => { };
    let done = false;
    const closed = () => { if (!done) {
        done = true;
        hear({ t: 'closed' });
    } };
    ws.onopen = () => { for (const s of waiting.splice(0))
        ws.send(s); };
    ws.onmessage = (e) => { let m; try {
        m = JSON.parse(String(e.data));
    }
    catch {
        return;
    } hear(m); };
    ws.onclose = closed;
    return {
        send(m) { const s = JSON.stringify(m); if (ws.readyState === 1)
            ws.send(s);
        else if (ws.readyState === 0)
            waiting.push(s); },
        onMessage(fn) { hear = fn; },
        close() { done = true; try {
            ws.close();
        }
        catch { /* already */ } },
    };
}
/** A race's room run here, in this tab or this test: the server (RaceServer, its dice `random`), and links
    into it. The host's clock is `tick(now)`'s, called NET.HZ times a second (tests call it by hand; a tab
    would on a timer). A link may `drop` some of what comes to it (for the tests: a flaky connection). */
export class LocalRoom {
    server;
    links = new Map();
    n = 0;
    constructor(code, random) { this.server = new RaceServer(code, random); }
    deliver(outs) {
        for (const o of outs) {
            const L = this.links.get(o.to);
            if (L && !L.drop())
                L.hear(JSON.parse(JSON.stringify(o.msg)));
            if (o.msg.t === 'closed')
                this.links.delete(o.to);
        }
    }
    /** A new link into the room. */
    connect(drop = () => false) {
        const conn = `local${++this.n}`, L = { hear: (_) => { }, drop };
        this.links.set(conn, L);
        this.deliver(this.server.join(conn));
        return {
            conn,
            send: (m) => { if (this.links.has(conn))
                this.deliver(this.server.message(conn, JSON.stringify(m))); },
            onMessage: (fn) => { L.hear = fn; },
            close: () => { if (!this.links.delete(conn))
                return; this.deliver(this.server.leave(conn)); },
        };
    }
    /** The host's clock (seconds). */
    tick(now) { this.deliver(this.server.tick(now)); }
    get ticking() { return this.server.ticking; }
}
/** Ticks a second, for a host's timer. */
export const TICK_MS = 1000 / NET.HZ;
