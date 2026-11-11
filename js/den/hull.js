// A ship's hull, the shape every hull in the den is drawn from: the raiders' ship and rowboats, the
// sloop, the checkpoint's hulk, the wedding's barge, a war frigate. (Its outline's half-width at any
// point along it, for building on it: halfBeam in src/ships.ts.)
import * as THREE from 'three';

// A hull seen from above (bow to +x), stood up: `len` long, `beam` wide, `deep` from keel to deck.
export function hullGeo(len, beam, deep, bow = 0.22) {
  const sh = new THREE.Shape(), l = len / 2, b = beam / 2;
  sh.moveTo(-l, -b * 0.85); sh.lineTo(l - len * bow, -b);
  sh.quadraticCurveTo(l, -b * 0.6, l + len * 0.04, 0);
  sh.quadraticCurveTo(l, b * 0.6, l - len * bow, b);
  sh.lineTo(-l, b * 0.85); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: deep, bevelEnabled: false }).rotateX(-Math.PI / 2);
}
