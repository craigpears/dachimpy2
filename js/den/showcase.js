/* Modelling looks, a piece any scene can place (the user, 11 Nov: "a generic module so that you can just
   ... go through someone like as a wardrobe furniture kind of thing that you can just like cycle and demo
   some outfits"). The rules (which look's up, for how long, next, back, the twirl's timing, a piece
   swapped on any look) are src/showcase.ts; this draws them.

   showcase({ looks, fig, wear, say, over, hold, loop, onLook, onEnd, ...person }) goes through `looks`
   ({ title, look } each), changing into each with a twirl and saying its title:
   - who: `fig`, a wardrobe figure the scene already has (Mischievious at her wedding), which the scene
     poses and calls twirlTick() on; or, with no `fig`, a person() of its own placed in the scene (the
     rest of the options are person()'s: parent, x, y, z, yaw, scale, idle, bubble...), posed and twirled
     by its own tick;
   - how it changes: `wear(fig, look)` (world.js's wearLook, or the scene's own);
   - its titles: in the scene's bubbles (`say(fig, text, secs)`), else the person's own;
   - `over`: pieces swapped on every look (src/showcase.ts's restyle: { fam: 'monkey' }), changeable;
   - `hold` seconds each, once round from where it started (`loop`: for ever); `onLook(i)` as each comes
     up, `onEnd()` once it's been round them all.
   Its start(i), stop(), next(), prev(), model(i) (straight into the i-th), look(i) (the i-th as worn,
   swaps and all), `i` and `on`; and tick(dt) each frame.

   twirl(p) and twirlTick(p, dt) spin any wardrobe figure round with a little hop, the one twirl there is. */
import { wearLook } from './world.js';
import { person } from './props-people.js';
import { Showcase, SHOW, TWIRL, twirlAt, titled, restyle } from '../showcase.js';

/** A twirl, from now, on any wardrobe figure. */
export function twirl(p) { if (p) p.twirl = TWIRL.SECS; }
/** Its twirl, each tick once the figure's posed for the frame: round from `yaw`, hopping up a little. */
export function twirlTick(p, dt, yaw = p.yaw) {
  if (!(p?.twirl > 0)) return;
  p.twirl = Math.max(0, p.twirl - dt);
  const { turn, hop } = twirlAt(p.twirl);
  p.g.rotation.y = yaw + turn;
  p.g.position.y += hop;
}

/** A pirate modelling looks: see the top of this file. */
export function showcase({ looks, fig = null, wear = wearLook, say = null, over = {}, hold = SHOW.HOLD, loop = false, onLook = null, onEnd = null, ...placed }) {
  const P = fig ? null : person({ idle: 'stand', ...placed, look: looks[0]?.look, say });
  const S = new Showcase(looks.length, hold, loop);
  const y = placed.y ?? 0;
  const C = {
    fig: fig || P.p, person: P, over,
    get i() { return S.i; },
    get on() { return S.on; },
    /** The i-th look as worn: with the pieces swapped (`over`). */
    look: (i = S.i) => restyle(looks[i].look, C.over, looks.map((l) => l.look)),
    /** Into the i-th look now: changed, a twirl, its title. */
    model(i = S.i) {
      S.pick(i);
      wear(C.fig, C.look());
      twirl(C.fig);
      const text = titled(looks[S.i]);
      if (say) say(C.fig, text, SHOW.TITLE);
      else P?.setScript({ intro: [text] }, { secs: () => SHOW.TITLE, wait: 0, gap: 0 });
      onLook?.(S.i);
    },
    start(i = 0) { S.start(i); if (S.on) C.model(S.i); },
    stop() { S.stop(); },
    next() { C.model(S.i + 1); },
    prev() { C.model(S.i - 1); },
    tick(dt) {
      const r = S.tick(dt);
      if (r === 'next') C.model(S.i);
      else if (r === 'done') onEnd?.();
      if (!P) return;
      P.tick(dt);
      P.p.g.position.y = y;
      twirlTick(P.p, dt, P.yaw);
    },
  };
  return C;
}
