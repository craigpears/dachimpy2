/* The smugglers' beach, Port Decorum's back way in (src/den-smugglers.ts; its squares LAY.SMUGGLERS in
   src/den-sail.ts). The user (11 Nov): "the back way in, I think that will be better, like, accessed far
   through those whirlpools by, you know, [Kikkit]. I think having it one open area is a bit off ...
   Penguin Island, and then you have the ... Smuggler's Beach there ... redesign the fort so that ...
   there's some rocks and whatnot blocking some back entry". */
import { describe, expect, it } from 'vitest';
import { LAY, SAIL, Sea, Helm, type Pose, type SailEvent } from '../src/den-sail';
import { carry } from '../src/den-sailing';
import { runFor, RUN } from '../src/sailing';
import { MOUTH, PENGUINS } from '../src/den-kikkit';
import { EMPIRE_OFF, empireAt, onEmpireLanding } from '../src/den-imperial';
import { SMUGGLERS, SMUGGLERS_CAST, SMUGGLERS_OFF, Landfall, inSmugglersCove, onSmugglersRun, smugglersAt } from '../src/den-smugglers';
import { PLACES } from '../src/den-finds';
import { CHART, NOTES, SMUGGLERS_NOTE } from '../src/den-map';
import { AT_SMUGGLERS_BEACH } from '../src/lines/you';
import { HALT, GRUMBLES, SIGHTED } from '../src/lines/imperial-guards';
import { RAMBLE, TANGENTS } from '../src/lines/kikkit';
import { reachedAround } from './helpers';

const S = LAY.SMUGGLERS, k = (c: number, r: number) => `${c},${r}`;
const at = (p: Pose) => [p.c, p.r];
/** The helm played on, `secs` seconds (or till her pin's reached): every event. */
function play(h: Helm, secs = 30, untilPin = false): SailEvent[] {
  const out: SailEvent[] = [];
  for (let t = 0; t < secs && (!untilPin || h.pin); t += 0.02) out.push(...h.tick(0.02));
  return out;
}
const whirled = (ev: SailEvent[]) => ev.some((e) => e.kind === 'push' && e.whirl);

describe('"Make sure you can\'t get to [the smugglers\' beach] without going through the whirlpools" (11 Nov)', () => {
  it('rocks shut off Port Decorum\'s right-hand side and its back: from the den, past the checkpoint or round its front, nowhere behind them can be reached', () => {
    for (const seed of [1, 9, 17]) {
      const s = new Sea(seed), got = reachedAround(s);
      // (a real search: Port Decorum's front, off its jetty, is reached, the long way round by the gate)
      expect(got.has(k(EMPIRE_OFF.c, EMPIRE_OFF.r)), `seed ${seed}`).toBe(true);
      for (const [c, r] of [...S.RUN, ...S.COVE]) expect(got.has(k(c, r)), `seed ${seed}: ${c},${r}`).toBe(false);
    }
  }, 90000);

  it('through them: a Vegas to the penguins, out of their water to the right, and down the run to the beach', () => {
    const h = new Helm(new Sea(9), MOUTH);
    carry(h, runFor(RUN.VEGAS));
    expect(whirled(play(h))).toBe(false);
    expect(at(h.pose)).toEqual(PENGUINS);
    // (the pilot takes her on from there: the run's the way on)
    expect(h.drop(SMUGGLERS_OFF.c, SMUGGLERS_OFF.r)).toEqual([SMUGGLERS_OFF.c, SMUGGLERS_OFF.r]);
    const ev = play(h, 120, true);
    expect(whirled(ev)).toBe(false);
    expect(at(h.pose)).toEqual([SMUGGLERS_OFF.c, SMUGGLERS_OFF.r]);
    expect(inSmugglersCove(h.pose.c, h.pose.r)).toBe(true);
  }, 30000);

  it('the way home is back through the whirlpools: up the run, onto their wind, and Kikkit\'s winds throw her back to her island', () => {
    const h = new Helm(new Sea(9), SMUGGLERS_OFF), [tc, tr] = S.RUN[0];
    expect(h.drop(tc, tr)).toEqual([tc, tr]);
    play(h, 120, true);
    expect(at(h.pose)).toEqual([tc, tr]);
    h.put('R'); h.put('F');   // (a turn to starboard, on the spot where the rock ahead stops her, then onto the wind)
    const ev = play(h, 40);
    expect(whirled(ev)).toBe(true);
    expect(at(h.pose)).toEqual([MOUTH.c, MOUTH.r]);
  }, 30000);

  it('the pilot never takes her there from the open sea: a pin dropped in its cove lands this side of the rocks', () => {
    const s = new Sea(9), [c, r] = S.COVE[0];
    expect(s.plot(EMPIRE_OFF, c, r)).toBeNull();
    const pin = s.pinAt(c, r, EMPIRE_OFF)!;
    expect(smugglersAt(...pin)).toBe(false);
  }, 30000);
});

describe('what\'s there: rocks drawn as the reef, a run of water, a cove, a little beach', () => {
  it('its rocks are the reef\'s, its run and cove open water only the whirlpools get to, its beach land, on every sea', () => {
    for (const seed of [1, 2, 3, 9]) {
      const s = new Sea(seed);
      for (const [c, r] of S.ROCKS) { expect(s.isRock(c, r)).toBe(true); expect(s.reef.has(k(c, r)), `${c},${r}`).toBe(true); }
      for (const [c, r] of [...S.RUN, ...S.COVE]) { expect(s.open(c, r), `${c},${r}`).toBe(true); expect(s.hidden.has(k(c, r))).toBe(true); expect(s.windAt(c, r)).toBeUndefined(); }
      for (const [c, r] of S.BEACH) { expect(s.open(c, r)).toBe(false); expect(s.ground(c, r)).toBe(true); }
      // (and the sea still lays its scattered rocks: the hidden water isn't counted as cut off)
      const laid = new Set([...s.cliff, ...s.works, ...s.reef, ...[...LAY.SIDES, ...LAY.FAR, ...LAY.HARBOUR].map(([a, b]) => k(a, b))]);
      expect([...s.rocks].some((id) => !laid.has(id)), `seed ${seed}`).toBe(true);
    }
  });

  it('the run starts beside the penguins\' water and the whirlpools\' wind, and ends in the cove behind Port Decorum, by the beach', () => {
    const [c0, r0] = S.RUN[0], s = new Sea(9);
    expect(Math.abs(c0 - PENGUINS[0]) + Math.abs(r0 - PENGUINS[1])).toBeLessThanOrEqual(2);
    expect(s.windAt(c0 - 1, r0)).toBeDefined();
    expect(S.RUN.some(([c, r]) => c === PENGUINS[0] + 1 && r === PENGUINS[1])).toBe(true);
    // (behind it: further out to sea than its back shore, beside its land)
    const back = Math.max(...LAY.EMPIRE.LAND.map(([, r]) => r));
    expect(S.COVE.some(([, r]) => r > back)).toBe(true);
    for (const [c, r] of S.BEACH) {
      expect(LAY.EMPIRE.LAND.some(([x, y]) => Math.abs(x - c) + Math.abs(y - r) === 1), `${c},${r}`).toBe(true);
      expect(S.COVE.some(([x, y]) => Math.abs(x - c) + Math.abs(y - r) === 1), `${c},${r}`).toBe(true);
    }
    expect(S.COVE.some(([c, r]) => onSmugglersRun(c, r - 1))).toBe(true);
  });

  it('Port Decorum\'s front, jetty and quay are as they were: its own landing off them all open water', () => {
    const s = new Sea(9);
    expect(empireAt(...LAY.EMPIRE.JETTY)).toBe(true);
    for (let c = 0; c < SAIL.COLS; c++) for (let r = 0; r < SAIL.ROWS; r++) if (onEmpireLanding(c, r)) { expect(s.open(c, r), `${c},${r}`).toBe(true); expect(smugglersAt(c, r)).toBe(false); }
    expect(onEmpireLanding(EMPIRE_OFF.c, EMPIRE_OFF.r)).toBe(true);
  });

  it('its look is config: the sand, and shared pieces (a lantern, crates and barrels under a tarp, a rowboat) on the beach', () => {
    const kinds = SMUGGLERS_CAST.pieces.map((p) => p.kind);
    for (const want of ['lantern', 'tarpPile', 'rowboat', 'barrel', 'crate']) expect(kinds).toContain(want);
    for (const p of SMUGGLERS_CAST.pieces) {
      const [c, r] = p.at.map(Math.round);
      expect(S.BEACH.some(([x, y]) => x === c && y === r) || inSmugglersCove(c, r), `${p.kind} at ${p.at}`).toBe(true);
    }
  });
});

describe('a hidden gem, never hinted (RULES.md)', () => {
  it('said only once you\'re in its cove, once a voyage, not over anything else', () => {
    const l = new Landfall();
    expect(l.arrive(false, true)).toBe(false);
    expect(l.arrive(true, false)).toBe(false);
    expect(l.arrive(true, true)).toBe(true);
    expect(l.arrive(true, true)).toBe(false);
    expect(inSmugglersCove(SMUGGLERS_OFF.c, SMUGGLERS_OFF.r)).toBe(true);
    expect(AT_SMUGGLERS_BEACH).toMatch(/smugglers/i);
  });

  it('nobody mentions it: not the guards, not Kikkit, not the captain\'s map till you\'ve been', () => {
    for (const line of [SIGHTED, HALT, ...GRUMBLES, ...RAMBLE, ...TANGENTS]) expect(String(line)).not.toMatch(/smuggl/i);
    expect(NOTES.some((n) => (n.label + (n.note ?? '')).match(/smuggl/i))).toBe(false);
    expect(SMUGGLERS_NOTE.label).toBe(SMUGGLERS.NAME);
    // (drawn whole till found: the run and its cove as rock, as the cliffs are drawn without their canal)
    const whole = new Set(CHART.smugglers.whole.map(([c, r]) => k(c, r)));
    for (const [c, r] of [...S.RUN, ...S.COVE, ...S.ROCKS]) expect(whole.has(k(c, r))).toBe(true);
    expect(CHART.smugglers.rocks.length).toBe(S.ROCKS.length);
  });

  it('a hidden place found, on the quest list\'s count', () => {
    expect(PLACES).toContain('smugglers');
  });
});
