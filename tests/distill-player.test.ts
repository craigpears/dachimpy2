/* One simulation for a bot's play (16 Nov): src/distill-bots.ts's BotPlayer, used by the bots' runner (playSession),
   the tests and distilling-test.html alike. The user: "the bot does the set X things for ticks ... burning and things
   like that should not be dependent on an animation or real time element at all"; "if there's a bit of lag, the front
   end will then catch up with the simulation, not the other way around". */
import { describe, expect, it } from 'vitest';
import { BotPlayer, effortOf, levelNamed, playSession } from '../src/distill-bots';
import { Distilling } from '../src/distilling';
import { seeded } from '../src/mirror-row';

const L = 'wbK*x';
/** A session's columns, its time fed in `chunk` ms at a time (Infinity: all at once, as the runner does). */
function columns(seed: number, bot: string, minutes: number, chunk: number): string[] {
  const g = new Distilling(seeded(seed)), out: string[] = [];
  const p = new BotPlayer(g, levelNamed(bot), { onEvents: (ev) => { for (const e of ev) if (e.kind === 'column') out.push(`${g.time} ${e.column.up ? 'up' : 'burned'} ${e.column.pieces.map((q) => L[q]).join('')}`); } });
  if (chunk === Infinity) p.advance(Infinity, minutes * 60000);
  else while (!g.finished && g.time < minutes * 60000) p.advance(chunk, minutes * 60000);
  return out;
}

describe('"The bot does the set X things for ticks ... not dependent on an animation or real time element at all" (16 Nov)', () => {
  it('the same seed and bot play the same game however the time is handed in: all at once, a frame at a time, at any speed, after lag', () => {
    const whole = columns(2, 'cc3', 1.5, Infinity);
    expect(whole.length).toBeGreaterThan(3);
    // (a frame at 60 fps; at 8x speed; a lagging frame of a quarter second)
    for (const chunk of [1000 / 60, (1000 / 60) * 8, 250]) expect(columns(2, 'cc3', 1.5, chunk), `${chunk} ms a frame`).toEqual(whole);
  }, 120000);
  it('the bots\' runner plays through the same player: its columns are the player\'s', () => {
    const g = new Distilling(seeded(2)), out: string[] = [];
    playSession(g, levelNamed('cc3'), 1.5, (c) => out.push(`${g.time} ${c.up ? 'up' : 'burned'} ${c.pieces.map((q) => L[q]).join('')}`));
    expect(out).toEqual(columns(2, 'cc3', 1.5, Infinity));
  }, 60000);
});

describe('"How many moves a bot makes ... the swaps should count less than like the little fiddly ones" (16 Nov)', () => {
  it('one long straight sweep costs a person less than the same swaps in short drags with turns', () => {
    const sweep = effortOf([{ x: 0, y: 0, ways: [3, 3, 3, 3, 3, 3] }]);
    const fiddly = effortOf([{ x: 0, y: 0, ways: [3, 0] }, { x: 1, y: 1, ways: [2, 1] }, { x: 2, y: 2, ways: [3, 2] }]);
    expect(sweep).toBeLessThan(fiddly);
    expect(sweep).toBeLessThan(2);
  });
  it('the runner reports a session\'s effort, counted as its moves are made', () => {
    const r = playSession(new Distilling(seeded(2)), levelNamed('cc3'), 0.5);
    expect(r.drags).toBeGreaterThan(0);
    expect(r.effort).toBeGreaterThanOrEqual(r.drags);
  }, 60000);
});
