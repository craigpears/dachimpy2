/* Dachimpy's house, which doubles as a museum: their scene in the house shell (house.js). Its rules (the
   plan, where everything hangs and stands, the tour, the hug and the cookie) are src/den-dachimpy.ts's; their
   lines and plaques src/lines/dachimpy.ts's, yours you.ts's. This places the shared furniture (furniture.js:
   the cookie table, the model of the old sim's board, the trinkets' shelf, the plaques), hangs the exhibits
   (exhibits.js: the screenshots and the pages of story) and their friends' portraits (portraits.js), and plays
   them: at the door, every visit, a hug and then a cookie, really handed over (the plate held out, you take one,
   it's in your hand and you munch it, crumbs and all: held.js's pieces); more from the plate on the hall's table; then they
   show you round (the shell walks them: they're its `host`), and tell you about whatever you stop by (the
   shell's exhibits); Tab for them all close up, each with its plaque (picture-view.js). */
import { PIRATES } from '../den-look.js';
import {
  PLAN, ARRIVE, WALLS, FURNISH, EXHIBITS, hang, exhibitLine, FRIENDS, FRIENDS_WALL, TOUR, stopAt,
  HUG, hugSpot, cookieBeat, cookieApart, atCookies, MUSEUM_LEN,
} from '../den-dachimpy.js';
import { blocksOf, readSecs } from '../den-houses.js';
import { AT_THE_DOOR, THE_COOKIE, ANOTHER_COOKIE, TOUR_LINES, PLAQUES, PANELS, CHATTER, GOODBYE, THANKS, EVERYONE } from '../lines/dachimpy.js';
import { IN_DACHIMPYS_HOUSE } from '../lines/you.js';
import { PACE } from '../chatter.js';
import { FURNITURE, place } from './furniture.js';
import { paint, paintFlat } from './portraits.js';
import { bliss } from './creatures.js';
import { person, IDLES, reachTo, MOUTH } from './props-people.js';
import { HELD, inHand, crumbs } from './held.js';
import { photoTexture, photoArt, paintPage, pageTexture } from './exhibits.js';
import { cine } from './cine.js';
import { V3 } from './world.js';

/** The pages: the museum's panels of story, the one for everyone they blockaded with, and the thank-you
    (src/lines/dachimpy.ts). */
const pageOf = (id) => {
  if (id === 'everyone') return paintPage({ title: 'Everyone I Blockaded With', text: EVERYONE, withHeart: true });
  if (id === 'thanks') return paintPage({ title: 'Thank You', text: THANKS, withHeart: true });
  return paintPage({ title: PANELS[id].title, text: PANELS[id].text, withHeart: id === 'began' || id === 'donation' });
};

export const DACHIMPY_HOUSE = {
  id: 'dachimpy', plan: PLAN, arrive: ARRIVE, walls: WALLS,
  build(H) {
    const R = H.root, G = { queue: [], tour: 0, ticks: [], visited: false, greet: null, cookies: 0, more: 0, pages: new Map() };
    const page = (id) => { if (!G.pages.has(id)) G.pages.set(id, pageOf(id)); return G.pages.get(id); };
    // ---------- the furniture ----------
    for (const p of FURNISH) {
      const opts = { col: p.col };
      if (p.kind === 'candelabra') opts.light = true;
      if (p.kind === 'table') opts.cookies = true;
      if (p.kind === 'runner') opts.len = MUSEUM_LEN - 1.6;
      const piece = place(R, FURNITURE[p.kind](opts), p.x, p.z, p.yaw || 0);
      if (piece.tick) G.ticks.push(piece);
    }
    G.blocks = blocksOf(FURNISH);
    G.crumbs = crumbs(R);   // (a cookie munched)
    // ---------- the exhibits: the hall's, then the museum's, oldest first ----------
    const HUNG = hang();
    G.exhibits = [];
    for (const e of EXHIBITS) {
      const h = HUNG[e.id];
      const f = place(R, FURNITURE.frame({ w: h.w, h: h.h, y: h.y, ornate: e.kind === 'panel' }), h.x, h.wall, 0);
      f.setPicture(e.kind === 'shot' ? photoTexture(e.file) : pageTexture(page(e.id)));
      if (h.card) place(R, FURNITURE.card({ title: e.title, text: PLAQUES[e.id], w: h.card.w, h: h.card.h, y: h.card.y }), h.card.x, h.wall, 0);
      G.exhibits.push({ id: e.id, x: h.x, y: h.y, z: h.wall });   // (what they can talk about: the shell's)
    }
    // (a few sconces down the museum, between its frames)
    const mus = EXHIBITS.filter((e) => HUNG[e.id].room === 'museum').map((e) => HUNG[e.id]);
    for (let i = 1; i < mus.length - 1; i += 3) G.ticks.push(place(R, FURNITURE.sconce({ y: 2.7 }), (mus[i].x + mus[i].w / 2 + mus[i + 1].x - mus[i + 1].w / 2) / 2, mus[i].wall, 0));
    // ---------- their friends, the closest in the middle (no one labelled: everybody's special) ----------
    for (const fr of FRIENDS) {
      const f = place(R, FURNITURE.frame({ w: fr.w, h: fr.h, y: fr.y, plaque: fr.title, ornate: !!fr.middle || !!fr.page }), fr.x, FRIENDS_WALL, 0);
      if (fr.portrait) G.queue.push({ f, portrait: fr.portrait });
      else f.setPicture(pageTexture(page(fr.page)));
      G.exhibits.push({ id: fr.id, x: fr.x, y: fr.y, z: FRIENDS_WALL });
    }
    /** Paints the next friend's portrait waiting (one a tick: each is a little work). */
    const paintNext = () => {
      const q = G.queue.shift();
      if (!q) return;
      const painted = paint(q.portrait);
      q.f.setPicture(painted.texture, painted.uv);
    };

    // ---------- them (a talking pirate: props-people.js) ----------
    G.themP = person({
      // (a plate of cookies always to hand, put away for the hug: the wardrobe's, held.js's)
      look: { ...PIRATES.Dachimpy, hand: 'cookies' }, parent: R, x: ARRIVE.them.x, z: ARRIVE.them.z, idle: 'sway', say: H.say,
      // (after their tour, a word now and then while you're by them, never over something they're saying)
      lines: CHATTER, random: true, gap: PACE.ASIDE,
      earshot: () => !cine && !G.greet && !H.talking() && (G.themP.talking() || !H.house.lines.has(G.them)) && Math.hypot(G.them.x - H.you.x, G.them.z - H.you.z) < 4.5,
    });
    G.themP.chatty = false;
    G.them = G.themP.p;
    const host = {
      who: G.themP, idle: 'sway',
      // (the hug and the cookie have them; coming over to you for them, the shell walks them)
      still: () => !!G.greet && G.greet.phase !== 'come',
      showing() {
        if (G.greet?.phase === 'come') return { at: { x: H.you.x, z: H.you.z }, near: 1, stand: G.greet.spot };
        const s = TOUR[G.tour - 1];
        return s && H.house.talk && H.house.talk === G.tourTalk ? { at: s.at, near: s.near, stand: s.them } : null;
      },
    };

    /* The greeting, every visit: over to your side, a hug (your eyes shut, a squeeze, your line), then the
       plate held out, a cookie, your line; then on to the museum. */
    function startGreet(first) {
      if (G.greet) return;
      H.hush(); H.house.to = null;
      G.greet = { phase: 'come', t: 0, first, spot: hugSpot(PLAN, H.you, G.blocks) };
    }
    function endGreet() {
      const g = G.greet;
      G.greet = null;
      if (g.cookie) inHand(H.you, null);
      bliss(H.you, false); IDLES.stand(H.you);
      G.themP.setIdle('sway');
      return g;
    }
    function greetTick(dt) {
      const g = G.greet, you = H.you, them = G.them;
      g.t += dt;
      if (g.phase === 'come') {
        if (Math.hypot(them.x - g.spot.x, them.z - g.spot.z) > 0.12 && g.t < 3) return;
        Object.assign(them, { x: g.spot.x, z: g.spot.z }); them.g.position.set(them.x, 0, them.z); them.g.rotation.y = g.spot.yaw;
        you.g.rotation.y = g.spot.youYaw;
        Object.assign(g, { phase: 'hug', t: 0 });
        G.themP.setIdle('hug'); bliss(you, true);
        return;
      }
      if (g.phase === 'hug') {
        them.g.rotation.y = g.spot.yaw;
        IDLES.hug(you, g.t);
        if (g.t >= HUG.said && !g.said) { g.said = true; H.say(you, IN_DACHIMPYS_HOUSE.hugged, 1.4); }
        if (g.t >= HUG.secs) {
          Object.assign(g, { phase: 'cookie', t: 0, said: false });
          bliss(you, false); IDLES.stand(you);
          G.themP.setIdle('offer');
          g.line = g.first ? THE_COOKIE.first : THE_COOKIE.again[G.cookies++ % THE_COOKIE.again.length];
          g.read = readSecs(g.line);
          H.say(them, g.line, g.read);
        }
        return;
      }
      // the cookie, handed over: you reach for the plate, take one, munch it (src/den-dachimpy.ts's beats)
      const b = cookieBeat(g.t, g.read), plate = G.themP.prop;
      // (a step back from the hug, to have room for the plate between you)
      if (g.spot.side) { them.x = you.x + g.spot.side * cookieApart(g.t); them.g.position.x = them.x; }
      them.g.rotation.y = g.spot.yaw;
      IDLES.stand(you);
      reachTo(you, plate ? plate.getWorldPosition(V3()).add(V3(0, 0.06, 0)) : null, b.reach, b.mouth);
      if (b.held && !g.cookie) { g.cookie = inHand(you, HELD.cookie.make()); plate?.take?.(); }
      if (g.cookie) { g.cookie.bite(b.eaten); g.cookie.faceAs(you.body); }
      if (b.bitten > (g.bitten || 0)) { g.bitten = b.bitten; G.crumbs.spill(you.body.localToWorld(V3(0, MOUTH.y - 0.05, MOUTH.z + 0.04))); }
      if (b.said && !g.said) { g.said = true; H.say(you, IN_DACHIMPYS_HOUSE.cookie, 1.8); }
      if (b.done) {
        const was = endGreet();
        if (was.first || G.tour < TOUR.length) H.talk(them, [THE_COOKIE.onward]);
      }
    }

    return {
      blocks: G.blocks,
      frozen: () => !!G.greet,
      host,
      // The exhibits: the one you're looking at, they tell you about (the shell's; their lines by each).
      exhibits: G.exhibits,
      remark: exhibitLine,
      // ...and all of them close up, one at a time (the shell's: picture-view.js), in the order they hang, each
      // with its plaque; the screenshots as they are, the pages and portraits as on the wall.
      pictures: {
        name: 'Pictures', who: 'Dachimpy',
        // (the friends first, left to right, as the rooms go: the people first, the museum after)
        list: () => [
          ...[...FRIENDS].sort((a, b) => a.x - b.x).map((f) => ({ id: f.id, title: f.title, x: f.x, z: FRIENDS_WALL, fr: f })),
          ...EXHIBITS.map((e) => ({ id: e.id, title: e.title, x: HUNG[e.id].x, z: HUNG[e.id].wall, ex: e })),
        ],
        art(p) {
          G.flat ||= new Map();
          if (!G.flat.has(p.id)) {
            const e = p.ex, f = p.fr;
            G.flat.set(p.id, e ? (e.kind === 'shot' ? photoArt(e.file, e.px) : page(e.id)) : f.portrait ? paintFlat(f.portrait) : page(f.page));
          }
          return G.flat.get(p.id);
        },
        note: (p) => (p.ex?.kind === 'shot' ? PLAQUES[p.id] : null),
      },
      enter() {
        const again = G.visited;
        G.visited = true;
        Object.assign(G.them, { x: ARRIVE.them.x, z: ARRIVE.them.z }); G.them.g.position.set(G.them.x, 0, G.them.z);
        G.them.g.rotation.y = Math.PI * 0.85;
        if (G.tour < TOUR.length) G.tour = 0;
        // Their hello, then a hug and a cookie: every visit.
        H.talk(G.them, [again ? AT_THE_DOOR.again : AT_THE_DOOR.first], () => { if (H.house.on && H.house.id === 'dachimpy') startGreet(!again); });
      },
      leave() {
        if (G.greet) endGreet();
        H.hush();
        return `Dachimpy: "${GOODBYE}"`;
      },
      tick(dt) {
        const you = H.you, them = G.them;
        paintNext();
        G.ticks.forEach((p) => p.tick(dt));
        G.crumbs.tick(dt);
        if (G.greet) { greetTick(dt); return; }
        // Their tour: at each stop they've come to, their lines for it.
        if (!cine && !H.talking() && G.tour < TOUR.length) {
          const j = stopAt(G.tour, you.x, you.z);
          if (j >= 0) {
            G.tour = j + 1;
            H.talk(them, [...TOUR_LINES[TOUR[j].id]]);
            G.tourTalk = H.house.talk;   // (their tour's: they stand by the stop while they say it)
          }
        }
        // Once they've shown you round, a word now and then.
        if (!cine && G.tour >= TOUR.length) G.themP.chatty = true;
      },
      /** The camera: the house's own, but in close on you both for the hug and the cookie. */
      cam() {
        if (!G.greet || G.greet.phase === 'come') return null;
        const you = H.you, them = G.them, C = H.home();
        // (round to see their face for the hug; then, as the cookie's offered, round a little the other way, to see
        // yours as you take it and munch it: your hand's on this side, src/den-dachimpy.ts's hugSpot)
        const g = G.greet, k = g.phase === 'cookie' ? Math.min(1, g.t / 1.2) : 0, side = g.spot.side;
        return { look: V3((you.x + them.x) / 2, 1.3, (you.z + them.z) / 2), dist: Math.min(C.dist, 4.4), tilt: 0.22, yaw: -side * 0.35 + side * 1.1 * k * k * (3 - 2 * k) };
      },
      // (Space moves their talk on first: the cookies are offered only when no one's talking.)
      prompt() {
        if (G.greet || H.talking()) return null;
        return atCookies(H.you) ? { text: 'The cookies', btn: 'Have another' } : null;
      },
      act() {
        if (G.greet) return true;
        if (!H.talking() && atCookies(H.you)) {
          H.say(H.you, IN_DACHIMPYS_HOUSE.another, 1.6);
          H.talk(G.them, [ANOTHER_COOKIE[G.more++ % ANOTHER_COOKIE.length]]);
          return true;
        }
        return false;
      },
    };
  },
};
