// Helium's island, out past the checkpoint by the smugglers' rocks (src/den-helium.ts; its squares
// LAY.HELIUM in src/den-sail.ts), and Distilling at her still. Only the place's own look and its one
// mechanic are here: the island, a palm, her lesson as a little cutscene the first time you come up off it,
// then the still yours to play, "Help, Helium" while you do, and the still's bang when a white burns.
// Who's on it is config (src/den-helium.ts, HELIUM_CAST: her look, where she, her still and her board go;
// her lesson's beats worked out on a real board, lessonPlan; her lines src/lines/helium.ts), placed through
// the shared pieces: props-people.js's person(), furniture.js's still and Distilling's own board
// (distill-board.js, the one look of the puzzle, src/distilling.ts its rules). Her help reads your board
// with the bots' planner (src/distill-bots.ts, advise, through src/den-helium.ts's askHelium) and plays
// its drags with the board's own hand (swapAt, hold, letGo), as distilling-test.html's bots do.
// Touches the rest only through a few hooks: sailing.js builds, ticks and asks it (keys, the mouse, Space,
// the prompt), den.js's camera (heliumCam, with Umami's) and mouse-up, sea.js's voices, and a starting
// point (menus.js).
import * as THREE from 'three';
import {
  HELIUM_CAST, HELIUM, HELIUM_STANDS, HELIUM_MOOR, HELIUM_ARRIVE, Visit, lessonGame, lessonPlan, lessonSecs, bangs, mishapLine, askHelium,
  onHeliumLanding, inHeliumEarshot, heliumShore, opening,
} from '../den-helium.js';
import { Distilling } from '../distilling.js';
import { PRAISE } from '../lines/helium.js';
import { readSecs } from '../den-dignity.js';
import { PACE } from '../chatter.js';
import { PIRATES } from '../den-look.js';
import { scene, camera, mat, mesh, woodTex, V3, burst, keys, pirate } from './world.js';
import { sail, seaX, seaZ, voices } from './sea.js';
import { station } from './sail-station.js';
import { outline, slab } from './isle.js';
import { palm } from './wedding-scene.js';
import { person } from './props-people.js';
import { FURNITURE } from './furniture.js';
import { distillBoard } from './distill-board.js';
import { cine, cinePlay, cineEnd, bubble, bubbleAt } from './cine.js';

/* Her ground: a sand slab's top, as on Tzz's island, so she stands on it. */
const SAND = { y0: -0.4, h: 0.62 }, GROUND = SAND.y0 + SAND.h + 0.25;
/* `on`: at the still, playing; `board`: Distilling's board on its stand (the lesson's, then yours); `hand`:
   her drags being played on it (lesson or help), a swap at a time; `note`: what the bar says, a while. */
export const helium = { W: null, visit: new Visit(), play: null, on: false, board: null, hand: [], handT: 0, handDone: null, bangs: 0, note: '', noteT: 0, shake: 0, cower: 0 };

function build() {
  const g = new THREE.Group(), sand = mat('#e6cf96', { roughness: 1 }), wet = mat('#c9ad78', { roughness: 1 });
  const shore = heliumShore(), C = HELIUM_CAST;
  g.add(slab(outline(0.5, shore), -0.55, 0.45, wet), slab(outline(1.1, shore), SAND.y0, SAND.h, sand));
  const p = palm(3.6, 0.3);
  p.scale.setScalar(0.75);
  p.position.set(seaX(C.palm[0]), 0.2, seaZ(C.palm[1]));
  p.rotation.y = 0.8;
  g.add(p);
  const M = C.her, ship = () => (sail.on ? sail.helm.pose : null);
  const her = person({
    look: PIRATES[M.look], parent: g, x: seaX(M.at[0]), y: GROUND, z: seaZ(M.at[1]), yaw: M.yaw, scale: M.scale, idle: M.idle,
    script: M.says, secs: readSecs, gap: M.gap, wait: 2,
    bubble: 'page', shown: () => sail.on,
    earshot: () => { if (helium.on || helium.play) return true; const s = ship(); return !!s && inHeliumEarshot(s.c, s.r) && voices.hears('helium', s.c, s.r); },
    face: () => { const s = ship(); return s && inHeliumEarshot(s.c, s.r) ? { x: seaX(s.c), z: seaZ(s.r) } : null; },
  });
  const props = C.props.map((o) => {
    const piece = FURNITURE[o.kind]();
    piece.g.position.set(seaX(o.at[0]), GROUND, seaZ(o.at[1]));
    piece.g.rotation.y = o.yaw;
    g.add(piece.g);
    return piece;
  });
  // Her board's stand: a wooden back and two legs, its face toward the water off her island's left.
  const B = C.board, bx = seaX(B.at[0]), bz = seaZ(B.at[1]);
  const yaw = Math.atan2(seaX(C.facing[0]) - bx, seaZ(C.facing[1]) - bz), tall = B.size * 600 / 450;
  const stand = new THREE.Group(), wood = mat('#6a4428', { map: woodTex });
  stand.position.set(bx, GROUND, bz); stand.rotation.y = yaw;
  const back = mesh(new THREE.BoxGeometry(B.size + 0.12, tall + 0.12, 0.08), wood);
  back.position.set(0, B.lift + tall / 2, -0.07);
  stand.add(back);
  for (const s of [-1, 1]) {
    const leg = mesh(new THREE.BoxGeometry(0.1, B.lift + tall * 0.4, 0.1), wood);
    leg.position.set(s * B.size * 0.38, (B.lift + tall * 0.4) / 2, -0.12);
    const prop = mesh(new THREE.BoxGeometry(0.08, tall * 0.9, 0.08), wood);
    prop.position.set(s * B.size * 0.3, tall * 0.42, -0.55); prop.rotation.x = -0.3;
    stand.add(leg, prop);
  }
  g.add(stand);
  const boardAt = V3(bx, GROUND + B.lift + tall / 2, bz);
  voices.add('helium', { c: HELIUM_STANDS.c, r: HELIUM_STANDS.r, earshot: HELIUM.EARSHOT });
  scene.add(g);
  return { g, her, props, still: props[0], boardAt, yaw, size: B.size };
}

/** Built the first time the sea's drawn (sailing.js), seen from afar too; her board up on its stand, the
    lesson's deal waiting on it. */
export function heliumWorld() {
  if (helium.W) return;
  helium.W = build();
  newBoard(lessonGame(), false);
  helium.board.paused = true;
}

// ---------- the board on her stand ----------
function newBoard(game, yours) {
  const W = helium.W;
  if (helium.board) helium.board.dispose();
  helium.hand = []; helium.handDone = null;
  helium.board = distillBoard({
    game, at: W.boardAt, yaw: W.yaw, size: W.size,
    onColumn: (c, finished) => {
      if (bangs(c)) bang(yours);
      else if (yours && c.message === 'clear' && c.chain >= 2 && Math.random() < 0.35) say(PRAISE.clear[c.chain % PRAISE.clear.length]);
      if (yours && finished) say(PRAISE.finished);
    },
  });
  scene.add(helium.board.group);
}
/** The still goes bang: soot and sparks out of its head, it shakes, she flinches; and, at your board, her
    line for it (in her lesson, the next beat says it). */
function bang(yours) {
  const S = helium.W.still.g, at = S.getWorldPosition(V3(0, 0, 0)).add(V3(0, 1.6, 0));
  burst(at, '#2b2622', 26, 4);
  burst(at, '#ff9a3a', 14, 5);
  burst(at, '#c4743a', 10, 6);   // (bits of copper)
  helium.shake = 0.7;
  helium.cower = 1.1;
  helium.W.her.setIdle('cower');
  if (yours) say(mishapLine(helium.bangs++));
  else helium.bangs++;
}
/** Says one thing now, over whatever she was saying, then back to her chatter in a while. */
function say(text) {
  const her = helium.W.her;
  her.setScript({ intro: [text], loop: HELIUM_CAST.her.says.loop }, { secs: (t) => (t === text ? lessonSecs(t) : readSecs(t)), wait: 0, gap: PACE.ASIDE });
}
/** What the bar at the foot says a while: a lesson beat's note, or her help's technique and reason. */
const noteFor = (text, secs = 9) => { helium.note = text; helium.noteT = secs; };

/** Drags played as a hand would (a bot's, distilling-test.html's): the piece held and swept along, a swap
    as it passes each place, a breath between drags; `done` once they're played. */
function play(drags, done) {
  helium.hand = drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] }));
  helium.handT = 0.35;
  helium.handDone = done;
  if (helium.hand[0]) helium.board.hold(helium.hand[0].x, helium.hand[0].y);
}
function handTick(dt) {
  const B = helium.board;
  if (!helium.hand.length || !B) return;
  helium.handT -= dt;
  if (helium.handT > 0 || !B.game.movable) return;
  const d = helium.hand[0], to = d.ways.length ? B.swapAt(d.x, d.y, d.ways.shift()) : null;
  if (to) { d.x = to[0]; d.y = to[1]; B.hold(...to); }
  helium.handT = 0.2;   // (a swap's slide, quick as her hand)
  if (to && d.ways.length) return;
  // That drag's done (or it couldn't go on): let go, a breath, and the next one picked up.
  helium.hand.shift();
  B.letGo();
  helium.handT = 0.5;
  if (helium.hand[0]) B.hold(helium.hand[0].x, helium.hand[0].y);
  else { const done = helium.handDone; helium.handDone = null; done?.(); }
}

// ---------- her lesson: a little cutscene ----------
/* Beat by beat (src/den-helium.ts, lessonPlan): her line in her bubble, the note in the bar, then after a
   moment what she does on the board (a drag, played swap by swap; a burn). Each beat holds till its line's
   read and the board's still. Space or Esc skips it (cine.js); either way, the still's yours after.
   First, her opening (src/den-helium.ts, opening): the still goes bang as you come up, and she shrugs it
   off; your own lines in it (`who: 'you'`) over your head on the sloop, kept on the screen. It's only ever
   seen once: her lesson plays the first time you come up off her island, never again. */
function lessonPlay() {
  const W = helium.W;
  sail.helm.moor(HELIUM_MOOR);
  sail.riding = false;
  helium.on = false;
  newBoard(lessonGame(), false);
  const B = helium.board, beats = [...opening(), ...lessonPlan(B.game.cols)];
  const her = W.her.p.g.getWorldPosition(V3(0, 0, 0)).add(V3(0, 1.9, 0)), at = W.boardAt.clone();
  const look = her.lerp(at, 0.6), dist = W.size * 2.7;
  let i = -1, t = 0, need = 0, acted = true;
  W.her.lookAt = { x: look.x + Math.sin(W.yaw) * dist, z: look.z + Math.cos(W.yaw) * dist };   // (to the camera, her audience)
  const c = {
    cam: { look, dist, tilt: 0.12, yaw: W.yaw },
    tick(dt) {
      t += dt;
      // (not till the camera's flown out to her island: the bang's the first thing to see)
      if (i < 0 && t < 12 && camera.position.distanceTo(look) > dist * 1.6) return;
      const b = beats[i];
      if (b && !acted && t >= 1.1) {
        acted = true;
        if (b.act.kind === 'drag') play([b.act], null);
        else if (b.act.kind === 'burn') B.burn();
      }
      if (i >= 0 && (t < need || !acted || helium.hand.length || B.busy())) return;
      i++;
      if (i >= beats.length) { cineEnd(false); return; }
      const n = beats[i];
      if (n.who === 'you') { you.text(n.says, lessonSecs(n.says)); W.her.hush(); }
      else if (n.says) say(n.says);
      if (n.act.kind === 'bang') bang(false);
      noteFor(n.note, 99);
      t = 0; need = lessonSecs(n.says); acted = n.act.kind === 'none';
    },
    end() { helium.play = null; helium.hand = []; W.her.lookAt = null; atStill(true); },
  };
  helium.play = c;
  cinePlay(c);
}
/* Your own line over your head on the sloop, a few seconds, kept on the screen (you may be just out of the
   shot). */
const you = {
  el: null, t: 0, at: V3(0, 0, 0),
  text(t, secs) { you.el ||= bubble('', document.body, 'wrap'); you.el.textContent = t; you.t = secs; },
  tick(dt) {
    if (!you.el) return;
    if ((you.t -= dt) <= 0 || !sail.on) { you.el.style.display = 'none'; return; }
    pirate.g.getWorldPosition(you.at);
    bubbleAt(you.el, true, you.at.x, you.at.y + 2.3, you.at.z);
    const x = parseFloat(you.el.style.left), y = parseFloat(you.el.style.top);
    you.el.style.display = '';
    you.el.style.left = `${Math.max(160, Math.min(innerWidth - 160, Number.isFinite(x) ? x : innerWidth - 160))}px`;
    you.el.style.top = `${Math.max(110, Math.min(innerHeight - 140, Number.isFinite(y) ? y : innerHeight / 2))}px`;
  },
};
/* What the keys do, in the cutscene's bar at the foot of the screen (den.html's, "Space: skip" as a rule). */
const bar = (text) => { const el = document.querySelector('.cine-bar.bot'); if (el && el.textContent !== text) el.textContent = text; };
const free = () => sail.on && !cine && !sail.helm.cur?.via && !sail.helm.gusts?.length && !sail.helm.rides?.length;

// ---------- the still, yours ----------
/** At the still, a board of your own: a fresh deal if there's none yet (or the last's finished). */
function atStill(fresh = false) {
  if (fresh || !helium.board || helium.board.game.finished || helium.board.game.timer === false) newBoard(new Distilling(Math.random), true);
  helium.board.paused = false;
  helium.on = true;
  keys.clear();
  helpButton(true);
  hud(false);
  noteFor(fresh ? helium.note : '', fresh ? 10 : 0);   // (after her lesson, its last note a while)
}
function leave() {
  helium.on = false;
  helium.hand = [];
  if (helium.board) { helium.board.paused = true; helium.board.letGo(); }
  helpButton(false);
  hud(true);
}
/* The sailing bar's tokens and keys put away while you're at the still (they'd cover the board). */
const hud = (on) => { const el = document.getElementById('sailhud'); if (el) el.style.visibility = on ? '' : 'hidden'; };
/** Holding the sloop: at the still (no pins, no Sailing board). */
export const heliumHolds = () => helium.on;

/** "Help, Helium": she reads your board, says what she'd do and why, and does it (src/den-helium.ts). */
export function heliumHelp() {
  const B = helium.board;
  if (!helium.on || !B || helium.hand.length || B.game.finished) return;
  const h = askHelium(B.game);
  say(h.says);
  noteFor(h.note);
  if (h.plays === 'drags') {
    B.letGo();
    B.paused = true;   // (the furnace waits while she shows you)
    play(h.advice.drags, () => { B.paused = false; });
  } else if (h.plays === 'burn') B.burn();
}
let btn = null;
function helpButton(on) {
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'helium-help';
    btn.textContent = 'Help, Helium (H)';
    btn.style.cssText = 'position:fixed;right:16px;bottom:64px;z-index:20;font:700 15px "Alegreya Sans",system-ui,sans-serif;color:#f6ead2;background:#3a2410;border:1px solid #c8a050;border-radius:8px;padding:6px 12px;cursor:pointer;display:none';
    btn.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); heliumHelp(); });
    document.body.append(btn);
  }
  btn.style.display = on ? '' : 'none';
}

// ---------- hooks: keys, the mouse, Space, the prompt ----------
/* The den hands keys over lower-cased; the board wants their own names (its arrows, Home, End...). */
const KEYS = { arrowleft: 'ArrowLeft', arrowright: 'ArrowRight', arrowup: 'ArrowUp', arrowdown: 'ArrowDown', home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown' };
const VIEW = ['z', 'c', 'v', '-', '_', '=', '+', 'p'];
/** A key at sea (sailing.js): the board's while you're at the still; Space off her island to it. */
export function heliumKey(key) {
  if (!helium.on) return false;
  if (key === 'escape') { leave(); return true; }
  if (key === 'h') { heliumHelp(); return true; }
  if (helium.hand.length) return !VIEW.includes(key);
  if (helium.board?.key(KEYS[key] ?? key, { repeat: false })) return true;
  return !VIEW.includes(key);
}
/** Space off her island: her lesson the first time (it begins as you come up), then to the still. True if it was for her. */
export function heliumHail() {
  const p = sail.helm.pose;
  if (!helium.W || helium.on || !helium.visit.again(onHeliumLanding(p.c, p.r), free())) return false;
  sail.helm.moor(HELIUM_MOOR);
  atStill();
  return true;
}
const ndc = (x, y) => [x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1];
/** The mouse on her board while you're at the still (sailing.js's hover and click; den.js's mouse-up). */
export function heliumHover(x, y) { if (helium.on && !helium.hand.length) helium.board?.pointer(...ndc(x, y), camera); return helium.on; }
export function heliumDown(x, y, button = 0) {
  if (!helium.on) return false;
  if (!helium.hand.length && helium.board?.pointer(...ndc(x, y), camera)) helium.board.press(button);
  return true;
}
export function heliumUp(button = 0) { if (helium.on) helium.board?.release(button); }
/** The camera while you're at the still: straight on to the board (den.js, with Umami's). */
export function heliumCam() {
  if (!helium.on || !helium.board) return null;
  // (pulled back and the board a little low, clear of the den's panel at the top left)
  const v = helium.board.camView(camera), d = v.from.clone().sub(v.look).normalize();
  return { look: v.look.clone().add(V3(0, 0.3, 0)), dist: v.dist * 1.35, tilt: Math.asin(d.y), yaw: Math.atan2(d.x, d.z) };
}
export function heliumPrompt() {
  if (!sail.on || !helium.W) return '';
  if (helium.on) {
    const B = helium.board, lead = helium.noteT > 0 && helium.note ? helium.note : B.game.finished ? 'Finished! Esc, then Space for another batch' : B.prompt();
    return `${lead} · H: Help, Helium · Esc: leave the still`;
  }
  const p = sail.helm.pose;
  if (!onHeliumLanding(p.c, p.r) || !helium.visit.seen || helium.play) return '';
  return `Off ${HELIUM.NAME} · Space: Distilling at her still`;
}

/** Each tick at sea (sailing.js). */
export function heliumTick(dt) {
  const W = helium.W;
  if (!W) return;
  if (sail.on) {
    const p = sail.helm.pose;
    // The first time you come up beside her island, anywhere round it, settled and not at the Sailing
    // board: her lesson.
    if (helium.visit.arrive(onHeliumLanding(p.c, p.r), free() && sail.helm.slot < 0 && !station.on)) lessonPlay();
  }
  if (helium.play) bar(`${helium.note} · Space: skip`);
  handTick(dt);
  you.tick(dt);
  helium.board?.tick(dt);
  helium.noteT = Math.max(0, helium.noteT - dt);
  // The bang: the still shakes, she flinches, then she's back at it.
  if (helium.shake > 0) {
    helium.shake -= dt;
    const S = W.still.g, k = Math.max(0, helium.shake) * 0.08;
    S.rotation.z = (Math.random() - 0.5) * k; S.rotation.x = (Math.random() - 0.5) * k;
    if (helium.shake <= 0) S.rotation.set(0, S.rotation.y, 0);
  }
  if (helium.cower > 0 && (helium.cower -= dt) <= 0) W.her.setIdle(HELIUM_CAST.her.idle);
  W.her.tick(dt);
  for (const o of W.props) o.tick?.(dt);
}

/** A fresh voyage: her lesson not seen yet, the still left, the lesson's deal back on her board. */
export function heliumReset() {
  helium.visit = new Visit();
  if (helium.play && cine === helium.play) cineEnd(true);
  leave();
  if (helium.W) { newBoard(lessonGame(), false); helium.board.paused = true; }
}

/** A starting point (menus.js): at sea, come up beside her island, so her lesson begins. */
export function heliumCheat() {
  sail.helm.moor(HELIUM_ARRIVE);
  sail.riding = false;
}
