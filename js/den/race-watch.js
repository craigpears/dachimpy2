// The sloop race, watched (den.html?at=race-watch): four racers with no player in it, a free camera, a key
// to jump between them, and each one's board on screen as she plays it (its rules: src/race-watch.ts; the
// race sailed by the simulation's bots, src/race-sim.ts; the racers src/den-rivals.ts, WATCHED). The user,
// 12 Nov: a link "to watch four bots race", and "I can see the puzzle, as I said, the puzzling, the just
// move around free camera, including jumping between watching each person in the race."
// - Their sloops are the race's own (race-field.js: rivalBoat, boatAt), their broadsides too.
// - The camera: free (W A S D or the arrows move it, Q E or a drag turn and tilt it, the wheel or a pinch
//   zooms), or following a racer (1 to 4, Tab the next, 0 back to free), her board framed with her
//   (watch-boards.js).
// - A bar along the top: the clock, who you're watching, her place, her leg and what she's doing; the four
//   of them, a click to follow.
// Your own sloop waits out of sight by the buoy. Touches the rest through a few hooks: the cheat (menus.js),
// its tick (sailing.js), its keys and camera (den.js).
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { Watch, FreeCam, WATCH } from '../race-watch.js';
import { WATCHED } from '../den-rivals.js';
import { STARTER } from '../lines/race.js';
import { RACE } from '../den-race.js';
import { camera, renderer, pirate, toast, V3 } from './world.js';
import { sail, seaX, seaZ } from './sea.js';
import { rivalBoat, boatAt, boatSay, broadsideFx } from './race-field.js';
import { race } from './race.js';
import { watchBoardsTick, watchBoardsIdle, watchBoardsFired, watchBoardView, watchBoardsReset } from './watch-boards.js';

const RC = LAY.RACE;
/** The watched race: on or not, its Watch, the sloops, the free camera, the camera following a racer (its
    own way round, tilt and distance, turned and zoomed as the free one is), and how far it's gone over to
    framing her board (0 to 1). */
export const watch = { on: false, W: null, boats: [], cam: null, fol: { yaw: 0.5, tilt: 0.55, dist: 26 }, view: 0, shot: null, held: new Set(), bar: null, ptr: new Map(), pinch: 0 };

const course = () => ({ x0: seaX(0), x1: seaX(SAIL.COLS - 1), z0: seaZ(RC.R0), z1: seaZ(RC.FINISH[1] + 1) });
const near = (B) => B.g.visible && camera.position.distanceTo(B.g.position) < 45;

/** Watching starts (menus.js, its cheat: at sea by the race's buoy already). The first race from a link
    with &seed=... is that race, the same every time (one seed, one race); the rest a fresh one each. */
const linkSeed = Number(new URLSearchParams(location.search).get('seed')) || null;
export function watchStart() {
  watchBoardsReset(watch.boards);
  watch.on = true;
  watch.W = new Watch(watch.W || !linkSeed ? undefined : linkSeed);
  if (!watch.boats.length) watch.boats = WATCHED.map((R) => rivalBoat(R, near));
  for (const B of watch.boats) { B.at = null; B.who.hush(); }
  watch.cam ||= new FreeCam(course());
  watch.cam.goTo(seaX(13), seaZ(RC.LINE.r + 4));
  Object.assign(watch.cam.shot, { yaw: 0, tilt: WATCH.CAM.TILT, dist: WATCH.CAM.DIST });
  watch.W.pick(-1);
  race.said.hail = true;   // (no starter's hail at the buoy: you're not racing)
  WATCHED.forEach((R, k) => boatSay(watch.boats[k], R.racer.says.start));
  document.body.classList.add('watching');
  bar();
  toast('Watching the race · 1 to 4 follow a racer · 0 the free camera');
}
/** Watching's over (another cheat, or a fresh voyage). */
export function watchStop() {
  if (!watch.on) return;
  watch.on = false;
  watchBoardsReset(watch.boats);
  for (const B of watch.boats) { B.g.visible = false; B.who.hush(); }
  pirate.g.visible = true;
  document.body.classList.remove('watching');
  if (watch.bar) watch.bar.style.display = 'none';
  watch.held.clear();
}

// ---------- the keys and the mouse ----------
/** Whom to follow: racer `i`, or the free camera (-1), from where the camera's looking now. */
function follow(i) {
  const W = watch.W, was = W.follow;
  W.pick(i);
  if (W.follow < 0 && was >= 0) { const B = watch.boats[was]; watch.cam.goTo(B.g.position.x, B.g.position.z); Object.assign(watch.cam.shot, { yaw: watch.fol.yaw, tilt: Math.max(WATCH.CAM.TILT_MIN, watch.fol.tilt), dist: Math.max(30, watch.fol.dist) }); }
  if (W.follow >= 0 && was < 0) watch.fol.yaw = watch.cam.shot.yaw;
}
/** A key while watching (den.js): whether it was one. */
export function watchKey(key, e) {
  if (!watch.on) return false;
  const W = watch.W;
  if (['1', '2', '3', '4'].includes(key)) { follow(Number(key) - 1); return true; }
  if (key === 'tab') { if (W.follow < 0) follow(W.standings()[0].i); else follow((W.follow + (e?.shiftKey ? W.racers.length - 1 : 1)) % W.racers.length); return true; }
  if (key === '0' || key === 'escape' || key === 'f') { follow(-1); return true; }
  if (key === 'n') { watchStart(); toast('Another race'); return true; }
  if (key === 'x') { watchStop(); toast('Back at the helm, by the race\'s buoy'); return true; }
  if (key === '-' || key === '_') { zoom(1.15); return true; }
  if (key === '=' || key === '+') { zoom(1 / 1.15); return true; }
  if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { watch.held.add(key); return true; }
  return true;
}
addEventListener('keyup', (e) => watch.held.delete(e.key.toLowerCase()));
addEventListener('blur', () => watch.held.clear());
function zoom(k) { if (watch.W?.follow >= 0) watch.fol.dist = Math.max(6, Math.min(70, watch.fol.dist * k)); else watch.cam.zoom(k); }
function turn(a, t) {
  if (watch.W?.follow >= 0) { watch.fol.yaw += a; watch.fol.tilt = Math.max(0.15, Math.min(1.45, watch.fol.tilt + t)); } else watch.cam.turn(a, t);
}
// The mouse and touch on the sea (not the page's buttons): a drag turns and tilts, the wheel or a pinch
// zooms. Caught before the den's own handlers, which are for playing.
const onSea = (e) => watch.on && e.target === renderer.domElement;
addEventListener('pointerdown', (e) => { if (!onSea(e)) return; watch.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); watch.pinch = 0; e.stopImmediatePropagation(); }, true);
addEventListener('pointermove', (e) => {
  if (!watch.on || !watch.ptr.has(e.pointerId)) return;
  const p = watch.ptr.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (watch.ptr.size >= 2) {
    const [a, b] = [...watch.ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (watch.pinch) zoom(watch.pinch / Math.max(1, d));
    watch.pinch = d;
  } else turn(-dx * 0.006, dy * 0.004);
  e.stopImmediatePropagation();
}, true);
const up = (e) => { if (watch.ptr.delete(e.pointerId)) { watch.pinch = 0; e.stopImmediatePropagation(); } };
addEventListener('pointerup', up, true);
addEventListener('pointercancel', up, true);
for (const t of ['mousedown', 'mouseup', 'click', 'contextmenu']) addEventListener(t, (e) => { if (onSea(e)) { e.stopImmediatePropagation(); if (t === 'contextmenu') e.preventDefault(); } }, true);
addEventListener('wheel', (e) => { if (!onSea(e)) return; zoom(e.deltaY > 0 ? 1.1 : 1 / 1.1); e.stopImmediatePropagation(); e.preventDefault(); }, { capture: true, passive: false });

// ---------- the bar ----------
function bar() {
  if (!watch.bar) {
    const el = watch.bar = document.createElement('div');
    el.id = 'watchbar';
    el.innerHTML = '<div class="wb-now"></div><div class="wb-who"></div><div class="wb-keys">1–4 follow a racer · Tab next · 0 free camera · W A S D move · Q E or drag turn · wheel zoom · N another race · X stop watching</div>';
    el.querySelector('.wb-who').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) follow(Number(b.dataset.i)); });
    document.body.appendChild(el);
  }
  watch.bar.style.display = '';
  const W = watch.W, b = W.bar();
  const now = W.follow < 0 ? `<b>${b.clock}</b> · Free camera${b.doing ? ` · ${b.doing}` : ''}` : `<b>${b.clock}</b> · Watching <b style="color:${W.racers[W.follow].sail}">${b.who}</b> · ${b.place} · ${b.leg} · ${b.doing}`;
  const who = W.standings().map((s) => `<button data-i="${s.i}" class="${s.i === W.follow ? 'on' : ''}"><i style="background:${W.racers[s.i].sail}"></i>${s.i + 1} ${s.name}${s.time !== null ? ` ${['1st', '2nd', '3rd', '4th'][s.place - 1]}` : ''}</button>`).join('');
  const sig = now + who;
  if (watch.bar.dataset.sig === sig) return;
  watch.bar.dataset.sig = sig;
  watch.bar.querySelector('.wb-now').innerHTML = now;
  watch.bar.querySelector('.wb-who').innerHTML = who;
}

// ---------- each tick ----------
/** Where racer `i` is drawn: where the field has her, or moored past the finish line once she's home. */
function poseOf(W, i) {
  const r = W.field.racers[i];
  if (r.state === 'finished' && r.place) return { c: RC.FINISH[0] - 1 - 0.9 * (r.place - 1), r: RC.FINISH[1], d: 3 };
  return r.pose;
}
/** Each tick at sea (sailing.js, after the race's own). */
export function watchTick(dt) {
  if (!watch.on || !sail.on) return;
  const W = watch.W;
  // Your sloop out of sight, waiting by the buoy.
  sail.g.visible = false;
  pirate.g.visible = false;
  for (const e of W.tick(dt)) {
    if (e.kind === 'count') toast(STARTER.count[RACE.COUNT - e.n] ?? '');
    if (e.kind === 'go') toast(STARTER.go);
    if (e.kind === 'shot') {
      broadsideFx(e.racer >= 0 ? watch.boats[e.racer].g : null, e.hit >= 0 ? watch.boats[e.hit].g : null, e.cells);
      if (e.racer >= 0) watchBoardsFired(e.racer);
    }
    if (e.kind === 'finish') {
      const B = watch.boats[e.racer], R = W.racers[e.racer];
      boatSay(B, e.place === 1 ? R.racer.says.won : R.racer.says.lost);
      toast(`${R.name} home, ${['1st', '2nd', '3rd', '4th'][e.place - 1]} · ${Math.floor(e.secs / 60)}:${(e.secs % 60).toFixed(1).padStart(4, '0')}`);
      if (W.state === 'done') toast('Everyone\'s home · N: another race');
    }
  }
  watch.boats.forEach((B, i) => {
    B.g.visible = true;
    B.who.tick(dt);
    boatAt(B, i, poseOf(W, i), (W.run?.lift(i) ?? 0) * 6, W.field.racers[i].state === 'dazed', dt);
  });
  // The camera's keys: moved (free), turned.
  const h = watch.held, k = (a, b) => (h.has(a) || h.has(b) ? 1 : 0);
  const fwd = k('w', 'arrowup') - k('s', 'arrowdown'), side = k('d', 'arrowright') - k('a', 'arrowleft'), rot = k('q', 'q') - k('e', 'e');
  if ((fwd || side) && W.follow >= 0) follow(-1);
  if (fwd || side) watch.cam.move(fwd * WATCH.CAM.SPEED * dt * (watch.cam.shot.dist / WATCH.CAM.DIST), side * WATCH.CAM.SPEED * dt * (watch.cam.shot.dist / WATCH.CAM.DIST));
  if (rot) turn(rot * WATCH.CAM.TURN * dt, 0);
  watchBoardsTick(dt, W, W.follow, watch.boats);
  watchBoardsIdle(dt);
  bar();
}

/** The camera while watching (den.js), or null: free, or following a racer, her board framed with her. */
const shift = new THREE.Vector3();
export function watchCam() {
  if (!watch.on || !sail.on) return null;
  const W = watch.W;
  if (W.follow < 0) {
    const s = watch.cam.shot;
    return { look: V3(s.x, 0.5, s.z), dist: s.dist, tilt: s.tilt, yaw: s.yaw, close: 0 };
  }
  const B = watch.boats[W.follow], F = watch.fol, look = B.g.position.clone().setY(1);
  const v = watchBoardView(W.follow, watch.boats), on = !!(v && v.look);
  watch.view += ((on ? 1 : 0) - watch.view) * 0.06;
  if (on) watch.shot = v;
  let cam = { look, dist: F.dist, tilt: F.tilt, yaw: F.yaw };
  // The Sailing board down the left: she's slid into the part of the screen it leaves.
  if (v?.free) {
    const fr = v.free, nx = ((fr.x + fr.w / 2) / innerWidth) * 2 - 1, ny = 1 - ((fr.y + fr.h * 0.55) / innerHeight) * 2;
    const vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * camera.aspect);
    const a = nx * F.dist * Math.tan(hh), b = ny * F.dist * Math.tan(vh) / Math.max(0.3, Math.sin(F.tilt));
    shift.set(Math.cos(F.yaw) * a - Math.sin(F.yaw) * b, 0, -Math.sin(F.yaw) * a - Math.cos(F.yaw) * b);
    cam.look = look.clone().sub(shift);
  }
  // Her board in the world (on her deck, on the quay, on the jam): framed, she beside it.
  const S = watch.shot, u = watch.view;
  if (S?.look && u > 0.001) {
    const y0 = Math.atan2(Math.sin(cam.yaw), Math.cos(cam.yaw));
    let d = S.yaw - y0; d = Math.atan2(Math.sin(d), Math.cos(d));
    cam = { look: cam.look.clone().lerp(S.look, u), dist: cam.dist + (S.dist - cam.dist) * u, tilt: cam.tilt + (S.tilt - cam.tilt) * u, yaw: y0 + d * u };
  }
  // (held close on her: she sails on, and the camera mustn't trail behind her board)
  cam.close = 1;
  return cam;
}
