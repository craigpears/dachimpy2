// The sloop race watched: a racer's board, played move by move as she puzzles (which board, and its pace:
// src/race-watch.ts, boardOf and paceOf; the race: race-watch.js). The user, 12 Nov: "I can see the puzzle,
// as I said, the puzzling". Each board is the puzzle's own rules played by its own bot, drawn by its own
// look, the same as wherever it's played:
// - Sailing (src/sailing.ts; the bots src/sail-bots.ts) on the den's own Sailing board (sail-board.js), down
//   the left of the screen as at sea, each pair steered down by the moves a player makes (src/balloons.ts,
//   route; src/sail-pair.ts). Under way (on the pilot, building a combo for a gap) it's her very board, the
//   race's own (W.sailor, src/race-sailor.ts), mirrored drop for drop: every clear on it is the gust that
//   carries her sloop on, as it pops (12 Nov). Stopped to finish a Double or a combo, a board of its own; a
//   Vegas at the whirlpools' mouth is one the staircase made (VEGAS_GAMES), its last drops played in her
//   time, the last as it comes off.
// - Bilge (src/bilge.ts; src/bilge-bot.ts) on the up lock's quay, the quay's own board (lock.js, quayBoard).
// - Foraging (src/foraging.ts; src/foraging-bot.ts) stood on the barrier's jam, as yours is (race-forage.js).
// - Gunnery (src/gunnery.ts; src/gunnery-bot.ts) on her deck, as yours is at sea (gundeck.js's look).
// - Carpentry (src/carpentry-frame.ts; src/carpentry-bot.ts) on her deck, a hole patched (sea-puzzles.js's
//   look, patchLook) or the crane's frame.
// - Rowing: not drawn yet (nobody watched rows; the bar says what she's doing).
// Only the racer you follow plays hers; each racer's boards keep as she left them.
import * as THREE from 'three';
import { LAY } from '../den-sail.js';
import { Sailing } from '../sailing.js';
import { SailPair } from '../sail-pair.js';
import { route } from '../balloons.js';
import { SAIL_BOTS, VEGAS_GAMES } from '../sail-bots.js';
import { Bilge } from '../bilge.js';
import { oddsFor } from '../den-bilge.js';
import { bilgeMove } from '../bilge-bot.js';
import { Forage } from '../foraging.js';
import { forageMove } from '../foraging-bot.js';
import { barrierDeal } from '../den-race.js';
import { Gunnery, GUNNERY } from '../gunnery.js';
import { gunneryMove } from '../gunnery-bot.js';
import { DeckHole } from '../den-patch.js';
import { CarpentryFrame } from '../carpentry-frame.js';
import { carpMove, carpLift } from '../carpentry-bot.js';
import { CRANE } from '../den-crane.js';
import { FairDeal } from '../den-deal.js';
import { seeded } from '../mirror-row.js';
import { Pacer, paceOf, vegasDrops } from '../race-watch.js';
import { C, S, scene, camera, mat, mesh, woodTex, V3, burst, $ } from './world.js';
import { sailBoardMake, sailBoardLayout, sailBoardLay, sailBoardDrop, sailBoardTick, sailBoardBusy, sailBoardSnap } from './sail-board.js';
import { quayBoard, lockWorld } from './lock.js';
import { forageBoard } from './foraging.js';
import { barrierStand } from './race-forage.js';
import { dressBoard, gunwale, setCrates, gunTick, drawBoard, chalkOn } from './gundeck.js';
import { patchLook, deckHoleShape } from './sea-puzzles.js';
import { myId } from './crew.js';
import { sail, SLOOP_DECK } from './sea.js';

const RC = LAY.RACE;
/** Each racer's desk: her boards, kept as she left them; the one on show; its beat. */
const desks = new Map();
/** The Sailing board on screen (one: the followed racer's game is laid on it). */
const panel = { B: null, of: -1, layout: null, linger: 0, lowT: 0, low: 0, top: 0, big: false };

const deskOf = (i, seed) => {
  if (!desks.has(i)) desks.set(i, { i, seed: seed * 31 + i * 7 + 1, now: null, key: '', pacer: new Pacer(2), sail: null, guns: null, forage: null, bilge: null, carp: null, vegas: null });
  return desks.get(i);
};

/* ---------- Sailing ---------- */
function sailDesk(D) {
  if (!D.sail) { const game = new Sailing(seeded(D.seed)); D.sail = { game, pair: new SailPair(game), route: null, done: 0, stepT: 0 }; }
  return D.sail;
}
function sailShow(D, game = D.sail.game) {
  if (!panel.B) {
    panel.B = sailBoardMake(null);
    // (watched, small in the corner; a tap makes it big, another small again)
    panel.B.cv.title = 'Tap to make her board bigger or smaller';
    panel.B.cv.style.cursor = 'zoom-in';
    panel.B.cv.addEventListener('click', () => { panel.big = !panel.big; panel.B.cv.style.cursor = panel.big ? 'zoom-out' : 'zoom-in'; });
  }
  if (panel.of !== D.i || panel.game !== game) { sailBoardLay(panel.B, game); sailBoardSnap(panel.B); panel.of = D.i; panel.game = game; }
}
/* Her very board, under way (W.sailor: src/race-sailor.ts): the race's own, laid here from the same deal and
   played the same drops, so it's the same board; each pair steered down as the race chose it and landed as it
   lands there, so the clear you see is the gust that carries her sloop on, at that moment. */
function liveDesk(D, S) {
  if (D.live?.seed !== S.seed) {
    const game = new Sailing(seeded(S.seed));
    D.live = { seed: S.seed, game, pair: new SailPair(game), n: 0, route: null, done: 0, stepT: 0, every: 0.08, aim: null };
  }
  const L = D.live;
  // (behind, not followed meanwhile: the drops she's made laid at once, all but the newest)
  if (S.drops.length - L.n > 1) {
    while (L.n < S.drops.length - 1) { const d = S.drops[L.n++]; L.game.drop(d.col, d.turn, d.row); }
    L.route = null; L.aim = null;
    if (panel.game === L.game) { sailBoardLay(panel.B, L.game); sailBoardSnap(panel.B); }
  }
  return L;
}
/** Each tick under way: a drop the race has landed lands here (its chain pops); the next it's chosen, steered
    down a move at a time, in the time it has before it lands. */
function liveTick(L, S, dt) {
  if (L.n < S.drops.length) {
    const d = S.drops[L.n++], res = L.game.drop(d.col, d.turn, d.row);
    L.route = null; L.aim = null; L.pair.reset();
    if (panel.game === L.game) { sailBoardDrop(panel.B, res, L.game); sailBoardSnap(panel.B); }
  }
  if (S.aim && L.aim !== S.aim && L.n === S.drops.length) {
    L.aim = S.aim;
    L.pair.reset();
    L.route = route(L.game, { pair: L.game.pair, col: S.aim.col, turn: S.aim.turn, row: S.aim.row }) ?? [];
    L.done = 0; L.stepT = 0;
    // (steered down steadily through the time before it lands, as a pirate does, not in a rush and then a wait:
    // the user, 14 Nov, "a piece drops fluidly, she puts it in place, and then ... there's a pause waiting for the
    // next turn")
    L.every = Math.max(0.06, Math.min(0.45, ((S.every - S.t) * 0.85) / Math.max(1, L.route.length + 1)));
  }
  if (!L.route) return;
  L.stepT += dt;
  while (L.stepT > L.every && L.done < L.route.length) {
    const st = L.route[L.done++], P = L.pair;
    L.stepT -= L.every;
    if (st === 'left') P.slide(-1); else if (st === 'right') P.slide(1);
    else if (st === 'turnR') P.turnBy(1); else if (st === 'turnL') P.turnBy(-1);
    else P.row++;
  }
}
/** A drop to make: steered down its route a move at a time (sailStep), then landed. */
function sailAim(Sd, drop, every = 0.6) {
  if (!drop) return;
  Sd.pair.reset();
  Sd.route = route(Sd.game, { pair: Sd.game.pair, col: drop.col, turn: drop.turn, row: drop.row }) ?? [];
  Sd.drop = drop; Sd.done = 0; Sd.stepT = 0;
  // (steadily, through most of the beat before the next, as under way: liveTick)
  Sd.every = Math.max(0.06, Math.min(0.45, (every * 0.8) / (Sd.route.length + 1)));
}
function sailStep(Sd, dt) {
  if (!Sd.route) return;
  Sd.stepT += dt;
  const every = Sd.every ?? 0.08;
  while (Sd.stepT > every && Sd.done < Sd.route.length) {
    const st = Sd.route[Sd.done++], P = Sd.pair;
    Sd.stepT -= every;
    if (st === 'left') P.slide(-1); else if (st === 'right') P.slide(1);
    else if (st === 'turnR') P.turnBy(1); else if (st === 'turnL') P.turnBy(-1);
    else P.row++;
  }
  if (Sd.done >= Sd.route.length && Sd.stepT > Math.min(0.12, every)) {
    const res = Sd.pair.slam();
    Sd.route = null;
    if (panel.game === Sd.game) { sailBoardDrop(panel.B, res, Sd.game); sailBoardSnap(panel.B); }
  }
}
const sailBusy = (Sd) => !!Sd.route || (panel.game === Sd.game && panel.B && sailBoardBusy(panel.B));
/* A Vegas at the whirlpools' mouth: a recorded one's board laid as it was some drops before the end, the
   rest played in her time, the last held for when it comes off. Each go, another. */
function vegasLay(D, now) {
  const g = VEGAS_GAMES[(D.seed + now.tries) % VEGAS_GAMES.length], k = vegasDrops(now.left, g.drops.length);
  const game = new Sailing(seeded(g.seed));
  for (const [c, t, r] of g.drops.slice(0, g.drops.length - k)) game.drop(c, t, r);
  D.sail = { game, pair: new SailPair(game), route: null, done: 0, stepT: 0 };
  D.vegas = { tries: now.tries, queue: g.drops.slice(g.drops.length - k).map(([col, turn, row]) => ({ col, turn, row })) };
  D.pacer.spread(now.left, Math.max(1, k - 1));
}
/** Sailing's move, when one's due: the Vegas's next drop (never the last till it comes off), or the bot's. */
function sailDue(D, now) {
  const Sd = D.sail;
  if (sailBusy(Sd)) return;
  if (now.why === 'vegas' && D.vegas) { if (D.vegas.queue.length > 1) sailAim(Sd, D.vegas.queue.shift(), D.pacer.every); return; }
  sailAim(Sd, SAIL_BOTS.shallow(Sd.game), D.pacer.every);
}

/* ---------- Gunnery, on her deck ---------- */
const GSQ = 0.13, GW = GUNNERY.COLS * S, GH = GUNNERY.ROWS * S;
function gunDesk(D) {
  if (D.guns) return D.guns;
  const b = new Gunnery(null, seeded(D.seed)), g = new THREE.Group(), labels = document.createElement('div');
  labels.style.display = 'none';
  document.body.appendChild(labels);
  Object.assign(b, { group: g, at: (r, c, y = 0) => V3((c + 0.5) * S - GW / 2, 0.05 + y, (r + 0.5) * S - GH / 2), said: null });
  const deck = mesh(new THREE.PlaneGeometry(GW + 0.1, GH + 0.1).rotateX(-Math.PI / 2), mat('#94704f', { map: woodTex, roughness: 0.9 }), false);
  deck.position.y = 0.02;
  g.add(deck);
  dressBoard(b, labels);
  gunwale(b);
  setCrates(b, b.pickCrates());
  b.guns[0].state = b.guns[2].state = 'loaded';   // (her starting shots, one a side: FIELD.SHOTS)
  g.position.set(0.1, SLOOP_DECK + 0.03, 0);
  g.rotation.set(0, -Math.PI / 2, 0);
  g.scale.setScalar(GSQ / S);
  D.guns = { b, g };
  return D.guns;
}

/* ---------- Carpentry, on her deck ---------- */
const fair = new FairDeal(C);
const waysOf = (letter) => C.ORIENTS_BY_LETTER[letter].map((o) => C.normalize(o.cells));
function deal(K) {
  const have = K.hand.map((h) => h?.letter).filter(Boolean);
  const l = fair.next(K.frame.done() ? [] : [K.frame.open()], have) || C.weightedLetter();
  return { letter: l, ways: waysOf(l) };
}
function carpDesk(D, why) {
  if (D.carp?.why === why) return D.carp;
  D.carp?.look.group.removeFromParent();
  let frame;
  if (why === 'crane') {
    const part = CRANE.PARTS[(D.cranePart = (D.cranePart ?? -1) + 1) % CRANE.PARTS.length];
    frame = new CarpentryFrame(C.parseRows(part.rows), { margin: CRANE.MARGIN });
  } else frame = new DeckHole(deckHoleShape());
  const look = patchLook(frame, Math.min(0.22, 1.3 / frame.board.w));
  const K = D.carp = { why, frame, look, hand: [] };
  K.hand = [null, null, null].map(() => deal(K));
  return K;
}
function carpDue(D, now) {
  const K = D.carp;
  if (K.frame.done()) return;
  const m = carpMove(K.frame, K.hand);
  if (!m) {
    // (stuck on a gap shut in: a piece beside it lifted back out, as a carpenter would, and a fresh crate)
    const i = carpLift(K.frame);
    if (i >= 0) { K.frame.lift(i); K.look.wood.children[i]?.removeFromParent(); }
    K.hand = K.hand.map(() => deal(K));
    return;
  }
  const { letter } = K.hand[m.i];
  if (!K.frame.put(letter, m.cells, m.r, m.c)) return;
  const at = K.look.fit(letter, m.cells, m.r, m.c, K.frame.laid[K.frame.laid.length - 1].over > 0);
  burst(at, '#e8c890', 8, 1.2);
  K.hand[m.i] = deal(K);
  if (K.frame.done()) burst(at, '#f0d9a8', 14, 2);
  D.pacer.spread(now.left, Math.max(1, Math.ceil(K.frame.open().length / 5)));
}

/* ---------- Bilge, on the up lock's quay ---------- */
function bilgeDesk(D) {
  if (D.bilge) return D.bilge;
  const at = RC.LOCKS[0].at, li = sail.sea.locks.findIndex((l) => l.at[0] === at[0] && l.at[1] === at[1]), L = lockWorld()[li];
  const view = quayBoard(), game = new Bilge(seeded(D.seed), oddsFor(0));
  view.group.position.copy(L.board);
  view.group.rotation.set(0, L.boardYaw, 0);
  view.group.scale.setScalar(L.boardSq);
  view.lay(game);
  D.bilge = { view, game, L, cur: { r: 6, c: 2 }, queue: [], holdT: 0 };
  return D.bilge;
}

/* ---------- Foraging, on the barrier's jam ---------- */
function forageDesk(D) {
  if (D.forage && !D.forage.gone) return D.forage;
  const board = forageBoard({ game: new Forage(barrierDeal(seeded(D.seed))), ...barrierStand() });
  D.forage = { board, gone: 0 };
  return D.forage;
}

/* ---------- each tick ---------- */
// Her mast, sails and guns out of the way while a board's on her deck, and her pirate stood up on her stern
// beside it, not over it (as for yours: sailing.js).
function struck(B, on) {
  for (const o of [...B.g.userData.sails, ...B.g.userData.rig]) o.visible = !on;
  for (const side of ['L', 'R']) B.g.userData.guns[side].visible = !on;
  const g = B.who.p.g;
  if (on) g.position.set(-1.75, SLOOP_DECK + 0.35, 0.5); else g.position.set(-1.15, SLOOP_DECK, 0);
}
/** What's shown for racer `i` (`B` her sloop as drawn), the one followed; others' put away. `W`: the
    Watch. Where the board is, for the camera (watchBoardView). */
export function watchBoardsTick(dt, W, follow, boats) {
  for (const [i, D] of desks) if (i !== follow) hide(D, boats[i]);
  // (the Sailing panel lingers a moment after a drop's played, so its pops are seen)
  panel.linger -= dt;
  const D = follow >= 0 ? deskOf(follow, W.seed) : null;
  const now = D ? W.board(follow) : null, info = D ? W.info(follow) : null, B = D ? boats[follow] : null;
  // (under way, her very board: the race's own)
  const S = D ? W.sailor(follow) : null;
  if (D) D.liveNow = S ? liveDesk(D, S) : null;
  if (D) {
    const key = now ? `${now.puzzle}/${now.why}` : '';
    if (key !== D.key) {
      leave(D, now, info, B);
      D.key = key;
      // (her mast struck while she's at any board but Sailing's, so it's not in the way of it)
      struck(B, !!now && now.puzzle !== 'sailing');
      // (her skill at it: on the pilot her own, at her route's puzzle a level better: src/race-sim.ts, bestAt)
      const skill = !info ? 'decent' : now?.why === 'pilot' ? info.skill : info.best;
      D.pacer = new Pacer(now ? paceOf(now, skill) : 2);
      D.pacer.t = D.pacer.every * 0.6;
    }
    D.now = now;
    if (now) play(D, now, B, dt);
  }
  // The Sailing panel: the followed racer's, while she Sails (or her last drop's still popping).
  const L = D?.liveNow ?? null, Sd = L ?? D?.sail;
  const steering = !!(Sd?.route && panel.of === D.i);
  if (steering || now?.puzzle === 'sailing') panel.linger = 1.8;
  const showPanel = !!(D && Sd && panel.B && panel.of === D.i && (now?.puzzle === 'sailing' || steering || (panel.linger > 0 && sailBoardBusy(panel.B))));
  if (panel.B) panel.B.el.style.display = showPanel ? '' : 'none';
  if (showPanel) {
    if ((panel.lowT -= dt) <= 0) { panel.lowT = 0.5; panel.low = $('dock')?.getBoundingClientRect().top || innerHeight; panel.top = document.getElementById('watchbar')?.getBoundingClientRect().bottom ?? 0; }
    panel.layout = sailBoardLayout(panel.B, panel.low, panel.top, false, 0, { big: panel.big });
    if (L) liveTick(L, S, dt); else sailStep(Sd, dt);
    sailBoardTick(panel.B, dt, Sd.route ? Sd.pair : null);
  } else {
    panel.layout = null;
    if (L) liveTick(L, S, dt);
  }
}
/** Her board's puzzle or reason changed: what was on show is finished with (a Vegas's last drop played
    as it comes off), and the new one set up. */
function leave(D, now, info, B) {
  const was = D.key;
  if (was === 'sailing/vegas' && D.vegas && info?.mode === 'trip' && info.cut === 'whirls' && D.vegas.queue.length) {
    // (it came off: the last drop, and the chain pops)
    const Sd = D.sail;
    Sd.route = null;
    sailAim(Sd, D.vegas.queue.pop());
    D.vegas = null;
  }
  if (was.startsWith('carpentry') && !now?.puzzle?.startsWith('carpentry')) { const K = D.carp; if (K) setTimeout(() => { if (D.carp === K) { K.look.group.removeFromParent(); D.carp = null; } }, 1200); }
  if (was.startsWith('gunnery') && D.guns) D.guns.g.removeFromParent();
  if (was === 'bilge/lock' && D.bilge) { const Bd = D.bilge; setTimeout(() => { Bd.view.group.removeFromParent(); if (D.bilge === Bd) D.bilge = null; }, 1500); }
  if (was === 'foraging/barrier' && D.forage) { const F = D.forage; F.gone = 1; setTimeout(() => { F.board.group.removeFromParent(); F.board.dispose(); if (D.forage === F) D.forage = null; }, 1500); }
}
function hide(D, B) {
  D.guns?.g.removeFromParent();
  D.carp?.look.group.removeFromParent();
  D.bilge?.view.group.removeFromParent();
  D.forage?.board.group.removeFromParent();
  if (B && D.key) struck(B, false);
  D.key = '';
}
function play(D, now, B, dt) {
  const due = D.pacer.tick(dt);
  switch (now.puzzle) {
    case 'sailing': {
      // (under way: her very board, the race's own, played as the race plays it: liveTick)
      if (D.liveNow) { sailShow(D, D.liveNow.game); break; }
      if (now.why === 'vegas' && (!D.vegas || D.vegas.tries !== now.tries)) {
        // (each go, a board of its own: a go that didn't come off, and she's at it again)
        vegasLay(D, now);
      }
      sailDesk(D);
      sailShow(D);
      if (due) sailDue(D, now);
      break;
    }
    case 'gunnery': {
      const G = gunDesk(D);
      if (G.g.parent !== B.g) B.g.add(G.g);
      const b = G.b;
      b.tickT += dt / GUNNERY.TICK;
      if (b.tickT >= 1) { b.tickT = Math.min(b.tickT - 1, 0.5); gunTick(b); }
      drawBoard(b, dt, false);
      if (due) { const m = gunneryMove(b, myId()); if (m) chalkOn(b, m.r, m.c, m.dir); }
      break;
    }
    case 'carpentry': {
      const K = carpDesk(D, now.why);
      if (K.look.group.parent !== B.g) B.g.add(K.look.group);
      if (due) carpDue(D, now);
      break;
    }
    case 'bilge': {
      const Q = bilgeDesk(D);
      if (!Q.view.group.parent) scene.add(Q.view.group);
      Q.holdT += dt;
      if (Q.queue.length && Q.holdT > 0.18 && !Q.view.moving()) { Q.view.step(Q.queue.shift()); Q.holdT = 0; }
      if (due && !Q.queue.length && !Q.view.moving()) {
        const m = bilgeMove(Q.game);
        if (m) { Q.cur = { r: m[0], c: m[1] }; Q.queue.push(...Q.game.swap(m[0], m[1]).stages); Q.holdT = 0; }
      }
      // (the water still to pump: all of it at first, none once she's done)
      const left = Number.isFinite(now.full) && now.full > 0 ? now.left / now.full : 1;
      Q.view.tick(dt, 3 + left * 6, Q.cur);
      break;
    }
    case 'foraging': {
      const F = forageDesk(D);
      if (!F.board.group.parent) scene.add(F.board.group);
      F.board.idle = false;
      if (due && !F.board.done && !F.board.busy()) { const m = forageMove(F.board.game); if (m) { F.board.game.cur = { r: m.r, c: m.c }; F.board.press(m.cw); } }
      break;
    }
    default: break;   // (rowing: not drawn yet)
  }
}
/** Every frame (race-watch.js): boards that are going away finish what they're doing. */
export function watchBoardsIdle(dt) {
  for (const D of desks.values()) {
    if (D.forage?.board.group.parent) D.forage.board.tick(dt);
    if (D.bilge?.view.group.parent && D.key !== 'bilge/lock') D.bilge.view.tick(dt, 3, D.bilge.cur);
  }
}

/** A racer fired a broadside (race-watch.js): one of the loaded guns on her Gunnery board, if she has one,
    is fired (it wants a bucket now, as in Gunnery). */
export function watchBoardsFired(i) {
  const g = desks.get(i)?.guns?.b.guns.find((x) => x.state === 'loaded');
  if (g) desks.get(i).guns.b.fired(g);
}

/** Where the followed racer's board is, for the camera: on screen (the Sailing panel, and the part of the
    screen it leaves: `free`), or in the world (look, dist, tilt, yaw); null if none's on show. */
export function watchBoardView(follow, boats) {
  const D = desks.get(follow), B = boats[follow];
  if (!D?.now || !B) return panel.layout ? { free: panel.layout.free } : null;
  const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
  const deck = (g, w, h) => {
    g.updateMatrixWorld(true);
    const look = g.getWorldPosition(new THREE.Vector3()), ry = B.g.rotation.y;
    return { look, dist: Math.max((h / 2 + 0.4) / Math.tan(vh), (w / 2 + 0.9) / Math.tan(hh)) * 1.25, tilt: 1.42, yaw: Math.atan2(-Math.cos(ry), Math.sin(ry)) };
  };
  switch (D.now.puzzle) {
    case 'sailing': return panel.layout ? { free: panel.layout.free } : null;
    case 'gunnery': return D.guns?.g.parent ? deck(D.guns.g, GUNNERY.COLS * GSQ, GUNNERY.ROWS * GSQ) : null;
    case 'carpentry': { const K = D.carp; if (!K?.look.group.parent) return null; const s = K.look.group.scale.x * S; return deck(K.look.group, K.frame.board.w * s * 1.6, K.frame.board.h * s * 1.6); }
    case 'bilge': {
      const Q = D.bilge;
      if (!Q) return null;
      const sq = Q.view.group.scale.x, look = Q.view.group.getWorldPosition(new THREE.Vector3());
      return { look, dist: Math.max((12 * sq / 2 + 2 * sq) / Math.tan(vh), (6 * sq / 2 + 2 * sq) / Math.tan(hh)) * 1.75, tilt: 1.2, yaw: Q.view.group.rotation.y };
    }
    case 'foraging': {
      const F = D.forage;
      if (!F) return null;
      const v = F.board.camView(camera), d = v.from.clone().sub(v.look).normalize();
      return { look: v.look, dist: v.dist * 1.15, tilt: Math.asin(d.y), yaw: Math.atan2(d.x, d.z) };
    }
    default: return null;
  }
}

/** A new race, or watching's over: every board put away. */
export function watchBoardsReset(boats = []) {
  for (const [i, D] of desks) {
    hide(D, boats[i]);
    D.forage?.board.dispose();
    if (D.guns) D.guns.b.guns.forEach((g) => g.label?.remove());
  }
  desks.clear();
  if (panel.B) panel.B.el.style.display = 'none';
  Object.assign(panel, { of: -1, game: null, layout: null, linger: 0 });
}
