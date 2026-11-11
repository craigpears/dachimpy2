// Sailing the sloop: boarding and going ashore, her guns, the helm's keys
// and clicks, and each tick at sea. (Split out of den.js.)
import * as THREE from 'three';
import { SAIL, LAY, Helm, broadside } from '../den-sail.js';
import { Broadside } from '../den-guns.js';
import { $, scene, camera, mat, mesh, animateWalk, V3, pirate, view, carry, G, keys, shake, wm, ray, burst, toast, tween, worldLets } from './world.js';
import { outside } from './land.js';
import { putBack, exitWall } from './pieces.js';
import { sword } from './sword.js';
import { bilge, groundPlane } from './bilge.js';
import { chart } from './map.js';
import { canLand, canBoard, ashoreAt } from '../den-beach.js';
import { cine } from './cine.js';
import { SEA_X0, seaX, seaZ, SLOOP_DECK, sail, liftAt, sloopMesh, seaRocks, seaWorld, pinMesh, dotMat, dotMine, dotGeo, hoverMat, TOK } from './sea.js';
import { patch, deckHoleShape, patchClear, patchShut, patchClick, patchHover, patchTick, patchPrompt } from './sea-puzzles.js';
import { hold, holdShut, holdKey, holdHover, holdSwap, holdTick, lockWorld, lockTick, lockSay, lockClear } from './lock.js';
import { online } from './crew.js';
import { haul, haulShut, haulPrompt, canHaulWreck, haulWreck } from './treasure.js';
import { checkpointReset, checkpointTick, checkpointShot } from './checkpoint.js';
import { gunnery, gunneryReset, gunneryToggle, gunneryTick, gunneryKey, gunneryHover, gunneryDown, gunneryPrompt } from './sea-guns.js';
import { deco, decoMode } from './menus.js';
import { sailView, patchView, setPaused, denLets } from '../den.js';
import { WIND } from '../den-wind.js';
import { windTick, windSay, windHud, oarsHud, windSig, rowToggle, headwindPrompt } from './wind.js';
import { rowing, rowShut, rowKey, rowHover, rowSwap, rowTick, rowPrompt, rowShown } from './rowing.js';
import { craneKey, cranePrompt, craneOffer, craneHolds, craneTick, craneReset, craneWorld } from './crane.js';
import { umami, umamiKey, umamiClick, umamiHover, umamiPrompt, umamiOffer, umamiReset } from './capybara.js';
import { isleWorld, isleTick, isleAshore, canLandIsle } from './isle.js';
import { station, stationKey, stationToggle, stationTick, stationPrompt, stationReset } from './sail-station.js';
import { kikkitWorld, kikkitTick, kikkitShown, kikkitHail, kikkitPrompt, kikkitHolds, kikkitReset } from './whirlpools.js';
import { inKikkitWaters } from '../den-kikkit.js';
import { tzzWorld, tzzTick, tzzHail, tzzPrompt, tzzReset } from './balloon-isle.js';
import { empireWorld, empireTick, empirePrompt, empireReset } from './imperial-isle.js';
import { primatesTick, primatesReset } from './moored.js';
import { smugglersWorld, smugglersTick, smugglersPrompt, smugglersReset } from './smugglers.js';
import { raceWorld, raceTick, raceKey, racePrompt, raceShot, raceHolds, raceReset } from './race.js';

// The old sloop's at anchor in the cove from the moment the siege is over, while their ship makes
// sail in the background (the user, 9 Nov: "I'm sat here quite a while waiting for his sloop to sail
// off ... That should be a background feature as soon as he's rowed back").
const sloopHome = () => G.phase === 'peace' && !online();
const atHome = () => { const p = sail.helm.pose, H = SAIL.HOME; return p.c === H.c && p.r === H.r; };
// You board her from the jetty's end, where she lies alongside (src/den-beach.ts).
export const nearSloop = () => !sail.on && sail.g?.visible && atHome() && sail.helm.slot < 0 && outside() && !carry && !cine
  && canBoard(pirate.x, pirate.z);
// Aboard: whatever you had in hand back on its crate, and the camera out over the sea.
export function board() {
  if (wm) exitWall();
  if (deco.on) decoMode(false);
  sword.on = false; bilge.on = false; chart.on = false;
  if (carry) { if (carry.from && !carry.from.letter) putBack(); else { scene.remove(carry.group); worldLets.carry = null; } }
  keys.clear();
  sail.on = true;
  pirate.h = pirate.hs = 0; pirate.hop = null;
  document.body.classList.add('sailing');
  $('intro').classList.add('off');
  toast('Aboard! Click the sea to drop a pin, and she\'ll sail there');
}
// Ashore: from anywhere on the landing along the den's beach (src/den-beach.ts), she's brought in to
// her mooring and you step off onto the jetty's end by her, to walk back along it.
export function ashore() {
  sail.on = false;
  gunneryReset();
  sail.helm.moor();
  document.body.classList.remove('sailing');
  const at = ashoreAt();
  Object.assign(pirate, { x: at.x, z: at.z, h: at.h, hs: at.h, hop: null });
  pirate.g.rotation.set(0, 0, 0);
  keys.clear();
}
export function sailReset() {
  if (sail.on) { sail.on = false; document.body.classList.remove('sailing'); }
  sail.sea.breeze?.set(WIND.START.d, WIND.START.s);
  sail.helm = new Helm(sail.sea);
  sail.guns = new Broadside();
  gunneryReset();
  checkpointReset();
  sail.said = {};
  holdShut();
  rowShut();
  rowing.board = null;
  if (haul.on) haulShut();
  sail.salvage = null;
  if (patch.on) patchShut();
  patchClear();
  craneReset();
  umamiReset();
  stationReset();
  kikkitReset();
  tzzReset();
  empireReset();
  smugglersReset();
  primatesReset();
  raceReset();
  denLets.sailView = 0;
}
// A shot out of her side, from where she is right now: it flies straight out and comes down in the
// sea, or on the first rock in its way (src/den-sail.ts, broadside). Only a gun that's loaded fires,
// and they're loaded by Gunnery (src/den-guns.ts; js/den/sea-guns.js); then it runs out again with
// that side's next load, if there is one.
const SIDE_NAME = { L: 'port', R: 'starboard' };
const ballGeo = new THREE.SphereGeometry(0.13, 10, 8), ballMat = mat('#3a3f45', { metalness: 0.6 });   // (every shot's: made afresh, they were never freed)
function sailFire(side) {
  const did = sail.guns.fire(side);
  if (did === 'empty') return toast(`No shot loaded to ${SIDE_NAME[side]}: 2 to load her guns by Gunnery`, true);
  if (did === 'running') return toast(`The ${SIDE_NAME[side]} gun's still running out`, true);
  const { cells, hit } = broadside(sail.sea, sail.helm.now(), side), gun = sail.g.userData.guns[side];
  sail.g.updateMatrixWorld(true);
  const from = gun.localToWorld(V3(0, 0.3, -0.85)), end = cells[cells.length - 1];
  const to = V3(seaX(end[0]), hit ? 1 : 0.05, seaZ(end[1]));
  burst(from, '#ffcf6a', 12, 3);
  burst(from, '#cfc6b8', 8, 1.5);
  worldLets.shake = Math.max(shake, 0.15);
  const ball = mesh(ballGeo, ballMat);
  scene.add(ball);
  const d = from.distanceTo(to);
  tween(0.35 + d * 0.03, (u) => {
    ball.position.lerpVectors(from, to, u);
    ball.position.y += Math.sin(u * Math.PI) * (0.8 + d * 0.08);
  }, () => {
    scene.remove(ball);
    if (!hit) { burst(to, '#e6f3f6', 18, 3.5); burst(to, '#9cc8d4', 10, 2.5); return; }
    burst(to, '#ffb85a', 14, 4);
    burst(to, '#6b5c50', 18, 4);
    burst(to, '#e6f3f6', 8, 2.5);
    worldLets.shake = Math.max(shake, 0.2);
    // The stacks there shudder with the hit.
    for (const r of sail.rockAt.get(`${hit[0]},${hit[1]}`) ?? []) {
      const x0 = r.position.x, z0 = r.position.z;
      tween(0.4, (u) => { const k = Math.sin(u * Math.PI * 6) * 0.12 * (1 - u); r.position.x = x0 + k; r.position.z = z0 - k; }, () => { r.position.x = x0; r.position.z = z0; });
    }
    if (!checkpointShot(hit, to) && !raceShot(hit, to)) toast('A hit on the rocks!');   // (the race's gun gap: race.js)
  });
}
// The square of the board under the pointer (fractional: the middle of a square is whole).
function seaCellAt(x, y) {
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(groundPlane, p)) return null;
  return { c: (p.x - SEA_X0) / SAIL.CELL - 0.5, r: (SAIL.Z0 - p.z) / SAIL.CELL - 0.5 };
}
export function sailClick(x, y) {
  if (umamiClick(x, y)) return;   // (his board, and poling her along the lagoon's shore: capybara.js)
  if (patch.on) { patchClick(x, y); return; }
  if (hold.mode) { holdHover(x, y); holdSwap(); return; }
  if (rowing.on) { rowHover(x, y); rowSwap(); return; }
  if (gunnery.on) { gunneryDown(x, y); return; }
  if (craneHolds() || raceHolds()) return;   // (up in the lagoon, or on her way: no pins; on the race's crane: race.js)
  const at = seaCellAt(x, y);
  if (!at) return;
  if (!sail.helm.drop(at.c, at.r)) toast('She\'s there already', true);
  else if (sail.helm.via) toast('She\'ll ride the trade winds: the pin\'s where they drop her off');
}
export function sailHover(x, y) {
  if (umamiHover(x, y)) { sail.hover = null; return; }
  if (patch.on) { patchHover(x, y); sail.hover = null; return; }
  if (hold.mode) { holdHover(x, y); sail.hover = null; return; }
  if (rowing.on) { rowHover(x, y); sail.hover = null; return; }
  if (gunnery.on) { gunneryHover(x, y); sail.hover = null; return; }
  if (craneHolds() || raceHolds()) { sail.hover = null; return; }
  const at = seaCellAt(x, y);
  sail.hover = at && sail.sea.open(Math.round(at.c), Math.round(at.r)) ? [Math.round(at.c), Math.round(at.r)] : null;
}
// Something else has her, so the Sailing board's put away (sail-station.js).
const rigBusy = () => haul.on || craneHolds() || raceHolds() || patch.on || !!hold.mode || umami.on || sail.helm.dazed() || kikkitHolds();
/* The puzzles at sea in one bank, the order of their buttons on the sailing bar: 1 Sailing, 2 Gunnery
   (her guns), 3 the oars (the user, 11 Nov: "surely they should at least all be in the same bank of keys
   for activating the puzzles ... I think 1, 2, 3 makes sense"; R, G and O were scattered among the
   helm's W A S D and the guns' Q E). Each one's key puts it out or away, and from one goes to another.
   (Ashore, 1 2 3 take from the crates: js/den.js.) */
// 1: the Sailing board, out or away; from the oars or her guns, they're put away.
function rigToggle() {
  if (!station.want && !rigBusy()) { if (rowing.on) rowToggle(); if (gunnery.on) gunneryToggle(); }
  stationToggle(rigBusy());
}
export function sailKey(key) {
  if (hold.mode && holdKey(key)) return;
  if (kikkitHolds() && key !== 'p') return;   // (round and round in a whirlpool: whirlpools.js)
  if (umamiKey(key)) return;   // (Umami's board, and her moorings in the lagoon: capybara.js)
  if (craneKey(key)) return;   // (the crane at the ledge, and the lagoon: crane.js)
  if (raceKey(key)) return;   // (the race: its buoy, and its crane on the neck: race.js)
  // The Sailing board: its keys while it's open; 1 or Esc puts it away (sail-station.js).
  if (stationKey(key)) return;
  if (key === '1') return rigToggle();
  // Rowing: the board's keys; Esc or 3 ships the oars.
  if (rowing.on && (key === 'escape' || key === '3')) return rowToggle();
  if (rowing.on && rowKey(key)) return;
  // At her guns: the board's keys (W A D still steer, Q E fire); 3 goes to the oars instead.
  if (gunnery.on && key === '3') { gunneryToggle(); return rowToggle(); }
  if (gunneryKey(key)) return;
  if (key === '2') return gunneryToggle(haul.on || craneHolds());
  const m = { w: 'F', arrowup: 'F', a: 'L', arrowleft: 'L', d: 'R', arrowright: 'R' }[key];
  if (m) { if (!sail.helm.put(m)) toast('That\'s a turn\'s worth put in already', true); return; }
  if (key === 'q' || key === 'e') return sailFire(key === 'q' ? 'L' : 'R');
  if (key === '3') return rowToggle();
  if (key === 's' || key === 'arrowdown' || key === 'backspace') sail.helm.unput();
  else if (key === 'escape') { sail.helm.stop(); toast('Pin pulled up: she\'ll stop when this turn\'s done'); }
  else if (key === 'h') { sail.helm.drop(SAIL.HOME.c, SAIL.HOME.r); if (sail.helm.pin) toast('Heading home to the cove'); }
  else if ((key === ' ' || key === 'enter') && canHaulWreck()) haulWreck();
  else if ((key === ' ' || key === 'enter') && canLand(sail.helm)) ashore();
  else if ((key === ' ' || key === 'enter') && canLandIsle(sail.helm)) isleAshore();   // (Mischievious's isle: isle.js)
  else if ((key === ' ' || key === 'enter') && kikkitHail()) { /* (Kikkit, off her island: whirlpools.js) */ }
  else if ((key === ' ' || key === 'enter') && tzzHail()) { /* (Tzz's lesson again, off her island: balloon-isle.js) */ }
  else if (key === 'z' || key === 'c') keys.add(key);
  else if (key === 'p') setPaused(true);
  else if (key === 'v') Object.assign(view, { yaw: 0, pitch: 0, zoom: 1 });
  else if (key === '-' || key === '_') view.zoom = Math.min(2, view.zoom * 1.15);
  else if (key === '=' || key === '+') view.zoom = Math.max(0.55, view.zoom / 1.15);
}
export function sailPrompt() {
  if (nearSloop()) return 'Space: board the old sloop';
  if (!sail.on) return '';
  if (haul.on) return haulPrompt();
  if (rowing.on) return rowPrompt();
  if (gunnery.on) return gunneryPrompt();
  if (station.on) return stationPrompt();
  const cp = umamiPrompt() || cranePrompt() || racePrompt() || kikkitPrompt() || tzzPrompt() || empirePrompt() || smugglersPrompt();
  if (cp) return cp;
  const h = sail.helm, held = h.held();
  if (held === 'daze') return patchPrompt('Holed! Patch her deck to sail on · 1, 2, 3: a piece from the crate', ' (it rests on the deck: boarded over)');
  if (held === 'up') return 'In the lock · bilge on the quay to pump it up, and the top gates open: arrows or mouse move · Space or click swaps';
  if (held === 'down') return 'The lock\'s draining down';
  if (held === 'fill') return 'The lock\'s filling from the canal above';
  if (held === 'gates') return 'The lock gates are swinging open';
  if (held === 'calm') return 'Becalmed: dead in the water till the wind picks up · 3: out oars';
  if (canLand(h)) return h.slot < 0 ? 'Off the den\'s beach · Space: go ashore · click the sea to drop a pin · 1: Sailing' : 'Under way off the den\'s beach · Space: go ashore';
  if (canLandIsle(h)) return h.slot < 0 ? 'Off the Wedding Isle · Space: go ashore · click the sea to drop a pin' : 'Under way off the Wedding Isle · Space: go ashore';
  if (canHaulWreck()) return 'The old wreck · Space: haul up its treasure (Treasure Haul) · click the sea to drop a pin';
  if (h.slot < 0 && h.headwind()) return headwindPrompt();
  if (h.pin) return h.oars ? 'Rowing to the pin' : 'Under way to the pin';
  if (h.slot >= 0) return 'Under way';
  return 'Click the sea to drop a pin, or put in moves with W A D · Q E: fire · 1: Sailing · 2: load her guns (Gunnery) · 3: oars';
}
/* What there is to start just now, offered on the thing itself where you're looking (js/den/start-mark.js:
   the user, 10 Nov, "it should be in the middle of the screen where I'm looking so that I can click on
   it and start it"), as the prompt offers it, in the prompt's order: boarding her, from the jetty; at sea
   freeing Umami, the crane's starts, the old wreck's treasure. A click does what Space does. */
export function sailOffer() {
  if (nearSloop()) return { at: sail.g.localToWorld(V3(0.3, SLOOP_DECK + 1.6, 0)), label: 'Board the old sloop', go: board };
  if (!sail.on || haul.on || rowing.on || gunnery.on || station.on || patch.on || hold.mode) return null;
  const go = () => sailKey(' ');
  if (umamiPrompt()) return umamiOffer();
  if (cranePrompt()) return craneOffer();
  if (sail.helm.held() || canLand(sail.helm) || canLandIsle(sail.helm) || !canHaulWreck()) return null;
  const w = sail.sea.wreck;
  return w ? { at: V3(seaX(w[0]), 0.8, seaZ(w[1])), label: 'Haul up its treasure (Treasure Haul)', go } : null;
}
// This turn's tokens (the one being sailed lit) and the next turn's, yours in gold.
function sailHud() {
  const h = sail.helm, mineN = h.mine.length;
  const now = h.slot >= 0 ? h.turn : [], next = h.next();
  const load = (side) => Math.round(sail.guns.out(side) * 20), shots = (side) => sail.guns.shots(side);
  const lit = h.lit();   // (lit only while it's being sailed: not while she waits, becalmed, say)
  const sig = `${now.join('')}|${lit}|${h.slot}|${next.join('')}|${mineN}|${load('L')}|${load('R')}|${shots('L')}${shots('R')}|${windSig()}`;
  if (sig === sail.hudSig) return;
  sail.hudSig = sig;
  const toks = (list, cls) => Array.from({ length: SAIL.SLOTS }, (_, i) => (list[i] ? `<b class="tok ${cls(i)}">${TOK[list[i]]}</b>` : '<b class="tok empty"></b>')).join('');
  // Her guns either side of the tokens, port on the left: a pip for each shot loaded that side (by
  // Gunnery: 2), lit when there's one ready, the bar filling as her gun runs out again after a shot.
  const pips = (side) => Array.from({ length: sail.guns.most(side) }, (_, i) => `<b class="pip${i < shots(side) ? ' on' : ''}"></b>`).join('');
  const gun = (side, k) => `<div class="gun${sail.guns.ready(side) ? ' ready' : ''}" title="${side === 'L' ? 'Port' : 'Starboard'} shots loaded (Gunnery: 2)"><kbd>${k}</kbd>${side === 'L' ? 'Port' : 'Starboard'}<span class="pips">${pips(side)}</span><i style="width:${shots(side) ? load(side) * 5 : 0}%"></i></div>`;
  // The wind, at the left end, and the puzzles at the right in their keys' order, 1 2 3: Sailing, her
  // guns, the oars (wind.js).
  $('sailhud').innerHTML = `<div class="turns">${windHud()}${gun('L', 'Q')}<div class="turn"><span>This turn</span>${toks(now, (i) => (i < h.slot ? 'done' : i === lit ? 'now' : ''))}</div>`
    + `<div class="turn"><span>Next</span>${toks(next, (i) => (i < mineN ? 'mine' : ''))}</div>${gun('R', 'E')}<button class="oars" id="rig-btn" title="Sailing: its chains carry her ahead (1)"><kbd>1</kbd>Sailing</button><button class="oars" id="guns-btn" title="Load her guns by Gunnery (2)"><kbd>2</kbd>Load</button>${oarsHud()}</div>`
    + '<div class="help">Click the sea: drop a pin · <kbd>W</kbd> <kbd>A</kbd> <kbd>D</kbd>: forward, left, right yourself · <kbd>S</kbd>: take one back · <kbd>Q</kbd> <kbd>E</kbd>: fire port, starboard · <kbd>1</kbd>: Sailing · <kbd>2</kbd>: load her guns by Gunnery · <kbd>3</kbd>: oars out or in · <kbd>Esc</kbd>: pull up the pin · <kbd>H</kbd>: head home · wheel: zoom</div>';
}
export function sailTick(dt) {
  sail.rocks ||= seaRocks();
  sail.world ||= seaWorld();
  lockWorld();   // (the canal's locks: lock.js)
  craneWorld();   // (the headland on the cove's left, the ledge and the lagoon: crane.js)
  isleWorld();   // (Mischievious's isle, out to the right of the lanes: isle.js)
  kikkitWorld();   // (Kikkit's island, her whirlpools and Vegas Island: whirlpools.js)
  tzzWorld();   // (Tzz's island, a hop from Kikkit's, and her balloon lesson: balloon-isle.js)
  empireWorld();   // (Port Decorum, the imperial island past the checkpoint: imperial-isle.js)
  smugglersWorld();   // (the smugglers' beach behind it: smugglers.js)
  raceWorld();   // (the sloop race's course, out past Primates Rule: race.js)
  primatesTick(dt);   // (Primates Rule at anchor, still to come: moored.js)
  sail.g ||= (() => { const g = sloopMesh(); scene.add(g); return g; })();
  const show = sail.on || sloopHome();
  if (sail.g.visible !== show) sail.g.visible = show;
  if (show && !sail.seen && !sail.on && G.phase === 'peace' && !cine && !chart.on) { sail.seen = true; toast('Their ship\'s making sail, and there\'s an old sloop left at anchor in the cove: walk down to her'); }
  if (!show) return;
  const h = sail.helm, W = sail.world;
  // The trade winds race along their lanes.
  for (const tex of W.lanes) tex.offset.y -= dt * 2.2;
  let events = [];
  if (sail.on) {
    const heldWas = h.held();
    events = h.tick(dt);
    for (const e of events) {
      windSay(e);
      if (e.kind === 'move' && e.bump && !e.irons) sail.bumpT = e.secs * 0.45;   // (felt as she hits)
      if (e.kind === 'arrive' && canLand(h)) toast('Off the den\'s beach: Space to go ashore');
      if (e.kind === 'arrive' && canLandIsle(h)) toast('Off the Wedding Isle: Space to go ashore');
      if (e.kind === 'push') {
        // (a gust off the Sailing board isn't the trade winds: sail-station.js)
        // (nor a whirlpool's whirl, nor the winds of Kikkit's whirlpools: whirlpools.js says what those do)
        if (!e.gust && !e.whirl && !sail.riding && !inKikkitWaters(e.from.c, e.from.r)) { sail.riding = true; if (!sail.said.wind) { sail.said.wind = true; toast('The trade winds have her!'); } }
        burst(V3(seaX(e.from.c), 0.3 + liftAt(e.from.c, e.from.r), seaZ(e.from.r)), '#e6f3f6', 5, 2);
      }
      if (e.kind === 'move') sail.riding = false;
    }
    if (sail.riding && !(h.cur && h.cur.m === 'W')) {
      sail.riding = false;
      // (Nothing's said at the junction, nor at the checkpoint: the canal's mouth is yours to find.)
      const home = sail.sea.dropOff(...LAY.LANES[2].at);
      if (h.pose.c === home[0] && h.pose.r === home[1] && !sail.said.home) { sail.said.home = true; toast('The trade winds have carried her home: her mooring\'s just along the shore'); }
    }
    lockSay(h, heldWas, sail.said);   // (the locks: lock.js)
    if (sail.sea.cove.has(`${h.pose.c},${h.pose.r}`) && !sail.said.cove) { sail.said.cove = true; toast('A hidden cove, tucked away off the canal'); }
    if (sail.bumpT > 0 && (sail.bumpT -= dt) <= 0) { worldLets.shake = 0.3; toast('Bump! Rocks', true); }
    sail.guns.tick(dt);
  }
  checkpointTick(dt);   // (the imperial checkpoint: checkpoint.js)
  holdTick(dt);
  patchTick(dt);
  rowTick(dt, haul.on);
  gunneryTick(dt, haul.on || craneHolds());
  stationTick(dt, rigBusy());
  // The locks: each one's water at its level, its gates, and the quay pump at work (lock.js).
  lockTick(dt);
  isleTick();
  // A gun that's fired kicks back in and runs out again as it's loaded, smoking at first.
  for (const side of ['L', 'R']) {
    const gun = sail.g.userData.guns[side], u = sail.guns.out(side);
    gun.position.z = gun.userData.z * (1 - 0.55 * (1 - u) ** 2);
    if (u < 0.6 && (gun.userData.smokeT = (gun.userData.smokeT ?? 0) - dt) < 0) {
      gun.userData.smokeT = 0.3;
      burst(gun.localToWorld(V3(0, 0.32, -0.8)), '#7d7873', 2, 0.5);
    }
  }
  // Her, riding the swell, heeling into her turns.
  const t = performance.now() / 1000, p = kikkitShown(lockClear(rowShown(h.now()))), turning = h.cur && (h.cur.m === 'L' || h.cur.m === 'R') && !h.cur.bump && h.t < h.cur.secs;
  sail.heel += ((turning ? (h.cur.m === 'L' ? -0.13 : 0.13) : 0) - sail.heel) * Math.min(1, dt * 4);
  sail.low = (sail.low ?? 0) + ((h.dazed() ? -0.3 : 0) - (sail.low ?? 0)) * Math.min(1, dt * 2);
  sail.g.position.set(seaX(p.c), liftAt(Math.round(p.c), Math.round(p.r)) + sail.low + Math.sin(t * 0.9) * 0.06 + (p.hop ?? 0), seaZ(p.r));
  sail.g.rotation.y = Math.PI / 2 - p.a * Math.PI / 2;
  sail.g.rotation.x = sail.heel + (p.heel ?? 0) + Math.sin(t * 0.7) * 0.02;   // (leaning into the oars' pull: rowShown)
  sail.g.rotation.z = Math.sin(t * 0.55) * 0.02 + (p.flip ?? 0);   // (end over end: a backflip in Kikkit's whirlpools)
  if (sail.on) {
    // You, at the tiller, facing her bow (up on her stern, beside it, while the board's on her deck,
    // so you're not stood on it, nor between it and the camera).
    const deck = patch.on || rowing.on || gunnery.on, at = sail.g.localToWorld(deck ? V3(-1.7, SLOOP_DECK + 0.35, 0.45) : V3(-1.15, SLOOP_DECK, 0)), yaw = sail.g.rotation.y;
    pirate.x = at.x; pirate.z = at.z;
    pirate.g.position.copy(at);
    pirate.g.rotation.set(0, Math.atan2(Math.cos(yaw), -Math.sin(yaw)), 0);
    animateWalk(pirate, false, dt);
    pirate.g.position.y = at.y;
    sail.stars ||= (() => { const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#ffe066' }); for (let i = 0; i < 3; i++) { const s = mesh(new THREE.OctahedronGeometry(0.12, 0), m, false); s.position.set(Math.cos(i * 2.1) * 0.4, 0, Math.sin(i * 2.1) * 0.4); g.add(s); } scene.add(g); return g; })();
    sail.stars.visible = h.dazed() && patchView < 0.5;   // (not in your face over the board)
    if (h.dazed()) { sail.stars.position.set(at.x, at.y + 2.15, at.z); sail.stars.rotation.y += dt * 4; }
  } else if (sail.stars) sail.stars.visible = false;
  // The pin, and the course to it dotted on the water.
  sail.pin ||= pinMesh();
  sail.pin.visible = sail.on && !!h.pin;
  if (h.pin) sail.pin.position.set(seaX(h.pin[0]), liftAt(...h.pin) + Math.sin(t * 1.3) * 0.08, seaZ(h.pin[1]));
  const sig = sail.on ? `${JSON.stringify(h.after())}${h.slot}${h.course().join('')}${h.mine.length}${h.oars}${sail.sea.breeze?.d}` : '';
  if (sig !== sail.sig) {
    sail.sig = sig;
    sail.dots.forEach((d) => { d.visible = false; });
    if (sail.on) {
      const pts = [];
      let q = h.cur ? (h.rides.length ? h.rides[h.rides.length - 1] : h.cur.to) : h.pose;
      if (h.slot >= 0) { pts.push([q, false]); for (let i = h.slot + 1; i < h.turn.length; i++) { q = sail.sea.sail(q, h.turn[i], h.oars).to; pts.push([q, false]); } }
      h.course().slice(0, 16).forEach((m, i) => { q = sail.sea.sail(q, m, h.oars).to; pts.push([q, i < h.mine.length]); });
      pts.forEach(([at, mine], i) => {
        const d = sail.dots[i] ||= (() => { const o = new THREE.Mesh(dotGeo, dotMat); o.renderOrder = 3; scene.add(o); return o; })();
        d.material = mine ? dotMine : dotMat;
        d.position.set(seaX(at.c), 0.09 + liftAt(at.c, at.r), seaZ(at.r));
        d.visible = true;
      });
    }
  }
  // The square you're pointing at, faintly.
  sail.hoverG ||= (() => { const o = new THREE.Mesh(new THREE.PlaneGeometry(SAIL.CELL * 0.96, SAIL.CELL * 0.96).rotateX(-Math.PI / 2), hoverMat); o.renderOrder = 3; scene.add(o); return o; })();
  sail.hoverG.visible = sail.on && !!sail.hover;
  if (sail.hover) sail.hoverG.position.set(seaX(sail.hover[0]), 0.08 + liftAt(...sail.hover), seaZ(sail.hover[1]));
  windTick(dt);
  craneTick(dt);   // (after she's drawn where the helm has her: up the cliff, the crane has her)
  kikkitTick(dt, events);   // (Kikkit, her whirlpools and the penguins: whirlpools.js)
  tzzTick(dt);   // (Tzz and her balloons: balloon-isle.js)
  empireTick(dt);   // (Port Decorum's guards: imperial-isle.js)
  smugglersTick();   // (the smugglers' beach, found: smugglers.js)
  raceTick(dt);   // (the race, its guns, its crane and the rival: race.js)
  if (sail.on) sailHud();
}
// The oars' button on the sailing bar (on mousedown: the bar's redrawn as the tokens change, so a
// click could be lost between press and release).
$('sailhud').addEventListener('mousedown', (e) => {
  if (e.button !== 0 || cine) return;   // (nothing but a cutscene's own keys in one: rowing came up over Tzz's lesson, 11 Nov)
  if (e.target.closest('#oars-btn')) { e.preventDefault(); rowToggle(); }
  else if (e.target.closest('#guns-btn')) { e.preventDefault(); gunneryToggle(haul.on || craneHolds()); }
  else if (e.target.closest('#rig-btn')) { e.preventDefault(); rigToggle(); }
});
