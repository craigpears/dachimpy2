/* Where Space does something, marked (src/den-marks.ts), 14 Nov. The user, at Kikkit's island on the rum run: "I
   eventually managed to throw her a barrel. But it took me a few places ... there should be a better visual
   indication of it"; and "always make that a generic thing ... this is like a quest or target ... on the wedding
   island, she's on a little jetty. You could have a little flashing next to it". */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Marks, MARKS, squaresIn, squaresRound } from '../src/den-marks';
import { isleLandingSquares, onIsleLanding } from '../src/den-isle';

describe('marks where Space does something, for any part', () => {
  it('a rectangle\'s squares, less its land; the water round some land', () => {
    expect(squaresIn({ c0: 0, c1: 1, r0: 0, r1: 1 })).toEqual([[0, 0], [1, 0], [0, 1], [1, 1]]);
    expect(squaresIn({ c0: 0, c1: 1, r0: 0, r1: 0 }, (c) => c === 0)).toEqual([[1, 0]]);
    expect(squaresRound([[5, 5]], (c, r) => !(c === 5 && r === 5))).toHaveLength(8);
  });

  it('shows a part\'s squares while she\'s near any of them, each once; cleared with none', () => {
    const m = new Marks();
    m.set('a', [[0, 0], [1, 0]]);
    m.set('b', [[1, 0], [30, 30], [2, 0]]);
    expect(m.shown(0, MARKS.NEAR)).toEqual([[0, 0], [2, 0]]);   // (one mark a target, nearest its middle: b's while near any of it)
    expect(m.shown(0, MARKS.NEAR + 2)).toEqual([]);
    m.set('a', []);
    expect(m.names).toEqual(['b']);
  });

  it('marks the Wedding Isle\'s landing, where Space takes you to the wedding (the user: "a little flashing next to it")', () => {
    const sq = isleLandingSquares();
    expect(sq.length).toBeGreaterThan(0);
    for (const [c, r] of sq) expect(onIsleLanding(c, r)).toBe(true);
  });

  it('puts one action point off Mischievious\'s island, not a ring on every square (14 Nov: "one action point, not 9")', () => {
    const m = new Marks(), sq = isleLandingSquares();
    expect(sq.length).toBeGreaterThan(1);
    m.set('isle', sq);
    const shown = m.shown(sq[0][0], sq[0][1]);
    expect(shown).toHaveLength(1);
    expect(onIsleLanding(shown[0][0], shown[0][1])).toBe(true);
  });

  it('is drawn by one shared piece, and the rum run and the Wedding Isle both use it', () => {
    expect(readFileSync('js/den/marks.js', 'utf8')).toMatch(/export const mark = /);
    expect(readFileSync('js/den/rumrun.js', 'utf8')).toMatch(/mark\(`rum:/);
    expect(readFileSync('js/den/isle.js', 'utf8')).toMatch(/mark\('isle'/);
    expect(readFileSync('js/den/sailing.js', 'utf8')).toMatch(/marksTick\(/);
  });
});
