// Rowing her by mirror strokes: the two boards either side of the screen while her oars are out, her
// rowers, and the squares they row handed to the helm. (The rules: src/mirror-row.ts, the puzzle;
// src/den-row.ts, the boards at sea; src/den-sail.ts, Helm.stroke, rowing them. The boards' look:
// js/den/row-boards.js.)
import * as THREE from 'three';
import { CREW, RowBoard, bearing, pullFor, leadFor, leaned, shownAt } from '../den-row.js';
import { camera, makePirate, V3, keys, burst, toast, worldLets, shake, $ } from './world.js';
import { sail, SLOOP_DECK } from './sea.js';
import { SWEEP_X, SWEEP_Z } from './wind.js';
import { SAIL } from '../den-sail.js';
import { patch } from './sea-puzzles.js';
import { boardsMake, boardsLayout, boardsLay, boardsMove, boardsFlash, boardsJig, boardsBusy, boardsTick, boardsAt, dialHanded, dialTick } from './row-boards.js';

/* RULES.md, "Rowing by mirror strokes" (the user, 10 Nov, after playing it on a page of its own:
   "This is actually quite a good puzzle. I love it."). Run her oars out (3) and two Bilge boards
   stand either side of the screen, port's on the left and starboard's on the right, the sea she's
   rowing through between them (the user: "I can't see where I'm rowing" when the one board lay
   along her deck). Every swap made on one is made in mirror on the other.

   What a side clears pulls that side's oars; even work drives her ahead, and a clear lead on one
   side turns her toward it (more pull on the right-hand board turns her right). Each side's rower
   strokes as hard as that side's been pulling: steady while she's under way, and "like crazy" after
   a big clear on that side (bouncing, sweeps thrashing, spray flying); a Vegas on each side sends
   her flying at the trade winds' pace. A board glows its colour while its side's lead waits for the
   other side to catch it up, so you can see a turn coming.

   While you row the sailing bar's hidden and her guns are run in, her mast and sails struck out of
   the way (as for the deck patch). Esc (or O) ships the oars and she's under sail again, sailing on
   to the pin if there is one; while they're out, the pin stays, a buoy to row for, and the prompt
   says which side to pull harder to bring her round to it. Holed, the boards give way to the patch;
   at the lock, to the quay's Bilge; and come back after. */
export const rowing = { on: false, board: null, group: null, boards: null, cur: { r: 6, c: 2 }, aim: false, rowers: [], crazy: { port: false, starboard: false }, layout: null, low: 0, top: 0, lowT: 0 };
const SIDES = ['port', 'starboard'];

// The rowers: one each side, sat on a thwart amidships facing aft, as rowers do, each by its own
// sweep (js/den/wind.js, SWEEP_X), side by side on one thwart, its loom in their hands. The same
// size as you (the user, 10 Nov: "why are they so mini and you're like a giant on the back of the
// ship?").
const CREW_LOOK = {
  port: { shirt: ['#f4efe4', '#b8322a'], scarf: '#7a1e1e', trousers: '#3a2b22', beard: '#2a1a10', patch: false },
  starboard: { shirt: ['#f4efe4', '#2a8a4a'], scarf: '#1f5a32', trousers: '#34395a', beard: '#8a5a2a', patch: true },
};
const THWART = 0.3, HIP = 0.72;   // (the thwart's height on her deck; a pirate's hips above their feet)
function rowersMake() {
  return SIDES.map((side) => {
    const p = makePirate(CREW_LOOK[side]), seat = new THREE.Group();
    seat.position.set(SWEEP_X[side] + 0.35, SLOOP_DECK, (side === 'port' ? -1 : 1) * (SWEEP_Z - 0.53));   // (their sweep's loom in reach)
    seat.rotation.y = -Math.PI / 2;   // (facing aft, her stern)
    for (const l of p.legs) l.rotation.x = -1.45;   // (sat, legs out in front)
    seat.add(p.g);
    return { side, p, seat };
  });
}
// Their hands on the loom: each arm swung to point at the bit of their sweep inside the gunwale
// nearest its shoulder (the loom's inboard end, LOOM, out to a hand's width from it).
const LOOM = -0.65, hand = new THREE.Vector3(), sh = new THREE.Vector3();
function onLoom(r) {
  const oar = sail.sweeps?.oars.find((o) => (o.s > 0) === (r.side === 'starboard'));
  if (!oar) return;
  oar.arm.updateMatrixWorld(true);
  for (const a of r.p.arms) {
    a.parent.updateMatrixWorld(true);
    const z = oar.arm.worldToLocal(a.parent.localToWorld(sh.copy(a.position))).z;
    oar.arm.localToWorld(hand.set(0, 0, Math.max(LOOM, Math.min(LOOM + 0.4, z))));
    a.parent.worldToLocal(hand);
    sh.copy(hand).sub(a.position);
    a.rotation.x = Math.atan2(-sh.z, -sh.y);
    a.rotation.z = Math.atan2(sh.x, Math.hypot(sh.y, sh.z)) * 0.6;
  }
}
// Her mast, sails and guns out of the way while she rows.
function struck(on) {
  if (!sail.g) return;
  for (const o of [...sail.g.userData.sails, ...sail.g.userData.rig]) o.visible = !on;
  for (const side of ['L', 'R']) sail.g.userData.guns[side].visible = !on;
}
/* Nothing of the deck patch shows while she rows (the user, 10 Nov: "when I've just clicked oars, I
   see the carpentry pieces for the repairing the damaged carpentry puzzle I've just played"): every
   patch on her deck is hidden, not just the last: a crane frame since leaves an older patch's
   planks unknown to patch.group. */
function underBoard(hide) {
  for (const o of sail.g?.children ?? []) if (o.userData.deckPatch) o.visible = !hide;
}
function rowOpen() {
  rowing.boards ||= boardsMake();
  if (!rowing.group) {
    rowing.group = new THREE.Group();
    rowing.rowers = rowersMake();
    for (const r of rowing.rowers) rowing.group.add(r.seat);
  }
  sail.g.add(rowing.group);
  rowing.on = true;
  rowing.aim = false;
  boardsLay(rowing.boards, rowing.board.row.boards);
  rowing.boards.el.style.display = '';
  rowing.lowT = 0;
  struck(true);
  underBoard(true);
  sail.rowRate = (side, under) => rowing.board.rate(side, under);
  document.body.classList.add('rowing');   // (the sailing bar out of the way while you row)
  keys.clear();
  /* How to turn her, the first time the oars go out (the user, 10 Nov: "[turning] on the spot works
     brilliantly, it's just not very obvious [what] you have to do to achieve it ... if you do a good
     combo on one side"; "I think a tip maybe would be good"). */
  if (!rowing.toldTurn) { rowing.toldTurn = true; toast('Oars out! Even clears on both boards row her ahead; a big combo on one side turns her that way'); }
}
export function rowShut() {
  rowing.group?.removeFromParent();
  // (holed while rowing, the deck patch has just struck her sails and guns: they stay down for it)
  if (rowing.on) { struck(patch.on && !patch.at); underBoard(false); }
  rowing.on = false;
  sail.rowRate = null;
  document.body.classList.remove('rowing');
  if (rowing.boards) rowing.boards.el.style.display = 'none';
}
// Rowing her: the boards are wanted while her oars are out, unless something else has her (holed:
// the patch; at the lock: the quay's Bilge; hauling treasure).
const wanted = (busy) => sail.on && sail.helm.oars && !sail.helm.dazed() && sail.helm.held() !== 'up' && !busy;

export function rowKey(key) {
  if (!rowing.on) return false;
  const mv = { arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1], arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0] }[key];
  if (mv) { rowing.cur.r = Math.max(0, Math.min(11, rowing.cur.r + mv[0])); rowing.cur.c = Math.max(0, Math.min(4, rowing.cur.c + mv[1])); return true; }
  if (key === ' ' || key === 'enter') { swap(); return true; }
  if (key === 'q' || key === 'e') { toast('Her guns are run in while she rows: Esc ships the oars', false, true); return true; }
  return key === 'h' || key === 'backspace';
}
// The pointer over a board moves the cursor there (mirrored, over starboard's); off them, a click
// does nothing.
export function rowHover(x, y) {
  if (!rowing.on) return;
  const at = boardsAt(rowing.boards, x, y);
  rowing.aim = !!at;
  if (at) rowing.cur = at;
}
// A click (js/den/sailing.js): a swap where the pointer is, if it's on a board.
export function rowSwap() { if (rowing.aim) swap(); }
function swap() {
  if (!rowing.on || boardsBusy(rowing.boards)) return;
  const B = rowing.board, m = B.swap(rowing.cur.r, rowing.cur.c);
  if (!m.moves.some((x) => x.moved)) { boardsJig(rowing.boards, B.row.boards, rowing.cur); return; }
  boardsMove(rowing.boards, m);
  stroke(m.steps);
  // Said: the combos, and what they did to her.
  const both = m.combos.every((x) => x === 'Vegas!') ? 'Double Vegas!' : m.combos.every((x) => x === 'Bingo!') ? 'Double Bingo!' : m.combos.filter(Boolean).join(' + ');
  const flying = m.steps.filter((s) => s === 'F').length >= CREW.FLYING;
  const crazy = SIDES.filter((s) => B.crazy(s) && !rowing.crazy[s]);
  if (flying) toast(`${both || 'Heave!'} Both sides rowing like crazy: she's flying!`);
  else if (crazy.length === 2) toast(`${both} Both rowers going like crazy!`);
  else if (crazy.length) toast(`${both} The ${crazy[0]} rower's going like crazy!`);
  else if (both) toast(both);
}
// A debug hook (window.den.rowPull): pull as a move on the boards would, without the boards, e.g.
// { port: 15, starboard: 15 } for a Vegas on each side at once.
export function rowPull(p) {
  if (!rowing.board) return null;
  const steps = rowing.board.pull({ port: p.port ?? 0, starboard: p.starboard ?? 0 });
  if (rowing.boards) for (const side of SIDES) if (p[side] > 0) boardsFlash(rowing.boards, side);
  stroke(steps);
  if (steps.filter((s) => s === 'F').length >= CREW.FLYING) toast("Both sides rowing like crazy: she's flying!");
  return steps;
}
// Squares rowed: to the helm, to row; and the compass shows which.
function stroke(steps) {
  if (!steps.length) return;
  sail.helm.stroke(steps);
  if (rowing.boards) dialHanded(rowing.boards, steps);
  if (steps.length >= CREW.FLYING) worldLets.shake = Math.max(shake, 0.25);
}

export function rowTick(dt, busy = false) {
  const h = sail.helm;
  // The boards for this voyage at the oars: fresh ones each time they're run out.
  if (!(sail.on && h.oars)) rowing.board = null;
  else rowing.board ||= new RowBoard();
  rowing.board?.tick(dt);
  leanTick(dt);
  const want = wanted(busy);
  if (want !== rowing.on) { if (rowing.on) rowShut(); if (want) rowOpen(); }
  if (!rowing.on) return;
  const B = rowing.board;
  // Where they go: clear of the prompt at the bottom (measured now and then: it changes as you go).
  if ((rowing.lowT -= dt) <= 0) { rowing.lowT = 0.5; rowing.low = $('dock').getBoundingClientRect().top; rowing.top = document.querySelector('.hud')?.getBoundingClientRect().bottom ?? 0; }
  rowing.layout = boardsLayout(rowing.boards, rowing.low || innerHeight, rowing.top);
  boardsTick(rowing.boards, dt, rowing.cur, { port: B.waiting('port'), starboard: B.waiting('starboard') });
  dialTick(rowing.boards, dt, B.building());
  // The rowers, in time with their side's sweeps (js/den/wind.js), going like crazy after a big clear.
  const t = performance.now() / 1000;
  for (const r of rowing.rowers) {
    const ph = sail.sweeps?.ph?.[r.side] ?? 0, crazy = B.crazy(r.side), p = r.p;
    rowing.crazy[r.side] = crazy;
    // (reaching forward toward her stern for the catch as the loom comes aft, leaning back hauling
    // on the pull: in step with the sweep, js/den/wind.js, which swings 0.42 * sin(ph))
    p.g.rotation.x = 0.35 * Math.sin(ph);
    p.g.position.y = THWART - HIP + (crazy ? Math.abs(Math.sin(ph)) * 0.12 : 0);
    p.g.rotation.z = crazy ? Math.sin(t * 23) * 0.08 : 0;
    onLoom(r);
    if (crazy && Math.random() < dt * 6) { r.seat.updateMatrixWorld(true); burst(r.seat.localToWorld(V3(0, 1.4, 0)), '#e6f3f6', 2, 1.2); }
  }
}

/* Seeing her answer the oars as the pull builds (the user, 10 Nov: "I'm not seeing any physical
   difference ... I expect the boat to start, tilt it, angling to one side if I'm just rowing one
   side"). Between squares she creeps ahead as forward pull builds, swings her bows toward the turn
   that's building and heels into it (src/den-row.ts, leadFor); when the square's move comes, it
   starts from where she'd crept to and the lean melts into it (shownAt), never jumping back. */
const NO_LEAD = { f: 0, y: 0, heel: 0 };
rowing.lead = { ...NO_LEAD };
function leanTick(dt) {
  const h = sail.helm, B = rowing.board;
  if (!B) { rowing.lead = { ...NO_LEAD }; rowing.moveRef = null; return; }
  const cur = h.cur, moving = cur && cur.m !== 'W' && h.t < cur.secs;
  if (moving) {
    // A move's begun: what she'd leaned goes into it, and she leans afresh after it.
    if (rowing.moveRef !== cur) { rowing.moveRef = cur; rowing.lead0 = rowing.lead; rowing.lead = { ...NO_LEAD }; }
    return;
  }
  rowing.moveRef = null;
  const want = leadFor(B.building()), k = Math.min(1, dt * 5);
  for (const x of ['f', 'y', 'heel']) rowing.lead[x] += (want[x] - rowing.lead[x]) * k;
}
// Where she's drawn at the oars (js/den/sailing.js draws her there): h.now(), leaning into the pull.
export function rowShown(p) {
  const h = sail.helm;
  if (!h.oars || !rowing.board) return p;
  const cur = h.cur;
  if (rowing.moveRef && cur === rowing.moveRef) {
    const u = Math.min(1, h.t / cur.secs), e = u * u * (3 - 2 * u), L = rowing.lead0;
    rowing.applied = { f: L.f * (1 - e), y: L.y * (1 - e) };
    return { ...shownAt(cur.from, cur.m, u, L, cur.bump), heel: L.heel * (1 - e) };
  }
  rowing.applied = { f: rowing.lead.f, y: rowing.lead.y };
  return { ...leaned(p, h.pose.d, rowing.lead), heel: rowing.lead.heel };
}


/* The camera while rowing (the user, 10 Nov: "I know it's like zoomed in is good to see the puzzle,
   but like I can't see where I'm rowing"): behind her and above, turned with her as she turns, so
   the sea she's rowing into fills the part of the screen between the boards (above them, when
   they're along the bottom): her, the next few squares ahead, the rocks and the red rings. Not
   turned with her lean into the pull, though (rowShown): you see her angle toward the turn that's
   building, and creep ahead (the view following her only half of the way). */
export function rowCam() {
  const A = rowing.applied ?? { f: 0, y: 0 }, L = rowing.layout ?? { wide: true, free: { x: 0, y: 0, w: innerWidth, h: innerHeight } };
  const ry = sail.g.rotation.y + A.y * Math.PI / 2, bow = V3(Math.cos(ry), 0, -Math.sin(ry));
  const at = sail.g.position.clone().setY(0).addScaledVector(bow, -A.f * SAIL.CELL * 0.5);
  // Her low in the sea's part of the screen (three quarters of the way down it; a bit higher when
  // it's a strip above the boards, to keep her clear of them), the sea ahead of her above: so the look's ahead of her by what puts her there, seen from TILT up and DIST back.
  const TILT = 0.62, DIST = L.wide ? 20 : 15;
  const y = (L.free.y + L.free.h * (L.wide ? 0.74 : 0.6)) / innerHeight * 2 - 1, below = Math.atan(y * Math.tan(camera.fov * Math.PI / 360));
  const ahead = DIST * Math.cos(TILT) - DIST * Math.sin(TILT) / Math.tan(TILT + below);
  return { look: at.addScaledVector(bow, ahead), dist: DIST, tilt: TILT, yaw: Math.atan2(-Math.cos(ry), Math.sin(ry)) };
}
const PULL = { port: 'pull harder on port (the left board)', starboard: 'pull harder on starboard (the right board)', either: 'row one side harder to bring her round' };
export function rowPrompt() {
  const h = sail.helm;
  let pin = '';
  if (h.pin) {
    const b = bearing(h.pose, h.pin), side = pullFor(b);
    pin = b === 'ahead' ? " · the pin's ahead: row both sides evenly" : side ? ` · the pin's ${b === 'astern' ? 'astern' : `to ${b}`}: ${PULL[side]}` : '';
  }
  return `Rowing · clear on both boards to row ahead; more on one side turns her that way${pin} · arrows or mouse · Space or click swaps · Esc: oars in`;
}
