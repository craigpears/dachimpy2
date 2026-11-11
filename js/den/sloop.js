// The sloop, your ship: her look, wherever she's drawn (at sea: js/den/sea.js and sailing.js; beside a
// war frigate on frigate-test.html). Her size is SLOOP_HULL in src/ships.ts, the measure every other
// ship is drawn against. (Out of js/den/sea.js, so she can be drawn without the den.)
import * as THREE from 'three';
import { SLOOP_HULL } from '../ships.js';
import { mat, mesh, woodTex, flagMat, flagpole } from './world.js';
import { hullGeo } from './hull.js';
import { gunMesh } from './gun.js';

export const SLOOP_DECK = SLOOP_HULL.deck;
// Her, smaller than their ship: one mast, a square sail and a topsail, a bowsprit, a tiller at the
// stern, weathered planks, and your own flag at the masthead. Beamy enough for her two rowers to sit
// side by side, each at their own sweep (the user, 10 Nov: "make the ship a little wider so the
// little guys can sit next to each other"): 2 across, from 1.7; and for her two guns to stand
// straight across from each other, clear of each other as they run in (10 Nov: "they should be just
// cannons on opposite sides of the ship, but in the same slots each side. I don't know if it needs
// to make the ship a bit wider"): 2.3. (Her length, as a lock holds her: HER in src/den-lock.ts.)
export const SLOOP_BEAM = SLOOP_HULL.beam;
/** Her sails' cloths (the canvas in each, its belly bulging along its z) and their one material: for
    the Sailing board's sparkle to fill and light them (js/den/sail-sparkle.js). */
export function sloopSails(g) {
  const cloths = (g?.userData.sails ?? []).map((arm) => arm.children[0]);
  return { cloths, mat: cloths[0]?.material ?? null };
}
export function sloopMesh() {
  const g = new THREE.Group(), hullM = mat('#5e4128', { map: woodTex }), deckM = mat('#9a7a55', { map: woodTex }), spar = mat('#4a2f1a', { map: woodTex });
  const B = SLOOP_BEAM;
  const hull = mesh(hullGeo(SLOOP_HULL.len, B, SLOOP_HULL.deep), hullM);
  hull.position.y = SLOOP_DECK - SLOOP_HULL.deep;
  const deck = mesh(hullGeo(4.25, B - 0.15, 0.05), deckM);
  deck.position.y = SLOOP_DECK - 0.02;
  const stripe = mesh(hullGeo(4.46, B + 0.04, 0.1), mat('#d8c9a0'));
  stripe.position.y = SLOOP_DECK - 0.32;
  g.add(hull, deck, stripe);
  const stern = mesh(new THREE.BoxGeometry(0.9, 0.35, B * 0.87), hullM);
  stern.position.set(-1.65, SLOOP_DECK + 0.17, 0);
  const tiller = mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), spar);
  tiller.position.set(-1.6, SLOOP_DECK + 0.5, 0);
  const sprit = mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.4, 6), spar);
  sprit.rotation.z = -Math.PI / 2 + 0.25; sprit.position.set(2.6, SLOOP_DECK + 0.2, 0);
  const mast = mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8), spar);
  mast.position.set(0.35, SLOOP_DECK + 2.1, 0);
  g.add(stern, tiller, sprit, mast);
  const sailM = mat('#e9dfc8', { side: THREE.DoubleSide, roughness: 0.95 });
  for (const [y, w, ht] of [[1.45, 2, 1.6], [3.1, 1.4, 0.9]]) {
    const geo = new THREE.PlaneGeometry(w, ht, 8, 4), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.cos(pos.getX(i) / w * Math.PI) * 0.22 * (0.6 + 0.4 * Math.cos(pos.getY(i) / ht * Math.PI)));
    geo.computeVertexNormals();
    const cloth = mesh(geo, sailM, false), yard = mesh(new THREE.CylinderGeometry(0.035, 0.035, w + 0.25, 6), spar, false);
    cloth.position.y = -ht / 2; yard.rotation.z = Math.PI / 2;
    const arm = new THREE.Group();
    arm.add(cloth, yard);
    arm.position.set(0.35, SLOOP_DECK + y + ht / 2, 0);
    arm.rotation.y = Math.PI / 2 - 0.45;   // square across her, braced round a little so they show from the side too
    g.add(arm);
    (g.userData.sails ||= []).push(arm);
  }
  const fl = flagpole(0.6, flagMat);
  fl.position.set(0.35, SLOOP_DECK + 4.15, 0);
  g.add(fl);
  g.userData.rig = [mast, fl];   // (struck, with her sails, while you patch a hole in her deck)
  // A gun each side, a smaller copy of the gun tower's, muzzle out over her side (port is her left):
  // a matching pair, in the same slot each side, straight across from each other, between her mast
  // and the tiller. Each runs in and out along its slide (js/den/sailing.js runs it in, by its
  // userData.z, when it's fired), the slide far enough out from her middle that the two, both run
  // in at once, still clear each other.
  g.userData.guns = {};
  for (const side of ['L', 'R']) {
    const slide = new THREE.Group(), gun = gunMesh();
    slide.position.set(-0.3, SLOOP_DECK, side === 'L' ? -0.44 : 0.44);
    slide.rotation.y = side === 'L' ? 0 : Math.PI;   // (its -z out over her side)
    gun.scale.setScalar(0.55);
    gun.position.z = gun.userData.z = -0.36;   // (out along it: her muzzle 1.2 from her middle)
    slide.add(gun);
    g.add(slide);
    g.userData.guns[side] = gun;
  }
  g.rotation.order = 'YXZ';   // (turned to her heading, then heeled over about her own length)
  return g;
}
