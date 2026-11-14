// Multibella's island on the sloop's sea (src/den-multibella.ts; its squares LAY.MULTIBELLA in src/den-sail.ts), where
// her wolf den's hut is (wolfden-house.js, on the house shell). The user (14 Nov): "would expect her to have her own
// island similar to others". In the open water off to the right of the den: sand and a few dark pines, a little log
// hut with its window lit, and her pink flag with a cupcake on it (her flag's Muffin Madness, her crew the Cupcake
// Cult) at the water's edge. Sail up off its left-hand shore and Space puts you ashore, into the hut; leaving it,
// you're back aboard her there.
import * as THREE from 'three';
import { SAIL, LAY } from '../den-sail.js';
import { canLandMultibella, multibellaMooring, multibellaShore, multibellaLandingSquares } from '../den-multibella.js';
import { mark } from './marks.js';
import { scene, mat, mesh, canvasTex, woodTex, flagpole, keys } from './world.js';
import { sail, seaX, seaZ } from './sea.js';
import { gunneryReset } from './sea-guns.js';
import { outline, slab } from './isle.js';
import { houseEnter } from './house.js';

const M = LAY.MULTIBELLA;
export const mbIsle = { g: null, glow: null };

// Her flag: pink, a cupcake on it.
const herFlag = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: canvasTex(200, 128, (g, w, h) => {
  g.fillStyle = '#e0529c'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f6d8a8';   // (its paper case)
  g.beginPath(); g.moveTo(74, 70); g.lineTo(126, 70); g.lineTo(118, 108); g.lineTo(82, 108); g.closePath(); g.fill();
  g.strokeStyle = '#d8a870'; g.lineWidth = 3;
  for (const x of [88, 100, 112]) { g.beginPath(); g.moveTo(x, 72); g.lineTo(x - (x - 100) * 0.2, 106); g.stroke(); }
  g.fillStyle = '#fff4f8';   // (its icing, swirled)
  for (const [x, y, r] of [[100, 46, 16], [86, 60, 16], [114, 60, 16], [100, 62, 18]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#d0203c'; g.beginPath(); g.arc(100, 30, 7, 0, Math.PI * 2); g.fill();   // (a cherry)
}) });

/** A dark pine, h tall. */
function pine(h) {
  const g = new THREE.Group(), green = mat('#24452e', { roughness: 1 });
  const trunk = mesh(new THREE.CylinderGeometry(0.1, 0.14, h * 0.3, 6), mat('#4a3424'));
  trunk.position.y = h * 0.15; g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const c = mesh(new THREE.ConeGeometry(h * (0.32 - i * 0.07), h * 0.42, 8), green);
    c.position.y = h * (0.38 + i * 0.2); g.add(c);
  }
  return g;
}

/** The little log hut: dark log walls, a steep roof, its door toward the landing and a window lit warm (the star table's
    glow inside: wolfden-house.js). */
function hut() {
  const g = new THREE.Group(), log = mat('#5a3e28', { map: woodTex }), roof = mat('#3a2a20', { roughness: 1 });
  const W = 3.2, D = 2.6, H = 1.9;
  const body = mesh(new THREE.BoxGeometry(W, H, D), log);
  body.position.y = H / 2; g.add(body);
  for (let y = 0.25; y < H; y += 0.32) {   // (the logs' ends and lines)
    for (const sz of [-1, 1]) { const l = mesh(new THREE.CylinderGeometry(0.11, 0.11, W + 0.3, 6), log); l.rotation.z = Math.PI / 2; l.position.set(0, y, sz * (D / 2 + 0.02)); g.add(l); }
  }
  const shape = new THREE.Shape([new THREE.Vector2(-W / 2 - 0.35, 0), new THREE.Vector2(W / 2 + 0.35, 0), new THREE.Vector2(0, 1.4)]);
  const r = mesh(new THREE.ExtrudeGeometry(shape, { depth: D + 0.5, bevelEnabled: false }), roof);
  r.position.set(0, H, -(D + 0.5) / 2); g.add(r);
  const door = mesh(new THREE.BoxGeometry(0.06, 1.3, 0.75), mat('#2a1a10'));
  door.position.set(-W / 2 - 0.03, 0.65, 0.4); g.add(door);
  const glowM = new THREE.MeshBasicMaterial({ color: '#ffcf7a', toneMapped: false });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), glowM);
  win.rotation.y = -Math.PI / 2; win.position.set(-W / 2 - 0.04, 1.2, -0.6); g.add(win);
  const win2 = win.clone(); win2.rotation.y = 0; win2.position.set(0.5, 1.2, D / 2 + 0.13); g.add(win2);
  mbIsle.glow = glowM;
  return g;
}

function build() {
  const g = new THREE.Group();
  const shore = multibellaShore();
  const sand = mat('#d8c48e', { roughness: 1 }), wet = mat('#b89f70', { roughness: 1 }), moss = mat('#4c6e3c', { roughness: 1 });
  g.add(slab(outline(0.5, shore), -0.55, 0.45, wet), slab(outline(1.1, shore), -0.4, 0.62, sand), slab(outline(2.4, shore), -0.2, 0.5, moss));
  const mid = { c: (M.LAND[0][0] + M.LAND[1][0]) / 2, r: (M.LAND[0][1] + M.LAND[2][1]) / 2 };
  const h = hut();
  h.position.set(seaX(mid.c) + 0.4, 0.3, seaZ(mid.r));
  g.add(h);
  for (const [c, r, ht] of [[18.35, 3.75, 3.4], [18.4, 5.35, 2.8], [17.0, 3.7, 2.5]]) {
    const p = pine(ht);
    p.position.set(seaX(c), 0.25, seaZ(r));
    g.add(p);
  }
  // Her flag at the water's edge by the landing.
  const fl = flagpole(2.4, herFlag);
  fl.position.set(seaX(M.LAND[0][0]) - 1.6, 0.25, seaZ(M.LAND[0][1]) + 0.6);
  g.add(fl);
  scene.add(g);
  return g;
}

/** Built the first time the sea's drawn (sailing.js), seen from the den's beach too. */
export function multibellaWorld() {
  mbIsle.g ||= build();
  // (where Space puts you ashore, marked on the water: marks.js)
  mark('multibella', multibellaLandingSquares());
}
/** Each frame: the hut's window flickering, the star table's glow inside. */
export function multibellaTick() {
  if (!mbIsle.glow) return;
  const t = performance.now() / 1000;
  mbIsle.glow.color.setRGB(1, 0.78 + 0.05 * Math.sin(t * 7) * Math.sin(t * 2.3), 0.45);
}
/** Off her island, Space: she's brought alongside and made fast, and you go ashore, into the hut. She waits there;
    leaving the hut, you're back aboard (house.js, `bySea`). */
export function multibellaAshore() {
  gunneryReset();
  if (sail.helm.oars) sail.helm.row(false);
  sail.helm.moor(multibellaMooring());
  keys.clear();
  houseEnter('wolfden', { bySea: true });
}
/** Her island's starting point (den.html?at=multibella): at sea, off its landing. */
export function multibellaCheat() {
  sail.helm.moor({ ...M.MOOR, c: M.MOOR.c - 1 });
  sail.riding = false;
}
export { canLandMultibella };
