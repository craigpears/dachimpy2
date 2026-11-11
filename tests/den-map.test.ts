import { describe, expect, it } from 'vitest';
import { MAP, CHART, NOTES, ROUTE, RUMOUR, X_AT, onMap, canPickUp, canRead, mapAfter, type Square } from '../src/den-map';
import { LAY, SAIL, canalAt } from '../src/den-sail';

describe('the captain\'s map', () => {
  it('is dropped on the beach once the siege is over ("a map that\'s dropped on the beach", 9 Nov)', () => {
    expect(mapAfter('none', 'build')).toBe('none');
    expect(mapAfter('none', 'wave')).toBe('none');
    expect(mapAfter('none', 'calm')).toBe('none');
    expect(mapAfter('none', 'peace')).toBe('lying');
    expect(mapAfter(undefined, 'peace')).toBe('lying');   // (a den from before the map)
  });

  it('stays yours once picked up, even if a raid is called on later', () => {
    expect(mapAfter('found', 'wave')).toBe('found');
    expect(mapAfter('found', 'peace')).toBe('found');
    expect(mapAfter('lying', 'wave')).toBe('lying');
  });

  it('is picked up only from close by, and only while it\'s lying there', () => {
    expect(canPickUp('lying', 0.5, -0.8)).toBe(true);
    expect(canPickUp('lying', MAP.REACH + 0.1, 0)).toBe(false);
    expect(canPickUp('none', 0, 0)).toBe(false);
    expect(canPickUp('found', 0, 0)).toBe(false);
    expect(canRead('lying')).toBe(false);
    expect(canRead('found')).toBe(true);
  });
});

/* The user, 10 Nov: "the map obviously needs updating as well now, because we've added a lot of
   stuff. Obviously, don't show off the secrets, but certainly, like, even just like the checkpoint
   or something should, like, the line, it should match up with what is actually on the map". */
describe('the map matches the sea, and doesn\'t show off the secrets (10 Nov)', () => {
  const K = LAY.CHECKPOINT;

  it('draws the checkpoint\'s line where it is on the sea: across from the headland to the reef, its gate and guns', () => {
    expect(CHART.checkpoint.row).toBe(K.ROW);
    expect(CHART.checkpoint.gate).toBe(K.GATE);
    expect(CHART.checkpoint.guns).toEqual(K.GUNS.map(([c]) => c));
    expect(CHART.checkpoint.piers).toEqual(K.PIERS.map(([c]) => c));
    // From the headland's end to the reef's start, and the reef on to the edge of the sea.
    expect(CHART.checkpoint.from).toBe(K.HEADLAND.c1 + 1);
    expect(CHART.checkpoint.to).toBe(K.REEF.c0 - 1);
    expect(CHART.reef).toEqual({ row: K.ROW, from: K.REEF.c0, to: K.REEF.c1 });
    expect(CHART.land).toContainEqual(K.HEADLAND);
  });

  it('draws the trade winds and the shipping lane where they blow on the sea', () => {
    expect(CHART.lanes).toHaveLength(LAY.LANES.length);
    LAY.LANES.forEach(({ at, n }, i) => {
      const { from, to } = CHART.lanes[i];
      expect(from).toEqual(at);
      expect(Math.abs(to[0] - from[0]) + Math.abs(to[1] - from[1])).toBe(n - 1);
    });
    // The main shipping lane runs on from the junction toward the checkpoint's gate.
    const main = CHART.lanes[1];
    expect(main.from[0]).toBe(K.GATE);
    expect(main.from[1]).toBe(LAY.JUNCTION[1] + 1);
    expect(main.to[1]).toBeLessThan(K.ROW);
  });

  it('is laid out on the sheet as the sea is: the den at the bottom, the checkpoint across, the wreck and the X beyond', () => {
    const [, denV] = onMap(CHART.den), [gateU, lineV] = onMap([K.GATE, K.ROW]), [xU, xV] = onMap(X_AT);
    expect(X_AT).toEqual(LAY.WRECK);
    expect(denV).toBeGreaterThan(lineV);
    expect(lineV).toBeGreaterThan(xV);
    expect(xU).toBeLessThan(gateU);   // (the wreck's off to the left beyond it, as it is)
    for (const sq of [[0, 0], [SAIL.COLS - 1, SAIL.CHARTED.ROWS - 1], CHART.den] as Square[]) {   // (the charted sea: the race's course past it is off the map, 11 Nov)
      const [u, v] = onMap(sq);
      expect(u).toBeGreaterThan(0); expect(u).toBeLessThan(1);
      expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(1);
    }
    // The dotted way goes out through the checkpoint's gate.
    expect(ROUTE).toContainEqual([K.GATE, K.ROW]);
  });

  const harbour = new Set(LAY.HARBOUR.map(([c, r]) => `${c},${r}`));
  const secret = (c: number, r: number) => canalAt(c, r) || harbour.has(`${c},${r}`)
    || LAY.CANAL.some(([a, b]) => a === c && b === r);

  it('has nothing on a secret square: no canal, locks, harbour, hidden cove (or lagoon, off the sea)', () => {
    const marked: Square[] = [
      ...CHART.lanes.flatMap(({ from, to }) => {
        const out: Square[] = [], n = Math.abs(to[0] - from[0]) + Math.abs(to[1] - from[1]);
        for (let i = 0; i <= n; i++) out.push([from[0] + Math.sign(to[0] - from[0]) * i, from[1] + Math.sign(to[1] - from[1]) * i]);
        return out;
      }),
      ...ROUTE, ...CHART.rocks, CHART.wreck, X_AT,
      ...[...CHART.checkpoint.guns, ...CHART.checkpoint.piers, CHART.checkpoint.gate].map((c): Square => [c, K.ROW]),
      ...NOTES.filter((n) => !CHART.land.some((L) => n.at[0] >= L.c0 && n.at[0] <= L.c1 && n.at[1] >= L.r0 && n.at[1] <= L.r1)).map((n) => n.at),
    ];
    for (const [c, r] of marked) {
      const near = [[Math.floor(c), Math.floor(r)], [Math.ceil(c), Math.ceil(r)], [Math.round(c), Math.round(r)]];
      for (const [a, b] of near) expect(secret(a, b), `${c},${r}`).toBe(false);
    }
    // Everything on the sea's board is inside it (the lagoon's off it, so nothing there).
    for (const [c, r] of [...CHART.rocks, CHART.wreck]) {
      expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThan(SAIL.COLS);
      expect(r).toBeGreaterThanOrEqual(0); expect(r).toBeLessThan(SAIL.ROWS);
    }
  });

  it('draws the cliffs whole over the canal, its locks and the hidden cove, so no cut in them shows', () => {
    const under = (c: number, r: number) => CHART.land.some((L) => c >= L.c0 && c <= L.c1 && r >= L.r0 && r <= L.r1);
    const hidden: [number, number][] = [
      ...LAY.LOCKS.map((l) => l.at), ...LAY.POUNDS.flatMap((p) => p.at),
    ];
    for (let c = LAY.COVE.c0; c <= LAY.COVE.c1; c++) for (let r = LAY.COVE.r0; r <= LAY.COVE.r1; r++) hidden.push([c, r]);
    for (const [c, r] of hidden) expect(under(c, r), `${c},${r}`).toBe(true);
  });

  it('says nothing of the secrets, or of how to get past the checkpoint ("Hidden gems, never hinted")', () => {
    const words = [RUMOUR, ...NOTES.flatMap((n) => [n.label, n.note ?? ''])].join(' ').toLowerCase();
    for (const w of ['canal', 'locks?', 'harbour', 'cove', 'lagoon', 'crane', 'oars?', 'row', 'bilge', 'pump', 'umami', 'capybara', 'way round', 'round', 'shoot', 'guns?']) {
      expect(words, w).not.toMatch(new RegExp(`\\b${w}\\b`));
    }
  });
});
