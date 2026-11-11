// Little cutscenes (STORY.md: "short and cheesy"): the one playing just now, its camera, the black
// bars, Space or Esc to skip, and the bits every scene uses (speech bubbles, walking someone
// somewhere). Each scene is its own module: their captain's parting shot (map.js), Dignity at the
// checkpoint (dignity.js). (Pulled out of map.js.)
import { $, camera, animateWalk, faceTo, v3 } from './world.js';

/* The scene playing, if one is: { cam: { look, dist, tilt, yaw }, tick(dt), end(skip) }. Its cam is
   the camera's shot (den.js eases to it and back); tick plays it; end tidies it away, `skip` when
   Space or Esc cut it short. */
export let cine = null, cineCam = null, cineView = 0;

// den.js eases the camera in and out of the scene's shots through these.
export const cineLets = {
  get cineCam() { return cineCam; }, set cineCam(v) { cineCam = v; },
  get cineView() { return cineView; }, set cineView(v) { cineView = v; },
};

// A scene starts: the black bars come in and the den's buttons, keys and labels get out of the way.
export function cinePlay(c) {
  if (cine) cineEnd(true);
  cine = c;
  document.body.classList.add('cine');
  $('intro').classList.add('off');
}
// It's over (played out, or skipped).
export function cineEnd(skip) {
  if (!cine) return;
  const c = cine;
  cine = null;
  document.body.classList.remove('cine');
  c.end?.(skip);
}
/* Each tick: the scene played on by the clock on the wall, not the game's step. (den.js caps a step
   at 0.05 s, so below 20 frames a second the whole game runs in slow motion, and a cutscene, all
   timing, crawled: the user, 10 Nov, "some of these animations are just going really slow".) A
   scene's beats are all its own elapsed time (Dignity's: sceneAt), so it keeps to time and can't
   jump. Capped at a quarter of a second, so coming back to the tab doesn't leap it to its end. */
export function cineTick(dt) {
  if (!cine) return;
  const now = performance.now(), real = cine.wall === undefined ? dt : Math.min(0.25, (now - cine.wall) / 1000);
  cine.wall = now;
  cine.tick?.(real);
}

/* A speech bubble, hidden till bubbleAt shows it over someone. In the den's labels by default; at sea
   (where the labels are hidden) on the page itself. `cls`: more classes ('chat': a familiar's
   chatter, smaller). */
export function bubble(text, parent = $('labels'), cls = '') {
  const el = document.createElement('div');
  el.className = `label say ${cls}`.trim();
  el.textContent = text;
  el.style.display = 'none';
  parent.append(el);
  return el;
}
export function bubbleAt(el, on, x, y, z) {
  if (!on) { el.style.display = 'none'; return; }
  v3.set(x, y, z).project(camera);
  el.style.left = `${(v3.x + 1) / 2 * innerWidth}px`;
  el.style.top = `${(1 - v3.y) / 2 * innerHeight}px`;
  el.style.display = v3.z > 1 ? 'none' : '';
}
// Walks o (anything with x and z) towards (tx, tz), p's legs going; true once there.
export function stepTo(o, p, tx, tz, speed, dt) {
  const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz);
  if (d < 0.05 || !speed) { animateWalk(p, false, dt); return true; }
  const s = Math.min(d, speed * dt);
  o.x += dx / d * s; o.z += dz / d * s;
  faceTo(p, dx, dz, dt);
  animateWalk(p, true, dt);
  return false;
}
