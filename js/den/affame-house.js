/* Affame's house, the Sweet Spot: her scene in the house shell (house.js). Its rules (the plan, where her
   pictures hang, her furniture, cushions and teddies, the tour, sinking into her cushions) are
   src/den-affame.ts's; her lines src/lines/affame.ts's, yours you.ts's. This places the shared furniture
   (furniture.js, her sign among it) and the cushions and teddies (cuddly.js), hangs the four pictures Dachimpy
   made her (exhibits.js's photos), and plays her: she meets you at the door, shows you round (the shell walks
   her: she's its `host`), tells you about each picture as you stop by it (the shell's exhibits), and, walk up
   to her cushion corner and Space, you sink into the cushions among the teddies, eyes shut, a moment's peace.
   Tab for her pictures close up (picture-view.js). */
import { PIRATES } from '../den-look.js';
import { PLAN, ARRIVE, WALLS, BACK, PICTURES, heightOf, pictureLine, SIGN, FURNISH, HEAP, TEDDIES, TOUR, stopAt, SINK, atNook, sunk } from '../den-affame.js';
import { blocksOf } from '../den-houses.js';
import { AT_THE_DOOR, TOUR_LINES, IN_THE_CUSHIONS, CHATTER, GOODBYE } from '../lines/affame.js';
import { IN_AFFAMES_HOUSE } from '../lines/you.js';
import { PACE } from '../chatter.js';
import { FURNITURE, place } from './furniture.js';
import { CUDDLY } from './cuddly.js';
import { photoTexture, photoArt } from './exhibits.js';
import { bliss } from './creatures.js';
import { person, IDLES } from './props-people.js';
import { cine } from './cine.js';
import { V3 } from './world.js';

const PIECES = { ...FURNITURE, ...CUDDLY };

export const AFFAME_HOUSE = {
  id: 'affame', plan: PLAN, arrive: ARRIVE, walls: WALLS,
  build(H) {
    const R = H.root, G = { tour: 0, ticks: [], visited: false, sink: null, sinks: 0 };
    // ---------- her furniture, her cushions and teddies, and her sign ----------
    for (const p of FURNISH) {
      const opts = { col: p.col };
      if (p.kind === 'candelabra') opts.light = true;
      if (p.kind === 'table') { opts.cookies = true; opts.cup = false; }   // (her pastries)
      if (p.kind === 'cushions') Object.assign(opts, HEAP);
      if (p.s) opts.s = p.s;
      const piece = place(R, PIECES[p.kind](opts), p.x, p.z, p.yaw || 0);
      if (piece.tick) G.ticks.push(piece);
    }
    for (const t of TEDDIES) {
      const piece = place(R, CUDDLY.teddy({ kind: t.kind, col: t.col, s: t.s }), t.x, t.z, t.yaw);
      piece.g.position.y = t.y;
    }
    place(R, FURNITURE.sign({ text: SIGN.text, w: SIGN.w, h: SIGN.h, y: SIGN.y, col: '#8a3a62', ink: '#ffe6f0' }), SIGN.x, BACK, 0);
    G.blocks = blocksOf(FURNISH);
    // ---------- her pictures, on her back wall ----------
    G.exhibits = [];
    for (const p of PICTURES) {
      const h = heightOf(p);
      const f = place(R, FURNITURE.frame({ plaque: p.title, w: p.w, h, y: p.y, ornate: !!p.big }), p.x, BACK, 0);
      f.setPicture(photoTexture(p.file));
      G.exhibits.push({ id: p.id, x: p.x, y: p.y, z: BACK });   // (what she can talk about: the shell's)
    }
    G.ticks.push(...[-2.15, 2.15].map((x) => place(R, FURNITURE.sconce({ y: 2.3 }), x, BACK, 0)));
    // ---------- her (a talking pirate: props-people.js) ----------
    G.herP = person({
      look: PIRATES.Affame, parent: R, x: ARRIVE.her.x, z: ARRIVE.her.z, idle: 'sway', say: H.say,
      // (after her tour, a word now and then while you're by her, never over something she's saying)
      lines: CHATTER, random: true, gap: PACE.ASIDE,
      earshot: () => !cine && !G.sink && !H.talking() && (G.herP.talking() || !H.house.lines.has(G.her)) && Math.hypot(G.her.x - H.you.x, G.her.z - H.you.z) < 4.5,
    });
    G.herP.chatty = false;
    G.her = G.herP.p;
    const host = {
      who: G.herP, idle: 'sway', still: () => !!G.sink,
      showing() {
        const s = TOUR[G.tour - 1];
        return s && H.house.talk && H.house.talk === G.tourTalk ? { at: s.at, near: s.near, stand: s.her } : null;
      },
    };

    /* Sinking into her cushions: onto the heap's front, facing out, down knee-deep, eyes shut and smiling;
       your line; up again where you were; then hers. */
    function startSink() {
      if (G.sink) return;
      H.hush(); H.house.to = null;
      const you = H.you;
      G.sink = { t: 0, first: !G.sinks, from: { x: you.x, z: you.z } };
      IDLES.stand(you);
      Object.assign(you, { x: SINK.at.x, z: SINK.at.z });
      you.g.position.set(you.x, 0, you.z);
      you.g.rotation.y = 0.25;   // (facing out to the room, a little toward the camera)
      bliss(you, true);
    }
    function endSink() {
      const s = G.sink, you = H.you;
      G.sink = null;
      bliss(you, false);
      Object.assign(you, s.from);
      you.g.position.set(you.x, 0, you.z);
      return s;
    }
    function sinkTick(dt) {
      const s = G.sink, you = H.you;
      s.t += dt;
      you.g.position.y = -sunk(s.t);
      you.body.rotation.x = -0.12 * sunk(s.t) / SINK.depth;   // (leaning back into them)
      if (s.t >= SINK.said && !s.said) { s.said = true; H.say(you, s.first ? IN_AFFAMES_HOUSE.sunk : IN_AFFAMES_HOUSE.again, 1.8); }
      if (s.t >= SINK.secs) {
        endSink();
        you.body.rotation.x = 0;
        H.talk(G.her, [s.first ? IN_THE_CUSHIONS.first : IN_THE_CUSHIONS.again[(G.sinks - 1) % IN_THE_CUSHIONS.again.length]]);
        G.sinks++;
      }
    }

    return {
      blocks: G.blocks,
      frozen: () => !!G.sink,
      host,
      // Her pictures: the one you're looking at, she tells you about (the shell's; her lines by each).
      exhibits: G.exhibits,
      remark: pictureLine,
      // ...and all of them close up, one at a time (the shell's: picture-view.js), as they hang.
      pictures: {
        name: 'Pictures', who: 'Affame',
        list: () => PICTURES.map((p) => ({ id: p.id, title: p.title, x: p.x, z: BACK, pic: p })),
        art(p) {
          G.flat ||= new Map();
          if (!G.flat.has(p.id)) G.flat.set(p.id, photoArt(p.pic.file, p.pic.px));
          return G.flat.get(p.id);
        },
      },
      enter() {
        const again = G.visited;
        G.visited = true;
        Object.assign(G.her, { x: ARRIVE.her.x, z: ARRIVE.her.z }); G.her.g.position.set(G.her.x, 0, G.her.z);
        G.her.g.rotation.y = Math.PI * 0.85;
        if (G.tour < TOUR.length) G.tour = 0;
        H.talk(G.her, [again ? AT_THE_DOOR.again : AT_THE_DOOR.first]);
      },
      leave() {
        if (G.sink) { endSink(); H.you.body.rotation.x = 0; }
        H.hush();
        return `Affame: "${GOODBYE}"`;
      },
      tick(dt) {
        const you = H.you, her = G.her;
        G.ticks.forEach((p) => p.tick(dt));
        if (G.sink) { sinkTick(dt); return; }
        // Her tour: at each stop she's come to, her lines for it.
        if (!cine && !H.talking() && G.tour < TOUR.length) {
          const j = stopAt(G.tour, you.x, you.z);
          if (j >= 0) {
            G.tour = j + 1;
            H.talk(her, [...TOUR_LINES[TOUR[j].id]]);
            G.tourTalk = H.house.talk;   // (her tour's: she stands by the stop while she says it)
          }
        }
        // Once she's shown you round, a word now and then.
        if (!cine && G.tour >= TOUR.length) G.herP.chatty = true;
      },
      /** The camera: the house's own, but in close on you while you're sunk in her cushions. */
      cam() {
        if (!G.sink) return null;
        const you = H.you, C = H.home();
        return { look: V3(you.x + 0.3, 0.9, you.z - 0.2), dist: Math.min(C.dist, 4.2), tilt: 0.3, yaw: 0.35 };
      },
      // (Space moves her talk on first: the cushions are offered only when no one's talking.)
      prompt() {
        if (G.sink || H.talking()) return null;
        return atNook(H.you) ? { text: 'The cushions', btn: 'Sink in' } : null;
      },
      act() {
        if (G.sink) return true;
        if (!H.talking() && atNook(H.you)) { startSink(); return true; }
        return false;
      },
    };
  },
};
