// The tabletop blockade's rules (src/cade.ts). The first part is the user's own BlockadeSim's unit tests
// (src/unitTests/UnitTests.as, github.com/craigpears/BlockadeSim), each scene in its order on the board they ran on,
// Lilac (its MapList's Lilac1_1, kept as the sim had it: on its side, a rock border, the safe zones left and right).
// Then YPPedia's own cases (Collision mechanics, Whirlpool, Influence), scoring, and a round played.
import { describe, expect, it } from 'vitest';
import lilacGrid from './fixtures/cade-lilac.json';
import {
  boardFromCraig, boardFromText, boardToText, Cade, freshTokens, holds, influence, KINDS, planProblem,
  resolveSlot, resolveTurn, TOKEN_LIFE, type Board, type Dir, type Move, type Plan, type Ship,
} from '../src/cade.js';

const LILAC = boardFromCraig(lilacGrid as number[][], 'Lilac', true);
/** Lilac with its safe zones as open water: the sim's gun tests ran there, where it let ships fire. */
const LILAC_OPEN: Board = { ...LILAC, tiles: LILAC.tiles.map((t) => (t.safe ? {} : t)) };
const UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;
const KIND = { Frig: 'warFrigate', Brig: 'warBrig', Sloop: 'sloop' } as const;

/** The sim's test bench: ships placed, moves set, a turn worked out from where they were placed. */
function bench() {
  const ships: Ship[] = [];
  const plans = new Map<number, Plan>();
  const add = (kind: keyof typeof KIND) => { ships.push(make(kind, ships.length)); };
  const make = (kind: keyof typeof KIND, id: number): Ship => ({ id, kind: KINDS[KIND[kind]], side: 0, x: 0, y: 0, face: 0, damage: 0, sunk: false, out: false });
  return {
    ships, add,
    swap(i: number, kind: keyof typeof KIND) { ships[i] = make(kind, i); },
    pos(i: number, x: number, y: number, face: number, board = LILAC) {
      Object.assign(ships[i], { x, y, face: face as Dir });
      ships[i].out = !board.tiles[y * board.w + x].safe;
    },
    moves(i: number, a: string, b: string, c: string, d: string, left = 0, right = 0) {
      const mv = (m: string) => (m === 'X' ? null : (m as Move));
      plans.set(i, { moves: [a, b, c, d].map(mv), guns: [0, 1, 2, 3].map(() => [left, right] as [number, number]) });
    },
    /** A turn from the ships as placed (the sim worked on copies, so each run starts where they were put). */
    run(board = LILAC) {
      const copy = ships.map((s) => ({ ...s }));
      const slots = resolveTurn(board, copy, plans);
      return { final: copy, slots };
    },
    pop() { ships.pop(); plans.delete(ships.length); },
  };
}
const at = (s: Ship) => [s.x, s.y];

describe("the user's BlockadeSim's unit tests, ported", () => {
  const t = bench();
  t.add('Frig'); t.add('Frig'); t.add('Frig');

  it('a ship turning left into a rock is stopped in its second square', () => {
    t.pos(0, 1, 1, RIGHT);
    t.moves(0, 'L', 'X', 'X', 'X'); t.moves(1, 'X', 'X', 'X', 'X'); t.moves(2, 'X', 'X', 'X', 'X');
    const r = t.run();
    expect(r.slots[0].tracks.get(0)!.stopped).toBe(2);
    expect(at(r.final[0])).toEqual([2, 1]);
  });

  it('a ship turning left through empty water goes on unstopped', () => {
    t.pos(0, 1, 2, RIGHT);
    t.moves(0, 'L', 'X', 'X', 'X');
    expect(t.run().slots[0].tracks.get(0)!.stopped).toBeUndefined();
  });

  it('two ships head on, both going forward, both stay', () => {
    t.pos(0, 2, 2, DOWN); t.pos(1, 2, 3, UP);
    t.moves(0, 'F', 'X', 'X', 'X'); t.moves(1, 'F', 'X', 'X', 'X');
    const r = t.run();
    expect(at(r.final[0])).toEqual([2, 2]); expect(at(r.final[1])).toEqual([2, 3]);
  });

  it('head on, only one moving, the same size: she stays and bumps the other back a square', () => {
    t.moves(0, 'F', 'X', 'X', 'X'); t.moves(1, 'X', 'X', 'X', 'X');
    const r = t.run();
    expect(at(r.final[0])).toEqual([2, 2]); expect(at(r.final[1])).toEqual([2, 4]);
  });

  it('head on, only one moving, and she is bigger: she takes the square and shoves the other on', () => {
    t.swap(1, 'Brig'); t.pos(1, 2, 3, UP);
    t.moves(0, 'F', 'X', 'X', 'X'); t.moves(1, 'X', 'X', 'X', 'X');
    const r = t.run();
    expect(at(r.final[0])).toEqual([2, 3]); expect(at(r.final[1])).toEqual([2, 4]);
  });

  it("no shove into a square another ship's sailing into, and the ship bumping stays put", () => {
    t.swap(2, 'Brig');
    t.moves(0, 'F', 'X', 'X', 'X'); t.moves(1, 'X', 'X', 'X', 'X'); t.moves(2, 'F', 'X', 'X', 'X');
    t.pos(0, 1, 3, UP); t.pos(1, 1, 2, UP); t.pos(2, 2, 1, LEFT);
    const r = t.run();
    expect(at(r.final[0])).toEqual([1, 3]); expect(at(r.final[1])).toEqual([1, 2]);
    t.pop();
  });

  it('head on, only one moving: nothing happens if she is smaller, or turning', () => {
    t.swap(0, 'Sloop'); t.pos(0, 2, 2, DOWN); t.pos(1, 2, 3, UP);
    for (const m of ['F', 'R', 'L']) {
      t.moves(0, m, 'X', 'X', 'X'); t.moves(1, 'X', 'X', 'X', 'X');
      const r = t.run();
      expect(at(r.final[0])).toEqual([2, 2]); expect(at(r.final[1])).toEqual([2, 3]);
    }
  });

  it('no shove with a rock behind', () => {
    t.swap(1, 'Brig'); t.pos(0, 2, 1, DOWN); t.pos(1, 2, 2, UP);
    t.moves(0, 'X', 'X', 'X', 'X'); t.moves(1, 'F', 'X', 'X', 'X');
    const r = t.run();
    expect(at(r.final[0])).toEqual([2, 1]); expect(at(r.final[1])).toEqual([2, 2]);
  });

  it('no shove with a ship behind', () => {
    t.add('Brig');
    t.pos(0, 2, 2, DOWN); t.pos(1, 2, 3, UP); t.pos(2, 2, 1, RIGHT);
    t.moves(2, 'X', 'X', 'X', 'X');
    const r = t.run();
    expect(at(r.final[0])).toEqual([2, 2]); expect(at(r.final[1])).toEqual([2, 3]); expect(at(r.final[2])).toEqual([2, 1]);
    t.pop();
  });

  it('two ships the same size claiming one square: neither gets it, whatever their moves', () => {
    t.swap(0, 'Sloop'); t.swap(1, 'Sloop');
    t.pos(0, 2, 1, DOWN); t.pos(1, 2, 3, UP);
    for (const [a, b] of [['R', 'F'], ['R', 'L'], ['F', 'L'], ['F', 'F']]) {
      t.moves(0, a, 'X', 'X', 'X'); t.moves(1, b, 'X', 'X', 'X');
      const r = t.run();
      expect(at(r.final[0])).toEqual([2, 1]); expect(at(r.final[1])).toEqual([2, 3]);
    }
  });

  it('the bigger ship claiming a square carries on as normal', () => {
    t.swap(0, 'Brig'); t.swap(1, 'Sloop');
    t.pos(0, 1, 1, DOWN); t.pos(1, 1, 3, UP);
    const cases: [string, string, number[]][] = [['L', 'F', [2, 2]], ['R', 'L', [1, 2]], ['F', 'L', [1, 2]], ['F', 'F', [1, 2]]];
    for (const [a, b, want] of cases) {
      t.moves(0, a, 'X', 'X', 'X'); t.moves(1, b, 'X', 'X', 'X');
      const r = t.run();
      expect(at(r.final[0])).toEqual(want); expect(at(r.final[1])).toEqual([1, 3]);
    }
  });

  it('a whole turn of moves runs through (the sim checked only that it did)', () => {
    t.moves(0, 'L', 'R', 'F', 'L'); t.moves(1, 'F', 'X', 'X', 'X');
    t.pos(0, 2, 1, UP);
    const once = t.run().final[0];
    t.pos(0, once.x, once.y, once.face);
    expect(() => t.run()).not.toThrow();
  });

  it("a ship turning in the square in front of one going forward: no collision", () => {
    t.swap(0, 'Brig'); t.swap(1, 'Brig');
    t.moves(0, 'R', 'X', 'X', 'X'); t.moves(1, 'F', 'X', 'X', 'X');
    t.pos(0, 1, 1, RIGHT); t.pos(1, 2, 4, UP);
    const r = t.run();
    expect(at(r.final[0])).toEqual([2, 2]); expect(at(r.final[1])).toEqual([2, 3]);
  });

  describe('guns (on Lilac with its safe zones open, where the sim fired)', () => {
    const range = (r: ReturnType<typeof t.run>, slot: number, ship: number, side: 'left' | 'right') =>
      r.slots[slot].shots.find((s) => s.from === ship && s.side === side)?.range ?? 4;

    it('shooting into open water hits nothing; the ship beside the rocks hits the rocks', () => {
      t.moves(0, 'X', 'X', 'X', 'X', 2, 2);
      t.pos(0, 1, 1, RIGHT, LILAC_OPEN); t.pos(1, 30, 0, RIGHT, LILAC_OPEN);
      const r = t.run(LILAC_OPEN);
      for (let s = 0; s < 4; s++) { expect(range(r, s, 0, 'right')).toBe(4); expect(range(r, s, 0, 'left')).toBe(1); }
    });

    it('two ships side by side shoot each other', () => {
      t.moves(1, 'X', 'X', 'X', 'X', 2, 2);
      t.pos(1, 1, 2, RIGHT, LILAC_OPEN);
      const r = t.run(LILAC_OPEN);
      for (let s = 0; s < 4; s++) { expect(range(r, s, 0, 'right')).toBe(1); expect(range(r, s, 1, 'left')).toBe(1); }
    });

    it('and still when one of them moves into place', () => {
      t.moves(1, 'L', 'L', 'F', 'X', 2, 2);
      t.pos(1, 2, 4, RIGHT, LILAC_OPEN);
      const r = t.run(LILAC_OPEN);
      for (let s = 2; s < 4; s++) { expect(range(r, s, 0, 'right')).toBe(1); expect(range(r, s, 1, 'right')).toBe(1); }
    });

    it('all of that again with a square between', () => {
      t.moves(0, 'X', 'X', 'X', 'X', 2, 2);
      t.pos(0, 1, 2, RIGHT, LILAC_OPEN); t.pos(1, 30, 2, RIGHT, LILAC_OPEN);
      let r = t.run(LILAC_OPEN);
      for (let s = 0; s < 4; s++) { expect(range(r, s, 0, 'right')).toBe(4); expect(range(r, s, 0, 'left')).toBe(2); }
      t.moves(1, 'X', 'X', 'X', 'X', 2, 2);
      t.pos(1, 1, 4, RIGHT, LILAC_OPEN);
      r = t.run(LILAC_OPEN);
      for (let s = 0; s < 4; s++) { expect(range(r, s, 0, 'right')).toBe(2); expect(range(r, s, 1, 'left')).toBe(2); }
      t.moves(1, 'L', 'L', 'F', 'X', 2, 2);
      t.pos(1, 2, 6, RIGHT, LILAC_OPEN);
      r = t.run(LILAC_OPEN);
      for (let s = 2; s < 4; s++) { expect(range(r, s, 0, 'right')).toBe(2); expect(range(r, s, 1, 'right')).toBe(2); }
    });
  });

  it("winds don't push you into walls", () => {
    t.pos(0, 7, 1, RIGHT);
    t.moves(0, 'X', 'X', 'X', 'X');
    expect(at(t.run().final[0])).toEqual([7, 1]);
  });

  it("a whirlpool doesn't carry you into a ship a wind has just put there", () => {
    const L = LILAC.w;
    t.moves(0, 'X', 'X', 'X', 'F'); t.moves(1, 'X', 'X', 'X', 'L');
    t.pos(0, L - 8, 7, RIGHT); t.pos(1, L - 5, 10, UP);
    expect(at(t.run().final[1])).toEqual([L - 7, 9]);
  });

  it("a wind doesn't push you into a ship: it bumps her out of the way if she isn't bigger", () => {
    const L = LILAC.w;
    t.moves(0, 'X', 'X', 'X', 'F'); t.moves(1, 'X', 'X', 'X', 'X');
    t.pos(0, L - 6, 11, UP); t.pos(1, L - 5, 10, UP);
    const r = t.run();
    expect(at(r.final[0])).toEqual([L - 6, 10]);
    expect(at(r.final[1])).toEqual([L - 4, 10]);
  });

  it('and if she is bigger, nothing happens', () => {
    const L = LILAC.w;
    t.swap(0, 'Sloop');
    t.moves(0, 'X', 'X', 'X', 'F'); t.moves(1, 'X', 'X', 'X', 'X');
    t.pos(0, L - 6, 11, UP); t.pos(1, L - 5, 10, UP);
    expect(at(t.run().final[1])).toEqual([L - 5, 10]);
  });

  it('two ships the same size turning onto one square both stop short', () => {
    t.swap(0, 'Sloop'); t.swap(1, 'Sloop');
    t.moves(0, 'X', 'X', 'X', 'L'); t.moves(1, 'X', 'X', 'X', 'L');
    t.pos(0, 1, 1, DOWN); t.pos(1, 3, 3, UP);
    const r = t.run();
    expect(at(r.final[0])).toEqual([1, 2]); expect(at(r.final[1])).toEqual([3, 2]);
  });

  it('two ships of different sizes turning onto one square: the bigger gets it', () => {
    t.swap(0, 'Sloop'); t.swap(1, 'Brig');
    t.moves(0, 'X', 'X', 'X', 'L'); t.moves(1, 'X', 'X', 'X', 'L');
    t.pos(0, 1, 1, DOWN); t.pos(1, 3, 3, UP);
    const r = t.run();
    expect(at(r.final[0])).toEqual([1, 2]); expect(at(r.final[1])).toEqual([2, 2]);
  });

  it('a special case: a forward, then a turn into the square she was claiming, a turn after', () => {
    t.swap(0, 'Sloop'); t.swap(1, 'Sloop');
    t.moves(0, 'X', 'F', 'F', 'X'); t.moves(1, 'F', 'L', 'R', 'X');
    t.pos(0, 3, 1, LEFT); t.pos(1, 2, 3, UP);
    const r = t.run();
    expect(at(r.final[0])).toEqual([2, 1]); expect(at(r.final[1])).toEqual([1, 1]);
  });

  it("a special case: a turn into the square another's just moved into is stopped", () => {
    t.moves(0, 'L', 'X', 'X', 'X'); t.moves(1, 'R', 'X', 'X', 'X');
    t.pos(0, 1, 2, RIGHT); t.pos(1, 3, 1, LEFT);
    const r = t.run();
    expect(at(r.final[0])).toEqual([2, 2]); expect(at(r.final[1])).toEqual([2, 1]);
  });

  it('one ship rams a rock and the other sails for her square: she stays, so the other stops', () => {
    t.moves(0, 'L', 'X', 'X', 'X'); t.moves(1, 'F', 'X', 'X', 'X');
    t.pos(0, 1, 1, UP); t.pos(1, 2, 1, LEFT);
    const r = t.run();
    expect(at(r.final[0])).toEqual([1, 1]); expect(at(r.final[1])).toEqual([2, 1]);
  });

  it("a ship ramming a rock in the first square doesn't get in the way of a turn's second", () => {
    t.moves(0, 'R', 'X', 'X', 'X'); t.moves(1, 'L', 'X', 'X', 'X');
    t.pos(0, 1, 1, UP); t.pos(1, 1, 2, RIGHT);
    const r = t.run();
    expect(at(r.final[0])).toEqual([1, 1]); expect(at(r.final[1])).toEqual([2, 1]);
  });
});

/** A ship for a scene on a hand-made board. */
const ship = (id: number, kind: string, x: number, y: number, face: Dir, side: 0 | 1 = 0): Ship =>
  ({ id, kind: KINDS[kind], side, x, y, face, damage: 0, sunk: false, out: true });
const plan = (...moves: (Move | null)[]): Plan => ({ moves });
const OPEN = boardFromText(Array(9).fill('.........'));

describe("YPPedia's Collision mechanics", () => {
  it('a small ship going forward stops a frigate turning into the square she moved into', () => {
    // The sloop goes north into (4,5); the frigate turns right, (4,4) then (4,5): the square the sloop's just reached.
    const t = [ship(0, 'sloop', 4, 6, 0), ship(1, 'warFrigate', 3, 4, 1)];
    resolveSlot(OPEN, t, new Map([[0, plan('F')], [1, plan('R')]]), 0);
    expect([t[0].x, t[0].y]).toEqual([4, 5]);          // the sloop moved up
    expect([t[1].x, t[1].y, t[1].face]).toEqual([4, 4, 2]); // the frigate stopped in her first square, turned
  });

  it('two turning ships claiming each other\'s squares head on both stop after their first square', () => {
    const s = [ship(0, 'warBrig', 2, 4, 1), ship(1, 'sloop', 4, 3, 3)];
    // East to (3,4) then left for (3,3); west to (3,3) then left for (3,4): each wants the square the other's in.
    resolveSlot(OPEN, s, new Map([[0, plan('L')], [1, plan('L')]]), 0);
    expect([s[0].x, s[0].y, s[0].face]).toEqual([3, 4, 0]); expect([s[1].x, s[1].y, s[1].face]).toEqual([3, 3, 2]);
  });

  it('every ship that tries to turn faces her new way, even stopped', () => {
    const s = [ship(0, 'sloop', 0, 0, 0)];
    resolveSlot(OPEN, s, new Map([[0, plan('R')]]), 0);
    expect([s[0].x, s[0].y, s[0].face]).toEqual([0, 0, 1]);
  });

  it('a ship behind one that moves follows her in', () => {
    const s = [ship(0, 'sloop', 4, 4, 0), ship(1, 'sloop', 4, 5, 0)];
    resolveSlot(OPEN, s, new Map([[0, plan('F')], [1, plan('F')]]), 0);
    expect([s[0].y, s[1].y]).toEqual([3, 4]);
  });

  it('a ram hurts both, each by the other\'s ram; the side does a rock\'s', () => {
    const s = [ship(0, 'sloop', 4, 4, 0), ship(1, 'warFrigate', 4, 3, 2, 1)];
    const log = resolveSlot(OPEN, s, new Map([[0, plan('F')]]), 0);
    expect(log.bumps).toHaveLength(1);
    expect(s[0].damage).toBe(KINDS.warFrigate.ram); expect(s[1].damage).toBe(KINDS.sloop.ram);
    const e = [ship(0, 'warBrig', 0, 0, 3)];
    resolveSlot(OPEN, e, new Map([[0, plan('F')]]), 0);
    expect(e[0].damage).toBe(1.25);
  });
});

describe('winds and whirlpools', () => {
  const POOL = boardFromText(['.....', '.qp..', '.bd..', '.....', '..>..']);

  it('a ship left in a whirlpool a whole turn ends where she started, facing the same way', () => {
    for (const [x, y] of [[1, 1], [2, 1], [2, 2], [1, 2]]) for (const face of [0, 1, 2, 3] as Dir[]) {
      const s = [ship(0, 'warBrig', x, y, face)];
      const log = resolveTurn(POOL, s, new Map());
      expect([s[0].x, s[0].y, s[0].face]).toEqual([x, y, face]);
      // Each slot carries her to the opposite corner, a quarter turn clockwise.
      expect(log[0].tracks.get(0)!.to.slice(0, 2)).toEqual([3 - x, 3 - y]);
    }
  });

  it('a wind pushes her a square its way whichever way she faces, once a slot', () => {
    const s = [ship(0, 'sloop', 2, 4, 0)];
    resolveSlot(POOL, s, new Map(), 0);
    expect([s[0].x, s[0].y, s[0].face]).toEqual([3, 4, 0]);
  });

  it('a board turned from the sim keeps its whirlpools turning clockwise', () => {
    const grid = [[1, 1, 1, 1, 1], [1, 6, 7, 0, 1], [1, 8, 9, 0, 1], [1, 1, 1, 1, 1]];
    const b = boardFromCraig(grid);
    expect([b.w, b.h]).toEqual([2, 3]);
    // The sim's top-left corner turns to the top right, and so on round: still a clockwise whirlpool.
    expect(boardToText(b)).toEqual(['qp', 'bd', '..']);
    const s = [ship(0, 'sloop', 0, 0, 0)];
    resolveTurn(b, s, new Map());
    expect([s[0].x, s[0].y, s[0].face]).toEqual([0, 0, 0]);
  });
});

describe('guns', () => {
  it('all her shots hit the first ship in line, up to three squares; a tall rock stops them, a small one does not', () => {
    const b = boardFromText(['.......', '.......', '.......']);
    const s = [ship(0, 'warFrigate', 0, 1, 0), ship(1, 'sloop', 2, 1, 0, 1), ship(2, 'sloop', 3, 1, 0, 1)];
    const log = resolveSlot(b, s, new Map([[0, { moves: [null], guns: [[0, 2]] }]]), 0);
    expect(log.shots[0]).toMatchObject({ range: 2, hit: { ship: 1 }, damage: 4 });
    expect(s[1].damage).toBe(4); expect(s[2].damage).toBe(0);

    const rocks = boardFromText(['.o#....']);
    const r = [ship(0, 'warBrig', 0, 0, 2), ship(1, 'sloop', 3, 0, 0, 1)];
    expect(resolveSlot(rocks, r, new Map([[0, { moves: [null], guns: [[2, 0]] }]]), 0).shots[0]).toMatchObject({ range: 2, hit: 'rock' });
    const small = boardFromText(['.o.....']);
    const r2 = [ship(0, 'warBrig', 0, 0, 2), ship(1, 'sloop', 3, 0, 0, 1)];
    expect(resolveSlot(small, r2, new Map([[0, { moves: [null], guns: [[2, 0]] }]]), 0).shots[0]).toMatchObject({ range: 3, hit: { ship: 1 } });
  });

  it("friends' shots do half; nobody fires from the safe zone, nobody's hurt in it", () => {
    const b = boardFromText(['~~~', '...', '...']);
    const s = [ship(0, 'warBrig', 0, 1, 0), ship(1, 'warBrig', 1, 1, 0)];
    resolveSlot(b, s, new Map([[0, { moves: [null], guns: [[0, 2]] }]]), 0);
    expect(s[1].damage).toBe(1.5);
    const t = [ship(0, 'warBrig', 0, 0, 0), ship(1, 'warBrig', 1, 0, 0, 1), ship(2, 'warBrig', 0, 1, 2, 1)];
    const log = resolveSlot(b, t, new Map([[0, { moves: [null], guns: [[0, 2]] }], [2, { moves: [null], guns: [[2, 0]] }]]), 0);
    expect(log.shots.filter((x) => x.from === 0)).toHaveLength(0);
    expect(t[0].damage).toBe(0);
  });

  it('full damage from a ship sinks her; a rock only takes her as far as full', () => {
    const b = boardFromText(['....']);
    const s = [ship(0, 'warFrigate', 0, 0, 0), ship(1, 'sloop', 1, 0, 0, 1)];
    s[1].damage = 9;
    const log = resolveSlot(b, s, new Map([[0, { moves: [null], guns: [[0, 1]] }]]), 0);
    expect(log.sunk).toEqual([1]); expect(s[1].sunk).toBe(true);
    const r = [ship(0, 'sloop', 0, 0, 0)];
    r[0].damage = 9.8;
    expect(resolveSlot(b, r, new Map([[0, plan('F')]]), 0).sunk).toEqual([]);
    expect(r[0].damage).toBe(10);
  });
});

describe('influence and points', () => {
  it('the squares a ship holds: 1, 5, 13, 29, 49 for diameters 1, 2, 4, 6, 8 (YPPedia, Influence)', () => {
    const count = (d: number) => { let n = 0; for (let x = -6; x <= 6; x++) for (let y = -6; y <= 6; y++) if (holds(d, x, y)) n++; return n; };
    expect([1, 2, 4, 6, 8].map(count)).toEqual([1, 5, 13, 29, 49]);
  });

  it("a buoy held by one side scores its points; by both, it's contested; a sloop must sit on it", () => {
    const b = boardFromText(['3....', '.....', '.....', '....2']);
    const one = influence(b, [ship(0, 'warBrig', 1, 1, 0), ship(1, 'sloop', 4, 2, 0, 1)]);
    expect(one.points).toEqual([3, 0]);
    expect(one.buoys.map((x) => x.holder)).toEqual([0, null]);
    const both = influence(b, [ship(0, 'warBrig', 1, 1, 0), ship(1, 'sloop', 0, 0, 0, 1), ship(2, 'sloop', 4, 3, 0, 1)]);
    expect(both.points).toEqual([0, 2]);
    expect(both.buoys.map((x) => x.holder)).toEqual(['contested', 1]);
  });
});

describe('a round', () => {
  const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  it('ships come in on their own edge, facing in; buoys score each turn; the round ends', () => {
    const b = boardFromText(['~~~~~', '.....', '..3..', '.....', '~~~~~']);
    const c = new Cade(b, 3, seeded(7));
    const a = c.add({ kind: 'warBrig', side: 0 }), z = c.add({ kind: 'sloop', side: 1 });
    expect(c.ship(a).y).toBe(4); expect(c.ship(a).face).toBe(0);
    expect(c.ship(z).y).toBe(0); expect(c.ship(z).face).toBe(2);
    c.ship(a).x = 2;
    expect(c.plan(a, plan('F', 'F', null, null))).toBeNull();
    const log = c.playTurn();
    expect([c.ship(a).x, c.ship(a).y]).toEqual([2, 2]);
    expect(log.points).toEqual([3, 0]);
    c.playTurn(); c.playTurn();
    expect(c.over).toBe(true); expect(c.score).toEqual([9, 0]); expect(c.leader).toBe(0);
  });

  it("can't sail back into the safe zone once out of it", () => {
    const b = boardFromText(['~~~', '...', '...']);
    const c = new Cade(b, 5);
    const a = c.add({ kind: 'sloop', side: 0, at: [1, 1, 0] });
    c.plan(a, plan('F'));
    c.playTurn();
    expect(c.ship(a).y).toBe(1);
  });

  it('a sunk ship comes back fresh on her edge at the end of the turn', () => {
    const b = boardFromText(['~~~~', '....', '....', '~~~~']);
    const c = new Cade(b, 5, seeded(3));
    const f = c.add({ kind: 'warFrigate', side: 0, at: [0, 1, 0] });
    const s = c.add({ kind: 'sloop', side: 1, at: [1, 1, 0] });
    c.ship(s).damage = 9;
    c.plan(f, { moves: [null], guns: [[0, 1]] });
    const log = c.playTurn();
    expect(log.respawned).toEqual([s]);
    expect(c.ship(s)).toMatchObject({ sunk: false, damage: 0, y: 0, face: 2 });
  });

  it('tokens: a plan is checked against her ship and her tokens; moves made each turn, lost after five', () => {
    const t = freshTokens(0, 16);
    expect(planProblem(KINDS.warBrig, t, plan('F', 'F', 'F', 'F'))).toMatch(/3 moves/);
    expect(planProblem(KINDS.warBrig, t, plan('L', 'L', 'L'))).toMatch(/lefts/);
    expect(planProblem(KINDS.warBrig, t, { moves: [], guns: [[3, 0]] })).toMatch(/2 guns/);
    expect(planProblem(KINDS.sloop, t, plan('F', 'L', 'R', 'F'))).toBeNull();

    const c = new Cade(OPEN, 20);
    const id = c.add({ kind: 'warBrig', side: 0, at: [4, 4, 0], crew: 'normal' });
    for (let i = 0; i < 6; i++) c.playTurn();
    const tk = c.ship(id).tokens;
    expect(tk.F.length + tk.L.length + tk.R.length).toBeLessThanOrEqual(Math.ceil(2.3 * TOKEN_LIFE));
    expect([...tk.F, ...tk.L, ...tk.R].every((born) => c.turn - born < 5)).toBe(true);
    expect(tk.guns).toBe(16);
  });
});
