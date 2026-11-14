/* What every piece of furniture is made with: little helpers for placing boxes, cylinders, rods and balls, and
   the materials pieces share (dark and mid wood, brass, gilt, bone, black iron...). A material is made once
   here and shared by every copy of every piece that uses it, so a ship full of furniture bakes down to a few
   meshes (js/den/bake.js); a material only one piece uses lives in that piece's own file. Needs nothing of the
   den (materials.js's mat, mesh and woodTex), so a piece stands up anywhere, the catalogue's page too. */
import * as THREE from 'three';
import { mat, mesh, woodTex, canvasTex } from '../materials.js';

export { THREE, mat, mesh, woodTex, canvasTex };

// ---------- shapes ----------
/** `m` moved to (x, y, z). */
export const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
/** A box `w` wide, `h` high, `d` deep, its middle at (x, y, z). */
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => at(mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z);
/** A cylinder standing up, `r0` round its top and `r1` its foot, `h` high, its middle at (x, y, z), `n` sides. */
export const cyl = (r0, r1, h, m, x = 0, y = 0, z = 0, n = 12) => at(mesh(new THREE.CylinderGeometry(r0, r1, h, n), m), x, y, z);
const UP = new THREE.Vector3(0, 1, 0);
/** A rod from a to b ([x, y, z] each), `r` thick. */
export function rod(a, b, r, m, n = 6) {
  const A = new THREE.Vector3(...a), d = new THREE.Vector3(...b).sub(A), c = mesh(new THREE.CylinderGeometry(r, r, d.length(), n), m);
  c.position.copy(A).addScaledVector(d, 0.5);
  c.quaternion.setFromUnitVectors(UP, d.normalize());
  return c;
}
/** A ball `r` round, its middle at (x, y, z). */
export const ball = (r, m, x, y, z, n = 8) => at(mesh(new THREE.SphereGeometry(r, n, Math.max(4, n - 2)), m), x, y, z);
/** Cloth or upholstery in colour `c`. */
export const cloth = (c) => mat(c, { roughness: 0.95 });

/** A piece turned to face `yaw` (0: toward +z) and put at (x, z), in `parent`. */
export function place(parent, piece, x, z, yaw = 0) { piece.g.position.set(x, 0, z); piece.g.rotation.y = yaw; parent.add(piece.g); return piece; }

// ---------- shared materials ----------
export const dark = mat('#4a2c18', { map: woodTex }), mid = mat('#7a4a28', { map: woodTex }), ebony = mat('#241812', { map: woodTex, roughness: 0.6 });
export const brass = mat('#c9a13c', { metalness: 0.7, roughness: 0.35 }), gilt = mat('#d9a93a', { metalness: 0.75, roughness: 0.3 });
export const wax = mat('#f4efe2', { roughness: 0.6 }), flameM = new THREE.MeshBasicMaterial({ color: '#ffcf4a' }), glowM = new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.35, depthWrite: false });
/* The skeleton set's and its company's, as Puzzle Pirates has them: bone white on black (from the user's war
   frigate, Primates Rule), and what else they're made of. */
export const bone = mat('#e8dfc4', { roughness: 0.7 }), socket = mat('#17120e', { roughness: 1 });
export const ironBlack = mat('#1f1e23', { metalness: 0.45, roughness: 0.45 }), steel = mat('#dde1e6', { metalness: 0.35, roughness: 0.35 });
export const ivory = mat('#f3efe6', { roughness: 0.5 }), greyStone = mat('#8d9296', { roughness: 0.85 });
export const glass = mat('#d4ecef', { transparent: true, opacity: 0.32, roughness: 0.08, depthWrite: false }), straw = mat('#d8c27c', { roughness: 0.8 });
export const cork = mat('#b08a5a'), doughM = mat('#c98a45', { roughness: 0.85 });

// ---------- pictures and words on a wall ----------
/** Plain canvas, till something's painted on it. */
export const PLAIN = canvasTex(4, 4, (g) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, 4, 4); });
/* How far off the wall each layer of a framed picture stands (metres; the wall's face at 0), each clearly
   in front of the last so none fights another for the same depth, from any camera, zoomed in or out
   (the user, 11 Nov: "the little captions underneath the pictures flicker"; RULES.md, "The ship's deck
   doesn't flicker"): the wall; a house's wainscot (house.js's, 0.02 proud of it, which a plaque can hang
   over); the frame (0 to 0.06 deep); the picture in it; and the plaque under it, standing off the wall on
   its own, in front of the wainscot too. And drawn a touch nearer than its depth says (AHEAD), to be sure. */
export const LAYER = { picture: 0.036, plaque: 0.05 };
export const AHEAD = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 };
