// The Empire's look, the same wherever it's built (RULES.md, "The same thing looks the same everywhere"):
// its pale stone, its crimson and gold, its flag, a banner down a wall, a battlemented tower. The
// imperial checkpoint (checkpoint.js) and Port Decorum, the imperial island (imperial-isle.js), are
// built from these.
import * as THREE from 'three';
import { mat, mesh, canvasTex } from './world.js';

export const CRIMSON = '#9e1b24', GOLD = '#e0b53a', STONE = '#d3c9b2';
/** Its pale stone, faceted. */
export const stone = () => mat(STONE, { flatShading: true, roughness: 0.9 });

// The Empire's flag: crimson, a gold border, a gold crown over a rising sun.
const imperialTex = (w = 200, h = 128) => canvasTex(w, h, (g) => {
  g.fillStyle = CRIMSON; g.fillRect(0, 0, w, h);
  g.strokeStyle = GOLD; g.lineWidth = h * 0.06; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
  const cx = w / 2, cy = h * 0.62, R = h * 0.26;
  g.fillStyle = GOLD;
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i + 0.5) / 9 * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a - 0.08) * R * 0.9, cy + Math.sin(a - 0.08) * R * 0.9); g.lineTo(cx + Math.cos(a) * R * 1.55, cy + Math.sin(a) * R * 1.55); g.lineTo(cx + Math.cos(a + 0.08) * R * 0.9, cy + Math.sin(a + 0.08) * R * 0.9); g.fill(); }
  g.beginPath(); g.arc(cx, cy, R * 0.8, Math.PI, 0); g.fill();
  // the crown, over the sun
  const y0 = h * 0.2, cw = h * 0.36, ch = h * 0.2;
  g.beginPath(); g.moveTo(cx - cw / 2, y0 + ch);
  for (const [x, y] of [[-0.5, 0], [-0.25, 0.45], [0, -0.1], [0.25, 0.45], [0.5, 0], [0.5, 1]]) g.lineTo(cx + x * cw, y0 + y * ch);
  g.closePath(); g.fill();
  g.fillStyle = CRIMSON; g.fillRect(cx - cw / 2, y0 + ch * 0.82, cw, ch * 0.08);
});
let imperialMat = null;
/** The Empire's flag, for a flagpole (world.js's). */
export const flagMatImperial = () => (imperialMat ||= new THREE.MeshStandardMaterial({ map: imperialTex(), side: THREE.DoubleSide, roughness: 0.9 }));

let bannerMat = null;
/** A long banner hanging down a wall's face, w by h metres. */
export function banner(w, h) {
  bannerMat ||= new THREE.MeshStandardMaterial({ map: canvasTex(64, 160, (g, cw, chh) => {
    g.fillStyle = CRIMSON; g.fillRect(0, 0, cw, chh);
    g.fillStyle = GOLD; g.fillRect(0, 0, cw, 8); g.fillRect(6, 0, 4, chh); g.fillRect(cw - 10, 0, 4, chh);
    g.beginPath(); g.arc(cw / 2, chh * 0.35, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = CRIMSON; g.beginPath(); g.arc(cw / 2, chh * 0.35, 7, 0, Math.PI * 2); g.fill();
    g.clearRect(0, chh - 18, cw, 18); g.fillStyle = CRIMSON; g.beginPath(); g.moveTo(0, chh - 18); g.lineTo(cw / 2, chh); g.lineTo(cw, chh - 18); g.fill();
  }), side: THREE.DoubleSide, roughness: 0.9, transparent: true });
  return mesh(new THREE.PlaneGeometry(w, h), bannerMat, false);
}

/** A square tower of pale stone, w wide and h tall, battlemented, a crimson band below its top.
    `merlon`: how big its merlons are (the band with them), for a bigger tower (Port Decorum's fort);
    `st`, `band`: materials to share with the rest of what it's built into (to bake: bake.js). */
export function tower(w, h, { merlon = 0.5, st = stone(), band = mat(CRIMSON, { roughness: 0.8 }) } = {}) {
  const g = new THREE.Group(), k = merlon / 0.5;
  const body = mesh(new THREE.BoxGeometry(w, h + 1, w), st); body.position.y = (h - 1) / 2;
  const b = mesh(new THREE.BoxGeometry(w + 0.08 * k, 0.35 * k, w + 0.08 * k), band); b.position.y = h - 0.7 * k;
  g.add(body, b);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const m = mesh(new THREE.BoxGeometry(merlon, merlon * 1.1, merlon), st), s = (j - 1) * (w - merlon) / 2, e = (w - merlon) / 2;
    m.position.set([s, e, s, -e][i], h + merlon * 0.55, [e, s, -e, s][i]);
    g.add(m);
  }
  return g;
}
