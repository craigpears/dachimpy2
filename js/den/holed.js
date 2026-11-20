// A ship holed by a shot: the one look for it, wherever she's hit (the race's sloops, race-field.js; the
// frigate test sea's two ships, two-ships.js). The moment: a flash, timber and smoke flying, a shudder.
// Then, till she's patched: stars turning over her, smoke from her deck, and she sits low in the water,
// listing a little. Needs nothing of the den but world.js's bits.
import * as THREE from 'three';
import { mesh, V3, burst, tween } from './world.js';

const starMat = new THREE.MeshBasicMaterial({ color: '#ffe066' });

/** Her holed look, added to her group `g` (hidden till she's hit): stars `y` metres up over (x, 0), `size`
    times the sloop's; `deck`, where her smoke comes from (her local x, y). What holedTick takes. */
export function holedLook(g, { x = -1.15, y = 3.6, size = 1, deck = [0.2, 1.6] } = {}) {
  const stars = new THREE.Group();
  for (let i = 0; i < 3; i++) { const s = mesh(new THREE.OctahedronGeometry(0.14 * size, 0), starMat, false); s.position.set(Math.cos(i * 2.1) * 0.45 * size, 0, Math.sin(i * 2.1) * 0.45 * size); stars.add(s); }
  stars.position.set(x, y, 0);
  stars.visible = false;
  g.add(stars);
  return { g, stars, deck, size, low: 0, smokeT: 0 };
}

/** Each tick: holed (`dazed`), stars turning over her and smoke off her deck; how low she sits (metres, to
    add to her height) and her list (radians, to add to her roll), eased in and out. */
export function holedTick(H, dazed, dt) {
  H.low += ((dazed ? -0.3 * H.size : 0) - H.low) * Math.min(1, dt * 2);
  H.stars.visible = dazed;
  if (dazed) {
    H.stars.rotation.y += dt * 4;
    if ((H.smokeT -= dt) < 0) { H.smokeT = 0.25; burst(H.g.localToWorld(V3(H.deck[0], H.deck[1], 0)), '#6f6a66', Math.round(3 * H.size), 0.7 * H.size); }
  }
  return { low: H.low, list: dazed ? 0.08 / Math.sqrt(H.size) : 0 };
}

/** The moment she's hit: a flash, timber and smoke flying at `y` metres up her (`size` times the sloop's),
    and a shudder. */
export function holedFx(g, y, size = 1) {
  const at = g.localToWorld(V3(0, y, 0));
  burst(at, '#ffb85a', Math.round(16 * size), 4 * size);
  burst(at, '#6b5c50', Math.round(18 * size), 4 * size);
  burst(at, '#3d3530', Math.round(10 * size), 2 * size);
  const x0 = g.rotation.x;
  tween(0.5, (u) => { g.rotation.x = x0 + Math.sin(u * Math.PI * 6) * 0.12 * (1 - u) / size; });
}
