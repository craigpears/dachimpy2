/* Roobear's house, the ROOm: her scene in the house shell (house.js). Its rules (the plan, where her
   furniture stands, her gallery of guesses at her name, the tour, Robert's ear rub) are src/den-roobear.ts's;
   her lines src/lines/roobear.ts's, yours you.ts's. This places the shared furniture (furniture.js, her
   ROOm's sign among it), hangs the guesses (portraits.js), and plays her and Robert: she meets you at the
   door and Robert, the kangaroo bear, hops over and roobs your ear as the welcome (and again whenever you
   walk up to him and ask); she shows you round (the shell walks her: she's its `host`), and tells you whose
   guess each portrait was as you stop by it (the shell's exhibits); Robert hops about after her. */
import { PIRATES } from '../den-look.js';
import { PLAN, ARRIVE, WALLS, FURNISH, GUESSES, guessLine, SIGN, TOUR, stopAt, RUB, RUB_BEATS, rubSpot, robertBy, atRobert } from '../den-roobear.js';
import { blocksOf, step } from '../den-houses.js';
import { AT_THE_DOOR, ROBERT, TOUR_LINES, CHATTER, GOODBYE } from '../lines/roobear.js';
import { IN_ROOBEARS_HOUSE } from '../lines/you.js';
import { PACE } from '../chatter.js';
import { FURNITURE, place } from './furniture.js';
import { paint, paintFlat } from './portraits.js';
import { creature, bliss } from './creatures.js';
import { person } from './props-people.js';
import { cine } from './cine.js';
import { V3 } from './world.js';

const WALL_T = 0.2;
const ROOM = PLAN.rooms[0], BACK_Z = ROOM.z0 + WALL_T;
const turnTo = (o, yaw, dt) => { const d = Math.atan2(Math.sin(yaw - o.rotation.y), Math.cos(yaw - o.rotation.y)); o.rotation.y += d * Math.min(1, dt * 10); };

export const ROOBEAR_HOUSE = {
  id: 'roobear', plan: PLAN, arrive: ARRIVE, walls: WALLS,
  build(H) {
    const R = H.root, G = { queue: [], tour: 0, ticks: [], visited: false, rub: null, rubs: 0 };
    // ---------- her furniture, and her sign ----------
    for (const p of FURNISH) {
      const piece = place(R, FURNITURE[p.kind]({ col: p.col, light: p.kind === 'candelabra' }), p.x, p.z, p.yaw || 0);
      if (piece.tick) G.ticks.push(piece);
    }
    place(R, FURNITURE.sign({ text: SIGN.text, w: SIGN.w, h: SIGN.h, y: SIGN.y }), SIGN.x, BACK_Z, 0);
    G.blocks = blocksOf(FURNISH);
    // ---------- the guesses at her name, on her back wall ----------
    G.exhibits = [];
    for (const g of GUESSES) {
      const f = place(R, FURNITURE.frame({ plaque: g.title, w: g.w, h: g.h, y: g.y, ornate: g.w > 1 }), g.x, BACK_Z, 0);
      G.queue.push({ f, portrait: g });
      G.exhibits.push({ id: g.id, x: g.x, y: g.y, z: BACK_Z });   // (what she can talk about: the shell's)
    }
    const sconces = [-2.75, 2.75].map((x) => place(R, FURNITURE.sconce({ y: 2.2 }), x, BACK_Z, 0));
    G.ticks.push(...sconces);
    // ---------- her, and Robert (shared pieces: props-people.js, creatures.js) ----------
    G.herP = person({
      look: PIRATES.Roobear, parent: R, x: ARRIVE.her.x, z: ARRIVE.her.z, idle: 'sway', say: H.say,
      // (after her tour, a word now and then while you're by her, never over something she's saying)
      lines: CHATTER, random: true, gap: PACE.ASIDE,
      earshot: () => !cine && !G.rub && !H.talking() && (G.herP.talking() || !H.house.lines.has(G.her)) && Math.hypot(G.her.x - H.you.x, G.her.z - H.you.z) < 4.5,
    });
    G.herP.chatty = false;
    G.her = G.herP.p;
    const host = {
      who: G.herP, idle: 'sway', still: () => !!G.rub,
      showing() {
        const s = TOUR[G.tour - 1];
        return s && H.house.talk && H.house.talk === G.tourTalk ? { at: s.at, near: s.near, stand: s.her } : null;
      },
    };
    G.rob = creature('robert');
    R.add(G.rob.g);
    G.ticks.push(G.rob);
    const rob = G.rob.g.position;
    const robTo = (x, z, dt) => {
      const dx = x - rob.x, dz = z - rob.z, d = Math.hypot(dx, dz);
      if (d < 0.08) { G.rob.moving = false; return true; }
      const s = Math.min(d, RUB.pace * dt);
      const [nx, nz] = step(PLAN, rob.x, rob.z, rob.x + dx / d * s, rob.z + dz / d * s, G.blocks);
      G.rob.moving = Math.hypot(nx - rob.x, nz - rob.z) > 1e-4;
      rob.x = nx; rob.z = nz;
      turnTo(G.rob.g, Math.atan2(dx, dz), dt);
      return !G.rob.moving;
    };

    /** Paints the next guess waiting (one a tick: each is a little work). */
    const paintNext = () => {
      const q = G.queue.shift();
      if (!q) return;
      const painted = paint(q.portrait);
      q.f.setPicture(painted.texture, painted.uv);
    };
    paintNext(); paintNext();

    /* Robert roobs your ear: over to your side, a paw up at your ear, hopping on the spot; you shut your
       eyes; your line; then hers, who he is (the first time) or a word after (another). */
    function startRub(first) {
      if (G.rub) return;
      H.hush(); H.house.to = null;
      G.rub = { t: -1, first, at: rubSpot(PLAN, H.you, G.blocks) };
    }
    function rubTick(dt) {
      const r = G.rub, you = H.you;
      if (r.t < 0) {   // (hopping over)
        if (!robTo(r.at.x, r.at.z, dt) && (r.wait = (r.wait || 0) + dt) < 2.5) return;
        rob.set(r.at.x, 0, r.at.z); G.rob.g.rotation.y = r.at.yaw; G.rob.moving = false;
        r.t = 0; G.rob.rubbing = true; bliss(you, true);
        you.g.rotation.y = 0;   // (you, to the camera, so your face shows enjoying it)
        return;
      }
      r.t += dt;
      if (r.t >= RUB_BEATS.said && !r.said) { r.said = true; H.say(you, r.first ? IN_ROOBEARS_HOUSE.rubbed : IN_ROOBEARS_HOUSE.again, 2.2); }
      if (r.t >= RUB_BEATS.done) {
        G.rub = null; G.rob.rubbing = false; bliss(you, false);
        H.talk(G.her, [r.first ? ROBERT.hello : ROBERT.again[G.rubs++ % ROBERT.again.length]]);
      }
    }

    return {
      blocks: G.blocks,
      frozen: () => !!G.rub,
      host,
      // Her guesses: the one you're looking at, she tells you whose it was (the shell's; her lines by each).
      exhibits: G.exhibits,
      remark: guessLine,
      // ...and all of them close up, flat, one at a time (the shell's: picture-view.js), as they hang.
      pictures: {
        name: 'Guesses', who: 'Roobear',
        list: () => GUESSES.map((g) => ({ id: g.id, title: g.title, x: g.x, z: BACK_Z, portrait: g })),
        art(p) {
          G.flat ||= new Map();
          if (!G.flat.has(p.id)) G.flat.set(p.id, paintFlat(p.portrait));
          return G.flat.get(p.id);
        },
      },
      enter() {
        const again = G.visited;
        G.visited = true;
        Object.assign(G.her, { x: ARRIVE.her.x, z: ARRIVE.her.z }); G.her.g.position.set(G.her.x, 0, G.her.z);
        G.her.g.rotation.y = Math.PI * 0.85;
        rob.set(ARRIVE.robert.x, 0, ARRIVE.robert.z); G.rob.g.rotation.y = 0.6;
        if (G.tour < TOUR.length) G.tour = 0;
        // Her hello, then Robert's: an ear rub as the welcome.
        H.talk(G.her, [again ? AT_THE_DOOR.again : AT_THE_DOOR.first], () => { if (H.house.on && H.house.id === 'roobear') startRub(!again); });
      },
      leave() {
        if (G.rub) { G.rub = null; G.rob.rubbing = false; bliss(H.you, false); }
        H.hush();
        return `Roobear: "${GOODBYE}"`;
      },
      tick(dt) {
        const you = H.you, her = G.her;
        paintNext();
        G.ticks.forEach((p) => p.tick(dt));
        if (G.rub) { rubTick(dt); return; }
        // Robert hops about after her, on her side away from you.
        const by = robertBy(her, you);
        if (!cine && robTo(by.x, by.z, dt)) turnTo(G.rob.g, Math.atan2(you.x - rob.x, you.z - rob.z), dt * 0.5);
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
      /** The camera: the house's own, but in close on you and Robert while he roobs your ear. */
      cam() {
        if (!G.rub || G.rub.t < 0) return null;
        const you = H.you, C = H.home();
        return { look: V3((you.x + rob.x) / 2, 1.3, you.z), dist: Math.min(C.dist, 4.6), tilt: 0.28, yaw: -G.rub.at.side * 0.4 };   // (round to see his face)
      },
      // (Space moves her talk on first: Robert's asked only when no one's talking.)
      prompt() {
        if (G.rub || H.talking()) return null;
        return atRobert(H.you, rob) ? { text: 'Robert', btn: 'An ear rub, please' } : null;
      },
      act() {
        if (G.rub) return true;
        if (!H.talking() && atRobert(H.you, rob)) { startRub(false); return true; }
        return false;
      },
    };
  },
};
