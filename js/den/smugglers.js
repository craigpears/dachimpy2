// The smugglers' beach, round the back of Port Decorum (src/den-smugglers.ts; its squares LAY.SMUGGLERS
// in src/den-sail.ts). The user (11 Nov): "the back way in ... accessed far through those whirlpools ...
// Penguin Island, and then you have the ... Smuggler's Beach there ... for that mechanic to plug into
// later." Only the place's own look is here: a little sandy beach in a cove behind the warehouse, a
// lantern on a post, crates and barrels under a tarp, a rowboat drawn up, each a shared piece of
// furniture (furniture.js) placed from config (SMUGGLERS_CAST). The rocks round it are the reef's (the
// sea draws them: reef.js), the run of water down to it the sea's own.
// Touches the rest only through a few hooks: sailing.js builds, ticks and asks it (the prompt), the
// captain's map (a hidden place found: map.js), and a starting point (menus.js).
import * as THREE from 'three';
import { SMUGGLERS, SMUGGLERS_CAST, SMUGGLERS_OFF, Landfall, inSmugglersCove } from '../den-smugglers.js';
import { addFind } from '../den-finds.js';
import { AT_SMUGGLERS_BEACH } from '../lines/you.js';
import { scene, mat, G, toast } from './world.js';
import { sail, seaX, seaZ } from './sea.js';
import { slab } from './isle.js';
import { FURNITURE } from './furniture.js';
import { cine } from './cine.js';

/* Its sand: a low slab, its top a little under Port Decorum's (whose sand tops out at 0.47), sloping
   down into the cove. */
const SAND = { y0: -0.45, h: 0.42 }, GROUND = SAND.y0 + SAND.h + 0.25;
export const smugglers = { W: null, land: new Landfall() };

/** An oval of points round (x, z), rx by rz metres. */
const oval = (x, z, rx, rz, n = 40) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return new THREE.Vector3(x + Math.cos(a) * rx, 0, z + Math.sin(a) * rz); });

function build() {
  const g = new THREE.Group(), S = SMUGGLERS_CAST.sand, x = seaX(S.at[0]), z = seaZ(S.at[1]), rx = S.w * 2, rz = S.d * 2;
  g.add(slab(oval(x, z, rx + 0.6, rz + 0.6), -0.55, 0.4, mat('#c9ad78', { roughness: 1 })));   // (wet sand at its edge)
  g.add(slab(oval(x, z, rx, rz), SAND.y0, SAND.h, mat('#e6cf96', { roughness: 1 })));
  for (const o of SMUGGLERS_CAST.pieces) {
    const p = FURNITURE[o.kind]();
    p.g.position.set(seaX(o.at[0]), GROUND - 0.05, seaZ(o.at[1]));
    p.g.rotation.y = o.yaw;
    g.add(p.g);
  }
  scene.add(g);
  return { g };
}

/** Built the first time the sea's drawn (sailing.js). */
export function smugglersWorld() { smugglers.W ||= build(); }

/** Each tick at sea (sailing.js): coming into the cove, it's found (on the map for good), and said once a voyage. */
export function smugglersTick() {
  if (!sail.on || !smugglers.W) return;
  const p = sail.helm.pose, there = inSmugglersCove(p.c, p.r);
  if (there) G.found = addFind(G.found, 'smugglers');
  if (smugglers.land.arrive(there, !cine)) toast(AT_SMUGGLERS_BEACH);
}

/** What's said at the foot of the screen while she lies in its cove, settled. */
export function smugglersPrompt() {
  if (!sail.on || !smugglers.W) return '';
  const h = sail.helm, p = h.pose;
  if (!inSmugglersCove(p.c, p.r) || h.slot >= 0 || h.held()) return '';
  return `${SMUGGLERS.NAME}, behind Port Decorum · nothing doing here yet · click the sea to drop a pin`;
}

/** A fresh voyage: it's said again when you come in. */
export function smugglersReset() { smugglers.land = new Landfall(); }

/** A starting point (menus.js): at sea, in its cove, bows to the beach. */
export function smugglersCheat() {
  sail.helm.moor(SMUGGLERS_OFF);
  sail.riding = false;
}
