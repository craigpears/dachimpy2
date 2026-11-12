// The sloop race's rocks across a gap in spit 3 (12 Nov; rules src/den-race.ts, Rocks: ROCKS.HITS hits,
// anyone's, counted by the race's field; squares LAY.RACE.ROCKS). The user: "if you had like a destructible
// obstacle there ... once it's been destroyed, that opens it up ... for everybody ... Maybe you could do it with
// like 3 gunshots or something." Drawn as a wall of grey boulders piled across the mouth of the gap, off leg 3,
// the gap's open water plain behind it down to leg 4: three courses of them, the top one knocked off at the
// first hit, the next at the second, a burst of stone and dust each time; at the last the wall falls in a
// cloud and leaves rubble heaped low against the gap's banks, its water open for every racer. Online, the
// room's count of everyone's hits brings it down in every browser at once (race-net.js). Touches the rest only
// through race.js (its shot, its tick, its reset).
import * as THREE from 'three';
import { LAY, SAIL } from '../den-sail.js';
import { RACE, onRocks, rocksDown, rocksOn } from '../den-race.js';
import { V3, burst, toast, tween } from './world.js';
import { rock } from './land.js';
import { sail, seaX, seaZ } from './sea.js';

const RC = LAY.RACE, K = RC.ROCKS, CELL = SAIL.CELL;
export const rocks = { W: null, shown: 0, open: false };

/** The wall: three courses of boulders on the gap's mouth (base, middle, top), and the rubble left after. */
function build(parent) {
  const [c, r] = K.WALL[0], x = seaX(c), z = seaZ(r), g = new THREE.Group();
  const course = (n, y, s, spread) => {
    const cg = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const u = n > 1 ? i / (n - 1) - 0.5 : 0;
      cg.add(rock(x + u * CELL * spread + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * CELL * 0.5, s * (0.85 + Math.random() * 0.3)));
    }
    g.add(cg);
    return cg;
  };
  const courses = [course(4, 0.4, 1.05, 0.95), course(3, 1.6, 0.95, 0.7), course(2, 2.7, 0.8, 0.45)];
  // The rubble: low stones heaped against either bank, shown once it's down.
  const rubble = new THREE.Group();
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) rubble.add(rock(x + side * CELL * (0.36 + Math.random() * 0.1), -0.1 + Math.random() * 0.2, z + (Math.random() - 0.5) * CELL * 0.9, 0.35 + Math.random() * 0.3));
  rubble.visible = false;
  g.add(rubble);
  parent.add(g);
  return { g, courses, rubble, at: V3(x, 1.4, z) };
}
/** Built with the race's course (race.js). */
export function rocksWorld(parent) { rocks.W ||= build(parent); }

/** Her broadside came down on (c, r) (race.js, raceShot): on the rocks, a hit on them (the race's field
    counts it, shared), shown at the tick. Whether it was theirs. */
export function rocksShot(R, c, r) {
  if (!onRocks(c, r)) return false;
  if (R.state !== 'on') { toast('A hit on the rocks! (They come down in a race, three hits: anyone\'s)'); return true; }
  const { hit, down } = R.blast();
  if (!hit && down) return true;
  if (!down) toast(`A hit on the rocks! ${RACE.ROCKS.HITS - R.field.rocks} more and they're down, for everyone`);
  return true;
}

/** A course of boulders knocked off: tumbled away into the gap with a burst of stone and dust. */
function crumble(cg) {
  const from = cg.children.map((o) => o.position.clone());
  burst(rocks.W.at.clone().setY(cg.children[0]?.position.y ?? 1), '#9a958c', 16, 3);
  burst(rocks.W.at.clone().setY(cg.children[0]?.position.y ?? 1), '#d8d2c4', 10, 2);
  tween(0.8, (u) => cg.children.forEach((o, i) => { o.position.y = from[i].y - u * u * 3; o.position.x = from[i].x + (i % 2 ? 1 : -1) * u * 0.8; o.rotation.x += 0.08; }), () => { cg.visible = false; cg.children.forEach((o, i) => o.position.copy(from[i])); });
}

/** Each tick (race.js): the field's hits on the rocks shown, a course knocked off each; down, their water
    opened on her sea, the rubble left. */
export function rocksTick(R) {
  if (!rocks.W || !sail.sea) return;
  const hits = Math.min(RACE.ROCKS.HITS, R.state === 'on' || R.state === 'done' ? R.field.rocks : 0);
  while (rocks.shown < hits) {
    const cg = rocks.W.courses[rocks.W.courses.length - 1 - rocks.shown];
    if (cg) crumble(cg);
    rocks.shown++;
  }
  if (!rocks.open && rocksDown(R.field) && (R.state === 'on' || R.state === 'done')) {
    rocks.open = true;
    rocksOn(sail.sea, false);
    rocks.W.rubble.visible = true;
    burst(rocks.W.at, '#b8b2a6', 24, 4);
    toast('The rocks are down! The gap\'s open, for everyone');
  }
}

/** Back across the gap, for a new race. */
export function rocksReset() {
  rocks.shown = 0;
  if (rocks.open && sail.sea) rocksOn(sail.sea, true);
  rocks.open = false;
  if (rocks.W) { for (const cg of rocks.W.courses) cg.visible = true; rocks.W.rubble.visible = false; }
}
