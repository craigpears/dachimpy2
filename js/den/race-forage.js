// The sloop race's barrier of driftwood across a gap, and clearing it by Foraging (its rules: src/den-race.ts,
// Barrier and barrierDeal; the puzzle, src/foraging.ts, drawn and played by foraging.js, as Umami's board is).
// The user, 11 Nov: "it's not even macheting. You just have to clear the barrier ... similar to the static
// rocks, but you're doing it through foraging." The barrier: a jam of bleached driftwood across the gap in the
// whirlpools' spit, plain to see from leg 3. In the notch in front of it (sheltered), Space stands its board up
// on the jam, its bundles of driftwood on it to clear down off the bottom; done, the jam breaks up and floats
// off, and the gap's open water the rest of the race. Touches the rest only through race.js's hooks.
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { Barrier, barrierDeal, atNotch } from '../den-race.js';
import { Forage } from '../foraging.js';
import { forageBoard } from './foraging.js';
import { scene, camera, mat, mesh, V3, burst, toast, keys } from './world.js';
import { sail, seaX, seaZ } from './sea.js';
import { rigged } from './crane.js';

const F = LAY.RACE.FORAGE, CELL = SAIL.CELL;
export const forage = { bar: new Barrier(), jam: null, board: null, on: false, gone: 0, said: false };

const driftM = () => mat('#b9ad98', { roughness: 1 }), darkM = () => mat('#7d6f5c', { roughness: 1 });
/** A log of driftwood, `l` long, lying along x. */
function log(l, r, m) { const g = mesh(new THREE.CylinderGeometry(r, r * 0.85, l, 7), m); g.rotation.z = Math.PI / 2; return g; }
/** The jam across the gap: logs piled crossways, a few stuck up, roots and all. */
function jam() {
  const g = new THREE.Group(), a = driftM(), b = darkM();
  for (const [c, r] of F.BARRIER) {
    const x = seaX(c), z = seaZ(r);
    for (let i = 0; i < 9; i++) {
      const l = log(CELL * (0.9 + Math.random() * 0.5), 0.18 + Math.random() * 0.14, i % 3 ? a : b);
      l.position.set(x + (Math.random() - 0.5) * 0.8, 0.2 + Math.floor(i / 3) * 0.32, z + (i % 3 - 1) * 0.9 + (Math.random() - 0.5) * 0.3);
      l.rotation.y = (Math.random() - 0.5) * 0.5;
      g.add(l);
    }
    for (let i = 0; i < 3; i++) {
      const s = log(1.6 + Math.random(), 0.1, a);
      s.position.set(x + (i - 1) * 1.1, 1.0, z + (Math.random() - 0.5));
      s.rotation.set(0, Math.random() * 3, Math.PI / 2 + 0.6 * (i - 1));
      g.add(s);
    }
  }
  g.userData.logs = [...g.children];
  scene.add(g);
  return g;
}
/** A bundle of driftwood, the board's container: three logs lashed, 1 unit a square, standing out toward +z. */
function bundle() {
  const g = new THREE.Group(), a = driftM(), rope = mat('#6b4f2a');
  for (let i = 0; i < 3; i++) { const l = log(0.85, 0.15, a); l.position.set(0, (i - 1) * 0.27, 0.2); g.add(l); }
  for (const x of [-0.25, 0.25]) { const b = mesh(new THREE.TorusGeometry(0.3, 0.035, 5, 12), rope); b.rotation.y = Math.PI / 2; b.position.set(x, 0, 0.2); g.add(b); }
  return g;
}

/** Built the first time the race's course is (race.js). */
export function forageWorld() { forage.jam ||= jam(); }

// ---------- its board ----------
// (stood up on the jam, leant back, so the camera looks at it over her, her mast struck as at Umami's bank)
const SQ = 0.42, AT = () => V3(seaX(F.BARRIER[0][0]), 3.4, seaZ(F.BARRIER[0][1]) - 0.4);
function open() {
  if (forage.bar.cleared) return;
  if (!forage.board) {
    forage.board = forageBoard({ game: new Forage(barrierDeal()), at: AT(), yaw: 0, lean: 0.55, sq: SQ, skin: () => bundle(), bananas: false, onDone: done });
    scene.add(forage.board.group);
  }
  forage.board.idle = false;
  forage.on = true;
  keys.clear();
  if (sail.g) rigged(false);
  if (!forage.said) { forage.said = true; toast('Foraging: turn the squares, three in a row clear. Clear the driftwood down off the bottom of the board'); }
}
function shut() {
  if (forage.on && sail.g) rigged(true);
  forage.on = false;
  if (forage.board) forage.board.idle = true;
}
function done() {
  shut();
  forage.bar.clear(sail.helm.sea);
  forage.gone = 1.6;
  burst(V3(seaX(F.BARRIER[0][0]), 1.2, seaZ(F.BARRIER[0][1])), '#d9cfb8', 22, 3);
  toast('The driftwood\'s cleared! The gap\'s open: sail on through');
}

/** Holding her: at the board (no pins, no Sailing board). */
export const forageHolds = () => forage.on;
const VIEW = ['z', 'c', 'v', '-', '_', '=', '+', 'p'];
/** A key at sea (race.js): the board's while you're at it; Space in the notch starts it. */
export function forageKey(key) {
  if (forage.on) {
    if (key === 'escape') { shut(); toast('The driftwood can wait: Space in the notch to carry on'); return true; }
    if (forage.board?.key(key)) return true;
    return !VIEW.includes(key);
  }
  const h = sail.helm;
  if ((key === ' ' || key === 'enter') && atNotch(h.pose.c, h.pose.r) && !forage.bar.cleared && h.slot < 0 && !h.held()) { open(); return true; }
  return false;
}
export function foragePrompt() {
  if (forage.on) return `${forage.board.prompt()} · Esc: leave it for now`;
  const h = sail.helm;
  if (atNotch(h.pose.c, h.pose.r) && !forage.bar.cleared && h.slot < 0) return 'Driftwood jammed across the gap · Space: clear it (Foraging)';
  return '';
}
const ndc = (x, y) => [x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1];
/** The mouse on its board: a left click turns anticlockwise, a right click (`button` 2) clockwise. */
export function forageHover(x, y) { if (forage.on) forage.board?.pointer(...ndc(x, y), camera); return forage.on; }
export function forageClick(x, y, button = 0) { if (forage.on) { if (forage.board?.pointer(...ndc(x, y), camera)) forage.board.click(button); return true; } return false; }
/** The camera while you clear it: straight on to its board (den.js, with Umami's). */
export function forageCam() {
  if (!forage.on || !forage.board) return null;
  const v = forage.board.camView(camera), d = v.from.clone().sub(v.look).normalize();
  return { look: v.look, dist: v.dist, tilt: Math.asin(d.y), yaw: Math.atan2(d.x, d.z) };
}
export function forageTick(dt) {
  forage.board?.tick(dt);
  // Cleared: the jam breaks up and its logs float off down the gap, and the board's put away.
  if (forage.gone > 0) {
    forage.gone -= dt;
    for (const l of forage.jam?.userData.logs ?? []) { l.position.z -= dt * (1.5 + (l.id % 5) * 0.4); l.position.y = Math.max(0.05, l.position.y - dt * 0.6); l.rotation.y += dt * 0.4; }
    if (forage.gone <= 0) { if (forage.jam) forage.jam.visible = false; forage.board?.dispose(); if (forage.board) scene.remove(forage.board.group); forage.board = null; }
  }
}
/** A new race (or a fresh voyage): the jam's back across the gap, its board dealt afresh. */
export function forageReset() {
  shut();
  if (forage.bar.cleared && sail.helm) forage.bar.reset(sail.helm.sea);
  if (forage.board) { forage.board.dispose(); scene.remove(forage.board.group); forage.board = null; }
  forage.gone = 0;
  if (forage.jam) { scene.remove(forage.jam); forage.jam = jam(); }
}
