/* Every drag a named trick with a goal, 13 Nov (src/distill-goals.ts; src/distill-teach.ts's tricks). The user, on
   Helium's teaching moves: "I like that you've got labelled moves of what the purpose and goal is of each ... if the bot
   follows, again, that is integrated into those same tricks, that it's not going to do a half move for no reason, like
   everything ... has got a goal and a reason and like linked to one of those more abstract moves." And on P10: "Why are
   things only half moving?" */
import { describe, expect, it } from 'vitest';
import { BLACK, BROWN, DOWN_LEFT, DOWN_RIGHT, Distilling, UP_LEFT, UP_RIGHT, WHITE, parseBoard } from '../src/distilling';
import { P, choose, contextFor, levelNamed, playSession } from '../src/distill-bots';
import { readBoard } from '../src/distill-read';
import { GOALS, ownGoal, purposeful, stepLines, stepsFor, trickName } from '../src/distill-goals';
import { DRAG_TRICKS, LADDER, TRICKS, dragTricks, swapTrick } from '../src/distill-teach';
import { POSITIONS, boardOf, botAt } from '../src/distill-positions';
import { playDrags } from '../src/distill-routines';
import { seeded } from '../src/mirror-row';

describe('the tricks a drag is: every legal swap is one of them', () => {
  it('a white up past a black, the climb; down past a brown, the sink; a brown up, the lift; a black down, the drop; junk past junk, the ladder', () => {
    expect(swapTrick(WHITE, UP_LEFT)).toBe('climb');
    expect(swapTrick(WHITE, DOWN_RIGHT)).toBe('sink');
    expect(swapTrick(BROWN, UP_RIGHT)).toBe('lift');
    expect(swapTrick(BLACK, DOWN_RIGHT)).toBe('drop');
    expect(swapTrick(BROWN, DOWN_RIGHT)).toBe(LADDER);
    expect(swapTrick(BLACK, UP_RIGHT)).toBe(LADDER);
    expect(DRAG_TRICKS).toEqual([...TRICKS, LADDER]);
  });
  it('a brown lifted up through the whites and down through the blacks is the lift, then the ladder; a white up and down, the weave', () => {
    const cols = parseBoard(['wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwbwwwww', 'wwwwwwww', 'wwwKwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww']);
    // (column 5's brown, row 4: up-right past a white into column 6, then down-right past column 7's black)
    const d = { x: 4, y: 3, ways: [UP_RIGHT, DOWN_RIGHT] };
    expect(playDrags(cols, [d])).not.toBeNull();
    expect(dragTricks(cols, d)).toEqual(['lift', 'ladder']);
    expect(trickName(dragTricks(cols, d))).toBe('the lift, then the ladder');
    const w = parseBoard(['wwwwwwwww', 'wwwKwwww', 'wwwwbwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww', 'wwwwwwwww', 'wwwwwwww']);
    const v = { x: 0, y: 4, ways: [UP_RIGHT, DOWN_RIGHT] };
    expect(playDrags(w, [v])).not.toBeNull();
    expect(dragTricks(w, v)).toEqual(['weave']);
  });
});

describe('"Why are things only half moving?" (13 Nov, P10): a drag that gets nothing done has no goal', () => {
  // A board a CC^5 bot reached (seed 5000, 13 Nov): the diamond's brown run let go one swap in, where one look ahead
  // scored best, left among the whites.
  const cols = parseBoard(['KKbbwKww', 'Kwbwwww**', 'KbbwwwwK', 'wwwwwbwwK', 'b*wwwwKK', 'bwbwbKwww', 'KKKKbbKK', 'KbKKbK*KK', 'bbbbbbKb', 'KKKbbKbbK']);
  const ctx = contextFor(cols, 'junk', 0, 40), reading = readBoard(cols, { stage: 'junk', timeLeft: 12000 });
  it('the brown lifted one place up into the whites and let go there: no goal', () => {
    const d = { x: 2, y: 1, ways: [UP_RIGHT] };
    expect(ownGoal(cols, d, playDrags(cols, [d])!, { ctx, reading })).toBeNull();
    expect(purposeful(stepsFor(cols, [d], { ctx, reading }))).toBe(false);
  });
  it('the bots never choose a move with a drag like that: every drag of theirs has a goal, named', () => {
    for (const name of ['cc1', 'cc3', 'cc5', 'cc8']) {
      const a = choose({ cols, chain: 0, timeLeft: 12000 }, ctx, levelNamed(name));
      if (a.kind !== 'move') continue;
      expect(a.steps!.length, name).toBe(a.drags.length);
      expect(purposeful(a.steps!), `${name}: ${stepLines(a.steps!).join('; ')}`).toBe(true);
    }
  });
  it('in the chain, swapping one stuck piece of junk for another in the column going up gets nothing done either', () => {
    // A CC^1 board (seed 5000, 13 Nov): the path search brought a white round to take a stuck brown's place in column
    // 4, the column being filled, and the white's first swap brought another brown into it, as stuck.
    const c = parseBoard(['wbbK*bbKK', 'KbK*bbbb', 'wbwbbbbbw', 'Kwwwwwwb', 'wwwwwwwww', 'ww*wwwww', 'bKKbbbbbK', 'KbbbKKKK', 'KbKbwww**', 'bbKbKKKb']);
    const cx = contextFor(c, 'chain', 4, 40);
    expect(cx.fill).toBe(3);
    const d = { x: 3, y: 6, ways: [DOWN_LEFT, DOWN_RIGHT] };
    expect(ownGoal(c, d, playDrags(c, [d])!, { ctx: cx })).toBeNull();
  });
});

describe('every move a named trick with a goal: the bots\' own', () => {
  it('at every position (distilling-positions.html), each drag of the bot\'s move named, its tricks and its goal', () => {
    for (const p of POSITIONS) {
      const a = botAt(p);
      if (a.kind !== 'move') continue;
      expect(a.steps, p.id).toBeTruthy();
      expect(a.steps!.length, p.id).toBe(a.drags.length);
      let b = boardOf(p);
      a.steps!.forEach((s, i) => {
        expect(s.tricks, p.id).toEqual(dragTricks(b, a.drags[i]));
        expect(s.goal, `${p.id}: ${stepLines(a.steps!).join('; ')}`).not.toBeNull();
        expect(Object.keys(GOALS)).toContain(s.goal!.kind);
        b = playDrags(b, [a.drags[i]])!;
      });
      expect(a.how, p.id).toBe(a.steps!.map((s) => s.name).join('; then '));
    }
  });
  it('a bot\'s session, every move: no half move in it', () => {
    let moves = 0;
    playSession(new Distilling(seeded(5000)), levelNamed('cc3'), 2, undefined, (a) => {
      if (a.kind !== 'move') return;
      moves++;
      expect(purposeful(a.steps!), stepLines(a.steps!).join('; ')).toBe(true);
    });
    expect(moves).toBeGreaterThan(10);
  });
  it('with the goals off (P.GOALS 0), the same planner does choose half moves: the filter is what stops them', () => {
    const was = P.GOALS;
    let half = 0;
    try {
      P.GOALS = 0;
      for (const seed of [5000]) playSession(new Distilling(seeded(seed)), levelNamed('cc5'), 3, undefined, (a) => { if (a.kind === 'move' && !purposeful(a.steps!)) half++; });
    } finally { P.GOALS = was; }
    expect(half).toBeGreaterThan(0);
  }, 90000);   // (a whole session of play: about 12 s alone, past the 20 s default with agents running beside it)
  it('a goal in plain words, for the pages: "1. The lift, then the ladder: ..."', () => {
    const lines = stepLines([{ tricks: ['lift', 'ladder'], name: 'the lift, then the ladder', goal: { kind: 'pull', says: 'carry the brown over to the colour in column 9' } }, { tricks: ['climb'], name: 'the climb', goal: null }]);
    expect(lines).toEqual(['1. The lift, then the ladder: carry the brown over to the colour in column 9', '2. The climb: no goal (a half move)']);
  });
});
