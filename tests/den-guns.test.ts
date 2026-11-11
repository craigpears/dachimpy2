/* Her guns, loaded by Gunnery (src/den-guns.ts, on the one copy of the puzzle: src/gunnery.ts). */
import { describe, expect, it } from 'vitest';
import { GUNS, Broadside, cantLoad } from '../src/den-guns';
import { Gunnery, type Store } from '../src/gunnery';
import { Helm, Sea, LAY, type Side } from '../src/den-sail';
import { ends } from '../src/den-lock';
import { stilled } from './helpers';

const clearSea = () => { const s = new Sea(1, false); s.rocks.clear(); return s; };
/** Roll stores into gun i, in turn. */
const roll = (b: Broadside, i: number, ...stores: Store[]) => { const g = b.board.guns[i]; for (const s of stores) b.board.load(g, s); return g.state; };
const gunOf = (side: Side) => GUNS.SIDES.indexOf(side);

describe('"we should have to load the guns through the puzzle" (10 Nov)', () => {
  it('Q and E fire only a gun that\'s loaded: she puts out with none', () => {
    const b = new Broadside();
    expect(b.shots('L')).toBe(0);
    expect(b.fire('L')).toBe('empty');
    expect(b.fire('R')).toBe('empty');
  });

  it('"one copy of the gunning puzzle": her board is Gunnery itself, the gun tower\'s', () => {
    const b = new Broadside();
    expect(b.board).toBeInstanceOf(Gunnery);
    expect(b.board.guns.length).toBe(GUNS.SIDES.length);
  });

  it('the board\'s guns are hers: the two down its left side port, the two down its right starboard', () => {
    const b = new Broadside();
    expect(GUNS.SIDES).toEqual(['L', 'L', 'R', 'R']);
    // (the board's own guns: the first two face out of its left side, the others its right)
    expect(b.board.guns.map((g) => g.d)).toEqual([3, 3, 1, 1]);
    expect([b.most('L'), b.most('R')]).toEqual([2, 2]);
    expect(roll(b, 0, 'powder', 'wad', 'shot')).toBe('loaded');
    expect([b.shots('L'), b.shots('R')]).toEqual([1, 0]);
    roll(b, 1, 'powder', 'wad', 'shot');
    roll(b, 3, 'powder', 'wad', 'shot');
    expect([b.shots('L'), b.shots('R')]).toEqual([2, 1]);
  });

  it('firing empties one of that side\'s loaded guns, which wants a bucket before it\'s loaded again', () => {
    const b = new Broadside(), i = gunOf('R');
    roll(b, i, 'powder', 'wad', 'shot');
    expect(b.fire('R')).toBe('fired');
    expect(b.board.guns[i].state).toBe('dirty');
    expect(b.shots('R')).toBe(0);
    expect(b.fire('R')).toBe('empty');
    expect(roll(b, i, 'powder')).toBe('fouled');
    expect(roll(b, i, 'bucket', 'powder', 'wad', 'shot')).toBe('loaded');
  });

  it('two shots a side go one after the other, her gun running out again between them', () => {
    const b = new Broadside();
    roll(b, 0, 'powder', 'wad', 'shot'); roll(b, 1, 'powder', 'wad', 'shot');
    expect(b.fire('L')).toBe('fired');
    expect(b.fire('L')).toBe('running');
    expect(b.shots('L')).toBe(1);
    b.tick(GUNS.RUN_OUT - 0.1);
    expect(b.ready('L')).toBe(false);
    expect(b.out('L')).toBeGreaterThan(0.9);
    b.tick(0.1);
    expect(b.fire('L')).toBe('fired');
    expect(b.shots('L')).toBe(0);
  });
});

describe('the Gunnery board on her deck, and the other boards', () => {
  it('she can load as she sails on to a pin, but not while her oars are out (one board or the other)', () => {
    const h = new Helm(clearSea());
    expect(cantLoad(h)).toBeNull();
    h.drop(6, 8);
    h.tick(2);
    expect(h.slot).toBeGreaterThanOrEqual(0);
    expect(cantLoad(h)).toBeNull();
    h.row(true);
    expect(cantLoad(h)).toBe('oars');
  });

  it('holed, the deck patch comes first; waiting in the lock, the quay\'s Bilge', () => {
    let h = new Helm(clearSea());
    h.hit();
    expect(cantLoad(h)).toBe('holed');
    const L = LAY.LOCKS[0], [lc, lr] = ends(L).low;
    h = new Helm(stilled(new Sea(9)), { c: lc, r: lr, d: L.up });   // (below the first lock, facing it, its mouth's wind stilled)
    h.put('F'); h.put('F');   // (into the lock, and on up the canal)
    for (let i = 0; i < 200 && h.held() !== 'up'; i++) h.tick(0.05);
    expect(h.held()).toBe('up');
    expect(cantLoad(h)).toBe('lock');
  });
});

describe('a race\'s starting shots (11 Nov: "Maybe start with one or two guns to enable that gameplay?")', () => {
  it('at the gun she\'s loaded up to two shots, one a side; more loaded already are kept, and none is lost', () => {
    const b = new Broadside();
    expect(b.stock(2)).toBe(2);
    expect([b.shots('L'), b.shots('R')]).toEqual([1, 1]);
    expect(b.fire('L')).toBe('fired');
    // (one fired: the next race's gun loads her again, the fired gun wanting its swab left as it is)
    expect(b.stock(2)).toBe(2);
    const full = new Broadside();
    for (let i = 0; i < 4; i++) full.board.guns[i].state = 'loaded';
    expect(full.stock(2)).toBe(4);
  });
});
