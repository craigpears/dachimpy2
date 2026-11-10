// The raids: their ship and rowboats, the raiders and throwing at them, the cannon, and the waves.
// (Split out of den.js.)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { W as BW } from '../bilge.js';
import { afterWave, timberComes } from '../den-raids.js';
import { BILGE, onRocks } from '../den-bilge.js';
import { C, S, STONE_D, PAY, RUBBLE, CANNON_GAP, CANNON_AIM, DOOR_W, DOOR_H, WALL_DONE_SECS, CALM_SECS, RAIDER_STAMINA, WINDED, TIRED_SLOW, FALLEN, DAZE, hackRate, k, rand, $, scene, camera, mat, mesh, canvasTex, woodTex, WOOD, outline, xrMat, addXray, makePirate, animateWalk, faceTo, flagpole, pirate, carry, bounds, G, raiders, shake, topView, burst, toast, fmt, tween, v3, worldLets } from './world.js';
import { rock, ramp, frames, openJob, outside, chest } from './land.js';
import { wall, wallGroup, X, Y, cellPlane, commonWays, roomyShapes, registerHole, holeOutline, holeVisuals, doorOf, stones, wallBack, updateHole, updateStats, breakHole, nextOut, dropPiece, layerNextOut, dropBoard, holeX, holeMidY, holeFootY } from './wall.js';
import { gd } from './gundeck.js';
import { piles, restockSecs, refill } from './pieces.js';
import { rack, sword, swordDrop, raiderDuel } from './sword.js';
import { shoreZ, beachZ, bilge } from './bilge.js';
import { cine } from './cine.js';
import { guest, isHost, myId, crewSize, send, say } from './crew.js';

export const cannon = (() => {
  const g = new THREE.Group();
  const iron = mat('#26282b', { metalness: 0.7, roughness: 0.4 });
  const tube = mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.5, 16), iron);
  tube.rotation.x = Math.PI / 2 - 0.35;
  tube.position.set(0, 0.75, 0.2);
  const carriage = mesh(new RoundedBoxGeometry(0.7, 0.35, 1.1, 2, 0.04), mat('#5b3a20', { map: woodTex }));
  carriage.position.y = 0.35;
  const wheelM = mat('#3e2614');
  [-1, 1].forEach((s) => [-0.3, 0.35].forEach((z) => { const w = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 14), wheelM); w.rotation.z = Math.PI / 2; w.position.set(0.4 * s, 0.22, z); g.add(w); }));
  const gunner = makePirate({ shirt: ['#1f2433', '#59607a'], scarf: '#2b2b2b', patch: false, beard: '#222' });
  gunner.g.scale.setScalar(0.85);
  gunner.g.position.set(0.8, 0, -0.5);
  gunner.g.rotation.y = -0.3;
  g.add(tube, carriage, gunner.g);
  g.userData.muzzle = new THREE.Vector3(0, 1.0, 0.9);
  addXray(g, xrMat('#ff8a3a', 0.45));
  return g;
})();

/* The raiders' ship, at anchor out in the cove, broadside on to the den: a dark hull with a gold
   stripe and gunports, a raised stern with a lantern, two masts with their sails braced round so
   they show, and a black flag. Their cannon stands on its deck (see buildWall). */
export const SHIP_Z = -24, SHIP_DECK = 1.05;
const pirateFlagMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: canvasTex(200, 128, (g, w, h) => {
  g.fillStyle = '#111'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#eee8dc'; g.strokeStyle = '#eee8dc'; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(w / 2 - 38, h / 2 - 20); g.lineTo(w / 2 + 38, h / 2 + 38); g.moveTo(w / 2 + 38, h / 2 - 20); g.lineTo(w / 2 - 38, h / 2 + 38); g.stroke();
  g.beginPath(); g.arc(w / 2, h / 2 - 8, 26, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#111'; g.beginPath(); g.arc(w / 2 - 9, h / 2 - 10, 6, 0, Math.PI * 2); g.arc(w / 2 + 9, h / 2 - 10, 6, 0, Math.PI * 2); g.fill();
}) });
// A hull seen from above (bow to +x), stood up: `len` long, `beam` wide, `deep` from keel to deck.
export function hullGeo(len, beam, deep, bow = 0.22) {
  const sh = new THREE.Shape(), l = len / 2, b = beam / 2;
  sh.moveTo(-l, -b * 0.85); sh.lineTo(l - len * bow, -b);
  sh.quadraticCurveTo(l, -b * 0.6, l + len * 0.04, 0);
  sh.quadraticCurveTo(l, b * 0.6, l - len * bow, b);
  sh.lineTo(-l, b * 0.85); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: deep, bevelEnabled: false }).rotateX(-Math.PI / 2);
}
export const ship = (() => {
  const g = new THREE.Group(), hullM = mat('#3d2716', { map: woodTex }), deckM = mat('#8a6a48', { map: woodTex });
  const hull = mesh(hullGeo(8.5, 2.6, 1.9), hullM);
  hull.position.y = SHIP_DECK - 1.9;
  const deck = mesh(hullGeo(8.3, 2.45, 0.05), deckM);
  deck.position.y = SHIP_DECK - 0.02;
  g.add(hull, deck);
  // The gold stripe along the near side, with its gunports.
  const stripe = mesh(new THREE.BoxGeometry(6.4, 0.22, 0.05), mat('#c8962e'));
  stripe.position.set(-0.6, SHIP_DECK - 0.45, 1.13);
  g.add(stripe);
  for (let i = 0; i < 5; i++) {
    const port = mesh(new THREE.BoxGeometry(0.26, 0.24, 0.06), mat('#120b07'), false);
    port.position.set(-3 + i * 1.3, SHIP_DECK - 0.45, 1.15);
    g.add(port);
  }
  // The raised stern, and a lantern.
  const stern = mesh(new THREE.BoxGeometry(1.8, 0.8, 2.2), hullM);
  stern.position.set(-3.35, SHIP_DECK + 0.4, 0);
  const lamp = mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffcf6a' }), false);
  lamp.position.set(-4.35, SHIP_DECK + 1.05, 0);
  const glow = new THREE.PointLight('#ffb347', 6, 7, 1.6);
  glow.position.copy(lamp.position);
  g.add(stern, lamp, glow);
  // Two masts, sails braced round, and the flag on the main.
  const sailM = mat('#e6dcc6', { side: THREE.DoubleSide, roughness: 0.95 }), spar = mat('#4a2f1a', { map: woodTex });
  for (const [x, h] of [[1.7, 5.2], [-0.9, 6.2]]) {
    const mast = mesh(new THREE.CylinderGeometry(0.07, 0.1, h, 8), spar);
    mast.position.set(x, SHIP_DECK + h / 2, 0);
    g.add(mast);
    for (const [y, w, ht] of [[h * 0.42, 2.6, 1.7], [h * 0.8, 1.9, 1.15]]) {
      const geo = new THREE.PlaneGeometry(w, ht, 8, 4), pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.cos(pos.getX(i) / w * Math.PI) * 0.28 * (0.6 + 0.4 * Math.cos(pos.getY(i) / ht * Math.PI)));
      geo.computeVertexNormals();
      const sail = mesh(geo, sailM, false), yard = mesh(new THREE.CylinderGeometry(0.04, 0.04, w + 0.3, 6), spar, false);
      const arm = new THREE.Group();
      sail.position.y = -ht / 2;
      yard.rotation.z = Math.PI / 2;
      arm.add(sail, yard);
      arm.position.set(x, SHIP_DECK + y + ht / 2, 0);
      arm.rotation.y = Math.PI / 2 - 0.55;   // braced round, so they show broadside on
      g.add(arm);
    }
  }
  const fl = flagpole(0.9, pirateFlagMat);
  fl.position.set(-0.9, SHIP_DECK + 6.15, 0);
  fl.scale.setScalar(1.3);
  g.add(fl);
  return g;
})();
// At anchor in the cove (`x`, or where it was), in sight.
export function shipHome(x = ship.userData.home) {
  ship.userData.home = x;
  ship.position.set(x, 0, SHIP_Z);
  ship.visible = true;
  cannon.position.set(x + 0.6, SHIP_DECK, SHIP_Z + 0.75);
}
/* Once the opening siege is beaten (src/den-raids.ts), their captain makes sail: the ship gathers
   way, bow first, out of the cove and off into the murk, and their cannon with it. Every den sails
   it from its own phase, so a crewmate's goes too. */
export const SHIP_GONE = 46;
function shipSail(dt) {
  const home = ship.userData.home, out = G.phase === 'peace';
  if (!out) { if (ship.position.x !== home) shipHome(); return; }
  if (cine) return;   // (held at anchor till their captain's back aboard)
  if (!ship.visible) return;
  const run = ship.position.x - home;
  ship.position.x += dt * Math.min(3, 0.4 + run * 0.2);
  cannon.position.x = ship.position.x + 0.6;
  if (run > SHIP_GONE) { ship.visible = false; cannon.visible = false; }
}
// The ship rides the swell, and their cannon with it; boats afloat bob.
export function shipTick(dt) {
  shipSail(dt);
  const t = performance.now() / 1000, y = Math.sin(t * 0.9) * 0.07;
  ship.position.y = y;
  ship.rotation.x = Math.sin(t * 0.7) * 0.02;
  ship.rotation.z = Math.sin(t * 0.55) * 0.015;
  cannon.position.y = SHIP_DECK + y;
  for (const b of boats) b.g.position.y = b.beached ? 0 : Math.sin(t * 2.1 + b.g.position.x) * 0.05 - 0.06;
}

/* Rowboats: each raider rows in from the ship in one (state 'row'), runs it up the beach and jumps
   out. It waits there, and takes them back out if they leave (turned away, or off with the loot:
   state 'rowOff'); left empty, it drifts back off to the ship. The host and crew alike draw them
   from the raiders' state, so a crewmate's den shows them too. */
export const BOAT_FROM = SHIP_Z + 2.4;
export const boats = [];
const boatHullM = mat('#6e4a2c', { map: woodTex }), oarM = mat('#a07c52', { map: woodTex });
export function rowboat() {
  const g = new THREE.Group();
  const hull = mesh(hullGeo(1.7, 0.82, 0.34, 0.3), boatHullM);
  hull.rotation.y = -Math.PI / 2;   // bow towards the beach (+z)
  const seat = mesh(new THREE.BoxGeometry(0.78, 0.04, 0.2), oarM, false);
  seat.position.y = 0.3;
  g.add(hull, seat);
  g.userData.oars = [-1, 1].map((sx) => {
    const pivot = new THREE.Group(), oar = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 6), oarM, false);
    oar.rotation.z = Math.PI / 2 - 0.35 * sx;
    oar.position.x = sx * 0.55;
    pivot.add(oar);
    pivot.position.set(sx * 0.38, 0.36, 0.05);
    g.add(pivot);
    return pivot;
  });
  scene.add(g);
  const b = { g, beached: false };
  boats.push(b);
  return b;
}
// A raider in a boat: seated on its thwart and pulling at the oars, the boat carried along with them.
// False once they're out of it (it stays where it is, run up the beach).
function inBoat(r) {
  if (r.state !== 'row' && r.state !== 'rowOff') { if (r.boat) r.boat.beached = true; return false; }
  const b = r.boat ||= rowboat();
  b.beached = false;
  b.g.position.x = r.x; b.g.position.z = r.z;
  b.g.rotation.y = r.state === 'rowOff' ? Math.PI : 0;
  const g = r.m.g, pull = Math.sin(r.t * 5.5);
  g.position.set(r.x, b.g.position.y + 0.22, r.z);
  g.rotation.x = 0; g.rotation.z = 0;
  r.m.legs.forEach((l) => { l.rotation.x = -1.3; });
  r.m.arms.forEach((a) => { a.rotation.x = -0.9 + pull * 0.45; });
  b.g.userData.oars.forEach((o, i) => { o.rotation.y = (i ? 1 : -1) * pull * 0.45; o.rotation.x = Math.cos(r.t * 5.5) * 0.12; });
  r.xr.forEach((x) => { x.visible = false; });
  return true;
}
// A raider gone (knocked out, rowed off, or the den reset): their boat, if it's still on the beach,
// pushes off empty back to the ship.
export function raiderOut(r, now = false) {
  scene.remove(r.m.g); r.mark.remove();
  if (r.lad) scene.remove(r.lad);
  const b = r.boat;
  if (!b) return;
  if (now || r.state === 'rowOff') return dropBoat(b);
  b.beached = false;
  const from = b.g.position.clone();
  b.g.rotation.y = Math.PI;
  tween(5, (t) => { b.g.position.z = from.z + (BOAT_FROM - from.z) * t; b.g.scale.setScalar(1 - Math.max(0, t - 0.7) / 0.3 * 0.99); }, () => dropBoat(b));
}
function dropBoat(b) { scene.remove(b.g); const i = boats.indexOf(b); if (i >= 0) boats.splice(i, 1); }

// ---------- actions ----------
function nearest(list, r) {
  let best = null, bd = r;
  for (const o of list) { const d = Math.hypot(o.x - pirate.x, o.z - pirate.z); if (d < bd) { bd = d; best = o; } }
  return best;
}
export function focus() {
  const p = nearest(piles, 1.55);
  if (p) return { kind: 'pile', p };
  return { kind: 'wall' };
}
/* The raider a thrown piece would hit: the nearest one loose in the den, or else one at the wall
   outside, lobbed over the top (from the rampart or the den floor alike: the user, 9 Nov, "just being
   able to lob over the wall is fine"). Throwing at a raider is the only way to get rid of a piece. */
const THROW_RANGE = 10;
const free = (r) => r.state !== 'down' && !r.targeted;
// Out on the beach, the raiders out there are yours to throw at, straight.
export const onBeach = (r) => !r.inside && free(r) && r.z < -0.3 && !['row', 'rowOff', 'climb', 'climbOut'].includes(r.state);
export const foe = () => nearest(raiders.filter((r) => (outside() ? onBeach(r) : r.inside) && free(r)), THROW_RANGE);
export const atWall = (r) => !r.inside && free(r) && (r.state === 'attack' || r.state === 'ladder' || r.state === 'dazed' || (r.state === 'approach' && r.z > -6));
export const outsideFoe = () => (outside() ? null : nearest(raiders.filter(atWall), THROW_RANGE + 3));
const anyFoe = () => foe() || outsideFoe();
// The throwable raider nearest a point on screen (within `cap` pixels), measured to the whole body
// from feet to the ⚔ marker, so clicking the marker or the raider both count. `out` false leaves out
// the ones outside the wall.
const toScreen = (x, y, z) => { v3.set(x, y, z).project(camera); return v3.z > 1 ? null : [(v3.x + 1) / 2 * innerWidth, (1 - v3.y) / 2 * innerHeight]; };
export function clickedFoe(mx, my, cap = 90, out = true) {
  let best = null, bd = cap;
  for (const r of raiders) {
    if (!(outside() ? onBeach(r) : r.inside ? free(r) : out && atWall(r))) continue;
    if (Math.hypot(r.x - pirate.x, r.z - pirate.z) > (r.inside || outside() ? THROW_RANGE : THROW_RANGE + 3)) continue;
    // The ⚔ marker counts too, even pinned to the screen edge for a raider out of view.
    let d = r.mark.style.display === 'none' || !r.mark.style.left ? 1e9 : Math.hypot(parseFloat(r.mark.style.left) - mx, parseFloat(r.mark.style.top) - 17 - my);
    const a = toScreen(r.x, 0.1, r.z), b = toScreen(r.x, 2.3, r.z);
    if (a && b) {
      const ex = b[0] - a[0], ey = b[1] - a[1], t = Math.max(0, Math.min(1, ((mx - a[0]) * ex + (my - a[1]) * ey) / (ex * ex + ey * ey || 1)));
      d = Math.min(d, Math.hypot(a[0] + ex * t - mx, a[1] + ey * t - my));
    }
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}
// Who Shift (or Space on the rampart) throws at: the raider by the mouse pointer if there is one,
// otherwise the nearest. Worked out every frame and ringed in gold so you can see it.
export let cursor = null, aimed = null;
export const aimFoe = () => (cursor && clickedFoe(cursor.x, cursor.y, 160)) || anyFoe();
// Hurl the carried piece at a raider. It always flies true, but the piece is spent.
export function throwAt(r, hand = carry, by = myId()) {
  const g = hand.group, pile = hand.from, color = WOOD[hand.letter];
  if (hand.mat) { hand.mat.opacity = 1; hand.mat.depthWrite = true; }
  if (hand === carry) worldLets.carry = null;
  r.targeted = true;
  if (by === myId()) {
    pirate.bonkT = 0.3;
    pirate.g.rotation.y = Math.atan2(r.x - pirate.x, r.z - pirate.z);
    if (guest()) send('host', { t: 'throw', rid: r.id, letter: hand.letter, shape: hand.cells, pile: piles.indexOf(pile) });
  }
  if (isHost()) send('all', { t: 'throw', rid: r.id, letter: hand.letter, shape: hand.cells, by });
  const from = g.position.clone(), d = Math.hypot(r.x - from.x, r.z - from.z);
  const to = new THREE.Vector3(r.x, 1.1, r.z);
  const over = !r.inside && from.z > -0.3, dur = 0.25 + d * 0.05 + (over ? 0.3 : 0);   // (from the beach, straight at them)
  let arc = 0.5 + d * 0.12;
  if (over) {
    // Over the wall: aim where the raider will be when it lands (at the foot of the wall at the
    // nearest), and lob high enough to clear the whole thickness of the wall on the way.
    if (r.state === 'approach') {
      const tx = passable(r.hole) ? doorX(r.hole) : hackX(r.hole, r.slot), dx = tx - r.x, dz = -1.15 - r.z, n = Math.hypot(dx, dz);
      const step = Math.min(n, 2.2 * dur);
      if (n > 0) to.set(r.x + dx / n * step, 1.1, r.z + dz / n * step);
    }
    to.z = Math.min(to.z, -1.15);
    const top = wall.H * S + 0.6;
    for (let s = 0.02; s < 1; s += 0.02) {
      const z = from.z + (to.z - from.z) * s;
      if (Math.abs(z) < 0.9) arc = Math.max(arc, (top - (from.y + (to.y - from.y) * s)) / Math.sin(Math.PI * s));
    }
  }
  tween(dur, (s) => {
    if (!over) to.set(r.x, 1.1, r.z);
    g.position.lerpVectors(from, to, s);
    g.position.y += Math.sin(s * Math.PI) * arc;
    g.rotation.x = s * 9; g.rotation.z = s * 5;
  }, () => { scene.remove(g); hit(r, from, color); });
  refill(pile, restockSecs());
}
export function hit(r, from, color) {
  burst(new THREE.Vector3(r.x, 1.1, r.z), color, 22, 4.5);
  r.targeted = false;
  if (guest() || r.state === 'down' || r.gone) return;   // the host says what happened to them
  const dx = r.x - from.x, dz = r.z - from.z, n = Math.hypot(dx, dz) || 1;
  r.state = 'down'; r.t = 0; r.outside = !r.inside;
  r.kv = new THREE.Vector3(dx / n * 5.5, 5, dz / n * 5.5);
  G.bonked++;
  G.gold += PAY.bonk;
  burst(new THREE.Vector3(r.x, 1.6, r.z), '#ffe27a', 12, 3);
  if (r.loot) { G.gold += PAY.steal; r.loot.visible = false; r.loot = null; say('Thwack! Loot recovered'); } else say('Thwack!');
  worldLets.shake = 0.35;
  updateStats();
}

// ---------- raiders ----------
// Only an empty hole with a gap at the floor big enough to walk through lets raiders in; anything
// with wood in it has to be hacked open first, and a smaller or higher one hacked wider (WEAK).
const bareHole = (h) => h.status === 'open' && !h.pieces.length && !(h.rubble > 0);
export const passable = (h) => bareHole(h) && (h.door != null || !!h.hop);
export const weakSpot = (h) => bareHole(h) && !passable(h);
export const doorX = (h) => (h.door != null ? X(h.door) + DOOR_W * S / 2 : holeX(h));
// Where a raider stands to hack at a hole: in its doorway if it has one (rubble or wood in it), else
// spread along the hole.
export const hackX = (h, slot) => (h.door != null ? doorX(h) + slot * 0.4 : holeX(h) + slot);
/* The squares a weak spot gives way into: a gap DOOR_W wide down to the floor below the hole, plus a
   few more next to it so the whole thing is still whole pieces' worth and can be filled exactly.
   Only solid stone, kept a square clear of the gate, the other holes and the stairs at the ends. */
export function widenCells(h) {
  const H = wall.H;
  const free = (r, c) => {
    const kk = k(r, c);
    if (h.set.has(kk) || r < 1 || r >= H || c < 3 || c > wall.W - 4 || !wall.stoneAt.has(kk) || wall.wood.has(kk)) return false;
    for (let a = -1; a <= 1; a++) for (let z = -1; z <= 1; z++) {
      const nk = k(r + a, c + z), o = wall.cellHole.get(nk);
      if (wall.gate.has(nk) || (o !== undefined && wall.holes[o] !== h)) return false;
    }
    return true;
  };
  // Left-hand columns of the gap to try, under the hole's lowest squares first.
  const starts = [];
  for (let a = h.b.c0 - 1; a <= h.b.c1; a++) starts.push(a);
  const lowAt = (x) => h.cells.reduce((m, [r, c]) => (c === x ? Math.max(m, r) : m), -1);
  starts.sort((a, z) => Math.max(lowAt(z), lowAt(z + 1)) - Math.max(lowAt(a), lowAt(a + 1)) || Math.random() - 0.5);
  // Of the ways it could give way, the one the common pieces fill best (see roomyShapes).
  let best = null, bestW = -1;
  for (let tries = 0; tries < 30; tries++) {
    const a = starts[tries % starts.length], add = new Set();
    let good = lowAt(a) >= 0 || lowAt(a + 1) >= 0;
    for (let x = a; good && x < a + DOOR_W; x++) {
      const low = lowAt(x);
      for (let r = Math.min(H - DOOR_H, low + 1); r < H; r++) {
        if (h.set.has(k(r, x))) continue;
        if (!free(r, x)) { good = false; break; }
        add.add(k(r, x));
      }
    }
    if (!good) continue;
    let need = (5 - (h.set.size + add.size) % 5) % 5;
    while (need > 0) {
      const opts = [];
      for (const kk of add) {
        const [r, c] = kk.split(',').map(Number);
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nk = k(r + dr, c + dc);
          if (!add.has(nk) && free(r + dr, c + dc)) opts.push([r + dr, c + dc, r + dr + Math.random() * 2.5]);
        }
      }
      if (!opts.length) break;
      opts.sort((p, q) => q[2] - p[2]);
      add.add(k(opts[0][0], opts[0][1]));
      need--;
    }
    if (need) continue;
    const added = [...add].map((kk) => kk.split(',').map(Number));
    if (!C.solve([...h.cells, ...added], 1).length) continue;
    const w = commonWays([...h.cells, ...added]);
    if (w > bestW) { best = added; bestW = w; }
  }
  return best;
}
// The weak spot gives way: the stone round it falls out and it's a gap they can walk through.
export function widen(h, cells) {
  if (isHost()) send('all', { t: 'widen', hole: wall.holes.indexOf(h), cells });
  if (!cells.length) { h.hop = true; return; }   // no room to widen it: they squeeze through as it is
  const zero = new THREE.Matrix4().makeScale(0, 0, 0), i = wall.holes.indexOf(h);
  for (const [r, c] of cells) {
    const kk = k(r, c), si = wall.stoneAt.get(kk);
    if (si !== undefined) { stones.setMatrixAt(si, zero); wall.stoneAt.delete(kk); }
    wall.cellHole.set(kk, i);
    h.set.add(kk);
    h.cells.push([r, c]);
    const chunk = rock(X(c) + S / 2, Y(r) - S / 2, -STONE_D / 2, 0.2);
    scene.add(chunk);
    const v = new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random() * 1.5, 1.5 + Math.random() * 2.5), p0 = chunk.position.clone();
    tween(0.9, (s) => { chunk.position.set(p0.x + v.x * s, Math.max(0.1, p0.y + v.y * s - 9 * s * s), p0.z + v.z * s); }, () => setTimeout(() => scene.remove(chunk), 4000));
  }
  stones.instanceMatrix.needsUpdate = true;
  h.b = C.bbox(h.cells);
  h.size = h.cells.length / 5;
  h.door = doorOf(h);
  if (h.door == null) h.hop = true;
  if (h.next) { wallGroup.remove(h.next); h.next = null; }
  if (h.rubbleG) { wallGroup.remove(h.rubbleG); h.rubbleG = null; }
  h.rubble = FALLEN;   // the stone that fell, choking the gap
  rubbleShow(h);
  holeOutline(h);
  wallBack();
  updateHole(h);
  burst(new THREE.Vector3(doorX(h), 0.8, 0.3), '#9a8a7a', 26, 4);
  worldLets.shake = 0.5;
  reel(h);
  toast('The wall gave way, but the stone dazed them: plug it!', true);
}
// The raiders hacking at a hole when it gives way reel back from it, dazed.
export function reel(h) {
  if (guest() || h.pieces.length) return;
  for (const r of raiders) if (r.hole === h && r.state === 'attack') { r.state = 'dazed'; r.t = 0; r.hitT = 0.2; }
}
/* Each raider goes for the hole in front of where they come up to the wall, not the weakest one
   along the whole of it: a breach only draws the raiders close to it (GAP_PULL metres). So one hole
   broken doesn't let the whole wave in, and the parts of the wall you've kept strong hold their own
   raiders off till they tire. */
const GAP_PULL = 3;
const gapNear = (x) => wall.holes.filter((h) => passable(h) && Math.abs(holeX(h) - x) <= GAP_PULL).sort((a, b) => Math.abs(holeX(a) - x) - Math.abs(holeX(b) - x))[0];
function pickHole(x) {
  const gap = gapNear(x);
  if (gap) return gap;
  // A high hole and the low one under it are about as near: either, at chance.
  const by = wall.holes.slice().sort((a, b) => Math.abs(holeX(a) - x) - Math.abs(holeX(b) - x));
  return C.pick(by.filter((h) => Math.abs(holeX(h) - x) < Math.abs(holeX(by[0]) - x) + 1.5));
}
/* Ladders up to the top course (the wall in two courses, 9 Nov). Raiders going for a high hole lean
   one on the wall under it and climb up; from there they hack at its wood, or climb straight in
   if it's open, dropping down inside. Knocked dazed, they fall off and climb again. A high hole
   has no stone to hack wider first, so an open one wants mending before the low ones. */
const LADDER = { foot: -1.2, top: -STONE_D - 0.06, climb: 1.2 };
const rungY = (h) => Math.max(0, holeFootY(h) - 1);
const ladderZ = (h, y) => LADDER.foot + (LADDER.top - LADDER.foot) * Math.min(1, y / Math.max(0.1, holeFootY(h)));
const onLadder = (r) => !!r.hole?.high && !r.inside && (r.state === 'ladder' || r.state === 'attack');
const ladderMat = mat('#6b4a2b', { map: woodTex });
function makeLadder(top) {
  const g = new THREE.Group(), run = LADDER.top - LADDER.foot, L = Math.hypot(top + 0.35, run);
  for (const x of [-0.22, 0.22]) { const rail = mesh(new THREE.BoxGeometry(0.06, L, 0.06), ladderMat); rail.position.set(x, L / 2, 0); g.add(rail); }
  for (let y = 0.3; y < L - 0.1; y += 0.32) { const rung = mesh(new THREE.BoxGeometry(0.44, 0.04, 0.05), ladderMat); rung.position.set(0, y, 0); g.add(rung); }
  g.rotation.x = Math.atan2(run, top + 0.35);
  return g;
}
// Shown while a raider's on it (or reeling at its foot); it goes when they're in, or give up.
function ladderShow(r) {
  const on = !!r.hole?.high && !r.inside && ['ladder', 'attack', 'climb', 'dazed'].includes(r.state);
  if (on && (!r.lad || r.lad.userData.h !== r.hole)) {
    if (r.lad) scene.remove(r.lad);
    r.lad = makeLadder(holeFootY(r.hole));
    r.lad.userData.h = r.hole;
    r.lad.position.set(r.x, 0, LADDER.foot);
    scene.add(r.lad);
  }
  if (r.lad) { r.lad.visible = on; if (on && r.state !== 'climb') r.lad.position.x = r.x; }
}
const SHIRTS = ['#59607a', '#2f6b4f', '#6b2f5e'], SCARVES = ['#2b2b2b', '#3a4a8a', '#7a1f1f'], BEARDS = ['#222', '#7a4a1a', '#999'];
export let raiderSeq = 0;

// Other parts of the den assign to these lets through this, as an imported binding can't be assigned.
export const raidsLets = {
  get cursor() { return cursor; }, set cursor(v) { cursor = v; },
  get raiderSeq() { return raiderSeq; }, set raiderSeq(v) { raiderSeq = v; },
  get aimed() { return aimed; }, set aimed(v) { aimed = v; },
};
export function makeRaider(look, id, x, z) {
  const [sh, sc, pt, bd] = look;
  const m = makePirate({ shirt: ['#1f2433', SHIRTS[sh]], scarf: SCARVES[sc], trousers: '#5a4636', patch: !!pt, beard: BEARDS[bd], sword: true });
  m.g.scale.setScalar(0.82);
  const xr = addXray(m.g);
  const r = { id, look, m, xr, x, z, state: 'approach', hole: null, t: 0, stamina: RAIDER_STAMINA, hitT: 0.5, slot: 0, inside: false, loot: null };
  m.g.position.set(x, 0, z);
  scene.add(m.g);
  r.mark = document.createElement('div');
  r.mark.className = 'mark';
  r.mark.textContent = '⚔';
  $('labels').append(r.mark);
  raiders.push(r);
  return r;
}
export function spawnRaider() {
  let x = (Math.random() - 0.5) * wall.W * S * 0.9;
  const b0 = bilge.x0 - 0.9, b1 = bilge.x0 + BW * BILGE.SQ + 0.9;
  if (x > b0 && x < b1) x = x - b0 < b1 - x ? b0 : b1;
  const r = makeRaider([rand(3), rand(3), Math.random() < 0.5 ? 1 : 0, rand(3)], ++raiderSeq, x, BOAT_FROM);
  r.state = 'row';
  r.hole = pickHole(x);
  r.slot = (Math.random() - 0.5) * 1.2;
}
export function giveLoot(r) {
  r.loot = mesh(new THREE.SphereGeometry(0.16, 10, 8), mat('#e8b23a', { metalness: 0.7, roughness: 0.3 }));
  r.loot.position.set(0, -0.5, 0.1);
  r.m.arms[0].add(r.loot);
}
function moveTo(r, tx, tz, speed, dt) {
  const dx = tx - r.x, dz = tz - r.z, d = Math.hypot(dx, dz);
  if (d < 0.08) return true;
  const step = Math.min(d, speed * dt);
  r.x += dx / d * step; r.z += dz / d * step;
  faceTo(r.m, dx, dz, dt);
  return false;
}
export function updateRaider(r, dt) {
  if (r.duel && raiderDuel(r, dt)) return;
  const h = r.hole;
  let moving = false;
  r.t += dt;
  switch (r.state) {
    case 'row': {
      // Rowing in from the ship, then out onto the sand.
      moving = !moveTo(r, r.x, beachZ(), 2.8, dt);
      if (!moving) { r.state = 'approach'; r.t = 0; r.z = beachZ() + 0.6; }
      break;
    }
    case 'rowOff': {
      moving = !moveTo(r, r.x, BOAT_FROM, 2.4, dt);
      if (!moving) r.gone = true;
      break;
    }
    case 'approach': {
      const rocky = !guest() && onRocks(r.z, shoreZ());
      if (rocky) {
        r.stamina -= BILGE.ROCK_TOLL * 2.2 * BILGE.ROCK_SLOW * dt;
        if ((r.cutT = (r.cutT || 0) - dt) <= 0) { r.cutT = 0.45; burst(new THREE.Vector3(r.x, 0.3, r.z), '#b8322a', 3, 1.2); }
      }
      moving = !moveTo(r, h.high ? hackX(h, r.slot * 0.5) : passable(h) ? doorX(h) : hackX(h, r.slot), h.high ? LADDER.foot - 0.2 : -1.15, 2.2 * (rocky ? BILGE.ROCK_SLOW : 1), dt);
      if (!moving) { r.state = h.high ? 'ladder' : passable(h) ? 'climb' : 'attack'; r.t = 0; r.ly = 0; }
      break;
    }
    case 'ladder': {
      // Up the ladder to a high hole (LADDER).
      faceTo(r.m, 0, 1, dt);
      const top = rungY(h);
      r.ly = Math.min(top, (r.ly || 0) + LADDER.climb * dt);
      r.m.g.position.y = r.ly;
      r.z = ladderZ(h, r.ly) - 0.2;
      moving = true;
      if (r.ly >= top) { r.state = passable(h) ? 'climb' : 'attack'; r.t = 0; moving = false; }
      break;
    }
    case 'attack': case 'hackOut': {
      // Hacking at the wood in a hole: from outside to get in, or from inside to get back out.
      const out = r.state === 'hackOut';
      if (passable(h)) { r.state = out ? 'climbOut' : 'climb'; r.t = 0; break; }
      const gap = !out && gapNear(r.x);   // the hole next along's been broken open: in that way
      if (gap) { r.hole = gap; r.slot = (Math.random() - 0.5) * 1.2; r.state = 'approach'; break; }
      faceTo(r.m, 0, out ? -1 : 1, dt);
      if (!out) r.stamina -= dt;
      // From outside: the hole's own wood, then the boards behind it, nearest first. A thief
      // inside hacks the other way.
      const fill = h.pieces.some((p) => !p.patch), li = !h.lay.length ? -1 : out ? h.lay.length - 1 : fill ? -1 : 0;
      const board = li >= 0 ? h.lay[li] : null;
      const rub = !out && h.rubble > 0 && !h.pieces.length;   // a fresh breach: clear the rubble first
      const hack = hackRate() * dt, weak = weakSpot(h);   // weak: an empty hole they can't walk through
      if (weak) h.weak -= hack; else if (rub) { h.rubble -= hack; rubbleShow(h); } else if (board) board.hp -= hack; else h.hp -= hack;
      r.m.arms[1].rotation.x = -1.8 + Math.sin(r.t * 9) * 1.1;
      r.hitT -= dt;
      if (r.hitT <= 0) {
        r.hitT = 0.7;
        burst(new THREE.Vector3(hackX(h, r.slot * 0.5), h.high ? holeFootY(h) + 0.2 : Math.min(holeMidY(h), 1.4), out ? 0.6 : 0.25), weak ? '#9a8a7a' : '#c98a45', 4, 2);
        h.jig = 0.15;
      }
      if (weak) { if (h.weak <= 0) widen(h, widenCells(h) || []); else if (!out && r.stamina <= 0) turnedAway(r); }
      else if (rub) { if (r.stamina <= 0) turnedAway(r); }
      else if (board && board.hp <= layerNextOut(h, li)) dropBoard(h, li, out);
      else if (!board && h.hp <= 0) breakHole(h);
      else if (!board && h.hp <= nextOut(h)) dropPiece(h);
      else if (r.stamina <= 0) { if (out) r.state = 'leave'; else turnedAway(r); }
      break;
    }
    case 'climb': case 'climbOut': {
      // Walking in through the gap (or back out again). Only a hole that couldn't be widened is
      // hopped through, up over the sill.
      const walk = h.door != null, into = r.state === 'climb';
      const s = Math.min(1, r.t / (walk ? 1 : 1.3));
      const z0 = into ? -1.15 : 1.2, z1 = into ? 1.2 : -1.15;
      r.z = z0 + (z1 - z0) * s;
      r.x += (doorX(h) - r.x) * Math.min(1, dt * 5);
      const sill = holeFootY(h) + 0.25, y0 = r.ly || 0;
      r.m.g.position.y = walk ? 0 : h.high && into ? (s < 0.4 ? y0 + (sill - y0) * s / 0.4 : sill * (1 - ((s - 0.4) / 0.6) ** 2)) : Math.sin(s * Math.PI) * sill;
      moving = walk;
      faceTo(r.m, 0, into ? 1 : -1, dt);
      r.inside = r.z > 0.3;
      if (s >= 1) {
        r.state = into ? 'raid' : 'leave'; r.t = 0; r.inside = into; r.ly = 0; r.m.g.position.y = 0;
        if (into) {
          if (!guest()) G.waveIn++;
          // At the sword rack, a raider getting in hits your board like an opponent's attack.
          if (sword.on && rack.hitBy(2)) { sword.dirty = true; say('A raider\'s in: crates nailed shut on your stack!', true, true); }
          r.tired = Math.min(1, Math.max(0, 1 - r.stamina / RAIDER_STAMINA));
          if (r.tired > 0.15) {
            r.state = 'winded';
            if (!G.windSaid) { G.windSaid = true; say('Through, but winded: knock them flat!', true, true); }
          }
        }
      }
      break;
    }
    case 'dazed': {
      // Knocked reeling by the wall coming down on them: they stagger back, then go again.
      if (r.t < 1) r.z = Math.max(-2.2, r.z - 1.1 * dt);
      faceTo(r.m, 0, 1, dt);
      if (r.t >= DAZE) { r.state = 'approach'; r.t = 0; }
      break;
    }
    case 'winded': {
      // Bent double, getting their breath back, just inside the wall.
      faceTo(r.m, 0, 1, dt);
      if (r.t >= WINDED * r.tired) { r.state = 'raid'; r.t = 0; }
      break;
    }
    case 'raid': {
      const c = chest.position;
      moving = !moveTo(r, c.x + 0.9, c.z - 0.2, 2.5 * (1 - TIRED_SLOW * (r.tired || 0)), dt);
      if (!moving) {
        G.gold -= PAY.steal; G.stolen++;
        updateStats();
        say(`A raider stole ${PAY.steal} doubloons!`, true);
        giveLoot(r);
        r.state = 'flee';
      }
      break;
    }
    case 'flee': {
      if (!passable(h) || h.high) { const gap = wall.holes.filter(passable).sort((a, b) => Math.abs(holeX(a) - r.x) + (a.high ? 4 : 0) - Math.abs(holeX(b) - r.x) - (b.high ? 4 : 0))[0]; if (gap) r.hole = gap; }
      moving = !moveTo(r, passable(r.hole) ? doorX(r.hole) : holeX(r.hole), 1.2, 2.8 * (1 - TIRED_SLOW * (r.tired || 0)), dt);
      if (!moving) { r.state = passable(r.hole) ? 'climbOut' : 'hackOut'; r.t = 0; }
      break;
    }
    case 'leave': {
      // Back down the beach to their boat, and away (with no boat, they just go).
      r.inside = false;
      const b = r.boat && boats.includes(r.boat) ? r.boat.g.position : null;
      moving = !moveTo(r, b ? b.x : r.x, b ? b.z + 0.6 : shoreZ(), 2.4, dt);
      if (!moving) { if (b) { r.state = 'rowOff'; r.t = 0; r.x = b.x; r.z = b.z; } else r.gone = true; }
      break;
    }
    case 'down': {
      // Sent flying: up, spinning, a bounce, then flat out and gone.
      const v = r.kv || new THREE.Vector3();
      const g = r.m.g;
      v.y -= 14 * dt;
      r.x = Math.max(-bounds.x, Math.min(bounds.x, r.x + v.x * dt));
      r.z = r.outside ? Math.max(shoreZ(), Math.min(-0.8, r.z + v.z * dt)) : Math.max(0.6, Math.min(bounds.z1, r.z + v.z * dt));
      g.position.y = Math.max(0, g.position.y + v.y * dt);
      if (g.position.y <= 0 && v.y < 0) { v.x *= 0.4; v.z *= 0.4; v.y = Math.abs(v.y) > 3 ? -v.y * 0.3 : 0; }
      if (g.position.y > 0.05) g.rotation.y += dt * 10;
      g.rotation.x = Math.max(-Math.PI / 2, -r.t * 4);
      if (r.t > 1.4) g.scale.setScalar(Math.max(0.001, 0.82 * (1 - (r.t - 1.4) * 2.5)));
      if (r.t > 1.8) r.gone = true;
      break;
    }
  }
  raiderPose(r, moving, dt);
}
export function raiderPose(r, moving, dt) {
  if (inBoat(r)) return;
  ladderShow(r);
  // How high up a ladder they are (a guest has it from the host's snapshot); off it, they drop.
  const own = !['climb', 'climbOut', 'down'].includes(r.state), y0 = r.m.g.position.y;
  if (!guest() && own && !onLadder(r) && r.ly > 0) r.ly = Math.max(0, r.ly - 7 * dt);
  const hop = (r.state === 'climb' || r.state === 'climbOut') && !moving;
  const g = r.m.g;
  if (r.state === 'winded') {
    // Hands on knees, puffing: leaning forward, the lean rising and falling with each breath.
    animateWalk(r.m, false, dt, 12);
    r.m.legs.forEach((l) => { l.rotation.x = 0; });
    r.m.arms.forEach((a) => { a.rotation.x = -0.75; });
    g.rotation.x = 0.38 + Math.sin(r.t * 7) * 0.05;
    r.hitT -= dt;
    if (r.hitT <= 0) { r.hitT = 0.7; burst(new THREE.Vector3(r.x, 1.15, r.z + 0.35), '#dfe8ee', 2, 0.7); }
  } else if (r.state !== 'down') g.rotation.x = 0;
  if (r.state === 'dazed') {
    // Swaying on the spot, arms hanging, sparks of the knock round their head.
    animateWalk(r.m, false, dt, 12);
    r.m.legs.forEach((l) => { l.rotation.x = 0; });
    r.m.arms.forEach((a) => { a.rotation.x = 0.2; });
    g.rotation.z = Math.sin(r.t * 4.5) * 0.16;
    r.hitT -= dt;
    if (r.hitT <= 0) { r.hitT = 0.45; burst(new THREE.Vector3(r.x, 1.75, r.z), '#ffd45a', 3, 0.8); }
  } else g.rotation.z = 0;
  if (!hop && r.state !== 'down' && r.state !== 'winded' && r.state !== 'dazed') {
    const swing = animateWalk(r.m, moving, dt, 12);
    if (r.state === 'attack' || r.state === 'hackOut') {
      r.m.legs.forEach((l) => { l.rotation.x = 0; });
      r.m.arms[1].rotation.x = -1.8 + Math.sin(r.t * 9) * 1.1;
    } else r.m.arms[1].rotation.x = moving ? swing * 0.5 : -0.4;
  }
  if (own) g.position.y = Math.max(g.position.y, guest() ? y0 : r.ly || 0);
  r.m.g.position.x = r.x;
  r.m.g.position.z = r.z;
  const behind = r.z < -0.1 && !topView && !outside();   // from up on the wall you can see them for real
  r.xr.forEach((x) => { x.visible = behind; });
}

// ---------- the cannon ----------
export function fireCannon() {
  const cells = cannonSpot();
  if (cells) shoot(cells);
  return !!cells;
}
// A patch of solid stone, away from the gate and other holes, for a new hole.
// The roomiest breach that fits anywhere: three pieces if there's the stone for it, else two, else a
// single common piece (a P, F or Y, never a W or a U). Stone between the holes is short, so most
// walls only have room for the smaller ones in places.
export function cannonSpot() {
  const singles = C.shuffle(['P', 'P', 'F', 'Y']).map((l) => C.pick(C.ORIENTS_BY_LETTER[l]).cells);
  const shapes = [...roomyShapes(3).slice(0, 4), ...roomyShapes(2, 6).slice(0, 4), ...singles];
  const clear = ([r, c]) => {
    if (r >= wall.H || c < 3 || c > wall.W - 4 || !wall.stoneAt.has(k(r, c))) return false;
    if (c >= wall.mid.c0 - 1 && c <= wall.mid.c1 + 1) return false;   // (nor in the low middle round the gate)
    for (let a = -1; a <= 1; a++) for (let z = -1; z <= 1; z++) {
      const kk = k(r + a, c + z);
      if (wall.cellHole.has(kk) || wall.gate.has(kk) || wall.wood.has(kk)) return false;
    }
    return true;
  };
  for (const shape of shapes) {
    const b = C.bbox(shape), spots = [];
    for (let r0 = 1; r0 + b.h <= wall.H; r0++) for (let c0 = 3; c0 + b.w <= wall.W - 3; c0++) {
      const cells = shape.map(([r, c]) => [r + r0, c + c0]);
      if (cells.every(clear)) spots.push(cells);
    }
    if (spots.length) return C.pick(spots);
  }
  return null;
}
// A raider who tires at your wall before getting through gives up: that's the wall doing its job.
function turnedAway(r) {
  r.state = 'leave';
  if (guest()) return;
  G.turned++; G.waveTurned++;
  G.gold += PAY.turned;
  r.swordDropped = true;
  swordDrop(r);
  updateStats();
  burst(new THREE.Vector3(r.x, 1.6, r.z), '#ffd45a', 12, 2.5);
  say(`Turned away! They couldn't get through (+${PAY.turned})`);
}
// Rubble in a fresh breach: a heap of broken stone that thins as the raiders clear it.
export function rubbleShow(h) {
  if (!h.rubbleG) {
    if (!(h.rubble > 0)) return;
    h.rubbleG = new THREE.Group();
    // Bottom row first, so a part-cleared pile sits on the ground and goes from the top.
    for (const [r, c] of [...h.cells].sort((a, b) => b[0] - a[0])) for (let i = 0; i < 2; i++) {
      const b = rock(X(c) + S * (0.25 + Math.random() * 0.5), Y(r) - S * (0.3 + Math.random() * 0.5), -STONE_D * (0.25 + Math.random() * 0.5), 0.17 + Math.random() * 0.06);
      h.rubbleG.add(b);
    }
    wallGroup.add(h.rubbleG);
  }
  const on = h.rubble > 0 && !h.pieces.length, n = h.rubbleG.children.length, keep = on ? Math.ceil(n * h.rubble / RUBBLE) : 0;
  h.rubbleG.children.forEach((b, i) => { b.visible = i < keep; });
}
// Where the cannon's aiming: the squares glow red on both faces of the wall, with a countdown.
const aimMat = new THREE.MeshBasicMaterial({ color: '#ff3a24', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
let aimMark = null;
export function showAim() {
  const A = G.aim;
  if (aimMark && (!A || aimMark.userData.key !== JSON.stringify(A.cells))) { wallGroup.remove(aimMark); aimMark.userData.label.remove(); aimMark = null; }
  if (!A) return;
  if (!aimMark) {
    aimMark = new THREE.Group();
    for (const [r, c] of A.cells) for (const z of [0.08, -STONE_D - 0.08]) {
      const p = new THREE.Mesh(cellPlane, aimMat);
      p.position.set(X(c) + S / 2, Y(r) - S / 2, z);
      aimMark.add(p);
    }
    const line = outline(A.cells, 0.09, '#ff6a4a');
    line.position.set(X(0), Y(0), 0);
    aimMark.add(line);
    aimMark.userData.key = JSON.stringify(A.cells);
    aimMark.userData.label = document.createElement('div');
    wallGroup.add(aimMark);
  }
  const lab = aimMark.userData.label;
  if (!lab.isConnected) $('labels').append(lab);
  aimMat.opacity = 0.35 + 0.3 * Math.abs(Math.sin(performance.now() / 180));
  const b = C.bbox(A.cells);
  v3.set(X(b.c0) + b.w * S / 2, Y(b.r0) + 0.2, 0.1).project(camera);
  lab.className = 'label bad';
  lab.innerHTML = `Their cannon's aiming here! <b>${Math.max(1, Math.ceil(A.t))}</b><small>${gd ? 'shoot their cannon from the gun tower to spoil it' : 'get pieces ready to mend the breach'}</small>`;
  lab.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
  lab.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  lab.style.display = v3.z > 1 ? 'none' : '';
}
export function shoot(cells) {
  if (isHost()) send('all', { t: 'shoot', cells });
  const from = cannon.localToWorld(cannon.userData.muzzle.clone());
  const b = C.bbox(cells);
  const to = new THREE.Vector3(X(b.c0) + b.w * S / 2, Y(b.r0) - b.h * S / 2, -STONE_D);
  burst(from, '#ffcf6a', 10, 2);
  const ball = mesh(new THREE.SphereGeometry(0.18, 12, 10), mat('#1a1a1a', { metalness: 0.6 }));
  addXray(ball, xrMat('#ff8a3a', 0.6));
  scene.add(ball);
  tween(1.1, (s) => {
    ball.position.lerpVectors(from, to, s);
    ball.position.y += Math.sin(s * Math.PI) * 4;
  }, () => {
    scene.remove(ball);
    if (!guest()) blast(cells);
  });
}
export function blast(cells, told = false) {
  // Anything mended or opened there while the ball was in the air wins: skip those squares.
  if (!told) cells = cells.filter(([r, c]) => wall.stoneAt.has(k(r, c)) && !wall.wood.has(k(r, c)));
  if (!told && (cells.length % 5 || !C.isConnected(cells))) return;
  if (isHost()) send('all', { t: 'blast', cells });
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const at = new THREE.Vector3();
  cells.forEach(([r, c]) => {
    const i = wall.stoneAt.get(k(r, c));
    wall.stoneAt.delete(k(r, c));
    stones.setMatrixAt(i, zero);
    // The stone tumbles into the den.
    const chunk = rock(X(c) + S / 2, Y(r) - S / 2, 0, 0.2);
    scene.add(chunk);
    const v = new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random() * 2, 2 + Math.random() * 2.5);
    const p0 = chunk.position.clone();
    tween(0.9, (s) => { chunk.position.set(p0.x + v.x * s, Math.max(0.1, p0.y + v.y * s - 9 * s * s), p0.z + v.z * s); }, () => setTimeout(() => scene.remove(chunk), 4000));
    at.set(X(c) + S / 2, Y(r) - S / 2, 0.3);
  });
  stones.instanceMatrix.needsUpdate = true;
  const h = registerHole(cells);
  h.rubble = RUBBLE;
  rubbleShow(h);
  wallBack();
  holeVisuals(h);
  updateHole(h);
  burst(at, '#9a8a7a', 26, 4.5);
  worldLets.shake = 0.6;
  toast('Cannon fire! A breach, choked with rubble: mend it before they clear it', true);
}

// ---------- waves ----------
export function startWave() {
  G.wave++;
  G.phase = 'wave';
  G.toSpawn = Math.round((1 + G.wave) * (1 + 0.5 * (crewSize() - 1)));
  G.spawnT = 0.5;
  G.cannonShots = G.wave >= 2 ? Math.min(3, G.wave - 1) : 0;
  G.cannonT = 20;
  G.aim = null;
  G.waveTurned = G.waveIn = 0;
  G.windSaid = false;
  if (!ship.visible || ship.position.x !== ship.userData.home) shipHome();   // a raid called on, once they'd sailed off
  if (G.wave >= 2 && !cannon.visible) { cannon.visible = true; say('Their ship\'s run out a cannon!', true); }
  else say(`Wave ${G.wave}: raiders!`, true);
  $('intro').classList.add('off');
  updateStats();
}
// What timber comes next (src/den-raids.ts, timberComes): nothing while a frame of the rampart's
// still being filled, nor once only the shack's left.
function nextPart() {
  if (!ramp || frames().some((o) => o.kind !== 'house') || ramp.jobs.some((j) => j.kind !== 'house' && j.frame && !j.up)) return null;
  const j = ramp.jobs[ramp.next];
  return !j || j.kind === 'house' ? null : j.kind === 'deck' ? 'walk' : 'later';
}
export function updateWaves(dt) {
  const mended = wall.holes.every((h) => h.status !== 'open');
  if (!G.fairOver && mended) G.fairOver = true;   // see fairDeal
  const timber = mended && timberComes(nextPart(), 'mended') && openJob(ramp.next);
  // The first wave comes as soon as every hole's mended (the user), with a beat to see it done.
  if (G.phase === 'build' && G.phaseT > WALL_DONE_SECS && mended) {
    G.phaseT = WALL_DONE_SECS;
    say(`The wall's mended! Here they come…${timber ? ' Timber\'s come: build the rampart in its frame while they try to get in' : ''}`, true);
  } else if (timber) say('The wall\'s mended! Timber\'s come: build the rampart in its frame while they try to get in');
  if (G.phase === 'peace') return;   // the siege is over: nobody's coming
  if (G.phase !== 'wave') {
    G.phaseT -= dt;
    if (G.phaseT <= 0) startWave();
    return;
  }
  G.spawnT -= dt;
  if (G.toSpawn > 0 && G.spawnT <= 0) { spawnRaider(); G.toSpawn--; G.spawnT = Math.max(2.5, 7 - G.wave); }
  if (G.aim) {
    if ((G.aim.t -= dt) <= 0) { const cells = G.aim.cells; G.aim = null; G.cannonShots--; G.cannonT = CANNON_GAP; shoot(cells); }
  } else if (G.cannonShots > 0 && (G.cannonT -= dt) <= 0) {
    const cells = cannonSpot();
    if (cells) { G.aim = { cells, t: CANNON_AIM }; say('Their cannon\'s aiming at the wall: see the red!', true); } else G.cannonT = 5;
  }
  if (!G.toSpawn && !raiders.length) {
    G.phase = afterWave(G.wave); G.phaseT = CALM_SECS; G.aim = null;
    let tally = G.waveTurned || G.waveIn ? ` ${G.waveTurned} turned away at the wall, ${G.waveIn} got in.` : '';
    if (!G.waveIn && G.waveTurned) { G.gold += PAY.clean; updateStats(); tally = ` Not one got in! (+${PAY.clean})`; }
    // Timber for the next part, once nothing's still being built.
    const f = timberComes(nextPart(), 'beaten') && openJob(ramp.next);
    const timber = f ? ` Timber's come: ${f.kind === 'gun' ? 'build a gun tower in its frame' : 'build the rampart in its frame'}` : '';
    if (G.phase === 'peace') say(`Wave ${G.wave} beaten off!${tally} That's the siege over: they're making sail. The den's yours: build, roam, puzzle.${timber}`);
    else say(`Wave ${G.wave} beaten off!${tally}${timber}`);
  }
}
export function banner() {
  const el = $('banner');
  let t, cls = 'banner calm';
  if (G.phase === 'build') t = wall.holes.every((h) => h.status !== 'open') ? `The wall's mended! Raiders attack in ${fmt(Math.ceil(G.phaseT))}` : `Raiders attack in ${fmt(Math.ceil(G.phaseT))}: mend the wall!`;
  else if (G.phase === 'calm') t = `Wave ${G.wave} beaten off · next wave in ${fmt(Math.ceil(G.phaseT))}`;
  else if (G.phase === 'peace') t = 'The raiders have sailed off · the den\'s quiet';
  else { t = `Wave ${G.wave} · ${G.toSpawn + raiders.filter((r) => r.state !== 'down').length} raiders`; cls = 'banner'; }
  if (el.textContent !== t) el.textContent = t;
  if (el.className !== cls) el.className = cls;
}
export function checkEnd() {
  if (G.over || G.gold > 0) return;
  G.over = true;
  endScreen();
}
export function endScreen() {
  $('end-text').textContent = `They emptied the chest in wave ${G.wave}. You built ${G.masters} Masterpiece${G.masters === 1 ? '' : 's'}, boarded over ${G.boarded} hole${G.boarded === 1 ? '' : 's'} and knocked out ${G.bonked} raider${G.bonked === 1 ? '' : 's'}.`;
  setTimeout(() => $('end').classList.add('on'), 900);
}
