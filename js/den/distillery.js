// A distillery, as Puzzle Pirates' are (a timber distillery, a copper still in its yard, pipes, barrels):
// Helium's (helium-isle.js places it from src/den-helium.ts's HELIUM_CAST), and anyone's after. The user
// (13 Nov): "If you look up a distillery on Puzzle Pirates, I think [Helium] needs to have at least a bigger
// setup. That little object that blows up in the background is very tiny."
//
// Its front faces +z (toward you), standing on the ground at its origin, about 4 m across and its chimney
// near 7 m up, so it reads from the sea. The building: a stone plinth, plank walls open at the front, a
// shingled roof, a sign, a brick chimney smoking; inside, a smaller still, a rack of barrels, shelves of
// bottles. Its yard: the big copper pot still on its brick furnace (its head lifts off when it blows), the
// swan neck over to the worm tub and its coil, a pipe on a post out to the spout, the cask under the spout
// with a sight glass beside it, and the pile of full casks beside that.
//
// What it does (when is src/den-helium.ts's: worksFor, Cellar): `bang(size)` blows the still up (blast.js:
// the flash, the fireball, the smoke, copper, staves and shingles flying; the still shaking, its head flying
// off and landing back on, the copper sooted black and coming back); `pour(runs)` runs rum from the spout
// into the cask, each run a Cellar's, and a full cask is capped, tipped and rolled onto the pile (or off
// behind it, the pile full); `busy()` while it's pouring. Its still parts are baked (bake.js).
import * as THREE from 'three';
import { mat, mesh, woodTex, canvasTex, burst } from './world.js';
import { barrel } from './furniture.js';
import { bake } from './bake.js';
import { blast, blastTick, puff, readyBlasts } from './blast.js';
import { RUM, pileSpot } from '../den-helium.js';

const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const box = (w, h, d, m, x = 0, y = 0, z = 0) => at(mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z);
const cyl = (r0, r1, h, m, x = 0, y = 0, z = 0, n = 14, open = false) => at(mesh(new THREE.CylinderGeometry(r0, r1, h, n, 1, open), m), x, y, z);
const tube = (pts, r, m) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 28, r, 8), m);
const COPPER = '#c4743a', SOOT = new THREE.Color('#2a211c');

const shingles = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#6e3a2a'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) {
    for (let x = (y / 16) % 2 ? -8 : 0; x < w; x += 16) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,18,10' : '150,80,55'}, ${0.15 + Math.random() * 0.25})`;
      g.fillRect(x + 1, y + 1, 14, 14);
    }
    g.fillStyle = 'rgba(20,8,4,.55)'; g.fillRect(0, y + 14, w, 2);
  }
});
const signTex = canvasTex(256, 80, (g, w, h) => {
  g.fillStyle = '#3a2410'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c8a050'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
  g.fillStyle = '#f0c860'; g.font = '700 40px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('DISTILLERY', w / 2, h / 2 + 2);
});

/** A cask standing open under the spout (its rum's surface `rum`, its lid `lid` to drop on), its staves open
    at the top so you see it fill. */
function openCask(staves, hoops) {
  const g = new THREE.Group(), h = 0.95, r = h * 0.36;
  g.add(cyl(r * 0.88, r * 0.88, h, staves, 0, h / 2, 0, 16, true), cyl(r, r * 0.9, h * 0.5, staves, 0, h * 0.62, 0, 16, true), cyl(r * 0.9, r, h * 0.5, staves, 0, h * 0.25, 0, 16, true));
  g.add(cyl(r * 0.88, r * 0.88, 0.04, staves, 0, 0.04, 0, 16));
  for (const y of [0.08, 0.3, 0.7, 0.93]) g.add(cyl(r * (y > 0.2 && y < 0.8 ? 1.01 : 0.9), r * (y > 0.2 && y < 0.8 ? 1.01 : 0.9), 0.04, hoops, 0, h * y, 0, 16, true));
  const rum = mesh(new THREE.CircleGeometry(r * 0.86, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#b8641c' }), false);
  rum.visible = false; g.add(rum);
  const lid = cyl(r * 0.9, r * 0.9, 0.05, staves, 0, h + 0.4, 0, 16); lid.visible = false; g.add(lid);
  return { g, rum, lid, h, r };
}

export function distillery() {
  const g = new THREE.Group(), fixed = new THREE.Group();
  const copper = mat(COPPER, { metalness: 0.7, roughness: 0.35 }), pot = mat(COPPER, { metalness: 0.7, roughness: 0.35 });
  const brick = mat('#8a4a32', { roughness: 1 }), stone = mat('#8d8478', { roughness: 0.95 }), planks = mat('#6a4428', { map: woodTex }), dark = mat('#4a2c18', { map: woodTex });
  const roof = mat('#ffffff', { map: shingles, roughness: 0.9 }), staves = mat('#8a6238', { map: woodTex, side: THREE.DoubleSide }), hoops = mat('#3b3631', { metalness: 0.5, roughness: 0.6 });
  const brass = mat('#c9a13c', { metalness: 0.7, roughness: 0.35 }), glass = mat('#d4ecef', { transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false });
  const bottles = [mat('#2f6b3a', { roughness: 0.2 }), mat('#6a3a1c', { roughness: 0.2 })];
  g.add(fixed);

  // ---- the building ----
  fixed.add(box(4.4, 0.3, 3.2, stone, 0, 0.15, -0.2), box(4.1, 0.06, 2.9, dark, 0, 0.32, -0.2));
  fixed.add(box(4.1, 3.0, 0.15, planks, 0, 1.8, -1.6));
  for (const s of [-1, 1]) {
    fixed.add(box(0.15, 3.0, 2.9, planks, s * 2.0, 1.8, -0.2), box(0.2, 3.1, 0.2, dark, s * 2.0, 1.8, 1.25));
    // (the gable: a triangle of planks up to the ridge)
    const tri = new THREE.Shape([new THREE.Vector2(-1.65, 0), new THREE.Vector2(1.45, 0), new THREE.Vector2(-0.1, 1.15)]);
    const gable = mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.15, bevelEnabled: false }).rotateY(Math.PI / 2), planks);
    gable.position.set(s * 2.0 - 0.075, 3.3, 0); fixed.add(gable);
  }
  fixed.add(box(4.4, 0.22, 0.22, dark, 0, 3.3, 1.25), box(1.7, 1.1, 0.12, planks, 1.15, 0.85, 1.25));
  for (const [z, a] of [[0.7, 0.58], [-1.1, -0.58]]) { const r = box(4.7, 0.12, 2.35, roof, 0, 3.92, z); r.rotation.x = a; fixed.add(r); }
  const ridge = cyl(0.1, 0.1, 4.7, dark, 0, 4.55, -0.2, 8); ridge.rotation.z = Math.PI / 2; fixed.add(ridge);
  const sign = mesh(new THREE.PlaneGeometry(1.7, 0.53), mat('#ffffff', { map: signTex, roughness: 0.8 })); sign.position.set(-0.6, 2.85, 1.37); fixed.add(sign);
  // its chimney, through the roof at the back
  fixed.add(box(0.75, 7.0, 0.75, brick, 1.45, 3.5, -1.2), box(0.95, 0.18, 0.95, stone, 1.45, 7.05, -1.2));
  // inside: a smaller still, a rack of barrels, shelves of bottles, pipes along the back
  fixed.add(box(0.9, 0.45, 0.9, brick, -1.2, 0.55, -0.8));
  const small = mesh(new THREE.SphereGeometry(0.48, 16, 12), copper); small.position.set(-1.2, 1.2, -0.8); fixed.add(small);
  fixed.add(cyl(0.1, 0.22, 0.35, copper, -1.2, 1.75, -0.8), tube([[-1.2, 1.9, -0.8], [-0.8, 2.3, -1.2], [0.0, 2.4, -1.45], [0.9, 2.2, -1.45]], 0.04, copper));
  fixed.add(box(1.5, 0.12, 0.6, dark, 0.65, 0.55, -1.05));
  for (const x of [0.2, 0.65, 1.1]) { const b = barrel({ h: 0.75 }).g; b.rotation.x = Math.PI / 2; b.position.set(x, 0.86, -0.7); fixed.add(b); }
  for (const y of [1.5, 2.1]) {
    fixed.add(box(0.35, 0.05, 1.8, dark, -1.75, y, -0.4));
    for (let i = 0; i < 5; i++) fixed.add(cyl(0.05, 0.06, 0.28, bottles[i % 2], -1.75, y + 0.16, -1.1 + i * 0.35, 8));
  }

  // ---- the yard: the big still on its furnace ----
  const S = new THREE.Group(); S.position.set(-0.9, 0, 2.0); g.add(S);
  const still = new THREE.Group(); S.add(still);   // (what shakes)
  still.add(box(1.6, 0.8, 1.6, brick, 0, 0.4, 0), box(1.7, 0.08, 1.7, stone, 0, 0.82, 0));
  const fire = mesh(new THREE.BoxGeometry(0.55, 0.36, 0.05), new THREE.MeshBasicMaterial({ color: '#ff9a3a' }), false); fire.position.set(0, 0.32, 0.81); still.add(fire);
  const body = mesh(new THREE.SphereGeometry(0.85, 22, 16), pot); body.position.y = 1.6; body.scale.y = 0.95; still.add(body);
  for (const y of [1.25, 1.95]) { const band = mesh(new THREE.TorusGeometry(y < 1.5 ? 0.74 : 0.7, 0.03, 6, 28), brass); band.rotation.x = Math.PI / 2; band.position.y = y; still.add(band); }
  still.add(at(mesh(new THREE.CylinderGeometry(0.28, 0.62, 0.5, 18), pot), 0, 2.55, 0));
  const head = new THREE.Group(); head.position.y = 2.8; head.userData.live = true; still.add(head);   // (the head: blows off)
  const helmet = mesh(new THREE.SphereGeometry(0.36, 16, 12), pot); helmet.position.y = 0.25; helmet.scale.y = 1.1; head.add(helmet);
  head.add(at(mesh(new THREE.ConeGeometry(0.1, 0.3, 10), pot), 0, 0.72, 0), at(mesh(new THREE.SphereGeometry(0.06, 8, 6), brass), 0, 0.88, 0));
  // the swan neck, from the head over to the worm tub's coil; the tub; the pipe out to the spout on its post
  const T = [0.75, 0, 2.0];
  g.add(tube([[-0.55, 3.1, 2.0], [-0.1, 3.55, 2.0], [0.45, 3.2, 2.0], [0.75, 2.2, 2.0]], 0.07, copper));
  g.add(cyl(0.66, 0.72, 1.5, staves, T[0], 0.75, T[2], 18), cyl(0.6, 0.6, 0.02, mat('#4a6a6a', { roughness: 0.2 }), T[0], 1.49, T[2], 18));
  for (const y of [0.15, 0.75, 1.35]) g.add(cyl(0.73, 0.73, 0.05, hoops, T[0], y, T[2], 18, true));
  const coil = []; for (let i = 0; i <= 60; i++) { const a = i * 0.42; coil.push([T[0] + Math.cos(a) * 0.42, 1.5 + 0.7 - i * 0.012, T[2] + Math.sin(a) * 0.42]); }
  g.add(tube(coil, 0.045, copper));
  const STAND = 0.7, spout = new THREE.Vector3(0.1, STAND + 1.34, 4.0);   // (the cask up on a stillage, to be seen)
  g.add(tube([[T[0] - 0.3, 1.2, T[2] + 0.55], [0.45, 2.0, 3.0], [0.25, 2.2, 3.8], [spout.x, spout.y + 0.05, spout.z]], 0.05, copper));
  g.add(box(0.1, 2.15, 0.1, dark, 0.42, 1.07, 3.3), box(0.12, 0.1, 0.12, brass, spout.x, spout.y, spout.z));
  // the stillage the cask stands on: a plank top on four legs, a plank down to the pile
  fixed.add(box(1.0, 0.08, 0.9, dark, 0.0, STAND - 0.04, 4.05));
  for (const [x, z] of [[-0.42, 3.68], [0.42, 3.68], [-0.42, 4.42], [0.42, 4.42]]) fixed.add(box(0.08, STAND - 0.08, 0.08, dark, x, (STAND - 0.08) / 2, z));
  // the sight glass beside the cask, to read its fill: a glass tube on a little board, the rum in it
  const gauge = new THREE.Group(); gauge.position.set(-0.42, STAND, 4.4); g.add(gauge);
  gauge.add(box(0.2, 1.1, 0.05, dark, 0, 0.55, -0.04), cyl(0.065, 0.065, 0.9, glass, 0, 0.55, 0, 10), box(0.16, 0.06, 0.14, brass, 0, 0.08, 0), box(0.16, 0.06, 0.14, brass, 0, 1.02, 0));
  gauge.add(at(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), brass), 0.25, 0.1, 0));
  gauge.children.at(-1).rotation.z = Math.PI / 2;
  const level = mesh(new THREE.CylinderGeometry(0.052, 0.052, 1, 10).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: '#d98a2e' }), false);
  level.position.y = 0.1; level.scale.y = 0.001; level.userData.live = true; gauge.add(level);
  bake(fixed);
  readyBlasts();

  // ---- the cask under the spout, its stream, and the pile ----
  const cask = openCask(staves, hoops), CASK_AT = new THREE.Vector3(spout.x, STAND, spout.z);
  cask.g.position.copy(CASK_AT); g.add(cask.g);
  const stream = mesh(new THREE.CylinderGeometry(0.035, 0.03, 1, 6).translate(0, -0.5, 0), new THREE.MeshBasicMaterial({ color: '#d9862e', transparent: true, opacity: 0.9 }), false);
  stream.position.copy(spout).add(new THREE.Vector3(0, -0.05, 0)); stream.visible = false; g.add(stream);
  const PILE0 = new THREE.Vector3(0.95, 0, 3.4), across = cask.r * 2;
  const pile = Array.from({ length: RUM.PILE }, (_, i) => {
    const b = barrel({ h: cask.h }).g, [x, up] = pileSpot(i);
    b.rotation.x = Math.PI / 2;
    b.position.set(PILE0.x + x * across, PILE0.y + cask.r + up * across, PILE0.z - cask.h / 2);
    b.visible = false; g.add(b);
    return b;
  });

  // ---- what it does ----
  const st = { shake: 0, size: 1, pop: -1, soot: 0, flare: 0, smoke: 0, runs: [], run: null, fill: 0, piled: 0, roll: null, fresh: 0 };
  const w = new THREE.Vector3(), copperCol = new THREE.Color(COPPER);
  const o = {
    g, spout, ground: null,
    /** Where the cask under the spout is, in the world (for whoever tends it to look at). */
    caskAt: () => cask.g.getWorldPosition(new THREE.Vector3()),
    /** The still's head, in the world (where it blows). */
    headAt: () => head.getWorldPosition(new THREE.Vector3()),
    busy: () => !!st.run || st.runs.length > 0 || !!st.roll,
    /** The still blows up: `size` 1 an ordinary bang, 2 a big one. */
    bang(size = 1) {
      const p = o.headAt().add(new THREE.Vector3(0, 0.3, 0));
      blast(p, size, {
        bits: [{ mat: copper, n: 9, w: 0.36, h: 0.05, d: 0.28 }, { mat: staves, n: 6, w: 0.12, h: 0.05, d: 0.7 }, { mat: roof, n: 4, w: 0.4, h: 0.04, d: 0.3 }],
        ground: o.ground ?? (() => 0),
      });
      st.shake = 1.4; st.size = size; st.pop = 0; st.soot = 1; st.flare = 1.2;
      // (the chimney coughs)
      g.updateMatrixWorld();
      for (let i = 0; i < 6; i++) puff(fixed.localToWorld(new THREE.Vector3(1.45, 7.3, -1.2)), { size: 1.1, life: 5, rise: 1.6, dark: 0.9, delay: 0.2 + i * 0.12 });
    },
    /** Rum: the runs (src/den-helium.ts's Cellar.pour), poured in turn. */
    pour(runs) { st.runs.push(...runs); },
    /** Back to an empty cask and no pile (a fresh voyage). */
    reset() { st.runs = []; st.run = null; st.roll = null; st.fill = 0; st.piled = 0; pile.forEach((b) => { b.visible = false; }); setFill(0); cask.lid.visible = false; cask.g.position.copy(CASK_AT); cask.g.rotation.set(0, 0, 0); cask.g.scale.setScalar(1); },
    tick(dt) {
      blastTick();
      const now = performance.now() / 1000;
      // the furnace's fire, flaring after a bang; the chimney's smoke
      fire.scale.set(1 + st.flare * 0.6, 0.7 + Math.sin(now * 11) * 0.12 + st.flare * 1.2, 1);
      st.flare = Math.max(0, st.flare - dt);
      if ((st.smoke -= dt) <= 0) { st.smoke = 0.55; puff(fixed.localToWorld(w.set(1.45, 7.2, -1.2)), { size: 0.7, life: 4.5, rise: 0.9, dark: 0.25 }); }
      // the bang: the still shaking hard, its head blown off and coming down on it again, the copper sooted
      if (st.shake > 0) {
        st.shake -= dt;
        const k = Math.max(0, st.shake) / 1.4 * 0.09 * st.size;
        still.position.set((Math.random() - 0.5) * k, Math.abs(Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
        still.rotation.set((Math.random() - 0.5) * k * 1.5, 0, (Math.random() - 0.5) * k * 1.5);
        if (st.shake <= 0) { still.position.set(0, 0, 0); still.rotation.set(0, 0, 0); }
      }
      if (st.pop >= 0) {
        const T = 1.6 + 0.4 * st.size, u = Math.min(1, (st.pop += dt) / T), up = 3.2 * st.size * 4 * u * (1 - u);
        head.position.set(Math.sin(u * Math.PI) * 0.6, 2.8 + up, 0);
        head.rotation.set(u * Math.PI * 4, 0, u * Math.PI * 2);
        if (u >= 1) {
          // (it lands back on, wobbling a moment)
          const wob = st.pop - T;
          head.rotation.set(Math.sin(wob * 30) * 0.25 * Math.max(0, 1 - wob * 2.5), 0, 0);
          head.position.set(0, 2.8, 0);
          if (wob > 0.4) { st.pop = -1; head.rotation.set(0, 0, 0); }
        }
      }
      if (st.soot > 0) { st.soot = Math.max(0, st.soot - dt / 9); pot.color.copy(copperCol).lerp(SOOT, Math.min(1, st.soot * 1.4)); }
      tickRum(dt);
    },
  };
  function setFill(f) {
    st.fill = f;
    const k = f / RUM.CASK;
    level.scale.y = Math.max(0.001, k * 0.85);
    cask.rum.visible = f > 0;
    cask.rum.position.y = 0.08 + k * 0.8;
  }
  function tickRum(dt) {
    if (st.fresh > 0) { st.fresh = Math.max(0, st.fresh - dt); cask.g.scale.setScalar(1 - st.fresh / 0.35); }
    if (st.roll) { rolling(dt); return; }
    if (!st.run && st.runs.length) st.run = st.runs.shift();
    const R = st.run;
    stream.visible = !!R && st.fresh <= 0;
    if (!R || st.fresh > 0) return;
    const f = Math.min(R.to, st.fill + RUM.RATE * dt);
    setFill(f);
    stream.scale.y = Math.max(0.05, spout.y - 0.05 - (CASK_AT.y + cask.rum.position.y));
    if (Math.random() < dt * 8) burst(o.caskAt().add(new THREE.Vector3(0, cask.rum.position.y + 0.05, 0)), '#e09a3a', 1, 0.8);
    if (f < R.to) return;
    st.run = null;
    if (R.full) { stream.visible = false; st.roll = { t: 0, onPile: R.onPile, slot: st.piled }; if (R.onPile) st.piled++; }
  }
  // A full cask: capped, tipped on its side, rolled to its place on the pile (or off behind it); a fresh one
  // put under the spout.
  function rolling(dt) {
    const r = st.roll, t = (r.t += dt);
    const CAP = 0.35, TIP = 0.75, ROLL = 2.0;
    if (t < CAP) { cask.lid.visible = true; cask.lid.position.y = cask.h + 0.4 * (1 - t / CAP); return; }
    cask.lid.position.y = cask.h;
    if (t < TIP) { cask.g.rotation.x = (t - CAP) / (TIP - CAP) * Math.PI / 2; cask.g.position.y = CASK_AT.y + cask.r * Math.sin(cask.g.rotation.x); return; }
    const target = r.onPile ? pile[r.slot].position : new THREE.Vector3(2.7, cask.r, 2.9);
    const from = new THREE.Vector3(CASK_AT.x, CASK_AT.y + cask.r, CASK_AT.z), u = Math.min(1, (t - TIP) / ROLL), e = u * u * (3 - 2 * u);
    cask.g.position.lerpVectors(from, target, e).add(new THREE.Vector3(0, Math.sin(e * Math.PI) * 0.35, 0));
    cask.g.rotation.set(Math.PI / 2, 0, 0);
    cask.g.rotateY(-e * (target.x - from.x) / cask.r);   // (rolling along)
    if (!r.onPile) cask.g.scale.setScalar(Math.max(0.01, 1 - Math.max(0, u - 0.7) / 0.3));
    if (u < 1) return;
    if (r.onPile) pile[r.slot].visible = true;
    st.roll = null;
    cask.lid.visible = false;
    cask.g.position.copy(CASK_AT); cask.g.rotation.set(0, 0, 0);
    setFill(0);
    st.fresh = 0.35;
  }
  return o;
}
