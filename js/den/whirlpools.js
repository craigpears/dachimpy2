// Kikkit's island at the reef's near end, her whirlpools through the reef, and Vegas Island beyond them,
// the penguins' (src/den-kikkit.ts; the squares LAY.KIKKIT in src/den-sail.ts). Only the place's own
// mechanics and look are here: the island, its palms, the whirlpools and their winds, Vegas Island,
// the passage's watch, and the winds spitting her out. Who's on it is config (src/den-kikkit.ts,
// KIKKIT_CAST: her look, her lines from src/lines/kikkit.ts, her animation, where she stands, her
// familiars and the penguins), placed through the shared pieces: props-people.js's person() and
// creatures.js's creature() (RULES.md, "A character is only config"). Touches the rest only through a
// few hooks: sailing.js builds, ticks and asks it (where the sloop's drawn, Space, the prompt, whether
// Sailing's board is busy), the Sailing board's easy one in her waters (sail-station.js), what's found
// (G.found), the checkpoint's word on which way she crossed, sea.js's voices (whom you hear, Tzz's island
// a hop away), and, once she's told her ramble, your wondering aloud (her cast's `then`).
import * as THREE from 'three';
import { SAIL, LAY } from '../den-sail.js';
import { KIKKIT, KIKKIT_CAST, KIKKIT_STANDS, Whirlpools, onKikkitLanding, inKikkitWaters, inEarshot, kikkitShore, youWonder, PENGUINS } from '../den-kikkit.js';
import { whirlpool } from '../den-whirl.js';
import { shoreOf } from '../den-isle.js';
import { readSecs } from '../den-dignity.js';
import { addFind } from '../den-finds.js';
import { OF_HIM } from '../lines/penguin.js';
import { PIRATES } from '../den-look.js';
import { scene, mat, mesh, canvasTex, G, keys, toast, burst, V3, pirate } from './world.js';
import { sail, seaX, seaZ, windLane, voices } from './sea.js';
import { outline, slab } from './isle.js';
import { palm } from './wedding-scene.js';
import { cp } from './checkpoint.js';
import { stationBoard } from './sail-station.js';
import { person } from './props-people.js';
import { creature } from './creatures.js';
import { bubble, bubbleAt } from './cine.js';

const K = LAY.KIKKIT, CELL = SAIL.CELL;
/* Where her island's ground is, and Vegas Island's, so whoever stands there stands on it (the user,
   11 Nov: the pets "are sinking into the ground. You only really see them when they jump up"). A slab
   (isle.js) tops out at its y0 + its height + its bevel's 0.25: her sand, her grass (the higher, a
   hair over the sand's), and the floe's top. */
const BEVEL = 0.25, SAND = { y0: -0.4, h: 0.62 }, GRASS = { y0: -0.25, h: 0.5 }, ICE = { y0: -0.35, h: 0.55 };
const GROUND = Math.max(SAND.y0 + SAND.h, GRASS.y0 + GRASS.h) + BEVEL;
const FLOE = ICE.y0 + ICE.h + BEVEL;
/** Whose ground someone in KIKKIT_CAST stands on (its `on`). */
const GROUNDS = { sand: GROUND, floe: FLOE };
export const kik = { W: null, pool: new Whirlpools(), on: false, held: null, moment: null };

// ---------- the look of it ----------
/* A whirlpool's swirl: spiral arms of foam on a darker eye, turned as it turns. */
const swirlTex = (dark) => canvasTex(128, 128, (g, w) => {
  const c = w / 2, grad = g.createRadialGradient(c, c, 2, c, c, c);
  grad.addColorStop(0, dark ? 'rgba(8,30,40,.95)' : 'rgba(20,60,70,.8)');
  grad.addColorStop(0.55, 'rgba(40,110,120,.45)');
  grad.addColorStop(1, 'rgba(60,140,150,0)');
  g.fillStyle = grad; g.fillRect(0, 0, w, w);
  g.strokeStyle = 'rgba(235,250,250,.85)'; g.lineCap = 'round';
  for (let arm = 0; arm < 4; arm++) {
    g.lineWidth = 3.5 - arm * 0.4;
    g.beginPath();
    for (let t = 0; t <= 40; t++) { const a = arm * Math.PI / 2 + t * 0.12, r = 6 + t * 1.35; g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
    g.stroke();
  }
});
/* A whirlpool (src/den-whirl.ts): one swirl over all four of its squares, turning clockwise seen from
   above, as every whirlpool does (YPPedia). Any whirlpool's look (the race's: race.js). Spin it by
   `userData.speed` a second. */
export function pool(w) {
  const m = new THREE.MeshBasicMaterial({ map: swirlTex(true), transparent: true, depthWrite: false });
  const o = mesh(new THREE.CircleGeometry(CELL * 1.02, 48), m, false);
  o.rotation.x = -Math.PI / 2;
  o.position.set(seaX(w.mid[0]), 0.06, seaZ(w.mid[1]));
  o.renderOrder = 2;
  o.userData.speed = -1.6;   // (rotation.z up is anticlockwise seen from above: so, down)
  return o;
}
/* Her winds, drawn as the trade winds' lanes are (sea.js, windLane: the same wind, the same look; the
   user, 11 Nov: "the graphic representation of them should be the same"): each straight run of
   squares blowing the same way one lane. */
function windLanes() {
  const d0 = new Map(K.WINDS.map(([c, r, d]) => [`${c},${r}`, d])), DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
  const out = [];
  for (const [c, r, d] of K.WINDS) {
    if (d0.get(`${c - DC[d]},${r - DR[d]}`) === d) continue;   // (not the start of its run)
    let n = 1;
    while (d0.get(`${c + DC[d] * n},${r + DR[d] * n}`) === d) n++;
    out.push(windLane(c, r, d, n));
  }
  return out;
}

function build() {
  const g = new THREE.Group(), sand = mat('#e6cf96', { roughness: 1 }), wet = mat('#c9ad78', { roughness: 1 }), grass = mat('#7c9a52', { roughness: 1 });
  // Her island: sand, a wet rim, a tuft of grass, two palms leaning out over the water.
  const shore = kikkitShore();
  g.add(slab(outline(0.5, shore), -0.55, 0.45, wet), slab(outline(1.1, shore), SAND.y0, SAND.h, sand), slab(outline(3, shore), GRASS.y0, GRASS.h, grass));
  for (const [c, r, h, l] of [[20.4, 16.4, 4, 0.35], [21, 18.2, 3.4, -0.3], [19.6, 18.4, 3.6, 0.25]]) {
    const p = palm(h, l);
    p.scale.setScalar(0.8);
    p.position.set(seaX(c), 0.2, seaZ(r));
    p.rotation.y = c * 2.1 + r;
    g.add(p);
  }
  // The whirlpools on the water, each over its four squares, and the winds: the gap's, those past it,
  // the whirlpools' missing corners, and the way home.
  const pools = K.WHIRLS.map((spot) => { const o = pool(whirlpool(spot)); g.add(o); return o; });
  const winds = windLanes().map(({ g: lane, tex }) => { g.add(lane); return tex; });
  // Vegas Island: a little island past them, and its penguins.
  const vs = shoreOf(K.VEGAS);
  g.add(slab(outline(0.4, vs), -0.5, 0.4, mat('#e9ecef', { roughness: 0.9 })), slab(outline(1, vs), ICE.y0, ICE.h, mat('#f6f8fa', { roughness: 0.8 })));
  // Who's there, from config (src/den-kikkit.ts, KIKKIT_CAST): Kikkit, through the talking pirate;
  // her familiars and the penguins, through the creatures.
  const H = KIKKIT_CAST.her, ship = () => (sail.on ? sail.helm.pose : null);
  const her = person({
    look: PIRATES[H.look], parent: g, x: seaX(H.at[0]), y: GROUNDS[H.on], z: seaZ(H.at[1]), yaw: H.yaw, scale: H.scale, idle: H.idle,
    script: H.says, secs: readSecs, gap: 0, wait: 0, begun: false,
    bubble: 'page', shown: () => sail.on,
    // (within earshot, hailed or not, and nobody nearer talking (Tzz's island's a hop away: sea.js's
    // voices); not while a whirlpool has her)
    earshot: () => { const s = ship(); return !!s && !kik.held && inEarshot(s.c, s.r) && voices.hears('kikkit', s.c, s.r); },
    face: () => { const s = ship(); return s && inEarshot(s.c, s.r) ? { x: seaX(s.c), z: seaZ(s.r) } : null; },
  });
  const crew = KIKKIT_CAST.creatures.map((c) => {
    const o = creature(c.kind, c);
    o.g.position.set(seaX(c.at[0]), GROUNDS[c.on], seaZ(c.at[1]));
    o.g.rotation.y = c.yaw;
    g.add(o.g);
    return Object.assign(o, { id: c.id });
  });
  voices.add('kikkit', { c: KIKKIT_STANDS.c, r: KIKKIT_STANDS.r, earshot: KIKKIT.EARSHOT });
  scene.add(g);
  return { g, her, crew, sneak: crew.find((o) => o.id === 'sneak'), pools, winds };
}

/** Built the first time the sea's drawn (sailing.js), seen from afar too. */
export function kikkitWorld() { kik.W ||= build(); }

// ---------- what she says (her script: src/den-kikkit.ts, KIKKIT_SAYS; person() plays it) ----------
/** Space off her island: on to her next line if she's talking, else hail her. True if it was for her. */
export function kikkitHail() {
  if (!canHail()) return false;
  kik.W.her.hail();
  return true;
}
const canHail = () => sail.on && !kik.held && onKikkitLanding(sail.helm.pose.c, sail.helm.pose.r);
export function kikkitPrompt() {
  if (!sail.on) return '';
  if (kik.held) return 'A whirlpool has her: round to its far corner, and the winds...';
  if (!canHail()) return '';
  return kik.W?.her.talking() ? 'Off Kikkit\'s island · Space: and then?' : 'Off Kikkit\'s island · Space: hail her · 1: Sailing';
}
/** Hushed while someone else's scene talks with her (true: Helium's rum run, rumrun.js), or chattering again;
    her figure's group, to put a line over. */
export function kikkitQuiet(on) {
  const her = kik.W?.her;
  if (!her) return null;
  her.chatty = !on;
  if (on) her.hush();
  return her.p.g;
}
/** A whirlpool has her: Sailing's board is put away meanwhile (sailing.js). */
export const kikkitHolds = () => !!kik.held;

/** The ending's hook (left for later, 11 Nov: Kikkit moves to Vegas Island, and her familiars swim
    after your ship to follow her). Called once she's first reached the penguins, after their
    moment. Nothing yet. */
export function kikkitEnding() { /* (to come) */ }

// ---------- how she's drawn while a whirlpool has her ----------
/* sailing.js draws her where the helm has her (Helm.now: a whirl swings her round the whirlpool's
   middle to its far corner, turning a quarter), through this: as a whirlpool swings her she's
   dragged down into it a little, heeling into the turn. And once it's let her go, the winds don't
   just blow her home, they spit her out: a big bounding hop each square, splashing down, all the
   way back to Kikkit's island (the user, 11 Nov, of the first go's fling: "I do love how ... it
   does throw you out and say too many lefts ... if we're able to keep some of that charm in"). */
export function kikkitShown(p) {
  const h = sail.helm, cur = h.cur;
  if (!cur || cur.m !== 'W') return p;
  const u = Math.min(1, h.t / cur.secs), s = Math.sin(u * Math.PI);
  if (cur.via) return { ...p, hop: -0.3 * s, heel: 0.16 * s };
  if (!kik.held) return p;
  return { ...p, hop: s * 1.8, heel: 0.22 * Math.sin(u * Math.PI * 2) };
}

// ---------- each tick ----------
const said = new Set();
function onceToast(k, text) { if (said.has(k)) return; said.add(k); toast(text); }

/** Each tick at sea (sailing.js, after her own: `events` the helm's this tick). */
export function kikkitTick(dt, events = []) {
  const W = kik.W;
  if (!W) return;
  // The whirlpools turning, their winds racing; her familiars and the penguins at it.
  for (const o of W.pools) o.rotation.z += dt * o.userData.speed;
  for (const tex of W.winds) tex.offset.y -= dt * 2.2;   // (as the trade winds' lanes race: sailing.js)
  for (const o of W.crew) o.tick(dt);
  momentTick(dt);
  if (sail.on) atSea(dt, events);
  // Kikkit: swaying, swigging, talking, turned to you when you're about.
  W.her.tick(dt);
  // Once she's told her whole ramble, you wonder aloud (her cast's `then`), in the quiet after it.
  mine.el ||= bubble('', document.body, 'wrap');
  if (sail.on && youWonder(W.her.chatter, !!sail.said.wondered)) { sail.said.wondered = true; mine.t = 5; mine.el.textContent = KIKKIT_CAST.her.then; }
  if ((mine.t -= dt) > 0 && sail.on) { pirate.g.getWorldPosition(mine.at); bubbleAt(mine.el, true, mine.at.x, mine.at.y + 2.3, mine.at.z); } else mine.el.style.display = 'none';
}
/* Your own line over your head at sea (the wondering), for its few seconds. */
const mine = { el: null, t: 0, at: V3(0, 0, 0) };

function atSea(dt, events) {
  const h = sail.helm, pose = h.pose;
  // The whirlpools' own board in her waters: small, easy platforms (sail-station.js).
  stationBoard(inKikkitWaters(pose.c, pose.r));
  // Sailing up to her island, the first time: her ramble.
  const off = onKikkitLanding(pose.c, pose.r);
  if (off && !kik.on && !kik.held) kik.W.her.start();
  kik.on = off;
  // Through the reef, to the penguins, and a whirlpool having her: the helm plays it, as Puzzle
  // Pirates' whirlpools go (src/den-whirl.ts), and its winds bring her back (src/den-kikkit.ts).
  for (const e of kik.pool.watch(events, h)) {
    if (e === 'through') { G.found = addFind(G.found, 'whirlpools'); onceToast('through', OF_HIM.through); }
    if (e === 'penguins') penguinMoment();
    if (e === 'caught') { kik.held = true; keys.clear(); toast('A whirlpool has her! A quarter turn, and round to its far corner'); }
    if (e === 'back') {
      kik.held = false;
      cp.check?.whirled();   // (back across the reef by them, if she was out: the checkpoint's word on it)
      toast(onKikkitLanding(pose.c, pose.r) ? 'Too many lefts! Twirled round and spat all the way back to Kikkit\'s island' : 'The whirlpool\'s let her go');
      if (inEarshot(pose.c, pose.r)) kik.W.her.aside(kik.pool.backOut ? 'backOut' : 'back');
    }
  }
  // Each whirl churns the water as it swings her round.
  for (const e of events) if (e.kind === 'push' && e.whirl) burst(V3(seaX(e.from.c), 0.4, seaZ(e.from.r)), '#e6f3f6', 14, 3);
  // Spat out by the winds: a splash where each hop comes down.
  for (const e of events) if (e.kind === 'push' && !e.whirl && !e.gust && kik.held) burst(V3(seaX(e.to.c), 0.3, seaZ(e.to.r)), '#e6f3f6', 18, 4);
}

/* The penguins: the moment you first get there, and each time after. Their island goes on the map
   (a hidden place found), and the one in the balaclava freezes, caught in the act, and drops his sack. */
function penguinMoment() {
  const first = !(G.found ?? []).includes('vegas');
  G.found = addFind(G.found, 'vegas');
  toast(OF_HIM.penguins);
  kik.moment = { t: 0, said: false };
  kik.W.sneak?.caught();
  if (first) setTimeout(() => kikkitEnding(), 0);
}
function momentTick(dt) {
  const M = kik.moment;
  if (!M) return;
  M.t += dt;
  if (M.t > 1.4 && !M.said) { M.said = true; toast(OF_HIM.balaclava); }
  if (M.t > 6) kik.moment = null;
}

/** A fresh voyage: she's never met you, nothing's had you. (What you've found stays found.) */
export function kikkitReset() {
  kik.pool = new Whirlpools();
  kik.on = false; kik.held = null; kik.moment = null;
  said.clear();
  kik.W?.her.restart();
}

/** Its starting point (menus.js): at sea off her island, her whirlpools beside it. */
export function kikkitCheat() {
  const h = sail.helm;
  h.moor({ c: K.MOUTH.c, r: K.LANDING.r0, d: 0 });
  sail.riding = false;
}
/** Vegas Island's starting point (menus.js, ?at=penguins; public since 12 Nov): at sea in the penguins'
    water past the whirlpools, as if a Vegas had just carried her there (their moment plays). */
export function penguinsCheat() {
  sail.helm.moor({ c: PENGUINS[0], r: PENGUINS[1], d: 2 });
  sail.riding = false;
}
export { PENGUINS };
