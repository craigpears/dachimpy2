// Doing well at Sailing shows on her (the user, 11 Nov, "very important": "a sparkly indicator, and
// sparkly full sails", as in Puzzle Pirates). How much show, and how long it lasts, is src/den-sailing.ts
// (Sparkle); this only draws it on the sloop's sails (js/den/sea.js, sloopSails): a little glitter off
// them for a Double, more for each step, and for a Vegas her sails billowing full and lit gold, sparkles
// streaming off them aft, and a whoosh of wind rushing past her. js/den/sail-station.js drives it.
import * as THREE from 'three';
import { scene, camera } from './world.js';
import { sloopSails } from './sea.js';

// A sparkle: a little four-pointed star with a soft glow, added on (it shines over the sea).
const STAR = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,240,180,0.7)'); gr.addColorStop(1, 'rgba(255,210,90,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(35, 29, 62, 32); g.quadraticCurveTo(35, 35, 32, 62); g.quadraticCurveTo(29, 35, 2, 32); g.quadraticCurveTo(29, 29, 32, 2); g.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const TINTS = ['#ffffff', '#fff2b0', '#ffd65a', '#bfe8ff'].map((c) => new THREE.Color(c));
const MAX = 180;
const fx = { stars: [], streaks: [], free: [], glow: new THREE.Color('#ffc94a'), v: new THREE.Vector3(), bow: new THREE.Vector3(), owed: 0, t: 0 };

function star() {
  let s = fx.free.pop();
  if (!s) {
    if (fx.stars.length >= MAX) return null;
    s = new THREE.Sprite(new THREE.SpriteMaterial({ map: STAR, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.renderOrder = 5;
  }
  scene.add(s);
  return s;
}

/** A frame of it on her (`g`, the sloop), for `sp` (a Sparkle): her sails filled and lit by its
    level, and sparkles off them at a rate that grows with it. */
export function sparkleTick(g, sp, dt) {
  fx.t += dt;
  const level = sp?.level ?? 0, { cloths, mat } = sloopSails(g);
  const up = g?.visible && cloths.length && cloths[0].parent.visible;
  // Her sails billow out, fuller with a bigger chain (their shape's the wind's to draw, with this on
  // top: wind.js, by src/den-sailing.ts's billow), and glow gold.
  if (g) g.userData.swell = level;
  if (mat?.emissive) mat.emissive.copy(fx.glow).multiplyScalar(0.45 * level);
  // Sparkles off the cloth, streaming aft: off its face toward the camera, where they're seen (from
  // behind her, the far side of her sails, toward her bow, hid them), and round its edges.
  if (up && level > 0.01) {
    fx.owed += dt * 90 * level ** 1.3;
    g.updateMatrixWorld(true);
    fx.bow.set(1, 0, 0).transformDirection(g.matrixWorld);
    for (; fx.owed >= 1; fx.owed--) {
      const s = star();
      if (!s) { fx.owed = 0; break; }
      const c = cloths[Math.floor(Math.random() * cloths.length)], P = c.geometry.parameters;
      const seen = c.worldToLocal(fx.v.copy(camera.position)).z >= 0 ? 1 : -1;   // (the camera's side of it)
      const x = (Math.random() - 0.5) * P.width, y = (Math.random() - 0.5) * P.height;
      const belly = Math.cos(x / P.width * Math.PI) * 0.22 * (0.6 + 0.4 * Math.cos(y / P.height * Math.PI));   // (as sloop.js shapes it)
      s.position.set(x * (1 + 0.15 * Math.random()), y, belly + seen * (0.12 + Math.random() * 0.2) / Math.max(0.2, c.scale.z));   // (its z is scaled by the belly's)
      c.localToWorld(s.position);
      const sp2 = 1.5 + Math.random() * 2.5 * (0.4 + level);
      s.userData = { v: fx.bow.clone().multiplyScalar(-sp2).add(fx.v.set((Math.random() - 0.5) * 0.8, 0.2 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8)), life: 0.7 + Math.random() * 0.8, t: 0, ph: Math.random() * 9, size: 0.22 + Math.random() * 0.28 };
      s.material.color.copy(TINTS[Math.floor(Math.random() * TINTS.length)]);
      fx.stars.push(s);
    }
  }
  fx.stars = fx.stars.filter((s) => {
    const u = s.userData;
    if ((u.t += dt) >= u.life) { scene.remove(s); fx.free.push(s); return false; }
    s.position.addScaledVector(u.v, dt);
    u.v.multiplyScalar(1 - dt * 0.8);
    const k = u.size * (0.55 + 0.45 * Math.sin(fx.t * 22 + u.ph));
    s.scale.set(k, k, 1);
    s.material.opacity = Math.min(1, (1 - u.t / u.life) * 1.6);
    return true;
  });
  // The whoosh's streaks, rushing past her bow to stern.
  fx.streaks = fx.streaks.filter((w) => {
    if ((w.t += dt) < 0) { w.m.visible = false; return true; }
    const u = w.t / w.life;
    if (u >= 1) { scene.remove(w.m); w.m.geometry.dispose(); w.m.material.dispose(); return false; }
    w.m.visible = true;
    w.m.position.addScaledVector(w.v, dt);
    w.m.material.opacity = Math.sin(u * Math.PI) * 0.75;
    return true;
  });
}

/** A Vegas's whoosh: streaks of wind rushing past her, bow to stern. */
export function sparkleWhoosh(g) {
  if (!g?.visible) return;
  g.updateMatrixWorld(true);
  const bow = new THREE.Vector3(1, 0, 0).transformDirection(g.matrixWorld), side = new THREE.Vector3(0, 0, 1).transformDirection(g.matrixWorld);
  const yaw = Math.atan2(-bow.z, bow.x);
  for (let i = 0; i < 14; i++) {
    const len = 1.6 + Math.random() * 2.2;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.07), new THREE.MeshBasicMaterial({ color: i % 3 ? '#ffffff' : '#ffe9a0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    const off = (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 2.2);
    m.position.copy(g.position).addScaledVector(bow, 4 + Math.random() * 3).addScaledVector(side, off).setY(g.position.y + 0.4 + Math.random() * 3.2);
    m.rotation.set(0, yaw, (Math.random() - 0.5) * 0.15);
    m.renderOrder = 5;
    scene.add(m);
    fx.streaks.push({ m, v: bow.clone().multiplyScalar(-(16 + Math.random() * 8)), t: -i * 0.04, life: 0.55 });
  }
}
