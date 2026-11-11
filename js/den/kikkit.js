// Kikkit's island at the reef's near end, her familiars about her, her whirlpools through the reef,
// and Vegas Island beyond them, the penguins' (src/den-kikkit.ts; the squares LAY.KIKKIT in
// src/den-sail.ts; her lines src/lines/kikkit.ts, the penguin's src/lines/penguin.ts). Touches the
// rest only through a few hooks: sailing.js builds, ticks and asks it (where she's drawn, Space, the
// prompt, whether the rigging's busy), the Sailing board's easy one in her waters (sail-station.js),
// what's found (G.found) and the checkpoint's word on which way she crossed.
import * as THREE from 'three';
import { SAIL, LAY } from '../den-sail.js';
import { KIKKIT_STANDS, Kikkit, Whirlpools, onKikkitLanding, inKikkitWaters, inEarshot, kikkitShore, PENGUINS } from '../den-kikkit.js';
import { whirlpool } from '../den-whirl.js';
import { shoreOf } from '../den-isle.js';
import { readSecs } from '../den-dignity.js';
import { addFind } from '../den-finds.js';
import { OF_HIM } from '../lines/penguin.js';
import { PIRATES, familiar, familiarTick } from '../den-look.js';
import { scene, mat, mesh, canvasTex, makePirate, G, keys, toast, burst, V3 } from './world.js';
import { sail, seaX, seaZ, windLane } from './sea.js';
import { outline, slab } from './isle.js';
import { palm } from './wedding-scene.js';
import { bubble, bubbleAt } from './cine.js';
import { cp } from './checkpoint.js';
import { stationBoard } from './sail-station.js';

const K = LAY.KIKKIT, CELL = SAIL.CELL;
const SC = 1.15;   // (a touch big, so she reads from the sea, as Dignity)
/* Where her island's ground is, and Vegas Island's, so whoever stands there stands on it (the user,
   11 Nov: the pets "are sinking into the ground. You only really see them when they jump up"). A slab
   (isle.js) tops out at its y0 + its height + its bevel's 0.25: her sand, her grass (the higher, a
   hair over the sand's), and the floe's top. */
const BEVEL = 0.25, SAND = { y0: -0.4, h: 0.62 }, GRASS = { y0: -0.25, h: 0.5 }, ICE = { y0: -0.35, h: 0.55 };
const GROUND = Math.max(SAND.y0 + SAND.h, GRASS.y0 + GRASS.h) + BEVEL;
const FLOE = ICE.y0 + ICE.h + BEVEL;
export const kik = { W: null, rules: new Kikkit(), pool: new Whirlpools(), queue: [], line: null, on: false, held: null, moment: null };

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
   above, as every whirlpool does (YPPedia). */
function pool(w) {
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
// A penguin, standing about; `balaclava`: the one up to something, a sack over his shoulder.
function penguin(balaclava = false) {
  const g = new THREE.Group(), black = mat('#1b1d22'), white = mat('#f4f2ec'), orange = mat('#f0a028');
  const body = mesh(new THREE.SphereGeometry(0.3, 14, 12), black);
  body.scale.set(0.85, 1.25, 0.8); body.position.y = 0.38;
  const belly = mesh(new THREE.SphereGeometry(0.26, 14, 12), white);
  belly.scale.set(0.75, 1.1, 0.6); belly.position.set(0, 0.34, 0.08);
  const head = new THREE.Group();
  head.position.y = 0.8;
  head.add(mesh(new THREE.SphereGeometry(0.17, 14, 12), balaclava ? mat('#3c4a3a', { roughness: 1 }) : black));
  const beak = mesh(new THREE.ConeGeometry(0.045, 0.14, 8), orange);
  beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.02, 0.17);
  head.add(beak);
  if (balaclava) {
    // The balaclava's eye slit, his eyes darting about in it, and a bobble on top.
    const slit = mesh(new THREE.BoxGeometry(0.2, 0.055, 0.04), white);
    slit.position.set(0, 0.04, 0.145);
    const bobble = mesh(new THREE.SphereGeometry(0.045, 8, 6), mat('#3c4a3a'));
    bobble.position.y = 0.17;
    head.add(slit, bobble);
    g.userData.eyes = [-1, 1].map((s) => { const e = mesh(new THREE.SphereGeometry(0.022, 6, 5), black, false); e.position.set(0.045 * s, 0.04, 0.17); head.add(e); return e; });
    // His swag: a sack over his shoulder.
    const sack = mesh(new THREE.SphereGeometry(0.16, 10, 8), mat('#a98a5a', { roughness: 1 }));
    sack.scale.set(1, 1.2, 0.9); sack.position.set(-0.22, 0.75, -0.18);
    g.add(sack);
    g.userData.sack = sack;
  } else for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.022, 6, 5), white, false); e.position.set(0.07 * s, 0.04, 0.14); head.add(e); }
  const flips = [-1, 1].map((s) => { const f = mesh(new THREE.SphereGeometry(0.1, 8, 6), black); f.scale.set(0.25, 1, 0.6); f.position.set(0.25 * s, 0.42, 0); g.add(f); return f; });
  for (const s of [-1, 1]) { const ft = mesh(new THREE.SphereGeometry(0.07, 8, 6), orange); ft.scale.set(1, 0.35, 1.5); ft.position.set(0.1 * s, 0.03, 0.06); g.add(ft); }
  g.add(body, belly, head);
  Object.assign(g.userData, { head, flips, ph: Math.random() * 6 });
  return g;
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
  // Kikkit, on the sand by the whirlpools' mouth, looking out at you.
  const p = makePirate({ look: PIRATES.Kikkit });
  p.g.scale.setScalar(SC);
  const at = V3(seaX(KIKKIT_STANDS.c), GROUND, seaZ(KIKKIT_STANDS.r));
  p.g.position.copy(at);
  g.add(p.g);
  // Her familiars about her, each doing its own thing ("the familiar version of a cat lady").
  const fams = [
    { fam: 'parrot', famCol: 'green', famCol2: 'red', at: [19.1, 16.6], hop: 1 },
    { fam: 'octopus', famCol: 'violet', at: [18.6, 18.1], hop: 0 },
    { fam: 'squirrel', famCol: 'grey', at: [19.6, 17.5], hop: 1.4 },
    { fam: 'bat', famCol: 'black', at: [20.3, 17.2], fly: true },
    { fam: 'krakling', famCol: 'aqua', at: [20.6, 18.4], hop: 0 },
    { fam: 'parrot', famCol: 'blue', famCol2: 'yellow', at: [20.9, 16.9], hop: 0.8 },
    { fam: 'monkey', famCol: 'tan', at: [19.4, 18.6], hop: 1.2 },
  ].map((f, i) => {
    const o = familiar(f);
    o.g.scale.setScalar(2.2);
    o.g.position.set(seaX(f.at[0]), GROUND, seaZ(f.at[1]));
    o.g.rotation.y = -0.6 + i * 0.7;
    g.add(o.g);
    return { o, ...f, ph: i * 1.3, y0: GROUND };
  });
  // The whirlpools on the water, each over its four squares, and the winds: the gap's, those past it,
  // the whirlpools' missing corners, and the way home.
  const pools = K.WHIRLS.map((spot) => { const o = pool(whirlpool(spot)); g.add(o); return o; });
  const winds = windLanes().map(({ g: lane, tex }) => { g.add(lane); return tex; });
  // Vegas Island: a little island past them, and its penguins.
  const vs = shoreOf(K.VEGAS);
  g.add(slab(outline(0.4, vs), -0.5, 0.4, mat('#e9ecef', { roughness: 0.9 })), slab(outline(1, vs), ICE.y0, ICE.h, mat('#f6f8fa', { roughness: 0.8 })));
  const flock = [[15.1, 23.1], [14.9, 23.8], [15.3, 24.4], [15.9, 24.0], [16.3, 24.4]].map(([c, r], i) => {
    const o = penguin();
    o.position.set(seaX(c), FLOE, seaZ(r));
    o.rotation.y = i * 1.7;
    o.scale.setScalar(1.6);
    g.add(o);
    return o;
  });
  const sneak = penguin(true);
  sneak.scale.setScalar(1.6);
  sneak.position.set(seaX(15.2), FLOE, seaZ(23.55));
  g.add(sneak);
  const say = bubble('', document.body, 'wrap');   // (on the page: at sea the den's labels are hidden)
  scene.add(g);
  return { g, p, at, fams, pools, winds, flock, sneak, say, yaw: 0 };
}

/** Built the first time the sea's drawn (sailing.js), seen from afar too. */
export function kikkitWorld() { kik.W ||= build(); }

// ---------- what she says ----------
/* Once she's told her ramble, she never stops while you're within earshot: run out, and she's off on
   the next tangent, hailed or not (src/den-kikkit.ts, more). Not while a whirlpool has you. */
const chatty = () => sail.on && !kik.held && kik.rules.told && inEarshot(sail.helm.pose.c, sail.helm.pose.r);
function sayNext() {
  if (!kik.queue.length && chatty()) kik.queue = kik.rules.more();
  const text = kik.queue.shift();
  kik.line = text ? { text, t: 0, secs: readSecs(text) } : null;
  if (text) kik.W.say.textContent = text;
}
/** Space off her island: on to her next line if she's talking, else hail her. True if it was for her. */
export function kikkitHail() {
  if (!canHail()) return false;
  if (kik.line) { sayNext(); return true; }
  kik.queue = kik.rules.hail();
  sayNext();
  return true;
}
const canHail = () => sail.on && !kik.held && onKikkitLanding(sail.helm.pose.c, sail.helm.pose.r);
export function kikkitPrompt() {
  if (!sail.on) return '';
  if (kik.held) return 'A whirlpool has her: round to its far corner, and the winds...';
  if (!canHail()) return '';
  return kik.line ? 'Off Kikkit\'s island · Space: and then?' : 'Off Kikkit\'s island · Space: hail her · R: the rigging (Sailing)';
}
/** A whirlpool has her: the rigging's put away meanwhile (sailing.js). */
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
  const t = performance.now() / 1000;
  // The whirlpools turning; her familiars at it; the penguins pottering.
  for (const o of W.pools) o.rotation.z += dt * o.userData.speed;
  for (const tex of W.winds) tex.offset.y -= dt * 2.2;   // (as the trade winds' lanes race: sailing.js)
  for (const f of W.fams) {
    familiarTick(f.o, dt);
    if (f.fly) f.o.g.position.set(seaX(f.at[0]) + Math.cos(t * 1.3 + f.ph) * 1.6, 2.4 + Math.sin(t * 2.1) * 0.5, seaZ(f.at[1]) + Math.sin(t * 1.3 + f.ph) * 1.6);
    else if (f.hop) f.o.g.position.y = f.y0 + Math.max(0, Math.sin(t * 3 * f.hop + f.ph)) * 0.35;
  }
  for (const o of W.flock) { const u = o.userData; u.head.rotation.y = Math.sin(t * 0.8 + u.ph) * 0.5; u.flips.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * (0.15 + Math.max(0, Math.sin(t * 2 + u.ph)) * 0.3); }); o.position.y = FLOE + Math.abs(Math.sin(t * 3 + u.ph)) * 0.04; }
  sneakTick(W, dt, t);
  if (sail.on) atSea(dt, events);
  // Kikkit: facing you when you're about, swigging from her jug now and then, swaying (a bit drunk).
  const s = sail.on ? sail.helm.pose : null, near = s && inEarshot(s.c, s.r);
  const want = near ? Math.atan2(seaX(s.c) - W.at.x, seaZ(s.r) - W.at.z) : -0.9;
  W.yaw += (want - W.yaw) * Math.min(1, dt * 2);
  W.p.g.rotation.y = W.yaw;
  W.p.body.rotation.set(0, 0, Math.sin(t * 1.1) * 0.12);
  const swig = Math.max(0, Math.sin(t * 0.5)) ** 8, talk = kik.line ? Math.abs(Math.sin(t * 7)) : 0;
  W.p.arms[0].rotation.set(-swig * 2.4 - talk * 0.8, 0, -talk * 0.4);
  W.p.arms[1].rotation.set(-talk * 1.2, 0, talk * 0.6 * Math.sin(t * 5));
  familiarTick(W.p.fam, dt);
  // Her line over her head, read through, then the next.
  if (kik.line && (kik.line.t += dt) > kik.line.secs) sayNext();
  bubbleAt(W.say, !!kik.line && sail.on, W.at.x, W.at.y + 2.4 * SC, W.at.z);
  if (kik.line && parseFloat(W.say.style.top) < 90) W.say.style.top = '90px';
}

function atSea(dt, events) {
  const h = sail.helm, pose = h.pose;
  // The whirlpools' own board in her waters: small, easy platforms (sail-station.js).
  stationBoard(inKikkitWaters(pose.c, pose.r));
  // Sailing up to her island, the first time: her ramble.
  const off = onKikkitLanding(pose.c, pose.r);
  if (off && !kik.on && !kik.held) { const lines = kik.rules.arrive(); if (lines.length) { kik.queue = lines; sayNext(); } }
  kik.on = off;
  // Told it all, and back within earshot: off she goes again.
  if (!kik.line && chatty()) sayNext();
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
      if (inEarshot(pose.c, pose.r)) { kik.queue = [kik.rules.spat(kik.pool.backOut)]; sayNext(); }
    }
  }
  // Each whirl churns the water as it swings her round.
  for (const e of events) if (e.kind === 'push' && e.whirl) burst(V3(seaX(e.from.c), 0.4, seaZ(e.from.r)), '#e6f3f6', 14, 3);
  // Spat out by the winds: a splash where each hop comes down.
  for (const e of events) if (e.kind === 'push' && !e.whirl && !e.gust && kik.held) burst(V3(seaX(e.to.c), 0.3, seaZ(e.to.r)), '#e6f3f6', 18, 4);
}

/* The penguins: the moment you first get there, and each time after. Their island goes on the map
   (a hidden place found), the one in the balaclava freezes, caught in the act, and drops his sack. */
function penguinMoment() {
  const first = !(G.found ?? []).includes('vegas');
  G.found = addFind(G.found, 'vegas');
  toast(OF_HIM.penguins);
  kik.moment = { t: 0, said: false };
  if (first) setTimeout(() => kikkitEnding(), 0);
}
function sneakTick(W, dt, t) {
  const o = W.sneak, u = o.userData, M = kik.moment;
  if (M) {
    M.t += dt;
    // Caught! He freezes, looks round at her, and his sack drops.
    const k = Math.min(1, M.t * 3);
    u.head.rotation.y = -1.2 * k;
    u.flips.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * 1.3 * k; });
    if (u.sack) u.sack.position.y = Math.max(0.15, 0.75 - Math.max(0, M.t - 0.6) * 3);
    if (M.t > 1.4 && !M.said) { M.said = true; toast(OF_HIM.balaclava); }
    if (M.t > 6) { kik.moment = null; if (u.sack) u.sack.position.y = 0.75; }
    return;
  }
  // Up to something: tiptoeing to and fro across the island, eyes darting, sack over his shoulder.
  const x = Math.sin(t * 0.35);
  o.position.x = seaX(15.3) + x * 1.2;
  o.rotation.y = Math.cos(t * 0.35) > 0 ? Math.PI / 2 : -Math.PI / 2;
  o.position.y = FLOE + Math.abs(Math.sin(t * 6)) * 0.06;
  u.head.rotation.y = Math.sin(t * 2.3) * 0.7;
  for (const e of u.eyes) e.position.x = Math.sign(e.position.x) * 0.045 + Math.sin(t * 3.1) * 0.02;
}

/** A fresh voyage: she's never met you, nothing's had you. (What you've found stays found.) */
export function kikkitReset() {
  kik.rules = new Kikkit(); kik.pool = new Whirlpools();
  kik.queue = []; kik.line = null; kik.on = false; kik.held = null; kik.moment = null;
  said.clear();
  if (kik.W) kik.W.say.style.display = 'none';
}

/** Starting points (menus.js): at sea off her island, or at the whirlpools' mouth. */
export function kikkitCheat(where) {
  const h = sail.helm;
  h.moor(where === 'mouth' ? { ...K.MOUTH } : { c: K.MOUTH.c, r: K.LANDING.r0, d: 0 });
  sail.riding = false;
}
export { PENGUINS };
