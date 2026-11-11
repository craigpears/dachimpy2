// The sloop race's start: the starting line, picking your spot along it, and the starter explaining the race
// before the off (its rules: src/den-race.ts, Race.take, shift and start; its squares LAY.RACE.LINE and FIELD;
// what's said, src/lines/race.ts). The user, 11 Nov: "you've got a bunch of winds and whirlpools and you have
// to really eyeball it to figure out what the fastest way forward is. And you can kind of ... pick your
// starting spot along the starting edge", and "the concepts in this are going to need ... quite a bit of
// explaining as well at the start ... Here are your options". So Space at the buoy takes her in to the line
// (a rope of floats across the course behind the line of rocks, her spot ringed on the water); A and D (or the
// arrows) move her along it, the field's whirlpools and winds below to eyeball; the starter's card says what
// the race is; Space and he counts you down. The field's whirlpools and winds themselves are drawn with the
// course's (race.js). Touches the rest only through race.js.
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { RACE, spotPose } from '../den-race.js';
import { STARTER } from '../lines/race.js';
import { scene, mat, mesh, toast } from './world.js';
import { sail, seaX, seaZ } from './sea.js';

const RC = LAY.RACE, L = RC.LINE, CELL = SAIL.CELL;
export const start = { W: null, card: null };

/** The line: a rope of red and white floats along the row's far edge, a tall post at either end. */
function build() {
  const g = new THREE.Group(), red = mat('#c8372a', { roughness: 0.6 }), white = mat('#f4f1e8', { roughness: 0.6 });
  const z = seaZ(L.r) - CELL * 0.5, x0 = seaX(L.c0) - CELL * 0.5, x1 = seaX(L.c1) + CELL * 0.5;
  const rope = mesh(new THREE.CylinderGeometry(0.05, 0.05, x1 - x0, 6).rotateZ(Math.PI / 2), mat('#d9c08a'), false);
  rope.position.set((x0 + x1) / 2, 0.18, z); g.add(rope);
  for (let x = x0, i = 0; x <= x1 + 1e-6; x += CELL / 2, i++) { const f = mesh(new THREE.SphereGeometry(0.2, 8, 6), i % 2 ? white : red); f.position.set(x, 0.12, z); g.add(f); }
  for (const x of [x0, x1]) {
    const p = mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.2, 8), white); p.position.set(x, 1.4, z); g.add(p);
    const top = mesh(new THREE.ConeGeometry(0.35, 0.7, 8), red); top.position.set(x, 3.3, z); g.add(top);
  }
  // Her spot: a gold ring on the water.
  const ring = mesh(new THREE.RingGeometry(1.4, 1.75, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd54a', transparent: true, opacity: 0.7, depthWrite: false }), false);
  ring.renderOrder = 3; ring.visible = false; g.add(ring);
  scene.add(g);
  return { g, ring };
}
/** Built with the race's course (race.js). */
export function startWorld() { start.W ||= build(); }

/** The starter's card, while she's on the line: what the race is, and the keys. */
function card(show) {
  if (!start.card) {
    const el = start.card = document.createElement('div');
    el.id = 'racecard';
    Object.assign(el.style, { position: 'fixed', top: '150px', right: '18px', width: '340px', padding: '14px 18px', borderRadius: '10px', background: 'rgba(20,14,9,.84)', color: '#f4e9cf', font: '15px/1.4 Georgia, serif', zIndex: 20, pointerEvents: 'none', display: 'none', border: '2px solid #e8b52a' });
    el.innerHTML = `<div style="font:700 13px system-ui,sans-serif;letter-spacing:3px;color:#e8b52a;margin-bottom:6px">THE STARTER</div>${STARTER.explain.map((l) => `<p style="margin:0 0 7px">${l}</p>`).join('')}<div style="font:600 13px system-ui,sans-serif;color:#e8b52a;margin-top:8px">A D: along the line · Space: the count · Esc: back to the buoy</div>`;
    document.body.appendChild(el);
  }
  start.card.style.display = show ? 'block' : 'none';
}

/** In to the line from the buoy (race.js, Space there): her spot, the card. */
export function takeLine(R) {
  if (!R.take()) return false;
  sail.helm.moor(spotPose(R.spot));
  sail.riding = false;
  return true;
}
/** Her keys on the line: along it, the count, or back out to the buoy. Whether it was one of them. */
export function lineKey(key, R) {
  if (R.state === 'count') return !['z', 'c', 'v', '-', '_', '=', '+', 'p'].includes(key);   // (held for the count)
  if (R.state !== 'line') return false;
  const by = { a: -1, arrowleft: -1, d: 1, arrowright: 1 }[key];
  if (by) { R.shift(by); sail.helm.moor(spotPose(R.spot)); return true; }
  if (key === ' ' || key === 'enter') { R.start(); toast(STARTER.count[0]); return true; }
  if (key === 'escape') { R.quit(); sail.helm.moor({ c: RC.BUOY[0] - 1, r: RC.BUOY[1], d: 0 }); return true; }
  return !['z', 'c', 'v', '-', '_', '=', '+', 'p'].includes(key);
}
export const linePrompt = (R) => (R.state === 'line' ? `The starting line, spot ${R.spot} · A D: along it · Space: the count · Esc: back out` : R.state === 'count' ? 'On the line: wait for the gun' : '');
/** Each tick: her spot's ring, and the card while she's on the line. */
export function startTick(R, on) {
  if (!start.W) return;
  const t = performance.now() / 1000, show = on && (R.state === 'line' || R.state === 'count');
  start.W.ring.visible = show;
  if (show) { start.W.ring.position.set(seaX(R.spot), 0.09, seaZ(L.r)); start.W.ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.2; }
  card(on && R.state === 'line');
}
/** The rival's spot on the line, for drawing it there before the gun. */
export const rivalSpot = () => ({ c: RACE.RIVAL.SPOT, r: L.r, a: 0 });
