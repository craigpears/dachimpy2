// Rowing her by port and starboard: the rowing board laid on her deck while her oars are out, her
// rowers, and the squares it rows handed to the helm. (The rules: src/rowing.ts, the puzzle;
// src/den-row.ts, the board at sea; src/den-sail.ts, Helm.stroke, rowing them.)
import * as THREE from 'three';
import { W as BW, H as BH } from '../bilge.js';
import { isPort } from '../rowing.js';
import { CREW, RowBoard, bearing, pullFor, leadFor, leaned, shownAt } from '../den-row.js';
import { oddsFor } from '../den-bilge.js';
import { scene, camera, mat, mesh, canvasTex, woodTex, makePirate, V3, keys, ray, burst, toast, worldLets, shake } from './world.js';
import { bitMesh } from './bilge.js';
import { sail, SLOOP_DECK } from './sea.js';
import { SAIL } from '../den-sail.js';
import { patch } from './sea-puzzles.js';

/* TODO.md, "Rowing by port and starboard" (the user, 10 Nov: "a full bilge board, obviously with the
   rowing kind of graphics on each side"). Run her oars out (O) and the real Bilge board is laid
   along her deck, its top row toward her bow, and you look down it from over her stern, the sea
   ahead beyond it: so its left half is her port side and its right half her starboard, as you look.
   Each half is dressed as its own side: port's planking washed red and starboard's green (her
   sidelights' colours), a dark kingplank down the middle between them, PORT and STARBOARD painted
   across the bow end, and a rower sitting on each gunwale working that side's two sweeps. A half
   glows its colour while its pull waits for the other side to match it, so you can see a turn
   coming. Its three water rows, at the stern end, are the sea she sits in.

   Each side's rower strokes as hard as that side's been pulling: steady while she's under way, and
   "like crazy" after a big clear on that side (bouncing, sweeps thrashing, spray flying); a Vegas
   shared across both sides sends her flying at the trade winds' pace. One-sided, she turns ("you
   just end up rowing in circles").

   While you row the sailing bar's hidden and her guns are run in, her mast and sails struck out of
   the way (as for the deck patch). Esc (or O) ships the oars and she's under sail again, sailing on
   to the pin if there is one; while they're out, the pin stays, a buoy to row for, and the prompt
   says which side to pull harder to bring her round to it. Holed, the board gives way to the patch;
   at the lock, to the quay's Bilge; and comes back after. */
export const rowing = { on: false, board: null, group: null, pieces: null, meshes: new Map(), queue: [], holdT: 0, shown: null, cur: { r: 6, c: 2 }, sq: 0.22, glow: null, rowers: [], flash: { port: 0, starboard: 0 }, crazy: { port: false, starboard: false }, saidAt: 0 };
const colX = (c) => c - (BW - 1) / 2, rowZ = (r) => r - (BH - 1) / 2;
const SIDES = ['port', 'starboard'];
const TINT = { port: '#c8402e', starboard: '#2fae5a' };

// The deck it's laid on: planks running fore and aft, port's washed red and starboard's green, a dark
// kingplank between them, PORT and STARBOARD across the bow end (the top, beyond row 0).
const HEAD = 1.1;   // squares of deck beyond the top row, for the words
function bedTex() {
  const px = 40, w = BW * px + 16, h = (BH + HEAD) * px + 8;
  return canvasTex(w, h, (g) => {
    g.fillStyle = '#8a6a45'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += px / 2) { g.fillStyle = (x / (px / 2)) % 2 ? 'rgba(0,0,0,0.10)' : 'rgba(255,240,210,0.06)'; g.fillRect(x, 0, px / 2 - 1, h); }
    g.fillStyle = 'rgba(40,24,10,0.5)';
    for (let x = 0; x < w; x += px / 2) for (let y = (x * 7) % 90; y < h; y += 140) g.fillRect(x, y, px / 2 - 1, 2);   // (butt joints)
    g.fillStyle = 'rgba(200,64,46,0.32)'; g.fillRect(0, 0, w / 2, h);
    g.fillStyle = 'rgba(47,174,90,0.30)'; g.fillRect(w / 2, 0, w / 2, h);
    g.fillStyle = '#3a2614'; g.fillRect(w / 2 - 4, 0, 8, h);
    g.font = `700 ${Math.round(px * 0.62)}px 'Alegreya Sans', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 4; g.strokeStyle = 'rgba(30,18,8,0.8)';
    for (const [x, word, col] of [[w / 4, 'PORT', '#ffb3a6'], [w * 3 / 4, 'STARBOARD', '#b6f0c6']]) { g.strokeText(word, x, HEAD * px / 2 + 4); g.fillStyle = col; g.fillText(word, x, HEAD * px / 2 + 4); }
  });
}
function rowMake() {
  const g = new THREE.Group();
  const bed = mesh(new THREE.PlaneGeometry(BW + 0.4, BH + HEAD + 0.2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: bedTex(), roughness: 0.95 }), false);
  bed.position.set(0, 0.004, -HEAD / 2);
  g.add(bed);
  // A dark rim round it, so it reads as a board on her deck.
  const rimM = mat('#3a2614', { map: woodTex });
  for (const [x, z, sx, sz] of [[0, -BH / 2 - HEAD - 0.12, BW + 0.64, 0.24], [0, BH / 2 + 0.22, BW + 0.64, 0.24], [-BW / 2 - 0.32, -HEAD / 2, 0.24, BH + HEAD + 0.6], [BW / 2 + 0.32, -HEAD / 2, 0.24, BH + HEAD + 0.6]]) {
    const b = mesh(new THREE.BoxGeometry(sx, 0.18, sz), rimM, false); b.position.set(x, 0.06, z); g.add(b);
  }
  // Each half's glow, while its pull waits for the other side.
  rowing.glow = {};
  for (const side of SIDES) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(BW / 2, BH).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: TINT[side], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.set((side === 'port' ? -1 : 1) * BW / 4, 0.03, 0);
    m.renderOrder = 4;
    g.add(m);
    rowing.glow[side] = m;
  }
  rowing.pieces = new THREE.Group();
  g.add(rowing.pieces);
  // The water she sits in, over the stern rows.
  const water = mesh(new THREE.PlaneGeometry(BW + 0.3, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#2a6fd8', transparent: true, opacity: 0.35, depthWrite: false }), false);
  water.position.set(0, 0.042, BH / 2 - 1.5);
  water.renderOrder = 4;
  g.add(water);
  // The cursor, as the den's other Bilge boards have it: orange brackets round its two squares.
  rowing.cursor = new THREE.Group();
  const orange = new THREE.MeshBasicMaterial({ color: '#f39a2b' }), t = 0.07, len = 0.28;
  const bar = (x, z, sx, sz) => { const m = mesh(new THREE.BoxGeometry(sx, 0.03, sz), orange, false); m.position.set(x, 0.07, z); rowing.cursor.add(m); };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { bar(sx * (1 - len / 2), sz / 2, len, t); bar(sx, sz * (0.5 - len / 2), t, len); }
  for (const sz of [-1, 1]) bar(0, sz * (0.5 - len / 2), t, len);
  g.add(rowing.cursor);
  rowing.group = g;
}
// The rowers: one each side, sat on her gunwale amidships facing aft, as rowers do.
const CREW_LOOK = {
  port: { shirt: ['#f4efe4', '#b8322a'], scarf: '#7a1e1e', trousers: '#3a2b22', beard: '#2a1a10', patch: false },
  starboard: { shirt: ['#f4efe4', '#2a8a4a'], scarf: '#1f5a32', trousers: '#34395a', beard: '#8a5a2a', patch: true },
};
function rowersMake() {
  return SIDES.map((side) => {
    const p = makePirate(CREW_LOOK[side]), seat = new THREE.Group();
    seat.position.set(0.15, SLOOP_DECK - 0.08, (side === 'port' ? -1 : 1) * 0.9);
    seat.rotation.y = -Math.PI / 2;   // (facing aft, her stern)
    p.g.scale.setScalar(0.36);
    for (const l of p.legs) l.rotation.x = -1.45;   // (sat, legs out in front)
    seat.add(p.g);
    return { side, p, seat };
  });
}
// Her mast, sails and guns out of the way while the board's on her deck.
function struck(on) {
  if (!sail.g) return;
  for (const o of [...sail.g.userData.sails, ...sail.g.userData.rig]) o.visible = !on;
  for (const side of ['L', 'R']) sail.g.userData.guns[side].visible = !on;
}
/* The planks patched into her deck lie under the board while she rows: hidden, or they'd poke up
   through it (the user, 10 Nov: "when I've just clicked oars, I see the carpentry pieces for the
   repairing the damaged carpentry puzzle I've just played"). Every patch on her deck, not just the
   last: a crane frame since leaves an older patch's planks unknown to patch.group. */
function underBoard(hide) {
  for (const o of sail.g?.children ?? []) if (o.userData.deckPatch) o.visible = !hide;
}
// A Bilge piece on it, turned to read the right way up from her stern (as on the quay's board).
function rowBit(bit) {
  const m = bitMesh(bit);
  m.userData.face.rotation.z = 0;
  m.children[0].position.set(-0.05, 0.012, -0.05);
  return m;
}
function rowOpen() {
  if (!rowing.group) rowMake();
  for (const m of rowing.meshes.values()) rowing.pieces.remove(m);
  rowing.meshes.clear();
  Object.assign(rowing, { on: true, queue: [], holdT: 0, shown: null });
  const g = rowing.group, sq = rowing.sq;
  // Along her deck, its top row toward her bow (+x), its left half her port side.
  g.position.set(0.3 + HEAD * sq / 2, SLOOP_DECK + 0.03, 0);
  g.rotation.set(0, -Math.PI / 2, 0);
  g.scale.setScalar(sq);
  sail.g.add(g);

  if (!rowing.rowers.length) rowing.rowers = rowersMake();
  for (const r of rowing.rowers) sail.g.add(r.seat);
  struck(true);
  underBoard(true);
  sail.rowRate = (side, under) => rowing.board.rate(side, under);
  document.body.classList.add('rowing');   // (the sailing bar out of the way while you row)
  keys.clear();
}
export function rowShut() {
  rowing.group?.removeFromParent();
  for (const r of rowing.rowers) r.seat.removeFromParent();
  // (holed while rowing, the deck patch has just struck her sails and guns: they stay down for it)
  if (rowing.on) { struck(patch.on && !patch.at); underBoard(false); }
  rowing.on = false;
  rowing.queue = [];
  sail.rowRate = null;
  document.body.classList.remove('rowing');
  if (rowing.dial) rowing.dial.el.style.display = 'none';
}
// Rowing her: the board's wanted while her oars are out, unless something else has her (holed: the
// patch; at the lock: the quay's Bilge; hauling treasure).
const wanted = (busy) => sail.on && sail.helm.oars && !sail.helm.dazed() && sail.helm.held() !== 'up' && !busy;

export function rowKey(key) {
  if (!rowing.on) return false;
  const mv = { arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1], arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0] }[key];
  if (mv) { rowing.cur.r = Math.max(0, Math.min(BH - 1, rowing.cur.r + mv[0])); rowing.cur.c = Math.max(0, Math.min(BW - 2, rowing.cur.c + mv[1])); return true; }
  if (key === ' ' || key === 'enter') { rowSwap(); return true; }
  if (key === 'q' || key === 'e') { toast('Her guns are run in while she rows: Esc ships the oars', false, true); return true; }
  return key === 'h' || key === 'backspace';
}
export function rowHover(x, y) {
  if (!rowing.on) return;
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  rowing.group.updateMatrixWorld(true);
  const o = new THREE.Vector3().setFromMatrixPosition(rowing.group.matrixWorld), n = new THREE.Vector3(0, 1, 0).transformDirection(rowing.group.matrixWorld);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, o), p)) return;
  rowing.group.worldToLocal(p);
  rowing.cur.c = Math.max(0, Math.min(BW - 2, Math.round(p.x + (BW - 1) / 2 - 0.5)));
  rowing.cur.r = Math.max(0, Math.min(BH - 1, Math.round(p.z + (BH - 1) / 2)));
}
const SAY = { port: 'port', starboard: 'starboard' };
export function rowSwap() {
  if (!rowing.on || rowing.queue.length) return;
  const { r, c } = rowing.cur, b = rowing.board.rowing.bilge;
  const m = rowing.board.swap(r, c);
  if (!m.move.moved) {
    for (const bit of [b.grid[r][c], b.grid[r][c + 1]]) if (bit?.s === 'crab') { const mm = rowing.meshes.get(bit.id); if (mm) mm.userData.jig = 0.6; }
    return;
  }
  rowing.queue.push(...m.move.stages);
  rowing.holdT = 0;
  for (const side of SIDES) if (m.pull[side] > 0) rowing.flash[side] = Math.min(1, 0.35 + m.pull[side] * 0.12);
  stroke(m.steps);
  // Said: the combo, and what it did to her.
  const flying = m.steps.filter((s) => s === 'F').length >= CREW.FLYING;
  const crazy = SIDES.filter((s) => rowing.board.crazy(s) && !rowing.crazy[s]);
  if (flying) toast(`${m.move.combo || 'Heave!'} Both sides rowing like crazy: she's flying!`);
  else if (crazy.length === 2) toast(`${m.move.combo} Both rowers going like crazy!`);
  else if (crazy.length) toast(`${m.move.combo} The ${SAY[crazy[0]]} rower's going like crazy!`);
  else if (m.move.combo) toast(m.move.combo);
}
// A debug hook (window.den.rowPull): pull as a move on the board would, without the board, e.g.
// { port: 7.5, starboard: 7.5 } for a Vegas shared across both sides.
export function rowPull(p) {
  if (!rowing.board) return null;
  const steps = rowing.board.rowing.oars.feed(p, rowing.board.t);
  for (const side of SIDES) { rowing.board.lately[side] += p[side] ?? 0; if (p[side] > 0) rowing.flash[side] = 1; }
  stroke(steps);
  if (steps.length >= CREW.FLYING) toast("Both sides rowing like crazy: she's flying!");
  return steps;
}
// Squares rowed: to the helm, to row; and the compass shows which.
function stroke(steps) {
  if (!steps.length) return;
  sail.helm.stroke(steps);
  rowing.handed = { steps: [...steps], t: 1.1 };
  if (steps.length >= CREW.FLYING) worldLets.shake = Math.max(shake, 0.25);
}

export function rowTick(dt, busy = false) {
  const h = sail.helm;
  // The board for this voyage at the oars: a fresh one each time they're run out.
  if (!(sail.on && h.oars)) rowing.board = null;
  else rowing.board ||= new RowBoard({ odds: oddsFor(0) });
  if (rowing.board) stroke(rowing.board.tick(dt));
  leanTick(dt);
  const want = wanted(busy);
  if (want !== rowing.on) { if (rowing.on) rowShut(); if (want) rowOpen(); }
  if (!rowing.on) return;
  const B = rowing.board, bb = B.rowing.bilge;
  if (!rowing.shown) {
    rowing.shown = bb.snap();
    for (let r = 0; r < BH; r++) for (let c = 0; c < BW; c++) { const bit = rowing.shown[r][c], m = rowBit(bit); m.position.set(colX(c), 0.01, rowZ(r)); rowing.pieces.add(m); rowing.meshes.set(bit.id, m); }
  }
  // A move a step at a time, as on the other boards: what's cleared splashes away, the rest float up.
  rowing.holdT += dt;
  let moving = false;
  for (const m of rowing.meshes.values()) if (m.userData.tz !== undefined && Math.abs(m.position.z - m.userData.tz) + Math.abs(m.position.x - m.userData.tx) > 0.02) moving = true;
  if (rowing.queue.length && rowing.holdT > 0.18 && !moving) {
    const st = rowing.queue.shift();
    rowing.holdT = 0;
    for (const id of st.cleared) {
      const m = rowing.meshes.get(id);
      if (!m) continue;
      const w = m.getWorldPosition(new THREE.Vector3());
      burst(w.setY(w.y + 0.15), isPort(Math.round(m.position.x + (BW - 1) / 2)) ? '#ffd0c8' : '#d0ffdc', 4, 1);
      rowing.pieces.remove(m);
      rowing.meshes.delete(id);
    }
    rowing.shown = st.grid;
    const fresh = Array(BW).fill(0);
    for (let r = 0; r < BH; r++) for (let c = 0; c < BW; c++) {
      const bit = st.grid[r][c];
      let m = rowing.meshes.get(bit.id);
      if (!m) { m = rowBit(bit); m.position.set(colX(c), 0.01, rowZ(BH + fresh[c]++)); rowing.pieces.add(m); rowing.meshes.set(bit.id, m); }
      m.userData.tx = colX(c); m.userData.tz = rowZ(r);
    }
  }
  for (const m of rowing.meshes.values()) {
    const tx = m.userData.tx ?? m.position.x, tz = m.userData.tz ?? m.position.z;
    const dx = tx - m.position.x, dz = tz - m.position.z, d = Math.hypot(dx, dz);
    if (d > 1e-3) { const k = Math.min(1, 6 * dt / d); m.position.x += dx * k; m.position.z += dz * k; }
    m.visible = m.position.z < rowZ(BH - 1) + 0.6;   // (new ones come in from under the stern edge)
    if (m.userData.jig > 0) { m.userData.jig -= dt; m.rotation.y = Math.sin(m.userData.jig * 40) * 0.4; } else m.rotation.y = 0;
  }
  rowing.cursor.position.set((colX(rowing.cur.c) + colX(rowing.cur.c + 1)) / 2, 0, rowZ(rowing.cur.r));
  // Each half glows while its pull waits for the other side, and flashes as it pulls.
  for (const side of SIDES) {
    rowing.flash[side] = Math.max(0, rowing.flash[side] - dt * 1.6);
    rowing.glow[side].material.opacity = Math.min(0.55, B.waiting(side) * 0.1 + rowing.flash[side] * 0.4);
  }
  // The rowers, in time with their side's sweeps (js/den/wind.js), going like crazy after a big clear.
  const t = performance.now() / 1000;
  for (const r of rowing.rowers) {
    const ph = sail.sweeps?.ph?.[r.side] ?? 0, crazy = B.crazy(r.side), p = r.p;
    rowing.crazy[r.side] = crazy;
    // (reaching forward toward her stern on the recovery, leaning back hauling on the pull)
    p.g.rotation.x = -0.35 * Math.cos(ph);
    for (const a of p.arms) a.rotation.x = -1.2 - 0.55 * Math.cos(ph);
    p.g.position.y = crazy ? Math.abs(Math.sin(ph)) * 0.25 : 0;
    p.g.rotation.z = crazy ? Math.sin(t * 23) * 0.12 : 0;
    if (crazy && Math.random() < dt * 6) { r.seat.updateMatrixWorld(true); burst(r.seat.localToWorld(V3(0, 1.0, 0)), '#e6f3f6', 2, 1.2); }
  }
  dialTick(dt);
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

/* The compass by the board (the user, 10 Nov: "almost a compass that says, well ... we're about to
   generate a forward move or a left move or a right move ... at a certain point, it should go one
   way or the other, maybe balance out"). A brass-rimmed card: its needle swings toward the side
   she'll turn as one side out-pulls the other (port pulling harder swings it right), straight up
   when they balance, with red marks where it tips into a turn; a gold ring fills as the forward
   square builds up. When a square's handed out the card shows it, as Battle Navigation's token
   (and how many), and resets. Kept beside the board's port edge on screen. */
const TOK = { F: '↑', L: '↰', R: '↱' }, TIP = Math.PI / 3;
function dialMake() {
  const el = document.createElement('canvas'), px = 2;
  el.width = el.height = 132 * px;
  Object.assign(el.style, { position: 'fixed', width: '132px', height: '132px', pointerEvents: 'none', zIndex: 5, display: 'none', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))' });
  el.title = 'The next move building up';
  document.body.appendChild(el);
  return { el, g: el.getContext('2d'), px, needle: 0, fill: 0, sig: '' };
}
function dialDraw(D, turn, ahead) {
  const g = D.g, W = 132, c = W / 2, R = 58;
  g.setTransform(D.px, 0, 0, D.px, 0, 0);
  g.clearRect(0, 0, W, W);
  // The case: dark wood, a brass rim, a parchment card.
  g.beginPath(); g.arc(c, c, R + 4, 0, Math.PI * 2); g.fillStyle = '#2a1c11'; g.fill();
  g.lineWidth = 4; g.strokeStyle = '#c9a25a'; g.stroke();
  g.beginPath(); g.arc(c, c, R - 9, 0, Math.PI * 2); g.fillStyle = '#efe2c2'; g.fill();
  g.lineWidth = 1.5; g.strokeStyle = '#8a6a45'; g.stroke();
  // The forward ring: filling round from the top as the next forward square builds up.
  g.lineCap = 'round';
  g.beginPath(); g.arc(c, c, R - 3, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = '#4a3420'; g.stroke();
  if (ahead > 0.005) { g.beginPath(); g.arc(c, c, R - 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, ahead)); g.strokeStyle = '#ffd23a'; g.stroke(); }
  // Ticks across the top, and the tipping marks, red, where it goes over into a turn.
  g.strokeStyle = '#6b4e32'; g.lineWidth = 1.5;
  for (let i = -4; i <= 4; i++) { const a = -Math.PI / 2 + i * TIP / 3; g.beginPath(); g.moveTo(c + Math.cos(a) * (R - 12), c + Math.sin(a) * (R - 12)); g.lineTo(c + Math.cos(a) * (R - 18), c + Math.sin(a) * (R - 18)); g.stroke(); }
  g.fillStyle = '#5a3a20'; g.font = "700 15px 'Alegreya Sans', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [a, t, col] of [[-TIP, TOK.L, '#b8322a'], [0, TOK.F, '#5a3a20'], [TIP, TOK.R, '#b8322a']]) {
    const aa = -Math.PI / 2 + a;
    if (a) { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(c + Math.cos(aa) * (R - 10), c + Math.sin(aa) * (R - 10)); g.lineTo(c + Math.cos(aa) * (R - 22), c + Math.sin(aa) * (R - 22)); g.stroke(); }
    g.fillStyle = col; g.fillText(t, c + Math.cos(aa) * (R - 30), c + Math.sin(aa) * (R - 30));
  }
  const H = rowing.handed;
  if (H && H.t > 0) {
    // A square handed out: its token, big, and how many.
    const n = H.steps.length, m = H.steps[H.steps.length - 1], a = Math.min(1, H.t * 3);
    g.globalAlpha = a;
    g.beginPath(); g.arc(c, c + 6, 22, 0, Math.PI * 2); g.fillStyle = '#2a1c11'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#ffd23a'; g.stroke();
    g.fillStyle = '#ffd23a'; g.font = "700 28px 'Alegreya Sans', sans-serif"; g.fillText(TOK[m], c, c + 6);
    if (n > 1) { g.font = "700 13px 'Alegreya Sans', sans-serif"; g.fillStyle = '#5a3a20'; g.fillText(`×${n}`, c, c + 38); }
    g.globalAlpha = 1;
  } else {
    // The needle: iron, its tip red, swung toward the turn that's building.
    const a = -Math.PI / 2 + D.needle * TIP, tx = c + Math.cos(a) * (R - 16), ty = c + Math.sin(a) * (R - 16);
    const px = -Math.sin(a) * 4, py = Math.cos(a) * 4, bx = c - Math.cos(a) * 12, by = c - Math.sin(a) * 12;
    g.beginPath(); g.moveTo(tx, ty); g.lineTo(c + px, c + py); g.lineTo(bx, by); g.lineTo(c - px, c - py); g.closePath();
    g.fillStyle = Math.abs(turn) >= 1 ? '#d42a1c' : '#3d4a55'; g.fill();
    g.beginPath(); g.moveTo(tx, ty); g.lineTo(c + px * 0.6, c + py * 0.6); g.lineTo(c - px * 0.6, c - py * 0.6); g.closePath(); g.fillStyle = '#d42a1c'; g.fill();
    g.beginPath(); g.arc(c, c, 4, 0, Math.PI * 2); g.fillStyle = '#c9a25a'; g.fill();
  }
  g.fillStyle = '#efe2c2'; g.font = "700 11px 'Alegreya Sans', sans-serif"; g.fillText('NEXT MOVE', c, W - 4);
}
function dialTick(dt) {
  const D = rowing.dial ||= dialMake(), b = rowing.board.building();
  if (rowing.handed) rowing.handed.t -= dt;
  const turn = Math.max(-1.2, Math.min(1.2, b.turn));
  D.needle += (turn - D.needle) * Math.min(1, dt * 6);
  // Beside the board's port edge, a little up from its stern, on screen.
  rowing.group.updateMatrixWorld(true);
  const at = rowing.group.localToWorld(V3(-BW / 2 - 2.6, 0, 1.5)).project(camera);
  const x = (at.x + 1) / 2 * innerWidth - 132 - 6, y = (1 - at.y) / 2 * innerHeight - 66;
  D.el.style.display = '';
  D.el.style.left = `${Math.max(8, Math.min(innerWidth - 140, x))}px`;
  D.el.style.top = `${Math.max(8, Math.min(innerHeight - 190, y))}px`;
  const sig = `${D.needle.toFixed(3)}|${b.ahead.toFixed(3)}|${rowing.handed?.t > 0 ? rowing.handed.t.toFixed(2) : ''}`;
  if (sig !== D.sig) { D.sig = sig; dialDraw(D, b.turn, b.ahead); }
}

// The camera while rowing: from over her stern, down along the board toward her bow, the sea ahead
// beyond it at the top of the screen; turned with her as she turns, so the board stays put. Not with
// her lean into the pull, though (rowShown): you see her angle toward the turn that's building, and
// creep ahead (the view following her only half of the way).
export function rowCam() {
  const A = rowing.applied ?? { f: 0, y: 0 };
  const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect), sq = rowing.sq, ry = sail.g.rotation.y + A.y * Math.PI / 2;
  rowing.group.updateMatrixWorld(true);
  const mid = rowing.group.localToWorld(V3(0, 0, 0)), bow = V3(Math.cos(ry), 0, -Math.sin(ry));
  const look = mid.addScaledVector(bow, BH * sq * 0.3 - A.f * SAIL.CELL * 0.5);
  const dist = Math.max((BH * sq / 2 + 0.5) / Math.tan(vh), (BW * sq / 2 + 0.6) / Math.tan(hh)) * 1.3;
  return { look, dist, tilt: 1.0, yaw: Math.atan2(-Math.cos(ry), Math.sin(ry)) };
}
const PULL = { port: 'pull harder on port (the left half)', starboard: 'pull harder on starboard (the right half)', either: 'row one side harder to bring her round' };
export function rowPrompt() {
  const h = sail.helm;
  let pin = '';
  if (h.pin) {
    const b = bearing(h.pose, h.pin), side = pullFor(b);
    pin = b === 'ahead' ? ' · the pin\'s ahead: row both sides evenly' : side ? ` · the pin's ${b === 'astern' ? 'astern' : `to ${b}`}: ${PULL[side]}` : '';
  }
  return `Rowing · left half: port oars, right half: starboard · even clears row her ahead, one side turns her${pin} · arrows or mouse move · Space or click swaps · Esc: oars in`;
}
