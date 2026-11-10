/* Pirate Den: the raids, and when they come. TypeScript, compiled to js/den-raids.js; tested in
   tests/den-raids.test.ts. den.js runs the waves and sails the ship; this says what follows each.

   The user (9 Nov) liked the quick intro, under attack from the start, but wanted the raids to
   become "a bit more opt-in" after a few waves, "so you're not constantly under pressure and you
   feel free to go explore, roam, and do different puzzles". Then, on the sketch ("Raids you choose"
   in IDEAS.md): "Yeah, I like that. Yeah, do a few waves." So the opening siege is three waves;
   beat the third and their captain calls it off and sails out of the cove, and the den's quiet:
   no countdown to the next one. (What brings raiders back in force later, a sail on the horizon or
   a bell you ring, is still to come.) But not too quiet: now and then a boat puts in with a raider
   or two (STRAGGLERS, below), something to throw your spare pieces at. */

export const SIEGE = {
  /** Waves in the opening siege. */
  WAVES: 3,
} as const;

/** Where the den is: mending before the first wave ('build'), a wave on ('wave'), a breather with
    the next wave counting down ('calm'), or the siege over and nobody coming ('peace'). */
export type Phase = 'build' | 'wave' | 'calm' | 'peace';

/** What follows a wave beaten off: a breather before the next, or, once the opening siege is
    beaten (and after any raid since), the den's quiet. */
export function afterWave(wave: number): 'calm' | 'peace' {
  return wave >= SIEGE.WAVES ? 'peace' : 'calm';
}

/** Whether the next wave is counting down: only before the first, and between the siege's waves. */
export const countingDown = (phase: Phase): boolean => phase === 'build' || phase === 'calm';

/** What timber comes next for the rampart: the walk (the first part), a later part (the stairs,
    the gun tower), or nothing (all built, or a frame still being filled). */
export type NextPart = 'walk' | 'later' | null;

/** Whether the next part's timber comes now. A later part comes as the reward for beating a wave
    off. The walk comes as soon as every hole in the wall's mended, mid-wave or not (the user,
    8 Nov: "the walk should appear once you are safe and have filled in all the holes, so you can
    work on that while they try in a futile attempt to get in"), or with a wave beaten off if that
    comes first. Once the siege is over (`peace`), there are no more waves to bring it, so each part
    comes as soon as the one before is built (the user, 10 Nov: "what happened to building the
    [gun tower]? Have I got no way of doing that now because there was that triggered after a third
    wave or something?": still building the walk when the siege ended, the rest never came). */
export function timberComes(next: NextPart, why: 'mended' | 'beaten' | 'peace'): boolean {
  if (!next) return false;
  return why === 'beaten' || why === 'peace' || next === 'walk';
}

/* The occasional raider after the siege. Once the siege was over nobody came at all, and a piece
   you didn't want had nowhere to go: throwing it at a raider is the only way to be rid of one (the
   user, 10 Nov: "building the platform and the stairs and things in the base is really difficult
   now because you've got no way of wasting pieces ... originally it was the balance, the key was
   that you could throw things at the enemies ... So maybe we do need the occasional attacker").
   Agreed: "a bit peaceful, yeah. Definitely the occasional raiders, I think, is still needed. It
   gives it a bit of life, and as you said, a way to throw scrap." So in peace, every couple of
   minutes or so, a boat or two puts in with a raider or two (rarely three) who try the wall as
   raiders do. No siege: no cannon, no countdown, no wave; the den stays at peace. */
export const STRAGGLERS = {
  /** Seconds between one lot seen off and the next putting in, at the least and the most. */
  GAP: [90, 180] as const,
  /** Seconds between one boat and the next of the same lot. */
  STAGGER: 3,
  /** The chance of a lone raider, and of three (else two). */
  ONE: 0.45,
  THREE: 0.1,
} as const;

/** Seconds till the next lot puts in, for a roll `u` from 0 to 1. */
export function stragglersIn(u: number): number {
  const [a, b] = STRAGGLERS.GAP;
  return a + (b - a) * Math.min(1, Math.max(0, u));
}

/** How many come, for a roll `u` from 0 to 1: one or two, rarely three. */
export function stragglerCount(u: number): 1 | 2 | 3 {
  if (u < STRAGGLERS.ONE) return 1;
  return u >= 1 - STRAGGLERS.THREE ? 3 : 2;
}

/** Whether the clock to the next lot runs: only in peace, with you in the den (not at sea, not
    watching a cutscene, not reading the map), and nobody already about. */
export function stragglerClock(s: { phase: Phase; away: boolean; raiders: number }): boolean {
  return s.phase === 'peace' && !s.away && s.raiders === 0;
}

/** What's said as they put in: short and light, nothing like a siege. The first time, how to be
    rid of a piece on them. */
export function stragglerLine(n: number, first: boolean): string {
  const who = n === 1 ? "A boat's putting in: a raider after an easy mark"
    : `${n === 2 ? 'Two boats' : 'Boats'} putting in: ${n === 2 ? 'a couple of' : 'three'} raiders after an easy mark`;
  return first ? `${who}. Spare pieces? Shift throws` : who;
}

/** The banner while they're about: no wave, no count down. */
export const stragglerBanner = (n: number): string =>
  `${n === 1 ? 'A raider' : `${n} raiders`} ashore · throw your spare pieces at them`;

/** Said when the last of them is gone. */
export const STRAGGLERS_GONE = "That's them seen off. The den's quiet again";

/** What a raider who reaches the chest takes, of `steal`, with `gold` in it. In the siege, the
    lot (an empty chest ends the game). After it, never the last doubloon: stragglers are a bit of
    life, not a way to lose the den (RULES, "A puzzle game, not an action game"). */
export function theft(gold: number, steal: number, phase: Phase): number {
  return phase === 'peace' ? Math.max(0, Math.min(steal, gold - 1)) : steal;
}
