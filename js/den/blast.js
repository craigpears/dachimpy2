// A blast, for anything that blows up (Helium's distillery first: distillery.js): a flash on the screen, a
// fireball, sparks, a smoke cloud that lingers and drifts off, and bits flying (copper, staves, shingles: any
// materials handed in) that come down, bounce, lie a while and sink away. And a lone puff of smoke (a
// chimney's). Every piece is made once and pooled, and warmed with the scene (world.js, warm), so a bang
// never stalls the game. Funny, not grim: big and loud-looking, nobody hurt.
import * as THREE from 'three';
import { scene, camera, burst, worldLets, shake, warm } from './world.js';

const ball = new THREE.IcosahedronGeometry(1, 2), lump = new THREE.IcosahedronGeometry(1, 1), cube = new THREE.BoxGeometry(1, 1, 1);
const FIRE = ['#fff6c8', '#ffd04a', '#ff8a24', '#e0461a', '#ffb347'].map((c) => new THREE.Color(c));
const SMOKE = ['#2b2724', '#3a3532', '#4d4845', '#5e5955'].map((c) => new THREE.Color(c));
const group = new THREE.Group();
group.name = 'blasts';
scene.add(group);
const pool = (n, make) => Array.from({ length: n }, () => { const m = make(); m.visible = false; m.userData.t = -1; group.add(m); return m; });
const fires = pool(14, () => new THREE.Mesh(ball, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
const puffs = pool(64, () => { const m = new THREE.Mesh(lump, new THREE.MeshStandardMaterial({ roughness: 1, transparent: true, depthWrite: false, flatShading: true })); m.castShadow = false; return m; });
const bits = pool(48, () => { const m = new THREE.Mesh(cube, new THREE.MeshStandardMaterial()); m.castShadow = true; return m; });
/** Its shaders built ahead, once, by whatever's going to blow up, as it's built (world.js, warm): the first
    bang never stalls. */
let warmed = false;
export function readyBlasts() {
  if (warmed) return;
  warmed = true;
  // (shown just while it's handed over, so every piece's shader is built, not only the shown ones)
  const all = [...fires, ...puffs, ...bits];
  all.forEach((m) => { m.visible = true; });
  warm(group);
  all.forEach((m) => { m.visible = false; });
}
const free = (list) => list.find((m) => m.userData.t < 0) ?? list.reduce((a, m) => (m.userData.t > a.userData.t ? m : a));
const rnd = (a, b) => a + Math.random() * (b - a);

/** A puff of smoke at `at` (a Vector3): `size` it grows to, `life` seconds, `rise` metres a second, `dark` 0
    (pale) to 1 (soot), `delay` before it shows. */
export function puff(at, { size = 0.8, life = 4, rise = 0.8, dark = 0.3, delay = 0, drift = 0.25 } = {}) {
  const m = free(puffs), u = m.userData;
  m.position.copy(at);
  m.material.color.copy(SMOKE[Math.min(SMOKE.length - 1, Math.floor((1 - dark) * SMOKE.length))]).lerp(new THREE.Color('#8a8580'), (1 - dark) * 0.6);
  m.material.opacity = 0;
  m.rotation.set(rnd(0, 6), rnd(0, 6), 0);
  Object.assign(u, { t: -delay - 1e-6, life, size: size * rnd(0.8, 1.2), v: new THREE.Vector3(rnd(-drift, drift), rise * rnd(0.7, 1.2), rnd(-drift, drift)), kind: 'puff' });
  m.scale.setScalar(0.01);
}

const near = (at, far = 45) => camera.position.distanceTo(at) < far;
let flashEl = null;
/** The screen lights up a moment, round where the blast is (`at`), `k` how bright (0 to 1). */
function flash(at, k) {
  const p = at.clone().project(camera);
  if (p.z > 1 || Math.abs(p.x) > 1.6 || Math.abs(p.y) > 1.6) return;
  if (!flashEl) {
    flashEl = document.createElement('div');
    flashEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:25;opacity:0;transition:opacity .7s ease-out';
    document.body.append(flashEl);
  }
  const x = (p.x + 1) / 2 * 100, y = (1 - p.y) / 2 * 100;
  flashEl.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,250,225,.95), rgba(255,170,60,.6) 30%, rgba(255,90,20,.18) 60%, rgba(255,60,0,0) 85%)`;
  flashEl.style.transition = 'none';
  flashEl.style.opacity = String(Math.min(1, k));
  void flashEl.offsetWidth;
  flashEl.style.transition = 'opacity .7s ease-out';
  flashEl.style.opacity = '0';
}

/** A blast at `at` (a Vector3, world), `size` 1 for an ordinary bang (2 a big one). `bits`: what flies,
    [{ mat, n, w, h, d }] (a material, how many, a piece's size in metres); `ground(x, z)` the height they
    land at (below 0: the sea, where they sink). */
export function blast(at, size = 1, { bits: kinds = [], ground = () => 0 } = {}) {
  // The flash, and the camera shaken, if you're near enough to see it.
  if (near(at)) {
    flash(at, 0.55 + 0.25 * size);
    worldLets.shake = Math.max(shake, 0.45 * size);
  }
  // The fireball: a white-hot core and balls of flame rolling up out of it.
  for (let i = 0; i < 6 + Math.round(3 * size); i++) {
    const m = free(fires), u = m.userData, core = i === 0;
    m.position.copy(at).add(new THREE.Vector3(rnd(-0.5, 0.5), rnd(-0.2, 0.6), rnd(-0.5, 0.5)).multiplyScalar(core ? 0 : size));
    m.material.color.copy(FIRE[core ? 0 : 1 + (i % (FIRE.length - 1))]);
    m.material.opacity = 1;
    Object.assign(u, { t: 0, life: core ? 0.25 : rnd(0.8, 1.3), size: (core ? 2.6 : rnd(0.9, 1.5)) * size, v: new THREE.Vector3(rnd(-0.6, 0.6), rnd(1.2, 2.6), rnd(-0.6, 0.6)), kind: 'fire' });
    m.scale.setScalar(0.2);
  }
  // Sparks, and the smoke after: a dark cloud that boils up, spreads and hangs about.
  burst(at, '#ffd04a', Math.round(30 * size), 8);
  burst(at, '#ff7a1a', Math.round(20 * size), 10);
  for (let i = 0; i < Math.round(16 * size); i++) {
    puff(at.clone().add(new THREE.Vector3(rnd(-0.7, 0.7), rnd(-0.2, 0.9), rnd(-0.7, 0.7)).multiplyScalar(size)),
      { size: rnd(1.0, 1.8) * size, life: rnd(7, 11), rise: rnd(0.12, 0.5), dark: rnd(0.6, 1), delay: rnd(0.05, 0.5), drift: 0.7 });
  }
  // Bits flying: up and out, tumbling.
  for (const k of kinds) {
    for (let i = 0; i < Math.round(k.n * size); i++) {
      const m = free(bits), u = m.userData, a = Math.random() * Math.PI * 2, out = rnd(1.2, 3.5) * Math.sqrt(size);
      m.material = k.mat;
      m.position.copy(at);
      m.scale.set(k.w * rnd(0.6, 1.2), k.h * rnd(0.6, 1.2), k.d * rnd(0.6, 1.2));
      Object.assign(u, { t: 0, life: rnd(5, 7), v: new THREE.Vector3(Math.cos(a) * out, rnd(4, 8) * Math.sqrt(size), Math.sin(a) * out), spin: new THREE.Vector3(rnd(-12, 12), rnd(-12, 12), rnd(-12, 12)), ground, kind: 'bit', rest: false });
      m.visible = true;
    }
  }
}

let last = 0;
/** Each frame (anything that blasts calls it; called twice in one frame, the second does nothing). */
export function blastTick() {
  const now = performance.now(), dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
  last = now;
  if (!dt) return;
  for (const m of fires) {
    const u = m.userData;
    if (u.t < 0) continue;
    const k = (u.t += dt) / u.life;
    if (k >= 1) { u.t = -1; m.visible = false; continue; }
    m.visible = true;
    m.scale.setScalar(Math.max(0.2, u.size * (1 - (1 - Math.min(1, k * 3)) ** 3)));
    m.position.addScaledVector(u.v, dt * (k > 0.25 ? 1 : 0.3));
    m.material.opacity = (1 - k) ** 1.5;
    m.material.color.lerp(FIRE[3], dt * 2.5);
  }
  for (const m of puffs) {
    const u = m.userData;
    if (u.t === -1) continue;
    u.t += dt;
    if (u.t < 0) continue;
    const k = u.t / u.life;
    if (k >= 1) { u.t = -1; m.visible = false; continue; }
    m.visible = true;
    m.position.addScaledVector(u.v, dt);
    u.v.y *= 1 - dt * 0.15;
    m.scale.setScalar(u.size * (0.3 + 0.7 * Math.sqrt(k)));
    m.rotation.y += dt * 0.2;
    m.material.opacity = Math.min(1, k * 8) * (1 - k) * 0.9;
  }
  for (const m of bits) {
    const u = m.userData;
    if (u.t < 0) continue;
    u.t += dt;
    const g = u.ground(m.position.x, m.position.z), lie = g + m.scale.y / 2;
    if (!u.rest) {
      u.v.y -= 9.8 * dt;
      m.position.addScaledVector(u.v, dt);
      m.rotation.x += u.spin.x * dt; m.rotation.y += u.spin.y * dt; m.rotation.z += u.spin.z * dt;
      if (g >= 0 && m.position.y < lie && u.v.y < 0) {
        m.position.y = lie;
        if (u.v.y > -2.5) { u.rest = true; m.rotation.x = Math.round(m.rotation.x / Math.PI) * Math.PI; m.rotation.z = Math.round(m.rotation.z / Math.PI) * Math.PI; }
        else { u.v.y *= -0.35; u.v.x *= 0.5; u.v.z *= 0.5; u.spin.multiplyScalar(0.4); }
      }
    }
    // (lying a while, then sinking into the sand; in the sea, straight down)
    if (u.t > u.life || (g < 0 && m.position.y < -0.6)) { m.position.y -= dt * 0.4; if (m.position.y < g - 0.4 || m.position.y < -1.2) { u.t = -1; m.visible = false; } }
  }
}
