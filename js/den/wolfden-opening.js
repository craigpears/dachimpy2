/* The wolf den's opening (15 Nov), a little cutscene the first time you come into Multibella's hut (cine.js): she's
   at her star table spinning the wheel frantically, rings flying round and stars dropping, to stop the werewolves
   coming, the moon waning in the window and the werewolf there turning back to a wolf-kin; then she stops, and sees
   you. Asked for by the user, 14 Nov (the wolf den's idea card, "Funny cutscenes": her spinning the wheel frantically
   as the moon wanes), and missed on 15 Nov ("I thought she was supposed to be ... turning the table ... just like
   spinning it ... stop the werewolves coming"). Its beats, shots and timing are src/den-wolfden.ts's OPENING
   (`openingAt`); her words src/lines/multibella.ts's OPENING. Space or Esc skips it (cine.js). Played by
   js/den/wolfden-house.js, which hands in what it needs:

     wolfOpening({ H, her, board, moon, paintMoon, done })
       H: the house shell (its say, and `at`, where the house stands); her: Multibella's figure; board: the star
       table's board (nav-board.js), spun on its own real Navigation; moon: the window's Moon; paintMoon(): repaints
       it; done(skipped): once it's over, the hut's own again. */
import { cinePlay, cineEnd } from './cine.js';
import { OPENING, openingAt, TABLE, WINDOW, BACK, ARRIVE } from '../den-wolfden.js';
import { OPENING as SAYS } from '../lines/multibella.js';
import { V3 } from './world.js';

/** Each shot, in the hut's own coordinates (the house's `at` added when it's used). */
const SHOTS = {
  // (the hut from the front, her at the table, the window behind)
  hut: { look: [-0.4, 1.25, -0.8], dist: 5.4, tilt: 0.3, yaw: 0.22 },
  // (over the table, the wheel flying round)
  wheel: { look: [TABLE.x, TABLE.top, TABLE.z], dist: 2.4, tilt: 1.12, yaw: 0.35 },
  // (her and the window both: the moon going and the werewolf at the sill, her still at it; she's in shot, so her
  // words show over her)
  window: { look: [(ARRIVE.her.x + WINDOW.x) / 2 - 0.25, 1.6, (TABLE.z + BACK) / 2], dist: 4.6, tilt: 0.12, yaw: 0 },
  // (on her, turned to you)
  her: { look: [ARRIVE.her.x, 1.5, ARRIVE.her.z], dist: 2.7, tilt: 0.12, yaw: 0.5 },
};

export function wolfOpening({ H, her, board, moon, paintMoon, done }) {
  const at = H.at, cam = { look: V3(), dist: 0, tilt: 0, yaw: 0 };
  const shoot = (name) => {
    const s = SHOTS[name];
    cam.look.set(s.look[0], s.look[1], s.look[2]).add(at);
    Object.assign(cam, { dist: s.dist, tilt: s.tilt, yaw: s.yaw });
  };
  const toTable = Math.atan2(TABLE.x - ARRIVE.her.x, TABLE.z - ARRIVE.her.z), toYou = Math.atan2(ARRIVE.you.x - ARRIVE.her.x, ARRIVE.you.z - ARRIVE.her.z);
  const face0 = her.g.rotation.y;
  let t = 0, beat = -1, spun = 0, painted = 1;
  board.idle = false;
  shoot('hut');

  /** Her hands on the wheel: a ring turned either way, or a star dropped where it won't booch. */
  function spin() {
    const g = board.game;
    if (Math.random() < 0.3 && !g.grid[g.rings - 1][g.next.spoke]) { board.drop(); return; }
    g.ring = Math.floor(Math.random() * g.rings);
    board.turn(Math.random() < 0.5 ? 1 : -1);
  }
  const c = {
    cam,
    tick(dt) {
      t += dt;
      const now = openingAt(t);
      if (now.beat !== beat) {
        beat = now.beat;
        const b = OPENING.BEATS[beat];
        shoot(b.shot);
        H.say(her, SAYS[b.say], (OPENING.BEATS[beat + 1]?.at ?? OPENING.SECS) - b.at);
      }
      // (the wheel, flying round: a move every SPIN.EVERY, never so many queued it's only a blur)
      if (now.spinning && (spun -= dt) <= 0) { spun = OPENING.SPIN.EVERY; if (board.queue.length < 6) spin(); }
      // (the moon going, the werewolf turning back as it does)
      moon.left = moon.full * now.moon;
      if (Math.abs(painted - now.moon) > 0.015 || (now.moon === 0 && painted)) { painted = now.moon; paintMoon(); }
      // (her at the wheel: both hands going, frantic, then turned to you)
      const p = her;
      if (now.spinning) {
        p.g.rotation.y = toTable;
        p.arms[0].rotation.set(-1.25 + Math.sin(t * 17) * 0.45, 0, 0.3 + Math.sin(t * 11) * 0.2);
        p.arms[1].rotation.set(-1.25 + Math.cos(t * 15) * 0.45, 0, -0.3 - Math.cos(t * 9) * 0.2);
        p.body.rotation.z = Math.sin(t * 13) * 0.06;
      } else {
        p.g.rotation.y += (toYou - p.g.rotation.y) * Math.min(1, dt * 6);
        p.body.rotation.z = 0;
      }
      if (now.done) end(false);
    },
    end(skip) { finish(skip); },
  };
  let over = false;
  const end = (skip) => cineEnd(skip);
  function finish(skip) {
    if (over) return;
    over = true;
    her.g.rotation.y = face0;
    her.body.rotation.z = 0;
    H.say(her, null);
    done(skip);
  }
  cinePlay(c);
  return c;
}
