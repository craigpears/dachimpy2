/* A coffin: the old six-sided shape, its lid on a hinge down one long side, red satin inside. `sitter`:
   whoever's lying in it (anything with g, legs and arms: a pirate from the wardrobe), on their back, arms
   crossed. open(u) lifts the lid (0 shut, 1 flung open), sitUp(u) sits them bolt upright; tick eases both
   there, a rattle of the lid as it starts. Its head end is away from you (-z). The vampire's, at Gravee's. */
import { THREE, mat, mesh, woodTex, box, brass } from './parts.js';

const COFFIN_PTS = [[-0.24, -1.0], [0.24, -1.0], [0.38, -0.5], [0.22, 1.0], [-0.22, 1.0], [-0.38, -0.5]];
const coffinShape = (inset = 0) => {
  const s = new THREE.Shape();
  COFFIN_PTS.forEach(([x, z], i) => { const px = x * (1 - inset * 2.4), pz = z * (1 - inset); s[i ? 'lineTo' : 'moveTo'](px, -pz); });
  return s;
};
export function coffin({ sitter = null, wood = '#3a2416' } = {}) {
  const g = new THREE.Group(), woodM = mat(wood, { map: woodTex, roughness: 0.7 });
  const shell = mesh(new THREE.ExtrudeGeometry(coffinShape(), { depth: 0.46, bevelEnabled: false }).rotateX(-Math.PI / 2), woodM);
  g.add(shell);
  const satin = mesh(new THREE.ShapeGeometry(coffinShape(0.07)).rotateX(-Math.PI / 2), mat('#8a1020', { roughness: 0.4 }), false);
  satin.position.y = 0.461; g.add(satin);
  const lining = mesh(new THREE.BoxGeometry(0.3, 0.06, 0.2), mat('#a8162a', { roughness: 0.4 })); lining.position.set(0, 0.49, -0.78); g.add(lining);   // (a satin pillow)
  // The lid: hinged along the left side (x = -0.38), swinging up and over to the left.
  const hinge = new THREE.Group(); hinge.position.set(-0.4, 0.46, 0); g.add(hinge);
  const lid = mesh(new THREE.ExtrudeGeometry(coffinShape(), { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 }).rotateX(-Math.PI / 2), woodM);
  lid.position.x = 0.4; hinge.add(lid);
  const cross = box(0.06, 0.02, 0.5, brass, 0.4, 0.09, -0.15); hinge.add(cross, box(0.26, 0.02, 0.06, brass, 0.4, 0.09, -0.25));
  // Whoever's in it: hinged at the hips, lying on their back.
  const hips = new THREE.Group(); hips.position.set(0, 0.24, 0.2); g.add(hips);
  if (sitter) { sitter.g.position.set(0, -0.72, 0); sitter.g.rotation.set(0, 0, 0); hips.add(sitter.g); }
  const st = { open: 0, up: 0, wantOpen: 0, wantUp: 0, rattle: 0, t: 0 };
  const pose = () => {
    hinge.rotation.z = st.open * 2.05 + (st.rattle > 0 ? Math.abs(Math.sin(st.t * 34)) * 0.16 * st.rattle : 0);   // (a rattle: the lid jumping on its hinge)
    hips.rotation.x = -Math.PI / 2 * (1 - st.up);
    if (!sitter) return;
    sitter.legs.forEach((l) => { l.rotation.set(-Math.PI / 2 * st.up, 0, 0); });
    // Arms crossed on the chest lying down; flung up as they sit bolt upright.
    sitter.arms.forEach((a, i) => { const inward = i ? -1 : 1; a.rotation.set(-0.5 * (1 - st.up) - 2.7 * st.up, 0, inward * (1.15 * (1 - st.up) - 0.45 * st.up)); });
  };
  pose();
  return {
    g, lid: hinge, sitter,
    get opened() { return st.open; },
    open(u) { if (u > st.wantOpen) st.rattle = 0.5; st.wantOpen = u; },
    sitUp(u) { st.wantUp = u; },
    /** The lid gives a rattle, shut or open (whoever's in it stirring). */
    rattle(k = 0.7) { st.rattle = Math.max(st.rattle, k); },
    /** Straight to how it is (no easing). */
    set(open, up) { st.open = st.wantOpen = open; st.up = st.wantUp = up; pose(); },
    tick(dt) {
      st.t += dt; st.rattle = Math.max(0, st.rattle - dt);
      st.open += (st.wantOpen - st.open) * Math.min(1, dt * 6);
      st.up += (st.wantUp - st.up) * Math.min(1, dt * (st.wantUp > st.up ? 14 : 3));
      pose();
    },
  };
}

export const PIECES = [
  { id: 'coffin', name: 'Coffin', group: 'house', make: coffin,
    about: 'The old six-sided shape, red satin inside, its lid on a hinge. Can hold a pirate lying in it, who sits bolt upright when it opens. Options: sitter (a pirate), wood (its colour).',
    where: 'Gravee\'s bedchamber, the vampire in it; the vampire\'s portrait.' },
];
