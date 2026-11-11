/* Gravee's house, Bedside Manors: her scene in the house shell (house.js). Its rules (the plan, where her
   furniture stands, her portraits, the tour, the gag, the scare's beats) are src/den-gravee.ts's; her
   lines src/lines/gravee.ts's, the Count's vampire.ts's, yours you.ts's. This places the shared
   furniture (furniture.js) and the portraits (portraits.js), and plays her: she meets you at the door and
   shows you round, a stop at a time, walking with you (the house shell walks her: she's its `host`);
   the gallery goes on and on (or whiz along it: the shell's skip, its `stretch`); the Count's portrait
   watches you (portraits.js's watching); lift his lid and he sits up, you both scream, and she paints
   you, frozen mid-fright, the camera easing round to her at her easel (src/den-gravee.ts's scareShot),
   and hangs it pride of place in her hall (kept in this browser, with a snapshot to save). */
import * as THREE from 'three';
import { PIRATES } from '../den-look.js';
import {
  PLAN, ARRIVE, WALLS, FURNISH, blocksOf, galleryHang, HERSELF, VAMPIRE_PORTRAIT, HALL_OTHER, HALL_WALL, YOURS, VAMPIRE,
  WHIZ, TOUR, stopAt, atCoffin, COFFIN, SITTING, SCARE, scareShot, LEAD, LURE, leading, GALLERY_LEN, yourTitle, paintedBy,
  portraitLine, allPortraits,
} from '../den-gravee.js';
import { SITTINGS_KEY, cleanSittings, sat, plaqueDate, snapshotName } from '../den-houses.js';
import { AT_THE_DOOR, HALL_YOURS, TOUR_LINES, THE_GALLERY, THE_SCARE, CHATTER, YOUR_PORTRAIT, GOODBYE, BECKON } from '../lines/gravee.js';
import { WOKEN, ASLEEP } from '../lines/vampire.js';
import { IN_GRAVEES_HOUSE } from '../lines/you.js';
import { FURNITURE, place } from './furniture.js';
import { paint, paintYou, paintFlat, snapshot, watching } from './portraits.js';
import { creature, fright } from './creatures.js';
import { person } from './props-people.js';
import { cine, cinePlay, cineEnd } from './cine.js';
import { myLook, keep, V3 } from './world.js';

const WALL_T = 0.2;
const HALL = PLAN.rooms[0], GAL = PLAN.rooms[1], CHAMBER = PLAN.rooms[2];
const yourName = () => { try { return localStorage.getItem('carp.den.name')?.trim() || ''; } catch { return ''; } };
const sittings = () => { try { return cleanSittings(JSON.parse(localStorage.getItem(SITTINGS_KEY))); } catch { return {}; } };
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const within = ([a, b]) => a + Math.random() * (b - a);

export const GRAVEE_HOUSE = {
  id: 'gravee', plan: PLAN, arrive: ARRIVE, walls: WALLS,
  build(H) {
    const R = H.root, G = { queue: [], tour: 0, scare: null, ticks: [], visited: false, painted: null, beckons: 0, beckonIn: 2, rattleIn: 3 };
    // ---------- her furniture, where her rules say ----------
    for (const p of FURNISH) {
      const opts = { col: p.col };
      if (p.kind === 'runner') opts.len = GALLERY_LEN - 1.6;
      if (p.kind === 'coffin') opts.sitter = creature('vampire', { look: VAMPIRE }).fig;
      if (p.kind === 'candelabra') opts.light = true;
      const piece = place(R, FURNITURE[p.kind](opts), p.x, p.z, p.yaw || 0);
      if (piece.tick) G.ticks.push(piece);
      if (p.kind === 'coffin') G.coffin = piece;
      if (p.kind === 'easel') G.easel = piece;
    }
    // ---------- her portraits, on the walls ----------
    G.exhibits = [];
    const hang = (portrait, x, wallZ, o) => {
      const f = place(R, FURNITURE.frame({ plaque: portrait.title, ...o }), x, wallZ, 0);
      G.queue.push({ f, portrait });
      G.exhibits.push({ id: portrait.id, x, y: o.y, z: wallZ });   // (what she can talk about: the shell's)
      return f;
    };
    const hallZ = HALL.z0 + WALL_T, galZ = GAL.z0 + WALL_T, chZ = CHAMBER.z0 + WALL_T;
    G.pride = place(R, FURNITURE.frame({ w: HALL_WALL.pride.w, h: HALL_WALL.pride.h, y: 1.75, plaque: 'Reserved for my favourite' }), HALL_WALL.pride.x, hallZ, 0);
    hang(VAMPIRE_PORTRAIT, HALL_WALL.vampire.x, chZ, { w: 0.72, h: 0.9, y: 2.2 });
    hang(HERSELF, HALL_WALL.herself.x, hallZ, { w: 0.9, h: 1.12, y: 1.75 });
    hang(HALL_OTHER, HALL_WALL.other.x, hallZ, { w: 0.9, h: 1.12, y: 1.75 });
    const G0 = galleryHang();
    // (painted nearest the ends first: what you see at a walk)
    G0.map((p, i) => ({ p, i, d: Math.min(p.x - GAL.x0, GAL.x1 - p.x) })).sort((a, b) => a.d - b.d).forEach(({ p }) => hang(p, p.x, galZ, { w: 0.78, h: 0.98, y: 1.62, ornate: false }));
    G.titles = G0.map((p) => ({ x: p.x, title: p.title }));
    for (let i = 0; i < G0.length - 1; i += 3) { const s = place(R, FURNITURE.sconce({ y: 2.15 }), G0[i].x + 0.8, galZ, 0); G.ticks.push(s); }
    G.blocks = blocksOf(FURNISH);
    // ---------- her, and a bat about the Count's coffin (shared pieces: props-people.js, creatures.js) ----------
    G.herP = person({
      look: PIRATES.Gravee, parent: R, x: ARRIVE.her.x, z: ARRIVE.her.z, idle: 'sway', say: H.say,
      // (after her tour, a word now and then while you're by her, never over something she's saying)
      lines: CHATTER, random: true, gap: [11, 17],
      earshot: () => !cine && !G.scare && !H.talking() && !leading(G.tour, !!G.woken) && (G.herP.talking() || !H.house.lines.has(G.her)) && Math.hypot(G.her.x - H.you.x, G.her.z - H.you.z) < 4.5,
    });
    G.herP.chatty = false;
    G.her = G.herP.p;
    /* Her, walking you round (the shell walks her: house.js's host): by each thing she shows you while
       she's on about it, at your side otherwise; in her bedchamber, by the coffin, beckoning you over,
       till you've had your look (LEAD); not while the scare has her at her easel. */
    const host = {
      who: G.herP, idle: 'sway', still: () => !!G.scare,
      showing() {
        const s = TOUR[G.tour - 1];
        if (s && H.house.talk && H.house.talk === G.tourTalk) return { at: s.at, near: s.near, stand: s.her };
        return leading(G.tour, !!G.woken) ? LEAD : null;
      },
    };
    G.bat = creature('bat', { col: 'black', idle: 'flutter', r: 1.0, h: 2.6, speed: 0.9 });
    G.bat.g.position.set(COFFIN.x, 0, COFFIN.z);   // (circling over his coffin)
    R.add(G.bat.g);
    G.ticks.push(G.bat);

    // ---------- your portrait, on her wall ----------
    const hangYours = (s) => {
      const painted = paintYou(YOURS, s.look);
      G.painted = { ...painted, at: s.at };
      G.pride.setPicture(painted.texture);
      G.pride.setPlaque(yourTitle(yourName()));
      H.portraitButton(viewYours);
    };
    const viewYours = () => {
      if (!G.painted) return;
      H.showPortrait(snapshot(G.painted.canvas, yourTitle(yourName()), paintedBy(plaqueDate(G.painted.at))), snapshotName(yourName() || 'you', 'Bedside Manors'));
    };
    const mine = sittings().gravee;
    if (mine) hangYours(mine);

    const youAt = () => H.you.g.getWorldPosition(V3());
    /** Paints the next picture waiting (one a tick: each is a little work). */
    function paintNext() {
      const q = G.queue.shift();
      if (!q) return;
      const painted = paint(q.portrait);
      q.f.setPicture(painted.texture, painted.uv);
      // (one that watches: its eyes on you, wherever you are)
      if (q.portrait.watch) { const w = watching(q.f, painted, youAt); if (w) G.ticks.push(w); }
    }
    // The Count's portrait first, and the hall's.
    for (let i = 0; i < 4; i++) paintNext();

    // ---------- the cutscenes ----------
    const camAt = (x, y, z, dist, tilt, yaw) => ({ look: V3(x, y, z).add(H.at), dist, tilt, yaw });
    /* Lifting the Count's lid: he sits bolt upright, you both scream, she sees her chance and paints you
       there and then, frozen mid-fright; he grumbles and lies back down; and it's hung pride of place. */
    function startScare() {
      const you = H.you, her = G.her, again = !!G.woken;
      G.woken = true;
      G.tour = TOUR.length;   // (shown round or not, that's the tour over: no "don't open it" after)
      H.hush();
      Object.assign(you, { x: SITTING.you.x, z: SITTING.you.z }); you.g.rotation.y = SITTING.you.yaw; you.g.position.set(you.x, 0, you.z);
      Object.assign(her, { x: SITTING.her.x, z: SITTING.her.z }); her.g.position.set(her.x, 0, her.z); her.g.rotation.y = SITTING.her.yaw;
      // The camera: from where it was, eased round from shot to shot (src/den-gravee.ts's scareShot).
      const home = H.home(), shoot = (t) => { const s = scareShot(t, home); c.cam.look.set(s.look.x, s.look.y, s.look.z).add(H.at); Object.assign(c.cam, { dist: s.dist, tilt: s.tilt, yaw: s.yaw }); };
      const painted = paintYou(YOURS, myLook);
      const full = painted.canvas, rev = document.createElement('canvas');
      rev.width = full.width; rev.height = full.height;
      const rg = rev.getContext('2d'), revTex = new THREE.CanvasTexture(rev);
      revTex.colorSpace = THREE.SRGBColorSpace;
      G.easel.setPicture(null);
      const once = (k) => (c.did[k] ? false : (c.did[k] = true));
      const c = {
        t: 0, did: {}, cam: { look: V3(), dist: 0, tilt: 0, yaw: 0 },
        tick(dt) {
          const t = (c.t += dt);
          shoot(t);
          if (once('creak')) G.coffin.open(1);
          if (t >= SCARE.up && once('up')) G.coffin.sitUp(1);
          if (t >= SCARE.scream && once('scream')) {
            H.say(G.coffin.sitter, again ? WOKEN.again : WOKEN.scream, 2.2);
            H.say(you, IN_GRAVEES_HOUSE.scream, 2.2);
            fright(you, true);
          }
          if (t >= SCARE.clap && once('clap')) { H.say(her, THE_SCARE.moment, SCARE.paint - SCARE.clap + 0.4); G.herP.setIdle('clap'); }
          if (t >= SCARE.paint) {
            // Her brush going, the picture appearing stroke by stroke on the easel.
            if (once('paint')) { H.say(her, THE_SCARE.painting, 3.0); G.easel.setPicture(revTex); G.herP.setIdle('paint'); }
            const k = Math.min(1, (t - SCARE.paint) / (SCARE.painted - SCARE.paint));
            if (!c.did.whole) {
              rg.fillStyle = '#f2ead8'; rg.fillRect(0, 0, rev.width, rev.height);
              rg.drawImage(full, 0, 0, full.width, full.height * k, 0, 0, rev.width, rev.height * k);
              revTex.needsUpdate = true;
              c.did.whole = k >= 1;
            }
          }
          if (t >= SCARE.paint + 1.6 && once('grumble')) { H.say(G.coffin.sitter, WOKEN.grumble, 2.0); G.coffin.sitUp(0); }
          if (t >= SCARE.paint + 2.6 && once('shut')) G.coffin.open(0);
          if (t >= SCARE.done) cineEnd(false);
        },
        end(skip) { finish(painted, skip); },
      };
      shoot(0);
      G.scare = c;
      cinePlay(c);
    }
    /* The scare over (played out or skipped): your portrait kept, finished on the easel and hung pride of
       place; a look at it in the hall; then the snapshot to save. */
    function finish(painted, skip) {
      const you = H.you, her = G.her;
      fright(you, false);
      G.coffin.set(0, 0);
      G.easel.setPicture(painted.texture);
      G.herP.setIdle('sway');
      const s = sat(sittings(), 'gravee', myLook, new Date());
      keep(SITTINGS_KEY, s);
      G.painted = { ...painted, at: s.gravee.at };
      G.pride.setPicture(painted.texture);
      G.pride.setPlaque(yourTitle(yourName()));
      H.portraitButton(viewYours);
      G.scare = null;
      if (skip) { viewYours(); return; }
      // A look at it on her wall: her beside it, proud.
      H.say(her, THE_SCARE.done, 2.4);
      const back = { x: her.x, z: her.z };
      const c = {
        t: 0, cam: { ...camAt(HALL_WALL.pride.x, 1.7, HALL.z0 + 3.2, 5.2, 0.12, 0), cut: true },   // (cut to it: not a flight down the gallery)
        tick(dt) {
          c.t += dt;
          if (c.t > 0.5 && !c.at) {
            c.at = true;
            Object.assign(her, { x: HALL_WALL.pride.x + 1.3, z: HALL.z0 + 1.1 }); her.g.position.set(her.x, 0, her.z); her.g.rotation.y = -0.4;
            H.say(her, THE_SCARE.hung, 2.8);
          }
          if (c.t > 3.6) cineEnd(false);
        },
        end() {
          Object.assign(her, back); her.g.position.set(her.x, 0, her.z);
          H.house.snap = true;   // (and cut back)
          viewYours();
        },
      };
      setTimeout(() => { if (!cine && H.house.on) cinePlay(c); }, 2600);
    }

    // ---------- each tick ----------
    return {
      blocks: G.blocks,
      frozen: () => !!G.scare,
      host,
      // The gallery: walked, on and on; or whizzed along, her titles going by.
      stretch: { ...WHIZ, titles: G.titles, lines: { ask: IN_GRAVEES_HOUSE.howMany, answer: THE_GALLERY.answer, back: THE_GALLERY.back } },
      // Her portraits: the one you're looking at, she tells you about (the shell's; her lines by each).
      exhibits: G.exhibits,
      remark: portraitLine,
      // ...and all of them close up, flat, one at a time (the shell's: picture-view.js), in the order they
      // hang, yours among them once she's painted you; each painted as on the wall (portraits.js), when
      // it's first wanted, and kept.
      pictures: {
        name: 'Portraits', who: 'Gravee',
        list() {
          const where = { herself: [HALL_WALL.herself.x, hallZ], you: [HALL_WALL.pride.x, hallZ], vampire: [HALL_WALL.vampire.x, chZ] };
          return allPortraits(!!G.painted).map((p, i) => {
            const [x, z] = where[p.id] || (p.x !== undefined ? [p.x, galZ] : i <= 2 ? [HALL_WALL.other.x, hallZ] : [0, 0]);
            return { id: p.id, title: p.id === 'you' ? yourTitle(yourName()) : p.title, x, z, portrait: p };
          });
        },
        art(p) {
          if (p.id === 'you') return G.painted?.canvas || null;
          G.flat ||= new Map();
          if (!G.flat.has(p.id)) G.flat.set(p.id, paintFlat(p.portrait));
          return G.flat.get(p.id);
        },
      },
      enter() {
        const kind = G.painted ? 'painted' : G.visited ? 'again' : 'first';
        G.visited = true; G.saidYours = false;
        Object.assign(G.her, { x: ARRIVE.her.x, z: ARRIVE.her.z }); G.her.g.position.set(G.her.x, 0, G.her.z);
        G.her.g.rotation.y = Math.PI * 0.85;
        if (G.tour >= TOUR.length) G.tour = TOUR.length; else G.tour = 0;
        H.talk(G.her, [AT_THE_DOOR[kind]]);
      },
      leave() { H.hush(); return `Gravee: "${GOODBYE}"`; },
      tick(dt) {
        const you = H.you, her = G.her;
        paintNext(); paintNext();
        G.ticks.forEach((p) => p.tick(dt));
        G.coffin.tick(dt);
        // The coffin calling you over (LURE), once you're in her bedchamber: its lid rattling, him snoring,
        // and her beckoning from beside it.
        if (!G.woken && !cine && !G.scare && you.x > CHAMBER.x0 - 1) {
          const far = Math.hypot(you.x - COFFIN.x, you.z - COFFIN.z) > LURE.far;
          if ((G.rattleIn -= dt) <= 0) {
            G.rattleIn = within(LURE.rattle);
            G.coffin.rattle();
            if (far) H.say(G.coffin.sitter, ASLEEP, 1.6);
          }
          const by = Math.hypot(her.x - LEAD.stand.x, her.z - LEAD.stand.z) < 0.6;
          if (leading(G.tour, false) && by && far && !H.talking() && (G.beckonIn -= dt) <= 0) {
            G.beckonIn = within(LURE.beckon);
            H.say(her, BECKON[G.beckons++ % BECKON.length]);
          }
        }
        // Her tour: at each stop she's come to, her lines for it.
        if (!cine && !H.talking() && G.tour < TOUR.length) {
          const j = stopAt(G.tour, you.x, you.z);
          if (j >= 0) {
            G.tour = j + 1;
            const L = [...TOUR_LINES[TOUR[j].id]];
            if (TOUR[j].id === 'hall' && G.painted) L[L.length - 1] = HALL_YOURS;   // (her favourite's up now: you)
            H.talk(her, L);
            G.tourTalk = H.house.talk;   // (her tour's: she stands by the stop while she says it)
          }
        }
        // (her walking with you, talking as she goes: the shell's, house.js's host)
        // Once she's shown you round, a word now and then; and one for your portrait, by it.
        if (!cine) {
          if (G.tour >= TOUR.length) G.herP.chatty = true;
          if (G.painted && !G.saidYours && !H.talking() && Math.hypot(you.x - HALL_WALL.pride.x, you.z - HALL.z0) < 3) { G.saidYours = true; H.say(her, pick(YOUR_PORTRAIT)); }
        }
      },
      /** The camera: the house's own, but in her bedchamber, while she's leading you to the coffin, leaning
          over toward it so it and she are in the picture from wherever you are in the room. */
      cam() {
        const you = H.you;
        if (!leading(G.tour, !!G.woken) || G.scare || you.x < CHAMBER.x0 + 0.5) return null;
        const C = H.home(), k = Math.min(1, Math.hypot(you.x - COFFIN.x, you.z - COFFIN.z) / 4) * 0.45;
        return { look: V3(C.look.x + (COFFIN.x - you.x) * k, C.look.y, C.look.z + (COFFIN.z - you.z) * k * 0.4), dist: C.dist, tilt: C.tilt, yaw: C.yaw };
      },
      prompt() {
        const you = H.you;
        if (G.scare) return null;
        if (atCoffin(you.x, you.z)) return { text: 'The coffin', btn: 'Lift the lid' };
        if (G.painted && Math.hypot(you.x - HALL_WALL.pride.x, you.z - (HALL.z0 + 1)) < 1.4) return { text: 'Your portrait', btn: 'Look closer' };
        return null;
      },
      act() {
        const you = H.you;
        if (G.scare) return true;
        if (atCoffin(you.x, you.z)) { startScare(); return true; }
        if (G.painted && Math.hypot(you.x - HALL_WALL.pride.x, you.z - (HALL.z0 + 1)) < 1.4) { viewYours(); return true; }
        return false;
      },
    };
  },
};
