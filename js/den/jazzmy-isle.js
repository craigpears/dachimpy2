// Jazzmy's island on the sloop's sea (src/den-jazzmy.ts; its squares LAY.JAZZMY in src/den-sail.ts), where you pick her
// up for her magic carpet ride (carpet.js, a place of its own). The user (14 Nov): "put it somewhere, don't put it in
// the den though ... This is why we have like a modular system of islands." Out at the far right, past Multibella's: a
// little sandy island, two palms, her spice stall (Ice Spices, as hers on Armstrong Island), a short jetty off its
// left-hand shore and Jazzmy on the end of it, waving. Sail up off that shore and Space brings her alongside and the
// ride begins; it over, you're back aboard her here.
import * as THREE from 'three';
import { LAY } from '../den-sail.js';
import { canPickUpJazzmy, jazzmyMooring, jazzmyShore, jazzmyLandingSquares } from '../den-jazzmy.js';
import * as LOOK from '../den-look.js';
import { mark } from './marks.js';
import { scene, mat, woodTex, keys, makePirate, mesh } from './world.js';
import { sail, seaX, seaZ } from './sea.js';
import { gunneryReset } from './sea-guns.js';
import { outline, slab } from './isle.js';
import { IDLES } from './props-people.js';
import { carpetEnter, JETTY_END } from './carpet.js';
import { palm, stall } from './jazzmy-props.js';

const J = LAY.JAZZMY;
export const jzIsle = { g: null, her: null, t: 0 };

function build() {
  const g = new THREE.Group();
  const shore = jazzmyShore();
  const sand = mat('#e8d49c', { roughness: 1 }), wet = mat('#c4ad7a', { roughness: 1 }), grass = mat('#6a9a48', { roughness: 1 });
  g.add(slab(outline(0.5, shore), -0.55, 0.45, wet), slab(outline(1.1, shore), -0.4, 0.62, sand), slab(outline(2.6, shore), -0.2, 0.5, grass));
  const at = (c, r) => [seaX(c), seaZ(r)];
  // Two palms, her stall facing the landing.
  for (const [c, r, h, lean] of [[24.9, 3.85, 3.6, 1], [25.3, 4.55, 3.0, -0.8]]) { const p = palm(h, lean); const [x, z] = at(c, r); p.position.set(x, 0.25, z); g.add(p); }
  const st = stall(); { const [x, z] = at(24.25, 4.75); st.position.set(x, 0.3, z); st.rotation.y = -Math.PI / 2; g.add(st); }
  // Her jetty, short, off the left-hand shore; her on the end of it.
  // (out as far as the trade wind's lane, LAY.JAZZMY.RUN, where the sloop comes alongside for her carpet ride: its end
  // carpet.js's JETTY_END)
  const plank = mat('#8a6440', { map: woodTex }), [jx, jz] = at(23.2, 4.2);
  const deck = mesh(new THREE.BoxGeometry(4.4, 0.12, 1.1), plank); deck.position.set(jx, 0.45, jz); g.add(deck);
  for (const dx of [-2, -0.7, 0.7, 2]) for (const dz of [-0.45, 0.45]) { const p = mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.1, 6), plank); p.position.set(jx + dx, 0.05, jz + dz); g.add(p); }
  const her = makePirate({ look: LOOK.PIRATES.Jazzmy });
  her.g.position.set(seaX(JETTY_END.c), 0.51, seaZ(JETTY_END.r));
  her.g.rotation.y = -Math.PI / 2;   // (looking out to sea, toward the landing)
  g.add(her.g);
  jzIsle.her = her;
  scene.add(g);
  return g;
}

/** Built the first time the sea's drawn (sailing.js), seen from the den's beach too. */
export function jazzmyWorld() {
  jzIsle.g ||= build();
  // (where Space picks her up, marked on the water: marks.js)
  mark('jazzmy', jazzmyLandingSquares());
}
/** Each frame: her waving when you're off her island, swaying otherwise. */
export function jazzmyTick(dt) {
  const H = jzIsle.her;
  if (!H) return;
  jzIsle.t += dt;
  IDLES[sail.on && canPickUpJazzmy(sail.helm) ? 'wave' : 'sway'](H, jzIsle.t, false);
}
/** Off her island, Space: she's brought alongside and made fast, and off on the ride. She waits there; the ride over,
    you're back aboard. */
export function jazzmyAboard() {
  gunneryReset();
  if (sail.helm.oars) sail.helm.row(false);
  sail.helm.moor(jazzmyMooring());
  keys.clear();
  jazzmyWorld();   // (her island built, if it isn't yet: straight in by den.html?at=carpet)
  carpetEnter({ bySea: true, hide: () => [jzIsle.her?.g] });
}
/** Her island's starting point (den.html?at=jazzmy): at sea, off its landing. */
export function jazzmyCheat() {
  sail.helm.moor({ ...J.MOOR, c: J.MOOR.c - 1 });
  sail.riding = false;
}
export { canPickUpJazzmy };
