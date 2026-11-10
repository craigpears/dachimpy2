// Dignity, the imperial checkpoint's commander, on its gate (her look: PIRATES.Dignity, with Bella,
// her lavender monkey, on her shoulder and her spyglass in hand); her little cutscene the first time
// you sail up, and her lines after, over her head. (The rules: src/den-dignity.ts; the cutscene
// machinery: cine.js. The checkpoint itself: checkpoint.js.)
import * as THREE from 'three';
import { LAY } from '../den-sail.js';
import { SAYS, BEATS, Dignity, sceneAt, missAt, readSecs, fromGate, bellaGun, heard } from '../den-dignity.js';
import { PIRATES, familiarTick } from '../den-look.js';
import { scene, mat, mesh, makePirate, V3, burst, worldLets, shake, warm } from './world.js';
import { seaX, seaZ, sail } from './sea.js';
import { cp } from './checkpoint.js';
import { cine, cinePlay, cineEnd, bubble, bubbleAt } from './cine.js';

/* The user (10 Nov): "the dutiful commander of the imperial checkpost, kind of peering down from
   the gates", and "we've really got to go all in with Dignity's little cutscene. She's got to be
   very cute ... the little monkey is the one that fires the cannon at you." So she stands on top
   of the gatehouse, between its battlements, the Empire's flag behind her; and Bella scampers off
   her shoulder, along the gatehouse's top and down onto one of its bastions, to fire its own gun,
   the real one that shoots at you ("try and keep it more real to what actually fires at you"). */
const K = LAY.CHECKPOINT, GATE = { c: K.GATE, r: K.ROW };
const TOP = 8.0;   // the gatehouse's top, where she stands (checkpoint.js: its arch, ARCH_Y + 1.6)
const SC = 1.15;   // (a touch big, so she reads from the sea)
const HEAD = 2.25 * SC;   // her speech bubble, over her head
export const dig = { rules: new Dignity(), W: null, play: null, line: null, next: null, idle: 3 };

// ---------- her, Bella and how they move ----------
/* The bastion gun Bella fires (checkpoint.js's turret, its gun along its own -z), and the points on
   it she wants, in the gun's own frame: its muzzle, its touch-hole and where she perches, on its
   breech. */
const GUN = { muzzle: V3(0, 0.3, -0.85), touch: V3(0, 0.52, 0.5), perch: V3(0, 0.5, 0.62) };
const bastion = (W) => cp.W?.bastions[W.gunI];
const gunWorld = (W, v) => { const B = bastion(W); B.g.updateMatrixWorld(true); return B.gun.localToWorld(v.clone()); };
// The little stick with a glowing match Bella lights the fuse with.
function linstock() {
  const g = new THREE.Group();
  const stick = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), mat('#6b4524'), false); stick.position.y = -0.06;
  const glow = mesh(new THREE.SphereGeometry(0.016, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffb347' }), false); glow.position.y = -0.14;
  g.add(stick, glow);
  g.position.set(0, -0.09, 0.02);
  g.rotation.x = -0.9;
  return g;
}

// The shot and the column of water it throws up: one of each, for every time the scene plays.
const ballGeo = new THREE.SphereGeometry(0.13, 10, 8), ballMat = mat('#2a2d31', { metalness: 0.6 });
const colGeo = new THREE.CylinderGeometry(0.35, 0.75, 1, 12, 1, true), colMat = new THREE.MeshBasicMaterial({ color: '#eef8fb', transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });

const DOWN = V3(0, -1, 0), FWD = V3(0, 0, 1);
/* A pose for arm i: pointing along `dir` (her body's own frame: +z ahead, +x her left), and her
   spyglass (in her right hand, arm 0) along `spy`. */
function armPose(p, i, dir, spy = null, slide = 0) {
  const arm = new THREE.Quaternion().setFromUnitVectors(DOWN, dir.clone().normalize());
  const along = spy && spy.clone().normalize().applyQuaternion(arm.clone().invert());
  const held = along && i === 0 && p.held ? new THREE.Quaternion().setFromUnitVectors(FWD, along) : null;
  return { i, arm, held, slide: held ? along.multiplyScalar(slide) : null };   // (slid along itself: its eyepiece to her eye)
}
// From her shoulder to a point (her body's frame).
const toward = (p, i, x, y, z) => V3(x, y, z).sub(p.arms[i].position);
function poses(p) {
  return {
    // Her spyglass to her left eye (her right's under the patch), looking out and a little down.
    spy: armPose(p, 0, toward(p, 0, 0.17, 0.99, 0.3), V3(-0.06, 0.02, 1), 0.12),
    // Lowered to her chest, still out in front.
    low: armPose(p, 0, V3(0.15, -0.55, 0.8), V3(0.05, 0.1, 1)),
    // Pointing it at you: "Halt!", "Look lively!"
    point: armPose(p, 0, V3(0.05, -0.15, 1), V3(0.05, -0.15, 1)),
    // Wagging it at you, like a finger: "Come any closer..."
    wag: armPose(p, 0, V3(0.2, 0.9, 0.45), V3(0.15, 1, 0.1)),
    // A hand to her forehead: "...oh. Pirates."
    palm: armPose(p, 0, toward(p, 0, 0.0, 1.0, 0.3), V3(0.6, 0.6, 0.3)),
    // Her left hand to her mouth: the giggle.
    mouth: armPose(p, 1, toward(p, 1, 0.02, 0.84, 0.34)),
    // Both up: cross ("Imperial property!"), or thrown up ("Nobody!").
    upR: armPose(p, 0, V3(-0.35, 1, 0.25), V3(-0.2, 1, 0.3)),
    upL: armPose(p, 1, V3(0.35, 1, 0.25)),
  };
}
// Arm i between poses a and b (null: hanging at rest) by k, the spyglass with it.
function poseArm(W, i, a, b, k) {
  const p = W.p, r = W.rest, arm = p.arms[i];
  arm.quaternion.slerpQuaternions(a ? a.arm : r.arm[i], b ? b.arm : r.arm[i], k);
  if (i === 0 && p.held) {
    p.held.quaternion.slerpQuaternions(a?.held || r.held, b?.held || r.held, k);
    p.held.position.copy(r.heldAt);
    if (a?.slide) p.held.position.addScaledVector(a.slide, 1 - k);
    if (b?.slide) p.held.position.addScaledVector(b.slide, k);
  }
}
const ease = (u) => { const v = Math.min(1, Math.max(0, u)); return v * v * (3 - 2 * v); };
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);

function build() {
  const xa = seaX(K.PIERS[0][0]), xb = seaX(K.PIERS[1][0]), mid = (xa + xb) / 2, gz = seaZ(K.ROW);
  const p = makePirate({ look: PIRATES.Dignity });
  p.g.scale.setScalar(SC);
  // (the towers' outer edges, inside their battlements: Bella's way along the top to the bastions)
  const W = { p, at: V3(mid, TOP, gz + 0.55), stick: linstock(), yaw: 0, gunI: 1, edge: [xa - 1.3, xb + 1.3] };
  p.g.position.copy(W.at);
  scene.add(p.g);
  W.rest = { arm: p.arms.map((a) => a.quaternion.clone()), held: p.held?.quaternion.clone(), heldAt: p.held?.position.clone() };
  W.home = { p: p.fam.g.position.clone(), q: p.fam.g.quaternion.clone(), s: p.fam.g.scale.clone() };
  W.pose = poses(p);
  W.say = bubble('', document.body, 'wrap');   // (on the page: at sea the den's labels are hidden)
  W.chat = bubble('', document.body, 'chat');
  // (the shaders for her scene's linstock, shot and splash, built ahead so it plays smoothly: world.js)
  warm(W.stick, new THREE.Mesh(ballGeo, ballMat), new THREE.Mesh(colGeo, colMat));
  return W;
}
const sloopAt = () => (sail.g ? sail.g.position.clone().setY(0) : V3(seaX(GATE.c), 0, seaZ(GATE.r - 4)));

// Bella back on Dignity's shoulder, as she was.
function bellaHome(W) {
  const f = W.p.fam;
  if (f.g.parent !== W.p.body) W.p.body.add(f.g);
  f.g.position.copy(W.home.p); f.g.quaternion.copy(W.home.q); f.g.scale.copy(W.home.s);
  f.arms.forEach((a, i) => a.rotation.set(-0.75, 0, -0.35 * (i ? 1 : -1)));
  f.head.rotation.set(0, 0, 0); f.mouth.scale.y = 0.3; f.tail.rotation.set(0, 0, 0);
  W.stick.removeFromParent();
}
// Off her shoulder, into the world, where she was.
function bellaOff(W) {
  const f = W.p.fam;
  if (f.g.parent === W.p.body) { W.p.g.updateMatrixWorld(true); scene.attach(f.g); }
}
const shoulder = (W) => { W.p.g.updateMatrixWorld(true); return W.p.body.localToWorld(W.home.p.clone()); };

// ---------- the cutscene ----------
/* Played the first time she sights you from the cove's side (dignityTick), or by the cheat. The
   beats are src/den-dignity.ts's (sceneAt); this draws them. */
export function dignityScene() {
  const W = (dig.W ||= build());
  dig.want = !cp.W;   // (the checkpoint's not built till the sea's first tick: next tick, then)
  if (cine || !cp.W) return;
  dig.rules.met = true;
  // Bella's gun: the bastion on Dignity's left, unless it's wrecked.
  W.gunI = bellaGun(K.GUNS.map(([c]) => c), K.GATE, cp.check.battery.wrecked);
  dig.line = null; W.say.style.display = 'none';
  const ship = sloopAt();
  const c = {
    t: 0, ship, miss: null, ball: null, fired: false, splashed: false, spray: false, fizz: 0, recoil: 0, col: null,
    cam: { look: V3(W.at.x, W.at.y + 1.6 * SC, W.at.z), dist: 5.5, tilt: 0.06, yaw: 0.4 },
    tick: playTick, end: playEnd,
  };
  dig.play = c;
  cinePlay(c);
}
function playEnd() {
  const W = dig.W, c = dig.play;
  dig.play = null;
  if (c?.ball) scene.remove(c.ball);
  if (c?.col) scene.remove(c.col);
  bellaHome(W);
  W.p.arms.forEach((a, i) => a.quaternion.copy(W.rest.arm[i]));
  if (W.p.held) { W.p.held.quaternion.copy(W.rest.held); W.p.held.position.copy(W.rest.heldAt); }
  W.p.body.rotation.set(0, 0, 0);
  W.p.g.position.copy(W.at);
  if (c?.gunAt) bastion(W).gun.position.copy(c.gunAt);
  W.say.style.display = 'none'; W.chat.style.display = 'none';
}
function playTick(dt) {
  const W = dig.W, c = dig.play, t = (c.t += dt), s = sceneAt(t), p = W.p, P = W.pose, f = p.fam;
  if (s.done) { cineEnd(false); return; }
  c.ship = sloopAt();
  const look = yawTo(W.at, c.ship);
  // ---- Dignity ----
  let yaw = look, lean = 0, roll = 0, lift = 0;
  poseArm(W, 1, null, null, 1);
  if (s.beat === 'peer') {
    // Spyglass up, sweeping slowly along the horizon.
    poseArm(W, 0, null, P.spy, ease(t / 0.5));
    yaw = look + Math.sin(t * 1.3 + 0.6) * 0.38 * (1 - ease((t - 1.1) / 0.6));
    lean = 0.04;
  } else if (s.beat === 'lower') {
    // Lowered: she's seen you. A little start.
    poseArm(W, 0, P.spy, P.low, ease(s.u * 1.6));
    lift = Math.sin(Math.min(1, s.u * 1.4) * Math.PI) * 0.1;
    lean = 0.1 * (1 - s.u);
  } else if (s.beat === 'halt') {
    // "Halt!" Pointing it at you, standing tall.
    poseArm(W, 0, P.low, P.point, ease(s.u * 5));
    lean = -0.06;
    lift = s.u < 0.12 ? Math.sin(s.u / 0.12 * Math.PI) * 0.05 : 0;
  } else if (s.beat === 'oh') {
    // "...oh." A beat; then a hand to her forehead, shaking her head.
    if (s.u < 0.25) poseArm(W, 0, P.point, P.point, 1);
    else poseArm(W, 0, P.point, P.palm, ease((s.u - 0.25) * 4));
    lean = s.u < 0.25 ? 0 : 0.12 * ease((s.u - 0.25) * 4);
    if (s.u > 0.4) yaw = look + Math.sin(t * 7) * 0.12;
  } else if (s.beat === 'lively') {
    // "Look lively!" to Bella on her shoulder, then pointing her at you as she goes.
    const turn = t < BEATS.hop ? ease((t - BEATS.lively) * 4) : 1 - ease((t - BEATS.hop) * 3);
    yaw = look + 0.55 * turn;
    poseArm(W, 0, P.palm, P.point, ease(s.u * 6));
    lean = -0.04;
  } else if (s.beat === 'fire') {
    // Watching where it lands, through her spyglass.
    poseArm(W, 0, P.point, P.spy, ease(s.u * 4));
    lean = 0.1;
  } else {
    // The giggle: a little bounce, a hand to her mouth, then wagging her spyglass at you.
    const k = ease(s.u * 8);
    poseArm(W, 1, null, P.mouth, k);
    lift = Math.abs(Math.sin(t * 15)) * 0.06 * (1 - ease((s.u - 0.35) * 3));
    roll = Math.sin(t * 26) * 0.035 * (1 - ease((s.u - 0.35) * 3));
    if (s.u < 0.4) poseArm(W, 0, P.spy, null, ease(s.u * 6));
    else { poseArm(W, 0, null, P.wag, ease((s.u - 0.4) * 6)); p.arms[0].rotateZ(Math.sin(t * 11) * 0.28); }
    yaw = look + 0.2;
  }
  W.yaw += (yaw - W.yaw) * Math.min(1, dt * 8);
  p.g.rotation.y = W.yaw;
  p.body.rotation.set(lean, 0, roll);
  p.g.position.set(W.at.x, W.at.y + lift, W.at.z);
  // ---- Bella ----
  bellaTick(W, c, s, t, dt);
  // ---- the gun and the shot ----
  const gun = bastion(W).gun;
  if (s.bella === 'fuse' && s.bu > 0.45 && (c.fizz -= dt) < 0) { c.fizz = 0.06; burst(gunWorld(W, GUN.touch), '#ffcf6a', 2, 0.9); }
  if (s.shot !== null && !c.fired) {
    c.fired = true;
    c.gunAt = gun.position.clone();
    const g = bastion(W).g.position;
    c.miss = missAt(c.ship, { x: g.x, z: g.z });   // (where she is now)
    const m = gunWorld(W, GUN.muzzle);
    burst(m, '#ffcf6a', 18, 3.2); burst(m, '#cfc6b8', 14, 1.6); burst(m, '#8d8780', 8, 1);
    c.recoil = 0.2;
    worldLets.shake = Math.max(shake, 0.18);
    c.ball = mesh(ballGeo, ballMat);
    c.from = m;
    scene.add(c.ball);
  }
  // (it kicks back along itself, and runs out again)
  c.recoil = Math.max(0, c.recoil - dt * 0.5);
  if (c.gunAt) gun.position.set(c.gunAt.x + Math.sin(gun.rotation.y) * c.recoil, c.gunAt.y, c.gunAt.z + Math.cos(gun.rotation.y) * c.recoil);
  if (c.ball && s.shot !== null) {
    const u = s.shot, to = V3(c.miss.x, 0, c.miss.z);
    c.ball.position.lerpVectors(c.from, to, u);
    c.ball.position.y += Math.sin(u * Math.PI) * 2.6;
  }
  if (c.fired && s.shot === null && !c.splashed) {
    // A near miss: a column of water right beside her, and the spray over her deck.
    c.splashed = true;
    scene.remove(c.ball); c.ball = null;
    const at = V3(c.miss.x, 0.2, c.miss.z);
    burst(at, '#e6f3f6', 34, 5); burst(at, '#9cc8d4', 18, 3);
    c.col = mesh(colGeo, colMat, false);
    c.col.position.copy(at); c.colT = 0;
    scene.add(c.col);
    dig.rock = 1;
    worldLets.shake = Math.max(shake, 0.25);
  }
  if (c.col) {
    const u = (c.colT += dt);
    const h = 3.2 * ease(u / 0.3);
    c.col.scale.set(1 + u * 0.8, Math.max(0.01, h), 1 + u * 0.8);
    c.col.position.y = h / 2;
    c.col.material.opacity = 0.85 * (1 - ease((u - 0.35) / 0.6));
    if (!c.spray && u > 0.15) { c.spray = true; const d = sloopAt(); burst(V3(d.x, 2.2, d.z), '#e6f3f6', 30, 2.4); burst(V3((d.x + c.miss.x) / 2, 2.6, (d.z + c.miss.z) / 2), '#bfe2ec', 16, 2); }
    if (u > 1) { scene.remove(c.col); c.col = null; }
  }
  // ---- what's said ----
  if (s.says && W.say.textContent !== s.says) W.say.textContent = s.says;
  bubbleAt(W.say, !!s.says, p.g.position.x, TOP + HEAD + lift, p.g.position.z);
  if (s.chat && W.chat.textContent !== s.chat) W.chat.textContent = s.chat;
  const bw = new THREE.Vector3(); f.g.getWorldPosition(bw);
  bubbleAt(W.chat, !!s.chat, bw.x, bw.y + 0.55 * SC, bw.z);
  // ---- the camera ----
  shot(W, c, s, t);
}
/* Bella's way down to the gun, in quick monkey bounds (the user, 10 Nov: not "zip wiring in slow
   motion down"): off Dignity's shoulder onto the gatehouse's top, two bounds along it to the tower's
   outer edge, a leap off it and a kick off the tower's face, down onto the bastion's battlements,
   and a hop onto the gun's breech. Where she is `u` of the way, which way she's heading, which bound
   she's on and how far into it. (Back up, the same way backwards.) */
const BOUNDS = [0.1, 0.3, 0.48, 0.64, 0.82, 1];          // (where each bound ends)
const HIGH = [0.3, 0.28, 0.28, 0.45, 0.3, 0.3];          // (how high she goes on it)
function bellaWay(W, u) {
  const B = bastion(W).g.position, side = Math.sign(B.x - W.at.x) || 1, a = W.at, edge = W.edge[side > 0 ? 1 : 0];
  const run = (k) => V3(a.x + side * 0.7 + (edge - a.x - side * 0.7) * k, TOP, a.z + 0.05);
  const pts = [shoulder(W), run(0), run(0.5), run(1), V3(edge + side * 0.55, TOP - 2.6, a.z + 0.3), V3(B.x - side * 1.3, 3.75, B.z + 0.3), gunWorld(W, GUN.perch)];
  const i = BOUNDS.findIndex((e) => u <= e), u0 = i ? BOUNDS[i - 1] : 0, k = Math.min(1, Math.max(0, (u - u0) / (BOUNDS[i] - u0)));
  const from = pts[i], to = pts[i + 1], at = from.clone().lerp(to, k);
  at.y += Math.sin(k * Math.PI) * HIGH[i];
  return { at, yaw: yawTo(from, to), leg: i, k };
}
// Bella's part: chatter on the shoulder, scamper down to the gun, salute, light the fuse, cover her
// ears, the boom, a proud little pose, and a scamper back up.
function bellaTick(W, c, s, t, dt) {
  const f = W.p.fam, b = s.bella, u = s.bu;
  const [ar, al] = f.arms;
  const perch = () => gunWorld(W, GUN.perch);
  const facing = yawTo(bastion(W).g.position, c.ship);
  f.mouth.scale.y = 0.3;
  if (b === 'shoulder') {
    if (f.g.parent !== W.p.body) bellaHome(W);
    familiarTick(f, dt);
    return;
  }
  if (b === 'chatter') {
    // Eek eek! Bouncing on her shoulder, arms waving, mouth going.
    if (f.g.parent !== W.p.body) bellaHome(W);
    f.g.position.copy(W.home.p).setY(W.home.p.y + Math.abs(Math.sin(t * 18)) * 0.05);
    f.mouth.scale.y = 0.3 + Math.abs(Math.sin(t * 24)) * 0.9;
    f.head.rotation.set(Math.sin(t * 20) * 0.15, 0.4, 0);
    ar.rotation.set(-2.2 + Math.sin(t * 16) * 0.6, 0, 0.3);
    al.rotation.set(-2.2 - Math.sin(t * 16) * 0.6, 0, -0.3);
    f.tail.rotation.y = Math.sin(t * 12) * 0.6;
    return;
  }
  if (b === 'hop' || b === 'home') {
    // Scampering down to the gun (or back up to her shoulder): arms up for the hops and the leap,
    // going like the clappers along the top, a squash as she lands.
    bellaOff(W);
    const w = bellaWay(W, b === 'hop' ? u : 1 - u), back = b === 'home';
    f.g.position.copy(w.at);
    // Tucked up in the air, arms reaching at the top of each bound; squashed as she lands, then off.
    const air = Math.sin(w.k * Math.PI), land = w.k < 0.12 ? (0.12 - w.k) * 2.5 : w.k > 0.88 ? (w.k - 0.88) * 2.5 : 0;
    f.g.rotation.set((back ? -1 : 1) * (0.5 - w.k) * 0.6, w.yaw + (back ? Math.PI : 0), 0);
    f.g.scale.set(SC * (1 + land), SC * (1 - land), SC * (1 + land));
    ar.rotation.set(-1.2 - air * 1.7, 0, 0.3 + air * 0.4); al.rotation.set(-1.2 - air * 1.7, 0, -0.3 - air * 0.4);
    f.tail.rotation.set(-0.3 - air * 0.6, Math.sin(t * 9) * 0.5, 0);
    f.head.rotation.set(w.leg === 4 ? 0.35 : -0.15, 0, 0);
    if (back && u >= 0.98) bellaHome(W);
    return;
  }
  // At the gun.
  bellaOff(W);
  f.g.scale.setScalar(SC);
  const at = perch();
  f.g.position.copy(at);
  f.g.rotation.set(0, facing, 0);
  f.head.rotation.set(0, 0, 0);
  if (b === 'salute') {
    // A smart salute, very stiff, tail straight up.
    ar.rotation.set(-2.75, 0, 0.3);
    al.rotation.set(0, 0, -0.15);
    f.tail.rotation.set(-0.4, 0, 0);
    f.head.rotation.x = -0.15;
    f.g.position.y += u < 0.2 ? Math.sin(u / 0.2 * Math.PI) * 0.04 : 0;
  } else if (b === 'fuse') {
    // Leaning in with the linstock to the touch-hole.
    if (W.stick.parent !== ar) ar.add(W.stick);
    ar.rotation.set(-1.1 - Math.sin(u * Math.PI) * 0.4, 0, 0.2);
    al.rotation.set(-0.4, 0, -0.9);   // (the other arm out for balance)
    f.g.rotation.x = 0.25 * Math.sin(Math.min(1, u * 2) * Math.PI / 2);
    f.head.rotation.x = 0.3;
    f.tail.rotation.y = Math.sin(t * 6) * 0.3;
  } else if (b === 'ears' || (b === 'boom' && u < 0.45)) {
    // Ears covered, eyes screwed up (head down), trembling; at the boom, a jump.
    W.stick.removeFromParent();
    ar.rotation.set(-2.95, 0, -0.18);
    al.rotation.set(-2.95, 0, 0.18);
    f.head.rotation.x = 0.25;
    f.g.scale.set(SC * 1.06, SC * 0.92, SC * 1.06);
    f.g.position.x += Math.sin(t * 60) * 0.008;
    if (b === 'boom') f.g.position.y += Math.sin(Math.min(1, u / 0.25) * Math.PI) * 0.18;
  } else if (b === 'boom') {
    // Peeking: one ear uncovered, looking out to see where it went.
    ar.rotation.set(-2.95, 0, -0.18);
    al.rotation.set(-0.8, 0, -0.3);
    f.head.rotation.set(-0.1, 0, 0.2);
  } else if (b === 'proud') {
    // So proud of herself: chest out, chin up, a fist pumped in the air, the other on her hip.
    const pump = Math.abs(Math.sin(t * 9));
    al.rotation.set(-2.6 - pump * 0.4, 0, 0.2);
    ar.rotation.set(0.2, 0, -0.9);
    f.head.rotation.set(-0.3, 0, Math.sin(t * 5) * 0.12);
    f.g.rotation.x = -0.15;
    f.g.position.y += Math.abs(Math.sin(t * 9)) * 0.05;
    f.tail.rotation.set(-0.5, Math.sin(t * 8) * 0.4, 0);
    if (u < 0.6) f.mouth.scale.y = 0.3 + Math.abs(Math.sin(t * 20)) * 0.9;
  }
}
// Where the camera is: close on her with her spyglass, on her and the gun, out with the shot to the
// sloop for the splash, and back for the giggle.
function shot(W, c, s, t) {
  const cam = c.cam, a = W.at;
  if (s.cam === 'her' && s.beat === 'giggle') { cam.look.set(a.x + 0.65, a.y + 1.35 * SC, a.z + 0.25); cam.dist = 4.4; cam.tilt = 0.18; cam.yaw = 0.25; }
  else if (s.cam === 'her') {
    const push = s.beat === 'peer' ? 1 - ease(t / 2) : 0;
    cam.look.set(a.x + 0.15, a.y + 1.55 * SC, a.z + 0.1); cam.dist = 3.9 + push * 2; cam.tilt = 0.06 + (1 - push) * 0.04; cam.yaw = 0.55 - push * 0.2;
  } else if (s.cam === 'gun' && s.bella !== 'chatter') {
    // With Bella all the way down to the gun (one steady angle, drawing back as she goes and in
    // again once she's there), then close on her at it.
    const b = new THREE.Vector3(); W.p.fam.g.getWorldPosition(b);
    const there = ['salute', 'fuse', 'ears', 'boom', 'proud'].includes(s.bella);
    cam.look.set(b.x, b.y + 0.3, b.z); cam.dist = there ? 3 : 4.5 + Math.sin(s.bu * Math.PI) * 3; cam.tilt = there ? 0.16 : 0.24; cam.yaw = 0.45;
  } else if (s.cam === 'gun') { cam.look.set(a.x + 0.5, a.y + 1.3 * SC, a.z + 0.3); cam.dist = 4.2; cam.tilt = 0.18; cam.yaw = 0.3; }
  else {
    const at = c.ball ? c.ball.position : c.miss ? V3(c.miss.x, 0.8, c.miss.z) : c.ship, d = c.ship;
    cam.look.set(at.x * 0.6 + d.x * 0.4, Math.min(at.y, 4) * 0.5 + 0.8, at.z * 0.6 + d.z * 0.4);
    cam.dist = 10; cam.tilt = 0.32; cam.yaw = 1.05;
  }
}

// ---------- each tick, and her lines ----------
/* Her line for something that's happened at the checkpoint, over her head (said once each:
   src/den-dignity.ts): 'wrecked' (a gun of hers), 'passed' (you got through), 'canal' (you came
   round by the locks). Held till a cutscene's over. */
export function dignitySay(line) {
  dig.W ||= build();
  const text = dig.rules.say(line);
  if (!text) return;
  if (cine) dig.next = { text, line };
  else speak(text, line);
}
function speak(text, kind) {
  dig.line = { text, kind, t: 0, secs: readSecs(text) };
  dig.W.say.textContent = text;
}
/* Each tick at sea, before the checkpoint says what she's done (checkpoint.js): her square (Helm.pose).
   The first time she's in sight from the cove's side, the cutscene (so the checkpoint holds its
   own words till it's over); then "one more stroke" as she comes closer. */
export function dignityWatch(ship) {
  dig.W ||= build();
  if (cine) return;
  const { near, before } = fromGate(ship, GATE);
  const e = dig.rules.watch(near, before);
  if (e === 'scene') dignityScene();
  else if (e === 'closer') speak(SAYS.closer, 'closer');
}
// Something's happened at the checkpoint (its own events: a shot of hers on it, or what she's done).
export function dignityHeard(e) {
  const line = heard(e);
  if (line) dignitySay(line);
}
/* Every tick (den.js, after the sea's): her on the gate, `ship` her square at sea (Helm.pose), or null
   ashore. */
export function dignityTick(dt, ship) {
  const W = (dig.W ||= build());
  if (dig.want && cp.W && !cine) dignityScene();
  // The splash rocks her a moment (after sailing.js has set her for this frame).
  if (dig.rock > 0 && sail.g) { dig.rock = Math.max(0, dig.rock - dt * 0.9); sail.g.rotation.z += Math.sin(dig.rock * 18) * 0.14 * dig.rock; }
  if (dig.play) return;   // (the cutscene draws her)
  if (dig.next && !cine) { speak(dig.next.text, dig.next.line); dig.next = null; }
  idle(W, dt, ship);
}
// On the gate between times: facing you when you're about, now and then peering out with her
// spyglass, Bella fidgeting on her shoulder; and whatever she's saying, with a gesture to it.
function idle(W, dt, ship) {
  const p = W.p, P = W.pose, l = dig.line, t = performance.now() / 1000;
  const near = ship ? fromGate(ship, GATE).near : 99;
  const want = near <= 8 ? yawTo(W.at, sloopAt()) : 0;
  W.yaw += (want - W.yaw) * Math.min(1, dt * 2);
  let yaw = W.yaw, lift = 0, lean = 0;
  dig.idle -= dt;
  if (dig.idle < -3) dig.idle = 6 + Math.random() * 6;
  const peer = dig.idle < 0 ? ease(Math.min(-dig.idle, 3 + dig.idle) * 2.5) : 0;   // (up, a look, down)
  poseArm(W, 1, null, null, 1);
  if (l) {
    l.t += dt;
    const k = ease(l.t * 4) * (1 - ease((l.t - l.secs + 0.4) * 3));
    if (l.kind === 'closer' || l.kind === 'passed') {
      poseArm(W, 0, null, P.wag, k); p.arms[0].rotateZ(Math.sin(t * 11) * 0.28 * k);
      if (l.kind === 'passed') { yaw += 0.7 * k; lean = -0.1 * k; }   // (nose in the air)
    } else {
      poseArm(W, 0, null, P.upR, k); poseArm(W, 1, null, P.upL, k);
      p.arms[0].rotateZ(Math.sin(t * 17) * 0.2 * k); p.arms[1].rotateZ(-Math.sin(t * 17) * 0.2 * k);
      lift = Math.abs(Math.sin(t * 10)) * 0.08 * k;   // (hopping mad)
    }
    if (l.t > l.secs) dig.line = null;
  } else {
    poseArm(W, 0, null, P.spy, peer);
    lean = 0.1 * peer;
    yaw += Math.sin(t * 0.9) * 0.3 * peer;
  }
  p.g.rotation.y = yaw;
  p.body.rotation.set(lean, 0, 0);
  p.g.position.set(W.at.x, W.at.y + lift, W.at.z);
  familiarTick(p.fam, dt);
  bubbleAt(W.say, !!dig.line && sail.on, W.at.x, TOP + HEAD + lift, W.at.z);
  // (kept on the screen: at sea she's often at the top of the view)
  if (parseFloat(W.say.style.top) < 90) W.say.style.top = '90px';
}
// A new game: she's never met you.
export function dignityReset() {
  if (dig.play) cineEnd(true);
  dig.rules = new Dignity();
  dig.line = null; dig.next = null; dig.rock = 0; dig.want = false;
  if (dig.W) dig.W.say.style.display = 'none';
}
