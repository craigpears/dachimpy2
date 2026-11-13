// Someone standing on her deck as she sails, the one way it's drawn: your spouse coming home with you
// (spouse.js), Helium on their rum run (rumrun.js). Where each stands is theirs (src/den-spouse.ts's ABOARD,
// src/den-rumrun.ts's RUM_CAST.aboard): metres along her from her middle (+x her bow) and across her (z).
import { animateWalk } from './world.js';
import { sail, SLOOP_DECK } from './sea.js';

/** A figure (wedding-scene.js's figure()) stood at `at` on her deck, looking ahead, swaying a little with her, a
    hand on the rail; out of the way while a puzzle's on her deck (sail.struck), as her mast is. False if she
    isn't there to stand on, or it's out of the way just now. */
export function standAboard(f, at, dt) {
  const g = f.g;
  if (!sail.g) { g.visible = false; return false; }
  if (g.parent !== sail.g) sail.g.add(g);
  g.visible = !sail.struck;
  const t = performance.now() / 1000;
  g.position.set(at.x, SLOOP_DECK, at.z);
  g.rotation.set(Math.sin(t * 1.3) * 0.03, Math.PI / 2 + Math.sin(t * 0.4 + at.z) * 0.25, 0);
  animateWalk(f, false, dt);
  f.arms[0].rotation.x = -0.5 + Math.sin(t * 2) * 0.05;
  return g.visible;
}
