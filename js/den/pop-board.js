// A board on her deck popped out in front of you, as Sailing's is (the user, 13 Nov, racing: "I got shot, and then
// all I could see was the mast and [the deck] ... absolutely chaotic ... guns ... definitely just needs to be a
// puzzle on that ... you can still have that, I guess, for spectators, but I think my controls need to be more like
// sailing is, where it's popped out"). In a race, your own Gunnery (sea-guns.js) and the deck patch's Carpentry
// (sea-puzzles.js) stay the boards they are, on her deck where anyone watching sees them, but the camera stays out
// over the race: the board's shown to you in a frame where Sailing's board goes (on its left on a wide screen,
// along the bottom on a tall one), looked straight down on by a camera of its own, her bow at the top. The pointer
// over the frame reaches the board through that camera (popRay), and the board's labels are put where it shows
// them (popProject). Nothing of either puzzle is here: only where the frame goes and the camera into it.
import * as THREE from 'three';
import { camera, ray, edges, V3 } from './world.js';
import { seaShift } from './sail-station.js';

export const pop = {
  /** Racing your own sloop (race.js says so each tick): the boards on her deck come up popped out. */
  race: false,
  /** Up just now, its frame on the screen, the sea it leaves (`free`), and its camera. */
  on: false, rect: null, free: null, wide: true,
  cam: new THREE.PerspectiveCamera(30, 1, 0.05, 60),
  el: null, lowT: 0, low: 0, top: 0,
};

function frame() {
  if (pop.el) return pop.el;
  const el = pop.el = document.createElement('div');
  el.style.cssText = 'position:fixed;border:3px solid #c9a35c;border-radius:12px;pointer-events:none;box-shadow:0 3px 12px #000a;z-index:3;display:none';
  document.body.appendChild(el);
  return el;
}

/** Each tick at sea: `shot`, the board up on her deck to pop out (null: none), as { centre (world), bow (a world
    direction along her deck toward her bow), w, h (metres across and along her deck it takes) }. */
export function popTick(dt, shot) {
  pop.on = !!shot && pop.race;
  frame().style.display = pop.on ? '' : 'none';
  if (!pop.on) { pop.rect = pop.free = null; return; }
  // (clear of the prompt along the bottom and the den's panel at the top, measured now and then, as Sailing's)
  if ((pop.lowT -= dt) <= 0) { pop.lowT = 0.5; pop.low = document.getElementById('dock')?.getBoundingClientRect().top || innerHeight; pop.top = document.querySelector('.hud')?.getBoundingClientRect().bottom ?? 0; }
  const W = innerWidth - edges.right, H = innerHeight, gap = 10, top = Math.max(gap, pop.top + gap), low = Math.min(H, pop.low || H);
  const aspect = shot.w / shot.h, wide = W > H * 1.05;
  let w, h, x, y;
  if (wide) {
    h = Math.min(low - top - gap, (W * 0.4) / aspect); w = h * aspect;
    x = gap; y = top + (low - top - gap - h) / 2;
  } else {
    h = Math.min((low - top - 2 * gap) * 0.62, (W - 2 * gap) / aspect); w = h * aspect;
    x = (W - w) / 2; y = low - gap - h;
  }
  pop.wide = wide;
  pop.rect = { x, y, w, h };
  pop.free = wide ? { x: x + w + gap, y: 0, w: W - x - w - gap, h: H } : { x: 0, y: top, w: W, h: Math.max(60, y - gap - top) };
  Object.assign(pop.el.style, { left: `${x - 3}px`, top: `${y - 3}px`, width: `${w}px`, height: `${h}px` });
  // Straight down onto it from above, her bow at the top of the frame, close enough that it fills it.
  const C = pop.cam, vh = (C.fov * Math.PI) / 360;
  C.aspect = w / h;
  const dist = (shot.h / 2) / Math.tan(vh);
  C.up.copy(shot.bow);
  C.position.copy(shot.centre).add(V3(0, dist, 0));
  C.lookAt(shot.centre);
  // (only what's on her deck: anything standing higher, her mast and sails, her pirate, is cut away above it)
  C.near = Math.max(0.05, dist - 0.9); C.far = dist + 3;
  C.updateProjectionMatrix();
  C.updateMatrixWorld(true);
}

/** For den.js's frame: what to draw in the frame, and where (as heliumInset's corner box is drawn). */
export const popInset = () => (pop.on && pop.rect ? { cam: pop.cam, rect: pop.rect } : null);

/** The pointer at (x, y) on the screen: if it's over the frame, `ray` aimed through it into the board (true). */
export function popRay(x, y) {
  const R = pop.rect;
  if (!pop.on || !R || x < R.x || x > R.x + R.w || y < R.y || y > R.y + R.h) return false;
  ray.setFromCamera(new THREE.Vector2(((x - R.x) / R.w) * 2 - 1, -((y - R.y) / R.h) * 2 + 1), pop.cam);
  return true;
}
/** Aim `ray` at (x, y): through the frame while a board's popped out, through the camera otherwise. False if the
    board's popped out and the pointer isn't over it. */
export function aimAt(x, y) {
  if (pop.on) return popRay(x, y);
  ray.setFromCamera(new THREE.Vector2((x / innerWidth) * 2 - 1, (-y / innerHeight) * 2 + 1), camera);
  return true;
}
/** Where a point in the world shows on the screen: in the frame while a board's popped out. { x, y, off }. */
export function popProject(v) {
  const R = pop.rect;
  if (!pop.on || !R) { const p = v.clone().project(camera); return { x: ((p.x + 1) / 2) * innerWidth, y: ((1 - p.y) / 2) * innerHeight, off: p.z > 1 }; }
  const p = v.clone().project(pop.cam);
  return { x: R.x + ((p.x + 1) / 2) * R.w, y: R.y + ((1 - p.y) / 2) * R.h, off: p.z > 1 || Math.abs(p.x) > 1.05 || Math.abs(p.y) > 1.05 };
}
/** The sea camera slid so she sits in the sea the frame leaves, as for Sailing's board (sail-station.js). */
export const popShift = (yaw, tilt, dist) => (pop.on ? seaShift(pop.free, yaw, tilt, dist) : null);
