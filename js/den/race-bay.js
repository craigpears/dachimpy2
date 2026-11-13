// The sloop race's fort's bay (13 Nov, an experiment: RACE.md §3, "The gate across the fort's bay"; its squares
// LAY.RACE.BAY in src/den-sail.ts, its rules the long way's: src/den-race.ts, longRoute and bayAlong). The user:
// "I like the idea of ... reusing some of the assets ... we've got elsewhere to make the race a bit more scenic
// ... crossing the Imperial Fort would be cool." So the bay in the race's first spit is the Empire's: its mole
// out across the bay in the Empire's pale stone, battlemented, a watchtower at its end where the long way turns;
// at its root by the bend the fort the gate goes through (its gatehouse, guns and guard are the gate's own:
// race-bribe.js, race.js); and on the land at the bay's head, a fort and a few of Port Decorum's buildings, the
// very ones (imperial-town.js), facing out over the bay. Nothing to do here but sail round it, or through.
// Built once with the course (race.js), baked into a mesh a material (bake.js), its flags left to wave.
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { scene, mesh } from './world.js';
import { seaX, seaZ } from './sea.js';
import { M, box, empireStone, imperialBuilding } from './imperial-town.js';
import { tower } from './empire.js';
import { bake } from './bake.js';

const RC = LAY.RACE, Y = RC.BAY, CELL = SAIL.CELL;
/** The spit's land height (race.js, LOOK), the mole's top and the fort's under the gatehouse. */
const LAND_H = 0.9, MOLE_H = 1.5;
export const FORT_H = 2.1;
const key = (c, r) => `${c},${r}`;
/** The mole's squares and the fort's at its root: race.js leaves them to this file, not grass. */
export const moleSquares = new Set(Y.MOLE_AT.map(([c, r]) => key(c, r)));
export const bay = { W: null };

function build() {
  const st = empireStone(), g = new THREE.Group(), stone = new THREE.Group();
  // The mole and the fort at its root: stone, down into the water, the fort's a step higher; merlons along the
  // mole's sides.
  for (const [c, r] of Y.MOLE_AT) {
    const fort = r !== Y.MOLE, h = fort ? FORT_H : MOLE_H, x = seaX(c), z = seaZ(r);
    const b = mesh(new THREE.BoxGeometry(CELL, h + 1, CELL), st); b.position.set(x, (h - 1) / 2, z); stone.add(b);
    if (!fort) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) stone.add(box(0.6, 0.55, 0.5, st, x - CELL / 3 + i * CELL / 3, h + 0.27, z + s * (CELL / 2 - 0.25)));
  }
  // A crimson band along the fort's face to the bay.
  const fortSq = Y.MOLE_AT.filter(([, r]) => r !== Y.MOLE);
  for (const [c, r] of fortSq) stone.add(box(CELL, 0.3, CELL + 0.06, M.crimson, seaX(c), FORT_H - 0.45, seaZ(r)));
  // The watchtower at the mole's end, where the long way turns round it.
  const wt = tower(2.4, 8, { merlon: 0.7, st, band: M.crimson }); wt.position.set(seaX(Y.TIP), MOLE_H, seaZ(Y.MOLE)); stone.add(wt);
  // The bay's head: the fort and a few of Port Decorum's buildings on the land past the turn, facing out over it.
  const head = Y.TURN[0] - 1, P = RC.SPITS[0], mid = (P.r0 + P.r1) / 2, east = Math.PI / 2;
  const place = (o, c, r, yaw) => { o.position.set(seaX(c), LAND_H, seaZ(r)); o.rotation.y = yaw; stone.add(o); };
  if (head >= 4) {
    place(imperialBuilding('fort', { w: 3, d: 3 }), head - 2.5, mid, east);
    place(imperialBuilding('warehouse', { w: 2, d: 1 }), head - 1, P.r0 + 0.5, 0);
    place(imperialBuilding('customs', { w: 2, d: 1 }), head - 1, P.r1 - 0.2, Math.PI);
  }
  // On leg 1's side of the bay, west of the wreck's notch, a market looking out to the leg.
  const wreck = RC.BRIBE.NOTCH[0];
  for (const c of [wreck - 4, wreck - 7]) if (c > head + 1) { place(imperialBuilding('market', { w: 2, d: 1 }), c, P.r0 + 0.6, 0); break; }
  g.add(bake(stone));   // (its flags left as they are, to wave: bake.js)
  scene.add(g);
  return g;
}
/** Built the first time the race's course is (race.js). */
export function bayWorld() { bay.W ||= build(); }
