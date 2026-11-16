// Pirate Den: a ship's anchor, dropped and weighed, any ship's (the blockade's war brigs: js/den/blockade.js). Plain
// hand-written three.js. The user, 16 Nov: "it needs to be some more visible animation when a [war brig] is anchored,
// that it's anchored." Dropping it, the anchor falls from her bow into the sea with a splash; lying at anchor, her
// cable runs taut from her bow down into the water, rings spreading where it goes in, and a tag under her name says
// so; weighing it, the cable's wound in and the anchor comes up dripping, hung at her bow till it's stowed.
import * as THREE from 'three';
import { mat, burst } from './world.js';

const IRON = mat('#2d2a27', { roughness: 0.6, metalness: 0.5 });
const ROPE = new THREE.LineBasicMaterial({ color: '#c9b48a' });
/** Seconds the anchor takes to fall from her bow to the water. */
const DROP = 0.7;

/** An anchor: shank, stock and two arms, its ring at the top, about `size` tall. */
function anchorMesh(size) {
  const g = new THREE.Group();
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), IRON); g.add(shank);
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), IRON); stock.rotation.x = Math.PI / 2; stock.position.y = 0.38; g.add(stock);
  const arms = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 6, 16, Math.PI), IRON); arms.rotation.z = Math.PI; arms.position.y = -0.18; g.add(arms);
  for (const k of [-1, 1]) { const fluke = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), IRON); fluke.position.set(k * 0.34, -0.12, 0); fluke.rotation.z = k * 0.6; g.add(fluke); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12), IRON); ring.position.y = 0.56; g.add(ring);
  g.scale.setScalar(size);
  return g;
}

/** A ship's anchor in `parent` (the board's group): `bow` how far forward of her middle her bow is, `deck` her deck's
    height there, `tag` a sprite saying she's at anchor (under her name). `tick(dt, ship, state)` each frame, `ship` her
    model (its position and heading), `state` 'down' (at anchor), 'weighing' (`k` how far up, 0 to 1) or 'up'. */
export function anchorLook(parent, { bow, deck, tag, size = 1.3 }) {
  const g = new THREE.Group(); parent.add(g);
  const anchor = anchorMesh(size); g.add(anchor);
  const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), ROPE);
  cable.frustumCulled = false; g.add(cable);
  const rings = [0, 1, 2].map(() => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e8f4fa', transparent: true, opacity: 0, depthWrite: false }));
    r.renderOrder = 2; g.add(r); return r;
  });
  if (tag) { tag.visible = false; parent.add(tag); }
  g.visible = false;
  let was = 'up', fall = 0, t = 0;
  const hawse = new THREE.Vector3(), into = new THREE.Vector3();
  return {
    tick(dt, ship, state, k = 0) {
      t += dt;
      // (where her cable leaves her bow, and where it goes into the sea, a little ahead of her)
      const a = ship.rotation.y, fx = Math.cos(a), fz = -Math.sin(a);
      hawse.set(ship.position.x + fx * bow, deck, ship.position.z + fz * bow);
      if (state === 'down' && was !== 'down') { fall = 0; into.set(hawse.x + fx * 1.4, 0, hawse.z + fz * 1.4); }
      if (state !== 'down' && state !== 'weighing') { g.visible = false; if (tag) tag.visible = false; was = state; return; }
      g.visible = true;
      // (falling: from her bow to the water, then the splash; weighing: up from the water to her bow)
      let y;
      if (state === 'down') {
        const before = fall; fall = Math.min(DROP, fall + dt);
        if (before < DROP && fall >= DROP) { burst(into.clone().setY(0.3), '#e8f4fa', 22, 5); burst(into.clone().setY(0.2), '#9fc7d8', 10, 3); }
        const f = fall / DROP; y = hawse.y - 0.6 - f * f * (hawse.y + 0.6);
      } else y = hawse.y - 0.6 - (1 - k) * (hawse.y + 0.6);
      const sunk = y < -0.4, x = state === 'down' && fall < DROP ? hawse.x + (into.x - hawse.x) * (fall / DROP) : state === 'weighing' ? hawse.x + (into.x - hawse.x) * (1 - k) : into.x;
      const z = state === 'down' && fall < DROP ? hawse.z + (into.z - hawse.z) * (fall / DROP) : state === 'weighing' ? hawse.z + (into.z - hawse.z) * (1 - k) : into.z;
      anchor.visible = !sunk; anchor.position.set(x, y, z); anchor.rotation.y = a;
      if (state === 'weighing' && !sunk && Math.random() < dt * 8) burst(anchor.position.clone(), '#9fc7d8', 2, 0.8);
      // (her cable: bow to where it goes in, or to the anchor while it's in the air)
      const end = sunk ? new THREE.Vector3(x, 0.05, z) : anchor.position.clone().setY(y + 0.7 * size);
      const p = cable.geometry.attributes.position; p.setXYZ(0, hawse.x, hawse.y, hawse.z); p.setXYZ(1, end.x, end.y, end.z); p.needsUpdate = true;
      // (rings spreading slowly where her cable goes in, while she lies at anchor)
      const lying = state === 'down' && fall >= DROP;
      rings.forEach((r, i) => {
        const ph = ((t * 0.5 + i / rings.length) % 1);
        r.visible = lying; r.position.set(into.x, 0.06, into.z); r.scale.setScalar(0.6 + ph * 2.6); r.material.opacity = (1 - ph) * 0.45;
      });
      if (tag) { tag.visible = state === 'down'; tag.position.set(ship.position.x, 8.4, ship.position.z); }
      was = state;
    },
  };
}
