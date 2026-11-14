/* Materials and little helpers any 3D piece uses: a plain material, a mesh, a texture painted on a canvas,
   the wood grain. Knowing nothing of the den's renderer, scene or state, so a piece built on them (furniture.js's)
   can be stood up anywhere, the catalogue's pages too, without the den starting up round it (world.js, which
   re-exports them, creates the den's own renderer as it loads). Pulled out of world.js, 14 Nov. */
import * as THREE from 'three';

export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
export function mesh(geo, m, shadow = true) {
  const x = new THREE.Mesh(geo, m);
  x.castShadow = shadow; x.receiveShadow = true;
  return x;
}
export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export const woodTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#f2dcb8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = `rgba(110, 66, 30, ${0.12 + Math.random() * 0.22})`;
    g.lineWidth = 1 + Math.random() * 2.5;
    const y = Math.random() * h;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 20 + i) * 2.5);
    g.stroke();
  }
});
