/* Distilling's phases (src/distill-phase.ts): where a game stands in a player's own terms, said aloud by the bots
   and Helium, each weighing the techniques. */
import { describe, expect, it } from 'vitest';
import { COLS, Distilling, WHITE, parseBoard } from '../src/distilling';
import { FIRE_COLS, PHASES, PHASE_ORDER, PHASE_WEIGHTS, phaseOf, whitesByFire } from '../src/distill-phase';
import { DistillBot, HELIUM, P, advise, contextFor, dangerZones, levelNamed, weigh } from '../src/distill-bots';
import { stuck } from '../src/distill-path';
import { ROUTINES } from '../src/distill-routines';
import type { Board } from '../src/distilling';
import { seeded } from '../src/mirror-row';


describe('the phase the bots think they\'re in, 13 Nov ("the bot should have this is the current phase I think I\'m in")', () => {
  // A fresh deal: colour all over, whites on the fire's side.
  const fresh = () => new Distilling(seeded(5000)).cols;
  // Half the board colour, the three right-hand columns all junk: the junk columns to fill.
  const filling = (): Board => parseBoard(['KwbwKwbwK', 'wbwKwbwK', 'KwbwKwbwK', 'wbwKwbwK', 'KwbwKwbwK', 'wbwKwbwK', 'KbbwKwbwb',
    'KKKKbbbb', 'KKKKbbbbb', 'KKKKbbbb']);
  // notes/distilling/40-*: the whites a big block on the left and middle, the junk right (tests/distill-bots.test.ts).
  const board40 = (): Board => parseBoard(['KwwwKwwbK', 'Kw*wwKKw', 'wbwww*wKw', 'KwwwwwwK', 'wwwbwwwKw', 'wbbwwwww', 'bwwwww*wK', 'bbKKKKbK', '*bKbKKbKK', 'bbKKbKbK']);

  it('"first of all ... I\'m going to try and get rid of all the white pieces in all these columns" (13 Nov): whites on the fire\'s side, the fire phase', () => {
    const cols = fresh();
    expect(whitesByFire(cols)).toBeGreaterThan(0);
    expect(phaseOf(cols, 'junk')).toBe('fire');
  });
  it('the fire\'s side clear of white, colour still all over: fill the right-hand junk columns', () => {
    const cols = filling();
    expect(whitesByFire(cols)).toBe(0);
    expect(phaseOf(cols, 'junk')).toBe('fill');
  });
  it('the whites mostly left: blocks and the V (the planner\'s own block phase, not a second one)', () => {
    expect(phaseOf(board40(), 'junk')).toBe('block');
  });
  it('the chain is the chain, whatever the board', () => {
    for (const cols of [fresh(), filling(), board40()]) expect(phaseOf(cols, 'chain')).toBe('chain');
  });
  it('the fire\'s side is Helium\'s step one: the three columns next to the fire', () => {
    expect(FIRE_COLS).toBe(3);
    const cols = filling();
    cols[COLS - FIRE_COLS][0] = WHITE;
    expect(phaseOf(cols, 'junk')).toBe('fire');
  });
  it('every phase has a name and a plan in plain words, in a game\'s order', () => {
    expect(PHASE_ORDER).toEqual(['fire', 'fill', 'block', 'chain']);
    for (const p of PHASE_ORDER) { expect(PHASES[p].label.length).toBeGreaterThan(5); expect(PHASES[p].plan.length).toBeGreaterThan(10); }
  });
  it('the advice says the phase it\'s in, as the bots play', () => {
    expect(advise({ cols: fresh() }).phase).toBe('fire');
    expect(advise({ cols: board40() }).phase).toBe('block');
    expect(advise({ cols: board40(), chain: 2 }).phase).toBe('chain');
    const g = new Distilling(seeded(5001));
    expect(new DistillBot(levelNamed('cc3')).plan(g).phase).toBe(phaseOf(g.cols, 'junk'));
  });
});

describe('each phase weighs the techniques, never rules one out, 13 Nov ("different techniques have different weights depending on the stage")', () => {
  it('tilts only: every weight between 0.7 and 1.3, only for techniques there are', () => {
    const known = new Set([...Object.keys(ROUTINES), 'path']);
    for (const p of PHASE_ORDER) for (const [t, w] of Object.entries(PHASE_WEIGHTS[p])) {
      expect(known.has(t), `${p}: ${t}`).toBe(true);
      expect(w!).toBeGreaterThanOrEqual(0.7);
      expect(w!).toBeLessThanOrEqual(1.3);
    }
  });
  it('the fire phase favours saving the whites; filling, the sweep; blocks, the hook; the chain, the crawl', () => {
    expect(PHASE_WEIGHTS.fire.rescue!).toBeGreaterThan(1);
    expect(PHASE_WEIGHTS.fill.diamond!).toBeGreaterThan(PHASE_WEIGHTS.fire.diamond!);
    expect(PHASE_WEIGHTS.block.hook!).toBeGreaterThan(1);
    expect(PHASE_WEIGHTS.chain.crawl!).toBeGreaterThan(1);
  });
  it('the weights give way only for real danger, a white by the fire, not a piece stuck anywhere, 13 Nov ("it\'s certainly getting to more advanced techniques or late game techniques too quickly still, when there are alternative options open")', () => {
    // A white trapped on the top of column 7 (tests/distill-bots.test.ts, the path search's board), out of the
    // fire's way: stuck, but no danger, so the weights still rank the moves.
    const cols = parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'Kwwwwwwww', 'wwKKKKKK', 'wwKKKKKKK', 'KbKKKKKK', 'KKKKbbbbb', 'KKKKbbbb']);
    const ctx = contextFor(cols, 'junk', 0, 16);
    expect(stuck(cols, ctx).length).toBeGreaterThan(0);
    expect(dangerZones(cols, 'junk', true)).toEqual([]);
    const moves = weigh({ cols, chain: 0, timeLeft: 12000 }, ctx, HELIUM);
    expect(moves.length).toBeGreaterThan(0);
    for (const m of moves) expect(m.weighted).toBe(true);
    // A white in the furnace's column: danger, every technique even.
    const fire = parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'Kwwwwwwww', 'wwKKKKKK', 'wwKKKKKKK', 'KbKKKKKK', 'KKKKbbbbb', 'KKKwbbbb']);
    for (const m of weigh({ cols: fire, chain: 0, timeLeft: 12000 }, contextFor(fire, 'junk', 0, 16), HELIUM)) expect(m.weighted).toBeFalsy();
  });
  it('crawls are for later: weighed down while the fire\'s side is cleared and the junk columns filled, and through the V a hook beats a crawl, 13 Nov ("You don\'t need to crawl things across. That\'s for ... mid or late game")', () => {
    expect(PHASE_WEIGHTS.fire.crawl!).toBeLessThan(1);
    expect(PHASE_WEIGHTS.fill.crawl!).toBeLessThan(1);
    expect(PHASE_WEIGHTS.block.hook!).toBeGreaterThan(PHASE_WEIGHTS.block.crawl!);
  });
});
