// Swordfight at the armoury hoist: the soldiers it musters, the lumber and the wall repairs.
// (Split out of den.js.)
import * as THREE from 'three';
import { randomPair, W as SW, H as SH, ENTRY as SENTRY } from '../swordfight.js';
import { muster, planRepair, rewardPair, waitSpot, Lumber, REPAIR, SwordRack, Barracks, SWORD } from '../den-sword.js';
import { drawStencil, drawBlade, PALETTE } from '../den-sword-draw.js';
import { C, S, rand, $, scene, mat, mesh, canvasTex, woodTex, makePirate, animateWalk, faceTo, pirate, carry, bounds, G, keys, raiders, burst, toast, tween } from './world.js';
import { wall, rest, updateHole, barFrac, plankMat, putPiece, strengthen, holeX } from './wall.js';
import { hit, passable, doorX } from './raids.js';
import { shoreZ } from './bilge.js';
import { towerLegs } from './land.js';
import { online, myId, say } from './crew.js';

// ---------- Swordfight: soldiers to hold the breaches ----------
/* Another way to fight the raids, there alongside mending the wall and the gun tower: the user wants
   "attackers are coming and you just choose which ways to deal with them". Each raider beaten (knocked
   flat, or turned away at the wall) drops a sword piece, a Swordfight pair, that lands inside the
   den; walk over it to pick it up. At the sword rack you play them on a real Swordfight board, and
   what a break would send at an opponent musters soldiers instead, who go for the raiders in the den
   and stand in the gaps in the wall, and go out through the gate to the raiders on the beach (the
   user, 10 Nov: "you're just going to sit there and let them attack, hack at the wall?"). Raiders who get in while you're at the board bury it in
   sprinkles, as an opponent's attacks would. (Playing alone only, for now: with a crew the rack
   isn't there.)
   The rules and the soldiers are src/den-sword.ts (SwordRack, Barracks), the looks
   src/den-sword-draw.ts, the puzzle src/swordfight.ts; here, only the 3D and the wiring to the raid. */
const SWORD_DROPS = 12;
export const rack = new SwordRack(), barracks = new Barracks();
/* The armoury stack (8 Nov): the board is a real stack of weapon crates against the left of the den,
   under a timber hoist, at the den's own scale. The user, of the board on a sign before it: "it just
   feels like it's been forced in. There's nothing natural looking about it". Each pair is lowered on
   the hoist's rope, and turns on it; the crates you've brought wait on a landing at the top. The
   stack faces into the den (its group is turned a quarter), so from the usual view it's side on and
   hides nothing; at the winch the camera turns to face it. Layout in the group's own terms: column c
   at x = (c - W/2 + 0.5) * CR, row r at y = y0 + (r + 0.5) * CR, the crates' fronts towards +z. */
const CR = 0.45, CRATE = 0.41;
// The armoury's shelves: a pair's spot along a shelf, and each shelf's height (the top one's where the
// old landing was, the rest below it).
const SHELF_DX = 0.29, SHELF_DY = 0.62;
const shelfY = (i) => 0.14 + SH * CR - 2 * CR + 0.13 - i * SHELF_DY;
export const sword = {
  on: false, dirty: true, drops: [], figures: new Map(), x: -10, z: 3.2, y0: 0.14, w: SW * CR, h: SH * CR,
  group: new THREE.Group(), crates: new Map(), pair: null, pairKey: null, next: new THREE.Group(), nextKey: '',
  rope: null, trolley: null, drum: null, top: 0,
};
sword.top = sword.y0 + sword.h + 0.75;
const cellAt = (r, c, v = new THREE.Vector3()) => v.set((c - SW / 2 + 0.5) * CR, sword.y0 + (r + 0.5) * CR, 0);
// What goes on the crates: painted swords, bare blades, the crates' wood, the iron bands. Made once.
const crateLook = { stencil: {}, faded: {}, blade: {}, wood: {}, box: new THREE.BoxGeometry(CRATE, CRATE, CRATE), plane: new THREE.PlaneGeometry(1, 1) };
{
  const tex = (draw) => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; draw(cv); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  for (const c of [0, 1, 2, 3]) {
    crateLook.stencil[c] = new THREE.MeshStandardMaterial({ map: tex((cv) => drawStencil(cv, c)), transparent: true, roughness: 0.6, depthWrite: false });
    crateLook.faded[c] = new THREE.MeshStandardMaterial({ map: tex((cv) => drawStencil(cv, c, true)), transparent: true, roughness: 0.6, depthWrite: false });
    crateLook.blade[c] = new THREE.MeshBasicMaterial({ map: tex((cv) => drawBlade(cv, c)), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
    crateLook.wood[c] = mat(PALETTE[c].base, { map: woodTex, roughness: 0.65 });
  }
  crateLook.grey = mat('#9a9690', { map: woodTex, roughness: 0.8 });
  crateLook.iron = mat('#3b3d42', { metalness: 0.7, roughness: 0.45 });
  crateLook.brass = mat('#c8a050', { metalness: 0.8, roughness: 0.35 });
}
// One crate (w by h squares: a fused block is one big chest), or a breaker's bare blade. Geometry
// that isn't shared is marked so crateGone frees it.
function armsCrate(g, w = 1, h = 1) {
  const grp = new THREE.Group(), bw = w * CR - (CR - CRATE), bh = h * CR - (CR - CRATE);
  const own = (geo) => { geo.userData.own = true; return geo; };
  if (g.breaker && !g.grey) {
    const blade = new THREE.Mesh(crateLook.plane, crateLook.blade[g.c]);
    blade.scale.set(CR * 1.05, CR * 1.05, 1);
    blade.renderOrder = 2;
    grp.add(blade);
    return grp;
  }
  const box = mesh(w === 1 && h === 1 ? crateLook.box : own(new THREE.BoxGeometry(bw, bh, CRATE)), g.grey === 2 ? crateLook.grey : crateLook.wood[g.c]);
  grp.add(box);
  if (g.grey !== 2) {
    const s = Math.min(bw, bh) * 0.92;
    const face = new THREE.Mesh(crateLook.plane, g.grey ? crateLook.faded[g.c] : crateLook.stencil[g.c]);
    face.scale.set(s, h > w ? Math.min(bh * 0.92, s * 1.6) : s, 1);
    face.position.z = CRATE / 2 + 0.003;
    grp.add(face);
  }
  if (g.grey) for (const y of [-0.3, 0.3]) {   // nailed shut: iron bands round it
    const band = mesh(own(new THREE.BoxGeometry(bw + 0.012, 0.035, CRATE + 0.012)), crateLook.iron, false);
    band.position.y = y * bh;
    grp.add(band);
  }
  if (w > 1 || h > 1) for (const sx of [-1, 1]) for (const sy of [-1, 1]) {   // a chest: brass corners
    const k = mesh(own(new THREE.BoxGeometry(0.1, 0.1, CRATE + 0.014)), crateLook.brass, false);
    k.position.set(sx * (bw / 2 - 0.04), sy * (bh / 2 - 0.04), 0);
    grp.add(k);
  }
  return grp;
}
export const crateSig = (g) => `${g.c}${g.breaker && !g.grey ? 'b' : ''}${g.grey || ''}`;
function crateGone(m) { m.parent?.remove(m); m.traverse((o) => { if (o.geometry?.userData.own) o.geometry.dispose(); }); }
{
  // The hoist: two posts and a beam over the stack, plank backing, a plinth, a winch, a trolley and
  // rope, and the landing the crates wait on.
  const grp = sword.group, { w, h, y0, top } = sword, beam = mat('#5a3a22', { map: woodTex, roughness: 0.9 }), dark = mat('#3e2716', { map: woodTex, roughness: 1 });
  const add = (geo, m, x, y, z, shadow = true) => { const o = mesh(geo, m, shadow); o.position.set(x, y, z); grp.add(o); return o; };
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.18, top + 0.1, 0.18), beam, sx * (w / 2 + 0.13), (top + 0.1) / 2, 0);
    add(new THREE.BoxGeometry(0.36, 0.12, 0.6), dark, sx * (w / 2 + 0.13), 0.06, 0.05);   // its foot
    const knee = add(new THREE.BoxGeometry(0.1, 0.7, 0.1), beam, sx * (w / 2 - 0.1), top - 0.28, 0);
    knee.rotation.z = sx * 0.75;
  }
  add(new THREE.BoxGeometry(w + 0.9, 0.2, 0.24), beam, 0, top + 0.05, 0);
  add(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.06), dark, 0, y0 + h / 2, -CRATE / 2 - 0.05);
  for (let i = 1; i < 4; i++) add(new THREE.BoxGeometry(w + 0.1, 0.1, 0.05), beam, 0, y0 + h * i / 4, -CRATE / 2 - 0.01, false);
  add(new THREE.BoxGeometry(w + 0.36, y0, CRATE + 0.2), beam, 0, y0 / 2, 0.05);
  // The top of the fourth column, where the crates come in: red warning stripes painted on the
  // planks. Stack up to it and you've lost.
  const stripesTex = canvasTex(64, 128, (x, w, h) => {
    x.strokeStyle = '#c0301e'; x.lineWidth = 9;
    for (let i = -h; i < w + h; i += 22) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h * 0.5, h); x.stroke(); }
    x.lineWidth = 5; x.strokeRect(2.5, 2.5, w - 5, h - 5);
  });
  const warn = add(new THREE.PlaneGeometry(CR, CR * 2), new THREE.MeshStandardMaterial({ map: stripesTex, transparent: true, opacity: 0.7, roughness: 1 }), cellAt(0, SENTRY).x, y0 + (SH - 1) * CR, -CRATE / 2 - 0.015, false);
  warn.receiveShadow = false;
  // The winch on the near post, where you stand to work it.
  sword.drum = add(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 12), beam, -w / 2 - 0.13, 1.0, 0.3);
  sword.drum.rotation.x = Math.PI / 2;
  const crank = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.28), crateLook.iron);
  crank.position.set(0, 0.17, 0.12); sword.drum.add(crank);
  // The trolley along the beam, and its rope.
  sword.trolley = add(new THREE.BoxGeometry(0.3, 0.14, 0.34), crateLook.iron, 0, top - 0.12, 0);
  sword.rope = add(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), mat('#c9b48a', { roughness: 1 }), 0, 0, 0, false);
  // The shelves at the right, where the crates you've dropped off wait their turn, the top one
  // next down; they fill up shelf by shelf as you bring more (the user, 9 Nov: "you should see the
  // collection really building up").
  const shelves = SWORD.STORE / SWORD.SHELF, sw = SWORD.SHELF * SHELF_DX + 0.14, sx0 = w / 2 + 0.23 + sw / 2 - 0.07;
  for (let i = 0; i < shelves; i++) add(new THREE.BoxGeometry(sw, 0.07, CRATE + 0.1), beam, sx0, shelfY(i) - 0.17, 0);
  const postH = shelfY(0) - 0.13;
  add(new THREE.BoxGeometry(0.1, postH, 0.1), beam, sx0 + sw / 2 + 0.02, postH / 2, 0);
  add(new THREE.BoxGeometry(0.3, 0.1, 0.5), dark, sx0 + sw / 2 + 0.02, 0.05, 0);
  grp.add(sword.next);
  grp.rotation.y = Math.PI / 2;
  scene.add(grp);
}
export const swordHere = () => !online() && !G.over;
// At the winch: in front of the stack, near it.
const nearHoist = () => swordHere() && pirate.h < 0.05 && pirate.x - sword.x > -0.5 && pirate.x - sword.x < 3.2 && Math.abs(pirate.z - sword.z) < sword.w / 2 + 1.6;
export const atSword = () => swordHere() && pirate.h < 0.05 && pirate.x - sword.x > 0.3 && pirate.x - sword.x < 2.4 && Math.abs(pirate.z - sword.z) < sword.w / 2 + 0.9;
// Where the winch is, in the den's terms.
const winchAt = () => ({ x: sword.x + 0.3, z: sword.z + sword.w / 2 + 0.13 });

/* The stack's crates, kept in step with the stack as it stands (the board now, or as it stood
   before a link of a chain broke: see swordBreak): one per piece (a fused block, one chest), falling
   to where it now sits; a crate broken smashes where it was. */
function stackSync(snap = rack.board.snap()) {
  const live = new Map(), here = new Set(snap.map((p) => p.g)), boxes = new Map();
  for (const p of snap) {
    if (p.fuse === undefined) { live.set(p.g, { g: p.g, gems: [p.g], at: cellAt(p.r, p.c), sig: crateSig(p.g) }); continue; }
    const b = boxes.get(p.fuse);
    if (!b) boxes.set(p.fuse, { g: p.g, gems: [p.g], r0: p.r, c0: p.c, r1: p.r, c1: p.c });
    else { b.gems.push(p.g); b.r0 = Math.min(b.r0, p.r); b.c0 = Math.min(b.c0, p.c); b.r1 = Math.max(b.r1, p.r); b.c1 = Math.max(b.c1, p.c); }
  }
  for (const [id, b] of boxes) {
    const w = b.c1 - b.c0 + 1, h = b.r1 - b.r0 + 1;
    const at = cellAt(b.r0, b.c0).add(new THREE.Vector3((w - 1) * CR / 2, (h - 1) * CR / 2, 0));
    live.set('f' + id, { g: b.g, gems: b.gems, at, sig: `${crateSig(b.g)}${w}x${h}`, w, h });
  }
  for (const [key, m] of sword.crates) {
    const L = live.get(key);
    if (L && L.sig === m.userData.sig) continue;
    // Gone from the stack altogether: broken open, so it smashes. (Otherwise it's joined a chest, or
    // changed look, and a new one takes its place.)
    if (m.userData.gems.every((g) => !here.has(g))) smash(m);
    crateGone(m); sword.crates.delete(key);
  }
  for (const [key, L] of live) {
    let m = sword.crates.get(key);
    if (!m) {
      m = armsCrate(L.g, L.w, L.h);
      Object.assign(m.userData, { sig: L.sig, c: L.g.c, big: !!L.w, grey: !!L.g.grey, blade: !!L.g.breaker && !L.g.grey, gems: L.gems });
      m.position.copy(L.at);
      sword.group.add(m);
      sword.crates.set(key, m);
    }
    m.userData.to = L.at;
    m.userData.doomed = false;
  }
  // The crates waiting on the shelves, every one of them, the next down first.
  const nk = rack.queue.map((p) => p.map(crateSig).join('')).join('|');
  if (nk !== sword.nextKey) {
    sword.nextKey = nk;
    [...sword.next.children].forEach(crateGone);
    rack.queue.forEach((pair, i) => pair.forEach((p, j) => {
      const m = armsCrate({ c: p.c, breaker: p.breaker });
      m.scale.setScalar(0.62);
      m.position.set(sword.w / 2 + 0.37 + (i % SWORD.SHELF) * SHELF_DX, shelfY(Math.floor(i / SWORD.SHELF)) + j * 0.27, 0);
      sword.next.add(m);
    }));
  }
}
// The pair on the rope: crates made when it comes in, moved smoothly to where the board has it.
function pairSync(dt) {
  const b = rack.board, f = b.falling;
  if ((f?.pair || null) !== sword.pairKey) {
    if (sword.pair) crateGone(sword.pair);
    sword.pair = null; sword.pairKey = f?.pair || null;
    if (f) {
      sword.pair = new THREE.Group();
      sword.pair.userData.parts = f.pair.map((p) => { const m = armsCrate({ c: p.c, breaker: p.breaker }); sword.pair.add(m); return m; });
      const cells = b.fallingCells();
      cellAt(...cells[0], sword.pair.position);
      cells.forEach(([r, c], i) => sword.pair.userData.parts[i].position.copy(cellAt(r, c).sub(sword.pair.position)));
      sword.group.add(sword.pair);
    }
  }
  const k = Math.min(1, dt * 14);
  let hookY = sword.top - 0.7, hookX = sword.trolley.position.x;
  if (f) {
    const cells = b.fallingCells(), base = cellAt(...cells[0]);
    sword.pair.position.lerp(base, k);
    cells.forEach(([r, c], i) => sword.pair.userData.parts[i].position.lerp(cellAt(r, c).sub(base), k));
    // The rope comes down to the top of the pair, over its middle.
    const parts = sword.pair.userData.parts.map((m) => m.position.clone().add(sword.pair.position));
    hookX = (parts[0].x + parts[1].x) / 2;
    hookY = Math.max(parts[0].y, parts[1].y) + CRATE / 2;
  }
  sword.trolley.position.x += (hookX - sword.trolley.position.x) * k;
  const y1 = sword.top - 0.2, len = Math.max(0.05, y1 - hookY);
  sword.rope.scale.y = len;
  sword.rope.position.set(sword.trolley.position.x, y1 - len / 2, 0);
  sword.rope.visible = len > 0.06;
  if (f) sword.drum.rotation.y += 1.5 * dt;
  // The stack's crates drop into gaps under them as things do, faster and faster; the ones about to
  // break shake and swell first.
  const now = performance.now() / 1000;
  for (const m of sword.crates.values()) {
    const u = m.userData, to = u.to;
    if (!to) continue;
    if (m.position.y > to.y + 0.002) {
      u.vy = (u.vy || 0) - 22 * dt;
      m.position.y = Math.max(to.y, m.position.y + u.vy * dt);
    } else { m.position.y = to.y; u.vy = 0; }
    m.position.x += (to.x - m.position.x) * Math.min(1, dt * 14);
    m.position.z = to.z;
    if (u.doomed) {
      m.position.x = to.x + Math.sin(now * 70) * 0.025;
      m.scale.setScalar(1 + 0.1 * Math.abs(Math.sin(now * 16)));
    } else if (m.scale.x !== 1) m.scale.setScalar(1);
  }
}
const stackStill = () => [...sword.crates.values()].every((m) => !m.userData.to || m.position.y <= m.userData.to.y + 0.002);
/* A crate broken open: it bursts into planks that fly off and fall away, with a puff of its colour
   (a breaker, being a bare blade, just flashes). */
function smash(m) {
  const at = m.getWorldPosition(new THREE.Vector3()), u = m.userData;
  burst(at, PALETTE[u.c].light, u.blade ? 14 : u.big ? 22 : 8, 3);
  if (u.blade) return;
  const plank = crateLook.plank ||= new THREE.BoxGeometry(CRATE * 0.95, CRATE * 0.2, 0.04);
  const n = u.big ? 12 : 5, look = u.grey ? crateLook.grey : crateLook.wood[u.c], spread = u.big ? CR : CR / 2;
  for (let i = 0; i < n; i++) {
    const s = mesh(plank, look, false);
    const p0 = at.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread));
    const v = p0.clone().sub(at).setY(0).normalize().multiplyScalar(1.2 + Math.random() * 1.6);
    v.y = 1.5 + Math.random() * 2;
    const spin = new THREE.Vector3(Math.random() * 14 - 7, Math.random() * 14 - 7, Math.random() * 14 - 7), r0 = new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    s.position.copy(p0);
    s.rotation.copy(r0);
    scene.add(s);
    const life = 0.7 + Math.random() * 0.3;
    tween(life, (k) => {
      const t = k * life;
      s.position.set(p0.x + v.x * t, p0.y + v.y * t - 6 * t * t, p0.z + v.z * t);
      s.rotation.set(r0.x + spin.x * t, r0.y + spin.y * t, r0.z + spin.z * t);
      s.scale.setScalar(k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3);
    }, () => scene.remove(s));
  }
}
/* A pair lands: if it breaks anything, the chain plays out a link at a time (the user, 8 Nov: "it
   needs the breaking animation, not just to magically break"). The stack as it stood before each
   link: what's about to break shakes, then smashes, and what was on it drops into the gap. Only when
   it's all done does the break send its soldiers and planks. No new pair comes in meanwhile. */
const BREAK_HOLD = 0.4;   // seconds the doomed crates shake before they go
export function swordBreak(res) {
  if (!res.links.length) return swordLanded(res);
  sword.show = { states: res.links.map((l) => l.before), i: -1, t: 0, res };
}
function showTick(dt) {
  const S = sword.show;
  if (S.i >= 0 && !(stackStill() && (S.t += dt) >= BREAK_HOLD)) return;
  S.i++; S.t = 0;
  if (S.i >= S.states.length) { sword.show = null; swordLanded(S.res); return; }
  stackSync(S.states[S.i]);
  const next = new Set((S.states[S.i + 1] || rack.board.snap()).map((p) => p.g));
  for (const m of sword.crates.values()) m.userData.doomed = m.userData.gems.every((g) => !next.has(g));
}

// A beaten raider's weapons: a pair of crates flies over (or across) the den and lands on the floor inside.
const cratePair = (pair) => {
  const g = new THREE.Group();
  pair.forEach((p, i) => { const m = armsCrate({ c: p.c, breaker: p.breaker }); m.position.y = (i + 0.5) * CR; g.add(m); });
  g.scale.setScalar(0.6);
  return g;
};
export function swordDrop(r, pair = randomPair()) {
  if (!swordHere()) return;
  const g = cratePair(pair);
  const from = new THREE.Vector3(r.x, 1.4, r.z);
  const to = new THREE.Vector3(Math.max(-bounds.x + 0.8, Math.min(bounds.x - 0.8, r.x + (Math.random() - 0.5) * 2)), 0, r.inside ? Math.max(1.4, Math.min(bounds.z1 - 0.8, r.z)) : 1.6 + Math.random() * 1.6);
  g.position.copy(from);
  scene.add(g);
  const d = { pair, g, x: to.x, z: to.z, landed: false, t: Math.random() * 6 };
  sword.drops.push(d);
  if (sword.drops.length > SWORD_DROPS) dropGone(sword.drops.shift());
  const arc = r.inside ? 1.5 : wall.H * S + 1.2;
  tween(r.inside ? 0.6 : 1, (s) => { g.position.lerpVectors(from, to, s); g.position.y += Math.sin(s * Math.PI) * arc; }, () => { d.landed = true; });
  if (!G.swordSaid) { G.swordSaid = true; say('Weapons! Pick up the crates and take them to the armoury hoist', false, true); }
}
function dropGone(d) { crateGone(d.g); }
/* A Masterpiece's reward: a pair with a breaker in it, flown from where you earned it straight to
   the armoury's top shelf, the next to come down (or onto the floor by you, if the shelves are full).
   The user (8 Nov): gold for a Masterpiece "is fairly meaningless ... getting a reward like some
   breakers would be a lot better than gold". The gold is still paid: it's what the raiders steal. */
export function swordReward(from, what) {
  if (!swordHere()) return;
  const pair = rewardPair(), g = cratePair(pair);
  const to = sword.group.localToWorld(new THREE.Vector3(sword.w / 2 + 0.37, shelfY(0), 0));
  g.position.copy(from);
  scene.add(g);
  tween(1.4, (t) => { g.position.lerpVectors(from, to, t); g.position.y += Math.sin(t * Math.PI) * 2.5; g.rotation.y = t * 7; }, () => {
    crateGone(g);
    if (rack.give(pair)) {
      sword.dirty = true;
      burst(to, PALETTE[pair[1].c].light, 12, 2.5);
      say(`A breaker for your ${what}! It's next down at the armoury hoist`, false, true);
    } else {
      swordDrop({ x: pirate.x, z: pirate.z, inside: true }, pair);
      say(`A breaker for your ${what}! (The armoury's shelves are full: it's on the floor by you)`, false, true);
    }
  });
}

export function swordEnter() {
  sword.on = true;
  keys.clear();
  const w = winchAt();
  Object.assign(pirate, { x: w.x + 0.2, z: w.z + 0.5 });   // beside the winch, clear of the stack
  pirate.g.rotation.y = Math.atan2(w.x - pirate.x, w.z - pirate.z);
  $('intro').classList.add('off');
}

// At the rack the keys play the board, as in the real puzzle: left and right move, up and down turn.
export function swordKey(key, e) {
  if (key === 'escape') { sword.on = false; return true; }
  const moves = { arrowleft: () => rack.move(-1), a: () => rack.move(-1), arrowright: () => rack.move(1), d: () => rack.move(1), arrowup: () => rack.turn(-1), w: () => rack.turn(-1), q: () => rack.turn(-1), arrowdown: () => rack.turn(1), s: () => rack.turn(1), e: () => rack.turn(1) };
  if (moves[key]) { moves[key](); sword.dirty = true; return true; }
  if (key === ' ' || key === 'enter') { const res = !e.repeat && !sword.show && rack.drop(); if (res) swordBreak(res); return true; }
  return key === 'tab';
}
const CHAINS = ['', '', 'Double! ', 'Triple! ', 'Bingo! ', 'Donkey! ', 'Vegas! '];
/* A break: chests of swords (fused blocks) arm soldiers, who come out from the stack; loose crates
   (sprinkles) are broken up for planks, thrown onto the lumber pile by the hoist, and every
   REPAIR.CRATES crates' worth mends a piece of a hole for good (repairAll). */
function swordLanded(res) {
  sword.dirty = true;
  if (!res.links.length) return;
  const name = CHAINS[Math.min(res.links.length, 6)], recruits = muster(res);
  const came = barracks.enlist(recruits, sword.x + 0.9, sword.z);
  came.forEach(addFigure);
  const n = toLumber(res.sprinkles);
  const bits = [];
  if (came.length) bits.push(`${came.length === 1 ? 'a soldier' : `${came.length} soldiers`} armed`);
  else if (recruits.length) bits.push(`the barracks are full (${barracks.cap} soldiers at most)`);
  if (n) bits.push(`${n} crate${n > 1 ? 's' : ''} broken up for planks${lumber.ready ? ': enough to mend a piece of the wall' : ` (${lumber.crates} of ${REPAIR.CRATES} to mend a piece of the wall)`}`);
  const msg = bits.join(', ') || 'broken, but too few to send anything: break a chest (2x2 or bigger) for soldiers, or loose crates in twos for planks';
  say(`${name}${msg[0].toUpperCase()}${msg.slice(1)}!`);
}
/* The lumber pile, at the foot of the hoist on the wall side: loose crates broken on the stack are
   thrown onto it as planks, and once there's a piece's worth it's nailed into the hole that needs
   it most (planRepair: the gap raiders can walk through first; lowest down; leaving the rest of the
   hole finishable as a Masterpiece). The user (8 Nov), on the barricades this replaced: "maybe you
   have to do a certain number and it actually fills in a hole a bit ... more of like a permanent
   wall repair for sprinkling." */
export const lumber = new Lumber();
const pileAt = () => new THREE.Vector3(sword.x + 0.15, 0, sword.z - sword.w / 2 - 0.5);
export function toLumber(n) {
  if (!n) return 0;
  lumber.add(n);
  const from = new THREE.Vector3(sword.x, sword.top - 0.4, sword.z), to = pileAt().add(new THREE.Vector3(0, 0.3, 0));
  sword.inFlight = (sword.inFlight || 0) + n;
  for (let j = 0; j < n; j++) {
    const c = rand(4), m = armsCrate({ c });
    Object.assign(m.userData, { c, gems: [] });
    m.scale.setScalar(0.8);
    m.position.copy(from);
    scene.add(m);
    tween(0.7 + j * 0.12, (t) => { m.position.lerpVectors(from, to, t); m.position.y += Math.sin(t * Math.PI) * 1.2; m.rotation.x = t * 5; }, () => {
      smash(m);   // broken up for planks
      crateGone(m);
      sword.inFlight--;
      pileShow();
      if (!sword.inFlight) repairAll();
    });
  }
  return n;
}
// The pile: each crate's planks two by two, crossed over the last, like a stack of timber.
function pileShow() {
  const n = Math.max(0, lumber.crates - (sword.inFlight || 0));
  if (!sword.pile) { sword.pile = new THREE.Group(); scene.add(sword.pile); }
  sword.pile.position.copy(pileAt());
  const kids = sword.pile.children, geo = crateLook.board ||= new THREE.BoxGeometry(0.72, 0.07, 0.16);
  while (kids.length > n * 2) sword.pile.remove(kids[kids.length - 1]);
  while (kids.length < n * 2) {
    const i = kids.length, layer = Math.floor(i / 2), b = mesh(geo, plankMat);
    b.position.set(0, 0.04 + layer * 0.072, 0);
    b.rotation.y = (layer % 2 ? Math.PI / 2 : 0) + (Math.random() - 0.5) * 0.15;
    b.translateZ((i % 2 ? 1 : -1) * 0.15);
    sword.pile.add(b);
  }
  sword.pile.visible = swordHere();
}
// A hole as the repairs see it. Only open holes with nothing on its way in and no boards behind.
const mendOf = (h) => ({
  rest: h.status === 'open' && !h.busy && !h.pieces.some((p) => p.patch) ? rest(h) : [],
  open: passable(h), attackers: h.attackers || 0, strength: Math.max(0, Math.min(1, barFrac(h))),
});
export function repairAll() {
  if (!swordHere()) return;
  while (lumber.ready) {
    const plan = planRepair(wall.holes.map(mendOf), C);
    if (!plan) break;
    lumber.use();
    repair(wall.holes[plan.hole], plan.piece);
  }
  pileShow();
}
// A piece's worth of planks, flown from the pile and nailed in, as if you'd fitted it.
function repair(h, pc) {
  const b = C.bbox(pc.cells);
  const info = { letter: pc.letter, shape: C.normalize(pc.cells), dr: b.r0, dc: b.c0, over: 0, patch: false, layer: 0, by: myId(), planks: true };
  const piece = putPiece(h, info), g = piece.group, to = piece.base.clone(), from = pileAt().add(new THREE.Vector3(-b.w * S / 2, 0.4 + b.h * S / 2, 0));
  strengthen(h, piece);   // (holding from the moment it's in, as a fitted piece does)
  g.position.copy(from);
  h.busy = (h.busy || 0) + 1;
  tween(1, (t) => {
    const e = t * t * (3 - 2 * t);
    g.position.lerpVectors(from, to, e);
    g.position.y += Math.sin(t * Math.PI) * 2.2;
    g.position.z += Math.sin(t * Math.PI) * 0.6;
  }, () => {
    h.busy--;
    g.position.copy(to);
    if (!h.pieces.includes(piece)) return;
    burst(new THREE.Vector3(to.x + b.w * S / 2, to.y - b.h * S / 2, 0.3), '#e8d0a8', 14, 2.5);
    updateHole(h);
    if (h.status === 'open') say('Planks from the armoury: a piece of the wall mended!');
  });
}

// The soldiers, in blue and white. Barracks moves them; this poses their figures to match.
const SOLDIER_LOOK = { shirt: ['#f2ead8', '#1f4e8a'], scarf: '#1f4e8a', trousers: '#e6dcc4', beard: '#3a2414', patch: false, sword: true };
function addFigure(s) {
  const m = makePirate(SOLDIER_LOOK);
  m.sc = 0.72 * s.size;
  m.g.scale.setScalar(m.sc);
  m.g.position.set(s.x, 0, s.z);
  scene.add(m.g);
  sword.figures.set(s, m);
}
function poseFigure(s, m, dt) {
  if (s.state === 'down') {
    m.g.rotation.x = Math.max(-Math.PI / 2, -s.downT * 4);
    if (s.downT > 1.2) m.g.scale.setScalar(Math.max(0.001, m.sc * (1 - (s.downT - 1.2) * 2.5)));
    return;
  }
  faceTo(m, s.fx, s.fz, dt);
  const swing = animateWalk(m, s.moving, dt, 13);
  if (s.fighting) { m.legs.forEach((l) => { l.rotation.x = 0; }); m.arms[1].rotation.x = -1.8 + Math.sin(performance.now() / 85) * 1.1; }
  else m.arms[1].rotation.x = s.moving ? swing * 0.5 : -0.4;
  m.g.position.x = s.x; m.g.position.z = s.z;
}
function swordNews(n) {
  if (n.kind === 'blow') burst(new THREE.Vector3(n.x, 1.1, n.z), '#e8eef6', 5, 2);
  else if (n.kind === 'knock') hit(n.foe, new THREE.Vector3(n.by.x, 1, n.by.z), '#cfd8e6');
}
// A raider a soldier has squared up to stops where they are and fights back (from updateRaider).
export function raiderDuel(r, dt) {
  const { fighting, news } = barracks.duel(r, dt);
  news.forEach(swordNews);
  if (!fighting) return false;
  const s = r.duel || r;
  faceTo(r.m, s.x - r.x, s.z - r.z, dt);
  animateWalk(r.m, false, dt, 12);
  r.m.legs.forEach((l) => { l.rotation.x = 0; });
  r.m.arms[1].rotation.x = -1.8 + Math.sin(performance.now() / 95 + 1) * 1.1;
  r.m.g.position.x = r.x; r.m.g.position.z = r.z;
  return true;
}
// Where soldiers stand with nobody to fight: just inside the gaps in the wall, or else the holes
// being hacked at.
function guardSpots() {
  const gaps = wall.holes.filter(passable);
  if (gaps.length) return gaps.map((h) => ({ x: doorX(h), z: 0.95 }));
  return wall.holes.filter((h) => h.attackers > 0).map((h) => ({ x: holeX(h), z: 0.95 }));
}

// The beach, for soldiers going out to raiders there (Field, src/den-sword.ts): the gate they go out
// and back by, the tide line, and the gun tower's legs to walk round.
function beachField() {
  const d = wall.door;
  return d ? { gate: { x: d.cx, w: d.w, open: d.open > 0.8 }, shore: shoreZ(), posts: towerLegs() } : null;
}

export function swordTick(dt) {
  sword.group.visible = !online();
  document.body.classList.toggle('swordfight', sword.on);
  if (!swordHere()) { sword.on = false; if (sword.pack) sword.pack.visible = false; if (sword.pile) sword.pile.visible = false; return; }
  if (sword.pile) { sword.pile.position.copy(pileAt()); sword.pile.visible = true; }
  // Planks waiting for a hole that needs them (one broken open again, say): looked at every second.
  if (lumber.ready && !sword.inFlight && (sword.repT = (sword.repT || 0) - dt) <= 0) { sword.repT = 1; repairAll(); }
  if (sword.on && (carry || pirate.h > 0.05)) sword.on = false;
  if (sword.show) showTick(dt);
  else if (sword.on) {
    const n = rack.tick(dt);
    if (n.lost) say('The stack reached the red and toppled (the crates on the shelves are safe)', true);
    if (n.landed) swordBreak(n.landed);
    if (n.changed) sword.dirty = true;
  }
  // Pieces on the floor: bobbing, and picked up by walking over them.
  for (let i = sword.drops.length - 1; i >= 0; i--) {
    const d = sword.drops[i];
    if (!d.landed) continue;
    d.t += dt;
    d.g.position.set(d.x, 0.08 + Math.abs(Math.sin(d.t * 3)) * 0.12, d.z);
    d.g.rotation.y += dt * 1.2;
    if (pirate.h > 0.3 || Math.hypot(pirate.x - d.x, pirate.z - d.z) > 0.9) continue;
    if (!rack.take(d.pair)) { if (!G.queueSaid) { G.queueSaid = true; say(`You can carry ${SWORD.PACK} pairs of crates: drop them off at the armoury hoist, on the left`); } continue; }
    burst(new THREE.Vector3(d.x, 0.5, d.z), PALETTE[d.pair[0].c].base, 6, 2);
    // Say what you've got and where it goes (the user, 8 Nov: "you just kind of walk into them and
    // it's like, okay, well, now what?").
    const n = rack.pack.length, brk = d.pair.some((g) => g.breaker);
    toast(`${brk ? 'A breaker! ' : ''}Crates on your back: ${n} of ${SWORD.PACK} pairs · walk them over to the armoury hoist, on the left`);
    dropGone(d);
    sword.drops.splice(i, 1);
    sword.dirty = true;
  }
  // Walk up to the hoist and what's on your back goes onto its shelves, no key needed (the user,
  // 9 Nov: "you should be able to just drop them off, like by going near the armory").
  if (rack.pack.length && nearHoist()) {
    const n = rack.unload();
    if (n) {
      sword.dirty = true;
      burst(sword.group.localToWorld(new THREE.Vector3(sword.w / 2 + 0.8, shelfY(Math.floor((rack.queue.length - 1) / SWORD.SHELF)), 0.3)), '#ffd23a', 12, 2);
      toast(`${n} pair${n === 1 ? '' : 's'} of crates onto the armoury's shelves (${rack.queue.length} there) · Space at the winch to play them`);
    } else if (!G.shelfSaid) { G.shelfSaid = true; say('The armoury\'s shelves are full: play some at the winch first', true); }
  }
  barracks.tick(dt, raiders, guardSpots(), waitSpot(sword), beachField()).forEach(swordNews);
  // A soldier at the gate opens it, as you do by walking up (land.js, gateTick, closes it after).
  const door = wall.door;
  if (barracks.wantGate && door) door.open = Math.min(1, door.open + 4 * dt);
  for (const [s, m] of sword.figures) poseFigure(s, m, dt);
  for (const s of barracks.sweep()) { scene.remove(sword.figures.get(s)?.g); sword.figures.delete(s); }
  if (sword.dirty && !sword.show) { sword.dirty = false; stackSync(); }
  pairSync(dt);
  packSync();
}
/* The crates you're carrying for the hoist, strapped on your back: the first three pairs, each pair
   one on the other, a breaker's bare blade sticking up. */
function packSync() {
  const q = rack.pack, pk = sword.pack ||= new THREE.Group();
  if (!pk.parent) scene.add(pk);
  const key = q.slice(0, 3).map((p) => p.map(crateSig).join('')).join('|');
  if (key !== sword.packKey) {
    sword.packKey = key;
    [...pk.children].forEach(crateGone);
    const n = Math.min(3, q.length);
    // A carrying frame they're lashed to: a board up the back with a strap round the crates.
    const frame = mesh(new THREE.BoxGeometry(0.22 * n + 0.04, 0.5, 0.03), crateLook.packWood ||= mat('#4a3020', { map: woodTex }), false);
    frame.geometry.userData.own = true;
    frame.position.set(0, 0.16, -0.13);
    const strap = mesh(new THREE.BoxGeometry(0.22 * n + 0.06, 0.04, 0.26), crateLook.strap ||= mat('#2a1a10'), false);
    strap.geometry.userData.own = true;
    strap.position.set(0, 0.1, -0.02);
    pk.add(frame, strap);
    q.slice(0, 3).forEach((pair, i) => pair.forEach((g, j) => {
      const m = armsCrate({ c: g.c, breaker: g.breaker });
      m.scale.setScalar(0.5);
      m.position.set((i - (n - 1) / 2) * 0.22, j * 0.21, 0);
      pk.add(m);
    }));
  }
  pk.visible = q.length > 0 && !sword.on;
  if (!pk.visible) return;
  pirate.g.updateMatrixWorld();
  pirate.g.localToWorld(pk.position.set(0, 0.98, -0.4));
  pk.rotation.set(0, pirate.g.rotation.y + Math.PI, 0);
}
export function swordReset() {
  rack.reset(); barracks.reset();
  sword.on = false; sword.dirty = true; sword.show = null;
  lumber.reset(); sword.inFlight = 0; pileShow();
  sword.drops.splice(0).forEach(dropGone);
  for (const m of sword.crates.values()) crateGone(m);
  sword.crates.clear();
  sword.packKey = null;
  for (const m of sword.figures.values()) scene.remove(m.g);
  sword.figures.clear();
}
export function swordPrompt() {
  const n = rack.pieces, of = `${n} pair${n === 1 ? '' : 's'} of crates`;
  if (sword.on) return n ? `The hoist · A/D or arrows move · W/S or Q/E turn · Space drops · Esc: walk (${of})` : 'No crates left: beat raiders for more · Esc: walk';
  if (carry || !atSword()) return '';
  return n ? `Space: work the hoist (${of} on the shelves): chests arm soldiers, loose crates make planks to mend the wall` : 'The armoury: beaten raiders drop crates of weapons; bring them here to arm soldiers';
}
