/* A werewolf: hunched on its hind legs, shaggy, long-armed and clawed, red-eyed, a snout and pointed ears, a bushy
   tail. Needs only three.js and materials.js, so it stands up anywhere: Jezerbell's werewolf fray brings a pack of
   them out of her summoning stump (js/den/jezerbell-house.js). werewolf({ fur }) gives { g, tick(dt), pose }: `pose`
   'prowl' (breathing, swaying, claws flexing), 'howl' (its head thrown back), 'leap' (crouched to spring), 'down'
   (knocked out, slumped on the floor), or 'flee' (running off, on all fours). Standing at its origin, facing +z. */
import * as THREE from 'three';
import { mat, mesh } from './materials.js';

const ball = (r, m, x, y, z, n = 10) => { const b = mesh(new THREE.SphereGeometry(r, n, Math.max(4, n - 2)), m); b.position.set(x, y, z); return b; };
const cone = (r, h, m, n = 8) => mesh(new THREE.ConeGeometry(r, h, n), m);
const limb = (r0, r1, h, m) => { const g = new THREE.Group(), c = mesh(new THREE.CylinderGeometry(r0, r1, h, 8), m); c.position.y = -h / 2; g.add(c); return g; };
const EYE = new THREE.MeshBasicMaterial({ color: '#ff2a1a' }), CLAW = mat('#efe6d0', { roughness: 0.5 }), NOSE = mat('#1a1414', { roughness: 0.4 });

export function werewolf({ fur = '#6e5f50', scale = 1 } = {}) {
  const g = new THREE.Group(), F = mat(fur, { roughness: 1 }), pale = mat(new THREE.Color(fur).lerp(new THREE.Color('#e8dcc8'), 0.45), { roughness: 1 });
  const body = new THREE.Group(); body.position.y = 1.0; g.add(body);
  // the chest and belly, hunched forward
  const chest = ball(0.36, F, 0, 0.42, 0.05, 12); chest.scale.set(1.15, 1.05, 0.9);
  const belly = ball(0.28, pale, 0, 0.12, 0.12, 10); belly.scale.set(1, 1.1, 0.8);
  const hips = ball(0.27, F, 0, -0.05, -0.05, 10);
  body.add(chest, belly, hips);
  // ruff of shaggy fur round the shoulders
  for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.4, c = cone(0.1, 0.32, F, 5); c.position.set(Math.sin(a) * 0.36, 0.62, Math.cos(a) * 0.2 - 0.05); c.rotation.set(-0.6, 0, -a * 0.5); body.add(c); }
  // the head: skull, snout, jaw, ears, eyes
  const head = new THREE.Group(); head.position.set(0, 0.78, 0.22); body.add(head);
  const skull = ball(0.2, F, 0, 0, 0, 12); skull.scale.set(1, 0.95, 1.05);
  const snout = mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.3, 8), pale); snout.rotation.x = Math.PI / 2; snout.position.set(0, -0.05, 0.24);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.1, 0.1); const jawM = mesh(new THREE.BoxGeometry(0.14, 0.05, 0.26), pale); jawM.position.z = 0.12; jaw.add(jawM);
  for (const sx of [-1, 1]) { const f = cone(0.012, 0.05, CLAW, 4); f.position.set(0.05 * sx, 0.02, 0.22); f.rotation.x = Math.PI; jaw.add(f); }
  head.add(skull, snout, jaw, ball(0.04, NOSE, 0, -0.01, 0.4, 8));
  for (const sx of [-1, 1]) {
    const ear = cone(0.07, 0.22, F, 4); ear.position.set(0.12 * sx, 0.2, -0.03); ear.rotation.z = -0.3 * sx; head.add(ear);
    head.add(ball(0.03, EYE, 0.08 * sx, 0.05, 0.16, 6));
  }
  // arms, long, with claws
  const arms = [-1, 1].map((sx) => {
    const sh = limb(0.09, 0.07, 0.5, F); sh.position.set(0.4 * sx, 0.55, 0.05);
    const fore = limb(0.07, 0.06, 0.45, F); fore.position.y = -0.5; sh.add(fore);
    const paw = ball(0.08, pale, 0, -0.48, 0.02, 8); fore.add(paw);
    for (let k = -1; k <= 1; k++) { const c = cone(0.015, 0.1, CLAW, 4); c.position.set(k * 0.035, -0.56, 0.05); c.rotation.x = Math.PI + 0.4; fore.add(c); }
    body.add(sh);
    return { sh, fore };
  });
  // hind legs, bent the wolf's way
  const legs = [-1, 1].map((sx) => {
    const th = limb(0.12, 0.09, 0.45, F); th.position.set(0.17 * sx, -0.08, 0);
    const shin = limb(0.08, 0.06, 0.42, F); shin.position.set(0, -0.45, 0); th.add(shin);
    const foot = mesh(new THREE.BoxGeometry(0.12, 0.06, 0.24), pale); foot.position.set(0, -0.43, 0.08); shin.add(foot);
    body.add(th);
    return { th, shin };
  });
  // the tail
  const tail = new THREE.Group(); tail.position.set(0, -0.05, -0.25); body.add(tail);
  const tc = cone(0.1, 0.6, F, 7); tc.rotation.x = -Math.PI / 2 - 0.6; tc.position.set(0, -0.15, -0.25); tail.add(tc);
  g.scale.setScalar(scale);

  let t = Math.random() * 9, pose = 'prowl';
  const W = {
    g, head, body,
    get pose() { return pose; },
    set pose(p) { pose = p; },
    tick(dt) {
      t += dt;
      const s = Math.sin(t * 2.2), q = Math.sin(t * 9);
      // defaults: hunched, legs bent
      body.position.set(0, 1.0, 0); body.rotation.set(0.35, 0, 0);
      head.rotation.set(-0.25, Math.sin(t * 0.7) * 0.3, 0); jaw.rotation.x = 0.1 + 0.08 * Math.max(0, s);
      legs.forEach((l, i) => { l.th.rotation.x = -0.6; l.shin.rotation.x = 0.9; l.th.rotation.z = 0; });
      arms.forEach((a, i) => { a.sh.rotation.set(-0.5 + 0.12 * s, 0, (i ? 0.25 : -0.25)); a.fore.rotation.x = -0.5; });
      tail.rotation.set(0, Math.sin(t * 3) * 0.3, 0);
      if (pose === 'prowl') { body.position.y += 0.02 * s; body.rotation.z = 0.05 * Math.sin(t * 1.1); }
      else if (pose === 'howl') { body.rotation.x = -0.15; head.rotation.x = -1.0; jaw.rotation.x = 0.4; arms.forEach((a) => { a.sh.rotation.x = -0.2; }); }
      else if (pose === 'leap') { body.position.y = 0.85; body.rotation.x = 0.7; legs.forEach((l) => { l.th.rotation.x = -1.1; l.shin.rotation.x = 1.5; }); arms.forEach((a) => { a.sh.rotation.x = -1.4; a.fore.rotation.x = -0.2; }); jaw.rotation.x = 0.35; }
      else if (pose === 'down') { body.position.y = 0.3; body.rotation.set(1.35, 0, 0.3); head.rotation.set(0.2, 0.4, 0.3); jaw.rotation.x = 0.25; legs.forEach((l) => { l.th.rotation.x = -1.4; l.shin.rotation.x = 0.2; }); arms.forEach((a, i) => { a.sh.rotation.set(-2.6, 0, i ? 0.6 : -0.6); a.fore.rotation.x = 0; }); tail.rotation.x = 0.8; }
      else if (pose === 'flee') { body.position.y = 0.7 + 0.05 * Math.abs(q); body.rotation.x = 1.1; head.rotation.x = -0.7; legs.forEach((l, i) => { l.th.rotation.x = -1 + 0.6 * (i ? q : -q); l.shin.rotation.x = 1.1; }); arms.forEach((a, i) => { a.sh.rotation.x = -1.6 + 0.6 * (i ? -q : q); a.fore.rotation.x = 0; }); tail.rotation.x = -0.5; }
    },
  };
  W.tick(0);
  return W;
}
