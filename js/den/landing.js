// The landing off the den's beach: the stretch of water from anywhere on which Space at sea puts you
// ashore (src/den-beach.ts). Drawn to stand out from the sea (the user, 10 Nov: "how to get back to
// shore is not very obvious"): a short jetty out to her mooring with a torch at its end, a post
// flying your flag at each end of the landing, a line of floats along its seaward edge, and its
// water a little lighter, shallows over sand.
import * as THREE from 'three';
import { SAIL } from '../den-sail.js';
import { BEACH } from '../den-beach.js';
import { scene, mat, mesh, canvasTex, woodTex, flagpole } from './world.js';
import { torch } from './land.js';

const L = BEACH.LANDING, CELL = SAIL.CELL;
const X0 = SAIL.X0 + L.c0 * CELL, X1 = SAIL.X0 + (L.c1 + 1) * CELL;   // its ends, along the beach
const EDGE = SAIL.Z0, Z_OUT = EDGE - L.rows * CELL;   // its shore edge (the lowest tide's), its seaward one
const HOME_X = SAIL.X0 + (SAIL.HOME.c + 0.5) * CELL;
const landing = { g: new THREE.Group(), floats: [] };
scene.add(landing.g);
const wood = mat('#6a5038', { map: woodTex }), plank = mat('#9a7a55', { map: woodTex });
function pile(x, z, h, r = 0.11) {
  const p = mesh(new THREE.CylinderGeometry(r, r * 1.15, h, 7), wood);
  p.position.set(x, h / 2 - 0.6, z);   // (its foot down in the sand under the water)
  p.rotation.z = (Math.random() - 0.5) * 0.06;
  return p;
}

// The shallows: the landing's water a little lighter and greener, fading out at its ends and to sea.
const shallowsTex = canvasTex(64, 64, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ends = Math.min(1, Math.min(x, w - 1 - x) / (w * 0.18)), out = Math.min(1, y / (h * 0.55));   // (row 0 is the sea's end)
    const a = Math.round(255 * ends * out), i = (y * w + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = a; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
});
const shallows = mesh(new THREE.PlaneGeometry(X1 - X0, EDGE - Z_OUT), new THREE.MeshBasicMaterial({ color: '#8fe3d2', transparent: true, opacity: 0.32, alphaMap: shallowsTex, depthWrite: false }), false);
shallows.rotation.x = -Math.PI / 2;   // (the texture's top edge to sea)
shallows.position.set((X0 + X1) / 2, 0.052, (EDGE + Z_OUT) / 2);
shallows.renderOrder = 2;
landing.g.add(shallows);

// The jetty: planks on piles from the sand out to her mooring, just along from where you board her.
const JX = HOME_X - 1.9, JW = 1.3, J0 = EDGE + 1.4, J1 = EDGE - 1.1, DECK = 0.42;
for (let z = J0; z > J1; z -= 0.34) {
  const b = mesh(new THREE.BoxGeometry(JW, 0.06, 0.3), plank);
  b.position.set(JX + (Math.random() - 0.5) * 0.04, DECK, z - 0.17);
  b.rotation.y = (Math.random() - 0.5) * 0.03;
  landing.g.add(b);
}
for (const sx of [-1, 1]) {
  const beam = mesh(new THREE.BoxGeometry(0.12, 0.14, J0 - J1), wood);
  beam.position.set(JX + sx * (JW / 2 - 0.08), DECK - 0.1, (J0 + J1) / 2);
  landing.g.add(beam);
  for (let z = J0 - 0.3; z >= J1 - 0.05; z -= 1.2) landing.g.add(pile(JX + sx * (JW / 2 - 0.02), z, DECK + 0.75));
}
// A bollard at its end, and a torch to see it by from the sea.
const bollard = mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.4, 10), mat('#2a2a2a', { metalness: 0.6, roughness: 0.5 }));
bollard.position.set(JX + 0.3, DECK + 0.2, J1 + 0.25);
const lamp = torch(JX - JW / 2 + 0.12, J1 + 0.15);
lamp.position.y = DECK;
landing.g.add(bollard, lamp);

// A tall post at each end of the landing, out at its seaward corners, flying your flag.
for (const x of [X0, X1]) {
  const post = pile(x, Z_OUT + 0.6, 3.4, 0.16);
  const fl = flagpole(1.4);
  fl.position.set(x, 2.75, Z_OUT + 0.6);
  landing.g.add(post, fl);
}

// Floats along its seaward edge, red and white, bobbing.
const floatGeo = new THREE.SphereGeometry(0.28, 12, 8), floatM = [mat('#c8402a', { roughness: 0.6 }), mat('#efe6d0', { roughness: 0.6 })];
for (let i = 1, n = Math.round((X1 - X0) / 2.4); i < n; i++) {
  const f = mesh(floatGeo, floatM[i % 2], false);
  f.scale.y = 0.75;
  f.position.set(X0 + (X1 - X0) * i / n, 0.08, Z_OUT + 0.6);
  f.userData.ph = i * 1.7;
  landing.g.add(f);
  landing.floats.push(f);
}
export function landingTick() {
  const t = performance.now() / 1000;
  for (const f of landing.floats) f.position.y = 0.08 + Math.sin(t * 1.6 + f.userData.ph) * 0.05;
}
