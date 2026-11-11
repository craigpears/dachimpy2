// Port Decorum, the island under imperial control, out past the checkpoint where the main shipping lane
// leads (src/den-imperial.ts; its squares LAY.EMPIRE in src/den-sail.ts). Sketched, to sail up to and
// look at, nothing to do there yet (the user, 11 Nov: "even if it's just an empty island or something
// where you can't interact yet ... under imperial control"): the trading, looting and smuggling come
// later. Only the place's own look is here, in the Empire's stone, crimson and gold (empire.js, as the
// checkpoint's): sand and grass, a stone quay along its near shore and a jetty out from it toward the
// gate (where trading will happen), a customs house at the jetty's foot, a market and a warehouse along
// the quay, a fort at the back, its keep flying the Empire's flag, a watchtower; and its guards, from
// config (src/den-imperial.ts, EMPIRE_CAST), placed through the shared pieces (props-people.js's
// person(), in the Empire's uniform from the wardrobe). Built cheaply: boxes, a few shared materials.
// Touches the rest only through a few hooks: sailing.js builds, ticks and asks it (the prompt), sea.js's
// voices (whom you hear), and a starting point (menus.js).
import * as THREE from 'three';
import { LAY } from '../den-sail.js';
import { EMPIRE, EMPIRE_CAST, EMPIRE_SAYS, EMPIRE_STANDS, EMPIRE_OFF, UNIFORM, Sighting, onEmpireLanding, inEmpireEarshot, empireShore } from '../den-imperial.js';
import { SIGHTED } from '../lines/imperial-guards.js';
import { cleanLook } from '../den-look.js';
import { readSecs } from '../den-dignity.js';
import { scene, mat, mesh, canvasTex, woodTex, flagpole, toast } from './world.js';
import { sail, seaX, seaZ, voices } from './sea.js';
import { outline, slab } from './isle.js';
import { palm } from './wedding-scene.js';
import { person } from './props-people.js';
import { cine } from './cine.js';
import { CRIMSON, GOLD, stone, flagMatImperial, banner, tower } from './empire.js';

/* Its ground: a sand slab's top (isle.js's slab tops out at y0 + its height + its bevel's 0.25), as on
   Tzz's and Kikkit's islands, so everyone stands on it. A square is SQ metres. */
const SAND = { y0: -0.4, h: 0.62 }, GROUND = SAND.y0 + SAND.h + 0.25, SQ = 4;
export const empire = { W: null, sight: new Sighting() };

// The town's materials, shared by every building (cheap to draw).
const M = {
  plaster: mat('#e8dfc8', { roughness: 0.95 }), tile: mat('#a5532e', { roughness: 0.9, flatShading: true }), slate: mat('#4d5360', { roughness: 0.8, flatShading: true }),
  timber: mat('#5b3a20', { map: woodTex }), plank: mat('#9a7a55', { map: woodTex }), dark: mat('#2a211b', { roughness: 1 }),
  crimson: mat(CRIMSON, { roughness: 0.8 }), gold: mat(GOLD, { metalness: 0.6, roughness: 0.35 }), iron: mat('#2b2f34', { metalness: 0.6, roughness: 0.5 }),
  crate: mat('#8a6a44', { map: woodTex }),
};
let st = null;   // (the Empire's stone: one material for the lot)
const box = (w, h, d, m, x, y, z) => { const o = mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
/** A gable roof: a ridge along x, w across, d deep, h high, its eaves at y. */
function roof(w, d, h, m, y) {
  const s = new THREE.Shape([new THREE.Vector2(-d / 2 - 0.2, 0), new THREE.Vector2(d / 2 + 0.2, 0), new THREE.Vector2(0, h)]);
  const geo = new THREE.ExtrudeGeometry(s, { depth: w + 0.3, bevelEnabled: false });
  geo.translate(0, 0, -(w + 0.3) / 2);
  geo.rotateY(Math.PI / 2);
  const o = mesh(geo, m);
  o.position.y = y;
  return o;
}
/** Merlons along a wall's top, from (x0, z0) to (x1, z1) at height y. */
function merlons(g, x0, z0, x1, z1, y) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1)), along = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  for (let i = 0; i <= n; i += 2) g.add(box(along ? 0.5 : 0.45, 0.5, along ? 0.45 : 0.5, st, x0 + (x1 - x0) * i / n, y + 0.25, z0 + (z1 - z0) * i / n));
}
/** A flag of the Empire's on a pole, `s` times the den's size, at (x, y, z). */
function flag(g, x, y, z, s = 1, h = 2) {
  const f = flagpole(h, flagMatImperial());
  f.scale.setScalar(s);
  f.position.set(x, y, z);
  g.add(f);
  return f;
}

// ---------- its buildings, each from the den side (its front toward +z) ----------
const BUILD = {
  /** The fort: a stone curtain wall round a square, a tower at each corner, its gate in the front, a keep
      in the middle flying the Empire's flag, banners either side of the gate, guns on the front wall. */
  fort({ w, d }) {
    const g = new THREE.Group(), W = w * SQ, D = d * SQ, H = 3.2, T = 0.7;
    // (the front wall in two, either side of the gate)
    const gate = 2.2, side = (W - gate) / 2;
    for (const s of [-1, 1]) {
      g.add(box(side, H, T, st, s * (gate / 2 + side / 2), H / 2, D / 2));
      merlons(g, s * gate / 2, D / 2, s * W / 2, D / 2, H);
      const b = banner(0.8, 2); b.position.set(s * (gate / 2 + 0.7), H - 1.2, D / 2 + T / 2 + 0.03); g.add(b);
      // a gun on the wall's top, run out toward the sea
      const gun = mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.3, 10), M.iron); gun.rotation.x = Math.PI / 2; gun.position.set(s * (W / 2 - 1.4), H + 0.4, D / 2 + 0.35); g.add(gun);
    }
    g.add(box(gate + 0.4, 0.9, T + 0.1, st, 0, H - 0.45, D / 2));   // (the lintel over the gate)
    g.add(box(gate, H - 0.9, 0.12, M.timber, 0, (H - 0.9) / 2, D / 2 - 0.1));   // (its gates, shut)
    g.add(box(W, H, T, st, 0, H / 2, -D / 2));
    for (const s of [-1, 1]) g.add(box(T, H, D, st, s * W / 2, H / 2, 0));
    merlons(g, -W / 2, -D / 2, W / 2, -D / 2, H);
    for (const s of [-1, 1]) merlons(g, s * W / 2, -D / 2, s * W / 2, D / 2, H);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const t = tower(1.9, 4.4); t.position.set(sx * W / 2, 0, sz * D / 2); g.add(t); }
    // The keep: taller, the Empire's flag over it.
    const keep = tower(3, 6.2); keep.position.set(0, 0, -0.4); g.add(keep);
    flag(g, 0, 6.8, -0.4, 1.8, 3);
    const b = banner(1.1, 2.8); b.position.set(0, 3.6, 1.12); g.add(b);
    return g;
  },
  /** A watchtower, its flag on top, a banner down its face. */
  watchtower() {
    const g = new THREE.Group(), t = tower(1.8, 5.2);
    g.add(t);
    flag(g, 0, 5.75, 0, 1.2, 2.2);
    const b = banner(0.8, 2.2); b.position.set(0, 3.4, 0.93); g.add(b);
    return g;
  },
  /** The customs house: stone, a portico of columns along its front under a pediment, steps up to its
      crimson door, a slate roof, the Empire's flag over it. */
  customs({ w, d }) {
    const g = new THREE.Group(), W = w * SQ, D = d * SQ, H = 2.6;
    g.add(box(W, H, D, st, 0, H / 2, 0));
    g.add(roof(W, D, 1.1, M.slate, H));
    // the portico: columns on a step, a beam and the pediment's gable on them
    g.add(box(W, 0.25, 1.3, st, 0, 0.12, D / 2 + 0.6));
    for (let i = 0; i < 4; i++) { const c = mesh(new THREE.CylinderGeometry(0.14, 0.17, H - 0.3, 10), st); c.position.set(-W / 2 + 0.45 + i * (W - 0.9) / 3, 0.25 + (H - 0.3) / 2, D / 2 + 1.05); g.add(c); }
    g.add(box(W + 0.1, 0.35, 1.4, st, 0, H + 0.1, D / 2 + 0.6));
    const ped = roof(1.35, W + 0.1, 0.7, st, H + 0.27); ped.rotation.y = Math.PI / 2; ped.position.z = D / 2 + 0.62; g.add(ped);
    g.add(box(0.9, 1.6, 0.06, M.crimson, 0, 1.05, D / 2 + 0.03));
    g.add(box(W - 0.3, 0.12, 0.06, M.gold, 0, H - 0.15, D / 2 + 1.36));   // (a gilt band along its beam)
    flag(g, W / 2 - 0.4, H + 0.4, -D / 4, 1, 1.8);
    return g;
  },
  /** The market (the trading house): plaster on a timber frame, a tiled roof, a striped awning in the
      Empire's colours over its open front, stalls of goods under it. */
  market({ w, d }) {
    const g = new THREE.Group(), W = w * SQ, D = d * SQ, H = 2.4;
    g.add(box(W, H, 0.2, M.plaster, 0, H / 2, -D / 2));
    for (const s of [-1, 1]) g.add(box(0.2, H, D, M.plaster, s * W / 2, H / 2, 0));
    for (const s of [-1, 1]) g.add(box(0.22, H, 0.22, M.timber, s * W / 2, H / 2, D / 2));
    g.add(box(W + 0.2, 0.22, 0.22, M.timber, 0, H, D / 2));
    g.add(roof(W, D, 1.2, M.tile, H));
    const stripes = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: canvasTex(64, 8, (x, cw, ch) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? GOLD : CRIMSON; x.fillRect(i * cw / 8, 0, cw / 8, ch); } }) });
    const aw = mesh(new THREE.PlaneGeometry(W + 0.4, 1.5), stripes, false);
    aw.rotation.x = -Math.PI / 2 + 0.45; aw.position.set(0, H - 0.3, D / 2 + 0.68); g.add(aw);
    // stalls: a table each, a few goods on it in bright dyes
    const goods = ['#d7a43a', '#7b9a3a', '#b8452e', '#e9e1cf', '#5a7fb5'].map((c) => mat(c));
    for (const s of [-1, 1]) {
      g.add(box(1.3, 0.8, 0.7, M.timber, s * W / 4, 0.4, D / 2 - 0.3));
      for (let i = 0; i < 3; i++) g.add(box(0.28, 0.24, 0.28, goods[(i + (s > 0 ? 2 : 0)) % goods.length], s * W / 4 + (i - 1) * 0.36, 0.92, D / 2 - 0.3));
    }
    return g;
  },
  /** The warehouse: long and plain, dark timber on a stone footing, big double doors, a tiled roof. */
  warehouse({ w, d }) {
    const g = new THREE.Group(), W = w * SQ, D = d * SQ, H = 2.8;
    g.add(box(W + 0.15, 0.5, D + 0.15, st, 0, 0.25, 0));
    g.add(box(W, H - 0.5, D, M.timber, 0, 0.5 + (H - 0.5) / 2, 0));
    const r = roof(D, W, 1.2, M.tile, H); r.rotation.y = Math.PI / 2; g.add(r);
    g.add(box(1.8, 2, 0.06, M.dark, 0, 1.2, D / 2 + 0.03));
    g.add(box(0.08, 2, 0.08, M.plank, 0, 1.2, D / 2 + 0.07));
    for (const s of [-1, 1]) g.add(box(0.06, 1.3, 1.6, M.dark, s * (W / 2 + 0.03), 1.4, -D / 6));
    return g;
  },
};

function build() {
  st = stone();
  const g = new THREE.Group(), C = EMPIRE_CAST;
  const sand = mat('#e6cf96', { roughness: 1 }), wet = mat('#c9ad78', { roughness: 1 }), grass = mat('#6f9a4a', { roughness: 1 });
  const shore = empireShore();
  g.add(slab(outline(0.5, shore), -0.55, 0.45, wet), slab(outline(1.1, shore), SAND.y0, SAND.h, sand));
  // Grass over its back, where the fort stands.
  const back = outline(3.4, shore).map((p) => p.clone().add(new THREE.Vector3(0, 0, -1.4)));
  g.add(slab(back, SAND.y0 + 0.05, SAND.h, grass));
  // The quay: a stone wall along its near shore, its top level with the sand, bollards along its face.
  const Q = C.quay, x0 = seaX(Q.c0), x1 = seaX(Q.c1), qz = seaZ(Q.r), QD = 2.4;
  g.add(box(x1 - x0, 1.55, QD, st, (x0 + x1) / 2, GROUND + 0.12 - 0.775, qz - QD / 2));   // (its top a step above the sand)
  for (let x = x0 + 1.4; x < x1 - 0.5; x += 3.2) { const b = mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.42, 10), M.iron); b.position.set(x, GROUND + 0.33, qz - 0.3); g.add(b); }
  // The jetty: out from the quay toward the gate, planked, on piles, the Empire's flag at its end.
  const [jc, jr] = LAY.EMPIRE.JETTY, jx = seaX(jc), jz0 = qz - 0.1, jz1 = seaZ(jr - 0.45), DECK = GROUND + 0.05, JW = 1.6;
  for (let z = jz0; z < jz1; z += 0.34) g.add(box(JW, 0.07, 0.3, M.plank, jx, DECK, z + 0.17));
  for (const s of [-1, 1]) for (let z = jz0 + 0.8; z <= jz1; z += 1.25) { const p = mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.6, 7), M.timber); p.position.set(jx + s * (JW / 2 - 0.05), DECK - 0.7, z); g.add(p); }
  const post = box(0.2, 2.2, 0.2, M.timber, jx + JW / 2 - 0.1, DECK + 1.1, jz1 - 0.2); g.add(post);
  flag(g, post.position.x, DECK + 2.2, post.position.z, 1, 1.4);
  // The town and its fort.
  for (const o of C.town) {
    const b = BUILD[o.kind](o);
    b.position.set(seaX(o.at[0]), GROUND - 0.02, seaZ(o.at[1]));
    g.add(b);
  }
  // Cargo on the quay: crates and barrels.
  C.cargo.forEach(([c, r], i) => {
    const x = seaX(c), z = seaZ(r);
    if (i % 2) { const b = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 10), M.timber); b.position.set(x, GROUND + 0.4, z); g.add(b); }
    else { const k = box(0.75, 0.75, 0.75, M.crate, x, GROUND + 0.37, z); k.rotation.y = i * 0.7; g.add(k); if (i === 0) g.add(box(0.6, 0.6, 0.6, M.crate, x + 0.1, GROUND + 1.05, z - 0.05)); }
  });
  for (const [c, r] of C.palms) { const p = palm(4, 0.25); p.scale.setScalar(0.75); p.position.set(seaX(c), 0.2, seaZ(r)); p.rotation.y = c * 2.3 + r; g.add(p); }
  // Its guards, in the Empire's uniform; the one on the jetty's end does the talking.
  const ship = () => (sail.on ? sail.helm.pose : null);
  const guards = C.guards.map((o) => person({
    look: cleanLook({ ...UNIFORM, ...o.face }), parent: g, x: seaX(o.at[0]), y: o.talks ? GROUND + 0.09 : GROUND, z: seaZ(o.at[1]), yaw: o.yaw, idle: o.idle,   // (the one who talks, on the jetty's planks)
    ...(o.talks ? {
      script: EMPIRE_SAYS, secs: readSecs, gap: [3, 6], wait: 0.6, bubble: 'page', shown: () => sail.on,
      earshot: () => { const s = ship(); return !!s && inEmpireEarshot(s.c, s.r) && voices.hears('empire', s.c, s.r); },
      face: () => { const s = ship(); return s && inEmpireEarshot(s.c, s.r) ? { x: seaX(s.c), z: seaZ(s.r) } : null; },
    } : {}),
  }));
  voices.add('empire', { c: EMPIRE_STANDS.c, r: EMPIRE_STANDS.r, earshot: EMPIRE.EARSHOT });
  scene.add(g);
  return { g, guards };
}

/** Built the first time the sea's drawn (sailing.js), seen from afar too. */
export function empireWorld() { empire.W ||= build(); }

/** Each tick at sea (sailing.js): the first time on a voyage you come up off it, whose it is. */
export function empireTick(dt) {
  const W = empire.W;
  if (!W) return;
  if (sail.on) {
    const p = sail.helm.pose;
    if (empire.sight.arrive(onEmpireLanding(p.c, p.r), !cine)) toast(SIGHTED);
  }
  for (const gd of W.guards) gd.tick(dt);
}

/** What's said at the foot of the screen while she lies off it, settled. */
export function empirePrompt() {
  if (!sail.on || !empire.W) return '';
  const h = sail.helm, p = h.pose;
  if (!onEmpireLanding(p.c, p.r) || h.slot >= 0 || h.held()) return '';
  return `Off ${EMPIRE.NAME}, under imperial control · click the sea to drop a pin`;
}

/** A fresh voyage: whose it is to be said again, and the jetty guard to halt you again. */
export function empireReset() {
  empire.sight = new Sighting();
  for (const gd of empire.W?.guards ?? []) if (gd.chatter?.script?.intro) gd.restart();
}

/** A starting point (menus.js): at sea, just off its jetty, bows to the island. */
export function empireCheat() {
  sail.helm.moor(EMPIRE_OFF);
  sail.riding = false;
}
