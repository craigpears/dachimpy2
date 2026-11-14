// Every adventure ends with something to keep (the user, 14 Nov; RULES.md): what each finished adventure leaves
// you, drawn at the den for good. The rules (what's kept, and where it is: aboard her on the way home, or at the
// den) are src/keepsakes.ts; kept in this browser, as your spouse is (spouse.js). An adventure says when it's
// done with `keepsakeEarn(id)`; den.js ticks `keepsakeTick`. A new keepsake is one entry in KEEPSAKES and one
// drawing in DRAW below, placed by something already at the den.
import * as THREE from 'three';
import { Keepsakes, KEEPSAKES, cleanKept } from '../keepsakes.js';
import { RUM_CAST } from '../den-rumrun.js';
import { keep, toast, burst, V3, obstacles } from './world.js';
import { den, chest } from './land.js';
import { sail } from './sea.js';
import { FURNITURE } from './furniture.js';

const KEY = 'carp.den.keepsakes';
const kept = () => { try { return cleanKept(JSON.parse(localStorage.getItem(KEY))); } catch { return []; } };

/** What you've kept (src/keepsakes.ts's Keepsakes), and each one's drawing at the den once it's there. */
export const keepsakes = { all: new Keepsakes(kept()), shown: {} };

/* Each keepsake at the den: `make()` its group (in the den's own frame, about its anchor), `anchor()` where it
   goes (something already at the den: it moves when the den's laid out again), `solid` what you walk round
   ({x, z, r} about the anchor). */
const DRAW = {
  // Helium's rum (src/den-rumrun.ts, RUM_CAST.den): a little pile behind the treasure chest.
  rumrun: {
    anchor: () => chest.position,
    make() {
      const g = new THREE.Group(), h = RUM_CAST.denH, r = h * 0.36;
      RUM_CAST.den.forEach((p, i) => {
        const b = FURNITURE.barrel({ h }).g;
        if (p.lie) {
          // (on its side: turned about its own middle, resting on the floor)
          const pivot = new THREE.Group();
          b.position.y = -h / 2;
          pivot.add(b);
          pivot.rotation.set(0, 0.5, Math.PI / 2);
          pivot.position.set(p.x, r, p.z);
          g.add(pivot);
        } else {
          b.position.set(p.x, 0, p.z);
          b.rotation.y = i * 1.9;
          g.add(b);
        }
      });
      return g;
    },
    solid: () => RUM_CAST.den.map((p) => ({ x: p.x, z: p.z, r: p.lie ? 0.45 : 0.35 })),
  },
};

/** An adventure finished: its keepsake's yours (aboard her if won at sea, at the den otherwise), kept in this
    browser. True the first time. */
export function keepsakeEarn(id, bySea = sail.on) {
  if (!keepsakes.all.earn(id, bySea)) return false;
  keep(KEY, keepsakes.all.kept);
  return true;
}
/** Whether it's at the den now (an adventure's own drawing of it aboard can go then). */
export const keepsakeHome = (id) => keepsakes.all.home(id);

/** Each tick: what's come home with you put up at the den, and kept there where its anchor is. */
export function keepsakeTick() {
  for (const id of keepsakes.all.settle(sail.on)) toast(KEEPSAKES[id].home);
  for (const id of Object.keys(DRAW)) {
    if (!keepsakes.all.home(id)) continue;
    const D = DRAW[id], a = D.anchor();
    let s = keepsakes.shown[id];
    if (!s) {
      s = keepsakes.shown[id] = { g: D.make(), x: NaN, z: NaN, solid: [] };
      den.add(s.g);
      if (!sail.on) burst(V3(a.x, 0.6, a.z + 3), '#fff3c4', 14, 2.2);
    }
    // Laid out again (the den's been rebuilt): moved with its anchor, and walked round there.
    if (s.x !== a.x || s.z !== a.z) {
      s.x = a.x; s.z = a.z;
      s.g.position.set(a.x, 0, a.z);
      s.solid = D.solid().map((o) => ({ x: a.x + o.x, z: a.z + o.z, r: o.r, keepsake: id }));
    }
    // (the den's obstacles are made afresh when it's laid out: put back if they've gone)
    if (!obstacles.includes(s.solid[0])) {
      for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].keepsake === id) obstacles.splice(i, 1);
      obstacles.push(...s.solid);
    }
  }
}
