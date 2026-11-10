// The den's wall, its gate and its holes: building it, where a piece can go, and mending, patching
// and breaking it. (Split out of den.js.)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { twoCourses, isHigh, gateTop, lowMiddle, isSky } from '../den-wall.js';
import { C, S, WOOD_D, STONE_D, DEN_BACK, HP, MAX_PATCHES, PAY, RUBBLE, WEAK, DOOR_W, DOOR_H, k, $, scene, mat, mesh, canvasTex, woodTex, woodMat, pieceGroup, outline, flagpole, pirate, carry, bounds, obstacles, G, shake, burst, toast, tween, fatOutline, worldLets } from './world.js';
import { den, rock, torch, ramp, makeRampart, deckLeft, HOUSE_PART, HOUSE_Z0, HOUSE_Z1, makePlot, applyBiome, makeGate, barrel, chestHeap, chest } from './land.js';
import { piles, showPile, lastPlaced, refill, piecesLets } from './pieces.js';
import { cannon, ship, shipHome, passable, weakSpot, reel, rubbleShow } from './raids.js';
import { sword, swordReward } from './sword.js';
import { bilgePlace } from './bilge.js';
import { isHost, myId, send } from './crew.js';
import { rebuildDecor } from './menus.js';

// ---------- the wall, its gate and its holes ----------
export let wall = null;

// Other parts of the den assign to these lets through this, as an imported binding can't be assigned.
export const wallLets = {
  get wall() { return wall; }, set wall(v) { wall = v; },
};
export const wallGroup = new THREE.Group();
scene.add(wallGroup);
const stoneGeo = new RoundedBoxGeometry(S * 0.97, S * 0.95, STONE_D, 2, 0.06);
export const X = (c) => (c - wall.W / 2) * S;     // left edge of column c
export const Y = (r) => (wall.H - r) * S;         // top edge of row r
const backMat = mat('#120b07', { roughness: 1 });
export const cellPlane = new THREE.PlaneGeometry(S, S);

// A one-piece hole, for a common piece (P, F, Y, T, N or L): see roomyShapes.
function lastGap() {
  const l = C.weightedLetter(['W', 'U', 'V', 'Z', 'X', 'I']);
  return C.pick(C.ORIENTS_BY_LETTER[l]).cells;
}

/* Holes made during a raid (cannon breaches, and weak spots hacked wider) are shaped for the common
   pieces: of a few candidates, the one with the most ways to fill it from P, F, Y, T, N and L. In the
   real puzzle fresh holes keep coming, so there's always room to dump an awkward piece; here the wall
   is fixed, and small breaches that only a W or a U could finish left the user stuck ("a lot of
   shapes that I can never really fill"). The wall you start with stays small and simple: the user
   likes that opening, so it keeps its 1, 2 and 3-piece holes, but they're picked the same way: with
   random ones the user still "wasn't getting the right pieces a lot at the start". (A test of a player who always picks the most flexible spot: random 1- and
   2-piece breaches left them with no piece that fits about 4 draws in every piece placed; 3-piece
   breaches picked this way, about 1.5.) */
const COMMON = new Set(['P', 'F', 'Y', 'T', 'N', 'L']);
export const commonWays = (cells) => C.solve(cells, 400).filter((t) => t.every((p) => COMMON.has(p.letter))).length;
export function roomyShapes(n, tries = 8) {
  return Array.from({ length: tries }, () => C.genHole(n).hole).map((s) => ({ s, w: commonWays(s) })).filter((o) => o.w > 0).sort((a, b) => b.w - a.w).map((o) => o.s);
}

/* The wall in two courses (src/den-wall.ts): a high hole over a low one each side of the gate, the
   real puzzle's four holes, two up and two down. */
export function newWall() {
  // Of the roomy shapes, ones that lie low (four rows for three pieces, three for two), so the wall
  // stays nine or ten rows tall.
  const low = (n) => { const all = roomyShapes(n, 8), lies = (sh) => Math.min(C.bbox(sh).h, C.bbox(sh).w) <= n + 1; return all.find(lies) || all[0] || C.genHole(n).hole; };
  const shapes = [1, 2, 2, 3].map((n) => (n === 1 ? lastGap() : low(n)));
  const laid = twoCourses(shapes);
  const { W, H, gate } = laid;
  $('labels').replaceChildren();
  wall = { W, H, holes: [], cellHole: new Map(), wood: new Set(), lining: Array.from({ length: MAX_PATCHES }, () => new Set()), gate: new Set(), gateCols: gate, stoneAt: new Map() };
  for (let r = gateTop(H); r < H; r++) for (let c = gate.c0; c <= gate.c1; c++) wall.gate.add(k(r, c));
  wall.mid = lowMiddle(H, gate);
  laid.holes.forEach((cells) => registerHole(cells));
  buildWall();
  wall.holes.forEach((h) => { holeVisuals(h); updateHole(h); });
}

export function registerHole(cells) {
  const h = { cells, b: C.bbox(cells), set: new Set(cells.map(([r, c]) => k(r, c))), filled: new Set(), pieces: [], lay: [], status: 'open', hp: 0, maxHp: 1, size: cells.length / 5, jig: 0, sig: '', weak: WEAK };
  // A hole in the top course: raiders bring ladders and climb straight in through it (LADDER).
  h.high = isHigh(cells, wall.H);
  h.door = h.high ? null : doorOf(h);
  if (h.high) h.hop = true;
  const i = wall.holes.push(h) - 1;
  cells.forEach(([r, c]) => wall.cellHole.set(k(r, c), i));
  return h;
}
export function holeOutline(h) {
  if (h.vis) wallGroup.remove(h.vis);
  h.vis = outline(h.cells, 0.02, '#ffd58a');
  h.vis.position.set(X(0), Y(0), 0);
  wallGroup.add(h.vis);
}
export function holeVisuals(h) {
  holeOutline(h);
  h.label = document.createElement('div');
  $('labels').append(h.label);
}
// The column a raider can walk in at (the left of a gap DOOR_W wide and DOOR_H tall at the foot of
// the wall), nearest the middle of the hole; null if there's none.
export function doorOf(h) {
  const H = wall.H, mid = h.b.c0 + h.b.w / 2;
  let best = null;
  for (let c = h.b.c0; c + DOOR_W - 1 <= h.b.c1; c++) {
    let ok = true;
    for (let r = H - DOOR_H; r < H && ok; r++) for (let x = c; x < c + DOOR_W; x++) if (!h.set.has(k(r, x))) ok = false;
    if (ok && (best === null || Math.abs(c + DOOR_W / 2 - mid) < Math.abs(best + DOOR_W / 2 - mid))) best = c;
  }
  return best;
}

export let stones = null, back = null;
/* Dark behind the stones, to hide the gaps between them, but not behind a hole: a hole is open
   right through, so you see out to the raiders until it's mended. */
const sky = (r, c) => !!wall.mid && isSky(wall.mid, r, c);
// The top row of stone in a column (lower over the middle).
const colTop = (c) => (wall.mid && c >= wall.mid.c0 && c <= wall.mid.c1 ? wall.mid.top : 0);
export function wallBack() {
  if (back) { wallGroup.remove(back); back.geometry.dispose(); }
  const pos = [];
  for (let r = 0; r < wall.H; r++) for (let c = 0; c < wall.W; c++) {
    if (wall.cellHole.has(k(r, c)) || wall.gate.has(k(r, c)) || sky(r, c)) continue;
    const x0 = X(c), x1 = X(c + 1), y0 = Y(r + 1), y1 = Y(r);
    pos.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y0, 0, x1, y1, 0, x0, y1, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  back = mesh(geo, backMat, false);
  back.position.z = -STONE_D - 0.02;
  wallGroup.add(back);
}
export function buildWall() {
  wallGroup.clear();
  den.children.filter((o) => o.userData.scenery).forEach((o) => den.remove(o));
  const { W, H } = wall;
  const spots = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (!wall.cellHole.has(k(r, c)) && !wall.gate.has(k(r, c)) && !sky(r, c)) spots.push([r, c]);
  stones = new THREE.InstancedMesh(stoneGeo, mat('#ffffff', { roughness: 0.95 }), spots.length);
  stones.castShadow = stones.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  spots.forEach(([r, c], i) => {
    const sx = 0.9 + Math.random() * 0.1, sy = 0.86 + Math.random() * 0.14;
    q.setFromEuler(new THREE.Euler(0, 0, (Math.random() - 0.5) * 0.08));
    m4.compose(new THREE.Vector3(X(c) + S / 2, Y(r) - S / 2, -STONE_D / 2 + Math.random() * 0.06), q, new THREE.Vector3(sx, sy, 1));
    stones.setMatrixAt(i, m4);
    col.setHSL(0.08 + Math.random() * 0.04, 0.05 + Math.random() * 0.06, 0.2 + Math.random() * 0.1);
    stones.setColorAt(i, col);
    wall.stoneAt.set(k(r, c), i);
  });
  wallGroup.add(stones);
  // A top course of flat capstones, stepping down over the low middle.
  const capMat = mat('#4c443d');
  for (let c = 0; c < W;) {
    const n = c + 1 < W && colTop(c + 1) === colTop(c) ? 2 : 1;
    const cap = mesh(new RoundedBoxGeometry(S * n - 0.03, S * 0.5, STONE_D + 0.12, 2, 0.05), capMat);
    cap.position.set(X(c) + S * n / 2, Y(colTop(c)) + S * 0.25, -STONE_D / 2 + 0.03);
    wallGroup.add(cap);
    c += n;
  }
  wallBack();
  wallGroup.add(makeGate());
  // Cave walls down both sides of the den, and rock piles where the wall meets them.
  const half = W * S / 2;
  const scenery = [];
  for (let i = 0; i < 9; i++) scenery.push(rock(-half - 0.6 - Math.random() * 1.2, Math.random() * H * S, -0.3, 0.7 + Math.random() * 0.6));
  for (let i = 0; i < 9; i++) scenery.push(rock(half + 0.6 + Math.random() * 1.2, Math.random() * H * S, -0.3, 0.7 + Math.random() * 0.6));
  for (let z = -14; z < DEN_BACK + 2.5; z += 1.4) {
    scenery.push(rock(-half - 2.2 - Math.random() - (z > HOUSE_Z0 - 1.5 && z < HOUSE_Z1 + 1.5 ? 1.4 : 0), 0.4, z, 1 + Math.random() * 0.8));
    scenery.push(rock(half + 2.2 + Math.random(), 0.4, z, 1 + Math.random() * 0.8));
  }
  makeRampart();
  scenery.push(torch(-half + 1.75, ramp.zBot + 0.3), torch(half - 1.75, ramp.zBot + 0.3), torch(X(wall.gateCols.c0) - 0.5, 1), torch(X(wall.gateCols.c1 + 1) + 0.5, 1));
  // Out in the cove, the raiders' ship at anchor, broadside on; from wave 2 it runs out a cannon.
  const cx = half * 0.45;
  shipHome(cx);
  cannon.visible = false;
  scenery.push(ship, cannon);
  // Props inside: three crates for the piles, a fire barrel, the treasure chest.
  // (The right of the den is kept clear for the walk's frame: see deckStrips. In a narrow den the
  // crates shift left to make room, and the barrel and chest stand behind them.)
  const gap = Math.min(3.4, half * 0.42), shift = Math.min(0, deckLeft() - 1 - gap);
  piles.forEach((p, i) => { p.x = (i - 1) * gap + shift; p.z = 8; p.crate.position.set(p.x, 0.32, p.z); scenery.push(p.crate); });
  barrel.position.set(shift - gap / 2, 0, 9.9);
  chest.position.set(shift + gap / 2, 0, 9.85);
  scenery.push(barrel, chest);
  for (const x of [X(wall.gateCols.c0) - 0.3, X(wall.gateCols.c1 + 1) + 0.3]) {
    const fp = flagpole(1.8);
    fp.position.set(x, Y(colTop(wall.gateCols.c0)) + S * 0.5, -STONE_D / 2);
    scenery.push(fp);
  }
  scenery.forEach((o) => { o.userData.scenery = true; den.add(o); });
  worldLets.bounds = { x: half - 0.35, z0: 0.55, z1: DEN_BACK };
  // The armoury stack: against the left of the den, just in from the stairs, facing in.
  sword.x = -half + 1.75; sword.z = 3.2;
  sword.group.position.set(sword.x, 0, sword.z);
  worldLets.obstacles = [...piles.map((p) => ({ x: p.x, z: p.z, r: 0.75 })), { x: barrel.position.x, z: barrel.position.z, r: 0.55 }, { x: chest.position.x, z: chest.position.z, r: 0.75 },
    ...[-0.5, -0.25, 0, 0.25, 0.5].map((f) => ({ x: sword.x, z: sword.z + f * sword.w, r: 0.4 })), { x: sword.x, z: sword.z + sword.w / 2 + 0.15, r: 0.3 }];
  piles.forEach(showPile);
  bilgePlace(half);
  rebuildDecor();
  applyBiome(true);
  makePlot();
}

// ---------- the rules: where a piece can go, and what a hole needs now ----------
export const rest = (h) => h.cells.filter(([r, c]) => !h.filled.has(k(r, c)));
/* Every spot the piece could go: it must cover at least one empty square of an open hole and no
   square of another hole, the gate or other wood. Squares over the stone around the hole are
   allowed (that's boarding it over); `over` counts them. */
export function fits(cells) {
  const out = [], seen = new Set();
  const b = C.bbox(cells);
  wall.holes.forEach((h, hi) => {
    // With boards nailed on behind, only the part of the hole they don't cover can be reached.
    if (h.status !== 'open') return;
    const boarded = h.pieces.some((p) => p.patch);
    for (const [er, ec] of rest(h)) for (const [pr, pc] of cells) {
      const dr = er - pr, dc = ec - pc;
      if (seen.has(k(dr, dc))) continue;
      seen.add(k(dr, dc));
      let over = 0, ok = true;
      for (const [r, c] of cells) {
        const R = r + dr, Cc = c + dc, kk = k(R, Cc);
        if (R < 0 || R >= wall.H || Cc < 0 || Cc >= wall.W || wall.gate.has(kk) || sky(R, Cc) || wall.wood.has(kk) || (boarded && wall.lining.some((s) => s.has(kk)))) { ok = false; break; }
        const ho = wall.cellHole.get(kk);
        if (ho === undefined) over++;
        else if (ho !== hi) { ok = false; break; }
      }
      if (ok) out.push({ dr, dc, hole: hi, over, cx: X(dc) + b.w * S / 2, cy: Y(dr) - b.h * S / 2, fr: dr + b.h / 2, fc: dc + b.w / 2 });
    }
  });
  return out;
}
/* Layers behind: once a hole's mended, a timber frame (studwork) goes up round it on the den side,
   and the hole's shape is open in it again: a second layer to fill, piece by piece, the pieces
   slotting together like the hole itself (the user: one piece started a layer and the next, which
   fitted perfectly beside it, started a third). Filled exactly, it's a Masterpiece layer; a piece
   may hang over onto the studwork, but then the layer's only boarded over. Each layer done, the
   next opens in front of it, up to MAX_PATCHES. Raiders hack through the hole, then each layer in
   turn. So a piece that fits nowhere else still has a use. */
/* Boards nailed on behind a hole are planks (PATCH_D thick) right up against it: against the stone,
   or in front of a piece boarded over it, which stands proud. Each layer goes on in front of the
   last. patchZ is a layer's front face. (They used to be full-depth pieces standing half a metre
   out, and from the camera's angle the ghost showed half a square below the hole it was for: the
   user saw it as not snapping to the right place.) */
export const PATCH_D = 0.14;
const patchBase = (h) => (h?.pieces.some((p) => p.over && !p.patch) ? WOOD_D - 0.12 : 0.02);
export const patchZ = (layer, h) => patchBase(h) + PATCH_D * (layer + 1);
// The squares of studwork round a hole: a square's width all round, clear of the gate and other holes.
export function ringOf(h) {
  if (h.ring?.n === h.cells.length) return h.ring.cells;
  const out = new Map();
  for (const [r, c] of h.cells) for (let a = -1; a <= 1; a++) for (let z = -1; z <= 1; z++) {
    const R = r + a, Cc = c + z, kk = k(R, Cc), ho = wall.cellHole.get(kk);
    if (R >= 0 && R < wall.H && Cc >= 0 && Cc < wall.W && !h.set.has(kk) && !wall.gate.has(kk) && ho === undefined) out.set(kk, [R, Cc]);
  }
  h.ring = { n: h.cells.length, cells: [...out.values()] };
  return h.ring.cells;
}
const layerPieces = (h, i) => h.pieces.filter((p) => p.patch && p.layer === i);
export function layerOpen(h, i) {
  const cov = new Set(layerPieces(h, i).flatMap((p) => p.cells));
  return h.cells.filter(([r, c]) => !cov.has(k(r, c)));
}
// The layer pieces go into now: the outermost, until it's full; then a new one. -1: none.
export function curLayer(h) {
  const n = h.lay.length;
  if (!n) return h.status !== 'open' ? 0 : -1;
  if (h.lay[n - 1].status === 'open') return n - 1;
  return n < MAX_PATCHES ? n : -1;
}
export function patchFits(cells) {
  const out = [], b = C.bbox(cells);
  wall.holes.forEach((h, hi) => {
    const layer = curLayer(h);
    if (layer < 0) return;
    const ring = new Set(ringOf(h).map(([r, c]) => k(r, c))), seen = new Set();
    for (const [er, ec] of layerOpen(h, layer)) for (const [pr, pc] of cells) {
      const dr = er - pr, dc = ec - pc;
      if (seen.has(k(dr, dc))) continue;
      seen.add(k(dr, dc));
      let over = 0;
      const ok = cells.every(([r, c]) => {
        const kk = k(r + dr, c + dc);
        if (ring.has(kk)) over++;
        return (h.set.has(kk) || ring.has(kk)) && !wall.lining[layer].has(kk);
      });
      if (ok) out.push({ dr, dc, hole: hi, over, patch: true, layer, cx: X(dc) + b.w * S / 2, cy: Y(dr) - b.h * S / 2, fr: dr + b.h / 2, fc: dc + b.w / 2 });
    }
  });
  return out;
}
// A piece just went into layer i: count it in, and if the layer's full, it's done.
function layerAdd(h, i) {
  const L = h.lay[i];
  if (!L || L.status !== 'open') return;
  if (layerOpen(h, i).length) { L.hp += HP.piece; L.maxHp = L.hp; return; }
  const master = layerPieces(h, i).every((p) => !p.over);
  L.status = master ? 'master' : 'boarded';
  L.hp = L.maxHp = HP[L.status];
  G.gold += PAY[L.status];
  if (master) {
    G.masters++; toast('Masterpiece layer! Another one opens in front of it');
    if (!L.rewarded) { L.rewarded = true; swordReward(new THREE.Vector3(holeX(h), holeMidY(h), 0.6), 'Masterpiece layer'); }
  }
  else { G.boarded++; toast('Layer boarded over: it\'ll hold, but not for long', false, true); }
  layerPieces(h, i).forEach(({ group }) => group.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    tween(1.2, (t) => { o.material.emissive = new THREE.Color(master ? '#ffcf4a' : '#c98a45'); o.material.emissiveIntensity = 0.8 * (1 - t); });
  }));
  updateStats();
}
/* The studwork: a frame of timber a square wide round the opening of each layer there is (and the
   next one to fill), with a dark edge round the opening, so you can see where a layer goes and
   what's left to fill (the user: "some kind of wooden studwork structure outlining where the second
   layer goes, with material between the holes"). */
const studMat = mat('#8a5a32', { map: woodTex, roughness: 0.95 });
const studGeo = new THREE.BoxGeometry(S * 0.98, S * 0.98, 1);
function studwork(h) {
  const cur = curLayer(h), n = Math.min(MAX_PATCHES, Math.max(h.lay.length, cur + 1));
  const sig = `${n}|${h.cells.length}|${patchBase(h)}`;
  if (h.studSig === sig && h.stud?.parent === wallGroup) return;
  h.studSig = sig;
  if (h.stud) wallGroup.remove(h.stud);
  h.stud = null;
  if (!n) return;
  const g = new THREE.Group(), ring = ringOf(h), d = PATCH_D - 0.05;
  for (let i = 0; i < n; i++) {
    const z1 = patchZ(i, h) - 0.03;
    for (const [r, c] of ring) {
      const m = new THREE.Mesh(studGeo, studMat);
      m.scale.z = d;
      m.position.set((c + 0.5) * S, -(r + 0.5) * S, z1 - d / 2);
      m.castShadow = false;
      g.add(m);
    }
    g.add(fatOutline(h.cells, z1 + 0.005, '#3a2412', 0.07));
  }
  g.position.set(X(0), Y(0), 0);
  wallGroup.add(g);
  h.stud = g;
}
// Number each hole's boards from the stone outwards again (after one's broken or taken off), and
// note which squares each layer covers.
export function relining() {
  wall.lining.forEach((s) => s.clear());
  for (const h of wall.holes) {
    const boards = boardsOf(h), used = [...new Set(boards.map((p) => p.layer))].sort((a, b) => a - b);
    h.lay = used.map((i) => h.lay[i] || { hp: 0, maxHp: 1, status: 'open' });
    boards.forEach((p) => {
      const i = used.indexOf(p.layer);
      if (p.layer !== i) {
        p.layer = i;
        if (p.info) p.info.layer = i;
        const z0 = p.group.position.z, z1 = patchZ(i, h);
        p.base.z = z1;
        tween(0.25, (s) => { p.group.position.z = z0 + (z1 - z0) * s; });
      }
      p.cells.forEach((kk) => wall.lining[i].add(kk));
    });
  }
}
const an = (l) => ('AEFILMNORSX'.includes(l) ? 'an ' : 'a ') + l;
export function updateHole(h) {
  if (h.rubble > 0 && h.pieces.length) { h.rubble = 0; rubbleShow(h); }   // mended over the rubble
  const left = rest(h);
  if (!left.length && h.status === 'open') {
    const master = !h.pieces.some((p) => p.over);
    h.status = master ? 'master' : 'boarded';
    h.hp = h.maxHp = HP[h.status];
    G.gold += PAY[h.status];
    if (master) {
      G.masters++; masterpiece(h);
      // A breaker for it, once: taking a piece back and fitting it again doesn't pay twice.
      if (!h.rewarded) { h.rewarded = true; swordReward(new THREE.Vector3(holeX(h), holeMidY(h), 0.4), 'Masterpiece'); }
    }
    else { G.boarded++; toast(`Boarded over: it'll hold, but not for long`, false, true); }
  }
  h.open = left;
  h.exact = h.status === 'open' && left.length % 5 === 0 && C.solve(left, 1).length > 0;
  h.sig = '';
  updateStats();
}
/* While you're carrying a piece, every mended hole with room for another layer shows where it'd
   go: its outline on the den side, gently pulsing, like a frame waiting to be filled. */
// (A thin line was too faint to make out: the user couldn't see what shape it was. So the hole's
// squares are filled in a pulsing light blue, with a bold outline.)
export const nextMat = new THREE.MeshBasicMaterial({ color: '#5fcfff', transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false });
export function nextLayer(h) {
  studwork(h);
  const layer = curLayer(h), show = !!carry && pirate.h < 0.3 && layer >= 0;
  const open = show ? layerOpen(h, layer) : [], sig = `${layer}|${open.length}`;
  if (show && (h.next?.parent !== wallGroup || h.nextSig !== sig)) {
    if (h.next) wallGroup.remove(h.next);
    h.nextSig = sig;
    h.next = new THREE.Group();
    for (const [r, c] of open) {
      const p = new THREE.Mesh(cellPlane, nextMat);
      p.position.set((c + 0.5) * S, -(r + 0.5) * S, 0);
      h.next.add(p);
    }
    h.next.add(fatOutline(open, 0.01, '#bdeeff', 0.05));
    wallGroup.add(h.next);
  }
  if (!h.next) return;
  h.next.visible = show;
  if (show) h.next.position.set(X(0), Y(0), patchZ(layer, h) - PATCH_D + 0.01);   // where the board's back will go
}
const boardsOf = (h) => h.pieces.filter((p) => p.patch).sort((a, b) => a.layer - b.layer);
// How full the strength bar is: the hole's own wood, or once that's gone, the board they're on.
export const barFrac = (h) => (weakSpot(h) ? h.weak / WEAK : h.rubble > 0 && !h.pieces.length ? h.rubble / RUBBLE : h.hp / h.maxHp);
/* A bar under the hole's own for each layer behind it, so boarding behind a damaged hole shows (the
   user: "no visible difference to the healthbar"). An unfinished layer's bar is amber. */
const layBars = (h) => h.lay.map((L) => `<i class="bar lay${L.status === 'open' ? ' part' : ''}"><b></b></i>`).join('');
export function labelFor(h) {
  const atk = h.attackers ? `<em>⚔ ${h.attackers} raider${h.attackers > 1 ? 's' : ''} at it</em>` : '';
  const boards = h.lay.length, bs = boards > 1 ? 's' : '', cur = curLayer(h);
  const behind = boards ? ` · ${boards} layer${bs} behind` : '';
  const curOpen = cur >= 0 && h.lay[cur] ? layerOpen(h, cur).length : 0;
  const oneLeft = curOpen === 5 && C.identify(layerOpen(h, cur));
  const hurt = curOpen ? `<small>layer behind: ${oneLeft ? `needs ${an(oneLeft)}` : `${curOpen} squares to fill`}</small>`
    : h.hp < h.maxHp * 0.8 && cur >= 0 ? '<small>damaged: fill a layer behind it</small>' : carry && cur >= 0 ? `<small>room for ${boards ? 'another' : 'a'} layer behind</small>` : '';
  const bars = `<i class="bar"><b></b></i>${layBars(h)}`;
  if (h.status === 'master') return ['label done', `★ Masterpiece${behind}${hurt}${bars}${atk}`];
  if (h.status === 'boarded') return ['label weak', `Boarded over: weak${behind}${hurt}${bars}${atk}`];
  if (boards && !ownWood(h).length) return ['label weak', `Hacked open: ${boards} layer${bs} hold${boards > 1 ? '' : 's'}<small>they must get through each one</small>${hurt}${layBars(h)}${atk}`];
  if (h.rubble > 0 && !h.pieces.length) return ['label bad', `Fresh breach, full of rubble<small>mend it before they clear it!</small><i class="bar"><b></b></i>${atk}`];
  const left = h.open;
  const breach = h.pieces.length ? `<i class="bar part"><b></b></i>${layBars(h)}${atk}`
    : passable(h) && h.high ? `<em>${h.attackers ? '⚔ raiders on ladders!' : 'wide open: raiders can climb in'}</em>`
    : passable(h) ? `<em>${h.attackers ? '⚔ raiders can walk in!' : 'wide open: raiders can walk in'}</em>`
    : h.attackers || h.weak < WEAK ? `<small>too small to walk through: they're hacking it wider</small><i class="bar"><b></b></i>${atk}` : '';
  if (!h.exact) return ['label bad', `No Masterpiece now<small>board it over to close it</small>${breach}`];
  if (left.length === 5) return ['label', `Needs ${an(C.identify(left))}${breach}`];
  if (left.length === 10) {
    const list = C.combos(left).map((c) => c.letters.join('+'));
    return ['label', `Two pieces<small>${list.slice(0, 3).join(' · ')}${list.length > 3 ? ' · …' : ''}</small>${breach}`];
  }
  return ['label', `${left.length / 5} pieces${breach}`];
}
export function frameLabel(f) {
  const left = f.open;
  const need = left.length === 5 && f.exact ? `needs ${an(C.identify(left))}` : f.exact ? `room for ${left.length / 5} more pieces` : f.kind === 'stair' ? `${left.length} squares left: any piece will do` : `${left.length} squares left: any piece, the spare's sawn off`;
  return ['label deck', `${{ stair: 'Stairs up to the wall', gun: `Gun tower frame (${['back', 'middle', 'front'][f.part]})`, house: `Your shack: the ${HOUSE_PART[f.part]}` }[f.kind] || 'Wall-walk frame'}<small>${need}</small>`];
}
export function updateStats() {
  $('s-gold').textContent = Math.max(0, G.gold);
  $('s-wave').textContent = G.wave;
  $('s-master').textContent = G.masters;
  $('s-board').textContent = G.boarded;
  $('s-turned').textContent = G.turned || 0;
  chestHeap.scale.y = 0.08 + 0.5 * Math.min(1, Math.max(0, G.gold) / 60);
}
/* Planks from the armoury's broken crates, nailed into a hole as a piece's worth of repair: two
   boards a square, weathered paler than the timber, with nail heads at the ends. */
export const plankMat = mat('#ffffff', { roughness: 0.85, map: canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#a98c66'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 18; i++) {
    g.strokeStyle = `rgba(80, 52, 28, ${0.15 + Math.random() * 0.2})`;
    g.lineWidth = 1;
    const y = Math.random() * h;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (Math.random() - 0.5) * 3); g.stroke();
  }
  g.fillStyle = 'rgba(50, 30, 14, 0.85)';
  g.fillRect(0, h / 2 - 1.5, w, 3);
  g.fillStyle = '#3a3a3e';
  for (const y of [h / 4, h * 3 / 4]) for (const x of [7, w - 7]) { g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill(); }
}) });
// A piece in the wall, where it ends up: a clean fit sits flush in the hole; a board nailed over
// the stone sticks out in front of it; boards behind stack up on the den side.
export function putPiece(h, i) {
  const over = i.over > 0;
  const g = pieceGroup(i.shape, i.planks ? plankMat : woodMat(i.letter));
  if (i.patch) g.scale.z = PATCH_D / WOOD_D;
  const to = new THREE.Vector3(X(i.dc), Y(i.dr), i.patch ? patchZ(i.layer, h) : over ? WOOD_D - 0.12 : -0.04);
  g.position.copy(to);
  wallGroup.add(g);
  const cells = i.shape.map(([r, c]) => k(r + i.dr, c + i.dc));
  if (i.patch) cells.forEach((kk) => wall.lining[i.layer].add(kk));
  else cells.forEach((kk) => { wall.wood.add(kk); if (h.set.has(kk)) h.filled.add(kk); });
  const b = C.bbox(i.shape);
  const piece = { group: g, cells, over, patch: !!i.patch, base: to.clone(), cx: to.x + b.w * S / 2, by: i.by, info: i, undo: null };
  if (i.patch) { piece.layer = i.layer; h.lay[i.layer] ||= { hp: 0, maxHp: 1, status: 'open' }; }
  h.pieces.push(piece);
  return piece;
}
export function placeWall(t, by, hand) {
  const h = wall.holes[t.hole];
  const info = { letter: hand.letter, shape: hand.cells, dr: t.dr, dc: t.dc, over: t.over, patch: !!t.patch, layer: t.layer ?? 0, by };
  const from = hand.group.position.clone();
  scene.remove(hand.group);
  if (hand === carry) worldLets.carry = null;
  const undo = { h, letter: info.letter, shape: info.shape, prev: { status: h.status, hp: h.hp, maxHp: h.maxHp }, prevLay: h.lay[info.layer] ? { ...h.lay[info.layer] } : null, boarded: G.boarded, masters: G.masters, hpAfter: null };
  const piece = undo.piece = putPiece(h, info);
  piece.undo = undo;
  if (by === myId()) piecesLets.lastPlaced = undo;
  if (isHost()) send('all', { t: 'place', hole: t.hole, ...info });
  const g = piece.group, to = piece.base.clone(), b = C.bbox(info.shape);
  const off = new THREE.Vector3(-b.w * S / 2, b.h * S / 2, 0);
  const wasExact = h.exact;
  h.busy = (h.busy || 0) + 1;
  tween(0.32, (s) => {
    const e = 1 - (1 - s) ** 3;
    g.position.lerpVectors(from.clone().add(off), to, e);
    g.position.z += Math.sin(s * Math.PI) * 0.6;
  }, () => {
    h.busy--;
    g.position.copy(to);
    if (!h.pieces.includes(piece)) return;   // knocked out while it was flying in
    if (piece.patch) {
      layerAdd(h, info.layer);
      undo.hpAfter = h.lay[info.layer]?.hp ?? 0;
      burst(new THREE.Vector3(to.x + b.w * S / 2, to.y - b.h * S / 2, to.z + 0.1), '#ffe0a0', 10, 2.5);
      h.sig = '';
      return;
    }
    updateHole(h);
    if (h.status === 'open') { h.hp += HP.piece; h.maxHp = h.hp; }
    undo.hpAfter = h.hp;
    if (h.status === 'master' && lastPlaced === undo) piecesLets.lastPlaced = null;   // a Masterpiece is never a misclick
    if (by === myId() && h.status === 'open' && wasExact && !h.exact) { worldLets.shake = 0.3; toast('No Masterpiece in that hole now · Space: take it back', true); }
  });
  refill(hand.from);
}
export function breakHole(h) {
  if (isHost()) send('all', { t: 'break', hole: wall.holes.indexOf(h) });
  const boards = boardsOf(h);
  h.pieces.filter((p) => !p.patch).forEach(({ group: g, cells }) => {
    cells.forEach((kk) => wall.wood.delete(kk));
    // With boards behind it, the wood falls out the far side instead of into the den.
    const v = new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random(), (boards.length ? -1 : 1) * (2.5 + Math.random() * 1.5));
    const p0 = g.position.clone();
    tween(0.8, (s) => { g.position.set(p0.x + v.x * s, p0.y + v.y * s - 9 * s * s, p0.z + v.z * s); g.rotation.x = s * 3; }, () => wallGroup.remove(g));
  });
  h.pieces = boards;
  h.filled.clear();
  h.status = 'open'; h.rewarded = false;   // mend it again as a Masterpiece and it pays again
  h.hp = 0;
  updateHole(h);
  burst(new THREE.Vector3(holeX(h), holeMidY(h), 0.3), '#c98a45', 24, 4);
  worldLets.shake = 0.5;
  reel(h);
  toast(boards.length ? 'Through the hole! Only the boards behind it hold them now' : 'They broke through!', true);
}
/* A hole's wood comes out a piece at a time, the last one put in first (as in the real puzzle, where
   a neglected hole loses its most recently placed piece). Each piece holds an equal share of the
   hole's strength, so a Masterpiece of three pieces loses one every 15 seconds of hacking. The gap a
   piece leaves is too small to walk through, so there's a chance to put one back; doing that
   finishes the hole again, and only the share that fell is made good. The user found a whole hole's
   wood falling out in one go frustrating. */
const ownWood = (h) => h.pieces.filter((p) => !p.patch);
export const nextOut = (h) => { const n = ownWood(h).length; return n > 1 ? h.maxHp * (n - 1) / n : 0; };
export function dropPiece(h) {
  const own = ownWood(h), p = own[own.length - 1];
  if (own.length <= 1) return breakHole(h);
  if (isHost()) send('all', { t: 'drop', hole: wall.holes.indexOf(h) });
  h.pieces = h.pieces.filter((x) => x !== p);
  p.cells.forEach((kk) => { wall.wood.delete(kk); h.filled.delete(kk); });
  const g = p.group, p0 = g.position.clone(), out = boardsOf(h).length ? -1 : 1;
  const v = new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random(), out * (2.5 + Math.random() * 1.5));
  tween(0.8, (s) => { g.position.set(p0.x + v.x * s, p0.y + v.y * s - 9 * s * s, p0.z + v.z * s); g.rotation.x = s * 3; }, () => wallGroup.remove(g));
  h.maxHp *= (own.length - 1) / own.length;
  h.hp = Math.min(h.hp, h.maxHp);
  h.status = 'open';
  if (lastPlaced?.piece === p) piecesLets.lastPlaced = null;
  updateHole(h);
  burst(new THREE.Vector3(p.cx, holeMidY(h), 0.3), '#c98a45', 16, 3.5);
  worldLets.shake = 0.3;
  toast(`They knocked ${an(p.info.letter)} out! Put one back before they're through`, true);
}
// A layer behind comes apart the same way as the hole: a piece at a time, the last one in first.
export function layerNextOut(h, i) { const n = layerPieces(h, i).length, L = h.lay[i]; return n > 1 ? L.maxHp * (n - 1) / n : 0; }
export function dropBoard(h, i, out) {
  const ps = layerPieces(h, i), p = ps[ps.length - 1], L = h.lay[i];
  if (!p) return;
  if (ps.length > 1) {
    L.maxHp *= (ps.length - 1) / ps.length;
    L.hp = Math.min(L.hp, L.maxHp);
    L.status = 'open';
  }
  if (lastPlaced?.piece === p) piecesLets.lastPlaced = null;
  breakBoard(h, p, out);
  toast(ps.length > 1 ? `They knocked ${an(p.info.letter)} out of the layer behind!` : 'Through a layer behind!', true);
}
export function breakBoard(h, p) {
  if (isHost()) send('all', { t: 'unboard', hole: wall.holes.indexOf(h), i: h.pieces.indexOf(p) });
  h.pieces = h.pieces.filter((x) => x !== p);
  const g = p.group, p0 = g.position.clone(), v = new THREE.Vector3((Math.random() - 0.5) * 2, 1.5 + Math.random(), 2.5 + Math.random());
  tween(0.8, (s) => { g.position.set(p0.x + v.x * s, p0.y + v.y * s - 9 * s * s, p0.z + v.z * s); g.rotation.x = s * 3; }, () => wallGroup.remove(g));
  relining();
  updateHole(h);
  burst(new THREE.Vector3(holeX(h), holeMidY(h), patchZ(0, h)), '#c98a45', 16, 3.5);
  worldLets.shake = 0.3;
  reel(h);
  toast(h.pieces.length ? 'They hacked through a board!' : 'They broke through!', true);
}
export const holeX = (h) => X(h.b.c0) + h.b.w * S / 2;
export const holeMidY = (h) => Y(h.b.r0) - h.b.h * S / 2;
export const holeFootY = (h) => Y(h.b.r1 + 1);

function masterpiece(h) {
  toast('Masterpiece! Strong as iron');
  const glow = new THREE.Color('#ffcf4a');
  h.pieces.forEach(({ group }) => group.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    tween(1.2, (s) => { o.material.emissive = glow; o.material.emissiveIntensity = 0.8 * (1 - s); });
  }));
  for (let i = 0; i < 3; i++) burst(new THREE.Vector3(X(h.b.c0) + Math.random() * h.b.w * S, Y(h.b.r0) - Math.random() * h.b.h * S, 0.2), '#ffd45a', 14, 3);
}
