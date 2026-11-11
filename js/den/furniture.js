/* Furniture: every piece in the houses (and anywhere else that wants one), each a small module of its own
   (the user, 11 Nov: the vampire's coffin is "just a bit of furniture that you can use anywhere", and the
   same goes for portrait frames, the easel, chairs, rugs, candles). Each is a function taking a few
   options and returning `{ g }`, a three.js Group standing on the floor at its origin, facing +z (toward
   you); one that moves has a `tick(dt)` too, and its own controls (the coffin's lid and whoever's in it).
   A house only places them (its rules say where: src/den-gravee.ts's FURNISH). As in Puzzle Pirates,
   where furniture was something you bought and put anywhere in your house (YPPedia, Furniture).

   The pieces: rug, runner, armchair, chair, table, candelabra, sconce, bed, coffin, easel, frame, door,
   and outdoors a still; and the skeleton set and its company (Primates Rule's deck): skeleton,
   skeletonChair, skeletalCannon, gibbet, armour, grandPiano, anchorChair, jar, toolChest. */
import * as THREE from 'three';
import { mat, mesh, woodTex, canvasTex } from './world.js';
import { CANVAS } from '../den-houses.js';
import { bake } from './bake.js';

const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const box = (w, h, d, m, x = 0, y = 0, z = 0) => at(mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z);
const cyl = (r0, r1, h, m, x = 0, y = 0, z = 0, n = 12) => at(mesh(new THREE.CylinderGeometry(r0, r1, h, n), m), x, y, z);
const dark = mat('#4a2c18', { map: woodTex }), mid = mat('#7a4a28', { map: woodTex }), ebony = mat('#241812', { map: woodTex, roughness: 0.6 });
const brass = mat('#c9a13c', { metalness: 0.7, roughness: 0.35 }), gilt = mat('#d9a93a', { metalness: 0.75, roughness: 0.3 });
const wax = mat('#f4efe2', { roughness: 0.6 }), flameM = new THREE.MeshBasicMaterial({ color: '#ffcf4a' }), glowM = new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.35, depthWrite: false });
const cloth = (c) => mat(c, { roughness: 0.95 });
/** A piece turned to face `yaw` (0: toward +z) and put at (x, z), in `parent`. */
export function place(parent, piece, x, z, yaw = 0) { piece.g.position.set(x, 0, z); piece.g.rotation.y = yaw; parent.add(piece.g); return piece; }

// ---------- underfoot ----------
const rugTex = (col, w, h) => canvasTex(256, Math.round(256 * h / w), (g, W, H) => {
  g.fillStyle = col; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255, 220, 150, .55)'; g.lineWidth = 6; g.strokeRect(12, 12, W - 24, H - 24);
  g.strokeStyle = 'rgba(0, 0, 0, .3)'; g.lineWidth = 3; g.strokeRect(24, 24, W - 48, H - 48);
  g.fillStyle = 'rgba(255, 220, 150, .35)';
  for (let y = 48; y < H - 40; y += 40) for (let x = 48; x < W - 40; x += 40) { g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 9, y); g.lineTo(x, y + 9); g.lineTo(x - 9, y); g.fill(); }
});
/** A rug: a patterned rectangle with a border, flat on the floor. */
export function rug({ col = '#6b1d2a', w = 3.2, d = 2.2 } = {}) {
  const g = new THREE.Group(), r = mesh(new THREE.PlaneGeometry(w, d), mat('#ffffff', { map: rugTex(col, w, d), roughness: 1 }), false);
  r.rotation.x = -Math.PI / 2; r.position.y = 0.012;
  g.add(r);
  return { g };
}
/** A long runner, for a gallery or a hall. */
export const runner = ({ col = '#3a5a2a', len = 60 } = {}) => rug({ col, w: len, d: 1.2 });

// ---------- to sit on ----------
/** A plain wooden chair. */
export function chair({ col = '#7a4a28' } = {}) {
  const g = new THREE.Group(), m = col === '#7a4a28' ? mid : mat(col, { map: woodTex });
  g.add(box(0.48, 0.06, 0.46, m, 0, 0.46, 0), box(0.48, 0.55, 0.05, m, 0, 0.76, -0.21));
  for (const [x, z] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) g.add(cyl(0.025, 0.025, 0.46, m, x, 0.23, z, 6));
  return { g };
}
/** An armchair, upholstered in its colour, on little dark legs. */
export function armchair({ col = '#4a6b3a' } = {}) {
  const g = new THREE.Group(), up = cloth(col);
  g.add(box(0.86, 0.22, 0.78, up, 0, 0.36, 0), box(0.86, 0.75, 0.18, up, 0, 0.82, -0.3), box(0.16, 0.3, 0.72, up, -0.4, 0.6, 0), box(0.16, 0.3, 0.72, up, 0.4, 0.6, 0));
  const cushion = mesh(new THREE.BoxGeometry(0.6, 0.1, 0.55), up); cushion.position.set(0, 0.52, 0.05); g.add(cushion);
  for (const [x, z] of [[-0.36, -0.32], [0.36, -0.32], [-0.36, 0.32], [0.36, 0.32]]) g.add(cyl(0.035, 0.025, 0.25, ebony, x, 0.125, z, 6));
  return { g };
}
/** A round side table on one leg, a teacup on it; or `cards` dealt on it and `bottles` stood on it
    (Primates Rule's deck); `black`, in ebony. */
export function table({ cup = true, cards = false, bottles = 0, black = false } = {}) {
  const g = new THREE.Group(), top = black ? ebony : mid, foot = black ? ebony : dark;
  g.add(cyl(0.42, 0.42, 0.05, top, 0, 0.72, 0, 20), cyl(0.05, 0.07, 0.7, foot, 0, 0.36, 0, 8), cyl(0.26, 0.3, 0.04, foot, 0, 0.02, 0, 16));
  if (cup) g.add(cyl(0.05, 0.04, 0.07, mat('#f4f1ea'), 0.1, 0.78, 0.05, 10), cyl(0.08, 0.08, 0.01, mat('#f4f1ea'), 0.1, 0.75, 0.05, 12));
  if (cards) {
    // A hand dealt round, and the pack.
    [[-0.2, 0.05, 0.3], [0.05, -0.22, -0.4], [0.22, 0.12, 1.1], [-0.05, 0.24, 2.0], [0.15, -0.05, 2.6]].forEach(([x, z, a], i) => { const c = box(0.08, 0.004, 0.11, i === 3 ? cardRed : cardM, x, 0.748, z); c.rotation.y = a; g.add(c); });
    g.add(box(0.08, 0.03, 0.11, cardM, -0.18, 0.76, -0.15));
  }
  for (let i = 0; i < bottles; i++) {
    const a = 0.8 + i * 2.1, x = Math.cos(a) * 0.2, z = Math.sin(a) * 0.2, m = i % 2 ? bottleBrown : bottleGreen;
    g.add(cyl(0.045, 0.045, 0.2, m, x, 0.845, z, 8), cyl(0.016, 0.03, 0.09, m, x, 0.99, z, 6), cyl(0.018, 0.018, 0.02, cork, x, 1.045, z, 6));
  }
  return { g };
}
/** A bed: a four-poster, its canopy and curtains in its colour, a pillow and a turned-down blanket. */
export function bed({ col = '#2f5a32' } = {}) {
  const g = new THREE.Group(), drape = cloth(col);
  g.add(box(1.7, 0.35, 2.2, dark, 0, 0.3, 0), box(1.6, 0.18, 2.05, mat('#efe8d8'), 0, 0.56, 0.02), box(1.62, 0.12, 1.3, drape, 0, 0.68, 0.38));
  const pillow = mesh(new THREE.BoxGeometry(1.1, 0.14, 0.4), mat('#f6f2ea')); pillow.position.set(0, 0.72, -0.72); g.add(pillow);
  g.add(box(1.7, 0.9, 0.08, dark, 0, 0.75, -1.1));   // the headboard
  for (const [x, z] of [[-0.82, -1.08], [0.82, -1.08], [-0.82, 1.08], [0.82, 1.08]]) g.add(cyl(0.05, 0.05, 2.3, dark, x, 1.15, z, 8));
  // The canopy: rails round the top, a valance hanging from them (open above, so you can see in).
  g.add(box(1.76, 0.06, 0.06, dark, 0, 2.3, -1.1), box(1.76, 0.06, 0.06, dark, 0, 2.3, 1.1), box(0.06, 0.06, 2.24, dark, -0.84, 2.3, 0), box(0.06, 0.06, 2.24, dark, 0.84, 2.3, 0));
  g.add(box(1.76, 0.22, 0.03, drape, 0, 2.16, 1.12), box(0.03, 0.22, 2.24, drape, -0.86, 2.16, 0), box(0.03, 0.22, 2.24, drape, 0.86, 2.16, 0));
  for (const s of [-1, 1]) {
    const c = mesh(new THREE.BoxGeometry(0.04, 1.9, 0.5), drape); c.position.set(0.84 * s, 1.35, -0.8); g.add(c);
    const c2 = mesh(new THREE.BoxGeometry(0.04, 1.9, 0.4), drape); c2.position.set(0.84 * s, 1.35, 0.86); g.add(c2);
  }
  return { g };
}

// ---------- light ----------
/** A candle's flame, with a soft glow round it, flickering (in `tick`). */
function flame(parent, x, y, z) {
  const f = mesh(new THREE.ConeGeometry(0.025, 0.08, 8), flameM, false), glow = mesh(new THREE.SphereGeometry(0.07, 8, 6), glowM, false);
  f.position.set(x, y, z); glow.position.set(x, y, z);
  parent.add(f, glow);
  return f;
}
const flicker = (fs, light, base) => {
  let t = Math.random() * 10;
  return (dt) => {
    t += dt;
    const k = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3 + 1);
    for (const f of fs) f.scale.set(1, k + 0.1, 1);
    if (light) light.intensity = base * k;
  };
};
/** A tall brass candelabra, three candles lit. `light`: whether it lights the room (a few, not all). */
export function candelabra({ light = true } = {}) {
  const g = new THREE.Group();
  g.add(cyl(0.18, 0.22, 0.04, brass, 0, 0.02, 0, 14), cyl(0.03, 0.04, 1.35, brass, 0, 0.7, 0, 8), box(0.56, 0.03, 0.03, brass, 0, 1.38, 0));
  const fs = [];
  for (const x of [-0.27, 0, 0.27]) {
    const h = x ? 0.16 : 0.22;
    g.add(cyl(0.045, 0.035, 0.04, brass, x, 1.41, 0, 10), cyl(0.024, 0.026, h, wax, x, 1.43 + h / 2, 0, 8));
    fs.push(flame(g, x, 1.47 + h, 0));
  }
  let L = null;
  if (light) { L = new THREE.PointLight('#ffb35a', 6, 7, 1.6); L.position.set(0, 1.8, 0); g.add(L); }
  return { g, tick: flicker(fs, L, 6) };
}
/** A candle in a brass bracket, for a wall (its back to the wall, at its origin; hang it at `y`). */
export function sconce({ y = 1.9 } = {}) {
  const g = new THREE.Group();
  g.add(box(0.08, 0.2, 0.03, brass, 0, y, 0.015), box(0.03, 0.03, 0.16, brass, 0, y - 0.06, 0.09), cyl(0.05, 0.04, 0.03, brass, 0, y - 0.04, 0.17, 10), cyl(0.022, 0.024, 0.12, wax, 0, y + 0.04, 0.17, 8));
  return { g, tick: flicker([flame(g, 0, y + 0.13, 0.17)], null, 0) };
}

// ---------- the coffin ----------
/* A coffin: the old six-sided shape, its lid on a hinge down one long side, red satin inside. `sitter`:
   whoever's lying in it (anything with g, legs and arms: a pirate from the wardrobe), on their back, arms
   crossed. open(u) lifts the lid (0 shut, 1 flung open), sitUp(u) sits them bolt upright; tick eases both
   there, a rattle of the lid as it starts. Its head end is away from you (-z). */
const COFFIN_PTS = [[-0.24, -1.0], [0.24, -1.0], [0.38, -0.5], [0.22, 1.0], [-0.22, 1.0], [-0.38, -0.5]];
const coffinShape = (inset = 0) => {
  const s = new THREE.Shape();
  COFFIN_PTS.forEach(([x, z], i) => { const px = x * (1 - inset * 2.4), pz = z * (1 - inset); s[i ? 'lineTo' : 'moveTo'](px, -pz); });
  return s;
};
export function coffin({ sitter = null, wood = '#3a2416' } = {}) {
  const g = new THREE.Group(), woodM = mat(wood, { map: woodTex, roughness: 0.7 });
  const shell = mesh(new THREE.ExtrudeGeometry(coffinShape(), { depth: 0.46, bevelEnabled: false }).rotateX(-Math.PI / 2), woodM);
  g.add(shell);
  const satin = mesh(new THREE.ShapeGeometry(coffinShape(0.07)).rotateX(-Math.PI / 2), mat('#8a1020', { roughness: 0.4 }), false);
  satin.position.y = 0.461; g.add(satin);
  const lining = mesh(new THREE.BoxGeometry(0.3, 0.06, 0.2), mat('#a8162a', { roughness: 0.4 })); lining.position.set(0, 0.49, -0.78); g.add(lining);   // (a satin pillow)
  // The lid: hinged along the left side (x = -0.38), swinging up and over to the left.
  const hinge = new THREE.Group(); hinge.position.set(-0.4, 0.46, 0); g.add(hinge);
  const lid = mesh(new THREE.ExtrudeGeometry(coffinShape(), { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 }).rotateX(-Math.PI / 2), woodM);
  lid.position.x = 0.4; hinge.add(lid);
  const cross = box(0.06, 0.02, 0.5, brass, 0.4, 0.09, -0.15); hinge.add(cross, box(0.26, 0.02, 0.06, brass, 0.4, 0.09, -0.25));
  // Whoever's in it: hinged at the hips, lying on their back.
  const hips = new THREE.Group(); hips.position.set(0, 0.24, 0.2); g.add(hips);
  if (sitter) { sitter.g.position.set(0, -0.72, 0); sitter.g.rotation.set(0, 0, 0); hips.add(sitter.g); }
  const st = { open: 0, up: 0, wantOpen: 0, wantUp: 0, rattle: 0, t: 0 };
  const pose = () => {
    hinge.rotation.z = st.open * 2.05 + (st.rattle > 0 ? Math.abs(Math.sin(st.t * 34)) * 0.16 * st.rattle : 0);   // (a rattle: the lid jumping on its hinge)
    hips.rotation.x = -Math.PI / 2 * (1 - st.up);
    if (!sitter) return;
    sitter.legs.forEach((l) => { l.rotation.set(-Math.PI / 2 * st.up, 0, 0); });
    // Arms crossed on the chest lying down; flung up as they sit bolt upright.
    sitter.arms.forEach((a, i) => { const inward = i ? -1 : 1; a.rotation.set(-0.5 * (1 - st.up) - 2.7 * st.up, 0, inward * (1.15 * (1 - st.up) - 0.45 * st.up)); });
  };
  pose();
  return {
    g, lid: hinge, sitter,
    get opened() { return st.open; },
    open(u) { if (u > st.wantOpen) st.rattle = 0.5; st.wantOpen = u; },
    sitUp(u) { st.wantUp = u; },
    /** The lid gives a rattle, shut or open (whoever's in it stirring). */
    rattle(k = 0.7) { st.rattle = Math.max(st.rattle, k); },
    /** Straight to how it is (no easing). */
    set(open, up) { st.open = st.wantOpen = open; st.up = st.wantUp = up; pose(); },
    tick(dt) {
      st.t += dt; st.rattle = Math.max(0, st.rattle - dt);
      st.open += (st.wantOpen - st.open) * Math.min(1, dt * 6);
      st.up += (st.wantUp - st.up) * Math.min(1, dt * (st.wantUp > st.up ? 14 : 3));
      pose();
    },
  };
}

// ---------- pictures ----------
const PLAIN = canvasTex(4, 4, (g) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, 4, 4); });
const plaqueTex = (text) => canvasTex(256, 48, (g, W, H) => {
  g.fillStyle = '#e9d7a6'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#7a5216'; g.lineWidth = 3; g.strokeRect(2, 2, W - 4, H - 4);
  g.fillStyle = '#3a2210'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let px = 22;
  do g.font = `italic 700 ${px}px Alegreya, Georgia, serif`; while (g.measureText(text).width > W - 16 && --px > 9);
  g.fillText(text, W / 2, H / 2 + 1);
});
/* How far off the wall each layer of a framed picture stands (metres; the wall's face at 0), each clearly
   in front of the last so none fights another for the same depth, from any camera, zoomed in or out
   (the user, 11 Nov: "the little captions underneath the pictures flicker"; RULES.md, "The ship's deck
   doesn't flicker"): the wall; a house's wainscot (house.js's, 0.02 proud of it, which a plaque can hang
   over); the frame (0 to 0.06 deep); the picture in it; and the plaque under it, standing off the wall on
   its own, in front of the wainscot too. And drawn a touch nearer than its depth says (AHEAD), to be sure. */
const LAYER = { picture: 0.036, plaque: 0.05 };
const AHEAD = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 };
/* A picture in a gilt frame, `w` by `h` metres (the picture; the frame round it), its back to the wall at
   its origin, its middle at height `y`. `picture`: a texture (a portrait from js/den/portraits.js), or
   plain canvas till it's painted. `plaque`: its title on a little brass plate under it. setPicture and
   setPlaque change them. */
export function frame({ w = 0.8, h = 1.0, y = 1.75, picture = null, plaque = '', ornate = true } = {}) {
  const g = new THREE.Group(), t = ornate ? 0.11 : 0.07, d = 0.06;
  const pic = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: picture || PLAIN, color: '#e6e0d6' }), false);   // (a painting's own colours, a touch dimmed by the room)
  pic.position.set(0, y, LAYER.picture);
  g.add(pic, box(w + 2 * t, t, d, gilt, 0, y + h / 2 + t / 2, d / 2), box(w + 2 * t, t, d, gilt, 0, y - h / 2 - t / 2, d / 2), box(t, h, d, gilt, -w / 2 - t / 2, y, d / 2), box(t, h, d, gilt, w / 2 + t / 2, y, d / 2));
  if (ornate) for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(at(mesh(new THREE.SphereGeometry(t * 0.55, 8, 6), gilt), sx * (w / 2 + t / 2), y + sy * (h / 2 + t / 2), d * 0.9));
  let plate = null;
  const setPlaque = (text) => {
    if (plate) { plate.geometry.dispose(); plate.material.map?.dispose(); plate.material.dispose(); g.remove(plate); plate = null; }
    if (!text) return;
    const pw = Math.min(w + 0.1, 0.9);
    plate = mesh(new THREE.PlaneGeometry(pw, pw * 48 / 256), new THREE.MeshStandardMaterial({ map: plaqueTex(text), roughness: 0.5, metalness: 0.2, ...AHEAD }), false);
    plate.position.set(0, y - h / 2 - t - pw * 24 / 256 - 0.03, LAYER.plaque);
    g.add(plate);
  };
  setPlaque(plaque);
  return {
    g, pic, w, h, y,
    /** The picture: a texture, or part of one (`uv`: { u0, v0, u1, v1 }, a tile of a shared atlas). */
    setPicture(tex, uv = null) {
      pic.material.map = tex || PLAIN; pic.material.needsUpdate = true;
      const at = pic.geometry.attributes.uv, U = uv || { u0: 0, v0: 0, u1: 1, v1: 1 };
      [[U.u0, U.v1], [U.u1, U.v1], [U.u0, U.v0], [U.u1, U.v0]].forEach(([u, v], i) => at.setXY(i, u, v));
      at.needsUpdate = true;
    },
    setPlaque,
  };
}
/* An easel: three legs, a ledge, a canvas on it (a picture: setPicture, as a frame's), and a palette
   hooked on one leg. Facing +z (the canvas's front). */
export function easel() {
  const g = new THREE.Group();
  for (const [x, z, rz, rx] of [[-0.32, 0.08, -0.12, 0.08], [0.32, 0.08, 0.12, 0.08], [0, -0.42, 0, -0.32]]) {
    const leg = cyl(0.03, 0.035, 1.9, mid, x, 0.93, z, 6); leg.rotation.set(rx, 0, rz); g.add(leg);
  }
  g.add(box(0.86, 0.05, 0.12, mid, 0, 0.82, 0.15));
  // The canvas: on the ledge, leant on the front legs and clear in front of them (never the wood through
  // the painting), as they lean.
  const cv = mesh(new THREE.BoxGeometry(0.8, 1.0, 0.03), mat('#f2ead8', { roughness: 0.9 }));
  cv.position.set(0, CANVAS.y, CANVAS.out); cv.rotation.x = 0.08; g.add(cv);   // (where a painter's brush goes: src/den-houses.ts)
  const pic = mesh(new THREE.PlaneGeometry(0.76, 0.96), new THREE.MeshStandardMaterial({ map: PLAIN, roughness: 0.85 }), false);
  pic.position.set(0, 0, 0.017); cv.add(pic);
  const pal = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 16), mat('#c9a56e', { map: woodTex }));
  pal.rotation.set(Math.PI / 2, 0, 0.3); pal.position.set(-0.55, 1.05, 0.12); g.add(pal);
  for (const [c, a] of [['#d72c22', 0], ['#2a6fd7', 1.3], ['#f8ff35', 2.4], ['#3b6c2c', 3.6], ['#f6f2ea', 4.8]]) g.add(at(mesh(new THREE.SphereGeometry(0.025, 6, 5), mat(c)), -0.55 + Math.cos(a) * 0.1, 1.05 + Math.sin(a) * 0.1, 0.14));
  pic.visible = false;
  return {
    g, canvas: cv,
    /** The picture on it, or none (a blank canvas). */
    setPicture(tex) { pic.material.map = tex || PLAIN; pic.material.needsUpdate = true; pic.visible = !!tex; },
  };
}

// ---------- doors ----------
/** A wooden door in a stone or timber frame, `w` by `h`, a ring for a handle; `open` swings it in (0 to 1). */
export function door({ w = 1.1, h = 2.2, frameCol = '#6e655c', wood = '#5a3620' } = {}) {
  const g = new THREE.Group(), fm = mat(frameCol, { flatShading: true }), wm = mat(wood, { map: woodTex });
  g.add(box(0.22, h + 0.2, 0.3, fm, -w / 2 - 0.11, (h + 0.2) / 2, 0), box(0.22, h + 0.2, 0.3, fm, w / 2 + 0.11, (h + 0.2) / 2, 0), box(w + 0.44, 0.24, 0.3, fm, 0, h + 0.12, 0));
  const hinge = new THREE.Group(); hinge.position.set(-w / 2, 0, 0); g.add(hinge);
  const leaf = box(w, h, 0.07, wm, w / 2, h / 2, 0); hinge.add(leaf);
  for (const y of [0.4, h - 0.4]) hinge.add(box(w * 0.9, 0.07, 0.02, mat('#2a2622', { metalness: 0.5 }), w / 2, y, 0.045));
  const ring = mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14), brass); ring.position.set(w * 0.82, h * 0.48, 0.06); hinge.add(ring);
  let o = 0, want = 0;
  return { g, open(u) { want = u; }, tick(dt) { o += (want - o) * Math.min(1, dt * 5); hinge.rotation.y = -o * 1.6; } };
}

// ---------- outdoors ----------
/** A copper still (behind Tzz in her portrait): a fat copper pot on a brick firebox, its domed head, a
    pipe arching over to a coil in a barrel, a little fire glowing under it. About 1.6 m high. */
export function still() {
  const g = new THREE.Group(), copper = mat('#c4743a', { metalness: 0.7, roughness: 0.35 }), brick = mat('#8a4a32', { roughness: 1 });
  g.add(box(0.9, 0.4, 0.9, brick, 0, 0.2, 0));
  const fire = mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff9a3a' }), false); fire.position.set(0, 0.18, 0.4); fire.scale.set(1.4, 0.7, 0.4); g.add(fire);
  const pot = mesh(new THREE.SphereGeometry(0.45, 18, 14), copper); pot.position.y = 0.78; pot.scale.y = 0.85; g.add(pot);
  g.add(cyl(0.12, 0.3, 0.3, copper, 0, 1.25), cyl(0.06, 0.08, 0.2, copper, 0, 1.48));
  const curve = new THREE.CatmullRomCurve3([[0, 1.55, 0], [0.4, 1.7, 0], [0.85, 1.4, 0], [1.05, 0.95, 0]].map((p) => new THREE.Vector3(...p)));
  g.add(mesh(new THREE.TubeGeometry(curve, 20, 0.035, 6), copper));
  g.add(cyl(0.28, 0.3, 0.75, mid, 1.1, 0.375, 0));
  for (const y of [0.15, 0.6]) g.add(cyl(0.305, 0.305, 0.04, mat('#3a3330', { metalness: 0.4 }), 1.1, y, 0));
  return { g, tick() { fire.scale.y = 0.6 + Math.sin(performance.now() / 90) * 0.12; } };
}

// ---------- bones, iron and the like (Primates Rule's deck, and anywhere else) ----------
/* The skeleton set and its company, as Puzzle Pirates has them (YPPedia: the Skeletal large cannon, the
   Gibbet, the Skeleton chair): bone white on black, from the user's war frigate (TODO.md, "Pictures of
   Primates Rule"; the user, 11 Nov: "the skeleton cannons ... the gibbet, the skeleton set"). Each piece's
   materials are shared by every copy, so a ship full of them bakes down to a few meshes
   (js/den/bake.js). */
const bone = mat('#e8dfc4', { roughness: 0.7 }), socket = mat('#17120e', { roughness: 1 });
const ironBlack = mat('#1f1e23', { metalness: 0.45, roughness: 0.45 }), steel = mat('#dde1e6', { metalness: 0.35, roughness: 0.35 });
const plinthM = mat('#dcd6cb', { roughness: 0.9 }), paleDeal = mat('#c2b6a2', { map: woodTex, roughness: 0.9 });
const pianoBlack = mat('#131216', { roughness: 0.22, metalness: 0.15 }), ivory = mat('#f3efe6', { roughness: 0.5 });
const greyStone = mat('#8d9296', { roughness: 0.85 }), anchorGrey = mat('#5a5f66', { metalness: 0.3, roughness: 0.6 });
const glass = mat('#d4ecef', { transparent: true, opacity: 0.32, roughness: 0.08, depthWrite: false }), straw = mat('#d8c27c', { roughness: 0.8 });
const cardM = mat('#f6f3ea', { roughness: 0.8 }), cardRed = mat('#c8343a', { roughness: 0.8 });
const bottleGreen = mat('#2f6b3a', { roughness: 0.2, metalness: 0.1 }), bottleBrown = mat('#6a3a1c', { roughness: 0.2, metalness: 0.1 }), cork = mat('#b08a5a');
const creatureMats = {}, creatureMat = (c) => (creatureMats[c] ||= mat(c, { emissive: c, emissiveIntensity: 0.25, roughness: 0.5 }));
const UP = new THREE.Vector3(0, 1, 0);
/** A rod from a to b ([x, y, z] each), `r` thick. */
function rod(a, b, r, m, n = 6) {
  const A = new THREE.Vector3(...a), d = new THREE.Vector3(...b).sub(A), c = mesh(new THREE.CylinderGeometry(r, r, d.length(), n), m);
  c.position.copy(A).addScaledVector(d, 0.5);
  c.quaternion.setFromUnitVectors(UP, d.normalize());
  return c;
}
const ball = (r, m, x, y, z, n = 8) => at(mesh(new THREE.SphereGeometry(r, n, Math.max(4, n - 2)), m), x, y, z);
/** A skull, its middle at (x, y, z), looking toward +z. */
function skull(parent, x, y, z, r = 0.1) {
  const c = ball(r, bone, x, y, z, 10); c.scale.set(0.92, 1, 1.08);
  parent.add(c, box(r * 1.1, r * 0.45, r * 0.9, bone, x, y - r * 0.85, z + r * 0.25));
  for (const sx of [-1, 1]) parent.add(ball(r * 0.26, socket, x + sx * r * 0.38, y - r * 0.05, z + r * 0.84, 6));
  parent.add(ball(r * 0.12, socket, x, y - r * 0.4, z + r * 0.98, 4));
}
/** A skeleton: `pose` 'stand', 'sit' (sat on a seat 0.46 high, at its origin, thighs out toward +z), or
    'slump' (hanging in a gibbet). About a pirate's height stood. */
export function skeleton({ pose = 'stand' } = {}) {
  const g = new THREE.Group(), sit = pose === 'sit', hipY = sit ? 0.5 : 0.92;
  for (const sx of [-1, 1]) {
    const hx = 0.1 * sx;
    if (sit) {
      const knee = [hx * 1.25, hipY + 0.02, 0.42];
      g.add(rod([hx, hipY, 0], knee, 0.03, bone), rod(knee, [hx * 1.25, 0.06, 0.47], 0.026, bone), ball(0.04, bone, ...knee), box(0.08, 0.04, 0.16, bone, hx * 1.25, 0.03, 0.52));
    } else {
      const knee = [hx, 0.48, pose === 'slump' ? 0.06 : 0.02];
      g.add(rod([hx, hipY, 0], knee, 0.03, bone), rod(knee, [hx, 0.06, 0], 0.026, bone), ball(0.04, bone, ...knee), box(0.08, 0.04, 0.16, bone, hx, 0.03, 0.05));
    }
  }
  g.add(box(0.26, 0.1, 0.12, bone, 0, hipY + 0.02, 0));
  // From the hips up: the spine, the ribs (open at the back), the collarbones, arms and the skull.
  const torso = new THREE.Group(); torso.position.set(0, hipY + 0.05, 0); torso.rotation.x = sit ? -0.12 : pose === 'slump' ? 0.3 : 0; g.add(torso);
  torso.add(rod([0, 0, -0.04], [0, 0.6, -0.04], 0.022, bone), rod([-0.2, 0.52, -0.02], [0.2, 0.52, -0.02], 0.018, bone));
  for (let i = 0; i < 4; i++) {
    const r = 0.13 - i * 0.012, rib = mesh(new THREE.TorusGeometry(r, 0.014, 4, 12, Math.PI * 1.5).rotateX(Math.PI / 2).rotateY(Math.PI / 4), bone);
    rib.position.set(0, 0.44 - i * 0.075, 0.02); torso.add(rib);
  }
  for (const sx of [-1, 1]) {
    const sh = [0.2 * sx, 0.5, -0.02], elbow = sit ? [0.21 * sx, 0.24, 0.12] : [0.22 * sx, 0.22, 0], hand = sit ? [0.16 * sx, 0.12, 0.38] : [0.22 * sx, -0.04, 0.04];
    torso.add(rod(sh, elbow, 0.022, bone), rod(elbow, hand, 0.018, bone), box(0.05, 0.08, 0.03, bone, hand[0], hand[1] - 0.03, hand[2]));
  }
  torso.add(rod([0, 0.6, -0.03], [0, 0.66, 0], 0.02, bone));
  skull(torso, 0, 0.76, 0.01);
  if (pose === 'slump') torso.rotation.z = 0.12;
  return { g };
}
/** A skeleton chair (YPPedia: Skeleton chair): a chair of bones, a skull atop its back. `sitter`: a
    skeleton sat in it. */
export function skeletonChair({ sitter = false } = {}) {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) g.add(rod([x, 0, z], [x, 0.44, z], 0.028, bone), ball(0.045, bone, x, 0.02, z), ball(0.045, bone, x, 0.44, z));
  for (let i = 0; i < 5; i++) g.add(rod([-0.24, 0.47, -0.18 + i * 0.09], [0.24, 0.47, -0.18 + i * 0.09], 0.024, bone));
  for (const x of [-0.2, -0.07, 0.07, 0.2]) g.add(rod([x, 0.47, -0.2], [x * 0.9, 1.08, -0.24], 0.022, bone));
  g.add(rod([-0.22, 0.75, -0.215], [0.22, 0.75, -0.215], 0.02, bone), rod([-0.2, 1.05, -0.24], [0.2, 1.05, -0.24], 0.02, bone));
  skull(g, 0, 1.17, -0.24, 0.085);
  if (sitter) { const s = skeleton({ pose: 'sit' }); s.g.position.z = -0.1; g.add(s.g); }
  return { g };
}
/** A skeletal large cannon (YPPedia's name for it): a black barrel banded in bone, a skull on its breech,
    on a black carriage on bone wheels. Its muzzle toward +z, 0.8 out; its barrel 0.42 up. */
export function skeletalCannon() {
  const g = new THREE.Group();
  g.add(box(0.48, 0.2, 0.86, ironBlack, 0, 0.2, -0.1), box(0.3, 0.12, 0.3, ironBlack, 0, 0.36, -0.35));
  for (const sx of [-1, 1]) for (const z of [-0.42, 0.22]) { const w = cyl(0.13, 0.13, 0.06, bone, 0.27 * sx, 0.13, z, 12); w.rotation.z = Math.PI / 2; g.add(w); }
  const barrel = mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.3, 14).rotateX(Math.PI / 2), ironBlack); barrel.position.set(0, 0.42, 0.1); g.add(barrel);
  const swell = mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.14, 14).rotateX(Math.PI / 2), ironBlack); swell.position.set(0, 0.42, 0.74); g.add(swell);
  const bore = mesh(new THREE.CircleGeometry(0.1, 12), socket, false); bore.position.set(0, 0.42, 0.812); g.add(bore);
  for (const [z, r] of [[-0.38, 0.205], [-0.14, 0.19], [0.1, 0.18], [0.34, 0.17], [0.66, 0.2]]) { const band = mesh(new THREE.TorusGeometry(r, 0.035, 5, 16), bone); band.position.set(0, 0.42, z); g.add(band); }
  g.add(ball(0.2, ironBlack, 0, 0.42, -0.55, 12), ball(0.07, bone, 0, 0.42, -0.76));
  skull(g, 0, 0.66, -0.36, 0.09);
  return { g };
}
/** A gibbet (YPPedia: Gibbet): a post and arm on a pale platform, an iron cage hanging from it, a
    skeleton slumped inside. Its cage swings a little (`tick`), so it's left out of a bake. */
export function gibbet({ bones = true } = {}) {
  const g = new THREE.Group();
  g.add(box(0.9, 0.08, 0.9, paleDeal, 0, 0.04, 0), box(0.12, 2.1, 0.12, dark, -0.36, 1.13, 0), box(0.82, 0.1, 0.1, dark, -0.01, 2.13, 0), rod([-0.36, 1.75, 0], [-0.02, 2.1, 0], 0.03, dark));
  const hang = new THREE.Group(); hang.position.set(0.24, 2.08, 0); hang.userData.live = true; g.add(hang);
  hang.add(rod([0, 0, 0], [0, -0.16, 0], 0.012, ironBlack, 4));
  const cage = new THREE.Group(); cage.position.y = -0.16; hang.add(cage);
  for (const y of [0, -0.5, -1.0]) { const ring = mesh(new THREE.TorusGeometry(0.24, 0.016, 4, 14).rotateX(Math.PI / 2), ironBlack); ring.position.y = y; cage.add(ring); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.cos(a) * 0.24, z = Math.sin(a) * 0.24; cage.add(rod([x, 0, z], [x, -1.0, z], 0.012, ironBlack, 4), rod([x, 0, z], [0, 0.14, 0], 0.012, ironBlack, 4)); }
  cage.add(cyl(0.24, 0.24, 0.02, ironBlack, 0, -1.0, 0, 14));
  if (bones) { const s = skeleton({ pose: 'slump' }); s.g.scale.setScalar(0.55); s.g.position.y = -0.99; cage.add(s.g); }
  bake(hang);   // (the cage and its bones as a few meshes, swinging as one)
  let t = Math.random() * 10;
  return { g, tick(dt) { t += dt; hang.rotation.z = Math.sin(t * 1.3) * 0.05; hang.rotation.x = Math.sin(t * 0.9 + 1) * 0.035; } };
}
/** A suit of armour stood on a stone plinth, a plume on its helm. */
export function armour({ plinth = true, plume = '#2f5fb8' } = {}) {
  const g = new THREE.Group(), y0 = plinth ? 0.34 : 0;
  if (plinth) g.add(box(0.56, 0.3, 0.5, plinthM, 0, 0.15, 0), box(0.62, 0.04, 0.56, plinthM, 0, 0.32, 0));
  for (const sx of [-1, 1]) {
    g.add(cyl(0.07, 0.06, 0.82, steel, 0.1 * sx, y0 + 0.43, 0, 8), ball(0.075, steel, 0.1 * sx, y0 + 0.45, 0.02), box(0.11, 0.06, 0.2, steel, 0.1 * sx, y0 + 0.03, 0.04));
    g.add(ball(0.1, steel, 0.25 * sx, y0 + 1.35, 0), rod([0.26 * sx, y0 + 1.32, 0], [0.27 * sx, y0 + 0.95, 0.04], 0.055, steel), ball(0.06, steel, 0.27 * sx, y0 + 0.9, 0.05));
  }
  g.add(cyl(0.2, 0.24, 0.22, steel, 0, y0 + 0.92, 0, 12), cyl(0.21, 0.17, 0.42, steel, 0, y0 + 1.22, 0, 12), box(0.02, 0.36, 0.06, steel, 0, y0 + 1.22, 0.18));
  g.add(cyl(0.11, 0.115, 0.2, steel, 0, y0 + 1.56, 0, 12), ball(0.11, steel, 0, y0 + 1.66, 0, 12), box(0.15, 0.025, 0.02, socket, 0, y0 + 1.58, 0.11));
  const pl = cyl(0.01, 0.06, 0.24, mat(plume, { roughness: 0.95 }), 0, y0 + 1.86, -0.02, 8); pl.rotation.x = -0.35; g.add(pl);
  return { g };
}
/** A grand piano, black (as on Primates Rule's quarterdeck): its lid propped open, its keyboard toward
    +z. About 1.25 across and 1.4 deep. */
export function grandPiano() {
  const g = new THREE.Group(), s = new THREE.Shape();
  // Its outline from above (x across, y = -z: the keyboard's edge at z 0.45, the curved tail at z -0.7).
  s.moveTo(-0.62, -0.45); s.lineTo(0.62, -0.45); s.lineTo(0.62, 0.0);
  s.bezierCurveTo(0.62, 0.3, 0.25, 0.3, 0.2, 0.5); s.quadraticCurveTo(0.1, 0.7, -0.2, 0.7); s.lineTo(-0.62, 0.7); s.closePath();
  const body = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: false, curveSegments: 6 }).rotateX(-Math.PI / 2), pianoBlack); body.position.y = 0.62; g.add(body);
  const hinge = new THREE.Group(); hinge.position.set(-0.62, 0.92, 0); hinge.rotation.z = 0.6; g.add(hinge);
  const lid = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false, curveSegments: 6 }).rotateX(-Math.PI / 2), pianoBlack); lid.position.x = 0.62; hinge.add(lid);
  g.add(rod([0.5, 0.9, 0.1], [0.5, 1.5, 0.1], 0.012, pianoBlack, 4));
  for (const [x, z] of [[-0.5, 0.35], [0.5, 0.35], [-0.35, -0.55]]) g.add(cyl(0.05, 0.04, 0.62, pianoBlack, x, 0.31, z, 8));
  g.add(box(1.2, 0.1, 0.24, pianoBlack, 0, 0.78, 0.55), box(1.12, 0.04, 0.16, ivory, 0, 0.845, 0.56));
  for (let i = 0; i < 15; i++) if (i % 7 !== 2 && i % 7 !== 6) g.add(box(0.035, 0.02, 0.09, pianoBlack, -0.54 + i * 0.075, 0.87, 0.53));
  const stand = box(0.6, 0.26, 0.02, pianoBlack, 0, 1.03, 0.4); stand.rotation.x = -0.25; g.add(stand);
  return { g };
}
/** An anchor-backed chair: grey, an anchor on its tall rounded back. */
export function anchorChair() {
  const g = new THREE.Group();
  g.add(box(0.5, 0.08, 0.46, greyStone, 0, 0.44, 0), box(0.5, 0.62, 0.08, greyStone, 0, 0.78, -0.2));
  const top = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 14, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2), greyStone); top.position.set(0, 1.09, -0.2); g.add(top);
  for (const [x, z] of [[-0.21, -0.19], [0.21, -0.19], [-0.21, 0.19], [0.21, 0.19]]) g.add(box(0.06, 0.42, 0.06, greyStone, x, 0.21, z));
  g.add(box(0.035, 0.38, 0.02, anchorGrey, 0, 0.84, -0.15), box(0.2, 0.035, 0.02, anchorGrey, 0, 0.98, -0.15));
  const ring = mesh(new THREE.TorusGeometry(0.035, 0.01, 4, 10), anchorGrey); ring.position.set(0, 1.05, -0.15); g.add(ring);
  const arms = mesh(new THREE.TorusGeometry(0.13, 0.016, 4, 12, Math.PI).rotateZ(Math.PI), anchorGrey); arms.position.set(0, 0.79, -0.15); g.add(arms);
  return { g };
}
/** A big glass jar with something in it looking out: a creature of colour `creature`. */
export function jar({ creature = '#8a5cd8' } = {}) {
  const g = new THREE.Group(), c = creatureMat(creature);
  g.add(cyl(0.23, 0.24, 0.05, dark, 0, 0.025, 0, 14), cyl(0.22, 0.22, 0.66, glass, 0, 0.38, 0, 14), cyl(0.245, 0.245, 0.06, straw, 0, 0.74, 0, 14), ball(0.05, straw, 0, 0.79, 0));
  const blob = ball(0.13, c, 0, 0.3, 0, 10); blob.scale.set(1, 1.2, 0.9); g.add(blob);
  for (const sx of [-1, 1]) g.add(ball(0.04, ivory, sx * 0.05, 0.38, 0.1, 6), ball(0.018, socket, sx * 0.05, 0.38, 0.135, 4));
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; g.add(rod([Math.cos(a) * 0.08, 0.2, Math.sin(a) * 0.08], [Math.cos(a) * 0.17, 0.07, Math.sin(a) * 0.17], 0.025, c, 5)); }
  return { g };
}
/** A tool chest, its lid thrown back, a hammer and a saw sticking out. */
export function toolChest() {
  const g = new THREE.Group();
  g.add(box(0.7, 0.34, 0.42, mid, 0, 0.17, 0), box(0.72, 0.04, 0.44, brass, 0, 0.3, 0), box(0.72, 0.04, 0.44, brass, 0, 0.06, 0));
  const lid = box(0.7, 0.05, 0.42, mid, 0, 0, 0.21), hinge = new THREE.Group(); hinge.position.set(0, 0.34, -0.21); hinge.rotation.x = -1.9; hinge.add(lid); g.add(hinge);
  g.add(rod([0.12, 0.25, 0], [0.2, 0.55, 0.05], 0.018, dark), box(0.16, 0.05, 0.05, ironBlack, 0.2, 0.57, 0.05));
  const saw = box(0.04, 0.32, 0.14, steel, -0.15, 0.42, 0); saw.rotation.z = 0.25; g.add(saw, box(0.05, 0.08, 0.06, dark, -0.2, 0.6, 0));
  return { g };
}

/** Every piece by its kind (the name a house's rules use: src/den-gravee.ts's FURNISH; a ship's deck:
    src/den-frigate.ts). */
export const FURNITURE = { rug, runner, chair, armchair, table, bed, candelabra, sconce, coffin, easel, frame, door, still, skeleton, skeletonChair, skeletalCannon, gibbet, armour, grandPiano, anchorChair, jar, toolChest };
