// Kikkit's island at the reef's near end, her familiars about her, her whirlpools through the reef,
// and Vegas Island beyond them, the penguins' (src/den-kikkit.ts; the squares LAY.KIKKIT in
// src/den-sail.ts; her lines src/lines/kikkit.ts, the penguin's src/lines/penguin.ts). Touches the
// rest only through a few hooks: sailing.js builds, ticks and asks it (where she's drawn, Space, the
// prompt, whether the rigging's busy), the Sailing board's easy one in her waters (sail-station.js),
// what's found (G.found) and the checkpoint's word on which way she crossed.
import * as THREE from 'three';
import { SAIL, LAY } from '../den-sail.js';
import { KIKKIT, Kikkit, Whirlpools, caught, onKikkitLanding, inKikkitWaters, kikkitShore, spatPose, PENGUINS } from '../den-kikkit.js';
import { shoreOf } from '../den-isle.js';
import { readSecs } from '../den-dignity.js';
import { addFind } from '../den-finds.js';
import { OF_HIM } from '../lines/penguin.js';
import { PIRATES, familiar, familiarTick } from '../den-look.js';
import { scene, mat, mesh, canvasTex, makePirate, G, keys, toast, burst, V3 } from './world.js';
import { sail, seaX, seaZ } from './sea.js';
import { outline, slab } from './isle.js';
import { palm } from './wedding-scene.js';
import { bubble, bubbleAt } from './cine.js';
import { cp } from './checkpoint.js';
import { stationBoard } from './sail-station.js';

const K = LAY.KIKKIT, CELL = SAIL.CELL;
const SC = 1.15;   // (a touch big, so she reads from the sea, as Dignity)
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
function whirlpool(big, spin) {
  const m = new THREE.MeshBasicMaterial({ map: swirlTex(big), transparent: true, depthWrite: false });
  const o = mesh(new THREE.CircleGeometry(CELL * (big ? 0.62 : 0.5), 40), m, false);
  o.rotation.x = -Math.PI / 2;
  o.renderOrder = 2;
  o.userData.speed = (big ? 2.4 : 3.2) * (spin < 0 ? -1 : 1);   // (anticlockwise for lefts, seen from above)
  return o;
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
  g.add(slab(outline(0.5, shore), -0.55, 0.45, wet), slab(outline(1.1, shore), -0.4, 0.62, sand), slab(outline(3, shore), -0.25, 0.5, grass));
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
  const at = V3(seaX(18.35), 0.25, seaZ(17.35));
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
    o.g.position.set(seaX(f.at[0]), 0.25, seaZ(f.at[1]));
    o.g.rotation.y = -0.6 + i * 0.7;
    g.add(o.g);
    return { o, ...f, ph: i * 1.3, y0: 0.25 };
  });
  // The whirlpools, on the water: the little one in the reef, the big ones beyond.
  const pools = K.PASSAGE.filter(([, , , kind]) => kind === 'small' || kind === 'big').map(([c, r, spin, kind]) => {
    const o = whirlpool(kind === 'big', spin);
    o.position.set(seaX(c), 0.06, seaZ(r));
    g.add(o);
    return o;
  });
  // Vegas Island: a little island in the middle of the big ones, and its penguins.
  const vs = shoreOf(K.VEGAS);
  g.add(slab(outline(0.4, vs), -0.5, 0.4, mat('#e9ecef', { roughness: 0.9 })), slab(outline(1, vs), -0.35, 0.55, mat('#f6f8fa', { roughness: 0.8 })));
  const flock = [[15.2, 22.3], [15.6, 22.8], [15.1, 23.3], [16.2, 23.4], [15.7, 23.6]].map(([c, r], i) => {
    const o = penguin();
    o.position.set(seaX(c), 0.25, seaZ(r));
    o.rotation.y = i * 1.7;
    o.scale.setScalar(1.6);
    g.add(o);
    return o;
  });
  const sneak = penguin(true);
  sneak.scale.setScalar(1.6);
  sneak.position.set(seaX(15.5), 0.25, seaZ(22.05));
  g.add(sneak);
  const say = bubble('', document.body, 'wrap');   // (on the page: at sea the den's labels are hidden)
  scene.add(g);
  return { g, p, at, fams, pools, flock, sneak, say, yaw: 0 };
}

/** Built the first time the sea's drawn (sailing.js), seen from afar too. */
export function kikkitWorld() { kik.W ||= build(); }

// ---------- what she says ----------
function sayNext() {
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
  if (kik.held) return 'Round and round in the whirlpool...';
  if (!canHail()) return '';
  return kik.line ? 'Off Kikkit\'s island · Space: and then?' : 'Off Kikkit\'s island · Space: hail her · R: the rigging (Sailing)';
}
/** A whirlpool has her: the rigging's put away meanwhile (sailing.js). */
export const kikkitHolds = () => !!kik.held;

/** The ending's hook (left for later, 11 Nov: Kikkit moves to Vegas Island, and her familiars swim
    after your ship to follow her). Called once she's first reached the penguins, after their
    moment. Nothing yet. */
export function kikkitEnding() { /* (to come) */ }

// ---------- how she's drawn while a whirlpool has her, or a gust carries her over one ----------
/* sailing.js draws her where the helm has her (Helm.now), through this: in a whirlpool's grip she
   spins round and round on it (too many lefts), then she's flung back to Kikkit's island in a long
   hop; carried over a little whirlpool by a gust she's swung round as it turns her; over a big one
   that's a backflip, end over end ("Did a double backflip. Well, that's what I get"). Returns the
   pose, perhaps with a lift (`hop`) and a flip (`flip`, radians end over end). */
export function kikkitShown(p) {
  const h = sail.helm, H = kik.held;
  if (H) {
    if (H.phase === 'spin') { const u = H.t / KIKKIT.SPIN; return { ...p, c: H.at[0], r: H.at[1], a: H.a0 - u * u * 10, hop: -0.25 * Math.sin(u * Math.PI) }; }
    const u = Math.min(1, H.t / KIKKIT.FLING), S = spatPose();
    return { ...p, c: H.at[0] + (S.c - H.at[0]) * u, r: H.at[1] + (S.r - H.at[1]) * u, a: H.a0 - 10 - u * 6, hop: Math.sin(u * Math.PI) * 6 };
  }
  const cur = h.cur, w = cur && cur.m === 'W' ? h.sea.whirlAt(cur.to.c, cur.to.r) : null;
  if (!w) return p;
  const u = Math.min(1, h.t / SAIL.PUSH), e = u * u * (3 - 2 * u);
  if (w.big && Math.abs(w.spin) === 4) return { ...p, flip: e * Math.PI * 2, hop: Math.sin(e * Math.PI) * 1.4 };
  return { ...p, a: cur.from.d - w.spin * e };
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
  for (const f of W.fams) {
    familiarTick(f.o, dt);
    if (f.fly) f.o.g.position.set(seaX(f.at[0]) + Math.cos(t * 1.3 + f.ph) * 1.6, 2.4 + Math.sin(t * 2.1) * 0.5, seaZ(f.at[1]) + Math.sin(t * 1.3 + f.ph) * 1.6);
    else if (f.hop) f.o.g.position.y = f.y0 + Math.max(0, Math.sin(t * 3 * f.hop + f.ph)) * 0.35;
  }
  for (const o of W.flock) { const u = o.userData; u.head.rotation.y = Math.sin(t * 0.8 + u.ph) * 0.5; u.flips.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * (0.15 + Math.max(0, Math.sin(t * 2 + u.ph)) * 0.3); }); o.position.y = 0.25 + Math.abs(Math.sin(t * 3 + u.ph)) * 0.04; }
  sneakTick(W, dt, t);
  if (sail.on) atSea(dt, events);
  // Kikkit: facing you when you're about, swigging from her jug now and then, swaying (a bit drunk).
  const s = sail.on ? sail.helm.pose : null, near = s && Math.hypot(s.c - 18.3, s.r - 17.3) < 8;
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
  // Through the reef, and to the penguins (src/den-kikkit.ts).
  for (const e of kik.pool.watch(events, pose)) {
    if (e === 'through') { G.found = addFind(G.found, 'whirlpools'); onceToast('through', OF_HIM.through); }
    if (e === 'penguins') penguinMoment();
  }
  // A whirlpool has her (she came to rest on one, or sailed into one): round and round, then back.
  const H = kik.held;
  if (!H) {
    const at = caught(h, events);
    if (at) {
      kik.held = { at, t: 0, phase: 'spin', a0: h.now().a, out: pose.r > LAY.CHECKPOINT.ROW };
      h.moor({ ...pose });   // (everything she was doing let go)
      keys.clear();
    }
    return;
  }
  H.t += dt;
  if (H.phase === 'spin' && H.t >= KIKKIT.SPIN) {
    H.phase = 'fling'; H.t = 0;
    burst(V3(seaX(H.at[0]), 0.4, seaZ(H.at[1])), '#e6f3f6', 24, 5);
  } else if (H.phase === 'fling' && H.t >= KIKKIT.FLING) {
    const S = spatPose();
    h.moor(S);
    cp.check?.whirled();   // (back across the reef by them, if she was out: the checkpoint's word on it)
    burst(V3(seaX(S.c), 0.3, seaZ(S.r)), '#e6f3f6', 20, 4);
    kik.held = null;
    toast('Too many lefts! Spun round and round, and spat all the way back to Kikkit\'s island');
    kik.queue = [kik.rules.spat(H.out)];
    sayNext();
  }
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
  o.position.x = seaX(15.5) + x * 1.2;
  o.rotation.y = Math.cos(t * 0.35) > 0 ? Math.PI / 2 : -Math.PI / 2;
  o.position.y = 0.25 + Math.abs(Math.sin(t * 6)) * 0.06;
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
