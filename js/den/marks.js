// Where Space does something, marked (src/den-marks.ts: which squares, by whose name, and when they show): a gold
// ring pulsing on the water of each, while she's near. Any part says its targets with `mark(name, squares)` (none
// to clear them); sailing.js ticks it. One look for every quest's next stop and every place's starting point (the
// user, 14 Nov: "always make that a generic thing ... this is like a quest or target").
import * as THREE from 'three';
import { Marks } from '../den-marks.js';
import { scene } from './world.js';
import { sail, seaX, seaZ, liftAt } from './sea.js';
import { SAIL } from '../den-sail.js';

export const marks = new Marks();
/** Set (or, with none, clear) a part's targets. */
export const mark = (name, squares) => marks.set(name, squares);

const ring = new THREE.RingGeometry(SAIL.CELL * 0.3, SAIL.CELL * 0.4, 40).rotateX(-Math.PI / 2);
const dot = new THREE.CircleGeometry(SAIL.CELL * 0.12, 24).rotateX(-Math.PI / 2);
const gold = new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.85, depthWrite: false });
const glow = new THREE.MeshBasicMaterial({ color: '#fff1b0', transparent: true, opacity: 0.5, depthWrite: false });
const pool = [];
let t = 0;
function piece(i) {
  return pool[i] ||= (() => {
    const g = new THREE.Group(), r = new THREE.Mesh(ring, gold), d = new THREE.Mesh(dot, glow);
    r.renderOrder = d.renderOrder = 4;
    g.add(r, d);
    scene.add(g);
    return g;
  })();
}

/** Each tick at sea: the marks near her, pulsing; none while she's off the water or a cutscene's on (`hide`). */
export function marksTick(dt, hide = false) {
  t += dt;
  const p = sail.helm?.pose, shown = !hide && sail.on && p ? marks.shown(p.c, p.r) : [];
  const s = 1 + 0.12 * Math.sin(t * 4), o = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t * 4));
  gold.opacity = o;
  shown.forEach(([c, r], i) => {
    const g = piece(i);
    g.visible = true;
    g.position.set(seaX(c), 0.1 + liftAt(c, r) + Math.sin(t * 1.3 + c) * 0.03, seaZ(r));
    g.scale.set(s, 1, s);
  });
  for (let i = shown.length; i < pool.length; i++) pool[i].visible = false;
}
