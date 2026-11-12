// The sloop race's field at sea: your rivals' sloops racing you, their broadsides and yours, hits shown on the
// sloops themselves (its rules: src/den-race.ts's Race and its field, src/den-racers.ts; the rivals, the den's
// characters, src/den-rivals.ts, each one's racing and lines in her file in src/lines/; they're sailed by the
// simulation's bots, src/race-sim.ts). The user, 11 Nov: "I definitely want to be able to shoot other racers.
// That's absolutely part of this", and "Everyone's got their own little profile and way they approach it".
// Each rival's sloop is the sloop's own look (sloop.js), told apart by her sails and flag, her pirate at the
// tiller (their one look: den-look.js, PIRATES), Umami sat up on Dalnoth's foredeck. Their lines in a bubble
// over them: on the line before the gun, and over the finish line. A hit: a flash and smoke on her, and she
// sits low in the water, smoking, stars over her, till she's patched. Touches the rest only through race.js.
import * as THREE from 'three';
import { SAIL, LAY } from '../den-sail.js';
import { RIVALS } from '../den-rivals.js';
import { PIRATES } from '../den-look.js';
import { scene, mat, mesh, V3, burst, tween, shake, worldLets } from './world.js';
import { sail, seaX, seaZ, liftAt, sloopMesh, SLOOP_DECK } from './sea.js';
import { deckHoleShape } from './sea-puzzles.js';
import { capybaraMesh } from './foraging.js';
import { person } from './props-people.js';

const RC = LAY.RACE, CELL = SAIL.CELL;
/** Each rival's sloop (by her number in the field, 1 up), as drawn; how near you have to be to hear her. */
export const field = { boats: [], said: '', hear: 14 };

/** A rival's sloop: the sloop, her sails and flag in her colours, her pirate at the tiller, her crew.
    `shown(B)`: whether her lines show over her (near you, by default). Also the watched race's
    (race-watch.js). */
export function rivalBoat(R, shown = null) {
  const g = sloopMesh();
  for (const arm of g.userData.sails) arm.children[0].material = mat(R.sail, { side: THREE.DoubleSide, roughness: 0.95 });
  const cloth = g.userData.rig[1].children[2];
  if (cloth) cloth.material = mat(R.flag, { side: THREE.DoubleSide, roughness: 0.9 });
  const who = person({ look: typeof R.look === 'string' ? PIRATES[R.look] : R.look, parent: g, x: -1.15, y: SLOOP_DECK, z: 0, yaw: Math.PI / 2, idle: R.look === 'Kikkit' ? 'tipsy' : 'sway', bubble: 'page', tall: 2.3, shown: () => (shown ? shown(B) : near(B)) });
  if (R.crew?.who === 'umami') {
    const u = capybaraMesh();
    u.scale.setScalar(0.62);
    u.position.set(1.55, SLOOP_DECK + 0.42, 0);
    u.rotation.set(0, 0, 0.12);   // (sat up on her foredeck, looking ahead, as aboard yours)
    g.add(u);
  }
  // Holed: stars over her as over you (sailing.js), and her smoke.
  const stars = new THREE.Group(), sm = new THREE.MeshBasicMaterial({ color: '#ffe066' });
  for (let i = 0; i < 3; i++) { const s = mesh(new THREE.OctahedronGeometry(0.14, 0), sm, false); s.position.set(Math.cos(i * 2.1) * 0.45, 0, Math.sin(i * 2.1) * 0.45); stars.add(s); }
  stars.position.set(-1.15, SLOOP_DECK + 2.6, 0);
  stars.visible = false;
  g.add(stars);
  g.visible = false;
  scene.add(g);
  const B = { R, g, who, stars, low: 0, heel: 0, smokeT: 0, at: null };
  return B;
}
const near = (B) => B.g.visible && Math.hypot(B.g.position.x - sail.g.position.x, B.g.position.z - sail.g.position.z) < field.hear * CELL;
/** Built with the race's course (race.js). */
export function fieldWorld() { if (!field.boats.length) fieldCast(RIVALS); }
/** Whose sloops are on the water: your rivals (RIVALS), or racing online (race-net.js) everyone else on the
    course, in order. Each sloop's built once (by `key`, or her name) and kept for when she races again. */
const built = new Map();
export function fieldCast(list) {
  for (const B of field.boats) { B.g.visible = false; B.at = null; B.who.hush(); }
  field.boats = list.map((R) => {
    const k = R.key ?? R.name;
    if (!built.has(k)) built.set(k, rivalBoat(R));
    return built.get(k);
  });
}

/** Where rival `i` is drawn: her place in the field, or parked past the finish line once she's home. */
function spotOf(Rc, i) {
  const r = Rc.field.racers[i];
  if (r.state === 'finished' && r.place) return { c: RC.FINISH[0] - 1 - 0.9 * (r.place - 1), r: RC.FINISH[1], d: 3 };
  return r.pose;
}
const xyz = (p, lift = 0) => V3(seaX(p.c), liftAt(Math.round(p.c), Math.round(p.r)) + lift, seaZ(p.r));

/** Something said over her (a line of hers, once). Also the watched race's (race-watch.js). */
export function boatSay(B, lines) { if (lines?.length) B.who.setLines([lines[Math.floor(Math.random() * lines.length)]], { loop: false, wait: 0.2 + Math.random() * 0.8 }); }

/** Each tick (race.js): her sloop where the field has her, smoothly; low and smoking while she's holed;
    her lines. `on`: at sea. */
export function fieldTick(dt, Rc, on) {
  const t = performance.now() / 1000;
  // (the start's lines, as the count begins)
  const key = `${Rc.state}`;
  if (key !== field.said) {
    if (Rc.state === 'count') Rc.racing().forEach((R, k) => boatSay(field.boats[k], R.racer.says.start));
    field.said = key;
  }
  field.boats.forEach((B, k) => {
    const i = k + 1, show = on && Rc.state !== 'off' && i < Rc.field.racers.length;
    B.g.visible = show;
    B.who.tick(dt);
    if (!show) { B.at = null; return; }
    boatAt(B, k, spotOf(Rc, i), (Rc.run?.lift(i) ?? 0) * 6, Rc.field.racers[i].state === 'dazed', dt);
  });
}

/** A rival's sloop drawn where the field has her (`p`, lifted `lift` metres by the crane), smoothly; low
    and smoking while she's holed (`dazed`). `k`: her number among the boats, to set her swell apart.
    Also the watched race's (race-watch.js). */
export function boatAt(B, k, p, lift, dazed, dt) {
  const t = performance.now() / 1000, want = xyz(p, lift);
  // (smoothly after where the field has her; a jump of more than a few squares, a sweep, straight there)
  if (!B.at || B.at.distanceTo(want) > CELL * 4) B.at = want.clone();
  else B.at.lerp(want, Math.min(1, dt * 5));
  B.low += ((dazed ? -0.3 : 0) - B.low) * Math.min(1, dt * 2);
  B.g.position.set(B.at.x, B.at.y + B.low + Math.sin(t * 0.9 + k * 2) * 0.06, B.at.z);
  const yaw = Math.PI / 2 - p.d * Math.PI / 2;
  let d = yaw - B.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
  B.g.rotation.y += d * Math.min(1, dt * 3);
  B.g.rotation.x = Math.sin(t * 0.7 + k) * 0.02;
  B.g.rotation.z = Math.sin(t * 0.55 + k) * 0.02 + (dazed ? 0.08 : 0);
  B.stars.visible = dazed;
  if (dazed) {
    B.stars.rotation.y += dt * 4;
    if ((B.smokeT -= dt) < 0) { B.smokeT = 0.25; burst(B.g.localToWorld(V3(0.2, SLOOP_DECK + 0.6, 0)), '#6f6a66', 3, 0.7); }
  }
}

/** A rival's over the finish line (race.js): her line for it. */
export function fieldHome(e) {
  const B = field.boats[e.racer - 1];
  if (B) boatSay(B, e.place === 1 ? B.R.racer.says.won : B.R.racer.says.lost);
}

/* A broadside's flight, as yours flies (sailing.js): out of her side, an arc over the water, down on the
   sloop it hit or in the sea at the end of its reach. */
const ballGeo = new THREE.SphereGeometry(0.13, 10, 8), ballMat = mat('#3a3f45', { metalness: 0.6 });
function fly(from, to, done) {
  burst(from, '#ffcf6a', 10, 3);
  burst(from, '#cfc6b8', 6, 1.5);
  const ball = mesh(ballGeo, ballMat), d = from.distanceTo(to);
  scene.add(ball);
  tween(0.35 + d * 0.03, (u) => { ball.position.lerpVectors(from, to, u); ball.position.y += Math.sin(u * Math.PI) * (0.8 + d * 0.08); }, () => { scene.remove(ball); done(); });
}
/** A hit on a sloop: a flash, timber and smoke flying, and a shudder. */
function holed(g) {
  const at = g.localToWorld(V3(0, SLOOP_DECK + 0.4, 0));
  burst(at, '#ffb85a', 16, 4);
  burst(at, '#6b5c50', 18, 4);
  burst(at, '#3d3530', 10, 2);
  const x0 = g.rotation.x;
  tween(0.5, (u) => { g.rotation.x = x0 + Math.sin(u * Math.PI * 6) * 0.12 * (1 - u); });
}
/** Whose sloop that is (0 yours), drawn. */
const sloopOf = (i) => (i === 0 ? sail.g : field.boats[i - 1]?.g);

/** A broadside a rival's fired (race.js, the race's 'shot'; by -1 the gun gap's guns): its flight, and the
    hit on whoever it hit. You: holed, to patch (the hit's the field's already: she's dazed in it). */
export function fieldShot(e) {
  const to = e.hit >= 0 ? sloopOf(e.hit) : null;
  if (e.hit === 0) sail.helm.hit(deckHoleShape());
  const by = e.by > 0 ? sloopOf(e.by) : null;
  if (!by) { if (to) holed(to); return; }   // (a gun of the gap's: shown on her as she runs it)
  by.updateMatrixWorld(true);
  const from = by.localToWorld(V3(-0.3, SLOOP_DECK + 0.3, 0)), end = e.cells[e.cells.length - 1];
  const at = to ? to.localToWorld(V3(0, SLOOP_DECK + 0.3, 0)) : V3(seaX(end[0]), 0.05, seaZ(end[1]));
  fly(from, at, () => {
    if (!to) { burst(at, '#e6f3f6', 18, 3.5); burst(at, '#9cc8d4', 10, 2.5); return; }
    holed(to);
    if (e.hit === 0) worldLets.shake = Math.max(shake, 0.3);
  });
}
/** A broadside fired from sloop `by` (a group; null: a gun of the gap's) over `cells`, coming down on
    sloop `to` (a group, holed) or in the sea at its reach's end. The watched race's (race-watch.js), as
    the race's own (fieldShot). */
export function broadsideFx(by, to, cells) {
  if (!by) { if (to) holed(to); return; }
  by.updateMatrixWorld(true);
  const from = by.localToWorld(V3(-0.3, SLOOP_DECK + 0.3, 0)), end = cells[cells.length - 1];
  const at = to ? to.localToWorld(V3(0, SLOOP_DECK + 0.3, 0)) : V3(seaX(end[0]), 0.05, seaZ(end[1]));
  fly(from, at, () => { if (to) holed(to); else { burst(at, '#e6f3f6', 18, 3.5); burst(at, '#9cc8d4', 10, 2.5); } });
}
/** Your broadside's come down on rival `i` (sailing.js, by way of race.js): the hit on her sloop. */
export function fieldHit(i) { const g = sloopOf(i); if (g) holed(g); }
/** Where rival `i`'s sloop is drawn, for your shot to come down on. */
export const fieldAt = (i) => sloopOf(i)?.localToWorld(V3(0, SLOOP_DECK + 0.3, 0)) ?? null;

/** A fresh voyage: none on the water, nothing said. */
export function fieldReset() {
  field.said = '';
  for (const B of field.boats) { B.g.visible = false; B.at = null; B.who.hush(); }
}
