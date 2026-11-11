// Loading her guns by Gunnery: the gun tower's own puzzle on a board laid on her deck at sea. The
// puzzle is the one copy of Gunnery (src/gunnery.ts), its look the tower's (js/den/gundeck.js); what
// it means for her, her shots a side, is src/den-guns.ts. This is only the wrapper: where the board
// lies, the camera, the keys and the mouse.
import * as THREE from 'three';
import { S, camera, mat, mesh, woodTex, keys, ray, toast, V3, v3 } from './world.js';
import { dressBoard, gunwale, setCrates, gunTick, drawBoard, gunSays, chalkOn, chalkRelease, wheelDeck } from './gundeck.js';
import { GUNS, cantLoad } from '../den-guns.js';
import { GUNNERY, DR, DC, k } from '../gunnery.js';
import { sail, SLOOP_DECK } from './sea.js';

/* The user (10 Nov): "we should have to load the guns through the puzzle". G takes you to her guns:
   the Gunnery board is laid along her deck, its top row toward her bow and you looking down it from
   over her stern, so the guns down its left side are her port guns and those down its right her
   starboard (Q and E fire them). Played as on the tower: click a plank to chalk an arrow (drag the
   way it should point, the wheel turns it, click an arrow to turn it, right-click rubs it out), or
   the arrows move a cursor and Space chalks. She sails on to the pin while you load, W A D still
   put in moves, and Q and E fire what's loaded. Esc (or 2) leaves the guns as they are, to come
   back to. One board on her deck at a time: with her oars out it's the rowing board's, so 2 says to
   ship them first (and 3 at the guns ships you to the oars); holed, the board gives way to the deck
   patch, at the lock to the quay's Bilge, and comes back after. */
export const gunnery = { on: false, want: false, b: null, group: null, sq: 0.13, labels: null };
const W = GUNNERY.COLS * S, H = GUNNERY.ROWS * S;
const SIDE = { L: 'port (Q)', R: 'starboard (E)' };

// What it says as one of her guns is loaded or fouled.
function said(g, was) {
  const i = gunnery.b.guns.indexOf(g);
  if (g.state === 'fouled' && was !== 'fouled') toast('A gun\'s fouled! Roll a bucket into it', false, true);
  if (g.state === 'loaded') toast(`Loaded! A shot for her ${SIDE[GUNS.SIDES[i]]}`);
}
// The board: her Gunnery (sail.guns.board), dressed as the tower's, on a deck of Gunnery brown with
// a red gunwale and gold rail round it. A fresh one with each new sloop (sailReset).
function build() {
  gunnery.group?.removeFromParent();
  gunnery.labels?.remove();
  const g = new THREE.Group();
  gunnery.labels = document.createElement('div');
  gunnery.labels.style.display = 'none';
  document.body.appendChild(gunnery.labels);
  const b = Object.assign(sail.guns.board, { group: g, at: (r, c, y = 0) => V3((c + 0.5) * S - W / 2, 0.05 + y, (r + 0.5) * S - H / 2), said });
  const deck = mesh(new THREE.PlaneGeometry(W + 0.1, H + 0.1).rotateX(-Math.PI / 2), mat('#94704f', { map: woodTex, roughness: 0.9 }), false);
  deck.position.y = 0.02;
  g.add(deck);
  dressBoard(b, gunnery.labels);
  gunwale(b);
  setCrates(b, b.pickCrates());
  gunnery.b = b; gunnery.group = g;
}
// Her mast, sails and own guns out of the way while the board's on her deck (as for the oars).
function struck(on) {
  if (!sail.g) return;
  for (const o of [...sail.g.userData.sails, ...sail.g.userData.rig]) o.visible = !on;
  for (const side of ['L', 'R']) sail.g.userData.guns[side].visible = !on;
}
function open() {
  if (gunnery.b !== sail.guns.board) build();
  const g = gunnery.group, k2 = gunnery.sq / S;
  // Along her deck, its top row toward her bow (+x), its left side her port.
  g.position.set(0.1, SLOOP_DECK + 0.03, 0);
  g.rotation.set(0, -Math.PI / 2, 0);
  g.scale.setScalar(k2);
  sail.g.add(g);
  struck(true);
  gunnery.on = true;
  gunnery.labels.style.display = '';
  gunnery.b.hover ||= [6, 2];
  document.body.classList.add('gunnery');
  keys.clear();
}
function shut() {
  gunnery.group?.removeFromParent();
  if (gunnery.on) struck(false);
  gunnery.on = false;
  if (gunnery.labels) gunnery.labels.style.display = 'none';
  if (gunnery.b) gunnery.b.press = null;
  document.body.classList.remove('gunnery');
}
// A new sloop (a new game): nothing loaded, and you're not at her guns.
export function gunneryReset() { gunnery.want = false; shut(); }

const WHY = {
  oars: 'Ship the oars first (3): she can\'t be rowed and loaded at once',
  holed: 'Patch her first: she\'s holed',
  lock: 'Pump her up the lock first',
};
// 2 at sea (1 Sailing, 2 Gunnery, 3 the oars: js/den/sailing.js): to her guns, or away from them.
export function gunneryToggle(busy = false) {
  if (gunnery.want) { gunnery.want = false; toast('Away from the guns: they stay as they are'); return; }
  const why = cantLoad(sail.helm);
  if (why || busy) { toast(WHY[why] ?? 'Not just now', true); return; }
  gunnery.want = true;
  const n = sail.guns.shots('L') + sail.guns.shots('R');
  toast(n ? 'To the guns! Gunnery: the left side\'s guns are her port, the right side\'s starboard' : 'To the guns! Load them by Gunnery: the left side\'s guns are her port, the right side\'s starboard');
}
// Each tick at sea: the board on her deck while you're at her guns and nothing else has her, the
// puzzle's beat, and its labels.
export function gunneryTick(dt, busy = false) {
  const h = sail.helm;
  if (!sail.on || h.oars) gunnery.want = false;
  const show = sail.on && gunnery.want && !cantLoad(h) && !busy;
  if (show !== gunnery.on) { if (show) open(); else shut(); }
  if (!gunnery.on) return;
  const b = gunnery.b;
  b.tickT += dt / GUNNERY.TICK;
  if (b.tickT >= 1) { b.tickT = Math.min(b.tickT - 1, 0.5); gunTick(b); }
  drawBoard(b, dt, true);
  // Each gun's label out over its gunport.
  for (const g of b.guns) {
    const [cls, html] = gunSays(g), sig = cls + html;
    if (g.sig !== sig) { g.sig = sig; g.label.className = cls; g.label.innerHTML = html; }
    v3.copy(gunnery.group.localToWorld(b.at(g.port[0] + DR[g.d] * 1.6, g.port[1] + DC[g.d] * 1.6, 0.5))).project(camera);
    g.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    g.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    g.label.style.display = v3.z > 1 ? 'none' : '';
  }
}

// ----- keys and the mouse -----
const move = { arrowleft: [0, -1], arrowright: [0, 1], arrowup: [-1, 0], arrowdown: [1, 0] };
// A click on a plank: an arrow the way the ghost shows, or an arrow there turned a quarter.
function chalkHere(r, c) {
  const b = gunnery.b, a = b.arrows.get(k(r, c)), dir = a ? (a.dir + 1) % 4 : b.pen;
  b.pen = dir;
  if (!chalkOn(b, r, c, dir)) toast('Not there: chalk on an open plank', true);
}
export function gunneryKey(key) {
  if (!gunnery.on) return false;
  const b = gunnery.b, mv = move[key];
  if (mv) { const [r, c] = b.hover ?? [6, 2]; b.hover = [Math.max(0, Math.min(GUNNERY.ROWS - 1, r + mv[0])), Math.max(0, Math.min(GUNNERY.COLS - 1, c + mv[1]))]; return true; }
  if ((key === ' ' || key === 'enter') && b.hover) { chalkHere(...b.hover); return true; }
  if ((key === 'backspace' || key === 'delete') && b.hover) { chalkOn(b, ...b.hover, -1); return true; }
  if (key === 'escape' || key === '2') { gunneryToggle(); return true; }
  return false;
}
// The board's square under the pointer.
export function gunneryHover(x, y) {
  if (!gunnery.on) return;
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  const g = gunnery.group;
  g.updateMatrixWorld(true);
  const o = new THREE.Vector3().setFromMatrixPosition(g.matrixWorld), n = new THREE.Vector3(0, 1, 0).transformDirection(g.matrixWorld), p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, o), p)) return;
  g.worldToLocal(p);
  const c = Math.floor((p.x + W / 2) / S), r = Math.floor((p.z + H / 2) / S);
  if (r >= 0 && r < GUNNERY.ROWS && c >= 0 && c < GUNNERY.COLS) gunnery.b.hover = [r, c];
}
// As on the tower: press on a plank, and let go there (or drag the way the arrow should point).
export function gunneryDown(x, y) {
  gunneryHover(x, y);
  const b = gunnery.b;
  if (b.hover) b.press = { r: b.hover[0], c: b.hover[1], x, y };
}
export function gunneryUp(x, y) { if (gunnery.on && gunnery.b.press) chalkRelease(x, y, gunnery.b); }
export function gunneryRub(x, y) {
  gunneryHover(x, y);
  const b = gunnery.b;
  if (b.hover && b.arrows.has(k(...b.hover))) chalkOn(b, ...b.hover, -1);
}
export function gunneryWheel(step) { if (gunnery.on) wheelDeck(step, gunnery.b); }

// The camera at her guns: from over her stern, down onto the board, her bow at the top of the
// screen; turned with her as she turns, so the board stays put.
export function gunCam() {
  const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect), sq = gunnery.sq, ry = sail.g.rotation.y;
  gunnery.group.updateMatrixWorld(true);
  const look = gunnery.group.localToWorld(V3(0, 0, 0));
  const half = GUNNERY.ROWS * sq / 2;
  const dist = Math.max((half + 0.35) / Math.tan(vh), (half + 0.9) / Math.tan(hh)) * 1.15;
  return { look, dist, tilt: 1.42, yaw: Math.atan2(-Math.cos(ry), Math.sin(ry)) };
}
export function gunneryPrompt() {
  const g = sail.guns;
  return `Gunnery · load her guns: left side port, right side starboard (loaded: port ${g.shots('L')}, starboard ${g.shots('R')}) · click a plank: chalk an arrow (drag to point it, wheel turns it, right-click rubs it out) · arrows and Space chalk too · Q E: fire · Esc: leave the guns`;
}
