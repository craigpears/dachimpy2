/* A picture in a gilt frame, `w` by `h` metres (the picture; the frame round it), its back to the wall at
   its origin, its middle at height `y`. `picture`: a texture (a portrait from js/den/portraits.js), or
   plain canvas till it's painted. `plaque`: its title on a little brass plate under it. setPicture and
   setPlaque change them. */
import { THREE, mesh, canvasTex, at, box, gilt, PLAIN, LAYER, AHEAD } from './parts.js';

const plaqueTex = (text) => canvasTex(256, 48, (g, W, H) => {
  g.fillStyle = '#e9d7a6'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#7a5216'; g.lineWidth = 3; g.strokeRect(2, 2, W - 4, H - 4);
  g.fillStyle = '#3a2210'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let px = 22;
  do g.font = `italic 700 ${px}px Alegreya, Georgia, serif`; while (g.measureText(text).width > W - 16 && --px > 9);
  g.fillText(text, W / 2, H / 2 + 1);
});
export function frame({ w = 0.8, h = 1.0, y = 1.75, picture = null, plaque = '', ornate = true } = {}) {
  const g = new THREE.Group(), t = ornate ? 0.11 : 0.07, d = 0.06;
  const pic = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: picture || PLAIN, color: '#e6e0d6' }), false);   // (a painting's own colours, a touch dimmed by the room)
  pic.position.set(0, y, LAYER.picture);
  g.add(pic, box(w + 2 * t, t, d, gilt, 0, y + h / 2 + t / 2, d / 2), box(w + 2 * t, t, d, gilt, 0, y - h / 2 - t / 2, d / 2), box(t, h, d, gilt, -w / 2 - t / 2, y, d / 2), box(t, h, d, gilt, w / 2 + t / 2, y, d / 2));
  if (ornate) for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(at(mesh(new THREE.SphereGeometry(t * 0.55, 8, 6), gilt), sx * (w / 2 + t / 2), y + sy * (h / 2 + t / 2), d * 0.9));
  let plate = null;
  const setPlaque = (text) => {
    if (plate) { plate.geometry.dispose(); plate.material.map?.dispose(); plate.material.dispose(); g.remove(plate); plate = null; }
    if (!text) return;
    const pw = Math.min(w + 0.1, 0.9);
    plate = mesh(new THREE.PlaneGeometry(pw, pw * 48 / 256), new THREE.MeshStandardMaterial({ map: plaqueTex(text), roughness: 0.5, metalness: 0.2, ...AHEAD }), false);
    plate.position.set(0, y - h / 2 - t - pw * 24 / 256 - 0.03, LAYER.plaque);
    g.add(plate);
  };
  setPlaque(plaque);
  return {
    g, pic, w, h, y,
    /** The picture: a texture, or part of one (`uv`: { u0, v0, u1, v1 }, a tile of a shared atlas). */
    setPicture(tex, uv = null) {
      pic.material.map = tex || PLAIN; pic.material.needsUpdate = true;
      const at = pic.geometry.attributes.uv, U = uv || { u0: 0, v0: 0, u1: 1, v1: 1 };
      [[U.u0, U.v1], [U.u1, U.v1], [U.u0, U.v0], [U.u1, U.v0]].forEach(([u, v], i) => at.setXY(i, u, v));
      at.needsUpdate = true;
    },
    setPlaque,
  };
}

export const PIECES = [
  { id: 'frame', name: 'Picture frame', group: 'pictures', make: frame, onWall: true, sample: { plaque: 'A plaque under it' },
    about: 'A picture in a gilt frame, its back to a wall, a little brass plaque under it with its title. Options: w and h (the picture\'s size), y (how high its middle hangs), picture, plaque, ornate (the fancy corners).',
    where: 'Every house\'s walls: Gravee\'s portraits, Roobear\'s guesses, Dachimpy\'s museum and friends\' wall.' },
];
