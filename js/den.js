/* Pirate Den: a 3D proof of concept. A stone wall with a gate guards the den; raiders on the
   far side hack at it and a cannon blasts fresh holes. The pirate fetches pieces from three
   piles (the toolbox), carries them over and mends the holes.
   Same rules as the main puzzle: twelve pentominoes at their real draw weights. A hole filled
   exactly is a Masterpiece, and strong. A piece may also be nailed over the stone around a hole
   ("boarded over"): that always closes it, but the patch is weak and pays less. */
// This file is start-up and the wiring: input, the main loop and its camera. The den's parts are
// in js/den/ (world.js holds what they all share).
import * as THREE from 'three';
import { W as BW, H as BH } from './bilge.js';
import { holeKey } from './den-carp-view.js';
import { countingDown } from './den-raids.js';
import { BILGE } from './den-bilge.js';
import { cleanLook, cleanDen } from './den-look.js';
import { C, S, SPEED, HP, BUILD_SECS, tune, k, $, myLook, denLook, renderer, scene, camera, skyDome, PILE_SC, rotCW, rotCCW, flip, animateWalk, faceTo, V3, pirate, HOP, STEP, view, carry, bounds, obstacles, G, keys, tweens, sparks, raiders, ghostKey, ghost, target, shake, mouseMode, mouse, topView, keyAt, wm, wmBlock, wmLinger, wallView, ray, wallPlane, toast, v3, L0, L1, L2, worldLets } from './den/world.js';
import { ramp, frames, frameAt, openJob, frameState, frameFits, putFramePiece, finishFrame, heightAt, onRampart, startHouse, houseState, plotLabel, atPlot, biomeTick, waveFlags, outside, throughGate, gateTick, towerLegs, selfSeen } from './den/land.js';
import { wall, X, Y, newWall, doorOf, fits, layerOpen, curLayer, patchFits, nextMat, nextLayer, barFrac, labelFor, frameLabel, updateStats, breakHole, dropPiece, dropBoard, holeX } from './den/wall.js';
import { GD, gd, gdCell, atGunDeck, gunOn, onGunDeck, gunSq, deckBlocks, loopsOf, gunTick, addStore, updateGunDeck, gunLabels, chalk, chalkAhead, turnArrowAhead, chalkRelease, wheelDeck, pointChalk, gundeckLets } from './den/gundeck.js';
import { piles, fair, neededLetters, fairPick, deal, showPile, takeCrate, toolbox, pickUp, putBack, turn, place, lastPlaced, canTakeBack, liftable, lift, takeBack, restockSecs, wallSpots, onFrame, frameHere, canWallMode, viewBoards, viewOk, enterView, viewOn, frameUp, boardsHud, viewKey, enterWall, wallWalk, aim, drawGhost, prompt } from './den/pieces.js';
import { boats, raiderOut, focus, onBeach, atWall, clickedFoe, cursor, aimed, aimFoe, throwAt, passable, weakSpot, widenCells, widen, spawnRaider, updateRaider, fireCannon, cannonSpot, showAim, startWave, updateWaves, banner, checkEnd, raidsLets } from './den/raids.js';
import { rack, barracks, sword, atSword, swordBreak, swordDrop, swordReward, swordEnter, swordKey, lumber, toLumber, repairAll, swordTick, swordReset } from './den/sword.js';
import { tide, shoreZ, bilge, atBilge, bilgeEnter, bilgeKey, bilgeHover, bilgeSwap, dredge, bilgeTick, bilgeReset } from './den/bilge.js';
import { MAP_D, MAP_W, chart, mapView, nearMap, openMap, mapKey, takeMap, mapTick, mapReset, mapLets } from './den/map.js';
import { cine, cineCam, cineView, cineEnd, cineTick, cineLets } from './den/cine.js';
import { dignityTick, dignityReset } from './den/dignity.js';
import { sail } from './den/sea.js';
import { landingTick } from './den/landing.js';
import { nearSloop, board, ashore, sailReset, sailClick, sailHover, sailKey, sailTick } from './den/sailing.js';
import { patch, deckHoleShape, patchTurn, patchPlace, patchKey } from './den/sea-puzzles.js';
import { hold, holdSwap } from './den/lock.js';
import { haul, haulKey, haulHover, haulSwap, haulTick, haulCam } from './den/treasure.js';
import { gunnery, gunCam, gunneryUp, gunneryRub, gunneryWheel } from './den/sea-guns.js';
import { rowing, rowCam, rowPull } from './den/rowing.js';
import { crane, craneCam } from './den/crane.js';
import { umami, umamiTick, umamiCam, umamiClick } from './den/capybara.js';
import { net, online, guest, isHost, send, updateMates, sendMe, snapshot, followRaider, sendSync, onNet, joinCrew, leaveCrew } from './den/crew.js';
import { deco, decoMode, decoMove, decoClick, decoTurn, dress, dressPanel, dressRows, lookChanged, applyDen, buildAll, tileFor, fillFrame, cheats, skipTo, cheatPanel, startAt } from './den/menus.js';

export function newGame() {
  if (guest()) return send('host', { t: 'again' });
  raiders.splice(0).forEach((r) => raiderOut(r, true)); boats.splice(0).forEach((b) => scene.remove(b.g));
  if (carry) { scene.remove(carry.group); worldLets.carry = null; }
  worldLets.ghostKey = ''; worldLets.ghost = null;
  sailReset(); sail.seen = false;
  Object.assign(G, { gold: 60, wave: 0, phase: 'build', phaseT: BUILD_SECS, toSpawn: 0, spawnT: 0, cannonT: 0, cannonShots: 0, aim: null, masters: 0, boarded: 0, bonked: 0, stolen: 0, turned: 0, waveTurned: 0, waveIn: 0, over: false, fairOver: false, map: 'none' });
  fair.reset();
  swordReset();
  bilgeReset();
  mapReset();
  dignityReset();
  piles.forEach((p) => { p.letter = null; });
  newWall();
  // After the wall, so the first deals finish its holes; and shown, since the wall drew the crates empty.
  piles.forEach((p) => { deal(p); showPile(p); });
  Object.assign(pirate, { x: 0, z: 8, h: 0 });
  $('end').classList.remove('on');
  $('intro').classList.remove('off');
  updateStats();
  if (isHost()) sendSync('all', true);
}

// ---------- input ----------
addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (dress.open) { if (e.key === 'Escape') dressPanel(false); return; }
  const key = e.key.toLowerCase();
  if (cheats.open) { if (key === 'escape' || key === '`') cheatPanel(false); return; }
  if (key === '`' && !deco.on && !paused) { cheatPanel(true); return; }
  if (paused) { if (['p', ' ', 'escape', 'enter'].includes(key)) { e.preventDefault(); setPaused(false); } return; }
  // The cutscene: Space or Esc skips it; nothing else.
  if (cine) { if ([' ', 'escape', 'enter'].includes(key)) { e.preventDefault(); if (!e.repeat) cineEnd(true); } return; }
  if (chart.on && !deco.on) { e.preventDefault(); mapKey(key); return; }
  // Treasure Haul: its own keys (P still pauses).
  if (haul.on) { e.preventDefault(); if (!haulKey(key, e) && key === 'p' && !e.repeat) setPaused(true); return; }
  // At sea: the helm's keys, and the view's.
  if (sail.on) { e.preventDefault(); if (patch.on && patchKey(key, e)) return; if (!e.repeat) sailKey(key); return; }
  if (key === 'p' && !deco.on) { setPaused(true); return; }
  if ([' ', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
  // At the sword rack, the keys play the Swordfight board, as in the real puzzle.
  if (sword.on && !deco.on && !G.over && swordKey(key, e)) return;
  if (bilge.on && !deco.on && !G.over && bilgeKey(key, e)) return;
  if (key === 'escape' && onGunDeck()) { gundeckLets.gunOn = false; return; }
  // In charge of the gun tower's guns, WASD and the arrows point your chalk; you stay put.
  const way = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] }[key];
  if (way && onGunDeck() && !carry && !deco.on) { if (!G.over) pointChalk(...way); return; }
  const arrow = { arrowleft: [0, -1], arrowright: [0, 1], arrowup: [-1, 0], arrowdown: [1, 0] }[key];
  // The Carpentry view: Puzzle Pirates' own Carpentry keys (src/den-carp-view.ts). Tab goes into it
  // from anywhere on the den floor.
  if (wm && !deco.on && !G.over) {
    if (viewKey(key, e)) return;
  } else if (key === 'tab' && !deco.on && !G.over && !e.repeat && !onGunDeck() && !outside() && !sword.on && !bilge.on) {
    enterView();
    return;
  } else if (arrow && !deco.on && !G.over && carry && pirate.h < 0.05 && !outside() && (frameHere() || canWallMode())) {
    const f = frameHere();
    if (f) viewOn(f); else enterWall();
    worldLets.mouseMode = false;
    return;
  }
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { keys.add(key); worldLets.mouseMode = false; }
  if (key === 'z' || key === 'c') keys.add(key);
  if (deco.on) {
    if (key === 'escape' || key === 'b') decoMode(false);
    else if (key === 'q' || key === 'e') decoTurn(key === 'e' ? 1 : -1);
    return;
  }
  if (e.repeat || G.over) return;
  if (key === ' ' || key === 'enter') act();
  else if (key === 'q' && carry) turn(rotCCW, 1);
  else if (key === 'e' && carry) turn(rotCW, -1);
  else if ((key === 'q' || key === 'e') && onGunDeck()) turnArrowAhead(key === 'e' ? 1 : 3);
  else if (key === 'f' && carry) turn(flip, 0);
  else if (key === 'b') decoMode(true);
  else if (key === 'm') openMap();
  else if (['1', '2', '3'].includes(key)) takeCrate(Number(key) - 1);
  else if (key === 'backspace' && canTakeBack()) takeBack();
  else if ((key === 'shift' || key === 'r') && carry && aimFoe()) throwAt(aimFoe());
  else if (key === 'v') Object.assign(view, { yaw: 0, pitch: 0, zoom: 1 });
  else if (key === '-' || key === '_') view.zoom = Math.min(2, view.zoom * 1.15);
  else if (key === '=' || key === '+') view.zoom = Math.max(0.55, view.zoom / 1.15);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
// The gun deck square under the pointer, if you're up there.
function deckCellAt(x, y) {
  if (!gd || pirate.h < 0.3) return null;
  ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -(ramp.T + 0.05)), p) ? gdCell(p.x, p.z) : null;
}
renderer.domElement.addEventListener('mousemove', (e) => {
  if (wm && keyAt) { if (Math.hypot(e.clientX - keyAt.x, e.clientY - keyAt.y) < 24) return; worldLets.keyAt = null; }
  if (deco.on) { decoMove(e); return; }
  if (haul.on) { haulHover(e.clientX, e.clientY); return; }
  if (sail.on) { sailHover(e.clientX, e.clientY); return; }
  if (bilge.on) { bilgeHover(e.clientX, e.clientY); return; }
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  const p = new THREE.Vector3();
  // A rampart frame you're pointing at (the nearest, if one's in front of another), else the wall.
  let best = null;
  if (pirate.h < 0.3 && (!wm || wm.f)) for (const f of wm?.f ? [wm.f] : frames()) {
    if (!ray.ray.intersectPlane(f.plane, p)) continue;
    const l = f.group.worldToLocal(p.clone()), fc = l.x / S, fr = -l.y / S, d = p.distanceTo(ray.ray.origin);
    if (fc < -1.2 || fc > f.b.w + 1.2 || fr < -1.2 || fr > f.b.h + 1.2) continue;
    if (!best || d < best.d) best = { d, frame: f, fc, fr };
  }
  if (best) { worldLets.mouse = best; worldLets.mouseMode = true; return; }
  if (wm?.f) { worldLets.mouse = null; return; }   // (in a frame's view, only the frame)
  if (gd) { gd.hover = deckCellAt(e.clientX, e.clientY); ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera); }
  if (!ray.ray.intersectPlane(wallPlane, p)) { worldLets.mouse = null; return; }
  const fc = p.x / S + wall.W / 2, fr = wall.H - p.y / S;
  worldLets.mouse = fc >= -1 && fc <= wall.W + 1 && fr >= -1 && fr <= wall.H + 1 ? { fc, fr, ray: ray.ray.clone(), at: new Map() } : null;
  if (mouse) worldLets.mouseMode = true;
});
addEventListener('mousemove', (e) => { raidsLets.cursor = { x: e.clientX, y: e.clientY }; });
document.addEventListener('mouseleave', () => { raidsLets.cursor = null; });
// Left click: throw at the raider you clicked on, otherwise pick up / fit. Right-drag turns the
// camera; a right click without dragging flips the piece.
let drag = null;
renderer.domElement.addEventListener('mousedown', (e) => {
  if (deco.on) { if (e.button === 2) drag = { x: e.clientX, y: e.clientY, moved: false, deco: e }; else decoClick(e); return; }
  if (e.button === 2) { drag = { x: e.clientX, y: e.clientY, moved: false }; return; }
  if (e.button !== 0 || G.over || cine) return;
  if (haul.on) { haulHover(e.clientX, e.clientY); haulSwap(); return; }
  if (sail.on) { sailClick(e.clientX, e.clientY); return; }
  if (chart.on) { chart.on = false; return; }
  if (bilge.on) { bilgeHover(e.clientX, e.clientY); bilgeSwap(); return; }
  // In the Carpentry view a click only ever fits the piece (or, empty-handed, lifts one out of a frame).
  if (wm) {
    if (carry && target?.ok) place(target);
    else if (carry) worldLets.shake = 0.2;
    else if (liftable()) lift(liftable());
    return;
  }
  // Up on the rampart there's nothing to fit, so a click anywhere throws at the raider nearest it.
  // In puzzle mode a click only ever fits the piece (raiders show through the holes, so it used to throw),
  // and so does one on a spot the piece fits: a raider outside showing through that hole waits for Shift.
  const r = carry && !wm && clickedFoe(e.clientX, e.clientY, pirate.h > 0.3 ? 1e4 : 90, pirate.h > 0.3 || !target?.ok);
  if (r) throwAt(r);
  else if (!carry && onGunDeck() && (gd.hover = deckCellAt(e.clientX, e.clientY))) gd.press = { r: gd.hover[0], c: gd.hover[1], x: e.clientX, y: e.clientY };
  else act();
});
addEventListener('mousemove', (e) => {
  if (!drag || !(e.buttons & 2)) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
  if (!drag.moved) return;
  view.yaw -= dx * 0.006;
  view.pitch = Math.max(-0.35, Math.min(0.9, view.pitch + dy * 0.004));
  drag.x = e.clientX; drag.y = e.clientY;
});
addEventListener('mouseup', (e) => {
  if (e.button === 0 && gd?.press) chalkRelease(e.clientX, e.clientY);
  if (e.button === 0 && gunnery.on) gunneryUp(e.clientX, e.clientY);
  if (e.button !== 2 || !drag) return;
  if (drag.deco) { if (!drag.moved) decoClick(drag.deco); drag = null; return; }
  if (!drag.moved && umami.on) umamiClick(e.clientX, e.clientY, 2);
  else if (!drag.moved && gunnery.on) gunneryRub(e.clientX, e.clientY);
  else if (!drag.moved && patch.on && patch.hand) patchTurn(flip);
  else if (!drag.moved && carry && !G.over) turn(flip, 0);
  else if (!drag.moved && !carry && onGunDeck() && (gd.hover = deckCellAt(e.clientX, e.clientY)) && gd.arrows.has(k(...gd.hover))) chalk(...gd.hover, -1);
  drag = null;
});
// The wheel turns the piece you're carrying, fit or no fit (the user, 9 Nov: "you should always be able to
// rotate a piece"), or your chalk on the gun deck; otherwise it zooms (- and = zoom too).
let wheelAcc = 0, wheelT = 0;
renderer.domElement.addEventListener('wheel', (e) => {
  if (deco.on) {
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) >= 40) { decoTurn(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; }
    return;
  }
  // At her guns, as on the tower: the wheel turns your chalk.
  if (gunnery.on) {
    wheelAcc += e.deltaY;
    const now = performance.now();
    if (Math.abs(wheelAcc) >= 40 && now - wheelT > 110) { gunneryWheel(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; wheelT = now; }
    return;
  }
  // On the gun deck the wheel turns your chalk, as in Gunnery, and never zooms.
  if (!carry && onGunDeck() && !G.over) {
    wheelAcc += e.deltaY;
    const now = performance.now();
    gd.hover = deckCellAt(e.clientX, e.clientY);
    if (Math.abs(wheelAcc) >= 40 && now - wheelT > 110) { wheelDeck(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; wheelT = now; }
    return;
  }
  if (patch.on && patch.hand) {
    wheelAcc += e.deltaY;
    const now = performance.now();
    if (Math.abs(wheelAcc) >= 40 && now - wheelT > 110) { patchTurn(wheelAcc > 0 ? rotCW : rotCCW); wheelAcc = 0; wheelT = now; }
    return;
  }
  if (carry && !G.over) {
    wheelAcc += e.deltaY;
    const now = performance.now();
    if (Math.abs(wheelAcc) >= 40 && now - wheelT > 110) {
      if (wheelAcc > 0) turn(rotCW, -1); else turn(rotCCW, 1);
      wheelAcc = 0; wheelT = now;
    }
    return;
  }
  wheelAcc = 0;
  view.zoom = Math.max(0.55, Math.min(2, view.zoom * (e.deltaY > 0 ? 1.1 : 1 / 1.1)));
}, { passive: true });
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
$('again').onclick = () => newGame();
function act() {
  if (net.pending || net.asking || cine) return;   // waiting to hear back about the last one (or watching)
  if (nearMap()) return takeMap();
  if (nearSloop()) return board();
  if (!carry && atSword() && rack.pieces) return swordEnter();
  if (!carry && atBilge()) return bilgeEnter();
  const f = focus();
  if (pirate.h > 0.3) {
    if (carry && onRampart() && aimFoe()) throwAt(aimFoe());
    else if (!carry && onGunDeck()) chalkAhead();
    else if (!carry && atGunDeck()) { gundeckLets.gunOn = true; keys.clear(); }
    return;
  }
  if (f.kind === 'pile') {
    const p = f.p;
    if (!carry && p.letter) return pickUp(p);
    if (carry && carry.from === p && !p.letter) return putBack();
    if (carry && p.letter && carry.from) { putBack(); return pickUp(p); }
  } else if (!carry && liftable()) return lift(liftable());
  else if (!carry && canTakeBack()) return takeBack();
  else if (!carry && atPlot() && houseState() === 'plot') return startHouse();
  else if (!carry && atPlot() && houseState() === 'built') return dressPanel(true, 'den', 'house');
  else if (carry && target?.ok) return place(target);
  else if (carry && target) worldLets.shake = 0.2;
}

// ---------- main loop ----------
const camAt = new THREE.Vector3(0, 7.4, 14.2), camLook = new THREE.Vector3(0, 1.8, 3.6);
camera.position.copy(camAt);
export let deckView = 0, beachView = 0, viewCam = null;
export let swordView = 0, bilgeView = 0;
export let sailView = 0, holdView = 0, haulView = 0, forageView = 0;

// Other parts of the den assign to these lets through this, as an imported binding can't be assigned.
export const denLets = {
  get sailView() { return sailView; }, set sailView(v) { sailView = v; },
};
export let patchView = 0, rowView = 0, gunView = 0;
let craneView = 0, craneShot = null;
/* The Carpentry view's camera: straight on to the board, close enough to puzzle in. On the wall, a
   stretch of it round the piece, its whole height; on a frame on the floor, looking down on it from
   the side its rows run from; on the stairs, square on to their face. */
// How far the wall's Carpentry view stands back from the wall: the whole wall, all four holes, if
// it'll fit (it's two courses now: about 17 m); else a stretch. (Zooming out doesn't shrink it.)
function wallViewDist() {
  const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
  const W2 = wall.W * S / 2, H2 = wall.H * S / 2, win = W2 <= 10 ? W2 : 7.5;
  return { dist: Math.max((H2 + 0.9) / Math.tan(vh), (win + 0.9) / Math.tan(hh)) * Math.min(1, view.zoom) + 1, win, W2, H2 };
}
function puzzleCam() {
  const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
  const fit = (w, h, m) => Math.max((h / 2 + m) / Math.tan(vh), (w / 2 + m) / Math.tan(hh));
  if (!wm.f) {
    const { dist, win, W2, H2 } = wallViewDist();
    const b = carry ? C.bbox(carry.cells) : { w: 0 };
    const cx = Math.max(-W2 + win, Math.min(W2 - win, X(wm.c) + b.w * S / 2));
    return { look: V3(cx, H2, 0.3), dist, tilt: 0.2, yaw: 0 };
  }
  const f = wm.f, mid = frameAt(f, f.b.c0 + f.b.w / 2, f.b.r0 + f.b.h / 2), w = f.b.w * S, h = f.b.h * S * Math.abs(f.group.scale.y);
  if (f.kind === 'stair') return { look: mid, dist: fit(w, h, 0.9) * view.zoom, tilt: 0.14, yaw: Math.atan2(Math.sign(-mid.x) || 1, 0) };
  const up = frameUp(f);
  return { look: mid, dist: fit(w, h, 0.8) * view.zoom, tilt: 1.3, yaw: Math.atan2(-up.x, -up.z) };
}
/* Each tick runs the game on in small steps. Alone, a pause (another tab) stops the clock. In a
   crew it doesn't: the den goes on for everyone, so when the browser stops drawing a tab in the
   background, a timer keeps it ticking (as often as the browser lets it) and catches up. */
let lastT = performance.now();
/* Pause (the button, or P): everything stops, raiders, timers and stores alike. Only on your own:
   with a crew the raiders don't wait for anyone. It also pauses when you switch away from the tab. */
let paused = false;
export function setPaused(on) {
  if (on && (online() || G.over)) { if (online()) toast('No pausing with a crew: the raiders don\'t wait for anyone', true); return; }
  paused = on;
  keys.clear();
  $('paused').classList.toggle('on', on);
  $('pause-btn').textContent = on ? 'Carry on' : 'Pause';
}
$('pause-btn').onclick = (e) => { e.currentTarget.blur(); setPaused(!paused); };
$('resume').onclick = () => setPaused(false);
document.addEventListener('visibilitychange', () => { if (document.hidden && !online() && !G.over) setPaused(true); });
function tick() {
  const now = performance.now();
  if (paused && online()) setPaused(false);
  if (paused || cheats.open) { lastT = now; return; }
  let left = Math.min(online() ? 1.5 : 0.05, (now - lastT) / 1000);
  lastT = now;
  while (left > 1e-4) { const d = Math.min(0.05, left); update(d); left -= d; }
  if (!online()) return;
  if (now - net.meAt > 80) { net.meAt = now; sendMe(); }
  if (net.host && now - net.snapAt > 100) { net.snapAt = now; snapshot(); }
}
function frame() {
  tick();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
setInterval(() => { if (online() && performance.now() - lastT > 250) tick(); }, 200);
function update(dt) {
  // Walk.
  let mx = 0, mz = 0;
  if (!G.over) {
    if (keys.has('a') || keys.has('arrowleft')) mx--;
    if (keys.has('d') || keys.has('arrowright')) mx++;
    if (keys.has('w') || keys.has('arrowup')) mz--;
    if (keys.has('s') || keys.has('arrowdown')) mz++;
  }
  // Puzzle mode at the wall: in when you come up to it with a piece, out on leaving it.
  if (wmBlock && (wmBlock.c !== carry || Math.hypot(pirate.x - wmBlock.x, pirate.z - wmBlock.z) > 3)) worldLets.wmBlock = null;
  // Fitting the piece is the end of it (the view stays a moment, for the next piece).
  worldLets.wmLinger = mx || mz || !canWallMode() ? 0 : Math.max(0, wmLinger - dt);
  // A frame finished while you were on it: on to the next thing being built.
  if (wm?.f && !frames().includes(wm.f)) { const nb = viewBoards()[0]; if (nb) viewOn(nb); else worldLets.wm = null; }
  if (wm && !viewOk()) worldLets.wm = null;
  else if (!wm && carry && !wmBlock && !mx && !mz && pirate.h < 0.05 && !deco.on && !G.over && !outside()) {
    // (Only the wall: on a frame, Tab or the arrows open its view. The user, 9 Nov: "you should have
    // to actively interact with something. Maybe the front wall could be a bit of an exception".)
    if (!frameHere() && canWallMode() && wallSpots().length) enterWall();
  }
  const auto = wm && !mx && !mz ? wallWalk() : null;
  const moving = pirate.moving = !!(mx || mz || auto);
  // Turn the view.
  if (keys.has('z')) view.yaw += dt * 1.4;
  if (keys.has('c')) view.yaw -= dt * 1.4;
  if (moving) {
    // Walk the way the camera faces (or, at the wall, to stand under the piece).
    const n = Math.hypot(mx, mz) || 1, cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
    const wx = auto ? auto.wx : (mx * cy + mz * sy) / n, wz = auto ? auto.wz : (-mx * sy + mz * cy) / n;
    const ox = pirate.x, oz = pirate.z, sp = SPEED * (auto ? auto.slow : 1);
    let nx = pirate.x + wx * sp * dt, nz = pirate.z + wz * sp * dt;
    for (const o of pirate.z < 0 ? obstacles.concat(towerLegs()) : obstacles) {
      if (o.low && pirate.h > 1) continue;
      const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz), min = o.r + 0.3;
      if (d < min && d > 0) { nx = o.x + dx / d * min; nz = o.z + dz / d * min; }
    }
    nx = Math.max(-bounds.x, Math.min(bounds.x, nx));
    nz = Math.max(pirate.h > 1 ? (gd ? gd.z0 + 0.2 : -0.3) : shoreZ() + 0.4, Math.min(bounds.z1, nz));
    if (pirate.h <= 1) [nx, nz] = throughGate(ox, oz, nx, nz);
    // Up and down the stairs, but no walking into their side or off the edge of the rampart.
    const pad = pirate.h < 0.05 ? 0.28 : 0;
    // A step of one square you walk up; two, you hop up (stairs built with bits sticking out).
    const stuck = deckBlocks(ox, oz);   // (a gun run out right by you: you can always step clear)
    const okAt = (x, z) => Math.abs(heightAt(x, z, pad, pirate.h) - pirate.h) <= HOP && (pirate.h < ramp.T - 0.3 || stuck || !deckBlocks(x, z));
    if (!okAt(nx, nz)) { if (okAt(nx, oz)) nz = oz; else if (okAt(ox, nz)) nx = ox; else { nx = ox; nz = oz; } }
    pirate.x = nx; pirate.z = nz;
    const was = pirate.h;
    pirate.h = heightAt(nx, nz, 0, pirate.h);
    if (pirate.h - was > STEP) pirate.hop = { t: 0, a: pirate.hs, b: pirate.h };
    faceTo(pirate, wx, wz, dt * 1.2);
  }
  animateWalk(pirate, moving, dt);
  if (pirate.hop) {
    const hp = pirate.hop, u = Math.min(1, (hp.t += dt / 0.3));
    pirate.hs = hp.a + (hp.b - hp.a) * u + Math.sin(Math.PI * u) * 0.35;
    if (u >= 1) pirate.hop = null;
  } else pirate.hs += (pirate.h - pirate.hs) * Math.min(1, dt * 16);
  pirate.g.position.y += pirate.hs;
  pirate.g.position.x = pirate.x;
  pirate.g.position.z = pirate.z;
  if (carry) {
    const up = -2.75 * (carry.lift ?? 1);
    pirate.arms.forEach((a, i) => { a.rotation.x = up; a.rotation.z = i ? 0.25 : -0.25; });
  } else pirate.arms.forEach((a) => { a.rotation.z = 0; });
  if (pirate.bonkT > 0) { pirate.bonkT -= dt; pirate.arms[1].rotation.x = -2.6 + (0.3 - pirate.bonkT) * 9; }

  // The carried piece: held overhead, facing the wall's way so you can see how it'll go in.
  if (carry) {
    const g = carry.group, l = carry.lift ?? 1;
    g.visible = !wm;
    v3.set(pirate.x, 2.15 + pirate.g.position.y, pirate.z + 0.05);
    if (l < 1) { g.position.lerp(v3, Math.min(1, l * 1.6 + 0.2)); g.rotation.x = -Math.PI / 2 * (1 - l); g.scale.setScalar(PILE_SC + (0.55 - PILE_SC) * l); }
    else { g.position.copy(v3); g.rotation.x = 0; g.scale.setScalar(0.55); }
    if (carry.spin) { carry.spin *= Math.max(0, 1 - dt * 14); if (Math.abs(carry.spin) < 0.01) carry.spin = 0; }
    if (carry.flipT !== undefined && carry.flipT < 1) carry.flipT = Math.min(1, carry.flipT + dt * 6);
    g.rotation.z = carry.spin || 0;
    g.rotation.y = carry.flipT < 1 ? Math.PI * (1 - carry.flipT) : 0;
    // Half see-through while aiming, so it doesn't hide the hole you're fitting it into (its edge stays solid).
    carry.mat.opacity += ((target ? 0.5 : 1) - carry.mat.opacity) * Math.min(1, dt * 10);
    carry.mat.depthWrite = carry.mat.opacity > 0.9;
  }

  if (gunOn && !atGunDeck()) gundeckLets.gunOn = false;
  if (!G.over) updateGunDeck(dt);
  swordTick(dt);
  bilgeTick(dt);
  if (guest()) {
    // The host runs the raiders; here they just follow what it says.
    if (countingDown(G.phase) && !G.over) G.phaseT = Math.max(0, G.phaseT - dt);
    raiders.forEach((r) => followRaider(r, dt));
  } else if (!G.over) {
    updateWaves(dt);
    for (let i = raiders.length - 1; i >= 0; i--) {
      const r = raiders[i];
      if (r.state === 'down' && !r.swordDropped) { r.swordDropped = true; swordDrop(r); }
      updateRaider(r, dt);
      if (r.gone) { raiderOut(r); raiders.splice(i, 1); }
    }
    checkEnd();
  }
  aim();
  drawGhost();
  prompt();
  boardsHud(dt);
  banner();

  // Tweens and sparks.
  for (let i = tweens.length - 1; i >= 0; i--) {
    const t = tweens[i];
    t.t += dt;
    const s = Math.min(1, t.t / t.dur);
    t.step(s);
    if (s >= 1) { tweens.splice(i, 1); t.done?.(); }
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.userData.v.y -= 7 * dt;
    s.position.addScaledVector(s.userData.v, dt);
    s.rotation.x += dt * 6; s.rotation.y += dt * 4;
    s.userData.life -= dt;
    s.scale.setScalar(Math.max(0, s.userData.life));
    if (s.userData.life <= 0) { scene.remove(s); sparks.splice(i, 1); }
  }

  mapTick(dt);
  cineTick(dt);   // (a cutscene playing: js/den/cine.js)
  sailTick(dt);
  dignityTick(dt, sail.on ? sail.helm.pose : null);   // (the checkpoint's commander, on its gate)
  haulTick(dt);
  umamiTick(dt);   // (Umami the capybara: his bank in the lagoon, his board, his life at the den)

  /* Camera follows the pirate, looking at the wall and a little over it. Up on the rampart it
     swings up high to look down over the wall at the raiders. The player can turn it (Z/C or
     right-drag) all the way round, to see the outside of the wall, and tilt it (right-drag). It
     follows you right to the back of the den, where your house is. */
  const cz = pirate.z, u = ramp ? Math.min(1, pirate.h / ramp.T) : 0;
  worldLets.topView = u > 0.7;
  L0.set(pirate.x * 0.55, 1.8, cz - 3.4);
  L1.set(pirate.x, 0.5, -2.6);
  const look = L0.lerp(L1, u);
  let dist = (12 + (17 - 12) * u) * view.zoom;
  let tilt = Math.max(0.2, Math.min(1.45, 0.486 + (1.4 - 0.486) * u + view.pitch));
  beachView += ((outside() ? 1 : 0) - beachView) * Math.min(1, dt * 2.5);
  tilt += (Math.max(0.2, Math.min(1.45, 0.95 + view.pitch)) - tilt) * beachView;
  deckView += ((onGunDeck() ? 1 : 0) - deckView) * Math.min(1, dt * 2.5);
  if (gd && deckView > 0.001) {
    L2.set(gd.x0 + GD.cols * S / 2, ramp.T, gd.z0 + GD.rows * S * 0.5);
    look.lerp(L2, deckView);
    // Close enough that the tower fills the screen, with the wall either side of it in view.
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
    dist += (Math.max((GD.cols * S / 2 + 2.2) / Math.tan(hh), (GD.rows * S / 2 + 1.2) / Math.tan(vh)) * view.zoom - dist) * deckView;
    tilt += (Math.max(0.6, Math.min(1.45, 1.1 + view.pitch)) - tilt) * deckView;
  }
  // Puzzle mode at the wall: straight on to the whole wall, every hole in view at once.
  worldLets.wallView += ((wm || wmLinger > 0 ? 1 : 0) - wallView) * Math.min(1, dt * 3);
  let yaw = view.yaw;
  if (wm) viewCam = puzzleCam();
  if (wallView > 0.001 && viewCam) {
    look.lerp(viewCam.look, wallView);
    dist += (viewCam.dist - dist) * wallView;
    tilt += (viewCam.tilt - tilt) * wallView;
    const y0 = Math.atan2(Math.sin(view.yaw), Math.cos(view.yaw));
    let d = viewCam.yaw - y0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw = y0 + d * wallView;
  }
  // At the sword rack: straight on to the board, close enough to play it.
  swordView += ((sword.on ? 1 : 0) - swordView) * Math.min(1, dt * 3);
  if (swordView > 0.001) {
    const vh = camera.fov * Math.PI / 360;
    const tall = sword.top + 0.3;   // the whole hoist, floor to beam
    L2.set(sword.x, tall / 2, sword.z - 0.25);
    look.lerp(L2, swordView);
    dist += (tall / (1.7 * Math.tan(vh)) - dist) * swordView;
    tilt += (0.08 - tilt) * swordView;
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));   // turned to face the stack
    yaw = y0 + (Math.PI / 2 - y0) * swordView;
  }
  bilgeView += ((bilge.on ? 1 : 0) - bilgeView) * Math.min(1, dt * 3);
  if (bilgeView > 0.001) {
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
    // (looking a little seaward of the middle, so the water rows sit clear of the key help at the bottom)
    L2.set(bilge.x0 + BW * BILGE.SQ / 2, 0, BILGE.Z0 - BH * BILGE.SQ / 2 - 1.3);
    look.lerp(L2, bilgeView);
    dist += (Math.max((BH * BILGE.SQ / 2 + 2.2) / Math.tan(vh), (BW * BILGE.SQ / 2 + 1.5) / Math.tan(hh)) * view.zoom - dist) * bilgeView;
    tilt += (1.3 - tilt) * bilgeView;
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    yaw = y0 + ((y0 >= 0 ? Math.PI : -Math.PI) - y0) * bilgeView;
  }
  // Reading the map: looking down on it from over your shoulder.
  mapLets.mapView += ((chart.on ? 1 : 0) - mapView) * Math.min(1, dt * 3);
  if (mapView > 0.001 && chart.g) {
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
    L2.set(chart.g.position.x, 0, chart.g.position.z);
    look.lerp(L2, mapView);
    dist += (Math.max((MAP_D / 2 + 0.1) / Math.tan(vh), (MAP_W / 2 + 0.1) / Math.tan(hh)) * view.zoom - dist) * mapView;
    tilt += (1.3 - tilt) * mapView;
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    let d = chart.yaw - y0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw = y0 + d * mapView;
  }
  // At sea: following her from behind and above, out over the water (turn and zoom as ever).
  sailView += ((sail.on ? 1 : 0) - sailView) * Math.min(1, dt * 2);
  if (sailView > 0.001 && sail.g) {
    L2.set(sail.g.position.x, Math.max(0.6, sail.g.position.y - 1), sail.g.position.z - 2);   // (up in the clifftop lagoon, looking at her there)
    look.lerp(L2, sailView);
    dist += (26 * view.zoom - dist) * sailView;
    tilt += (Math.max(0.3, Math.min(1.45, 0.78 + view.pitch)) - tilt) * sailView;
  }
  // Bilging at a lock: down onto the board on its quay from the den side, drawn back to take in
  // the lock beside it and the pump, so you see her rise as you pump (js/den/lock.js).
  holdView += ((hold.mode ? 1 : 0) - holdView) * Math.min(1, dt * 3);
  if (holdView > 0.001 && hold.group?.parent) {
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect), sq = hold.group.scale.x;
    hold.group.getWorldPosition(L2);
    L2.lerp(V3(hold.at.x, L2.y, hold.at.z), 0.12);
    look.lerp(L2, holdView);
    dist += (Math.max((BH * sq / 2 + 0.5 * sq * 4) / Math.tan(vh), (BW * sq / 2 + sq * 2) / Math.tan(hh)) * 1.75 * view.zoom - dist) * holdView;
    tilt += (1.2 - tilt) * holdView;
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    yaw = y0 + (Math.atan2(Math.sin(-y0), Math.cos(-y0))) * holdView;
  }
  // Patching her deck: looking almost straight down onto the hole from over her stern, its top row
  // toward her bow, its squares as big on screen as the wall's are in its Carpentry view (the user,
  // 9 Nov: it was "a bit tiny, and it's making my head hurt"; zooming out at sea doesn't shrink it),
  // and sitting just above the tray along the bottom ("your eyes really have to go down to the
  // bottom of the screen to see it").
  patchView += ((patch.on ? 1 : 0) - patchView) * Math.min(1, dt * 3);
  if (patchView > 0.001 && patch.group?.parent && patch.hole) {
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect), sq = patch.sq, b = patch.hole.board;
    const far = Math.min(wallViewDist().dist * sq / S, Math.max((b.h * sq / 2 + 0.3) / Math.tan(vh), (b.w * sq / 2 + 0.3) / Math.tan(hh)) * 1.6);
    // The board's middle, and the dock's top (the prompt and tray): the board's stern edge goes just
    // above it, the view slid toward her bow to bring it down there.
    patch.face.updateMatrixWorld(true);
    const mid = patch.face.localToWorld(V3((b.c0 + b.w / 2) * S, -(b.r0 + b.h / 2) * S, 0));
    if (!(patch.dockT > 0) || (patch.dockAt = (patch.dockAt ?? 0) - dt) < 0) { patch.dockAt = 0.5; patch.dockT = $('dock').getBoundingClientRect().top; }
    const halfM = far * Math.tan(vh), yb = -1 + 2 * (innerHeight - patch.dockT + 14) / innerHeight;
    const yc = Math.min(0, yb + (b.h * sq / 2) / halfM);
    // (up the board: toward her bow on her deck; toward the cliff on the crane's ledge)
    const bow = V3(0, 1, 0).transformDirection(patch.face.matrixWorld).setY(0).normalize();
    L2.copy(mid).addScaledVector(bow, -yc * halfM);
    look.lerp(L2, patchView);
    dist += (far - dist) * patchView;
    tilt += (1.45 - tilt) * patchView;
    const want = Math.atan2(-bow.x, -bow.z);
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    let d = want - y0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw = y0 + d * patchView;
  }
  // Rowing: from over her stern down along the board on her deck, the sea ahead beyond it, turned
  // with her as she turns (js/den/rowing.js).
  rowView += ((rowing.on ? 1 : 0) - rowView) * Math.min(1, dt * 3);
  if (rowView > 0.001 && rowing.group?.parent) {
    const rc = rowCam();
    look.lerp(rc.look, rowView);
    dist += (rc.dist * view.zoom - dist) * rowView;
    tilt += (rc.tilt - tilt) * rowView;
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    let d = rc.yaw - y0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw = y0 + d * rowView;
  }
  // At her guns: down onto the Gunnery board on her deck from over her stern, turned with her
  // (js/den/sea-guns.js).
  gunView += ((gunnery.on ? 1 : 0) - gunView) * Math.min(1, dt * 3);
  if (gunView > 0.001 && gunnery.group?.parent) {
    const gc = gunCam();
    look.lerp(gc.look, gunView);
    dist += (gc.dist * view.zoom - dist) * gunView;
    tilt += (gc.tilt - tilt) * gunView;
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    let d = gc.yaw - y0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw = y0 + d * gunView;
  }
  // Treasure Haul: down onto the board from beyond it, looking back toward whoever's hauling.
  haulView += ((haul.on ? 1 : 0) - haulView) * Math.min(1, dt * 3);
  if (haulView > 0.001 && haul.group?.parent) {
    const hc = haulCam();
    look.lerp(hc.look, haulView);
    dist += (hc.dist * view.zoom - dist) * haulView;
    tilt += (hc.tilt - tilt) * haulView;
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    let d = hc.yaw - y0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw = y0 + d * haulView;
  }
  // Freeing Umami: straight on to his bank and its board (js/den/capybara.js).
  const uc = umamiCam();
  forageView += ((uc ? 1 : 0) - forageView) * Math.min(1, dt * 3);
  if (forageView > 0.001 && uc) {
    look.lerp(uc.look, forageView);
    dist += (uc.dist - dist) * forageView;
    tilt += (uc.tilt - tilt) * forageView;
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    let d = uc.yaw - y0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw = y0 + d * forageView;
  }
  // The crane: watching a part of it go up, or her hauled up the cliff and down (js/den/crane.js).
  const kc = craneCam();
  if (kc) craneShot = kc;
  craneView += ((kc ? 1 : 0) - craneView) * Math.min(1, dt * 2.5);
  if (craneView > 0.001 && craneShot) {
    look.lerp(craneShot.look, craneView);
    dist += (craneShot.dist - dist) * craneView;
    tilt += (craneShot.tilt - tilt) * craneView;
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    let d = craneShot.yaw - y0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw = y0 + d * craneView;
  }
  // The cutscene's own shots.
  if (cine) cineLets.cineCam = cine.cam;
  cineLets.cineView += ((cine ? 1 : 0) - cineView) * Math.min(1, dt * 2.5);
  if (cineView > 0.001 && cineCam) {
    look.lerp(cineCam.look, cineView);
    dist += (cineCam.dist - dist) * cineView;
    tilt += (cineCam.tilt - tilt) * cineView;
    const y0 = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    let d = cineCam.yaw - y0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw = y0 + d * cineView;
  }
  v3.set(Math.sin(yaw) * Math.cos(tilt), Math.sin(tilt), Math.cos(yaw) * Math.cos(tilt)).multiplyScalar(dist).add(look);
  camAt.lerp(v3, Math.min(1, dt * (3 + 9 * Math.max(rowView, gunView))));   // (held close while rowing or at her guns: she can fly along)
  camera.position.copy(camAt);
  // The fog starts beyond what you're looking at, so a high or zoomed-out view doesn't go murky.
  const camD = camAt.distanceTo(camLook);
  scene.fog.near = camD + 10; scene.fog.far = camD + 45;
  skyDome.position.copy(camera.position);
  // Looking down from the wall you see more of the floor the torches don't reach: brighten it up.
  renderer.toneMappingExposure = 1 + 0.45 * u;
  if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake * 0.5; camera.position.y += (Math.random() - 0.5) * shake * 0.5; worldLets.shake = Math.max(0, shake - dt); }
  camLook.lerp(look, Math.min(1, dt * (3 + 9 * Math.max(rowView, gunView))));
  camera.lookAt(camLook);
  updateMates(dt);
  waveFlags(dt);
  biomeTick(dt);
  landingTick();
  gateTick(dt);
  selfSeen();
  showAim();

  // A marker over every raider inside the den, pinned to the screen edge when they're out of view; and,
  // with a piece in hand, over the ones at the wall outside you could lob it at.
  raidsLets.aimed = carry ? aimFoe() : null;
  renderer.domElement.style.cursor = carry && cursor && clickedFoe(cursor.x, cursor.y, pirate.h > 0.3 ? 1e4 : 90, pirate.h > 0.3 || !target?.ok) ? 'crosshair' : '';
  for (const r of raiders) {
    const show = r === aimed || (r.state !== 'down' && (r.inside || (carry && !wm && (outside() ? onBeach(r) : atWall(r))) || (topView && !r.gone && ['approach', 'ladder', 'attack', 'dazed'].includes(r.state) && r.z > -6)));
    r.mark.classList.toggle('aim', r === aimed);
    r.mark.style.display = show ? '' : 'none';
    if (!show) continue;
    v3.set(r.x, 1.9, r.z).project(camera);
    let sx = (v3.x + 1) / 2 * innerWidth, sy = (1 - v3.y) / 2 * innerHeight;
    const off = v3.z > 1 || sx < 0 || sx > innerWidth || sy < 0 || sy > innerHeight;
    sx = Math.min(innerWidth - 28, Math.max(28, sx));
    sy = Math.min(innerHeight - 90, Math.max(70, sy));
    r.mark.style.left = `${sx}px`;
    r.mark.style.top = `${sy}px`;
    r.mark.classList.toggle('off', off);
    r.mark.classList.toggle('loot', !!r.loot);
  }

  // Hole labels float above each hole, with a strength bar for mended ones.
  nextMat.opacity = 0.22 + 0.2 * Math.sin(performance.now() / 260);
  for (const h of wall.holes) {
    h.attackers = raiders.filter((r) => r.hole === h && ['approach', 'ladder', 'attack', 'hackOut', 'dazed'].includes(r.state)).length;
    const [cls, body] = labelFor(h);
    // In the Carpentry view, the key that sends the piece here (Puzzle Pirates' Q/W/A/S).
    const g = wall.gateCols, hk = wm && !wm.f ? holeKey([h.b.r0 + h.b.h / 2, h.b.c0 + h.b.w / 2], [wall.H / 2, (g.c0 + g.c1 + 1) / 2]) : '';
    const html = hk ? `<kbd class="hk">${hk}</kbd>${body}` : body;
    nextLayer(h);
    if (h.sig !== cls + html) { h.sig = cls + html; h.label.className = cls; h.label.innerHTML = html; }
    const bar = h.label.querySelector('.bar:not(.lay) b');
    if (bar) bar.style.width = `${Math.max(0, barFrac(h)) * 100}%`;
    h.label.querySelectorAll('.bar.lay b').forEach((b, j) => { const L = h.lay[j]; b.style.width = `${L ? Math.max(0, L.hp / L.maxHp) * 100 : 0}%`; });
    // From up on the wall, labels sit on the den side so they don't hide the raiders.
    if (topView) v3.set(holeX(h), 0, 2.2).project(camera); else v3.set(holeX(h), Y(h.b.r0) + 0.15, 0.1).project(camera);
    h.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    h.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    h.label.style.display = deckView > 0.5 || swordView > 0.5 ? 'none' : '';   // out of the way while you're gunning or swordfighting
    // A patch under attack shudders.
    if (h.jig > 0) {
      h.jig = Math.max(0, h.jig - dt);
      h.pieces.forEach((p) => { p.group.position.x = p.base.x + (Math.random() - 0.5) * h.jig * 0.4; });
      if (!h.jig) h.pieces.forEach((p) => { p.group.position.x = p.base.x; });
    }
  }
  // A crate restocking after a throw shows how long it's got to go.
  for (const p of piles) {
    if (p.wait > 0) p.wait = Math.max(0, p.wait - dt);
    const show = !p.letter && p.wait > 0.3 && carry?.from !== p;
    p.label.style.display = show ? '' : 'none';
    if (!show) continue;
    p.label.firstChild.textContent = `Restocking · ${Math.ceil(p.wait)}s`;
    p.label.querySelector('.bar b').style.width = `${Math.min(1, 1 - p.wait / (p.waitFull || restockSecs())) * 100}%`;
    v3.set(p.x, 1.2, p.z).project(camera);
    p.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    p.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    if (v3.z > 1) p.label.style.display = 'none';
  }
  toolbox();
  gunLabels();
  plotLabel();
  for (const f of frames()) {
    const [cls, html] = frameLabel(f);
    if (f.sig !== cls + html) { f.sig = cls + html; f.label.className = cls; f.label.innerHTML = html; }
    v3.copy(f.mid).project(camera);
    f.label.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
    f.label.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
    f.label.style.display = v3.z > 1 || swordView > 0.5 ? 'none' : '';
  }
}

newGame();
// ?try=all (or ?try=gundeck): everything built, and you start up on the gun tower.
if (['all', 'gundeck'].includes(new URLSearchParams(location.search).get('try'))) {
  buildAll();
  Object.assign(pirate, { x: gd.x0 + GD.cols * S / 2, z: gd.z0 + (GD.rows - 0.5) * S, h: ramp.T });
  gundeckLets.gunOn = true;
  $('intro').classList.add('off');
}
// ?at=dignity (or any starting point the cheats offer: menus.js): straight there, so a scene can be
// shared by its link.
requestAnimationFrame(frame);
const startHere = new URLSearchParams(location.search).get('at');
if (startHere && !online() && !startAt(startHere)) toast(`No starting point called "${startHere}"`, true);

// For poking at it from the console.
window.den = { rowing, rowPull, tune, HP, skipTo, cheatPanel, fillFrame, tileFor, widenCells, widen, dropPiece, dropBoard, curLayer, layerOpen, breakHole, onFrame, cannonSpot, get wm() { return wm; }, newWall, doorOf, passable, weakSpot, decoMode, get deco() { return deco; }, get denLook() { return denLook; }, get gd() { return gd; }, get myLook() { return myLook; }, setLook(l) { worldLets.myLook = cleanLook(l); lookChanged(); }, setDen(d) { applyDen(cleanDen(d), true); }, startHouse, dressPanel, get dressTab() { return dress.tab; }, set dressTab(t) { dress.tab = t; dressRows(); }, buildAll, chalk, gunTick, loopsOf, addStore, gunSq, camera, net, onNet, sendSync, joinCrew, leaveCrew, openJob, finishFrame, frameFits, frames, putFramePiece, frameState, takeBack, canTakeBack, get lastPlaced() { return lastPlaced; }, get aimed() { return aimed; }, clickedFoe, get wall() { return wall; }, pirate, piles, neededLetters, fairPick, sword, rack, barracks, swordDrop, swordReward, swordBreak, lumber, toLumber, repairAll, newGame, raiders, G, get carry() { return carry; }, get patch() { return patch; }, get target() { return target; }, act, startWave, fireCannon, spawnRaider, fits, patchFits, place, pickUp, showPile, view, get ramp() { return ramp; }, heightAt, throwAt,
  bilge, tide, bilgeEnter, bilgeSwap, dredge, sail, hold, holdSwap, board, ashore, patch, patchKey, patchPlace, deckHoleShape, haul, haulSwap, crane, gunnery, umami,
  // Run the game forward by hand (for testing while the tab is in the background).
  step(secs) { for (let t = 0; t < secs; t += 1 / 30) update(1 / 30); renderer.render(scene, camera); } };
