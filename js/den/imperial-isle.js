// Port Decorum, the island under imperial control, out past the checkpoint where the main shipping lane
// leads (src/den-imperial.ts; its squares LAY.EMPIRE in src/den-sail.ts). Sketched, to sail up to and
// look at, nothing to do there yet (the user, 11 Nov: "even if it's just an empty island or something
// where you can't interact yet ... under imperial control"): the trading, looting and smuggling come
// later. Only the place's own look is here, in the Empire's stone, crimson and gold (empire.js, as the
// checkpoint's): sand and grass, a stone quay along its near shore and a jetty out from it toward the
// gate (where trading will happen), a customs house at the jetty's foot, a market and a warehouse along
// the quay, a fort at the back, its keep flying the Empire's flag, a watchtower; and its guards, from
// config (src/den-imperial.ts, EMPIRE_CAST), placed through the shared pieces (props-people.js's
// person(), in the Empire's uniform from the wardrobe). Built to scale with the sloop (FORT, below),
// and cheaply: boxes, a few shared materials, baked into a mesh a material (bake.js).
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
import { PACE } from '../chatter.js';
import { cine } from './cine.js';
import { CRIMSON, GOLD, stone, flagMatImperial, banner, tower } from './empire.js';
import { gunMesh } from './gun.js';
import { bake } from './bake.js';

/* Its ground: a sand slab's top (isle.js's slab tops out at y0 + its height + its bevel's 0.25), as on
   Tzz's and Kikkit's islands, so everyone stands on it. A square is SQ metres. */
const SAND = { y0: -0.4, h: 0.62 }, GROUND = SAND.y0 + SAND.h + 0.25, SQ = 4;
export const empire = { W: null, sight: new Sighting() };

// The town's materials, shared by every building (cheap to draw).
const M = {
  plaster: mat('#e8dfc8', { roughness: 0.95 }), tile: mat('#a5532e', { roughness: 0.9, flatShading: true }), slate: mat('#4d5360', { roughness: 0.8, flatShading: true }),
  timber: mat('#5b3a20', { map: woodTex }), plank: mat('#9a7a55', { map: woodTex }), dark: mat('#2a211b', { roughness: 1 }),
  crimson: mat(CRIMSON, { roughness: 0.8 }), gold: mat(GOLD, { metalness: 0.6, roughness: 0.35 }), iron: mat('#2b2f34', { metalness: 0.6, roughness: 0.5 }),
  crate: mat('#8a6a44', { map: woodTex }), sill: mat('#c9bfa8', { roughness: 0.9 }),
};
let st = null;   // (the Empire's stone: one material for the lot)
const box = (w, h, d, m, x, y, z) => { const o = mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
/** A gable roof: a ridge along x, w across, d deep, h high, its eaves at y. */
function roof(w, d, h, m, y) {
  const s = new THREE.Shape([new THREE.Vector2(-d / 2 - 0.3, 0), new THREE.Vector2(d / 2 + 0.3, 0), new THREE.Vector2(0, h)]);
  const geo = new THREE.ExtrudeGeometry(s, { depth: w + 0.4, bevelEnabled: false });
  geo.translate(0, 0, -(w + 0.4) / 2);
  geo.rotateY(Math.PI / 2);
  const o = mesh(geo, m);
  o.position.y = y;
  return o;
}
/** Merlons along a wall's top, from (x0, z0) to (x1, z1) at height y, each `m` across, a gap between. */
function merlons(g, x0, z0, x1, z1, y, m = 0.9) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / m)), along = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  for (let i = 0; i <= n; i += 2) g.add(box(along ? m : m * 0.9, m * 1.1, along ? m * 0.9 : m, st, x0 + (x1 - x0) * i / n, y + m * 0.55, z0 + (z1 - z0) * i / n));
}
/** A flag of the Empire's on a pole, `s` times the den's size, at (x, y, z); left out of the bake, to wave. */
function flag(g, x, y, z, s = 1, h = 2) {
  const f = flagpole(h, flagMatImperial());
  f.scale.setScalar(s);
  f.position.set(x, y, z);
  f.userData.live = true;
  g.add(f);
  return f;
}
/** A row of `n` windows across a wall `w` wide whose face is at z (its front: +z), centred at height y. */
function windows(g, w, n, y, z, ww = 0.8, wh = 1.1) {
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + w * (i + 0.5) / n;
    g.add(box(ww, wh, 0.06, M.dark, x, y, z + 0.03), box(ww + 0.2, 0.12, 0.14, M.sill, x, y - wh / 2 - 0.04, z + 0.06));
  }
}

/* Its size, against the sloop's (the user, 11 Nov: "just looking at port decorum size relative to the
   sloop. Isn't the wall for it going to tower over that? ... we've clearly got a scale problem here").
   She's 4.4 m long, her deck 0.75 m up, her masthead about 5 m; a sea square is 4 m. So the fort's
   curtain walls stand 7.5 m, well over her mast, its corner towers 10.5 m, its keep 13.5 m, the
   tallest thing on the sea, its flag above that; the watchtower 10 m; the town proper two-storey
   buildings, 5 m to their eaves, their doors still pirate-sized. (The checkpoint's arch is 6.4 m, its
   towers 8 m.) Until then, 11 Nov, it was a model village beside her: walls of 3.2 m, a keep of 6.2. */
const FORT = { H: 7.5, T: 1.4, GATE: 3.2, GATE_H: 4.6, TOWER: [3.4, 10.5], KEEP: [5.2, 13.5] }, EAVES = 5, STOREY = 2.6;

// ---------- its buildings, each from the den side (its front toward +z) ----------
const BUILD = {
  /** The fort: a stone curtain wall round a square, a tower at each corner, its gate in the front, a keep
      in the middle flying the Empire's flag, banners either side of the gate, guns on the front wall. */
  fort({ w, d }) {
    const g = new THREE.Group(), W = w * SQ, D = d * SQ, { H, T, GATE, GATE_H } = FORT, band = M.crimson;
    // (the front wall in two, either side of the gate)
    const side = (W - GATE) / 2;
    for (const s of [-1, 1]) {
      g.add(box(side, H, T, st, s * (GATE / 2 + side / 2), H / 2, D / 2));
      merlons(g, s * GATE / 2, D / 2, s * W / 2, D / 2, H);
      const b = banner(1.5, 4.2); b.position.set(s * (GATE / 2 + 1.3), H - 2.6, D / 2 + T / 2 + 0.03); g.add(b);
      // a gun on the wall's top, run out toward the sea: Gunnery's, as on the checkpoint's bastions
      const gun = gunMesh(); gun.scale.setScalar(0.9); gun.rotation.y = Math.PI; gun.position.set(s * (W / 2 - 3.2), H, D / 2 + 0.1); g.add(gun);
    }
    g.add(box(GATE + 0.8, H - GATE_H, T + 0.2, st, 0, GATE_H + (H - GATE_H) / 2, D / 2));   // (the lintel over the gate)
    g.add(box(GATE + 0.8, 0.4, T + 0.3, band, 0, GATE_H + 0.2, D / 2));   // (a crimson band along it)
    g.add(box(GATE, GATE_H, 0.15, M.timber, 0, GATE_H / 2, D / 2 - 0.2));   // (its gates, shut)
    g.add(box(W, H, T, st, 0, H / 2, -D / 2));
    for (const s of [-1, 1]) g.add(box(T, H, D, st, s * W / 2, H / 2, 0));
    merlons(g, -W / 2, -D / 2, W / 2, -D / 2, H);
    for (const s of [-1, 1]) merlons(g, s * W / 2, -D / 2, s * W / 2, D / 2, H);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const t = tower(...FORT.TOWER, { merlon: 0.9, st, band }); t.position.set(sx * W / 2, 0, sz * D / 2); g.add(t); }
    // The keep: the tallest thing on the sea, the Empire's flag over it.
    const [kw, kh] = FORT.KEEP, kz = -0.8;
    const keep = tower(kw, kh, { merlon: 1, st, band }); keep.position.set(0, 0, kz); g.add(keep);
    flag(g, 0, kh, kz, 2.2, 2.2);
    const b = banner(2, 5.6); b.position.set(0, kh - 4.4, kz + kw / 2 + 0.04); g.add(b);
    return g;
  },
  /** A watchtower, its flag on top, a banner down its face. */
  watchtower() {
    const g = new THREE.Group(), tw = 2.6, th = 10;
    g.add(tower(tw, th, { merlon: 0.7, st, band: M.crimson }));
    flag(g, 0, th, 0, 1.8, 2.4);
    const b = banner(1.2, 3.6); b.position.set(0, th - 3.2, tw / 2 + 0.03); g.add(b);
    return g;
  },
  /** The customs house: stone, two storeys, a portico of columns the height of both along its front
      under a pediment, a step up to its crimson door, a slate roof, the Empire's flag over it. */
  customs({ w, d }) {
    const g = new THREE.Group(), W = w * SQ, D = d * SQ, H = EAVES, P = 1.5;
    g.add(box(W, H, D, st, 0, H / 2, 0));
    g.add(box(W + 0.1, 0.25, D + 0.1, st, 0, STOREY, 0));   // (a string course between its storeys)
    windows(g, W, 3, STOREY + 1.2, D / 2, 0.7, 1.2);
    g.add(roof(W, D, 1.8, M.slate, H));
    // the portico: columns on a step, a beam and the pediment's gable on them
    g.add(box(W, 0.3, P + 0.3, st, 0, 0.15, D / 2 + P / 2));
    for (let i = 0; i < 4; i++) { const c = mesh(new THREE.CylinderGeometry(0.22, 0.27, H - 0.4, 10), st); c.position.set(-W / 2 + 0.45 + i * (W - 0.9) / 3, 0.3 + (H - 0.4) / 2, D / 2 + P - 0.15); g.add(c); }
    g.add(box(W + 0.1, 0.5, P + 0.2, st, 0, H + 0.1, D / 2 + P / 2));
    const ped = roof(P + 0.1, W + 0.1, 1.1, st, H + 0.35); ped.rotation.y = Math.PI / 2; ped.position.z = D / 2 + P / 2; g.add(ped);
    g.add(box(1, 1.9, 0.06, M.crimson, 0, 0.3 + 0.95, D / 2 + 0.03));   // (its door, pirate-sized)
    g.add(box(W - 0.3, 0.16, 0.06, M.gold, 0, H - 0.08, D / 2 + P + 0.11));   // (a gilt band along its beam)
    flag(g, W / 2 - 0.5, H + 0.6, -D / 4, 1.3, 2);
    return g;
  },
  /** The market (the trading house): plaster on a timber frame, two storeys, a tiled roof, its ground
      floor open along its front under a striped awning in the Empire's colours, stalls of goods there,
      windows above. */
  market({ w, d }) {
    const g = new THREE.Group(), W = w * SQ, D = d * SQ, H = EAVES, S = STOREY;
    g.add(box(W, H, 0.2, M.plaster, 0, H / 2, -D / 2));
    for (const s of [-1, 1]) g.add(box(0.2, H, D, M.plaster, s * W / 2, H / 2, 0));
    g.add(box(W, H - S, 0.2, M.plaster, 0, S + (H - S) / 2, D / 2));   // (its upper storey's front, over the open ground floor)
    for (const s of [-1, 1]) g.add(box(0.26, H, 0.26, M.timber, s * W / 2, H / 2, D / 2 + 0.05));
    for (const y of [S, H]) g.add(box(W + 0.26, 0.24, 0.26, M.timber, 0, y, D / 2 + 0.05));
    g.add(box(0.2, H - S, 0.22, M.timber, 0, S + (H - S) / 2, D / 2 + 0.05));
    windows(g, W, 2, S + 1.2, D / 2 + 0.1, 0.8, 1.1);
    g.add(roof(W, D, 1.9, M.tile, H));
    const stripes = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: canvasTex(64, 8, (x, cw, ch) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? GOLD : CRIMSON; x.fillRect(i * cw / 8, 0, cw / 8, ch); } }) });
    const aw = mesh(new THREE.PlaneGeometry(W + 0.4, 1.6), stripes, false);
    aw.rotation.x = -Math.PI / 2 + 0.45; aw.position.set(0, S - 0.3, D / 2 + 0.72); g.add(aw);
    // stalls: a table each, a few goods on it in bright dyes
    const goods = ['#d7a43a', '#7b9a3a', '#b8452e', '#e9e1cf', '#5a7fb5'].map((c) => mat(c));
    for (const s of [-1, 1]) {
      g.add(box(1.3, 0.8, 0.7, M.timber, s * W / 4, 0.4, D / 2 - 0.3));
      for (let i = 0; i < 3; i++) g.add(box(0.28, 0.24, 0.28, goods[(i + (s > 0 ? 2 : 0)) % goods.length], s * W / 4 + (i - 1) * 0.36, 0.92, D / 2 - 0.3));
    }
    return g;
  },
  /** The warehouse: long and plain, dark timber on a stone footing, two storeys, big double doors and a
      loft door over them under a hoist beam, a tiled roof. */
  warehouse({ w, d }) {
    const g = new THREE.Group(), W = w * SQ, D = d * SQ, H = EAVES + 0.2;
    g.add(box(W + 0.15, 0.6, D + 0.15, st, 0, 0.3, 0));
    g.add(box(W, H - 0.6, D, M.timber, 0, 0.6 + (H - 0.6) / 2, 0));
    const r = roof(D, W, 1.7, M.tile, H); r.rotation.y = Math.PI / 2; g.add(r);
    g.add(box(2, 2.3, 0.06, M.dark, 0, 0.6 + 1.15, D / 2 + 0.03));
    g.add(box(0.08, 2.3, 0.08, M.plank, 0, 0.6 + 1.15, D / 2 + 0.07));
    g.add(box(1.2, 1.4, 0.06, M.dark, 0, STOREY + 1.4, D / 2 + 0.03));   // (the loft door)
    g.add(box(0.16, 0.16, 1.1, M.plank, 0, H - 0.2, D / 2 + 0.5));   // (its hoist beam)
    for (const s of [-1, 1]) for (const y of [1.7, STOREY + 1.4]) g.add(box(0.06, 1.1, 1.6, M.dark, s * (W / 2 + 0.03), y, -D / 6));
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
  // The town and its fort, baked into a mesh a material (bake.js), their flags left to wave.
  const town = new THREE.Group();
  for (const o of C.town) {
    const b = BUILD[o.kind](o);
    b.position.set(seaX(o.at[0]), GROUND - 0.02, seaZ(o.at[1]));
    town.add(b);
  }
  g.add(bake(town));
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
      script: EMPIRE_SAYS, secs: readSecs, gap: PACE.ASIDE,   // (his halt at once, then a grumble now and then: chatter.ts, PACE)
      wait: 0.6, bubble: 'page', shown: () => sail.on,
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
