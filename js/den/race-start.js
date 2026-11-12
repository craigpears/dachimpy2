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
import { spotPose } from '../den-race.js';
import { MOST_RIVALS } from '../den-rivals.js';
import { STARTER } from '../lines/race.js';
import { scene, mat, mesh, toast } from './world.js';
import { sail, seaX, seaZ } from './sea.js';

const RC = LAY.RACE, L = RC.LINE, CELL = SAIL.CELL;
/** `online`: racing online opened (race-net.js sets it); `lobby`: in a room online, whose lobby takes the
    card's place. */
export const start = { W: null, card: null, online: null, lobby: false, more: false };

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
/** The starter's card, while she's on the line: who's racing you, the race in a line (the rest of what he
    says behind How it works), and racing online. Light (the user, 12 Nov, of the card as it was: "a big
    dump of text ... needs to be a lot lighter"); its look is den.html's (#racecard). Online, the room's lobby
    takes its place (race-net.js). */
function card(show, R) {
  if (!start.card) {
    const el = start.card = document.createElement('div');
    el.id = 'racecard';
    el.innerHTML = `<div class="rc-head">The starter</div><p class="who"></p><p>${STARTER.explain[0]}</p><div class="rc-more" hidden>${STARTER.explain.slice(1).map((l) => `<p>${l}</p>`).join('')}</div>`
      + '<div class="rc-btns"><button class="rc-how">How it works</button><button class="rc-online">Race online</button></div>';
    el.querySelector('.rc-how').onclick = (e) => { start.more = !start.more; el.querySelector('.rc-more').hidden = !start.more; e.target.textContent = start.more ? 'Less' : 'How it works'; e.target.blur(); };
    el.querySelector('.rc-online').onclick = (e) => { start.online?.(); e.target.blur(); };
    document.body.appendChild(el);
  }
  show &&= !start.lobby;
  const who = STARTER.field.replace('{names}', names(R));
  const p = start.card.querySelector('.who');
  if (show && p.textContent !== who) p.textContent = who;
  start.card.hidden = !show;
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
  // (how many rivals: 1 to all of them)
  const n = Number(key);
  if (key.length === 1 && n >= 1 && n <= MOST_RIVALS) { R.setRivals(n); sail.helm.moor(spotPose(R.spot)); return true; }
  if (key === ' ' || key === 'enter') { R.start(); toast(STARTER.count[0]); return true; }
  if (key === 'escape') { R.quit(); sail.helm.moor({ c: RC.BUOY[0] - 1, r: RC.BUOY[1], d: 0 }); return true; }
  return !['z', 'c', 'v', '-', '_', '=', '+', 'p'].includes(key);
}
export const linePrompt = (R) => (R.state === 'line' ? `The starting line, spot ${R.spot} · A D: along it · 1 to ${MOST_RIVALS}: rivals (${R.rivals}) · Space: the count · Esc: back out` : R.state === 'count' ? 'On the line: wait for the gun' : '');
/** Each tick: her spot's ring, and the card while she's on the line. */
export function startTick(R, on) {
  if (!start.W) return;
  const t = performance.now() / 1000, show = on && (R.state === 'line' || R.state === 'count');
  start.W.ring.visible = show;
  if (show) { start.W.ring.position.set(seaX(R.spot), 0.09, seaZ(L.r)); start.W.ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.2; }
  card(on && R.state === 'line', R);
}
