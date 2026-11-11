// Tzz's island, a hop from Kikkit's (src/den-tzz.ts; its squares LAY.TZZ in src/den-sail.ts), and the
// balloon lesson given on it. Only the place's own look and its one mechanic are here: the island, a
// palm, and the lesson played as a little cutscene the first time you come up off it (and again on
// Space there). Who's on it is config (src/den-tzz.ts, TZZ_CAST: her look, where she and her stand go,
// her lesson's acts and lines from src/lines/tzz.ts), placed through the shared pieces: props-people.js's
// person(), balloons.js's stand (src/balloons.ts's show) and furniture.js's still (RULES.md, "A
// character is only config"). Touches the rest only through a few hooks: sailing.js builds, ticks and
// asks it (Space, the prompt), sea.js's voices (whom you hear, with Kikkit a hop away), whether you've
// heard Kikkit out (sail.said.wondered: whirlpools.js), and a starting point (menus.js).
import * as THREE from 'three';
import { TZZ_CAST, TZZ, TZZ_STANDS, Visit, lesson, lessonSecs, onTzzLanding, inTzzEarshot, tzzShore } from '../den-tzz.js';
import { BalloonShow } from '../balloons.js';
import { readSecs } from '../den-dignity.js';
import { PIRATES } from '../den-look.js';
import { scene, mat, V3 } from './world.js';
import { sail, seaX, seaZ, voices } from './sea.js';
import { outline, slab } from './isle.js';
import { palm } from './wedding-scene.js';
import { person } from './props-people.js';
import { balloonStand } from './balloons.js';
import { FURNITURE } from './furniture.js';
import { cine, cinePlay, cineEnd } from './cine.js';

/* Her ground: a sand slab's top (isle.js's slab tops out at y0 + its height + its bevel's 0.25), as on
   Kikkit's island, so she stands on it. */
const SAND = { y0: -0.4, h: 0.62 }, GROUND = SAND.y0 + SAND.h + 0.25;
export const tzz = { W: null, visit: new Visit(), play: null };

function build() {
  const g = new THREE.Group(), sand = mat('#e6cf96', { roughness: 1 }), wet = mat('#c9ad78', { roughness: 1 });
  const shore = tzzShore();
  g.add(slab(outline(0.5, shore), -0.55, 0.45, wet), slab(outline(1.1, shore), SAND.y0, SAND.h, sand));
  const p = palm(3.6, 0.3);
  p.scale.setScalar(0.75);
  p.position.set(seaX(21.6), 0.2, seaZ(13.85));
  p.rotation.y = 2.4;
  g.add(p);
  const C = TZZ_CAST, H = C.her, ship = () => (sail.on ? sail.helm.pose : null);
  // The way her stand faces: toward the camera's spot on the water.
  const S = C.board, toCam = Math.atan2(seaX(C.shot.from[0]) - seaX(S.at[0]), seaZ(C.shot.from[1]) - seaZ(S.at[1]));
  const her = person({
    look: PIRATES[H.look], parent: g, x: seaX(H.at[0]), y: GROUND, z: seaZ(H.at[1]), yaw: H.yaw, scale: H.scale, idle: H.idle,
    script: H.says, secs: readSecs, gap: H.gap, wait: 1.5,
    bubble: 'page', shown: () => sail.on,
    earshot: () => { const s = ship(); return !!s && inTzzEarshot(s.c, s.r) && voices.hears('tzz', s.c, s.r); },
    face: () => { const s = ship(); return s && inTzzEarshot(s.c, s.r) ? { x: seaX(s.c), z: seaZ(s.r) } : null; },
  });
  const stand = balloonStand({ performer: her, parent: g, x: seaX(S.at[0]), y: GROUND, z: seaZ(S.at[1]), yaw: toCam, tall: S.tall });
  const props = C.props.map((o) => {
    const piece = FURNITURE[o.kind]();
    piece.g.position.set(seaX(o.at[0]), GROUND, seaZ(o.at[1]));
    piece.g.rotation.y = o.yaw;
    g.add(piece.g);
    return piece;
  });
  voices.add('tzz', { c: TZZ_STANDS.c, r: TZZ_STANDS.r, earshot: TZZ.EARSHOT });
  scene.add(g);
  return { g, her, stand, props };
}

/** Built the first time the sea's drawn (sailing.js), seen from afar too. */
export function tzzWorld() { tzz.W ||= build(); }

// ---------- her lesson: a little cutscene ----------
/* Her balloons twisted and popped (balloons.js plays the show, src/balloons.ts), the camera on her and
   her stand from out on the water. Space or Esc skips it (cine.js); it ends when the show does. */
function lessonPlay() {
  const W = tzz.W, C = TZZ_CAST;
  W.stand.play(new BalloonShow(lesson(!!sail.said.wondered), lessonSecs));
  const her = W.her.p.g.getWorldPosition(V3(0, 0, 0)), at = W.stand.g.getWorldPosition(V3(0, 0, 0));
  const look = her.clone().lerp(at, 0.5).add(V3(0, C.shot.up, 0));
  const yaw = Math.atan2(seaX(C.shot.from[0]) - look.x, seaZ(C.shot.from[1]) - look.z);
  const c = {
    cam: { look, dist: C.shot.dist, tilt: C.shot.tilt, yaw },
    tick() { if (!W.stand.playing()) cineEnd(false); else bar(W.stand.prompt()); },
    end(skip) { tzz.play = null; if (skip) W.stand.stop(); bar('Space: skip'); },
    // (her board's keys on your turn; Space before then, on to her next beat)
    key: (k) => W.stand.key(k),
  };
  tzz.play = c;
  cinePlay(c);
}
/* What the keys do, in the cutscene's bar at the foot of the screen (den.html's, "Space: skip" as a rule). */
const bar = (text) => { const el = document.querySelector('.cine-bar.bot'); if (el && el.textContent !== text) el.textContent = text; };
const free = () => sail.on && !cine && !sail.helm.cur?.via && !sail.helm.gusts?.length && !sail.helm.rides?.length;

/** Space off her island: her lesson again (once you've seen it). True if it was for her. */
export function tzzHail() {
  const p = sail.helm.pose;
  if (!tzz.W || !tzz.visit.again(onTzzLanding(p.c, p.r), free())) return false;
  lessonPlay();
  return true;
}
export function tzzPrompt() {
  if (!sail.on || !tzz.W) return '';
  const p = sail.helm.pose;
  if (!onTzzLanding(p.c, p.r) || !tzz.visit.seen || tzz.play) return '';
  return `Off ${TZZ.NAME} · Space: show me again · R: Sailing`;
}

/** Each tick at sea (sailing.js). */
export function tzzTick(dt) {
  const W = tzz.W;
  if (!W) return;
  if (sail.on) {
    const p = sail.helm.pose;
    // The first time you come up off her island, settled: her lesson.
    if (tzz.visit.arrive(onTzzLanding(p.c, p.r), free() && sail.helm.slot < 0)) lessonPlay();
  }
  W.stand.tick(dt);
  W.her.tick(dt);
  for (const o of W.props) o.tick?.(dt);
}

/** A fresh voyage: her lesson not seen yet, and nothing on her stand. */
export function tzzReset() {
  tzz.visit = new Visit();
  if (tzz.play && cine === tzz.play) cineEnd(true);
  tzz.W?.stand.stop();
}

/** A starting point (menus.js): at sea, just off her island, coming up to it. */
export function tzzCheat() {
  sail.helm.moor({ c: 18, r: 14, d: 1 });
  sail.riding = false;
}
