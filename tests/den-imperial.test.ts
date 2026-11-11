/* Port Decorum, the island under imperial control (src/den-imperial.ts; its squares LAY.EMPIRE). The
   user (11 Nov): "start sketching out even just like, even if it's just an empty island or something
   where you can't interact yet, is just some island that's, say, under imperial control ... to create
   trading mechanics, looting mechanics, smuggling mechanics". Sketched: to sail up to and look at. */
import { describe, expect, it } from 'vitest';
import { EMPIRE, EMPIRE_CAST, EMPIRE_OFF, EMPIRE_SAYS, EMPIRE_STANDS, Sighting, UNIFORM, empireAt, empireShore, inEmpireEarshot, onEmpireLanding } from '../src/den-imperial';
import { LAY, SAIL, Sea, checkpointWorks, path } from '../src/den-sail';
import { kikkitAt, onKikkitLanding } from '../src/den-kikkit';
import { tzzAt, onTzzLanding } from '../src/den-tzz';
import { isleAt, onIsleLanding } from '../src/den-isle';
import { inZone } from '../src/den-wind';
import { smugglersAt } from '../src/den-smugglers';
import { Chatter } from '../src/chatter';
import { CHART, IMPERIAL, NOTES } from '../src/den-map';
import { HALT, GRUMBLES, SIGHTED } from '../src/lines/imperial-guards';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const E = LAY.EMPIRE;
const LOOK_JS = readFileSync(join(__dirname, '..', 'js', 'den-look.js'), 'utf8');
const near = ([c, r]: readonly number[]) => [Math.round(c), Math.round(r)] as const;

describe('Port Decorum: an imperial island out past the checkpoint', () => {
  it('is land, sailed round, whatever the sea, and the water off it is always open', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = new Sea(seed);
      for (const [c, r] of E.LAND) { expect(s.open(c, r)).toBe(false); expect(s.ground(c, r)).toBe(true); expect(empireAt(c, r)).toBe(true); }
      for (let c = 0; c < SAIL.COLS; c++) for (let r = 0; r < SAIL.ROWS; r++) if (onEmpireLanding(c, r)) expect(s.open(c, r), `seed ${seed}: ${c},${r}`).toBe(true);
    }
  }, 30000);

  it('is in imperial waters, where the shipping lane leads: beyond the checkpoint and the wreck, straight out from its gate', () => {
    for (const [, r] of E.LAND) { expect(r).toBeGreaterThan(LAY.CHECKPOINT.ROW); expect(r).toBeGreaterThan(LAY.WRECK[1]); }
    const cols = E.LAND.map(([c]) => c);
    expect(Math.min(...cols)).toBeLessThanOrEqual(LAY.CHECKPOINT.GATE + 1);
    expect(Math.max(...cols)).toBeGreaterThanOrEqual(LAY.CHECKPOINT.GATE);
  });

  it('is a proper island: bigger than Kikkit\'s or Tzz\'s (a port town to come)', () => {
    expect(E.LAND.length).toBeGreaterThan(LAY.KIKKIT.LAND.length * 1.8);
    expect(E.LAND.length).toBeGreaterThan(LAY.TZZ.LAND.length * 5);
  });

  it(`has room of its own: open sea two squares deep round its front and sides, nothing crammed in; its back shut off by rocks (11 Nov: "there's some rocks and whatnot blocking some back entry")`, () => {
    const s = new Sea(9), works = new Set(checkpointWorks().map(([c, r]) => `${c},${r}`));
    for (const [lc, lr] of E.LAND) for (let c = lc - 2; c <= lc + 2; c++) for (let r = lr - 2; r <= lr + 2; r++) {
      // (the smugglers' rocks round its back, and the water and beach behind them: tests/den-smugglers.test.ts)
      if (empireAt(c, r) || smugglersAt(c, r)) continue;
      expect(c >= 0 && c < SAIL.COLS && r >= 0 && r < SAIL.ROWS, `${c},${r} on the board`).toBe(true);
      expect(s.open(c, r), `${c},${r}`).toBe(true);
      expect(s.windAt(c, r)).toBeUndefined();
      expect(LAY.ZONES.some((z) => inZone(z, c, r)), `${c},${r} in a wind zone`).toBe(false);
      expect(s.whirls.has(`${c},${r}`) || s.pockets.has(`${c},${r}`)).toBe(false);
      expect(kikkitAt(c, r) || isleAt(c, r) || tzzAt(c, r) || onKikkitLanding(c, r) || onIsleLanding(c, r) || onTzzLanding(c, r) || works.has(`${c},${r}`), `${c},${r}`).toBe(false);
      expect(c === LAY.WRECK[0] && r === LAY.WRECK[1]).toBe(false);
    }
  });

  it('11 Nov: the sea grew out to sea for it, everything already there staying put', () => {
    expect(SAIL.COLS).toBe(27);
    const before = [...LAY.FAR, ...LAY.SIDES, LAY.WRECK, ...LAY.KIKKIT.LAND, ...LAY.KIKKIT.VEGAS, ...LAY.TZZ.LAND, ...LAY.ISLE.LAND, ...LAY.CANAL, ...LAY.HARBOUR];
    for (const [, r] of before) expect(r).toBeLessThan(26);
    for (const [, r] of E.LAND) expect(r).toBeGreaterThanOrEqual(26);
  });

  it('can be sailed to from the mooring (through the checkpoint, its gate or any other way)', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const s = new Sea(seed);
      expect(s.plot(SAIL.HOME, EMPIRE_OFF.c, EMPIRE_OFF.r), `seed ${seed}`).not.toBeNull();
    }
  }, 30000);

  it('its starting point (?at=imperial) is just off the jetty, within earshot, bows to the island', () => {
    expect(onEmpireLanding(EMPIRE_OFF.c, EMPIRE_OFF.r)).toBe(true);
    expect(inEmpireEarshot(EMPIRE_OFF.c, EMPIRE_OFF.r)).toBe(true);
    const ahead = path(EMPIRE_OFF, 'F').to;
    expect(Math.hypot(ahead.c - E.JETTY[0], ahead.r - E.JETTY[1])).toBeLessThan(1.5);
  });
});

describe('what\'s on it: a fort, a harbour, a customs house, a market, a warehouse, its guards', () => {
  it('has every building a port under imperial control wants, each on its own land', () => {
    const kinds = EMPIRE_CAST.town.map((o) => o.kind);
    for (const k of ['fort', 'customs', 'market', 'warehouse']) expect(kinds).toContain(k);
    for (const o of EMPIRE_CAST.town) expect(empireAt(...near(o.at)), `${o.kind} at ${o.at}`).toBe(true);
  });

  it('its guards stand on its land, the one who talks on the jetty\'s end', () => {
    expect(EMPIRE_CAST.guards.length).toBeGreaterThanOrEqual(4);
    for (const g of EMPIRE_CAST.guards) expect(empireAt(...near(g.at)), `${g.at}`).toBe(true);
    const talk = EMPIRE_CAST.guards.filter((g) => g.talks);
    expect(talk).toHaveLength(1);
    expect(near(talk[0].at)).toEqual(E.JETTY);
    expect(talk[0].at).toEqual([EMPIRE_STANDS.c, EMPIRE_STANDS.r]);
  });

  it('they wear the Empire\'s uniform, from the wardrobe (no one-offs): the checkpoint\'s crimson and gold', () => {
    for (const id of [UNIFORM.hat, UNIFORM.top, UNIFORM.legs, UNIFORM.feet, UNIFORM.hand, UNIFORM.waist]) expect(LOOK_JS).toContain(`['${id}'`);
    for (const dye of [UNIFORM.hatCol, UNIFORM.topCol, UNIFORM.topCol2, UNIFORM.legsCol, UNIFORM.feetCol, UNIFORM.waistCol]) expect(LOOK_JS).toMatch(new RegExp(`\\b${dye}: '#`));
  });

  it('its shore goes round its land but the jetty, which stands out on piles', () => {
    const shore = empireShore();
    expect(shore.length).toBeGreaterThan(8);
    const [jc, jr] = E.JETTY;
    // (the jetty's far corners aren't on the shore)
    expect(shore.some(([c, r]) => r === jr && (c === jc || c === jc + 1))).toBe(false);
  });
});

describe('sailing up to it: nothing to do there yet, and you\'re told whose it is', () => {
  it('says whose it is once a voyage, the first time you come up off it, not mid-cutscene', () => {
    const s = new Sighting();
    expect(s.arrive(false, true)).toBe(false);
    expect(s.arrive(true, false)).toBe(false);
    expect(s.arrive(true, true)).toBe(true);
    expect(s.arrive(true, true)).toBe(false);
    expect(SIGHTED).toMatch(/imperial/i);
    expect(SIGHTED).toContain(EMPIRE.NAME);
  });

  it('the jetty guard halts you, then grumbles on, round and round, while you\'re in earshot', () => {
    expect(EMPIRE_SAYS.intro).toEqual([HALT]);
    expect(EMPIRE_SAYS.loop).toEqual(GRUMBLES);
    const ch = new Chatter(EMPIRE_SAYS, { secs: () => 2, gap: 1, wait: 0 });
    ch.start();
    const said: string[] = [];
    for (let i = 0; i < 400 && said.length < GRUMBLES.length + 2; i++) { const t = ch.tick(0.25, true); if (t) said.push(t); }
    expect(said[0]).toBe(HALT);
    expect(said.slice(1, 1 + GRUMBLES.length)).toEqual([...GRUMBLES]);
  });

  it('never hints how to get in (RULES.md, "Hidden gems, never hinted")', () => {
    for (const line of [SIGHTED, HALT, ...GRUMBLES]) expect(line).not.toMatch(/bribe|sneak|smuggl|try |back way|another way|secret/i);
  });

  it('is one point of interest on the captain\'s map, never named', () => {
    expect(CHART.empire.shore.length).toBe(empireShore().length);
    expect(NOTES.filter((n) => n.label === IMPERIAL.label)).toHaveLength(1);
    expect(NOTES.some((n) => (n.label + (n.note ?? '')).includes(EMPIRE.NAME))).toBe(false);
    const [c, r] = IMPERIAL.at;
    expect(c >= 0 && c < SAIL.COLS && r >= 0 && r < SAIL.ROWS).toBe(true);
  });
});
