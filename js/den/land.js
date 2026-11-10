// The den's land and what's built on it: the floor and props, the landscape, the gate, the
// rampart's frames (stairs and walk), and your shack. (Split out of den.js.)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gateTop } from '../den-wall.js';
import { CarpentryFrame } from '../carpentry-frame.js';
import { HIGH } from '../den-bilge.js';
import { beachFloor } from '../den-beach.js';
import { dyeHex } from '../den-look.js';
import { C, S, WOOD_D, STONE_D, WALL_Z, DEN_BACK, PAY, k, rand, $, denLook, scene, camera, hemi, paintSky, mat, mesh, canvasTex, woodTex, groundTex, WOOD, woodMat, pieceGroup, outline, xrMat, addXray, V3, basis, flags, flagpole, pirate, HOP, carry, obstacles, G, wm, burst, toast, tween, fatOutline, v3, worldLets, redrawRoom } from './world.js';
import { wall, X, cellPlane, updateStats } from './wall.js';
import { GD, GUN_FRAME_Z, gd, gunX0, gunZ0, partR0, gunShape, makeGunDeck, gundeckLets } from './gundeck.js';
import { fair, lastPlaced, refill, piecesLets } from './pieces.js';
import { shipTick } from './raids.js';
import { swordReward } from './sword.js';
import { shoreZ } from './bilge.js';
import { chart } from './map.js';
import { cine } from './cine.js';
import { net, guest, isHost, myId, send, say } from './crew.js';
import { deco, dress } from './menus.js';
import { swordView, deckView } from '../den.js';

// ---------- the den: floor, rocks, torches, props ----------
export const den = new THREE.Group();
scene.add(den);
/* The den is in a cove: out beyond the wall a beach, and the sea from SHORE out, where the raiders'
   ship lies at anchor and their rowboats come in (the user, 9 Nov: "they're rowing in little
   rowboats onto the beach of your pirate hideout, and the cannon is actually a ship off in the
   distance ... like you're in, you know, a cove of some kind"). */
const SHORE = -18;   // as far out as the beach goes (the tide's lowest is a metre short of it)
let shoreParts = [];   // the sea, its surf and the sand, moved in and out with the tide
const floor = mesh(new THREE.PlaneGeometry(70, 29 - SHORE), mat('#ffffff', { map: groundTex, roughness: 1 }), false);
floor.rotation.x = -Math.PI / 2;
floor.position.z = (29 + SHORE) / 2;
den.add(floor);
const rockMats = ['#5d5048', '#6b5c50', '#4f443d', '#73655a'].map((c) => mat(c, { flatShading: true }));
export function rock(x, y, z, s) {
  const r = mesh(new THREE.DodecahedronGeometry(s, 0), rockMats[rand(rockMats.length)]);
  r.position.set(x, y, z);
  r.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  r.scale.y = 0.7 + Math.random() * 0.5;
  return r;
}
export function torch(x, z) {
  const t = new THREE.Group();
  const stick = mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 8), mat('#4a2f1a'));
  stick.position.y = 0.8;
  const flame = mesh(new THREE.ConeGeometry(0.13, 0.36, 10), new THREE.MeshBasicMaterial({ color: '#ffb347' }), false);
  flame.position.y = 1.78;
  const light = new THREE.PointLight('#ff9a3c', 14, 9, 1.6);
  light.position.y = 2;
  t.add(stick, flame, light);
  t.position.set(x, 0, z);
  return t;
}

/* The rampart: a walk along the top of the wall, with stairs up from the den at the right-hand end
   (the armoury hoist has the left: the user, 9 Nov, "sword fighting board on the left, stairs on the
   right for the ramparts to go up", so the start of the den isn't overstretched). Up
   there the pirate can see over the wall and throw pieces down on the raiders hacking at it. None
   of it is there to start with: every plank of the walk and every step of the stairs is a carpentry
   piece the crew fits into a frame, and it stays that piece. Nothing turns into anything else. */
export let ramp = null;
const STAIR_W = 1.1;
export function makeRampart() {
  const half = wall.W * S / 2, T = wall.H * S + 0.38, n = wall.H + 1, zTop = 0.25, run = n * S, zBot = zTop + run;
  // What gets built, in order: the whole walk in one frame and then the stairs up to it, the gun
  // tower, and the shack whenever you ask for it. `si`: which timber it comes with; `end`: which end
  // of the den stairs are at (0 left, 1 right).
  const jobs = [[0, 'deck'], [0, 'stair', 0, 1], [3, 'gun', 0], [3, 'gun', 1], [3, 'gun', 2], [4, 'house', 0], [4, 'house', 1], [4, 'house', 2], [4, 'house', 3]].map(([si, kind, part, end], i) => ({ i, si, kind, part, end: end ?? 0, frame: null, up: false }));
  gundeckLets.gd = null;
  ramp = { T, half, n, zTop, zBot, run, jobs, next: 0, stairs: [[-half + 0.2, -half + 0.2 + STAIR_W], [half - 0.2 - STAIR_W, half - 0.2]] };
}
/* Building it. Timber for the walk arrives as soon as every hole's mended, for each later part after
   a wave is beaten off (timberComes, src/den-raids.ts), and its frames come one
   at a time: the next only once the last is done, so there's never more than one to get on with.
   - The walk: a frame laid flat on the den floor in front of the wall. Lay pieces in it one at a
     time. A piece may stick out over the edge (so any piece will do); the spare is sawn off when
     the frame's full. Then the crew haul it up on ropes, pieces and all, and it's laid along the
     top of the wall. You walk on the very pieces you laid.
   - The stairs: a frame standing upright at the end of the den, a stepped stringer from the floor
     up to the walk. Fit pieces into it like a hole in the wall; they're the steps. */
// Well back from where you stand to mend the wall: just behind it, the walk frame took the pieces
// meant for the wall (the user: "the walk frame gets the focus").
const FRAME_Z = WALL_Z + 1.6;
export const frameMat = mat('#4a3220', { roughness: 1 });
const railMat = mat('#8a5a30', { map: woodTex });
const railGeo = [new THREE.BoxGeometry(0.06, S + 0.06, 0.07), new THREE.BoxGeometry(S + 0.06, 0.06, 0.07)];
const ropeMat = new THREE.LineBasicMaterial({ color: '#d8b77a' });
export const frames = () => (ramp ? ramp.jobs.filter((j) => j.frame && !j.frame.done).map((j) => j.frame) : []);
// A point on a frame, from its grid (columns across, rows down), `z` out from its face.
export const frameAt = (f, c, r, z = 0) => f.group.localToWorld(new THREE.Vector3(c * S, -r * S, z));
/* The walk: built in one squarish frame, then sawn into lengths that go up end to end. One long
   thin frame the length of the wall ran you out of the rare pieces it needed; the user would rather
   build it square, "a more faithful depiction of carpentry": "one square, but then when it gets
   hoisted ... it almost gets like sliced in the middle 2 or 3 times". So the walk's length is cut
   into strips (eleven or twelve squares each, four on most walls), three squares deep: two over the
   stone, one out over the den, and only two at the ends, clear of where the stairs come up. In the
   frame they lie side by side with straight cuts between them. The first lies turned round, so its
   den side is the frame's outer edge, with single squares jutting out of it where the rare pieces
   go, an X or a W; the last has its den side on the other outer edge. A square or two is bitten out
   of each edge to make the count come right for each half of the frame. It's always one that can be filled with not a scrap
   wasted. The frame lies on the floor at the right of the den, the strips running back from the
   wall (deckPose). */
const DECK_D = 3;
function deckStrips() {
  const W = wall.W, n = Math.max(2, Math.ceil(W / 12)), out = [];
  for (let s = 0, a = 0; s < n; s++) {
    const w = Math.floor(W / n) + (s < W % n ? 1 : 0);
    out.push({ a, w, R: 1 + DECK_D * s, turned: s === 0 });
    a += w;
  }
  return out;
}
const deckRows = () => 1 + DECK_D * deckStrips().length;
export const deckLeft = () => wall.W * S / 2 - 0.45 - deckRows() * S;
// Where the frame lies: rows across the den from deckLeft, columns running back from the far end.
// (Its near end well back from where you stand to mend the wall: see FRAME_Z. A twelve-square
// strip runs a little past where you can walk to, still in reach.)
const deckPose = () => ({ p: V3(deckLeft(), 0, Math.max(DEN_BACK - 0.05, FRAME_Z + 0.05 + Math.max(...deckStrips().map((o) => o.w)) * S)), q: basis(V3(0, 0, -1), V3(-1, 0, 0)) });
// Where a square of the walk [row out from the wall, column along it] lies in the frame.
function deckToFrame(r, c, st = deckStrips()) {
  const o = st.find((x) => c >= x.a && c < x.a + x.w) || st[st.length - 1];
  return o.turned ? [o.R + DECK_D - 1 - r, o.w - 1 - (c - o.a)] : [o.R + r, c - o.a];
}
// n columns from `cols`, no two side by side (null if there's no room for that many).
function apart(cols, n) {
  const got = [];
  for (const c of C.shuffle(cols)) if (got.length < n && !got.some((g) => Math.abs(g - c) < 2)) got.push(c);
  return got.length === n ? got : null;
}
function deckShape() {
  const W = wall.W, st = deckStrips(), first = st[0], last = st[st.length - 1];
  // The frame's two halves, either side of the middle cut: each is made to be filled on its own,
  // which is quick to check (the whole frame at once can take seconds).
  const m = Math.ceil(st.length / 2), cut = st[m].a, half = (c) => (c < cut ? 0 : 1);
  const base = [];
  for (let c = 0; c < W; c++) for (let r = 0; r < (c >= 3 && c < W - 3 ? DECK_D : 2); r++) base.push([r, c]);
  const count = [0, 0];
  for (const [, c] of base) count[half(c)]++;
  const range = (lo, hi) => Array.from({ length: Math.max(0, hi - lo) }, (_, i) => lo + i);
  // Spots on an edge for n squares, apart if there's room, else any.
  const some = (cols, n) => apart(cols, n) || (cols.length >= n ? C.shuffle(cols).slice(0, n) : null);
  let cells = null;
  for (let t = 0; t < 60; t++) {
    // The first half: squares jutting out (and maybe one bitten out) to make its count come right.
    const nj = 1 + rand(3), nb0 = (count[0] + nj) % 5;
    const top = range(4, first.w - 1), juts = apart(top, nj);
    const bites0 = juts && some(top.filter((c) => !juts.some((j) => Math.abs(j - c) < 2)), nb0);
    // The second half: squares bitten out of the last strip's den side.
    const bites1 = some(range(last.a + 1, W - 4), count[1] % 5);
    if (!juts || !bites0 || !bites1) continue;
    const gone = new Set([...bites0, ...bites1].map((c) => k(DECK_D - 1, c)));
    cells = base.filter(([r, c]) => !gone.has(k(r, c))).concat(juts.map((c) => [DECK_D, c]));
    const halves = [[], []];
    for (const [r, c] of cells) halves[half(c)].push(deckToFrame(r, c, st));
    if (halves.every((h) => tileable(h))) return cells;
  }
  return cells || base.slice(0, base.length - base.length % 5);
}
/* The stairs: solid, from the treads right down to the den floor, so the stepped edge is all corners
   for the odd pieces to tuck into. (A band three squares deep held only four pieces, with room for
   an X in one spot in five.) Column 0 is at the bottom of the left stairs, and at the top of the
   right ones. A few squares are left out at the back of the floor under the top step, where nobody
   treads, so it can be filled with not a scrap wasted. */
/* A stringer, STAIR_D squares deep under each step: since the wall went to two courses (9 Nov) it's
   half as tall again, and a solid triangle of steps took twice the pieces. */
const STAIR_D = 4;
function stairShape(si) {
  const n = ramp.n, cells = [], spare = [];
  for (let c = 0; c < n; c++) {
    const top = si === 0 ? n - 1 - c : c;
    for (let r = top; r < Math.min(n, top + STAIR_D); r++) { cells.push([r, c]); if (r >= top + 2) spare.push({ cell: [r, c], top }); }
  }
  const m = cells.length % 5;
  spare.sort((a, b) => b.cell[0] - a.cell[0] || a.top - b.top);
  for (let t = 0; t < 40; t++) {
    const gone = new Set((t ? C.shuffle(spare.slice(0, m + 4)) : spare).slice(0, m).map((o) => k(...o.cell)));
    const out = cells.filter(([r, c]) => !gone.has(k(r, c)));
    if (C.solve(out, 1).length) return out;
  }
  return cells.slice(0, cells.length - m);
}
export function openJob(i, shape = null) {
  const j = ramp.jobs[i];
  if (!j || j.frame) return j?.frame || null;
  if (j.kind !== 'house') ramp.next = Math.max(ramp.next, i + 1);
  const stair = j.kind === 'stair';
  shape ||= stair ? stairShape(j.end) : j.kind === 'gun' ? gunShape(j.part) : j.kind === 'house' ? houseShape(j.part) : deckShape();
  if (isHost()) send('all', { t: 'frame', fi: i, cells: shape });
  // The walk's shape is the walk itself; its frame has the strips side by side (see deckShape).
  const walk = j.kind === 'deck' ? shape : null;
  if (walk) { const st = deckStrips(); shape = walk.map(([r, c]) => deckToFrame(r, c, st)); }
  const g = new THREE.Group();
  if (walk) {
    const dp = deckPose();
    g.position.copy(dp.p);
    g.quaternion.copy(dp.q);
  } else if (j.kind === 'house') {
    // Laid flat on the floor in front of where the house goes, face up.
    const flat = housePose(-1);
    g.position.copy(flat.p);
    g.quaternion.copy(flat.q);
  } else if (!stair) {
    // Laid flat: the rows run from the wall towards the den, the face is up.
    g.position.set(j.kind === 'gun' ? gunX0() : X(0), 0, j.kind === 'gun' ? GUN_FRAME_Z : FRAME_Z);
    g.rotation.x = -Math.PI / 2;
  } else {
    // Stood on end against the side of the cave, facing into the den.
    const [xa, xb] = ramp.stairs[j.end];
    if (j.end === 0) { g.position.set(xb, ramp.T, ramp.zBot); g.rotation.y = Math.PI / 2; }
    else { g.position.set(xa, ramp.T, ramp.zTop); g.rotation.y = -Math.PI / 2; }
    g.scale.y = ramp.T / (ramp.n * S);
  }
  const set = new Set(shape.map(([r, c]) => k(r, c)));
  for (const [r, c] of shape) {
    const p = mesh(cellPlane, frameMat, false);
    p.receiveShadow = true;
    p.position.set((c + 0.5) * S, -(r + 0.5) * S, stair ? -STAIR_W - 0.01 : 0.012);
    g.add(p);
    // A timber rail round the edge, so it reads as a frame to fill.
    for (const [a, z] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      if (set.has(k(r + a, c + z))) continue;
      const rail = mesh(railGeo[a ? 1 : 0], railMat);
      rail.position.set((c + 0.5 + z * 0.5) * S, -(r + 0.5 + a * 0.5) * S, 0.035);
      g.add(rail);
    }
  }
  g.add(outline(shape, 0.075, '#9fe0ff'));
  g.userData.scenery = true;
  den.add(g);
  g.updateMatrixWorld(true);
  const label = document.createElement('div');
  $('labels').append(label);
  const b = C.bbox(shape);
  const f = j.frame = {
    i, si: j.si, end: j.end, kind: j.kind, part: j.part, cells: shape, walk, b, set, pieces: [], group: g, label, sig: '', done: false,
    // Carpentry's frame (src/carpentry-frame.ts): what's laid, what fits, lifting a piece back out,
    // sawing. A piece may stick out any way; on the stairs, at most a square above the treads.
    // `pieces` are its pieces as drawn, in the same order as its `laid`.
    carp: new CarpentryFrame(shape, stair ? { allow: (r, c) => r >= stepTop(f, c) - 1 } : {}),
    pz: stair ? 0 : 0.1, zs: stair ? STAIR_W / WOOD_D : 1,
    plane: new THREE.Plane().setFromNormalAndCoplanarPoint(g.getWorldDirection(new THREE.Vector3()), g.getWorldPosition(new THREE.Vector3())),
  };
  f.mid = frameAt(f, b.w / 2, b.h / 2, stair ? 0.4 : 0.7);
  frameState(f);
  burst(frameAt(f, b.w / 2, b.h / 2, 0.3), '#e8c890', 18, 3);
  return f;
}
/* Can these squares be filled exactly? For the frames: the solver's plain search could take
   seconds on the square walk frame, so this one gives up on a line as soon as the empty squares
   split into a pocket that isn't a multiple of five (it can never be filled), which rules out
   nearly every dead end at once. Past `budget` steps it says no. */
const ORIENTS = Object.values(C.ORIENTS_BY_LETTER).flat().map((o) => o.cells.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]));
function tileable(cells, budget = 20000) {
  if (cells.length % 5) return false;
  if (!cells.length) return true;
  // A grid with a border of blocked squares round it: 1 free, 0 not.
  const b = C.bbox(cells), w = b.w + 8, h = b.h + 8, at = (r, c) => (r - b.r0 + 4) * w + (c - b.c0 + 4);
  const free = new Uint8Array(w * h), mark = new Int32Array(w * h), stack = new Int32Array(w * h);
  const order = cells.map(([r, c]) => at(r, c)).sort((x, y) => x - y);
  for (const i of order) free[i] = 1;
  const shapes = ORIENTS.map((o) => o.map(([r, c]) => (r - o[0][0]) * w + (c - o[0][1])));
  const nb = [1, -1, w, -w];
  let steps = 0, stamp = 0;
  const pocketsOk = () => {
    stamp++;
    for (const s0 of order) {
      if (!free[s0] || mark[s0] === stamp) continue;
      let n = 0, top = 0;
      stack[top++] = s0; mark[s0] = stamp;
      while (top) {
        const x = stack[--top];
        n++;
        for (const d of nb) { const y = x + d; if (free[y] && mark[y] !== stamp) { mark[y] = stamp; stack[top++] = y; } }
      }
      if (n % 5) return false;
    }
    return true;
  };
  const rec = (from) => {
    if (++steps > budget) return false;
    let i = from;
    while (i < order.length && !free[order[i]]) i++;
    if (i === order.length) return true;
    const f = order[i];
    for (const sh of shapes) {
      if (!sh.every((o) => free[f + o])) continue;
      for (const o of sh) free[f + o] = 0;
      if (pocketsOk() && rec(i + 1)) return true;
      for (const o of sh) free[f + o] = 1;
      if (steps > budget) return false;
    }
    return false;
  };
  return rec(0);
}
export function frameState(f) {
  f.open = f.carp.open();
  f.exact = f.open.length % 5 === 0 && tileable(f.open);
  f.sig = '';
  // The room a piece has round it, chalked where it's limited (the stairs: not far above the treads).
  // On the stairs the line's on their face, the tint on the cave wall behind; it goes with the frame.
  if (f.carp.bounded()) f.room = f.done || f.carp.done() ? (f.room?.removeFromParent(), null) : redrawRoom(f.group, f.room, f.carp, f.kind === 'stair' ? 0.07 : 0.08, f.kind === 'stair' ? -STAIR_W - 0.005 : 0.02);
}
// Every spot a piece could go in a frame: covering at least one empty square of it, clear of the
// pieces already there. Squares off the frame are allowed; `over` counts them.
// The stairs' tread line: the top row of column c (beyond either end, it carries straight on). A
// piece may stick up at most one square above it, so the stairs stay climbable with a hop.
export const stepTop = (f, c) => (f.end === 0 ? ramp.n - 1 - c : c);
export function frameFits(cells) {
  const out = [], b = C.bbox(cells);
  for (const f of frames()) for (const { r: dr, c: dc, over } of f.carp.fits(cells)) {
    const gc = dc + b.w / 2, gr = dr + b.h / 2, w = frameAt(f, gc, gr);
    out.push({ frame: f, dr, dc, over, gc, gr, cx: w.x, cy: w.y, cz: w.z });
  }
  return out;
}
// A piece in a frame, where it ends up (no flying in): for placing, and for a joiner's copy.
export function putFramePiece(f, i) {
  const g = pieceGroup(i.shape, woodMat(i.letter));
  g.position.set(i.dc * S, -i.dr * S, f.pz);
  g.scale.z = f.zs;
  f.group.add(g);
  f.carp.lay(i.letter, i.shape.map(([r, c]) => [r + i.dr, c + i.dc]));
  const cells = i.shape.map(([r, c]) => k(r + i.dr, c + i.dc));
  const b = C.bbox(i.shape), w = frameAt(f, i.dc + b.w / 2, i.dr + b.h / 2);
  const piece = { group: g, cells, shape: i.shape, over: i.over, cx: w.x, cy: w.y, cz: w.z, by: i.by, info: i, undo: null };
  f.pieces.push(piece);
  return piece;
}
export function placeFrame(t, by, hand) {
  const f = t.frame;
  const info = { letter: hand.letter, shape: hand.cells, dr: t.dr, dc: t.dc, over: t.over, by };
  if (hand.fair) fair.holdBack(hand.letter);   // dealt for the wall, used here: see FairDeal.holdBack
  const from = f.group.worldToLocal(hand.group.position.clone());
  scene.remove(hand.group);
  if (hand === carry) worldLets.carry = null;
  const piece = putFramePiece(f, info), g = piece.group, to = g.position.clone(), b = C.bbox(info.shape);
  const off = new THREE.Vector3(-b.w * S / 2, b.h * S / 2, 0);
  const undo = piece.undo = { frame: f, letter: info.letter, shape: info.shape, piece, hpAfter: null };
  if (by === myId()) piecesLets.lastPlaced = undo;
  frameState(f);
  if (isHost()) send('all', { t: 'place', frame: f.i, ...info });
  tween(0.32, (s) => {
    g.position.lerpVectors(from.clone().add(off), to, 1 - (1 - s) ** 3);
    g.position.z += Math.sin(s * Math.PI) * 0.6;
  }, () => {
    g.position.copy(to);
    if (!f.pieces.includes(piece)) return;
    undo.hpAfter = 0;
    burst(new THREE.Vector3(piece.cx, piece.cy + 0.15, piece.cz), '#e8c890', 8, 2);
    if (f.carp.done()) finishFrame(f);
    else if (piece.over && by === myId() && f.kind !== 'stair') toast('It sticks out over the frame: the spare gets sawn off', false, true);
  });
  refill(hand.from);
}
/* A gap in a frame is yours to sort out: nothing fills it for you (the user: "if there's a gap,
   that's it, that's broken. That's the point of it being a puzzle"). Lift pieces back out to undo
   it: any piece in a frame that isn't finished yet (liftable, lift). */
// The frame's full: saw off what sticks out. A walk is then hauled up onto the wall; stairs are
// done where they stand. `quiet` is for a joiner catching up: no sawdust, no pay, no waiting.
export function finishFrame(f, quiet = false) {
  if (f.done) return;
  f.done = true;
  f.label.remove();
  f.room?.removeFromParent();   // (its chalked room goes with it)
  f.room = null;
  if (lastPlaced?.frame === f) piecesLets.lastPlaced = null;
  let waste = 0;
  const j = ramp.jobs[f.i];
  if (f.kind === 'stair') {
    // Stairs stay exactly as built, bits sticking out and all: you walk on the tops of the pieces.
    j.tops = new Map();
    for (const [r, c] of f.carp.laid.flatMap((p) => p.cells)) if (!(j.tops.get(c) <= r)) j.tops.set(c, r);
    j.up = true;
    if (!quiet) {
      if (f.pieces.some((p) => p.over)) toast('The stairs are up, just as you built them');
      else { G.gold += PAY.master; updateStats(); toast(`Shipshape stairs! Not a square out of place (+${PAY.master})`); swordReward(new THREE.Vector3(pirate.x, 1.5, pirate.z), 'shipshape stairs'); }
    }
    jobDone(j, quiet);
    return;
  }
  const sawn = f.carp.saw();
  f.pieces.forEach((p, n) => {
    const old = p.group.children[p.group.children.length - 1], kept = sawn[n].kept.map((i) => p.shape[i]);
    for (const i of sawn[n].cut) {
      waste++;
      const m = p.group.children[i], at = new THREE.Vector3();
      m.getWorldPosition(at);
      if (!quiet) burst(at, '#f0d9a8', 10, 2.5);
      m.visible = false;
    }
    old.visible = false;
    p.group.add(outline(kept, 0.002, '#4a2a12'));
  });
  if (!quiet) {
    if (waste) toast(`Sawn to fit: ${waste} square${waste > 1 ? 's' : ''} of offcuts`);
    else { G.gold += PAY.master; updateStats(); toast(`Shipshape! Not a scrap wasted (+${PAY.master})`); swordReward(new THREE.Vector3(pirate.x, 1.5, pirate.z), 'shipshape frame'); }
  }
  if (j.kind === 'house') { raiseHouse(f, j, quiet); return; }
  if (j.kind === 'deck') { sliceDeck(f, j, quiet); return; }
  const g = f.group, p0 = g.position.clone(), p1 = new THREE.Vector3(p0.x, ramp.T - 0.05, j.kind === 'gun' ? gunZ0() + partR0(j.part) * S : -0.85);
  const land = () => {
    g.position.copy(p1);
    g.updateMatrixWorld(true);
    Object.assign(j, { up: true, x0: p1.x, z0: p1.z, set: f.set });
    if (j.kind === 'gun' && ramp.jobs.every((o) => o.kind !== 'gun' || o.up)) makeGunDeck();
    jobDone(j, quiet);
  };
  if (quiet) { land(); return; }
  // Hauled up on four ropes from a block over the wall: up first, then in over the top.
  const top = new THREE.Vector3(p0.x + f.b.w * S / 2, ramp.T + 2.4, -0.3);
  const block = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12), railMat);
  block.rotation.x = Math.PI / 2;
  block.position.copy(top);
  const pos = new Float32Array(24), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const ropes = new THREE.LineSegments(geo, ropeMat);
  ropes.frustumCulled = false;
  den.add(block, ropes);
  const corners = [[0, 0], [f.b.w, 0], [0, f.b.h], [f.b.w, f.b.h]];
  const rig = () => {
    g.updateMatrixWorld(true);
    corners.forEach(([c, r], n) => { const w = frameAt(f, c, r, 0.1); pos.set([top.x, top.y, top.z, w.x, w.y, w.z], n * 6); });
    geo.attributes.position.needsUpdate = true;
  };
  rig();
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  tween(0.9, rig, () => tween(2.2, (u) => {
    // (A part of the gun tower is lifted clear over the parts already up.)
    const zu = ease(Math.max(0, (u - 0.4) / 0.6));
    g.position.y = p0.y + (p1.y - p0.y) * ease(Math.min(1, u * 1.5)) + (j.kind === 'gun' ? Math.sin(zu * Math.PI) * 0.8 : 0);
    g.position.z = p0.z + (p1.z - p0.z) * zu;
    rig();
  }, () => {
    land();
    burst(new THREE.Vector3(top.x, ramp.T, 0), '#e8c890', 16, 3);
    tween(0.6, () => {}, () => den.remove(block, ropes));
  }));
}
/* The walk's frame is full: saw it along the cuts into its strips, and up they go onto the wall one
   after another, end to end. Pieces that lie across a cut are sawn through with it. */
function sliceDeck(f, j, quiet) {
  const st = deckStrips(), g = f.group;
  const stripOf = (kk) => Math.min(st.length - 1, Math.max(0, Math.floor((+kk.split(',')[0] - 1) / DECK_D)));
  // The frame itself is cleared away (its backing, rails and outline): only the timber goes up.
  for (const ch of [...g.children]) if (!f.pieces.some((p) => p.group === ch)) g.remove(ch);
  // A strip's group, set so that inside it the squares sit as they will on the wall.
  const strips = st.map((o) => {
    const sg = new THREE.Group();
    if (o.turned) { sg.position.set((o.a + o.w) * S, -(o.R + DECK_D) * S, 0); sg.rotation.z = Math.PI; }
    else sg.position.set(-o.a * S, -o.R * S, 0);
    g.add(sg);
    return sg;
  });
  g.updateMatrixWorld(true);
  for (const p of f.pieces) {
    const meshes = p.shape.map((_, i) => p.group.children[i]), parts = new Map();
    p.shape.forEach((cell, i) => {
      if (!f.set.has(p.cells[i])) return;   // sawn off already
      const s = stripOf(p.cells[i]);
      if (!parts.has(s)) parts.set(s, []);
      parts.get(s).push(i);
    });
    for (const [s, idx] of parts) {
      const ol = outline(idx.map((i) => p.shape[i]), 0.002, '#4a2a12');
      p.group.add(ol);
      p.group.updateMatrixWorld(true);
      strips[s].attach(ol);
      for (const i of idx) strips[s].attach(meshes[i]);
    }
    p.group.visible = false;
  }
  const walkPos = V3(X(0), ramp.T - 0.05, -0.85), walkQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const land = () => {
    // The frame's group becomes the walk, with the strips laid end to end in it.
    g.position.copy(walkPos);
    g.quaternion.copy(walkQ);
    for (const sg of strips) { g.add(sg); sg.position.set(0, 0, 0); sg.quaternion.identity(); }
    g.updateMatrixWorld(true);
    Object.assign(j, { up: true, x0: walkPos.x, z0: walkPos.z, set: new Set(f.walk.map(([r, c]) => k(r, c))) });
    jobDone(j, quiet);
  };
  if (quiet) { land(); return; }
  // Sawdust along each cut, then the lengths are lifted up and over, one after another.
  for (const o of st.slice(1)) for (let c = 0; c <= o.w; c += 2) burst(frameAt(f, c, o.R, 0.3), '#f0d9a8', 6, 2);
  setTimeout(() => toast(`Sawn into ${st.length} lengths. Up they go onto the wall!`), 900);
  let left = strips.length;
  strips.forEach((sg, n) => setTimeout(() => {
    den.attach(sg);
    const p0 = sg.position.clone(), q0 = sg.quaternion.clone();
    tween(1.7, (u) => {
      const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      sg.position.lerpVectors(p0, walkPos, e);
      sg.position.y += Math.sin(u * Math.PI) * 2.2;
      sg.quaternion.slerpQuaternions(q0, walkQ, e);
    }, () => {
      sg.position.copy(walkPos);
      sg.quaternion.copy(walkQ);
      burst(V3(X(st[n].a + st[n].w / 2), ramp.T, -0.3), '#e8c890', 12, 3);
      if (--left === 0) land();
    });
  }, 1200 + n * 750));
}
// A frame's done. The rest of the same timber comes straight away (the stairs after the walk);
// the next lot comes when the next wave's beaten off.
function jobDone(j, quiet) {
  if (quiet) return;
  if (j.kind === 'house') {
    const nx = ramp.jobs[j.i + 1];
    setTimeout(() => toast(nx?.kind === 'house' ? `The ${HOUSE_PART[j.part]}'s up! Now the ${HOUSE_PART[nx.part]}` : 'Your house is built!'), 1500);
    if (!guest() && nx?.kind === 'house') openJob(nx.i);
    return;
  }
  const stretch = ramp.jobs.filter((o) => o.si === j.si);
  const msg = j.kind === 'gun' ? (j.part === GD.parts.length - 1 ? 'The gun tower\'s up! Walk out onto it from the wall' : 'That part of the gun tower\'s up. Now the next')
    : ramp.jobs.every((o) => o.up || o.kind === 'gun' || o.kind === 'house') ? 'The whole rampart is up!'
    : stretch.every((o) => o.up) ? 'The stairs are up: climb them and throw from the wall!'
    : 'The walk\'s up on the wall. Now build the stairs to it';
  setTimeout(() => toast(msg), 1500);
  if (!guest() && ramp.jobs[ramp.next]?.si === j.si) openJob(ramp.next);
}
// How high the floor is here: the wall-walk, the stairs, or the ground. `pad` widens the stairs'
// footprint a little, so you bump into their side instead of walking into them. Stairs still
// being built are in the way.
const hv = new THREE.Vector3();
// `from` is the height you're at: down on the floor, a deck overhead is no floor of yours.
export function heightAt(x, z, pad = 0, from = 99) {
  if (!ramp) return 0;
  for (const j of ramp.jobs) {
    if (j.kind === 'house') continue;
    if (j.kind !== 'stair') {
      if (j.up && j.set.has(k(Math.floor((z - j.z0) / S), Math.floor((x - j.x0) / S)))) {
        // Down on the floor you walk under the tower, and under the wall-walk through the gate.
        const gateway = j.kind === 'deck' && wall.door && Math.abs(x - wall.door.cx) < wall.door.w / 2;
        if ((j.kind === 'gun' || gateway) && from < ramp.T - HOP) continue;
        return ramp.T;
      }
      continue;
    }
    const [x0, x1] = ramp.stairs[j.end];
    if (x < x0 - pad || x > x1 + pad) continue;
    if (j.up && j.tops) {
      const r = j.tops.get(Math.floor(j.frame.group.worldToLocal(hv.set(x, 0, z)).x / S));
      if (r !== undefined) return Math.max(0, ramp.T * (1 - r / ramp.n));
      continue;
    }
    if (z < ramp.zTop - 0.05 || z > ramp.zBot + pad) continue;
    if (j.frame) return 99;
  }
  return beachFloor(x, z);   // (out on the beach: the jetty's boards, src/den-beach.ts)
}
export const onRampart = () => ramp && pirate.h > ramp.T - 0.15;

// ---------- your house ----------
/* A little house at the back of the den, against the cave wall on the left: a front wall with a
   door and a window, two side walls and a lean-to roof. Built as everything here is built: each
   part's frame laid on the floor, filled with pieces, sawn to fit, then hoisted on ropes and set in
   place. You only get one when you ask for it (Your pirate, Den), as it's yours to dress. */
const HOUSE = { cols: 7, front: 5, back: 7, depth: 4 };
export const HOUSE_PART = ['front wall', 'side wall', 'other side wall', 'roof'];
export const HOUSE_Z1 = DEN_BACK - 0.2, HOUSE_Z0 = HOUSE_Z1 - HOUSE.cols * S;
export const houseXF = () => -ramp.half + 1.7;   // the face of the front wall
function houseShape(part) {
  const cells = [];
  if (part === 0) {
    for (let r = 0; r < HOUSE.front; r++) for (let c = 0; c < HOUSE.cols; c++) {
      if ((c === 2 || c === 3) && r >= 1) continue;   // the door
      if (c === 5 && (r === 1 || r === 2)) continue;  // the window
      cells.push([r, c]);
    }
  } else if (part === 3) {
    for (let r = 0; r < 6; r++) for (let c = 0; c < HOUSE.cols; c++) if (!(r === 0 && (c === 0 || c === HOUSE.cols - 1))) cells.push([r, c]);
  } else {
    // Stepped down from the back (tall, against the rock) to the front, under the roof's slope.
    const hs = part === 1 ? [7, 7, 6, 5] : [5, 6, 7, 7];
    hs.forEach((h, c) => { for (let r = HOUSE.back - h; r < HOUSE.back; r++) cells.push([r, c]); });
  }
  return cells;
}
// Where a part goes (its top-left corner, and which way it faces). Part -1: laid flat on the floor.
function housePose(part) {
  const xf = houseXF(), xb = xf - WOOD_D - HOUSE.depth * S;
  if (part === -1) return { p: V3(xf + 0.3, 0, HOUSE_Z1 - 0.05), q: basis(V3(0, 0, -1), V3(-1, 0, 0)) };
  if (part === 0) return { p: V3(xf, HOUSE.front * S, HOUSE_Z1), q: basis(V3(0, 0, -1), V3(0, 1, 0)) };
  if (part === 1) return { p: V3(xb, HOUSE.back * S, HOUSE_Z1), q: basis(V3(1, 0, 0), V3(0, 1, 0)) };
  if (part === 2) return { p: V3(xf - WOOD_D, HOUSE.back * S, HOUSE_Z0), q: basis(V3(-1, 0, 0), V3(0, 1, 0)) };
  const up = V3(xb - xf, (HOUSE.back - HOUSE.front) * S, 0).normalize(), q = basis(V3(0, 0, -1), up);
  return { p: V3(xb, HOUSE.back * S, HOUSE_Z1).add(V3(0, 0, 1).applyQuaternion(q).multiplyScalar(0.42)), q };
}
function raiseHouse(f, j, quiet) {
  const g = f.group, to = housePose(j.part);
  const land = () => {
    g.position.copy(to.p);
    g.quaternion.copy(to.q);
    g.updateMatrixWorld(true);
    j.up = true;
    houseWalls(j.part);
    paintHouse();
    if (ramp.jobs.every((o) => o.kind !== 'house' || o.up)) houseDone();
    plotShow();
    jobDone(j, quiet);
  };
  if (quiet) { land(); return; }
  const p0 = g.position.clone(), q0 = g.quaternion.clone();
  const mid = to.p.clone().add(V3(0, -HOUSE.front * S / 2, 0).applyQuaternion(to.q)), top = mid.clone().setY(HOUSE.back * S + 2.6);
  const block = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12), railMat);
  block.rotation.x = Math.PI / 2;
  block.position.copy(top);
  const pos = new Float32Array(24), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const ropes = new THREE.LineSegments(geo, ropeMat);
  ropes.frustumCulled = false;
  den.add(block, ropes);
  const corners = [[0, 0], [f.b.w, 0], [0, f.b.h], [f.b.w, f.b.h]];
  const rig = () => {
    g.updateMatrixWorld(true);
    corners.forEach(([c, r], n) => { const w = frameAt(f, c, r, 0.1); pos.set([top.x, top.y, top.z, w.x, w.y, w.z], n * 6); });
    geo.attributes.position.needsUpdate = true;
  };
  rig();
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  tween(0.9, rig, () => tween(2.6, (u) => {
    const e = ease(u);
    g.position.lerpVectors(p0, to.p, e);
    g.position.y += Math.sin(e * Math.PI) * 1.4;
    g.quaternion.slerpQuaternions(q0, to.q, ease(Math.min(1, u * 1.25)));
    rig();
  }, () => {
    land();
    burst(mid, '#e8c890', 16, 3);
    tween(0.6, () => {}, () => den.remove(block, ropes));
  }));
}
// You can't walk through a wall that's up (only in at the door).
function houseWalls(part) {
  const xf = houseXF(), xb = xf - WOOD_D - HOUSE.depth * S, add = (x, z) => obstacles.push({ x, z, r: 0.3, house: true });
  if (part === 0) for (let c = 0; c < HOUSE.cols; c++) { if (c !== 2 && c !== 3) add(xf - 0.25, HOUSE_Z1 - (c + 0.5) * S); }
  if (part === 1) for (let c = 0; c < HOUSE.depth; c++) add(xb + (c + 0.5) * S, HOUSE_Z1 - 0.25);
  if (part === 2) for (let c = 0; c < HOUSE.depth; c++) add(xb + (c + 0.5) * S, HOUSE_Z0 + 0.25);
}
// Painted, if you like: each piece keeps a hint of its own timber, so you still see how it's built.
const houseMats = {};
const houseMat = (l, c) => (c === 'none' ? woodMat(l) : (houseMats[l + c] ||= mat(new THREE.Color(WOOD[l] || '#b08a5a').lerp(new THREE.Color(dyeHex(c)), 0.5), { map: woodTex, roughness: 0.75 })));
/* It's your little shack, and it's made of carpentry pieces: you must see them (the user). Each piece
   gets a bold dark edge on both faces, quieter than the frames' white, and the paint lets each
   piece's own timber show through. */
export function paintHouse() {
  if (!ramp) return;
  for (const j of ramp.jobs) {
    if (j.kind !== 'house' || !j.up) continue;
    for (const pc of j.frame.pieces) {
      pc.group.traverse((m) => { if (m.isMesh && !m.userData.edge) m.material = houseMat(pc.info.letter, j.part === 3 ? denLook.roof : denLook.paint); });
      if (!pc.edged) {
        pc.edged = true;
        for (const z of [0.012, -WOOD_D - 0.012]) { const e = fatOutline(pc.info.shape, z, '#24130a', 0.045); e.traverse((m) => { m.userData.edge = true; }); pc.group.add(e); }
      }
    }
  }
}
// All up: your flag on the roof.
function houseDone() {
  const fp = flagpole(1.6), xb = houseXF() - WOOD_D - HOUSE.depth * S;
  fp.position.set(xb + 0.35, HOUSE.back * S + 0.45, HOUSE_Z1 - 0.4);
  fp.userData.scenery = true;
  den.add(fp);
}
export function startHouse() {
  if (!ramp) return;
  if (guest()) { send('host', { t: 'build' }); return; }
  const first = ramp.jobs.find((j) => j.kind === 'house');
  if (first.frame) return;
  openJob(first.i);
  say('Timber for your shack! Its frame\'s on the floor here: fill it with pieces from the crates, and it\'s hoisted into place');
  plotShow();
}
/* The shack's plot, marked out on the floor from the start (the user: it was hidden in a menu; walk
   into the corner and it should be clear you can build there): pegs and a line round where it
   goes, and a sign. Walk in and Space starts it; once it's up, Space there dresses it. */
let plot = null;
export const houseState = () => { const hs = ramp?.jobs.filter((j) => j.kind === 'house') || []; return !hs.length ? 'none' : hs.every((j) => j.up) ? 'built' : hs.some((j) => j.frame) ? 'building' : 'plot'; };
export function makePlot() {
  plot = new THREE.Group();
  plot.userData.scenery = true;
  const xf = houseXF(), xb = xf - WOOD_D - HOUSE.depth * S, line = mat('#e6d3a6', { roughness: 1 }), peg = mat('#6b4426', { map: woodTex });
  const bar = (x0, z0, x1, z1) => { const b = mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) + 0.1, 0.04, Math.abs(z1 - z0) + 0.1), line, false); b.position.set((x0 + x1) / 2, 0.025, (z0 + z1) / 2); plot.add(b); };
  // Chalked over, so the plot stands out on the floor.
  const fill = mesh(new THREE.PlaneGeometry(xf - xb, HOUSE_Z1 - HOUSE_Z0), new THREE.MeshBasicMaterial({ color: '#f2e2b8', transparent: true, opacity: 0.16, depthWrite: false }), false);
  fill.rotation.x = -Math.PI / 2;
  fill.position.set((xf + xb) / 2, 0.015, (HOUSE_Z0 + HOUSE_Z1) / 2);
  plot.add(fill);
  bar(xb, HOUSE_Z0, xf, HOUSE_Z0); bar(xb, HOUSE_Z1, xf, HOUSE_Z1); bar(xb, HOUSE_Z0, xb, HOUSE_Z1);
  bar(xf, HOUSE_Z0, xf, HOUSE_Z0 + 1.0); bar(xf, HOUSE_Z1 - 2.2, xf, HOUSE_Z1);   // (a gap where the door goes)
  for (const [x, z] of [[xb, HOUSE_Z0], [xb, HOUSE_Z1], [xf, HOUSE_Z0], [xf, HOUSE_Z1]]) { const p = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6), peg); p.position.set(x, 0.2, z); plot.add(p); }
  // A sign on a post: "Your shack".
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96;
  const g = cv.getContext('2d');
  g.fillStyle = '#7a5230'; g.fillRect(0, 0, 256, 96); g.strokeStyle = '#3a2412'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 88);
  g.fillStyle = '#f3e3c0'; g.font = 'bold 40px Alegreya, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Your shack', 128, 50);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  // The post stops under the board: running up through it, it hid the S ("Your hack", the user).
  const post = mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.2, 8), peg);
  post.position.set(xf + 0.7, 0.6, HOUSE_Z1 + 0.45);   // (clear of where its frames lie)
  const board = mesh(new THREE.BoxGeometry(1.3, 0.49, 0.06), [peg, peg, peg, peg, mat('#ffffff', { map: tex, emissive: '#3a2a18', emissiveMap: tex }), mat('#ffffff', { map: tex })]);
  board.position.set(xf + 0.7, 1.45, HOUSE_Z1 + 0.45);
  board.rotation.y = Math.PI / 4;   // turned to the den, where you look at it from
  plot.add(post, board);
  plot.userData.sign = board;
  plot.userData.label = document.createElement('div');
  den.add(plot);
  plotShow();
}
// The lines go once the timber's come (its frame lies on the floor there); the sign stays.
export function plotShow() {
  if (!plot) return;
  const st = houseState();
  plot.children.forEach((o) => { o.visible = o === plot.userData.sign || o.geometry?.type === 'CylinderGeometry' && o.position.y > 0.5 ? st !== 'built' : st === 'plot'; });
}
/* What the plot's for, over it like a hole's label (the user clicked it by accident and couldn't
   work out what had happened: there was no call to action). Shown when you're near. */
export function plotLabel() {
  const lab = plot?.userData.label;
  if (!lab) return;
  if (!lab.isConnected) $('labels').append(lab);
  const st = houseState(), xf = ramp ? houseXF() : 0, x = xf - HOUSE.depth * S / 2, z = (HOUSE_Z0 + HOUSE_Z1) / 2;
  const html = st === 'plot' ? 'Your shack: build it here<small>walk in and press Space (or click) and timber comes for it</small>'
    : st === 'built' ? 'Your shack<small>walk in and press Space (or click) to paint and dress it</small>' : '';
  const near = Math.hypot(pirate.x - x, pirate.z - z) < 7;
  if (!html || !near || wm || deco.on || deckView > 0.5 || swordView > 0.5 || pirate.h > 0.3) { lab.style.display = 'none'; return; }
  if (lab.innerHTML !== html) { lab.className = 'label deck'; lab.innerHTML = html; }
  v3.set(xf + 0.7, 2.05, HOUSE_Z1 + 0.45).project(camera);   // over the sign, kept on screen
  const half = lab.offsetWidth / 2 + 10;
  lab.style.left = `${Math.max(half, Math.min(innerWidth - half, (v3.x + 1) / 2 * innerWidth))}px`;
  lab.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  lab.style.display = v3.z > 1 ? 'none' : '';
}
export const atPlot = () => {
  if (!ramp || pirate.h > 0.3) return false;
  const xf = houseXF();
  return pirate.x < xf + 1.6 && pirate.z > HOUSE_Z0 - 0.8 && pirate.z < HOUSE_Z1 + 0.8;
};
// (Poles thrown away with an old den are forgotten.)
// ---------- the landscape ----------
/* Where the den is, your choice (Your pirate, Den): the barren cave it started as, a seaside
   hideout (sand, sandstone, palms, the sea out beyond where the raiders come from) or a jungle one
   (moss, mossy rock, big trees and ferns). Only the look changes, never the play: the props stand
   outside the wall's ends and behind the cave rocks. Every one is in a cove, with the sea beyond. */
const BIOME = {
  barren: { sky: '#120d0c', horizon: '#3b5263', ground: '#7a5c3d', dots: ['40,26,14', '170,135,95'], rocks: ['#5d5048', '#6b5c50', '#4f443d', '#73655a'], hemi: ['#ffe6c4', '#3a2616'] },
  seaside: { sky: '#1b3348', horizon: '#6f9cb8', ground: '#c4a172', dots: ['120,90,50', '245,232,200'], rocks: ['#9c8566', '#b09878', '#85704f', '#bfa886'], hemi: ['#fff0dc', '#5e5038'] },
  jungle: { sky: '#0b1712', horizon: '#33595a', ground: '#5b5a30', dots: ['30,45,15', '120,150,60'], rocks: ['#4c5944', '#5a6a4b', '#3e4a37', '#677858'], hemi: ['#eaffd6', '#24321a'] },
};
const biomeGroup = new THREE.Group();
scene.add(biomeGroup);
let biomeId = null, sea = null;
const seaTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#2f7896'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(200,235,245,${0.1 + Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 8 + Math.random() * 22, 2); }
});
seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping;
seaTex.repeat.set(16, 8 * 140 / 90);   // (the sea runs 140 m out: as far as the sloop's sea goes, past the checkpoint)
const trunkMat = mat('#7d5b38', { map: woodTex });
const leafMats = ['#3f8a3a', '#2f7432', '#4f9a3c'].map((c) => mat(c, { side: THREE.DoubleSide, flatShading: true }));
const canopyMats = ['#2f6b2a', '#3b7d2f', '#275a26'].map((c) => mat(c, { flatShading: true }));
// A palm frond (or, low down, a fern's): a long leaf that droops from its base.
function frond(len, wid, droop, m) {
  const geo = new THREE.PlaneGeometry(wid, len, 1, 6).translate(0, len / 2, 0), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / len;
    pos.setZ(i, -t * t * droop);
    pos.setX(i, pos.getX(i) * (1 - t * 0.85));
  }
  geo.computeVertexNormals();
  return mesh(geo, m, false);
}
function plume(n, len, wid, droop, tilt) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const f = frond(len * (0.85 + Math.random() * 0.3), wid, droop, leafMats[rand(3)]);
    const arm = new THREE.Group();
    f.rotation.x = -tilt;
    arm.add(f);
    arm.rotation.y = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    g.add(arm);
  }
  return g;
}
function palm(x, z, sc) {
  const g = new THREE.Group();
  const top = new THREE.Vector3((Math.random() - 0.5) * 1.6, 4.4, (Math.random() - 0.5) * 1.6);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(0, 2.6, 0), top);
  g.add(mesh(new THREE.TubeGeometry(curve, 10, 0.15, 7), trunkMat));
  const crown = plume(8, 2.2, 0.55, 0.9, 1.05);
  crown.position.copy(top);
  g.add(crown);
  const nutM = mat('#5a3d1e');
  for (let i = 0; i < 3; i++) {
    const nut = mesh(new THREE.SphereGeometry(0.13, 8, 6), nutM, false);
    nut.position.copy(top).add(new THREE.Vector3(Math.cos(i * 2.1) * 0.18, -0.15, Math.sin(i * 2.1) * 0.18));
    g.add(nut);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(sc);
  return g;
}
function jungleTree(x, z, sc) {
  const g = new THREE.Group(), h = 4.2 + Math.random() * 1.5;
  const trunk = mesh(new THREE.CylinderGeometry(0.2, 0.34, h, 8), trunkMat);
  trunk.position.y = h / 2;
  g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const b = mesh(new THREE.IcosahedronGeometry(1.1 + Math.random() * 0.6, 0), canopyMats[rand(3)], false);
    b.position.set((Math.random() - 0.5) * 1.6, h + (Math.random() - 0.3) * 0.9, (Math.random() - 0.5) * 1.6);
    b.scale.y = 0.75;
    g.add(b);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(sc);
  return g;
}
function fern(x, z, sc) {
  const g = plume(7, 0.9, 0.3, 0.35, 1.0);
  g.position.set(x, 0.05, z);
  g.scale.setScalar(sc);
  return g;
}
// Spots for trees: beyond the wall's two ends down to the shore, and behind the cave rocks down
// both sides of the den.
function treeSpots(half) {
  const spots = [];
  for (const sx of [-1, 1]) {
    for (let z = -14; z < -1; z += 2.6 + Math.random()) spots.push([sx * (half + 4.8 + Math.random() * 3), z]);
    for (let z = 0; z < 14; z += 2.8 + Math.random()) spots.push([sx * (half + 5 + Math.random() * 2.5), z]);
  }
  return spots;
}
function drawGround(B) {
  const cv = groundTex.image, g = cv.getContext('2d'), w = cv.width, h = cv.height;
  g.fillStyle = B.ground; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${B.dots[Math.random() < 0.5 ? 0 : 1]}, ${Math.random() * 0.25})`;
    const sz = 2 + Math.random() * 6;
    g.fillRect(Math.random() * w, Math.random() * h, sz, sz);
  }
  groundTex.needsUpdate = true;
}
export function applyBiome(force = false) {
  const id = BIOME[denLook.biome] ? denLook.biome : 'barren', B = BIOME[id];
  if (!force && id === biomeId) return;
  if (id !== biomeId) {
    paintSky(B.sky, B.horizon);
    hemi.color.set(B.hemi[0]); hemi.groundColor.set(B.hemi[1]);
    rockMats.forEach((m, i) => m.color.set(B.rocks[i]));
    drawGround(B);
  }
  biomeId = id;
  biomeGroup.clear();
  sea = null;
  if (!wall) return;
  const half = wall.W * S / 2;
  // Every den's in a cove: the sea beyond the beach where the raiders land, with a line of surf.
  // The sea is see-through, clearest at its edge, over a sandy bed that falls away into the deep:
  // as the tide goes out you see the water draw back off the sand (and off the bilge board).
  sea = mesh(new THREE.PlaneGeometry(220, 140), mat('#ffffff', { map: seaTex, roughness: 0.45, metalness: 0, emissive: '#1f6c9e', transparent: true, alphaMap: seaFade, depthWrite: false }), false);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0.05, SHORE - 70);
  sea.renderOrder = 1;
  const surf = mesh(new THREE.PlaneGeometry(220, 0.5), new THREE.MeshBasicMaterial({ color: '#e8f4f2', transparent: true, opacity: 0.55, depthWrite: false }), false);
  surf.rotation.x = -Math.PI / 2;
  surf.position.set(0, 0.055, SHORE - 0.15);
  surf.renderOrder = 2;
  const bed = mesh(new THREE.PlaneGeometry(220, 150), new THREE.MeshStandardMaterial({ map: seabedTex, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 }), false);
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(0, 0.003, HIGH - 75);
  biomeGroup.add(sea, surf, bed);
  shoreParts = [[sea, -70], [surf, -0.15]];
  // A strip of sand up from the water, fading into the den's own ground (the seaside's is all sand).
  if (id !== 'seaside') {
    const sand = mesh(new THREE.PlaneGeometry(70, 6), new THREE.MeshStandardMaterial({ color: '#c4a172', roughness: 1, transparent: true, depthWrite: false, alphaMap: sandFade }), false);
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(0, 0.008, HIGH + 3);
    biomeGroup.add(sand);
  }
  if (id === 'seaside') {
    for (const [x, z] of treeSpots(half)) biomeGroup.add(palm(x, z, 0.85 + Math.random() * 0.35));
  } else if (id === 'jungle') {
    for (const [x, z] of treeSpots(half)) biomeGroup.add(jungleTree(x, z, 0.85 + Math.random() * 0.4));
    // Ferns along the foot of the cave rocks inside the den, clear of the house.
    for (const sx of [-1, 1]) for (let z = 1; z < DEN_BACK + 2; z += 1.3 + Math.random()) {
      if (sx < 0 && z > HOUSE_Z0 - 1 && z < HOUSE_Z1 + 1) continue;
      biomeGroup.add(fern(sx * (half + 0.5 + Math.random() * 0.8), z, 0.8 + Math.random() * 0.5));
    }
    for (const sx of [-1, 1]) for (let z = -12; z < -1; z += 1.6 + Math.random()) biomeGroup.add(fern(sx * (half + 1 + Math.random() * 2), z, 1 + Math.random() * 0.5));
  }
}
export function biomeTick(dt) {
  if (sea) { seaTex.offset.x += dt * 0.004; seaTex.offset.y = Math.sin(performance.now() / 2400) * 0.01; }
  const sz = shoreZ();
  for (const [m, off] of shoreParts) m.position.z = sz + off;
  shipTick(dt);
}
// The sea's see-through edge: half clear where it meets the sand, deep blue further out.
const seaFade = canvasTex(4, 128, (g, w, h) => {
  const gr = g.createLinearGradient(0, h, 0, 0);
  gr.addColorStop(0, '#a0a0a0'); gr.addColorStop(0.12 * 90 / 140, '#c4c4c4'); gr.addColorStop(0.3 * 90 / 140, '#ececec'); gr.addColorStop(1, '#ffffff');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
// The seabed: sand at the top of the beach, wet sand where the tide goes, then down into the deep.
const seabedTex = canvasTex(4, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, h, 0, 0);
  const k = 100 / 150;   // (the stops were laid out for a seabed 100 m deep)
  gr.addColorStop(0, '#c4a172'); gr.addColorStop(0.06 * k, '#a98a5e'); gr.addColorStop(0.12 * k, '#8a7a58'); gr.addColorStop(0.2 * k, '#4f6e66'); gr.addColorStop(0.4 * k, '#2a4c58'); gr.addColorStop(1, '#183444');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
// The beach strip's fade: solid at the water's edge, gone by the top.
const sandFade = canvasTex(4, 64, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#000'); gr.addColorStop(0.55, '#888'); gr.addColorStop(1, '#fff');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
export function waveFlags(dt) {
  worldLets.flags = flags.filter((f) => { let o = f.g; while (o.parent) o = o.parent; return o === scene || o === dress.scene; });
  for (const f of flags) {
    f.t += dt;
    const pa = f.geo.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = f.base[i * 3]; pa.setZ(i, Math.sin(x * 5 - f.t * 4.5) * 0.09 * x); pa.setY(i, f.base[i * 3 + 1] - x * x * 0.04); }
    pa.needsUpdate = true;
  }
}

/* The gate (9 Nov): two leaves hung at the sides, barred inside with a drawbar. Walk up to it and
   the bar slides back into the wall and the leaves swing in; walk through and out onto the beach.
   It shuts again once nobody's by it. Only for pirates: the raiders never try it (it's only open
   while you're stood in it). */
export function makeGate() {
  const { c0, c1 } = wall.gateCols;
  const w = (c1 - c0 + 1) * S, h = (wall.H - gateTop(wall.H)) * S;
  const g = new THREE.Group();
  const plankMat = mat('#5b3a20', { map: woodTex });
  // A beam over the gateway, the stone of the wall above it.
  const lintel = mesh(new THREE.BoxGeometry(w + 0.5, 0.26, STONE_D + 0.1), mat('#4a2e18', { map: woodTex }));
  lintel.position.set(0, h + 0.1, -STONE_D / 2);
  g.add(lintel);
  const iron = mat('#2a2a2a', { metalness: 0.6, roughness: 0.5 });
  const leaves = [-1, 1].map((side) => {
    const leaf = new THREE.Group();
    leaf.position.set(side * w / 2, 0, -0.25);   // on its hinges
    for (let i = 0; i < 3; i++) {
      const p = mesh(new THREE.BoxGeometry(w / 6 - 0.02, h, 0.22), plankMat);
      p.position.set(-side * (i + 0.5) * w / 6, h / 2, 0);
      leaf.add(p);
    }
    [0.2, 0.5, 0.82].forEach((t) => { const b = mesh(new THREE.BoxGeometry(w / 2 - 0.02, 0.1, 0.05), iron); b.position.set(-side * w / 4, h * t, 0.13); leaf.add(b); });
    const ring = mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 16), iron);
    ring.position.set(-side * (w / 2 - 0.18), h * 0.36, 0.17);
    leaf.add(ring);
    g.add(leaf);
    return leaf;
  });
  const bar = mesh(new THREE.BoxGeometry(w + 0.5, 0.16, 0.14), mat('#3e2614', { map: woodTex }));
  bar.position.set(0, h * 0.5, -0.02);
  g.add(bar);
  g.position.set(X(c0) + w / 2, 0, 0);
  wall.door = { g, leaves, bar, w, cx: X(c0) + w / 2, open: 0 };
  return g;
}
export const outside = () => pirate.h < 0.3 && pirate.z < -0.2;   // out on the beach
const GATE_IN = 0.55, GATE_OUT = -STONE_D - 0.3;   // the wall's thickness, and a pirate's width either side
// Through the wall only by the gateway, and only once the gate's open.
export function throughGate(ox, oz, nx, nz) {
  if (nz >= GATE_IN || nz <= GATE_OUT) return [nx, nz];
  const d = wall.door, g0 = d ? d.cx - d.w / 2 + 0.3 : 0, g1 = d ? d.cx + d.w / 2 - 0.3 : 0;
  if (oz < GATE_IN && oz > GATE_OUT) return [Math.max(g0, Math.min(g1, nx)), nz];   // in the gateway
  if (d && nx > g0 && nx < g1 && d.open > 0.8) return [nx, nz];
  return [nx, oz >= GATE_IN ? GATE_IN : GATE_OUT];
}
// Open while any pirate's by it, inside or out; the bar first, then the leaves.
export function gateTick(dt) {
  const d = wall.door;
  if (!d) return;
  const by = (p) => p.h < 0.3 && Math.abs(p.x - d.cx) < d.w / 2 + 1.2 && Math.abs(p.z) < 3;
  const want = by(pirate) || [...net.crew.values()].some(by);
  d.open = Math.max(0, Math.min(1, d.open + (want ? 2.6 : -1.4) * dt));
  const b = Math.min(1, d.open / 0.3), l = Math.max(0, (d.open - 0.3) / 0.7);
  d.bar.position.x = b * (d.w + 0.45);
  d.bar.position.z = -0.02 - b * 0.07;
  const a = 1.7 * l * l * (3 - 2 * l);
  d.leaves[0].rotation.y = -a;
  d.leaves[1].rotation.y = a;
}
// The gun tower's legs, and the braces across its front: in your way out on the beach.
export function towerLegs() {
  if (!gd) return [];
  if (gd.legs) return gd.legs;
  const w = GD.cols * S, dz = GD.rows * S, out = [];
  for (const [x, z] of [[0.2, 0.2], [w / 2, 0.2], [w - 0.2, 0.2], [0.2, dz / 2], [w - 0.2, dz / 2]]) out.push({ x: gd.x0 + x, z: gd.z0 + z, r: 0.18, low: true });
  for (let x = 0.5; x < w - 0.3; x += 0.4) out.push({ x: gd.x0 + x, z: gd.z0 + 0.2, r: 0.12, low: true });
  return (gd.legs = out);
}
// Out on the beach under the tower or behind the wall, you still see where you are.
const selfXray = xrMat('#ffd45a', 0.5);
export function selfSeen() {
  if (pirate.xrG !== pirate.g) { pirate.xrG = pirate.g; pirate.xr = addXray(pirate.g, selfXray); }
  const on = outside() && !cine && !chart.on;   // (not in the cutscene, or over the map: the camera's out front then)
  if (pirate.xrOn !== on) { pirate.xrOn = on; pirate.xr.forEach((x) => { x.visible = on; }); }
}
export const barrel = (() => {
  const g = new THREE.Group();
  const b = mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.9, 16), mat('#6a4326', { map: woodTex }));
  b.position.y = 0.45;
  const hoop = mat('#2b2b2b', { metalness: 0.6 });
  [0.15, 0.75].forEach((y) => { const h = mesh(new THREE.TorusGeometry(0.405, 0.025, 6, 24), hoop); h.rotation.x = Math.PI / 2; h.position.y = y; g.add(h); });
  const fire = mesh(new THREE.ConeGeometry(0.28, 0.4, 10), new THREE.MeshBasicMaterial({ color: '#ff8a2a' }), false);
  fire.position.y = 1.05;
  const l = new THREE.PointLight('#ff7a2a', 6, 4, 1.8);
  l.position.y = 1.3;
  g.add(b, fire, l);
  return g;
})();
export let chestHeap = null;
export const chest = (() => {
  const g = new THREE.Group();
  const base = mesh(new RoundedBoxGeometry(1.1, 0.55, 0.7, 2, 0.04), mat('#6b3f22', { map: woodTex }));
  base.position.y = 0.28;
  const lid = mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16, 1, false, 0, Math.PI), mat('#7a4a28', { map: woodTex }));
  lid.rotation.set(-0.9, 0, Math.PI / 2);
  lid.position.set(0, 0.6, -0.32);
  const gold = mat('#e8b23a', { metalness: 0.8, roughness: 0.25, emissive: '#5a3a00' });
  chestHeap = mesh(new THREE.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold);
  chestHeap.scale.set(1.2, 0.5, 0.75);
  chestHeap.position.y = 0.52;
  g.add(base, lid, chestHeap);
  g.rotation.y = 0.4;
  return g;
})();
