// A rock, the den's one look for one (its beach, its sea, a turret's foot: turret.js), needing nothing of
// the den but what it's made of (materials.js), so a page of its own (frigate-test.html) can put one down.
// Its colours change with the den's biome (land.js, applyBiome: rockMats).
import * as THREE from 'three';
import { mat, mesh } from './materials.js';

// The rocks' colours (a reef's drawn in them too: reef.js).
export const ROCK_COLOURS = ['#5d5048', '#6b5c50', '#4f443d', '#73655a'];
export const rockMats = ROCK_COLOURS.map((c) => mat(c, { flatShading: true }));
export function rock(x, y, z, s) {
  const r = mesh(new THREE.DodecahedronGeometry(s, 0), rockMats[Math.floor(Math.random() * rockMats.length)]);
  r.position.set(x, y, z);
  r.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  r.scale.y = 0.7 + Math.random() * 0.5;
  return r;
}
