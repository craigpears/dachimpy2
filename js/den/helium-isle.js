// Helium's island, out past the checkpoint by the smugglers' rocks (src/den-helium.ts; its squares
// LAY.HELIUM in src/den-sail.ts), and Distilling at their still. Only the place's own look and its one
// mechanic are here: the island, a palm, their lesson as a little cutscene the first time you come up off it,
// then the still yours to play, a batch at a time with a goal (at least your best plus one Crystal Clear) and their
// plan for it shown on your board step by step (the junk to burn shaded, the Crystal Clear's column gold, the
// planner's next drags as arrows), the batch done once it's met and the chain ends, then the same goal again or a
// bigger one; the flask filling a twelfth a Crystal Clear; "Help, Helium" while you do (their line kept where you can read it), hints
// (the planner's next drags as arrows on your board, and the routes into a white's place by the fire),
// watching them play your board (each phase and each move said before it's played), and
// their distillery answering each column: it blows up when a white burns, and runs rum when whites go up.
// Who's on it is config (src/den-helium.ts, HELIUM_CAST: their look, where they, their still and their board go;
// their lesson's beats worked out on a real board, lessonPlan; their lines src/lines/helium.ts), placed through
// the shared pieces: props-people.js's person(), distillery.js and Distilling's own board
// (distill-board.js, the one look of the puzzle, src/distilling.ts its rules). Their help reads your board
// with the bots' planner (src/distill-bots.ts, advise, through src/den-helium.ts's askHelium) and plays
// its drags with the board's own hand (swapAt, hold, letGo), as distilling-test.html's bots do.
// Touches the rest only through a few hooks: sailing.js builds, ticks and asks it (keys, the mouse, Space,
// the prompt), den.js's camera (heliumCam, with Umami's) and mouse-up, sea.js's voices, and a starting
// point (menus.js).
import * as THREE from 'three';
import {
  HELIUM_CAST, HELIUM, HELIUM_STANDS, HELIUM_MOOR, HELIUM_ARRIVE, Visit, lessonGame, lessonBeats, lessonSecs, mishapLine, askHelium,
  onHeliumLanding, inHeliumEarshot, heliumShore, worksFor, praiseFor, Cellar, OPENING_BANG, lineSpot, PACE_LESSON,
  actAfter, holdSecs, ringed, Nerves, NERVE, whitesInFurnace, onScreen, hintFor, hintLeft, routesToFire, Watch, PACE_WATCH,
  BEST_STORE, cleanBestChain, beatBest, SEEN_STORE,
  goalFor, biggerGoal, goalLines, fillIn, Batch, planFor, planTarget, PlanLines, crystalClears, flaskLevel, FLASK_STEPS,
  TeachLines, SPOT_AFTER, RUM,
} from '../den-helium.js';
import { LAY } from '../den-sail.js';
import { Distilling, WHITE } from '../distilling.js';
import { FIRE, GOAL, HINT, SPOT, WATCH } from '../lines/helium.js';
import { readSecs } from '../den-dignity.js';
import { PACE } from '../chatter.js';
import { PIRATES } from '../den-look.js';
import { scene, camera, mat, mesh, woodTex, V3, keys, pirate } from './world.js';
import { sail, seaX, seaZ, voices } from './sea.js';
import { station } from './sail-station.js';
import { outline, slab } from './isle.js';
import { palm } from './wedding-scene.js';
import { person } from './props-people.js';
import { FURNITURE } from './furniture.js';
import { distillery } from './distillery.js';
import { distillBoard } from './distill-board.js';
import { cine, cinePlay, cineEnd, bubble, bubbleAt } from './cine.js';

/* Their ground: a sand slab's top, as on Tzz's island, so they stand on it. */
const SAND = { y0: -0.4, h: 0.62 }, GROUND = SAND.y0 + SAND.h + 0.25;
/* `on`: at the still, playing; `board`: Distilling's board on its stand (the lesson's, then yours); `hand`:
   their drags being played on it (lesson or help), a swap at a time; `note`: what the bar says, a while. */
/* Your best Crystal Clear here, kept in this browser (src/den-helium.ts, beatBest). */
const readBest = () => { try { return cleanBestChain(localStorage.getItem(BEST_STORE)); } catch { return 0; } };
const keepBest = (n) => { try { localStorage.setItem(BEST_STORE, String(n)); } catch { /* (no storage: kept this voyage only) */ } };
/* Their lesson seen this visit to the page only: a refresh plays it again (the user, 13 Nov: "if I refresh the
   browser there, it should. I don't want it to be stored in local storage"). Any old mark of it cleared. */
try { localStorage.removeItem(SEEN_STORE); } catch { /* (no storage) */ }
const readSeen = () => false;
const keepSeen = () => {};
export const helium = { W: null, visit: new Visit(readSeen()), play: null, on: false, board: null, hand: [], handT: 0, handDone: null, bangs: 0, bigBang: 0, note: '', noteT: 0, cower: 0, shrug: 0, nervy: 0, nerves: new Nerves(), fretCol: null, held: true, fireTips: 0, cellar: new Cellar(), hint: null, routes: null, watch: null, best: readBest(),
  // Your goal at the still and the batch going for it, their plan for it on your board (its board's key, a moment's
  // wait after a change before it's worked out again), and the batches done this visit (src/den-helium.ts, Batch, planFor).
  goal: 0, batch: null, plan: null, planKey: '', planWait: 0, planLines: null, batches: 0, fretMark: null,
  // The move their plan shows: its trick's lines said once a batch (src/den-helium.ts, TeachLines), the trick shown last
  // (kept while it does well), and how long it's been up (the other places it works ringed after SPOT_AFTER).
  teachLines: null, lastTrick: null, spotT: 0 };

function build() {
  const g = new THREE.Group(), sand = mat('#e6cf96', { roughness: 1 }), wet = mat('#c9ad78', { roughness: 1 });
  const shore = heliumShore(), C = HELIUM_CAST;
  g.add(slab(outline(0.5, shore), -0.55, 0.45, wet), slab(outline(1.1, shore), SAND.y0, SAND.h, sand));
  const p = palm(3.6, 0.3);
  p.scale.setScalar(0.75);
  p.position.set(seaX(C.palm[0]), 0.2, seaZ(C.palm[1]));
  p.rotation.y = 0.8;
  g.add(p);
  const M = C.them, ship = () => (sail.on ? sail.helm.pose : null);
  const them = person({
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
  // Their distillery, its front turned the way their board faces (to the water off the island's left).
  const D = distillery(), dx = seaX(C.distillery.at[0]), dz = seaZ(C.distillery.at[1]);
  D.g.position.set(dx, GROUND, dz);
  D.g.rotation.y = Math.atan2(seaX(C.facing[0]) - dx, seaZ(C.facing[1]) - dz);
  // (what flies off it lands on their sand, or sinks in the sea)
  D.ground = (x, z) => (H_LAND.some(([c, r]) => Math.abs(x - seaX(c)) < 2.3 && Math.abs(z - seaZ(r)) < 2.3) ? GROUND : -1);
  g.add(D.g);
  // Their board's stand: a wooden back and two legs, its face toward the water off their island's left.
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
  return { g, them, props, distillery: D, boardAt, yaw, size: B.size, tall };
}
const H_LAND = LAY.HELIUM.LAND;

/** Built the first time the sea's drawn (sailing.js), seen from afar too; their board up on its stand, the
    lesson's deal waiting on it. */
export function heliumWorld() {
  if (helium.W) return;
  helium.W = build();
  newBoard(lessonGame(), false);
  helium.board.paused = true;
}

// ---------- the board on their stand ----------
function newBoard(game, yours) {
  const W = helium.W;
  if (helium.board) helium.board.dispose();  helium.hand = []; helium.handDone = null;
  helium.board = distillBoard({
    game, at: W.boardAt, yaw: W.yaw, size: W.size,
    // The flask fills a step for each Crystal Clear, a twelfth (the user, 13 Nov: "the jar thing at the top should
    // fill up each time you do a crystal clear ... one nth"; src/den-helium.ts, flaskLevel).
    flask: (gm) => flaskLevel(crystalClears(gm.columns)), flaskSteps: FLASK_STEPS,
    // Each column gone, their distillery answers (src/den-helium.ts, worksFor): a white burned, it blows up
    // as the white goes into the furnace (the opening's bigger: bigBang); whites sent up, rum runs off into
    // the cask, and full casks go on the pile.
    onFurnace: (c) => {
      const w = worksFor(c);
      if (w.kind === 'bang') { bang(yours, Math.max(w.size, helium.bigBang)); helium.bigBang = 0; }
    },
    onColumn: (c, finished) => {
      const w = worksFor(c), lines = [];
      if (w.kind === 'rum') {
        W.distillery.pour(helium.cellar.pour(w.measures));
        // Your best beaten (not while they're playing it for you): remembered, and said instead of their praise.
        const beat = yours && !helium.watch && c.up ? beatBest(c.chain, helium.best) : null;
        if (beat) { helium.best = beat.best; keepBest(beat.best); }
        const line = beat ? beat.says : yours && praiseFor(c.chain, Math.random());
        if (line) lines.push(line);
      }
      // Your goal: met as the chain reaches it ("more if you can"), the batch done once the chain's ended after it.
      const r = yours && helium.batch ? helium.batch.column(c, finished) : null;
      if (r === 'met') { lines.push(fillIn(GOAL.met, c.chain)); noteFor(GOAL.metNote, 8); }
      if (r === 'done') { batchDone(lines, finished); return; }
      if (lines.length) say(...lines);
    },
  });
  scene.add(helium.board.group);
}
/** Their distillery blows up (distillery.js: the flash, the fireball, smoke, bits flying, the still's head
    off and back on); they flinch, then shrug it off; and, at your board, their line for it (in their lesson,
    the next beat says it). */
function bang(yours, size = 1) {
  helium.W.distillery.bang(size);
  helium.cower = 1.1;
  helium.shrug = 0;
  helium.W.them.setIdle('cower');
  if (yours) say(mishapLine(helium.bangs++));
  else helium.bangs++;
}
/** Says one thing now (or a few in turn), over whatever they were saying, then back to their chatter in a while. */
function say(...texts) {
  const them = helium.W.them;
  them.setScript({ intro: texts, loop: HELIUM_CAST.them.says.loop }, { secs: (t) => (texts.includes(t) ? lessonSecs(t) : readSecs(t)), wait: 0, gap: PACE.ASIDE });
}
/** What the bar at the foot says a while: a lesson beat's note, or their help's technique and reason. */
const noteFor = (text, secs = 9) => { helium.note = text; helium.noteT = secs; };

/** Drags played as a hand would (a bot's, distilling-test.html's): the piece held and swept along, a swap
    as it passes each place, a breath between drags; `done` once they're played. `pace`: how long it holds a
    piece before the first swap, each swap, and the breath between drags (their help's quick hand, or the
    lesson's slower one, src/den-helium.ts's PACE_LESSON). */
const HELP_HAND = { HOLD: 0.35, SWAP: 0.25, BETWEEN: 0.5 };
function play(drags, done, pace = HELP_HAND) {
  helium.hand = drags.map((d) => ({ x: d.x, y: d.y, ways: [...d.ways] }));
  helium.handPace = pace;
  helium.handT = pace.HOLD;
  helium.handDone = done;
  if (helium.hand[0]) helium.board.hold(helium.hand[0].x, helium.hand[0].y);
}
function handTick(dt) {
  const B = helium.board, P = helium.handPace ?? HELP_HAND;
  if (!helium.hand.length || !B) return;
  helium.handT -= dt;
  if (helium.handT > 0 || !B.game.movable) return;
  const d = helium.hand[0], to = d.ways.length ? B.swapAt(d.x, d.y, d.ways.shift()) : null;
  if (to) { d.x = to[0]; d.y = to[1]; B.hold(...to); }
  helium.handT = P.SWAP;   // (a swap's slide, at their hand's pace)
  if (to && d.ways.length) return;
  // That drag's done (or it couldn't go on): let go, a breath, and the next one picked up.
  helium.hand.shift();
  B.letGo();
  helium.handT = P.BETWEEN;
  if (helium.hand[0]) B.hold(helium.hand[0].x, helium.hand[0].y);
  else { const done = helium.handDone; helium.handDone = null; done?.(); }
}

// ---------- their lesson: a little cutscene ----------
/* Beat by beat (src/den-helium.ts, lessonPlan): their line in their bubble, the note in the bar, then once
   you've had a moment with the line what they do on the board (a drag, played swap by swap; a burn). Each
   beat holds till its line's read and the board's still, then a breath; its pace is src/den-helium.ts's
   PACE_LESSON (the user, 13 Nov: it went by "like half a second"). Space, Enter or a click goes on once
   you've read the line; Esc skips the lot (cine.js); either way, the still's yours after. From the mishap on
   it's step one (STEPS), said in the bar; a beat's `marks` ring the whites it's about on the board.
   First, their opening (src/den-helium.ts, opening), the camera wider to take in their board and their
   distillery: the furnace takes its column, then the next, a white in it ringed, and as the white goes into
   the furnace the still goes bang; they shrug it off; your own lines in it (`who: 'you'`) over your head on
   the sloop, kept on the screen. It's only ever seen once: their lesson plays the first time you come up
   off their island, never again till the page is loaded afresh. */
function lessonPlay() {
  const W = helium.W, P = PACE_LESSON;
  sail.helm.moor(HELIUM_MOOR);
  sail.riding = false;
  helium.on = false;
  newBoard(lessonGame(), false);
  const B = helium.board, beats = lessonBeats(), lesson = beats.findIndex((b) => b.step);
  const them = W.them.p.g.getWorldPosition(V3(0, 0, 0)).add(V3(0, 1.9, 0)), at = W.boardAt.clone();
  const look = them.lerp(at, 0.6), dist = W.size * 2.7;
  // (the opening's shot, wider: their board and the still in its yard both in it, the still a little to the
  // side behind; then in on the board for the lesson, boardView)
  const still = W.distillery.g.getWorldPosition(V3(0, 0, 0)).add(V3(0, 1.8, 0));
  const wide = { look: at.clone().lerp(still, 0.45), dist: Math.max(dist * 1.25, at.distanceTo(still) * 2.1), tilt: 0.16, yaw: W.yaw + 0.22 };
  let i = -1, t = 0, need = 0, acted = true, gap = 0, on = false, burned = false, zoom = false;
  W.them.lookAt = { x: look.x + Math.sin(W.yaw) * dist, z: look.z + Math.cos(W.yaw) * dist };   // (to the camera, their audience)
  const goOn = () => { if (i >= 0 && t >= P.READ_FIRST) on = true; };
  const click = (e) => { if (e.button === 0) goOn(); };
  addEventListener('pointerdown', click);
  const c = {
    cam: wide,
    started: performance.now(),
    /** Space or Enter: on to the next line, once this one's been up a moment (Esc still skips: cine.js). */
    key(k) { if (k === ' ' || k === 'enter') { goOn(); return true; } return false; },
    tick(dt) {
      t += dt;
      if (zoom) c.cam = boardView();
      // (not till the camera's flown out to their island: the bang's the first thing to see)
      if (i < 0 && t < 12 && camera.position.distanceTo(c.cam.look) > c.cam.dist * 1.6) return;
      const b = beats[i];
      if (b && !acted && (t >= actAfter(b) || on)) {
        acted = true;
        if (b.act.kind === 'drag') play([b.act], null, P);
        else if (b.act.kind === 'drags') play(b.act.drags, null, P);
        else if (b.act.kind === 'burn') { helium.bigBang = b.bang ?? 0; burned = true; B.burn(); }
      }
      if (i >= 0) {
        if ((t < need && !on) || !acted || helium.hand.length || B.busy()) return;
        if ((gap += dt) < P.GAP) return;
      }
      i++;
      if (i >= beats.length) { cineEnd(false); return; }
      const n = beats[i];
      if (n.who === 'you') { you.text(n.says, lessonSecs(n.says)); W.them.hush(); }
      else if (n.says) say(n.says);
      else W.them.hush();
      if (n.act.kind === 'bang') bang(false, n.bang ?? OPENING_BANG);
      // (the whites it's about ringed on the board, a white burning till it's gone in)
      // (once it's burned, only the white going down: the column sliding in after it isn't)
      burned = false;
      B.mark = n.marks === undefined ? null : (x, y, p, gone) => (gone ? burned && p === WHITE : !burned && ringed(n.marks, x, p));
      // (from step one, in on the board, as at your still: the whites they're moving close enough to follow;
      // the user, 13 Nov: "when he starts moving pieces ... it really should be zooming in on the board")
      if (i === lesson) zoom = true;
      noteFor(n.step ? `Step ${n.step}: ${n.note.replace(/^Step \d+: /, '')}` : n.note, 99);
      t = 0; gap = 0; on = false; need = holdSecs(n); acted = n.act.kind === 'none' || n.act.kind === 'bang';
    },
    end() {
      removeEventListener('pointerdown', click);
      helium.lessonSecs = (performance.now() - c.started) / 1000;   // (how long it ran, for a check)
      helium.play = null; helium.hand = []; helium.bigBang = 0; W.them.lookAt = null; atStill(true);
    },
  };
  helium.play = c;
  cinePlay(c);
}/* Your own line over your head on the sloop, a few seconds, kept on the screen (you may be just out of the
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
/** At the still, a board of your own: a fresh deal and a batch with your goal (at least your best plus one) if
    there's none yet, or the last's finished; they say the goal (your best to beat, if you've one), then their
    plan's first step. */
function atStill(fresh = false) {
  helium.on = true;
  if (fresh || !helium.board || helium.board.game.finished || helium.board.game.timer === false) {
    freshBatch(goalFor(helium.best), goalLines(helium.best));
  }
  helium.board.paused = helium.held;
  keys.clear();
  helpButton(true);
  hud(false);
  noteFor(fresh ? helium.note : '', fresh ? 10 : 0);   // (after their lesson, its last note a while)
}
/** A fresh board and a batch with goal `goal`, their `lines` first, then their plan's first step (worked out now). */
function freshBatch(goal, lines = []) {
  newBoard(new Distilling(Math.random), true);
  helium.nerves = new Nerves();
  helium.goal = goal; helium.batch = new Batch(goal); helium.planLines = new PlanLines(); helium.plan = null; helium.stepNote = ''; helium.hint = null;
  helium.teachLines = new TeachLines(); helium.lastTrick = null;
  helium.board.paused = helium.held;
  const first = planNow();
  if (lines.length || first.length) say(...lines, ...first);
  helpButton(helium.on);
}
/** The batch done: the board stops (Finished), their well done or not, and the question: the same goal again (R)
    or a bigger one (N). `lines` theirs already for the column that did it; `full`, the flask filled. */
function batchDone(lines, full) {
  const B = helium.board, first = helium.batch.met && !helium.batches;
  if (helium.batch.met) helium.batches++;
  stopWatch(false);
  helium.hand = []; helium.handDone = null; helium.hint = null; helium.plan = null;
  B.letGo(); B.clearArrows(); B.column = null; B.burnCols = []; helium.fretMark = null;
  if (!B.game.finished) B.dismiss();
  say(...lines, ...helium.batch.doneLines(first, full));
  noteFor('', 0);
  helpButton(helium.on);
}
/** Batch done: R, the same goal again; N, a bigger one (only once it's met). */
function nextBatch(bigger) {
  const b = helium.batch;
  if (!helium.on || !b?.done || (bigger && !b.met)) return;
  const goal = bigger ? biggerGoal(b.goal, helium.best) : b.goal;
  freshBatch(goal, [fillIn(bigger ? GOAL.bigger : GOAL.again, goal)]);
}

/* Their plan for your goal on your board (src/den-helium.ts, planFor; the user, 13 Nov: "try and get those three
   columns of blacks out of the way and start getting all the white pieces over here and like highlighting some
   column ... and arrows of where they think the white pieces should go"): the junk to burn first shaded red, the
   Crystal Clear's column gold once it's known, the pieces the step's about ringed, the move to make as arrows (a
   plain trick for it, src/distill-teach.ts; the user, 13 Nov: "it's giving you really complicated moves ... am I
   supposed to be able to figure out and spot similar things?"), the step in the bar, their line as each step
   starts, and why the move works the first time its trick's shown; a moment later (SPOT_AFTER) the other places
   the same trick works now ringed, for you to find. Worked out again a moment after the board changes (not while
   it's sliding, while a piece is held, or while their own hand plays). */
const boardKey = (g) => `${g.columns.length}:${g.swaps}:${g.chain}`;
/** Works their plan out on the board as it stands; their lines for it: the step's if it's starting, and the move's
    why (and where else it works) the first time its trick's shown. */
function planNow() {
  const B = helium.board, g = B?.game;
  if (!g || !helium.batch || helium.batch.done) return [];
  const p = planFor(g, helium.goal, helium.held ? Infinity : g.timeLeft(), helium.lastTrick);
  helium.plan = p; helium.planKey = boardKey(g); helium.planWait = 0; helium.stepNote = p.note; helium.spotT = 0;
  if (p.teach) helium.lastTrick = p.teach.trick;
  const ring = new Set(p.ring.map(([x, y]) => `${x},${y}`));
  p.mark = (x, y, _p, gone) => !gone && ring.has(`${x},${y}`);
  B.column = p.column; B.burnCols = p.burn;
  const step = helium.planLines.next(p, g.chain);
  return [...(step ? [step] : []), ...helium.teachLines.next(p)];
}
function planTick(dt) {
  const B = helium.board, g = B?.game;
  if (!helium.on || !g || !helium.batch || helium.batch.done || helium.watch || helium.hand.length) return;
  const key = boardKey(g);
  if (key === helium.planKey && helium.plan) helium.spotT += dt;
  if (key !== helium.planKey) {
    // (a column gone, the board's slid under the shading: off till it's worked out again)
    if (helium.planKey.split(':')[0] !== String(g.columns.length)) { B.column = null; B.burnCols = []; }
    helium.planKey = key; helium.planWait = 0.35; helium.plan = null;
    return;
  }
  if (helium.planWait <= 0 || !g.movable || B.busy() || B.selected()) return;
  if ((helium.planWait -= dt) > 0) return;
  const lines = planNow();
  if (lines.length) say(...lines);
}
function leave() {
  stopWatch(false);
  helium.on = false;
  helium.hand = [];
  helium.hint = null;
  if (helium.board) { helium.board.paused = true; helium.board.letGo(); helium.board.clearArrows(); }
  helpButton(false);
  hud(true);
}
/* The sailing bar's tokens and keys put away while you're at the still (they'd cover the board). */
const hud = (on) => { const el = document.getElementById('sailhud'); if (el) el.style.visibility = on ? '' : 'hidden'; };
/** Holding her: at the still (no pins, no Sailing board). */
export const heliumHolds = () => helium.on;

/** "Help, Helium": they read your board, say what they'd do and why, and do it (src/den-helium.ts). */
export function heliumHelp() {
  stopWatch(false);
  const B = helium.board;
  if (!helium.on || !B || helium.hand.length || B.game.finished) return;
  const h = askHelium(B.game, aim());
  say(h.says);
  noteFor(h.note);
  if (h.plays === 'drags') {
    B.letGo();
    B.paused = true;   // (the furnace waits while they show you)
    play(h.advice.drags, () => { B.paused = helium.held; });
  } else if (h.plays === 'burn') B.burn();
}

/* A hint (the user, 13 Nov: "hinting as well, so it shows you the path. Of what the next moves are they would
   do"): the planner's next drag or two drawn on your board as gold arrows, numbered, not played; their line the
   phase and what they're after (src/den-helium.ts, hintFor). The arrows follow you as you play them and go once
   you've done something else (hintLeft). And while their nerves ring a white in the furnace's column, pale blue
   arrows from the junk pieces that could take its place ("arrows of nearby routes of pieces that can be dragged
   into the spots": routesToFire), redrawn as the board changes, gone once it's out or burned. */
export function heliumHint() {
  stopWatch(false);
  const B = helium.board;
  if (!helium.on || !B || helium.hand.length || B.game.finished) return;
  const h = hintFor(B.game, aim());
  say(h.says);
  noteFor(h.note, 12);
  helium.hint = h.drags.length ? h : null;
}
/** The chain they're playing to on your board: your goal, or once it's met one more (src/den-helium.ts, planTarget). */
const aim = () => (helium.batch ? planTarget(helium.goal, helium.board?.game.chain ?? 0) : undefined);
/** The arrows on your board now: the hint's drags still to play, else their plan's next move (while it's the plan
    for the board as it stands), and the routes into the white they're fretting about (searched again only when the
    board's changed). With them the pieces ringed: the whites they're fretting about, else the plan's. */
function arrowsTick() {
  const B = helium.board, g = B?.game;
  if (!B) return;
  B.clearArrows();
  const plan = helium.plan && helium.planKey === boardKey(g) ? helium.plan : null;
  if (helium.on && !helium.watch && helium.batch) B.mark = helium.fretMark ?? plan?.mark ?? null;
  // (the other places the plan's trick works, ringed once its arrow's been up a moment; not with a hint up, nor
  // while they play)
  const spots = helium.on && plan && !helium.watch && !helium.hint && !helium.hand.length && g.movable && helium.spotT >= SPOT_AFTER ? plan.spots : [];
  B.spots = spots;
  if (plan) helium.stepNote = spots.length ? `${plan.note} · ${SPOT.note}` : plan.note;
  if (!helium.on || !g.movable) return;
  // Watching them: only their move's arrow, up just before they drag it.
  if (helium.watch) {
    const w = helium.watch;
    if (!w.acted) for (const [i, d] of w.arrows.entries()) B.arrow(d, { n: w.arrows.length > 1 ? i + 1 : null });
    return;
  }
  if (helium.hand.length) return;
  if (helium.hint) {
    const left = hintLeft(helium.hint, g.cols), done = helium.hint.drags.length - left.length;
    if (!left.length) helium.hint = null;
    for (const [i, d] of left.entries()) B.arrow(d, { n: helium.hint && helium.hint.drags.length > 1 ? done + i + 1 : null });
    // (and a pale route for each other white in those columns, while you've not started on the hint)
    if (helium.hint && done === 0) for (const d of helium.hint.routes) B.arrow(d, { color: 'route' });
  } else if (plan) for (const [i, d] of plan.drags.entries()) B.arrow(d, { n: plan.drags.length > 1 ? i + 1 : null });
  if (helium.fretCol !== null && whitesInFurnace(g.cols)) {
    const key = `${g.columns.length}:${g.swaps}`;
    if (helium.routes?.key !== key) {
      helium.routes = { key, drags: routesToFire(g.cols) };
      if (helium.routes.drags.length) noteFor(HINT.routes, 8);
    }
    for (const d of helium.routes.drags) B.arrow(d, { color: 'route' });
  } else helium.routes = null;
}

/* Watching them play your board (W, or the button; the user, 13 Nov: "the watch helium play option where he
   explains ... first of all ... I'm going to try and get rid of all the white pieces in all these columns, and
   then just kind of step by step what you're thinking"): a beat at a time (src/den-helium.ts, Watch), each line
   up at a reading pace. Before each phase, the phase and its plan; before each move, the technique and why, the
   move's arrow up a moment (PACE_WATCH.ARROW) and then their hand along it, slower than their help's; a burn
   they do; with nothing worth doing, the furnace runs a while (WAIT) and they look again. The furnace waits
   otherwise. W again, Esc, or any move of your own (a key on the board, a click on it, Hint, Help) hands the
   board back. */
export function heliumWatch() {
  const B = helium.board;
  if (helium.watch) { stopWatch(); return; }
  if (!helium.on || !B || B.game.finished) return;
  helium.hand = []; helium.handDone = null; helium.hint = null; helium.fretCol = null; helium.fretMark = null;
  B.letGo();
  B.mark = null;
  B.paused = true;
  helium.watch = { w: new Watch(), t: 0, need: lessonSecs(WATCH.start), beat: null, acted: true, actAt: 0, arrows: [] };
  say(WATCH.start);
  noteFor('', 0);
  helpButton(true);
}
/** The board back to you (their line for it unless `said` is false): their hand let go, the furnace running. */
function stopWatch(said = true) {
  const B = helium.board;
  if (!helium.watch) return;
  helium.watch = null; helium.hand = []; helium.handDone = null;
  if (B) { B.letGo(); B.clearArrows(); B.paused = !helium.on || helium.held; }
  if (said) say(WATCH.done);
  noteFor('', 0);
  helpButton(helium.on);
}
function watchTick(dt) {
  const w = helium.watch, B = helium.board;
  if (!w || !B) return;
  if (!helium.on || B.game.finished) { stopWatch(false); return; }
  w.t += dt;
  const beat = w.beat;
  // The move's arrow's had its moment: their hand along it (or the burn).
  if (beat && !w.acted && w.t >= w.actAt) {
    w.acted = true;
    if (beat.kind === 'move') play(beat.drags, null, PACE_WATCH);
    else if (beat.kind === 'burn') B.burn();
  }
  // (the furnace runs only while there's nothing worth doing: their board while they play it, held or not)
  B.paused = !(beat && beat.kind === 'wait');
  if (w.t < w.need || helium.hand.length || B.busy() || !B.game.movable) return;
  const n = w.w.next(B.game, aim());
  if (n.kind === 'busy') return;
  if (n.kind === 'dismiss') { say(n.says); noteFor(n.note, 8); helium.watch = null; B.paused = helium.held; helpButton(true); return; }
  w.beat = n; w.t = 0;
  w.acted = n.kind !== 'move' && n.kind !== 'burn';
  w.arrows = n.kind === 'move' ? n.drags : [];
  w.actAt = n.kind === 'move' ? PACE_WATCH.ARROW : PACE_WATCH.GAP;
  w.need = n.kind === 'wait' ? PACE_WATCH.WAIT : (n.says ? lessonSecs(n.says) : 0) + PACE_WATCH.GAP;
  if (n.says) say(n.says);
  noteFor(n.note, 99);
}

/* The buttons beside the board: Hint, Watch Helium, and Help, Helium, the fire's two; and once a batch is done, the
   same goal again or a bigger one in their place. */
let btn = null, watchBtn = null, burnBtn = null, fireBtn = null, againBtn = null, biggerBtn = null;
const BTN = 'font:700 15px "Alegreya Sans",system-ui,sans-serif;color:#f6ead2;background:#3a2410;border:1px solid #c8a050;border-radius:8px;padding:6px 12px;cursor:pointer';
function helpButton(on) {
  if (!btn) {
    btn = document.createElement('div');
    btn.id = 'helium-buttons';
    btn.style.cssText = 'position:fixed;right:16px;bottom:64px;z-index:20;display:none;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:calc(100vw - 32px)';
    const add = (id, text, fn) => {
      const b = document.createElement('button');
      b.id = id; b.textContent = text; b.style.cssText = BTN;
      b.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
      btn.append(b);
      return b;
    };
    add('helium-hint', 'Hint (G)', heliumHint);
    watchBtn = add('helium-watch', 'Watch Helium (W)', heliumWatch);
    add('helium-help', 'Help, Helium (H)', heliumHelp);
    // (the fire, for a phone: held to start with, the tutorial's way; and burning by hand while it's held)
    burnBtn = add('helium-burn', 'Burn now (X)', () => { if (helium.on && !helium.hand.length) helium.board?.burn(); });
    fireBtn = add('helium-fire', '', () => holdFire(!helium.held));
    againBtn = add('helium-again', '', () => nextBatch(false));
    biggerBtn = add('helium-bigger', '', () => nextBatch(true));
    document.body.append(btn);
  }
  const done = !!helium.batch?.done;
  btn.style.display = on ? 'flex' : 'none';
  for (const b of btn.children) b.style.display = done ? 'none' : '';
  watchBtn.textContent = helium.watch ? 'Your board back (W)' : 'Watch Helium (W)';
  fireBtn.textContent = helium.held ? 'Start the fire (F)' : 'Hold the fire (F)';
  burnBtn.style.display = helium.held && !done ? '' : 'none';
  againBtn.style.display = done ? '' : 'none';
  biggerBtn.style.display = done && helium.batch.met ? '' : 'none';
  if (done) {
    againBtn.textContent = `Again: Crystal Clear ${helium.batch.goal} (R)`;
    biggerBtn.textContent = `Bigger goal: Crystal Clear ${biggerGoal(helium.batch.goal, helium.best)} (N)`;
  }
}

// ---------- hooks: keys, the mouse, Space, the prompt ----------
/* The den hands keys over lower-cased; the board wants their own names (its arrows, Home, End...). */
const KEYS = { arrowleft: 'ArrowLeft', arrowright: 'ArrowRight', arrowup: 'ArrowUp', arrowdown: 'ArrowDown', home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown' };
const VIEW = ['z', 'c', 'v', '-', '_', '=', '+', 'p'];
/** A key at sea (sailing.js): the board's while you're at the still; Space off their island to it. */
/** Holding the fire (F): the furnace waits, and the end column burns only when you burn it (X), to take it
    slowly (the user, 13 Nov: "Should have the ability to pause auto burning and burn manually if you'd like to
    slow down"); F again and it's back on its fifteen seconds. Held to start with ("it's paused by default. I think
    that's much more tutorial-like"); kept for the still, batch to batch. */
export function holdFire(on) {
  helium.held = on;
  if (helium.board && !helium.hand.length && !helium.watch) helium.board.paused = on;
  say(on ? FIRE.held : FIRE.going);
  noteFor(on ? FIRE.heldNote : FIRE.goingNote, 6);
  helpButton(helium.on);
}
export function heliumKey(key) {
  if (!helium.on) return false;
  if (key === 'w') { heliumWatch(); return true; }
  // (watching them: Esc, or any key of your own on the board, and it's yours again)
  if (helium.watch && !VIEW.includes(key)) { stopWatch(); if (key === 'escape') return true; }
  if (key === 'escape') { leave(); return true; }
  if (key === 'h') { heliumHelp(); return true; }
  if (key === 'g') { heliumHint(); return true; }
  if (key === 'f') { holdFire(!helium.held); return true; }
  // (the batch done: R the same goal again, N a bigger one)
  if (helium.batch?.done && (key === 'r' || key === 'n')) { nextBatch(key === 'n'); return true; }
  if (helium.hand.length) return !VIEW.includes(key);
  if (helium.board?.key(KEYS[key] ?? key, { repeat: false })) return true;
  return !VIEW.includes(key);
}
/** Space off their island: their lesson the first time (it begins as you come up), then to the still. True if it was for them. */
export function heliumHail() {
  const p = sail.helm.pose;
  if (!helium.W || helium.on || helium.away || !helium.visit.again(onHeliumLanding(p.c, p.r), free())) return false;
  sail.helm.moor(HELIUM_MOOR);
  atStill();
  return true;
}
const ndc = (x, y) => [x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1];
/** The mouse on their board while you're at the still (sailing.js's hover and click; den.js's mouse-up). */
export function heliumHover(x, y) { if (helium.on && !helium.hand.length) helium.board?.pointer(...ndc(x, y), camera); return helium.on; }
export function heliumDown(x, y, button = 0) {
  if (!helium.on) return false;
  // (a click of your own on the board while they play it: it's yours again, and the click counts)
  if (helium.watch && helium.board?.pointer(...ndc(x, y), camera)) stopWatch();
  if (!helium.hand.length && helium.board?.pointer(...ndc(x, y), camera)) helium.board.press(button);
  return true;
}
export function heliumUp(button = 0) { if (helium.on) helium.board?.release(button); }
/** The camera while you're at the still: straight on to the board (den.js, with Umami's). */
export function heliumCam() {
  if (!helium.on || !helium.board) return null;
  return boardView();
}
/** Straight on to their board, as at the still (heliumCam), and from their lesson's step one on. */
function boardView() {
  // (the den's panel is hidden here, so the board fills the screen; the user, 13 Nov: "I can't see helium at
  // all ... still need to see more of the puzzle ... you don't need like the menu at the top again in these
  // views". As the screen widens, the board slides left of the middle and Helium comes in beside it on the
  // right, their cask and the distillery behind, their line in the room there; on a tall phone, the board alone)
  const v = helium.board.camView(camera), d = v.from.clone().sub(v.look).normalize(), W = helium.W;
  const k = Math.max(0, Math.min(1, (camera.aspect - 0.95) / 0.55)), right = V3(Math.cos(W.yaw), 0, -Math.sin(W.yaw));
  // (on a phone, closer still: the board the screen's width, little sea either side, the still's picture at
  // its top tucked up beside Helium's window at the top left; the user, 13 Nov: "a bit bigger ... removing
  // more of the dead space")
  return { look: v.look.clone().add(V3(0, 0.1 - 0.12 * (1 - k), 0)).addScaledVector(right, W.size * 0.32 * k), dist: v.dist * (0.98 + 0.34 * k), tilt: Math.asin(d.y), yaw: Math.atan2(d.x, d.z) };
}
/* Helium in a little window in the corner when they're off the screen at their board (the user, 13 Nov: "on
   mobile, I can't see helium at all"): on a tall phone the board takes the width and they stand off to its
   right, so a second camera looks them in the face and den.js draws it into a corner box, gold-framed, their
   line's tail pointing at it. Null while they're on the screen anyway (a wide one). */
const faceCam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
let faceBox = null;
const FACE = { W: 112, H: 128 };
export function heliumInset() {
  const W = helium.W, show = !!W && (helium.on || !!helium.play);
  const head = show ? W.them.p.g.getWorldPosition(V3(0, 0, 0)).add(V3(0, 2.05 * HELIUM_CAST.them.scale, 0)) : null;
  const p = head && head.clone().project(camera);
  const off = !!p && (p.z > 1 || p.x > 0.92 || p.x < -0.92 || p.y > 0.95 || p.y < -0.95);
  if (!faceBox) {
    faceBox = document.createElement('div');
    faceBox.style.cssText = 'position:fixed;border:2px solid #c9a35c;border-radius:12px;pointer-events:none;box-shadow:0 2px 8px #0008;z-index:2;display:none';
    document.body.appendChild(faceBox);
  }
  if (!off) { faceBox.style.display = 'none'; return null; }
  // (top left, in the room above the board, clear of the furnace at its bottom right; their line beside it)
  const r = { x: 10, y: 10, w: FACE.W, h: FACE.H };
  Object.assign(faceBox.style, { display: '', left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  // (face on, from where they're looking: toward you, a little above)
  const to = camera.position.clone().sub(head).setY(0).normalize();
  faceCam.aspect = r.w / r.h;
  faceCam.position.copy(head).addScaledVector(to, 3.2).add(V3(0, 0.15, 0));
  faceCam.lookAt(head.clone().add(V3(0, -0.25, 0)));
  faceCam.updateProjectionMatrix();
  return { cam: faceCam, rect: r };
}
/** Their line beside the corner box when they're in it (true), its left edge by the box, level with its bottom. */
function lineByInset(el) {
  const on = !!faceBox && faceBox.style.display !== 'none';
  el.classList.toggle('no-tail', on);   // (beside the box, it doesn't point down into the board)
  if (!on) return false;
  const left = parseFloat(faceBox.style.left) + FACE.W + 12;
  el.style.maxWidth = `${innerWidth - left - 8 - 32}px`;
  el.style.left = `${left + el.offsetWidth / 2}px`;
  el.style.top = `${parseFloat(faceBox.style.top) + FACE.H}px`;
  return true;
}
export function heliumPrompt() {
  if (!sail.on || !helium.W) return '';
  if (helium.on) {
    // (your goal, and their plan's step on your board: src/den-helium.ts, planFor; the batch done, what next)
    const B = helium.board, b = helium.batch;
    if (helium.watch) return `Watching Helium${helium.note ? ` · ${helium.note}` : ''} · W or Esc: your board back`;
    if (b?.done) return `${fillIn(b.met ? GOAL.doneNote : GOAL.shortNote, b.goal, biggerGoal(b.goal, helium.best))} · Esc: leave the still`;
    // (the keys are on the buttons above it: X, F, G, W, H)
    const goal = b ? `${fillIn(GOAL.bar, b.goal)}${b.met ? ' (met!)' : ''}${helium.stepNote ? ` · ${helium.stepNote}` : ''}` : '';
    const lead = helium.noteT > 0 && helium.note ? helium.note : B.game.finished ? 'Finished! Esc, then Space for another batch' : goal;
    return `${lead} · Esc: leave the still`;
  }
  const p = sail.helm.pose;
  if (!onHeliumLanding(p.c, p.r) || !helium.visit.seen || helium.play || helium.away) return '';
  return `Off ${HELIUM.NAME} · Space: Distilling at their still`;
}

/** Each tick at sea (sailing.js). */
export function heliumTick(dt) {
  const W = helium.W;
  if (!W) return;
  if (sail.on) {
    const p = sail.helm.pose;
    // The first time you come up beside their island, anywhere round it, settled and not at the Sailing
    // board: their lesson.
    if (helium.visit.arrive(onHeliumLanding(p.c, p.r), free() && sail.helm.slot < 0 && !station.on)) { keepSeen(); lessonPlay(); }
  }
  if (helium.play) bar(`${helium.note} · Space: go on · Esc: skip`);
  watchTick(dt);
  handTick(dt);
  you.tick(dt);
  helium.board?.tick(dt);
  helium.noteT = Math.max(0, helium.noteT - dt);
  // The bang: they flinch, then shrug it off, then they're back at it. Rum running at your still: they tend
  // the cask, turned to it.
  const tending = helium.on && !helium.play && !helium.hand.length && W.distillery.busy();
  if (helium.cower > 0) { if ((helium.cower -= dt) <= 0) { helium.shrug = 1.6; W.them.setIdle('shrug'); } }
  else if (helium.shrug > 0) { if ((helium.shrug -= dt) <= 0) W.them.setIdle(HELIUM_CAST.them.idle); }
  else if (helium.nervy > 0) { helium.nervy -= dt; W.them.setIdle('cower'); }
  else W.them.setIdle(tending ? 'tend' : HELIUM_CAST.them.idle);
  // (at the still, turned to you, at the board; tending, to the cask)
  if (!helium.play) W.them.lookAt = tending ? W.distillery.caskAt() : helium.on ? camera.position : null;
  // Nervous at your still while a white sits in the furnace's column and the fire comes round (src/den-helium.ts,
  // Nerves): uneasy, then panicking and cowering, or phew once you've got it out. Not while their own hand plays.
  const g = helium.board?.game;
  // (not while they're playing it for you to watch: it's their own hand then)
  if (helium.on && g && g.movable && !helium.hand.length && !helium.watch) {
    const n = helium.nerves.tick(g.columns.length, whitesInFurnace(g.cols), helium.held ? Infinity : g.timeLeft());
    // (the first time or two they panic, the keys for taking it slower: F holds the fire, X burns)
    if (n) { say(...(n.level === 'panic' && helium.fireTips < 2 ? (helium.fireTips++, [n.says, FIRE.tip]) : [n.says])); if (n.level === 'panic') helium.nervy = NERVE.COWER; }
    // ...and the whites they're fretting about ringed on the board (the user, 13 Nov: "When they say do you see
    // that [white] ... it should like visually indicate like highlight the pieces"), till they're out or burned.
    if (n && n.level !== 'phew') { helium.fretCol = g.columns.length; helium.fretMark = (x, y, p, gone) => !gone && x === g.cols.length - 1 && p === WHITE; }
    else if (helium.fretCol !== null && (helium.fretCol !== g.columns.length || !whitesInFurnace(g.cols))) { helium.fretCol = null; helium.fretMark = null; }
  }
  arrowsTick();
  // Their plan for your goal, worked out again once the board's settled after a change.
  planTick(dt);
  W.them.tick(dt);
  // (no den panel at the top while you're at their board, in the lesson or at your still)
  document.body.classList.toggle('at-board', helium.on || !!helium.play);
  // (the buttons just above the bar, however many lines it wraps to)
  const prompt = document.getElementById('prompt')?.getBoundingClientRect();
  if (btn && helium.on && prompt?.height) btn.style.bottom = `${Math.max(64, innerHeight - prompt.top + 8)}px`;
  placeLine();
  W.distillery.tick(dt);
  for (const o of W.props) o.tick?.(dt);
}

/* Their line where you can read it (the user, 13 Nov: "too far to the right for the help bubble to really
   appear"): at the still and in their lesson, kept on the screen and off the board (src/den-helium.ts,
   lineSpot), on a phone above or below it. */
const corners = [V3(0, 0, 0), V3(0, 0, 0), V3(0, 0, 0), V3(0, 0, 0)];
function placeLine() {
  const W = helium.W, el = W.them.el;
  if (!el || el.style.display === 'none') return;
  if (!(helium.on || helium.play)) {
    // (over their head, away from the board: narrow enough for the screen, and kept whole on it)
    el.classList.remove('no-tail');
    el.style.maxWidth = `${Math.min(380, innerWidth - 24) - 32}px`;
    const head = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
    if (!Number.isFinite(head.x) || !Number.isFinite(head.y)) return;
    const hud = document.querySelector('.hud')?.getBoundingClientRect();
    const p = onScreen(head, { w: el.offsetWidth, h: el.offsetHeight + 12 }, { w: innerWidth, h: innerHeight }, { top: hud && hud.bottom > 0 && hud.bottom < innerHeight / 2 ? hud.bottom + 6 : 70 });
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    return;
  }
  const right = V3(Math.cos(W.yaw), 0, -Math.sin(W.yaw)), half = W.size / 2;
  const box = { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
  corners.forEach((p, i) => {
    p.copy(W.boardAt).addScaledVector(right, i % 2 ? half : -half).add(V3(0, i < 2 ? W.tall / 2 : -W.tall / 2, 0)).project(camera);
    const x = (p.x + 1) / 2 * innerWidth, y = (1 - p.y) / 2 * innerHeight;
    box.l = Math.min(box.l, x); box.r = Math.max(box.r, x); box.t = Math.min(box.t, y); box.b = Math.max(box.b, y);
  });
  if (lineByInset(el)) return;
  const head = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
  if (!Number.isFinite(head.x) || !Number.isFinite(head.y)) return;
  // (narrower, a few more lines, to fit beside the board on their side when there's a strip of room there)
  // (its padding and border are on top of its max-width: 32px)
  const side = innerWidth - box.r - 16;
  el.style.maxWidth = `${Math.min(380, innerWidth - 24, side >= 170 && head.x > box.r - 40 ? side : 380) - 32}px`;
  // (clear of the den's panel at the top, and the bar and the help button at the foot, wherever they are)
  const hud = document.querySelector('.hud')?.getBoundingClientRect(), foot = Math.min(btn?.getBoundingClientRect().top || innerHeight, document.getElementById('map-hint')?.getBoundingClientRect().top || innerHeight);
  const top = hud && hud.bottom > 0 && hud.bottom < innerHeight / 2 ? hud.bottom + 6 : 70;
  const p = lineSpot(head, { w: el.offsetWidth, h: el.offsetHeight }, box, { w: innerWidth, h: innerHeight }, { top, bottom: innerHeight - foot + 6 });
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y}px`;
}

/** A fresh voyage: their lesson not seen yet, the still left, the lesson's deal back on their board. */
export function heliumReset() {
  helium.visit = new Visit(readSeen());
  if (helium.play && cine === helium.play) cineEnd(true);
  leave();
  helium.cellar = new Cellar();
  helium.batch = null; helium.plan = null; helium.stepNote = ''; helium.batches = 0; helium.fretMark = null;
  if (helium.W) { helium.W.distillery.reset(); newBoard(lessonGame(), false); helium.board.paused = true; }
}

/** A starting point (menus.js): at sea, come up beside their island, so their lesson begins. */
export function heliumCheat() {
  sail.helm.moor(HELIUM_ARRIVE);
  sail.riding = false;
}

// ---------- their rum run's hooks (rumrun.js; src/den-rumrun.ts) ----------
/** Casks filled at their still this voyage. */
export const heliumCasks = () => helium.cellar.filled;
/** Their casks go aboard: the cellar and the pile empty. Where they come from (the cask by the spout), in the world. */
export function heliumShip() {
  helium.cellar = new Cellar();
  const at = helium.W?.distillery.caskAt() ?? V3(0, 0, 0);
  helium.W?.distillery.reset();
  return at;
}
/** Off on the run with you (true), or home again: not on their island meanwhile, no still, no chatter there. */
export function heliumAway(on) {
  helium.away = on;
  const T = helium.W?.them;
  if (!T) return;
  T.p.g.visible = !on;
  T.chatty = !on;
  if (on) T.hush();
}
/** Their island figure quiet while the run's scene talks over them (true), or chattering again; its group, to
    put a line over. */
export function heliumQuiet(on) {
  const T = helium.W?.them;
  if (!T) return null;
  T.chatty = !on && !helium.away;
  if (on) T.hush();
  return T.p.g;
}
/** A starting point for their rum run (menus.js): their lesson seen and `n` casks filled, on the pile. */
export function heliumStock(n) {
  helium.visit.seen = true;
  helium.cellar = new Cellar();
  helium.cellar.pour(RUM.CASK * n);
  helium.W?.distillery.stock(helium.cellar.piled);
}
