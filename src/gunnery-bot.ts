/* A bot at the guns: the Gunnery puzzle's move-choosing (src/gunnery.ts), knowing nothing of where it's
   played. TypeScript, compiled to js/gunnery-bot.js; tested in tests/puzzle-bots.test.ts. Written (12 Nov)
   for the race watched (src/race-watch.ts): Dalnoth loading his guns plays his board with it, an arrow at
   a time.

   Greedy, a few beats ahead, as a gunner plays: every so often it looks at the board as it'll roll on,
   and chalks the one arrow (or rubs out the one of its own) that does most good over the next LOOK beats,
   tried on a copy. Good: a store rolled into a gun that wants it (powder, then wad, then shot; a bucket
   into one that's fired or fouled), most for the shot that loads it, sooner better than later. Bad: the
   wrong store, which fouls it. The arrows tried are on the squares the stores will roll over (where an
   arrow can turn one), each of the four ways; it does nothing when nothing helps. */

import { Gunnery, GUNNERY, KINDS, gunMouth, gunSq, k, loadWith, type Gun, type GunState, type Store } from './gunnery.js';
import { seeded } from './mirror-row.js';

/** Beats looked ahead, and how much less a beat later is worth. */
export const GUN_BOT = { LOOK: 16, FADE: 0.96, BY: 'bot' as const };

/** A copy of the board to try an arrow on: its stores, arrows and guns copied, the barrel's next from its
    own seed. */
export function gunneryCopy(g: Gunnery, seed = 1): Gunnery {
  const c = Object.create(Gunnery.prototype) as Gunnery;
  return Object.assign(c, g, {
    stores: g.stores.map((s) => ({ ...s })),
    arrows: new Map([...g.arrows].map(([kk, a]) => [kk, { ...a }])),
    guns: g.guns.map((x) => ({ ...x, port: [x.port[0], x.port[1]] as [number, number] })),
    rand: seeded(seed),
  });
}

/** The store a gun wants next, if it wants one. */
export function wants(s: GunState): Store | null {
  return ({ empty: 'powder', powder: 'wad', wad: 'shot', dirty: 'bucket', fouled: 'bucket', loaded: null } as Record<GunState, Store | null>)[s];
}

/** What a store rolling into a gun that was `was` did, to the bot. */
export function loadWorth(was: GunState, store: Store): number {
  const now = loadWith(was, store);
  if (store === 'bucket') return was === 'dirty' || was === 'fouled' ? 8 : -6;   // (a bucket undoes a part load)
  if (now === 'fouled') return -14;
  return now === 'loaded' ? 16 : 9;
}

/** The board rolled on `beats` beats: what the stores rolled into the guns came to. */
export function rollOn(g: Gunnery, beats: number = GUN_BOT.LOOK): number {
  let v = 0, f = 1;
  for (let i = 0; i < beats; i++, f *= GUN_BOT.FADE) for (const l of g.tick().loads) v += f * loadWorth(l.was, l.store);
  return v;
}

/** What the bot does: an arrow chalked (r, c, the way it points: 0 north, 1 east, 2 south, 3 west), or
    one of its own rubbed out (dir -1); null, nothing. */
export interface GunMove { r: number; c: number; dir: number }

/** The squares stores will roll over in the next beats, as the board stands. */
function ahead(g: Gunnery, beats: number): Set<string> {
  const t = gunneryCopy(g, 7), out = new Set<string>();
  for (let i = 0; i < beats; i++) { t.tick(); for (const s of t.stores) out.add(k(s.r, s.c)); }
  for (const s of g.stores) out.add(k(s.r, s.c));
  return out;
}

/** The move to make now, if one helps. `by`: whose arrows are the bot's (its own are rubbed out). */
export function gunneryMove(g: Gunnery, by: string | number = GUN_BOT.BY): GunMove | null {
  const base = rollOn(gunneryCopy(g, 3));
  let top: GunMove | null = null, topV = base + 0.5;   // (a mark must do some good)
  const tryIt = (m: GunMove) => {
    const t = gunneryCopy(g, 3);
    if (!t.chalk(m.r, m.c, m.dir, by, 1e15)) return;
    const v = rollOn(t);
    if (v > topV) { topV = v; top = m; }
  };
  // Each gun's lane, pointing in: the arrow that loads it.
  for (const gun of g.guns) if (wants(gun.state)) { const [r, c] = gunSq(gun, 0); tryIt({ r, c, dir: gunMouth(gun) }); }
  // Anywhere a store's about to roll over, each way.
  for (const kk of ahead(g, 10)) {
    const [r, c] = kk.split(',').map(Number);
    if (!g.canChalk(r, c)) continue;
    for (let dir = 0; dir < 4; dir++) tryIt({ r, c, dir });
  }
  // Or one of its own rubbed out (one that's about to foul a gun, say).
  for (const a of g.myArrows(by)) tryIt({ r: a.r, c: a.c, dir: -1 });
  return top;
}

/** Guns loaded on the board. */
export const loaded = (g: Gunnery): number => g.guns.filter((x: Gun) => x.state === 'loaded').length;
export { GUNNERY, KINDS };
