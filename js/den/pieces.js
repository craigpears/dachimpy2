// The pieces: the crates (the toolbox) and the fair deal, a piece in your hands, and the Carpentry
// view, where the carried piece would go. (Split out of den.js.)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FairDeal } from '../den-deal.js';
import { PALETTE } from '../den-sword-draw.js';
import { KEYS as VIEW_KEYS, nextHole, quarters, centreOn, clampTo, nextBoard, arrowStep, liftTip, walksOff } from '../den-carp-view.js';
import { canRead } from '../den-map.js';
import { C, S, WOOD_D, REACH, MREACH, WALL_Z, PAY, k, $, scene, mat, mesh, woodTex, WOOD, woodMat, PILE_SC, centred, rotCW, rotCCW, flip, pirate, carry, bounds, G, keys, raiders, cycle, ghostKey, shake, target, ghost, mouse, mouseMode, keyAt, wm, wmLinger, wmBlock, toast, tween, fatOutline, worldLets } from './world.js';
import { frames, frameAt, frameState, frameFits, placeFrame, onRampart, houseState, atPlot, outside } from './land.js';
import { wall, wallGroup, X, Y, rest, fits, PATCH_D, patchZ, curLayer, patchFits, relining, updateHole, placeWall, holeX } from './wall.js';
import { GD, atGunDeck, onGunDeck, myArrows } from './gundeck.js';
import { focus, foe, atWall, outsideFoe, cursor } from './raids.js';
import { rack, crateSig, swordHere, swordPrompt } from './sword.js';
import { bilgePrompt } from './bilge.js';
import { mapPrompt } from './map.js';
import { sailPrompt } from './sailing.js';
import { patch, patchTake } from './sea-puzzles.js';
import { net, guest, isHost, myId, crewSize, send } from './crew.js';
import { deco } from './menus.js';

// ---------- piles (the toolbox), fire barrel, chest, cannon ----------
const crateGeo = new RoundedBoxGeometry(1.2, 0.64, 1.2, 2, 0.04);
export const piles = [0, 1, 2].map(() => {
  const label = document.createElement('div');
  label.className = 'label weak';
  label.innerHTML = 'Restocking<span class="bar part"><b></b></span>';
  label.style.display = 'none';
  $('labels').append(label);
  return { x: 0, z: 0, letter: null, cells: null, group: null, wait: 0, label, crate: mesh(crateGeo, mat('#7a5230', { map: woodTex })) };
});
/* The first wave is dealt fair: the crates hand out the pieces that finish the holes as
   Masterpieces (FairDeal, src/den-deal.ts, with its tests). But only for mending the first wall:
   once every hole of the first wall is done (fairOver) the deal is the usual one, even when the
   raiders knock pieces out in wave 1. */
const fairDeal = () => !G.fairOver && (G.wave === 0 || (G.wave === 1 && G.phase === 'wave'));
export const fair = new FairDeal(C);
// What the fair deal is handed: what's left of each open hole, and what's on the crates and in your hands.
const dealHoles = () => wall.holes.map((h) => (h.status === 'open' ? rest(h) : []));
function dealHave() {
  const have = piles.map((q) => q.letter).filter(Boolean);
  if (carry?.letter) have.push(carry.letter);
  return have;
}
export const neededLetters = () => fair.plan(dealHoles(), dealHave()).map((n) => n.l);
export const fairPick = () => fair.pick(dealHoles(), dealHave());
export function deal(p) {
  const l = fair.next(wall && fairDeal() ? dealHoles() : [], dealHave());
  p.letter = l || C.weightedLetter();
  p.fair = !!l;
  p.cells = C.normalize(C.pick(C.ORIENTS_BY_LETTER[p.letter]).cells);
}
export function showPile(p) {
  if (p.group) scene.remove(p.group);
  p.group = null;
  if (!p.letter) return;
  const g = centred(p.cells, woodMat(p.letter));
  g.rotation.x = -Math.PI / 2;
  g.scale.setScalar(PILE_SC);
  g.position.set(p.x, 0.76, p.z);
  scene.add(g);
  p.group = g;
}
/* The toolbox along the bottom of the screen: what's on each crate, so you can plan your next
   piece from the wall instead of walking back to look (the user: "so that it runs a bit faster").
   The crates are numbered 1, 2, 3, left to right as they stand, and pressing the number (or
   clicking the tile) takes that crate's piece into your hands wherever you are. */
const toolEls = [];
const cratesInOrder = () => [...piles].sort((a, z) => a.x - z.x);
export function takeCrate(j) {
  if (patch.on) return patchTake(j);
  const p = cratesInOrder()[j];
  if (!p || G.over || deco.on || onGunDeck() || net.pending || net.asking) return;
  if (carry && carry.from === p) return putBack();
  if (!p.letter) return toast(p.wait > 0.3 ? `Crate ${j + 1} is restocking` : `Crate ${j + 1}'s piece has been taken`, false, true);
  if (carry && !carry.from) return toast('Your hands are full: fit that piece first', false, true);
  if (carry?.letter === p.letter) toast(`Crate ${j + 1} has another ${p.letter}`, false, true);
  if (carry) putBack();
  pickUp(p);
}
// One whole piece, drawn the main game's way (js/render.js), in the den's wood colours.
function pieceSvg(letter, cells, big = false) {
  const b = C.bbox(cells), cs = big ? Math.min(14, Math.floor(58 / b.h), Math.floor(74 / b.w)) : Math.min(11, Math.floor(42 / b.h), Math.floor(54 / b.w));
  return window.Render.piece(letter, cells, { cell: cs, pad: 1 });
}
export function toolbox() {
  const box = $('toolbox');
  box.hidden = onGunDeck() && !patch.on;
  if (box.hidden) return;
  if (!toolEls.length) {
    box.insertAdjacentHTML('afterbegin', window.Render.defs());   // (the grain patterns)
    for (const [l, c] of Object.entries(WOOD)) box.style.setProperty(`--p-${l}`, c);
  }
  if (!toolEls.length) for (let i = 0; i < piles.length; i++) {
    const el = document.createElement('div');
    el.addEventListener('click', () => takeCrate(i));
    box.append(el);
    toolEls.push({ el, sig: '' });
  }
  // (At sea, patching her deck, they're the ship's timber, a bit bigger: patchOpen.)
  const hand = patch.on ? patch.hand : carry, big = patch.on;
  (patch.on ? patch.slots : cratesInOrder()).forEach((p, j) => {
    const t = toolEls[j], mine = hand && hand.from === p;
    const state = p.letter ? 'piece' : mine ? 'hand' : p.wait > 0.3 ? 'wait' : 'taken';
    const sig = `${big}|${state}|${p.letter}|${p.cells}|${mine ? hand.cells : ''}|${state === 'wait' ? Math.ceil(p.wait) : ''}`;
    if (sig !== t.sig) {
      t.sig = sig;
      t.el.className = `tool ${state}`;
      const n = `<kbd>${j + 1}</kbd>`;
      t.el.innerHTML = state === 'piece' ? `${pieceSvg(p.letter, p.cells, big)}<span>${n}</span>`
        : state === 'hand' ? `${pieceSvg(hand.letter, hand.cells, big)}<span>${n} in hand</span>`
        : state === 'wait' ? `<span>${n} restocking<br>${Math.ceil(p.wait)}s</span><i><b></b></i>`
        : `<span>${n} taken</span>`;
    }
    if (state === 'wait') t.el.querySelector('b').style.width = `${Math.min(1, 1 - p.wait / (p.waitFull || restockSecs())) * 100}%`;
  });
  armsTile(box);
}
/* Beside the crates: the crates of weapons you're carrying for the armoury hoist, the next few
   pairs as they'll come down (bottom one first), breakers glowing, and how many you have. */
let armsEl = null, armsSig = '';
function armsTile(box) {
  if (!armsEl) {
    armsEl = document.createElement('div');
    armsEl.className = 'tool arms';
    armsEl.title = 'Crates of weapons for the armoury hoist, on the left of the den: stack them there to arm soldiers and break loose crates up for planks to mend the wall';
    box.append(armsEl);
  }
  const q = rack.pack, show = swordHere() && q.length > 0;
  armsEl.hidden = !show;
  const sig = show ? q.slice(0, 4).map((p) => p.map(crateSig).join('')).join('|') + q.length : '';
  if (sig === armsSig) return;
  armsSig = sig;
  const box1 = (g) => g.breaker ? `<b class="brk" style="--c:${PALETTE[g.c].base}"></b>` : `<b style="--c:${PALETTE[g.c].base}"></b>`;
  armsEl.innerHTML = `<div class="q">${q.slice(0, 4).map((p) => `<i>${p.map(box1).join('')}</i>`).join('')}</div><span>${q.length} on your back</span>`;
}
/* Where the pointer is on the wall grid, at depth z. Boards behind a hole stand out from the stone
   towards you, and the camera looks down on them, so a board is matched to the pointer at its own
   depth, or it'd snap a square or two away from where you're pointing. */
function mouseAt(z) {
  if (!z || !mouse.ray) return mouse;
  let m = mouse.at.get(z);
  if (!m) {
    const p = new THREE.Vector3();
    m = mouse.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), p) ? { fc: p.x / S + wall.W / 2, fr: wall.H - p.y / S } : mouse;
    mouse.at.set(z, m);
  }
  return m;
}
export function pickUp(p) {
  $('intro').classList.add('off');
  lastPlaced = null;
  if (guest()) { net.asking = true; return send('host', { t: 'crate', i: piles.indexOf(p) }); }
  const m = woodMat(p.letter).clone();
  m.transparent = true;
  worldLets.carry = { letter: p.letter, cells: p.cells, from: p, fair: p.fair, mat: m, group: centred(p.cells, m), lift: 0 };
  const g = carry.group;
  g.position.copy(p.group.position);
  g.rotation.x = -Math.PI / 2;
  g.scale.setScalar(PILE_SC);
  scene.add(g);
  scene.remove(p.group);
  p.group = null; p.letter = null;
  tween(0.25, (t) => { if (carry?.group === g) carry.lift = t; });
}
export function putBack() {
  const p = carry.from;
  if (guest()) {
    send('host', { t: 'putback', i: piles.indexOf(p), letter: carry.letter, cells: carry.cells });
    scene.remove(carry.group);
    worldLets.carry = null;
    return;
  }
  p.letter = carry.letter; p.cells = carry.cells; p.fair = carry.fair;
  scene.remove(carry.group);
  worldLets.carry = null;
  showPile(p);
}
export function turn(fn, dir) {
  // On a board, about its middle, so it turns where it is (kept while you only turn and flip, so
  // turning round and round doesn't walk it off).
  const b0 = C.bbox(carry.cells), mid = wm && (wm.mid?.r === wm.r && wm.mid?.c === wm.c ? wm.mid.p : [wm.r + b0.h / 2, wm.c + b0.w / 2]);
  carry.cells = fn(carry.cells);
  if (wm) { const b = C.bbox(carry.cells); [wm.r, wm.c] = centreOn(mid, b.h, b.w); clampCursor(); wm.mid = { r: wm.r, c: wm.c, p: mid }; }
  const old = carry.group;
  const g = centred(carry.cells, carry.mat);
  g.position.copy(old.position);
  scene.remove(old);
  scene.add(g);
  carry.group = g;
  carry.spin = dir ? dir * Math.PI / 2 : 0;
  carry.flipT = dir ? 1 : 0;
  worldLets.cycle = 0;
  clampCursor();
}
/* Fitting a piece: yours (from your hands), or a crewmate's (`by`, with `hand` made at their
   head). A guest asks the host first; the piece waits in the air until the answer comes. */
export function place(t, by = myId(), hand = carry) {
  if (guest() && hand === carry) {
    net.pending = carry;
    worldLets.carry = null;
    return send('host', { t: 'place', hole: t.hole, frame: t.frame?.i, dr: t.dr, dc: t.dc, patch: !!t.patch, letter: hand.letter, shape: hand.cells, pile: piles.indexOf(hand.from) });
  }
  return t.frame ? placeFrame(t, by, hand) : placeWall(t, by, hand);
}
/* Taking back a misplaced piece: with empty hands at the wall, the last piece you put up comes
   back off, as it was, so you can nudge it into the right spot. Not once it's made a Masterpiece,
   once anything has gone on top of it, or once you've picked up another piece. Damage the hole took
   meanwhile stays taken. */
export let lastPlaced = null;

// Other parts of the den assign to these lets through this, as an imported binding can't be assigned.
export const piecesLets = {
  get lastPlaced() { return lastPlaced; }, set lastPlaced(v) { lastPlaced = v; },
};
export function canTakeBack() {
  const u = lastPlaced;
  if (!u || carry || u.hpAfter === null || (!wm && pirate.h > 0.3)) return false;
  if (u.frame) return !u.frame.done && u.frame.pieces[u.frame.pieces.length - 1] === u.piece && (!!wm || Math.hypot(u.piece.cx - pirate.x, u.piece.cz - pirate.z) <= REACH + 1.2);
  if (!wm && pirate.z > WALL_Z + 2.5) return false;   // (as far back as you can put one)
  if (u.h.pieces[u.h.pieces.length - 1] !== u.piece || (!u.piece.patch && u.h.status === 'master') || (u.piece.patch && u.h.lay[u.piece.layer]?.status === 'master')) return false;
  return !!wm || Math.abs(u.piece.cx - pirate.x) <= MREACH;
}
// A piece in an unfinished frame you could lift back out: the one under the pointer, or (keyboard)
// the nearest within reach. Anyone's, as everyone builds together. (Any piece in it, not only the
// last: Carpentry's frame's rule, src/carpentry-frame.ts, the same on her deck and the crane.)
export function liftable() {
  if (carry || pirate.h > 0.3) return null;
  if (mouseMode) {
    const m = mouse?.frame && mouse;
    if (!m || m.frame.done || m.frame.carp.done()) return null;
    const pi = m.frame.carp.at(Math.floor(m.fr), Math.floor(m.fc));
    // (In the Carpentry view, anywhere on the frame, as a piece is fitted anywhere on it: no walking.)
    return pi < 0 || (!wm && Math.hypot(m.frame.pieces[pi].cx - pirate.x, m.frame.pieces[pi].cz - pirate.z) > REACH + 1.2) ? null : { f: m.frame, pi };
  }
  let best = null, bd = REACH;
  for (const f of frames()) if (!f.carp.done()) f.pieces.forEach((p, pi) => { const d = Math.hypot(p.cx - pirate.x, p.cz - pirate.z); if (d < bd && (f.kind === 'stair' || pirate.z > WALL_Z)) { bd = d; best = { f, pi }; } });
  return best;
}
export function lift(l) {
  if (guest()) return send('host', { t: 'takeback', frame: l.f.i, pi: l.pi });
  unplace(l.f, myId(), true, l.pi);
}
export function takeBack() {
  const u = lastPlaced, where = u.frame || u.h;
  lastPlaced = null;
  if (guest()) return send('host', { t: 'takeback', hole: u.frame ? undefined : wall.holes.indexOf(where), frame: u.frame?.i });
  unplace(where, u.piece.by, true);
}
// Off comes the last piece in a hole or frame, put back as it was before. Whoever put it there
// gets it back in their hands. From a frame, any piece can be lifted (`pi`), by anyone: it goes
// into the hands of whoever lifted it (`by`).
export function unplace(where, by, mine = by === myId(), pi = null) {
  const frame = !!where.carp, at0 = pi != null && frame ? pi : where.pieces.length - 1;
  const piece = where.pieces[at0];
  if (!piece || (pi == null && piece.by !== by) || (frame && where.done)) return;
  if (frame && !where.carp.lift(at0)) return;   // (full: it's being sawn)
  const u = piece.undo, b = C.bbox(piece.info.shape);
  where.pieces.splice(at0, 1);
  let at;
  if (frame) {
    frameState(where);
    at = piece.group.localToWorld(new THREE.Vector3(b.w * S / 2, -b.h * S / 2, 0));
    where.group.remove(piece.group);
  } else {
    const h = where;
    if (piece.patch) {
      const L = h.lay[piece.layer];
      if (L && u && u.hpAfter !== null) {
        const dmg = Math.max(0, u.hpAfter - L.hp);
        if (L.status !== 'open') { G.gold -= PAY[L.status]; G.boarded = u.boarded; G.masters = u.masters; }
        if (u.prevLay) Object.assign(L, u.prevLay, { hp: Math.max(0, u.prevLay.hp - dmg) });
      }
      relining();
    } else {
      piece.cells.forEach((kk) => { wall.wood.delete(kk); h.filled.delete(kk); });
      if (u && u.hpAfter !== null) {
        const dmg = Math.max(0, u.hpAfter - h.hp);
        if (h.status === 'boarded') { G.gold -= PAY.boarded; G.boarded = u.boarded; }
        h.status = u.prev.status;
        h.maxHp = u.prev.maxHp;
        h.hp = Math.max(0, u.prev.hp - dmg);
      }
    }
    updateHole(h);
    at = new THREE.Vector3();
    piece.group.getWorldPosition(at);
    at.x += b.w * S / 2; at.y -= b.h * S / 2;
    wallGroup.remove(piece.group);
  }
  if (lastPlaced?.piece === piece) lastPlaced = null;
  if (isHost()) send('all', { t: 'unplace', hole: frame ? undefined : wall.holes.indexOf(where), frame: frame ? where.i : undefined, by, pi: pi ?? undefined });
  if (mine) holdPiece(piece.info.letter, piece.info.shape, null, at);
}
// Into your hands, lifting from `at`: a piece from a crate (`from`), or one taken back off.
export function holdPiece(letter, cells, from, at) {
  const m = woodMat(letter).clone();
  m.transparent = true;
  worldLets.carry = { letter, cells, from, mat: m, group: centred(cells, m), lift: 0 };
  const g = carry.group;
  g.position.copy(at);
  g.rotation.x = -Math.PI / 2;
  g.scale.setScalar(PILE_SC);
  scene.add(g);
  tween(0.25, (t) => { if (carry?.group === g) carry.lift = t; });
  worldLets.ghostKey = null;
}
/* A crate restocks itself after a piece is used. Fitting one is quick; a thrown piece is timber
   gone for good, so that crate takes a few seconds to restock (restockSecs), or you could stand and
   pelt raiders forever. */
// (8 seconds felt a touch slow, more so with a crew sharing the three crates: 7 on your own, about
// 0.6 less for each crewmate, so 5.2 with four. The user asked for marginally faster, not a lot.)
export const restockSecs = () => 7 - 0.6 * (Math.min(4, crewSize()) - 1);
export function refill(p, secs = 0.45) {
  if (!p || guest()) return;   // a piece taken back off the wall has no crate to refill; the host deals
  p.wait = p.waitFull = secs;
  clearTimeout(p.timer);
  p.timer = setTimeout(() => {
    p.wait = 0;
    if (p.letter || carry?.from === p) return;   // dealt afresh meanwhile (a new game)
    deal(p); showPile(p);
    const g = p.group, s0 = g.scale.x;
    tween(0.3, (s) => g.scale.setScalar(s0 * (1 - (1 - s) ** 3)));
  }, secs * 1000);
}

// ---------- where the carried piece would go ----------
export const ghostMats = {
  ok: new THREE.MeshBasicMaterial({ color: '#7dff7a', transparent: true, opacity: 0.45, depthWrite: false }),
  over: new THREE.MeshBasicMaterial({ color: '#ffb84a', transparent: true, opacity: 0.5, depthWrite: false }),
  no: new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true, opacity: 0.4, depthWrite: false }),
  // A board nailed on behind a mended hole: the green of "it goes here", bolder than the blue of
  // the layer it's going on (wood-coloured, it got lost against the wood in the hole).
  layer: new THREE.MeshBasicMaterial({ color: '#6dff6a', transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false }),
};
/* Easier snapping with the mouse (the user, and a friend: it was hard to put pieces where they
   wanted). A spot covering the square under the pointer comes first, then the one centred
   nearest it; a clean fit before boarding over. And it holds steady: once the ghost has snapped
   somewhere it stays there till you clearly point somewhere better, rather than flicking between
   two. Nothing turns the piece for you (that was tried and dropped). */
let aimKeep = '';
function pickSpot(list, at) {
  const shape = carry.cells.map(String).join(';');
  const key = (o) => `${o.frame ? o.frame.i : 'w'}|${o.hole ?? ''}|${o.patch ? o.layer : ''}|${o.dr},${o.dc}|${shape}`;
  const score = (o) => {
    const m = at(o), R = Math.floor(m.fr), Cc = Math.floor(m.fc);
    const covers = carry.cells.some(([r, c]) => r + o.dr === R && c + o.dc === Cc);
    const cx = o.frame ? o.gc : o.fc, cy = o.frame ? o.gr : o.fr;
    // Pointing into the hole (or frame) means fit it in there: a clean fit nearby beats one that
    // hangs over the stone. Pointing at the stone beside it is how you board over.
    const inside = o.frame ? o.frame.set.has(k(R, Cc)) : wall.cellHole.has(k(R, Cc));
    return (covers ? 0 : 0.9) + 0.5 * Math.hypot(cx - m.fc, cy - m.fr) + (o.over ? (inside ? 1.2 : 0.35) : 0);
  };
  let best = null, bs = Infinity, kept = null, ks = Infinity;
  for (const o of list) {
    const sc = score(o);
    if (sc < bs) { bs = sc; best = o; }
    if (aimKeep && key(o) === aimKeep) { kept = o; ks = sc; }
  }
  if (kept && ks <= bs + 0.4) best = kept, bs = ks;
  if (!best || bs > 2.2) { aimKeep = ''; return null; }
  aimKeep = key(best);
  return best;
}
// ---- puzzle mode at the wall (see `wm`) ----
export const wallSpots = () => (carry ? fits(carry.cells).concat(patchFits(carry.cells)) : []);
/* Standing on (or right by) a frame on the floor, or with a spot for your piece on one in reach:
   you're there to build it, so that frame's Carpentry view comes on (the user, 9 Nov, carrying a
   piece to the walk frame: "I'm still seeing the same view as before ... I'm certainly not getting
   that more 2D isometric view"). Never the whole wall's from there. */
const footV = new THREE.Vector3();
const frameUnder = () => frames().find((f) => {
  if (f.done) return false;
  if (f.kind === 'stair') return Math.hypot(f.mid.x - pirate.x, f.mid.z - pirate.z) < 2.5;
  const l = f.group.worldToLocal(footV.set(pirate.x, f.mid.y, pirate.z)), m = 1.4 / S, fc = l.x / S, fr = -l.y / S;
  return fc > -m && fc < f.b.w + m && fr > -m && fr < f.b.h + m;
}) || null;
export const onFrame = () => !!frameUnder();
export function frameHere() {
  const f = frameUnder();
  if (f || !carry || !frames().length) return f;
  let best = null, bd = REACH + 1.2;
  for (const o of frameFits(carry.cells)) {
    const d = Math.hypot(o.cx - pirate.x, o.cz - pirate.z);
    if (d < bd) { bd = d; best = o.frame; }
  }
  return best;
}
const spotRank = (o) => (o.patch ? 1 : o.over ? 2 : 0);   // a clean fit, then a board behind, then boarding over
export const canWallMode = () => pirate.h < 0.05 && !deco.on && !G.over && pirate.z > 0 && pirate.z <= WALL_Z + 2.5 && wall.holes.length > 0;
// Keeps the piece on the board: on the wall, inside it; on a frame, touching it (it may hang over).
function clampCursor() {
  if (!wm || !carry) return;
  const b = C.bbox(carry.cells), box = wm.f ? wm.f.b : { r0: 0, c0: 0, h: wall.H, w: wall.W };
  [wm.r, wm.c] = clampTo(wm.r, wm.c, b.h, b.w, box, !!wm.f);
}
/* The Carpentry view (the user, 9 Nov: "when you're puzzling, like I just don't think you can beat
   2D ... people like to use keyboard controls"): straight on to whatever you're building, the wall
   or a frame, played with Puzzle Pirates' own Carpentry keys (src/den-carp-view.ts). It stays on
   while you fetch the next piece with 1-3, and the next piece starts where the last went. */
export const viewBoards = () => [...(wall.holes.length ? ['wall'] : []), ...frames()];
export const viewOk = () => !deco.on && !G.over && !outside() && !onGunDeck() && (wm.f ? frames().includes(wm.f) : wall.holes.length > 0);
export function enterView() {
  // The nearest thing being built: the wall if you're by it, else the nearest frame.
  const fs = frames().slice().sort((a, z) => Math.hypot(a.mid.x - pirate.x, a.mid.z - pirate.z) - Math.hypot(z.mid.x - pirate.x, z.mid.z - pirate.z));
  const byWall = wall.holes.length && (pirate.z <= WALL_Z + 2.5 || !fs.length);
  const nearF = fs.length && Math.hypot(fs[0].mid.x - pirate.x, fs[0].mid.z - pirate.z) < 4.5;
  viewOn(nearF && !(byWall && pirate.z <= WALL_Z + 1) ? fs[0] : byWall ? 'wall' : fs[0] || null);
  worldLets.mouseMode = false;
}
export function viewOn(b) {
  if (!b) return;
  $('intro').classList.add('off');
  if (b === 'wall') return enterWall();
  const q = quarters(b.open), p = q.ul || q.ur || q.dl || q.dr || [b.b.r0, b.b.c0];
  const bb = carry ? C.bbox(carry.cells) : { h: 1, w: 1 };
  const [r, c] = centreOn(p, bb.h, bb.w);
  worldLets.wm = { f: b, r, c };
  if (carry) frameSnap(p);
  clampCursor();
}
// Tab: on to the next thing being built (Shift+Tab, back to the one before).
function nextView(back = false) {
  const list = viewBoards();
  const nb = nextBoard(back ? list.reverse() : list, wm.f || 'wall');
  if (nb) viewOn(nb);
}
// A frame's "up" on the floor (or the stairs' face): which way is up the screen in its view.
const upQ = new THREE.Quaternion();
export function frameUp(f) {
  const v = new THREE.Vector3(0, 1, 0).applyQuaternion(f.group.getWorldQuaternion(upQ));
  v.y = 0;
  return v.lengthSq() < 1e-6 ? v.set(0, 0, -1) : v.normalize();
}
// On a frame, the best spot for the piece near a point: a clean fit if one's close, else centred there.
function frameSnap(p) {
  const b = C.bbox(carry.cells), f = wm.f;
  const near = frameFits(carry.cells).filter((o) => o.frame === f && Math.hypot(o.gr - p[0], o.gc - p[1]) < 2.6)
    .sort((a, z) => (a.over > 0) - (z.over > 0) || Math.hypot(a.gr - p[0], a.gc - p[1]) - Math.hypot(z.gr - p[0], z.gc - p[1]));
  if (near.length) { wm.r = near[0].dr; wm.c = near[0].dc; } else [wm.r, wm.c] = centreOn(p, b.h, b.w);
  clampCursor();
}
// Q, W, A, S: on the wall the next hole that way; on a frame, that quarter of it.
function jumpCorner(corner) {
  const b = C.bbox(carry.cells), at = [wm.r + b.h / 2, wm.c + b.w / 2];
  if (wm.f) {
    const p = quarters(wm.f.open)[corner];
    if (!p) { worldLets.shake = 0.08; return; }
    return frameSnap(p);
  }
  // The hole the piece is at: the one it covers most.
  const span = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
  const cover = (h) => span(wm.c, wm.c + b.w, h.b.c0, h.b.c0 + h.b.w) * span(wm.r, wm.r + b.h, h.b.r0, h.b.r0 + h.b.h);
  const cur = wall.holes.reduce((m, h, j) => (cover(h) > 0 && (m < 0 || cover(h) > cover(wall.holes[m])) ? j : m), -1);
  const g = wall.gateCols, split = [wall.H / 2, (g.c0 + g.c1 + 1) / 2];
  const i = nextHole(wall.holes.map((h) => [h.b.r0 + h.b.h / 2, h.b.c0 + h.b.w / 2]), at, corner, cur < 0 ? null : cur, split);
  if (i === null) { worldLets.shake = 0.08; return; }
  toHole(i);
}
const boardName = (b) => (b === 'wall' ? 'The wall' : { stair: 'Stairs', deck: 'Wall-walk', house: 'Your shack' }[b.kind] || (b.kind === 'gun' ? `Gun tower (${['back', 'middle', 'front'][b.part] || 'part'})` : 'Frame'));
const boardFits = (b) => !!carry && (b === 'wall' ? wallSpots().some((o) => !o.over && !o.patch) : frameFits(carry.cells).some((o) => o.frame === b && !o.over));
let boardsT = 0, boardsSig = '';
export function boardsHud(dt) {
  const el = $('boards');
  if (!wm) { if (boardsSig) { boardsSig = ''; el.replaceChildren(); } return; }
  if ((boardsT -= dt) > 0) return;
  boardsT = 0.3;
  const list = viewBoards(), cur = wm.f || 'wall';
  const sig = list.map((b) => `${boardName(b)}|${b === cur}|${boardFits(b)}`).join(';');
  if (sig === boardsSig) return;
  boardsSig = sig;
  const tab = document.createElement('span');
  tab.className = 'tabkey';
  tab.innerHTML = '<kbd>Tab</kbd> next';
  el.replaceChildren(tab, ...list.map((b) => {
    const btn = document.createElement('button');
    btn.className = b === cur ? 'on' : '';
    btn.innerHTML = `${boardName(b)}${boardFits(b) ? ' <span class="fit" title="The piece in your hands fits here">✓</span>' : ''}`;
    btn.onclick = (ev) => { ev.currentTarget.blur(); viewOn(b); boardsT = 0; };
    return btn;
  }));
}
export function viewKey(key, e) {
  // The wall all mended and your hands empty: WASD walks you off (src/den-carp-view.ts, walksOff).
  if (!wm.f && walksOff(key, !!carry, wall.holes.filter((h) => h.status === 'open' || h.lay.some((L) => L.status === 'open')).length)) { exitWall(); return false; }
  const a = VIEW_KEYS[key];
  if (!a) return false;
  if (a.kind === 'move' || a.kind === 'jump' || a.kind === 'turn' || a.kind === 'flip' || a.kind === 'take') { worldLets.mouseMode = false; worldLets.keyAt = cursor ? { ...cursor } : { x: -1e4, y: -1e4 }; }
  switch (a.kind) {
    case 'leave': exitWall(); break;
    case 'move': if (carry) { if (!wm.f) wallArrow(a.dr, a.dc); else { wm.r += a.dr; wm.c += a.dc; clampCursor(); } } break;
    case 'turn': if (carry) turn(a.dir > 0 ? rotCW : rotCCW, -a.dir); break;
    case 'flip': if (carry) turn(flip, 0); break;
    case 'jump': if (carry && !e.repeat) jumpCorner(a.corner); break;
    case 'take': if (!e.repeat) { takeCrate(a.i); clampCursor(); } break;
    case 'place': if (!e.repeat) { if (carry && target?.ok) place(target); else if (carry) worldLets.shake = 0.2; else if (canTakeBack()) takeBack(); } break;
    case 'next': if (!e.repeat) nextView(e.shiftKey); break;
    case 'undo': if (!e.repeat && canTakeBack()) takeBack(); break;
  }
  return true;
}
export function enterWall() {
  const spots = wallSpots().sort((a, z) => spotRank(a) - spotRank(z) || Math.abs(a.cx - pirate.x) - Math.abs(z.cx - pirate.x));
  const s = (target && !target.frame && target.ok ? target : null) || spots[0];
  const h = s ? null : wall.holes.slice().sort((a, z) => Math.abs(holeX(a) - pirate.x) - Math.abs(holeX(z) - pirate.x))[0];
  worldLets.wm = s ? { f: null, r: s.dr, c: s.dc } : { f: null, r: h.b.r0, c: h.b.c0 };
  for (const a of ['arrowup', 'arrowdown', 'arrowleft', 'arrowright']) keys.delete(a);
  clampCursor();
}
export function exitWall() {
  worldLets.wm = null;
  worldLets.wmLinger = 0;
  worldLets.wmBlock = carry ? { c: carry, x: pirate.x, z: pirate.z } : null;   // don't pull you straight back in while you walk off with that piece
}
// The arrows: to the next hole that way (along the wall for left and right), to the best spot the
// piece has in it, or over the middle of it if it won't go in.
function toHole(best) {
  const b = C.bbox(carry.cells), mid = (h) => [h.b.r0 + h.b.h / 2, h.b.c0 + h.b.w / 2];
  const h = wall.holes[best], [hy, hx] = mid(h);
  const s = wallSpots().filter((o) => o.hole === best).sort((a, z) => spotRank(a) - spotRank(z) || Math.hypot(a.fr - hy, a.fc - hx) - Math.hypot(z.fr - hy, z.fc - hx))[0];
  if (s) { wm.r = s.dr; wm.c = s.dc; } else { wm.r = Math.round(hy - b.h / 2); wm.c = Math.round(hx - b.w / 2); clampCursor(); }
}
/* The arrows on the wall (src/den-carp-view.ts, arrowStep): always a move, never further than it
   must: a square at a time while the piece touches a hole, over the stone and the gate to the
   nearest spot on the next hole, and on to the wall's edge past the last. */
function wallArrow(dr, dc) {
  const b = C.bbox(carry.cells);
  const live = wall.holes.filter((h) => h.status === 'open' || curLayer(h) >= 0).map((h) => h.b);
  const to = arrowStep(live, { r: wm.r, c: wm.c }, b, wall, dr, dc);
  if (to) { wm.r = to.r; wm.c = to.c; } else worldLets.shake = 0.08;   // the wall's edge
}
// Which way to walk to stand below the piece, a step back from the wall.
export function wallWalk() {
  if (pirate.h > 0.05) return null;   // (up on the rampart you puzzle from where you stand)
  if (wm?.f) {
    const f = wm.f, b = carry ? C.bbox(carry.cells) : { h: 1, w: 1 };
    let tx, tz;
    if (f.kind === 'stair') {
      // Beside the foot of the stairs, out of the way of the view.
      const e0 = frameAt(f, f.b.c0, f.b.r1), e1 = frameAt(f, f.b.c0 + f.b.w, f.b.r1);
      tx = f.mid.x + (Math.sign(-f.mid.x) || 1) * 0.9; tz = Math.max(e0.z, e1.z) + 0.8;
    }
    else { const p = frameAt(f, wm.c + b.w / 2, f.b.r1 + 2.6); tx = p.x; tz = p.z; }   // off its near edge, below the piece
    const dx = Math.max(-bounds.x + 0.5, Math.min(bounds.x - 0.5, tx)) - pirate.x, dz = Math.max(bounds.z0 + 0.2, Math.min(bounds.z1 - 0.2, tz)) - pirate.z;
    const n = Math.hypot(dx, dz);
    return n > 0.25 ? { wx: dx / n, wz: dz / n, slow: Math.min(1, n * 2) } : null;
  }
  const b = carry ? C.bbox(carry.cells) : null;
  // Beside the piece, close to the wall, so they never stand between you and it.
  const px = !b ? pirate.x : X(target && !target.frame ? target.dc : wm.c) + b.w * S / 2;
  const side = px > bounds.x - 2.5 ? -1 : 1, tx = !b ? pirate.x : px + side * (b.w * S / 2 + 0.75);
  const dx = Math.max(-bounds.x + 1.2, Math.min(bounds.x - 1.2, tx)) - pirate.x, dz = (b ? 1.2 : WALL_Z + 0.9) - pirate.z;
  const n = Math.hypot(dx, dz);
  return n > 0.12 ? { wx: dx / n, wz: dz / n, slow: Math.min(1, n * 2) } : null;
}
export function aim() {
  worldLets.target = null;
  if (!carry || (!wm && pirate.h > 0.3) || outside()) return;
  if (wm?.f) {
    // A frame's view: the spot the piece is over, wherever that is on the frame, no walking needed.
    const f = wm.f, list = frameFits(carry.cells).filter((o) => o.frame === f), b = C.bbox(carry.cells);
    if (mouseMode && mouse?.frame === f) {
      const best = pickSpot(list, () => mouse);
      if (best) { worldLets.target = { ...best, ok: true }; wm.r = best.dr; wm.c = best.dc; }
      else { wm.r = Math.round(mouse.fr - b.h / 2); wm.c = Math.round(mouse.fc - b.w / 2); clampCursor(); worldLets.target = { frame: f, dr: wm.r, dc: wm.c, ok: false }; }
      return;
    }
    const here = list.find((o) => o.dr === wm.r && o.dc === wm.c);
    worldLets.target = here ? { ...here, ok: true } : { frame: f, dr: wm.r, dc: wm.c, ok: false };
    return;
  }
  if (wm) {
    // Anywhere on the wall, no walking needed: a clean fit at the piece's square first, then a board
    // on behind, then boarding it over. With the mouse, wherever it points, and the keys carry on
    // from there.
    const list = wallSpots();
    if (mouseMode && mouse && !mouse.frame) {
      const best = pickSpot(list, (o) => mouseAt(o.patch ? patchZ(o.layer, wall.holes[o.hole]) - PATCH_D / 2 : 0));
      const b = C.bbox(carry.cells);
      if (best) { worldLets.target = { ...best, ok: true }; wm.r = best.dr; wm.c = best.dc; }
      else { wm.r = Math.round(mouse.fr - b.h / 2); wm.c = Math.round(mouse.fc - b.w / 2); clampCursor(); worldLets.target = { dr: wm.r, dc: wm.c, ok: false }; }
      return;
    }
    const here = list.filter((o) => o.dr === wm.r && o.dc === wm.c).sort((a, z) => spotRank(a) - spotRank(z) || (a.layer ?? 0) - (z.layer ?? 0));
    worldLets.target = here.length ? { ...here[0], ok: true } : { dr: wm.r, dc: wm.c, ok: false };
    return;
  }
  const fl = frames().length ? frameFits(carry.cells) : [];
  const fd = (o) => Math.hypot(o.cx - pirate.x, o.cz - pirate.z);
  // Pointing at a rampart frame: the spot nearest the pointer.
  if (mouseMode && mouse?.frame) {
    const best = pickSpot(fl.filter((o) => o.frame === mouse.frame), () => mouse);
    if (best) worldLets.target = { ...best, ok: true };
    return;
  }
  const reach = (o) => Math.abs(o.cx - pirate.x) <= REACH && pirate.z <= WALL_Z;
  const list = fits(carry.cells).concat(patchFits(carry.cells));
  const b = C.bbox(carry.cells);
  if (mouseMode && mouse) {
    /* With the mouse, wherever you're standing in the den: point at the wall and the piece goes in
       there, no walking up to it (the user, 8 Nov: "we were meant to remove that so you can place
       from anywhere"). */
    const best = pickSpot(list, (o) => mouseAt(o.patch ? patchZ(o.layer, wall.holes[o.hole]) - PATCH_D / 2 : 0));
    if (best) worldLets.target = { ...best, ok: true };
    else worldLets.target = { dr: Math.round(mouse.fr - b.h / 2), dc: Math.round(mouse.fc - b.w / 2), ok: false };
  } else if (!mouseMode) {
    // Everything in reach: a walk frame on the floor when stood back from the wall, the stairs
    // when stood beside them, the holes when at the wall. Clean fits first, nearest first; then
    // the ways to board it over.
    // (The walk frame lies well back: only once you've stepped back to it, not from the wall.)
    const nf = fl.filter((o) => fd(o) <= REACH && (o.frame.kind === 'stair' || pirate.z > WALL_Z + (o.frame.kind === 'deck' ? 1.2 : 0)));
    const dd = (o) => (o.frame ? fd(o) : Math.abs(o.cx - pirate.x));
    const near = list.filter(reach).concat(nf).sort((a, z) => (a.over > 0) - (z.over > 0) || !!a.patch - !!z.patch || dd(a) - dd(z) || a.over - z.over);
    if (near.length) worldLets.target = { ...near[cycle % near.length], ok: true, count: near.length };
  }
}
export function drawGhost() {
  const kind = !target ? '' : !target.ok ? 'no' : target.patch ? 'layer' : target.over ? 'over' : 'ok';
  const f = target?.frame;
  const gz = f ? (f.kind === 'stair' ? 0.08 : 0.16) : target?.patch ? patchZ(target.layer, wall.holes[target.hole]) - 0.06 : kind === 'over' ? WOOD_D - 0.18 : 0.08;
  const want = target && carry ? `${f ? f.i : 'w'}|${carry.cells.map((x) => x.join()).join(';')}|${target.dr},${target.dc}|${kind}|${gz}` : '';
  if (want === ghostKey) return;
  worldLets.ghostKey = want;
  if (ghost) { ghost.parent?.remove(ghost); ghost.traverse((o) => o.geometry?.dispose()); worldLets.ghost = null; }
  if (!want) return;
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(S * 0.98, S * 0.98, 0.12);
  for (const [r, c] of carry.cells) {
    const b = new THREE.Mesh(geo, ghostMats[kind]);
    b.position.set((c + 0.5) * S, -(r + 0.5) * S, gz);
    g.add(b);
  }
  g.add(fatOutline(carry.cells, gz + 0.07, kind === 'no' ? '#ffd0c8' : kind === 'layer' ? '#e8fbff' : '#fff4d0', f ? 0.03 : 0.04));
  if (f) { g.position.set(target.dc * S, -target.dr * S, 0); f.group.add(g); }
  else { g.position.set(X(target.dc), Y(target.dr), 0); wallGroup.add(g); }
  worldLets.ghost = g;
}
const pulsed = new Set();   // the offers that have pulsed once already (prompt)
export function prompt() {
  const f = focus();
  let t = '';
  const loose = foe();
  if (f.kind === 'pile') {
    if (!carry && f.p.letter) t = `Space: pick up the ${f.p.letter}`;
    else if (carry && carry.from === f.p && !f.p.letter) t = `Space: put the ${carry.letter} back`;
    else if (carry && f.p.letter && carry.from) t = `Space: swap the ${carry.letter} for the ${f.p.letter}`;
    else if (carry && f.p.letter) t = `Fit the ${carry.letter} again, or throw it at a raider`;
    else if (!f.p.letter && f.p.wait > 0.3) t = 'This crate\'s restocking: a thrown piece is timber gone';
  } else if (!carry && liftable()) { const l = liftable(); t = liftTip(l.f.pieces[l.pi].info.letter); }
  else if (!carry && canTakeBack()) t = `Space: take the ${lastPlaced.letter} back off`;
  else if (wm) {
    const keysTip = ' · arrows move · X/C turn · Z flip · Q/W/A/S: holes · Tab: next · Esc: walk';
    const what = wm.f ? ({ stair: 'The stairs', gun: 'The gun tower frame', house: 'Your shack\'s frame', deck: 'The wall-walk frame' }[wm.f.kind] || 'The frame') : 'The wall';
    if (!carry) t = `${what} · 1, 2, 3: take a crate's piece · Tab: next · Esc: walk`;
    else if (target?.ok && target.frame) t = `Space: fit the ${carry.letter}${target.over ? (target.frame.kind === 'stair' ? ' (it sticks out, and stays that way)' : ' (it sticks out: the spare gets sawn off)') : ''}${keysTip}`;
    else if (target?.ok && target.patch) t = `Space: nail it on behind${keysTip}`;
    else if (target?.ok && !target.over) t = `Space: fit the ${carry.letter} here${keysTip}`;
    else if (target?.ok) t = `Space: board it over (weak, no Masterpiece)${keysTip}`;
    else t = `The ${carry.letter} won't go there${keysTip}`;
  } else if (carry) {
    const more = '';
    if (target?.frame) t = !target.ok ? 'Walk closer to fit it there' : target.over ? (target.frame.kind === 'stair' ? `Space: fit the ${carry.letter} in the stairs (it sticks out, and stays that way)${more}` : `Space: fit it in the frame (it sticks out: the spare gets sawn off)${more}`) : `Space: fit the ${carry.letter} in the ${{ stair: 'stairs', gun: 'gun tower frame', house: 'house frame' }[target.frame.kind] || 'wall-walk frame'}${more}`;
    else if (target?.ok && target.patch) t = `Space: nail it on behind (one more layer for them to hack through)${more}`;
    else if (target?.ok && !target.over) t = `Space: fit the ${carry.letter} here${more}`;
    else if (target?.ok) t = `Space: board it over (weak, no Masterpiece)${more}`;
    else if (pirate.z <= WALL_Z || (mouseMode && mouse)) t = `The ${carry.letter} won't go there · Q/E turn · F flip`;
    else if (wall.holes.every((h) => h.status !== 'open')) t = `Carry the ${carry.letter} to the wall: nail it on behind a mended hole`;
    else t = `Carry the ${carry.letter} to a hole`;
  } else if (atPlot() && houseState() === 'plot') t = 'Space: build your shack here';
  else if (atPlot() && houseState() === 'built') t = 'Space: paint and dress your shack';
  else if (atPlot() && houseState() === 'building') t = 'Fetch pieces for your shack\'s frame';
  else t = frames().length && pirate.z > WALL_Z ? `Fetch pieces to build the ${{ gun: 'gun tower', house: 'shack' }[(frames().find((o) => o.kind !== 'house') || frames()[0]).kind] || 'rampart'} in its frame` : 'Fetch a piece from the piles';
  const hacking = raiders.some(atWall);
  if (onGunDeck() && !carry) {
    const n = myArrows().length;
    t = `Chalk arrows to steer the stores into the guns: click a plank · WASD or wheel: point it · right-click rubs out (${n}/${GD.arrows}) · Esc: step back`;
  } else if (atGunDeck() && !carry) t = 'The gun tower · Space: take charge of the guns';
  else if (onRampart()) {
    if (!carry) t = 'Bring a piece up here to throw at the raiders';
    else if (outsideFoe()) t = `Space, Shift or click a raider: throw the ${carry.letter} down on them!`;
    else t = hacking ? 'Walk along to get in range' : 'Up on the rampart · watch for raiders at the wall';
  } else if (pirate.h > 0.3) t = carry ? 'Up the stairs to the rampart' : 'Up to the rampart';
  else if (loose) t = carry ? `${f.kind === 'pile' || target?.ok ? t + ' · ' : ''}Shift or click: throw the ${carry.letter} at the raider!` : 'A raider is in the den! Grab a piece to throw at them';
  else if (carry && outsideFoe() && !target?.ok) t += ` · Shift or click a raider: lob it over the wall`;
  if (carry && !wm && frameHere() && t.startsWith('Space')) t += ' · Tab: the Carpentry view';
  if (outside()) t = !carry ? 'Out on the beach · back in through the gate' : loose ? `Shift or click: throw the ${carry.letter} at the raider!` : `Out on the beach · back in through the gate to fit the ${carry.letter}`;
  if (canRead(G.map) && !carry && !wm && pirate.h < 0.05 && !t.startsWith('Space')) t += " · M: the captain's map";
  t = sailPrompt() || mapPrompt() || bilgePrompt() || swordPrompt() || t;
  const el = $('prompt');
  if (el.textContent !== t) {
    el.textContent = t;
    // Something new to do with a key (10 Nov: "it says space, but it's such a tiny little thing at
    // the bottom. I did not see it"): it stands out, and pulses as it comes up.
    // (Not the running tips while you carry a piece or play a puzzle: only somewhere new to do something.)
    const act = /\bSpace\b/.test(t) && !carry && !/arrows or mouse|click a plank|click swaps|pick up the [A-Z]|pick the [A-Z] back up|put the|swap the/.test(t);
    el.classList.toggle('act', act);
    el.classList.remove('pulse');
    // Each offer pulses the first time only (10 Nov: "a lot of like flashing yellow things ... when
    // I'm standing around the carpentry puzzle and the sword fighting, it's really irritating"):
    // walking about by the frames and the rack, the offer changes every few steps.
    const offer = t.replace(/\b(the|a) [A-Z]\b/g, '$1 _').replace(/\d+/g, '#');
    if (act && !pulsed.has(offer)) { pulsed.add(offer); void el.offsetWidth; el.classList.add('pulse'); }
  }
  $('gunhelp').classList.toggle('on', onGunDeck());
  if (onGunDeck()) $('intro').classList.add('off');   // (nothing over the board)
}
