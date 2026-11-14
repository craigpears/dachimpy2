// A look at a race choice in 3D, before you plan it (the user, 14 Nov: "this is why I wanted almost for like the 3D
// view to kind of jump to the thing as you click it so you can see what it is before you plan"). Picking a choice on
// the starting line (on the plan's big chart, plan-chart.js, or its strip, race-plan.js) flies the camera to where
// its puzzle is, the chart put away meanwhile, then back to the chart (or the strip) after a moment, or sooner on M,
// Esc or a click. Only on the line: in the race, the camera stays with her. Its camera is the race's (race.js,
// raceCam), the den blending to it as to any other.
import { choicePlaces } from '../race-chart.js';
import { camera, toast, V3 } from './world.js';
import { seaX, seaZ } from './sea.js';

/** How long a look lasts, in seconds, before the chart's back. */
const LOOK_SECS = 3.5;
export const peek = { p: null, until: 0, back: false, ok: false, yaw: 0 };
let places = null;

/** A look at leg `leg`'s choice `id` (the long way's too: its buoy), if on the line; `back`: the big chart again
    after it. Whether it's looking. */
export function peekAt(leg, id, back) {
  if (!peek.ok) return false;
  places ??= choicePlaces();
  const p = places.find((x) => x.leg === leg && x.id === id);
  if (!p) return false;
  const v = camera.position;
  Object.assign(peek, { p, until: performance.now() + LOOK_SECS * 1000, back });
  peek.yaw = Math.atan2(v.x - seaX(where(p)[0]), v.z - seaZ(where(p)[1]));
  toast(`Leg ${p.leg + 1}: ${p.name} · ${p.puzzle}`);
  return true;
}
/** Where to look: where she stops for its puzzle, else the middle of its line. */
function where(p) {
  if (p.stops.length) return p.stops[0];
  const l = p.line.flat();
  return l[Math.floor(l.length / 2)];
}
/** The look over, now (M, Esc or a click). Whether one was on. */
export function peekEnd() {
  if (!peek.p) return false;
  peek.until = 0;
  return true;
}
/** Each frame (plan-chart.js, chartTick): `ok`, on the line. Returns true the moment a look ends that wants the
    chart back. */
export function peekTick(ok) {
  peek.ok = ok;
  if (!peek.p) return false;
  if (ok && performance.now() < peek.until) return false;
  const back = peek.back && ok;
  peek.p = null;
  return back;
}
/** The camera while looking (race.js, raceCam): over the choice, the way you were already facing. */
export function peekCam() {
  if (!peek.p) return null;
  const [c, r] = where(peek.p);
  return { look: V3(seaX(c), 0, seaZ(r)), dist: 26, tilt: 1.1, yaw: peek.yaw };   // (from above enough that a spit's walls don't hide it)
}
