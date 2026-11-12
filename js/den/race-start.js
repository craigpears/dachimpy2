// The sloop race's start: the starting line, picking your spot along it, and the starter explaining the race
// before the off (its rules: src/den-race.ts, Race.take, shift and start; its squares LAY.RACE.LINE and FIELD;
// what's said, src/lines/race.ts). The user, 11 Nov: "you've got a bunch of winds and whirlpools and you have
// to really eyeball it to figure out what the fastest way forward is. And you can kind of ... pick your
// starting spot along the starting edge", and "the concepts in this are going to need ... quite a bit of
// explaining as well at the start ... Here are your options". So Space at the buoy takes her in to the line
// (a rope of floats across the course behind the line of rocks, her spot ringed on the water); A and D (or the
// arrows) move her along it, the field's whirlpools and winds below to eyeball; the starter's card says what
// the race is; Space and he counts you down.
// The field itself (12 Nov) is laid fresh from each race's seed (src/start-field.ts: its slow winds and plain
// whirlpools; online, the room's seed, the same for everyone), laid on her sea and drawn here: its whirlpools as
// every whirlpool, its slow winds as soft tiles each with one arrow, nudging the way it blows, so they read as
// different from the trade winds' racing streaks (the user: "the trade wind kind that really just blows you ...
// but you also need the slower wind that only nudges you one per turn"). Its hop's lane and headwinds are trade
// winds, drawn with the course's (race.js), its rocks too. Touches the rest only through race.js.
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { spotPose } from '../den-race.js';
import { whirlpool } from '../den-whirl.js';
import { MOST_RIVALS } from '../den-rivals.js';
import { STARTER } from '../lines/race.js';
import { scene, mat, mesh, toast, canvasTex } from './world.js';
import { sail, seaX, seaZ } from './sea.js';
import { pool } from './whirlpools.js';

const RC = LAY.RACE, L = RC.LINE, CELL = SAIL.CELL;
export const start = { W: null, card: null, seed: null, field: null, pools: [], tiles: [] };

/* ---- the field: its slow winds and whirlpools, from the race's seed ---- */
// A slow wind's tile: a soft square, its edge dotted, one fat arrow in the middle the way it blows.
let slowTexture = null;
const slowTex = () => (slowTexture ??= canvasTex(64, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(190,236,250,0.16)'; g.fillRect(4, 4, w - 8, h - 8);
  g.strokeStyle = 'rgba(232,250,255,0.75)'; g.lineWidth = 2; g.setLineDash([5, 5]); g.strokeRect(5, 5, w - 10, h - 10); g.setLineDash([]);
  // (the arrow points down the texture: the way it's turned to blow, as a lane's streaks run)
  g.fillStyle = 'rgba(245,252,255,0.9)';
  g.beginPath(); g.moveTo(w / 2, h - 14); g.lineTo(w / 2 - 14, h / 2); g.lineTo(w / 2 - 6, h / 2); g.lineTo(w / 2 - 6, 14); g.lineTo(w / 2 + 6, 14); g.lineTo(w / 2 + 6, h / 2); g.lineTo(w / 2 + 14, h / 2); g.closePath(); g.fill();
}));
function slowTile(c, r, d) {
  const m = mesh(new THREE.PlaneGeometry(CELL * 0.9, CELL * 0.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: slowTex(), transparent: true, depthWrite: false, fog: false }), false);
  m.position.set(seaX(c), 0.075, seaZ(r));
  m.rotation.y = -d * Math.PI / 2;
  m.renderOrder = 2;
  m.userData = { x: seaX(c), z: seaZ(r), d };
  return m;
}
/** The race's field laid on her sea and drawn (each time its seed changes: a new race, or the room's). */
function layField(R) {
  const f = R.field0();
  sail.sea.layField(f);
  if (!start.field) { start.field = new THREE.Group(); scene.add(start.field); }
  for (const o of [...start.field.children]) start.field.remove(o);
  start.pools = f.POOLS.map((spot) => { const o = pool(whirlpool(spot)); start.field.add(o); return o; });
  start.tiles = f.SLOW.map(([c, r, d]) => { const t = slowTile(c, r, d); start.field.add(t); return t; });
  start.seed = R.seed;
}

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

/** Who's racing you, as the card says it: each rival, and who's aboard with them. */
const names = (R) => R.racing().map((x) => (x.crew ? `${x.name} (${x.crew.said})` : x.name)).join(', ');
/** The starter's card, while she's on the line: what the race is, who's racing you, and the keys. */
function card(show, R) {
  if (!start.card) {
    const el = start.card = document.createElement('div');
    el.id = 'racecard';
    Object.assign(el.style, { position: 'fixed', top: '150px', right: '18px', width: '340px', padding: '14px 18px', borderRadius: '10px', background: 'rgba(20,14,9,.84)', color: '#f4e9cf', font: '15px/1.4 Georgia, serif', zIndex: 20, pointerEvents: 'none', display: 'none', border: '2px solid #e8b52a' });
    el.innerHTML = `<div style="font:700 13px system-ui,sans-serif;letter-spacing:3px;color:#e8b52a;margin-bottom:6px">THE STARTER</div>${STARTER.explain.map((l) => `<p style="margin:0 0 7px">${l}</p>`).join('')}<p class="who" style="margin:0 0 7px;font-style:italic"></p><div style="font:600 13px system-ui,sans-serif;color:#e8b52a;margin-top:8px">A D: along the line · 1 to ${MOST_RIVALS}: how many race ye · Space: the count · Esc: back to the buoy</div>`;
    document.body.appendChild(el);
  }
  const who = STARTER.field.replace('{names}', names(R));
  const p = start.card.querySelector('.who');
  if (show && p.textContent !== who) p.textContent = who;
  start.card.style.display = show ? 'block' : 'none';
}

/** In to the line from the buoy (race.js, Space there): her spot, the card; the race's seed (`seed`: online,
    the room's; alone, a fresh one), so its start's field. */
export function takeLine(R, seed) {
  if (!R.take(seed)) return false;
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
  // (how many rivals: 1 to all of them)
  const n = Number(key);
  if (key.length === 1 && n >= 1 && n <= MOST_RIVALS) { R.setRivals(n); sail.helm.moor(spotPose(R.spot)); return true; }
  if (key === ' ' || key === 'enter') { R.start(); toast(STARTER.count[0]); return true; }
  if (key === 'escape') { R.quit(); sail.helm.moor({ c: RC.BUOY[0] - 1, r: RC.BUOY[1], d: 0 }); return true; }
  return !['z', 'c', 'v', '-', '_', '=', '+', 'p'].includes(key);
}
export const linePrompt = (R) => (R.state === 'line' ? `The starting line, spot ${R.spot} · A D: along it · 1 to ${MOST_RIVALS}: rivals (${R.rivals}) · Space: the count · Esc: back out` : R.state === 'count' ? 'On the line: wait for the gun' : '');
/** Each tick: her spot's ring, and the card while she's on the line. */
export function startTick(R, on, dt = 0) {
  if (!start.W) return;
  if (start.seed !== R.seed && sail.sea) layField(R);
  // (the field's whirlpools turning; its slow winds nudging, a square's breath the way they blow)
  for (const o of start.pools) o.rotation.z += dt * o.userData.speed;
  const t0 = performance.now() / 1000, DC = [0, 1, 0, -1], DR = [1, 0, -1, 0];
  for (const m of start.tiles) { const { x, z, d } = m.userData, k = 0.12 * CELL * Math.max(0, Math.sin(t0 * 2.4)); m.position.x = x + DC[d] * k; m.position.z = z + Math.sign(seaZ(1) - seaZ(0)) * DR[d] * k; }
  const t = performance.now() / 1000, show = on && (R.state === 'line' || R.state === 'count');
  start.W.ring.visible = show;
  if (show) { start.W.ring.position.set(seaX(R.spot), 0.09, seaZ(L.r)); start.W.ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.2; }
  card(on && R.state === 'line', R);
}
