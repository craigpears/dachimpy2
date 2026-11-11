// A destructible gun at sea, in 3D: the one look for every gun that shoots at her (its rules:
// src/den-turret.ts). A round stone tower with a gun on top that turns to aim; its shots on their
// arc, a red ring on the water where one aimed at her will come down; quiet after a hit, smoking;
// and wrecked, the gun topples off, the battlements fly apart and the tower sinks to a scorched,
// smoking stump. A place puts one down and sets its look (the checkpoint's bastions: checkpoint.js).
import * as THREE from 'three';
import { scene, mat, mesh, V3, burst, worldLets, shake, flagpole, warm } from './world.js';
import { rock } from './land.js';
import { gunMesh } from './gun.js';

/* `look`: the stone's colour, the tower's top and foot radius and height, a coloured band below its
   battlements, a flag on its top, rocks round its foot. */
export function turretMesh({ stone = '#8a8178', top = 1.15, foot = 1.35, height = 3.2, band = null, flag = null, rocks = 0, merlons = 8 } = {}) {
  const g = new THREE.Group(), st = mat(stone, { flatShading: true, roughness: 0.9 });
  const body = mesh(new THREE.CylinderGeometry(top, foot, height, 14), st); body.position.y = height / 2 - 0.2;
  g.add(body);
  const intact = [body];
  if (band) { const b = mesh(new THREE.CylinderGeometry(top + 0.03, top + 0.03, 0.3, 14), mat(band, { roughness: 0.8 })); b.position.y = height - 0.5; g.add(b); intact.push(b); }
  const rim = top * 0.9, ty = height - 0.2;
  for (let i = 0; i < merlons; i++) { const a = i / merlons * Math.PI * 2, m = mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), st); m.position.set(Math.cos(a) * rim, ty + 0.22, Math.sin(a) * rim); m.rotation.y = -a; g.add(m); intact.push(m); }
  const gun = gunMesh(); gun.scale.setScalar(0.9); gun.position.y = ty;
  g.add(gun); intact.push(gun);
  if (flag) { const fl = flagpole(1.6, flag); fl.position.set(-top * 0.6, ty, top * 0.6); g.add(fl); intact.push(fl); }
  for (let i = 0; i < rocks; i++) g.add(rock((Math.random() - 0.5) * 3, 0.2, (Math.random() - 0.5) * 3, 0.8 + Math.random() * 0.5));
  // Its wreck, hidden till it's wrecked: a broken stump, scorched, embers in it, its stones and gun
  // tumbled round it.
  const scorch = mat('#3e3935', { flatShading: true }), ruin = new THREE.Group(), sh = height * 0.65;
  const stump = mesh(new THREE.CylinderGeometry(top * 0.92, foot, sh, 12), scorch); stump.position.y = sh / 2 - 0.1;
  ruin.add(stump);
  for (let i = 0; i < 7; i++) { const a = i / 9 * Math.PI * 2 + 0.3, ht = 0.3 + ((i * 7) % 5) * 0.16, b = mesh(new THREE.BoxGeometry(0.44, ht, 0.44), i % 2 ? st : scorch); b.position.set(Math.cos(a) * top * 0.85, sh - 0.1 + ht / 2, Math.sin(a) * top * 0.85); b.rotation.y = -a; ruin.add(b); }
  const ember = new THREE.MeshBasicMaterial({ color: '#ff8a2a' });
  for (let i = 0; i < 6; i++) { const e = mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), ember, false); e.position.set(Math.cos(i * 1.9) * top * 0.45, sh - 0.08, Math.sin(i * 1.9) * top * 0.45); e.rotation.y = i; ruin.add(e); }
  for (let i = 0; i < 10; i++) { const a = i * 2.4, k = foot + 0.2 + (i % 3) * 0.35, b = mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), i % 3 ? st : scorch); b.position.set(Math.cos(a) * k, 0.6 + (i % 2) * 0.2, Math.sin(a) * k); b.rotation.set(i * 0.7, i * 1.3, i * 0.4); ruin.add(b); }
  const barrel = gunMesh(); barrel.scale.setScalar(0.8); barrel.position.set(foot + 0.1, 0.8, 0.8); barrel.rotation.set(0.5, 0.9, 1.2); ruin.add(barrel);
  ruin.visible = false;
  g.add(ruin);
  // (a shot's ball and ring, its shaders built ahead: its wreck's are, with the scene's)
  if (!warmed) { warmed = true; warm(new THREE.Mesh(ballGeo, ballMat), new THREE.Mesh(ringGeo, ringMat())); }
  return { g, gun, body, intact, ruin, ty, wrecked: false, fall: undefined, smokeT: 0 };
}

// Standing, or its wreck.
function look(V, wrecked) {
  V.wrecked = wrecked;
  V.fall = undefined;
  for (const o of V.intact) { o.visible = !wrecked; if (o.userData.home) { o.position.copy(o.userData.home); o.rotation.copy(o.userData.turn); } }
  V.body.scale.y = 1;
  V.ruin.visible = wrecked;
}
// Wrecked, it comes down: its gun topples off the top and splashes down, its battlements fly
// apart, the tower shudders and sinks onto its rock, then there's the smoking stump.
function fall(V, dt) {
  const T = 1.4, u = Math.min(1, (V.fall += dt) / T), tw = V.g.position;
  for (const o of V.intact) if (!o.userData.home) { o.userData.home = o.position.clone(); o.userData.turn = o.rotation.clone(); }
  V.body.scale.y = 1 - 0.45 * u * u;
  V.body.position.x = Math.sin(V.fall * 40) * 0.08 * (1 - u);
  V.intact.forEach((o, i) => {
    if (o === V.body) return;
    const h = o.userData.home, a = Math.atan2(h.z, h.x) || i;
    o.position.set(h.x + Math.cos(a) * u * 2.5, h.y + 1.6 * u - 5.2 * u * u, h.z + Math.sin(a) * u * 2.5);
    o.rotation.set(o.userData.turn.x + u * 3, o.userData.turn.y, o.userData.turn.z + u * (o === V.gun ? 1.6 : 2.5));
  });
  if ((V.smokeT -= dt) < 0) { V.smokeT = 0.08; burst(V3(tw.x, 2 + Math.random(), tw.z), '#3f3a37', 4, 1.6); }
  if (u >= 1) { burst(V3(tw.x + 2, 0.3, tw.z + 1), '#e6f3f6', 18, 3.5); burst(V3(tw.x, 1.5, tw.z), '#8a8178', 16, 3); look(V, true); }
}
// The moment it's wrecked: a blast of fire, smoke and stone where her shot came down (`at`), and the
// tower starts to come down.
export function turretWrecked(V, at) {
  const tw = V.g.position, y = V.ty;
  burst(V3(tw.x, y + 0.4, tw.z), '#ffb85a', 36, 6); burst(V3(tw.x, y, tw.z), '#ff7a2a', 20, 4.5); burst(V3(tw.x, y - 0.6, tw.z), '#3f3a37', 30, 4);
  burst(V3(tw.x, y - 1.2, tw.z), '#8a8178', 24, 5.5); burst(at, '#e6f3f6', 16, 4);
  V.fall = 0;
  worldLets.shake = Math.max(shake, 0.6);
}
// Each frame: it looks as its rules say (`t`, a Turret): coming down, a stump, smoking while quiet;
// its gun turned toward (x, z), if there's somewhere to aim, while it stands.
export function turretView(V, t, dt, aim = null) {
  const tw = V.g.position;
  if (V.fall !== undefined) fall(V, dt);
  else if (t.wrecked !== V.wrecked) look(V, t.wrecked);
  if (t.wrecked) { if ((V.smokeT -= dt) < 0) { V.smokeT = 0.14; burst(V3(tw.x + 0.2, V.ty * 0.8, tw.z), '#3f3a37', 4, 0.9); } }
  else if (t.quiet > 0 && (V.smokeT -= dt) < 0) { V.smokeT = 0.25; burst(V3(tw.x, V.ty + 0.8, tw.z), '#6f6a66', 2, 0.6); }
  if (t.wrecked || !aim) return;
  const gp = V3();
  V.gun.getWorldPosition(gp);
  let d = Math.atan2(-(aim.x - gp.x), -(aim.z - gp.z)) - V.gun.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  V.gun.rotation.y += Math.sign(d) * Math.min(Math.abs(d), dt * 2);
}

// ----- its shots -----
// (One ball and one ring for every shot, each ring's own see-through material freed as it lands: made
// afresh and never freed, they piled up with every shot.)
const ballGeo = new THREE.SphereGeometry(0.24, 10, 8), ballMat = mat('#2a2d31', { metalness: 0.6 });
const ringGeo = new THREE.RingGeometry(1.5, 1.9, 32).rotateX(-Math.PI / 2);   // (wide enough to show round her hull)
const ringMat = () => new THREE.MeshBasicMaterial({ color: '#e0412e', transparent: true, opacity: 0.85, depthWrite: false, fog: false });
const shots = [];
let warmed = false;
// A shot's done: off the water, its ring's material freed.
function gone(v) {
  scene.remove(v.ball);
  if (v.ring) { scene.remove(v.ring); v.ring.material.dispose(); }
}
/* A shot fired (a 'fire' event from its Turret): out of its muzzle, onto the square `to` (in the world:
   `where`), on an arc; one aimed at her has a red ring on the water where it'll come down, so you can
   see it coming and get out from under it. `owner` tells whose it is when it lands. */
export function turretFire(V, e, where, owner = V) {
  V.gun.updateMatrixWorld(true);
  const from = V.gun.localToWorld(V3(0, 0.3, -0.85));
  burst(from, '#ffcf6a', 14, 3); burst(from, '#cfc6b8', 10, 1.8);
  const ball = mesh(ballGeo, ballMat);
  scene.add(ball);
  let ring = null;
  if (e.aimed) {
    ring = new THREE.Mesh(ringGeo, ringMat());
    ring.position.copy(where).setY(where.y + 0.1);
    ring.renderOrder = 3;
    scene.add(ring);
  }
  shots.push({ owner, to: e.to, t: 0, secs: e.secs, from, at: where.clone(), ball, ring, aimed: e.aimed });
}
// A shot comes down (a 'land' event): a splash, or a hit on her.
export function turretLand(owner, e) {
  const i = shots.findIndex((v) => v.owner === owner && v.to[0] === e.to[0] && v.to[1] === e.to[1]);
  const v = i >= 0 ? shots.splice(i, 1)[0] : null;
  if (v) gone(v);
  const at = v ? v.at.clone().setY(v.at.y + 0.3) : null;
  if (!at) return;
  if (!e.hit) { burst(at, '#e6f3f6', 20, 4); burst(at, '#9cc8d4', 10, 2.5); return; }
  burst(at.setY(at.y + 0.8), '#ffb85a', 18, 4); burst(at, '#5a4630', 16, 3.5); burst(at, '#e6f3f6', 10, 3);
  worldLets.shake = Math.max(shake, 0.45);
}
// Shots on their way (each frame), and whether any is coming down on that square just now.
export function turretShotsTick(dt) {
  for (const v of shots) {
    v.t += dt;
    const u = Math.min(1, v.t / v.secs), to = v.at.clone().setY(v.at.y + 0.3);
    v.ball.position.lerpVectors(v.from, to, u);
    v.ball.position.y += Math.sin(u * Math.PI) * (v.aimed ? 4 : 1.5);
    if (v.ring) v.ring.material.opacity = 0.5 + 0.4 * Math.sin(v.t * 14);
  }
}
export const shotComing = (c, r) => shots.some((v) => v.to[0] === c && v.to[1] === r);
// Every shot in the air gone (a new game).
export function turretShotsClear() { for (const v of shots.splice(0)) gone(v); }
