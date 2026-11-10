/* Pirate Den: Dignity, the imperial checkpoint's commander, on its gate. TypeScript, compiled to
   js/den-dignity.js; tested in tests/den-dignity.test.ts. js/den/dignity.js draws her and plays her
   cutscene; this says what she says and when, and when the warning shot goes.

   The user (10 Nov): "adding [her] as the dutiful commander of the imperial checkpost, kind of
   peering down from the gates ... give her a little cutscene similar to Dalnoth ... come up with
   something witty for her". And on her warning shot: "I need to give it a bit of a cheeky giggle
   and a win". And then: "we've really got to go all in with Dignity's little cutscene. She's got
   to be very cute. The lavender monkey has got to be involved somehow ... the little monkey is the
   one that fires the cannon at you." And of the first go at it: "I love it. The cheeky giggle and
   the spyglass, definitely complete it."

   So: the first time she sails up to the checkpoint (from the cove's side), a short cutscene. The
   camera finds Dignity on the gate with her spyglass up; she lowers it, sees you, has her say, and
   sends Bella (her lavender monkey) scampering down off her shoulder to one of the checkpoint's own
   guns, the real ones that shoot at you (the user, 10 Nov: "can you actually make the monkey pop
   to the actual cannons that shoot at you? Having a fake little cannon at the top seems ... try
   and keep it more real to what actually fires at you"). Bella chatters, salutes, lights the fuse
   and covers her ears: the warning shot lands right beside the sloop, a splash and spray over her
   deck. Dignity giggles at it, Bella strikes a proud pose and
   scampers back up. After that, a line over her head now and then as things happen, each said once.
   She's only a look (PIRATES.Dignity in den-look.js): this knows nothing of how she's drawn. */

import type { CheckEvent, ShotAt } from './den-checkpoint.js';

/** Her lines: the cutscene's, then the ones for later (each said once). */
export const SAYS = {
  halt: 'Halt! Imperial checkpoint. State your busi...',
  oh: '...oh. Pirates. It\'s always pirates.',
  lively: 'Look lively! And do try to hit them this time.',
  giggle: 'Hee hee! Oops. That was a warning shot. Mostly. Come any closer and the next ones won\'t be.',
  /** Bella's chatter, as she's sent to the gun, and when it's gone off. */
  eek: 'Eek eek!',
  proud: 'Eek!',
  closer: 'One more stroke and I\'ll have to shoot. There\'ll be paperwork. I hate paperwork.',
  wrecked: 'That was Imperial property!',
  passed: 'This is going in my report. In very small, very cross handwriting.',
  canal: 'Nobody uses the canal. Nobody!',
} as const;

/** The lines said as things happen, after the cutscene (or without it, for the canal). */
export type Later = 'closer' | 'wrecked' | 'passed' | 'canal';

export const DIGNITY = {
  /** How near her gate (squares, any way) she spots you, from the cove's side: the cutscene. As
      the checkpoint's own sight (CHECK.SIGHT): where the trade wind drops her, facing its gate. */
  SPOT: 4,
  /** How near she must come for "one more stroke": the square before its guns' first mark. */
  CLOSER: 3,
  /** Where the warning shot comes down: this far from her (metres), on the gun's side of her, a
      little off her line, so the splash goes over her deck and the shot misses. */
  MISS: 2.4,
  ASIDE: 1.1,
} as const;

/** The cutscene's beats, in seconds from its start. Her: spyglass up and peering out; lowering it;
    "Halt!"; "...oh. Pirates."; "Look lively!" to Bella, who chatters and scampers down to the gun,
    salutes, lights the fuse and covers her ears; the shot (the camera with it, out to the sloop)
    and its splash; back to Bella at her gun for her proud little pose; then Dignity's giggle, and
    Bella scampering home to her shoulder. The end isn't rushed (the user, 10 Nov: "the giggling
    monkey or her giggling at the end all go by very quickly"): Bella's proud pose and Dignity's
    giggle get time to land, and her first lines and Bella's chatter are said at a comfortable
    reading pace ("look lively ... you cannot really finish reading", 10 Nov): "Look lively!" is
    said on her, before the camera goes to Bella. */
export const BEATS = {
  lower: 1.7,
  halt: 2.1,
  oh: 5.1,
  lively: 7.9,
  chatter: 11.1,
  hop: 12.3,
  salute: 13.9,
  fuse: 14.4,
  ears: 15.2,
  fire: 15.7,
  splash: 16.85,
  back: 17.8,
  proud: 17.8,
  giggle: 20.2,
  home: 21.0,
  end: 26.7,
} as const;

/** Seconds Bella takes to scamper down to the gun (off Dignity's shoulder, along the gatehouse's
    top and a leap down onto the bastion), or back up again. */
export const HOP_SECS = 1.6;

/** What she's doing: each beat of the cutscene runs from its start to the next's. */
export type Beat = 'peer' | 'lower' | 'halt' | 'oh' | 'lively' | 'fire' | 'giggle';
/** What Bella's doing. */
export type BellaBeat = 'shoulder' | 'chatter' | 'hop' | 'salute' | 'fuse' | 'ears' | 'boom' | 'proud' | 'home';
/** Where the camera is: on her, on her and the gun, or out with the shot to the sloop. */
export type Shot = 'her' | 'gun' | 'sloop';

/** The cutscene at t seconds: what she and Bella are doing (and how far into it, 0 to 1), what's
    said, the shot in the air (0 to 1, null when it isn't), and whether it's over. */
export function sceneAt(t: number): {
  beat: Beat; u: number; bella: BellaBeat; bu: number; says: string | null; chat: string | null;
  shot: number | null; cam: Shot; done: boolean;
} {
  const B = BEATS;
  const span = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const [beat, u]: [Beat, number] = t < B.lower ? ['peer', span(0, B.lower)]
    : t < B.halt ? ['lower', span(B.lower, B.halt)]
      : t < B.oh ? ['halt', span(B.halt, B.oh)]
        : t < B.lively ? ['oh', span(B.oh, B.lively)]
          : t < B.fire ? ['lively', span(B.lively, B.fire)]
            : t < B.giggle ? ['fire', span(B.fire, B.giggle)]
              : ['giggle', span(B.giggle, B.end)];
  const [bella, bu]: [BellaBeat, number] = t < B.chatter ? ['shoulder', 0]
    : t < B.hop ? ['chatter', span(B.chatter, B.hop)]
      : t < B.salute ? ['hop', span(B.hop, B.salute)]
        : t < B.fuse ? ['salute', span(B.salute, B.fuse)]
          : t < B.ears ? ['fuse', span(B.fuse, B.ears)]
            : t < B.fire ? ['ears', span(B.ears, B.fire)]
              : t < B.proud ? ['boom', span(B.fire, B.proud)]
                : t < B.home ? ['proud', span(B.proud, B.home)]
                  : t < B.home + HOP_SECS ? ['home', span(B.home, B.home + HOP_SECS)]
                    : ['shoulder', 0];
  const says = beat === 'halt' ? SAYS.halt : beat === 'oh' ? SAYS.oh : beat === 'lively' && t < B.chatter ? SAYS.lively
    : beat === 'giggle' && t > B.giggle + 0.15 ? SAYS.giggle : null;
  const chat = bella === 'chatter' ? SAYS.eek : bella === 'proud' && bu < 0.6 ? SAYS.proud : null;
  const shot = t >= B.fire && t < B.splash ? span(B.fire, B.splash) : null;
  const cam: Shot = t >= B.fire + 0.15 && t < B.back ? 'sloop' : (t >= B.chatter && t < B.fire + 0.15) || (t >= B.back && t < B.giggle) ? 'gun' : 'her';
  return { beat, u, bella, bu, says, chat, shot, cam, done: t >= B.end };
}
/** Where the warning shot comes down, from the gun at `gun` on the sloop at `ship` (metres, on the
    water): MISS short of her toward the gun, ASIDE off her line. Close enough to splash her. */
export function missAt(ship: { x: number; z: number }, gun: { x: number; z: number }): { x: number; z: number } {
  const dx = gun.x - ship.x, dz = gun.z - ship.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
  return { x: ship.x + ux * DIGNITY.MISS - uz * DIGNITY.ASIDE, z: ship.z + uz * DIGNITY.MISS + ux * DIGNITY.ASIDE };
}

/** The gun Bella runs to (as LAY.CHECKPOINT.GUNS): the one on Dignity's left (the bigger column:
    her shoulder's side), unless it's wrecked. `guns`: each one's column; `gate`: the gate's. */
export function bellaGun(guns: number[], gate: number, wrecked: boolean[]): number {
  const order = guns.map((c, i) => i).sort((a, b) => (guns[b] > gate ? 1 : 0) - (guns[a] > gate ? 1 : 0));
  return order.find((i) => !wrecked[i]) ?? order[0];
}

/** How long a line stays over her head (seconds): long enough to read. */
export function readSecs(text: string): number {
  return Math.min(6, Math.max(2.4, text.length * 0.065));
}

/** How near her gate the sloop is (squares, any way), and whether she's on its near side (the
    cove's, where the trade wind brings her). `gate`: the gate's square (LAY.CHECKPOINT: GATE, ROW). */
export function fromGate(ship: { c: number; r: number }, gate: { c: number; r: number }): { near: number; before: boolean } {
  return { near: Math.max(Math.abs(ship.c - gate.c), Math.abs(ship.r - gate.r)), before: ship.r < gate.r };
}

/** Her line for something that's happened at the checkpoint (its own events, src/den-checkpoint.ts):
    a gun of hers wrecked; you through its gate (either way); out round it by the locks. */
export function heard(e: CheckEvent | ShotAt): Later | null {
  if ('on' in e) return e.on === 'gun' && e.did === 'wrecked' ? 'wrecked' : null;
  if (e.kind !== 'through') return null;
  if (e.how === 'gate') return 'passed';
  return e.back ? null : 'canal';
}

/** Dignity: whether you've met (the cutscene's played) and what she's said since. */
export class Dignity {
  /** The cutscene's played (or been skipped). */
  met = false;
  private said = new Set<Later>();

  /** Each tick at sea: the sloop `near` squares from her gate, on its near side (`before`) or
      not; null when she's not out. 'scene' the first time she's in sight from the near side;
      'closer' once, after it, when she's one stroke off its guns' first mark. */
  watch(near: number | null, before: boolean): 'scene' | 'closer' | null {
    if (near === null || !before) return null;
    if (!this.met && near <= DIGNITY.SPOT) { this.met = true; return 'scene'; }
    if (this.met && near <= DIGNITY.CLOSER) return this.say('closer') ? 'closer' : null;
    return null;
  }

  /** Something's happened (a gun of hers wrecked, you got past, you came round by the locks): her
      line for it, once. The canal's said even if she never saw you sail up (she sees you come out
      of the locks); the rest only once you've met. Null if there's nothing (more) to say. */
  say(line: Later): string | null {
    if (this.said.has(line) || (!this.met && line !== 'canal')) return null;
    this.said.add(line);
    if (line === 'canal') this.met = true;   // (she's seen you now: no cutscene later)
    return SAYS[line];
  }
}
