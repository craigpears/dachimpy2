// Port Decorum, the island under imperial control, out past the checkpoint where the main shipping lane
// leads (src/den-imperial.ts; its squares LAY.EMPIRE in src/den-sail.ts). Sketched, to sail up to and
// look at, nothing to do there yet (the user, 11 Nov: "even if it's just an empty island or something
// where you can't interact yet ... under imperial control"): the trading, looting and smuggling come
// later. Only the place's own look is here, in the Empire's stone, crimson and gold (empire.js, as the
// checkpoint's): sand and grass, a stone quay along its near shore and a jetty out from it toward the
// gate (where trading will happen), a customs house at the jetty's foot, a market and a warehouse along
// the quay, a fort at the back, its keep flying the Empire's flag, a watchtower; and its guards, from
// config (src/den-imperial.ts, EMPIRE_CAST), placed through the shared pieces (props-people.js's
// person(), in the Empire's uniform from the wardrobe). Built to scale with the sloop (FORT, below),
// and cheaply: boxes, a few shared materials, baked into a mesh a material (bake.js).
// Touches the rest only through a few hooks: sailing.js builds, ticks and asks it (the prompt), sea.js's
// voices (whom you hear), and a starting point (menus.js).
import * as THREE from 'three';
import { LAY } from '../den-sail.js';
import { EMPIRE, EMPIRE_CAST, EMPIRE_SAYS, EMPIRE_STANDS, EMPIRE_OFF, UNIFORM, Sighting, onEmpireLanding, inEmpireEarshot, empireShore } from '../den-imperial.js';
import { SIGHTED } from '../lines/imperial-guards.js';
import { cleanLook } from '../den-look.js';
import { readSecs } from '../den-dignity.js';
import { scene, mat, mesh, toast } from './world.js';
import { sail, seaX, seaZ, voices } from './sea.js';
import { outline, slab } from './isle.js';
import { palm } from './wedding-scene.js';
import { person } from './props-people.js';
import { PACE } from '../chatter.js';
import { cine } from './cine.js';
import { bake } from './bake.js';
import { M, box, flag, empireStone, imperialBuilding } from './imperial-town.js';

/* Its ground: a sand slab's top (isle.js's slab tops out at y0 + its height + its bevel's 0.25), as on
   Tzz's and Kikkit's islands, so everyone stands on it. A square is SQ metres (imperial-town.js). */
const SAND = { y0: -0.4, h: 0.62 }, GROUND = SAND.y0 + SAND.h + 0.25;
export const empire = { W: null, sight: new Sighting() };

// (its buildings, their materials and helpers: imperial-town.js, shared with the race's fort's bay)

function build() {
  const st = empireStone();
  const g = new THREE.Group(), C = EMPIRE_CAST;
  const sand = mat('#e6cf96', { roughness: 1 }), wet = mat('#c9ad78', { roughness: 1 }), grass = mat('#6f9a4a', { roughness: 1 });
  const shore = empireShore();
  g.add(slab(outline(0.5, shore), -0.55, 0.45, wet), slab(outline(1.1, shore), SAND.y0, SAND.h, sand));
  // Grass over its back, where the fort stands.
  const back = outline(3.4, shore).map((p) => p.clone().add(new THREE.Vector3(0, 0, -1.4)));
  g.add(slab(back, SAND.y0 + 0.05, SAND.h, grass));
  // The quay: a stone wall along its near shore, its top level with the sand, bollards along its face.
  const Q = C.quay, x0 = seaX(Q.c0), x1 = seaX(Q.c1), qz = seaZ(Q.r), QD = 2.4;
  g.add(box(x1 - x0, 1.55, QD, st, (x0 + x1) / 2, GROUND + 0.12 - 0.775, qz - QD / 2));   // (its top a step above the sand)
  for (let x = x0 + 1.4; x < x1 - 0.5; x += 3.2) { const b = mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.42, 10), M.iron); b.position.set(x, GROUND + 0.33, qz - 0.3); g.add(b); }
  // The jetty: out from the quay toward the gate, planked, on piles, the Empire's flag at its end.
  const [jc, jr] = LAY.EMPIRE.JETTY, jx = seaX(jc), jz0 = qz - 0.1, jz1 = seaZ(jr - 0.45), DECK = GROUND + 0.05, JW = 1.6;
  for (let z = jz0; z < jz1; z += 0.34) g.add(box(JW, 0.07, 0.3, M.plank, jx, DECK, z + 0.17));
  for (const s of [-1, 1]) for (let z = jz0 + 0.8; z <= jz1; z += 1.25) { const p = mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.6, 7), M.timber); p.position.set(jx + s * (JW / 2 - 0.05), DECK - 0.7, z); g.add(p); }
  const post = box(0.2, 2.2, 0.2, M.timber, jx + JW / 2 - 0.1, DECK + 1.1, jz1 - 0.2); g.add(post);
  flag(g, post.position.x, DECK + 2.2, post.position.z, 1, 1.4);
  // The town and its fort, baked into a mesh a material (bake.js), their flags left to wave.
  const town = new THREE.Group();
  for (const o of C.town) {
    const b = imperialBuilding(o.kind, o);
    b.position.set(seaX(o.at[0]), GROUND - 0.02, seaZ(o.at[1]));
    town.add(b);
  }
  g.add(bake(town));
  // Cargo on the quay: crates and barrels.
  C.cargo.forEach(([c, r], i) => {
    const x = seaX(c), z = seaZ(r);
    if (i % 2) { const b = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 10), M.timber); b.position.set(x, GROUND + 0.4, z); g.add(b); }
    else { const k = box(0.75, 0.75, 0.75, M.crate, x, GROUND + 0.37, z); k.rotation.y = i * 0.7; g.add(k); if (i === 0) g.add(box(0.6, 0.6, 0.6, M.crate, x + 0.1, GROUND + 1.05, z - 0.05)); }
  });
  for (const [c, r] of C.palms) { const p = palm(4, 0.25); p.scale.setScalar(0.75); p.position.set(seaX(c), 0.2, seaZ(r)); p.rotation.y = c * 2.3 + r; g.add(p); }
  // Its guards, in the Empire's uniform; the one on the jetty's end does the talking.
  const ship = () => (sail.on ? sail.helm.pose : null);
  const guards = C.guards.map((o) => person({
    look: cleanLook({ ...UNIFORM, ...o.face }), parent: g, x: seaX(o.at[0]), y: o.talks ? GROUND + 0.09 : GROUND, z: seaZ(o.at[1]), yaw: o.yaw, idle: o.idle,   // (the one who talks, on the jetty's planks)
    ...(o.talks ? {
      script: EMPIRE_SAYS, secs: readSecs, gap: PACE.ASIDE,   // (his halt at once, then a grumble now and then: chatter.ts, PACE)
      wait: 0.6, bubble: 'page', shown: () => sail.on,
      earshot: () => { const s = ship(); return !!s && inEmpireEarshot(s.c, s.r) && voices.hears('empire', s.c, s.r); },
      face: () => { const s = ship(); return s && inEmpireEarshot(s.c, s.r) ? { x: seaX(s.c), z: seaZ(s.r) } : null; },
    } : {}),
  }));
  voices.add('empire', { c: EMPIRE_STANDS.c, r: EMPIRE_STANDS.r, earshot: EMPIRE.EARSHOT });
  scene.add(g);
  return { g, guards };
}

/** Built the first time the sea's drawn (sailing.js), seen from afar too. */
export function empireWorld() { empire.W ||= build(); }

/** Each tick at sea (sailing.js): the first time on a voyage you come up off it, whose it is. */
export function empireTick(dt) {
  const W = empire.W;
  if (!W) return;
  if (sail.on) {
    const p = sail.helm.pose;
    if (empire.sight.arrive(onEmpireLanding(p.c, p.r), !cine)) toast(SIGHTED);
  }
  for (const gd of W.guards) gd.tick(dt);
}

/** What's said at the foot of the screen while she lies off it, settled. */
export function empirePrompt() {
  if (!sail.on || !empire.W) return '';
  const h = sail.helm, p = h.pose;
  if (!onEmpireLanding(p.c, p.r) || h.slot >= 0 || h.held()) return '';
  return `Off ${EMPIRE.NAME}, under imperial control · click the sea to drop a pin`;
}

/** Its guards turned to watch something go by (a world point { x, z }: Helium's rum run, rumrun.js), or (null)
    back to looking out as they were. */
export function empireWatch(at) {
  for (const gd of empire.W?.guards ?? []) gd.lookAt = at;
}
/** The jetty guard hushed while someone else's scene talks with him (true), or grumbling again; his figure's
    group, to put a line over. */
export function empireQuiet(on) {
  const gd = empire.W?.guards.find((x) => x.chatter?.script?.intro);
  if (!gd) return null;
  gd.chatty = !on;
  if (on) gd.hush();
  return gd.p.g;
}

/** A fresh voyage: whose it is to be said again, and the jetty guard to halt you again. */
export function empireReset() {
  empire.sight = new Sighting();
  for (const gd of empire.W?.guards ?? []) if (gd.chatter?.script?.intro) gd.restart();
}

/** A starting point (menus.js): at sea, just off its jetty, bows to the island. */
export function empireCheat() {
  sail.helm.moor(EMPIRE_OFF);
  sail.riding = false;
}
