/* The sloop race online's lobby (src/race-server.ts, Referee: its lobby, the open races; src/race-net.ts, NET,
   Peek). The user, 12 Nov, trying it online for the first time: "how do I know that people are here instead
   of bots? There's no indication of that", "much more lobby-like ... you can either wait for people, start with
   bots", "the public lobby, where people can just come in but it should be clear when you're waiting for the
   next race who's waiting", and "I [don't] think I want people to share codes. You should just see a lobby and
   be able to join it". And the den's panels while racing: "What does H head home mean in this context? Is that
   even relevant in here?" */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RACE } from '../src/den-race';
import { NET, isOpen, makeCode, peekText } from '../src/race-net';
import { Referee, RaceServer } from '../src/race-server';
import { seeded } from '../src/mirror-row';

const DT = 1 / NET.HZ;
/** The room's rules with these pirates in it (ids four letters or more), the racers in all set. */
function room(ids: string[], fill = 4) {
  const R = new Referee(seeded(5));
  for (const id of ids) R.join(id, id[0].toUpperCase() + id.slice(1), null);
  R.handle(ids[0], { t: 'fill', n: fill });
  return R;
}
const ticks = (R: Referee, s: number) => { for (let k = 0; k < Math.round(s * NET.HZ); k++) R.tick(DT); };

describe('"how do I know that people are here instead of bots?" (12 Nov)', () => {
  it('the lobby says who\'s a pirate and who\'s a bot, every racer', () => {
    const s = room(['anne', 'bart'], 4).snapshot();
    expect(s.racers.map((r) => !!r.id)).toEqual([true, true, false, false]);
    expect(s.racers.filter((r) => r.id).map((r) => r.name)).toEqual(['Anne', 'Bart']);
  });

  it('a pirate whose sloop a bot\'s taken over is shown as one', () => {
    const R = room(['anne', 'bart'], 2);
    R.handle('anne', { t: 'ready', on: true });
    R.handle('bart', { t: 'ready', on: true });
    R.handle('bart', { t: 'retire' });
    expect(R.snapshot().racers[1].bot).toBe(true);
  });
});

describe('"you can either wait for people, start with bots" (12 Nov)', () => {
  it('alone, Start begins the count at once, bots filling the empty places', () => {
    const R = room(['anne'], 4);
    R.handle('anne', { t: 'ready', on: true });
    expect(R.phase).toBe('count');
    expect(R.cast.filter((e) => !e.id)).toHaveLength(3);
  });

  it('waiting for pirates, nothing happens and the room stays quiet', () => {
    const R = room(['anne', 'bart']);
    ticks(R, 60);
    expect(R.phase).toBe('lobby');
    expect(R.ticking).toBe(false);
    expect(R.snapshot().soon).toBeNull();
  });

  it('everyone pressing Start begins the count at once', () => {
    const R = room(['anne', 'bart']);
    R.handle('anne', { t: 'ready', on: true });
    expect(R.phase).toBe('lobby');
    R.handle('bart', { t: 'ready', on: true });
    expect(R.phase).toBe('count');
  });

  it('one pressing Start while another waits: the count after a short clock, the one who waited racing the next', () => {
    const R = room(['anne', 'bart']);
    R.handle('anne', { t: 'ready', on: true });
    expect(R.snapshot().soon).toBe(NET.ABOARD);
    expect(R.ticking).toBe(true);
    ticks(R, NET.ABOARD - 1);
    expect(R.phase).toBe('lobby');
    ticks(R, 1.5);
    expect(R.phase).toBe('count');
    const s = R.snapshot();
    expect(s.racers.filter((r) => r.id).map((r) => r.name)).toEqual(['Anne']);
    expect(s.players.find((p) => p.name === 'Bart')!.racing).toBe(false);
  });

  it('changing your mind back to waiting stops the clock', () => {
    const R = room(['anne', 'bart']);
    R.handle('anne', { t: 'ready', on: true });
    R.handle('anne', { t: 'ready', on: false });
    expect(R.snapshot().soon).toBeNull();
    expect(R.ticking).toBe(false);
  });

  it('the one waiting for pirates leaving starts it for those who pressed Start', () => {
    const R = room(['anne', 'bart']);
    R.handle('anne', { t: 'ready', on: true });
    R.drop('bart');
    expect(R.phase).toBe('count');
  });
});

describe('"it should be clear when you\'re waiting for the next race who\'s waiting" (12 Nov)', () => {
  /** Anne racing alone with a bot, retired at once (a bot sails her home), and Cara in during her race. */
  function racing() {
    const R = room(['anne'], 2);
    R.handle('anne', { t: 'ready', on: true });
    ticks(R, RACE.COUNT + 1);
    expect(R.phase).toBe('on');
    R.join('cara', 'Cara', null);
    return R;
  }

  it('a pirate who comes in during a race is shown waiting for the next, not racing', () => {
    const s = racing().snapshot();
    expect(s.players.map((p) => [p.name, p.racing])).toEqual([['Anne', true], ['Cara', false]]);
    expect(s.racers.map((r) => r.name)).not.toContain('Cara');
  });

  it('she can press Start for the next race while this one\'s on, and is in it', () => {
    const R = racing();
    R.handle('cara', { t: 'ready', on: true });
    expect(R.player('cara')!.ready).toBe(true);
    expect(R.phase).toBe('on');
    R.handle('anne', { t: 'retire' });
    // (every player in it out: called after a while, the places shown, then the lobby for the next race,
    // and Cara's Start still pressed: its clock running)
    ticks(R, NET.CALL + 1);
    expect(R.phase).toBe('done');
    ticks(R, NET.RESULTS + 1);
    expect(R.phase).toBe('lobby');
    expect(R.player('cara')!.ready).toBe(true);
    expect(R.snapshot().soon).not.toBeNull();
    ticks(R, NET.ABOARD + 1);
    expect(R.phase).not.toBe('lobby');
    expect(R.snapshot().racers.filter((r) => r.id).map((r) => r.name)).toEqual(['Cara']);
  });

  it('those who raced are waiting again after it, not dragged into the next', () => {
    const R = racing();
    R.handle('anne', { t: 'retire' });
    ticks(R, NET.CALL + NET.RESULTS + 2);
    expect(R.phase).toBe('lobby');
    expect(R.player('anne')!.ready).toBe(false);
  });

  it('every player in it home and someone waiting for the next, the race is called soon after: nobody waits long for the bots', () => {
    const R = racing();
    R.handle('anne', { t: 'retire' });
    ticks(R, 1);
    expect(R.snapshot().soon).toBeGreaterThan(NET.CALL - 2);
    ticks(R, NET.CALL);
    expect(R.phase).toBe('done');
  });

  it('nobody waiting for the next, the bots come home in their own time', () => {
    const R = room(['anne'], 2);
    R.handle('anne', { t: 'ready', on: true });
    ticks(R, RACE.COUNT + 1);
    R.handle('anne', { t: 'retire' });
    ticks(R, NET.CALL + 2);
    expect(R.phase).toBe('on');
    expect(R.snapshot().soon).toBeNull();
  });

  it('once it\'s done, everyone pressing Race again goes straight to the next race', () => {
    const R = racing();
    R.handle('anne', { t: 'retire' });
    ticks(R, NET.CALL + 1);
    expect(R.phase).toBe('done');
    R.handle('anne', { t: 'ready', on: true });
    R.handle('cara', { t: 'ready', on: true });
    expect(R.phase).toBe('count');
    expect(R.snapshot().racers.filter((r) => r.id)).toHaveLength(2);
  });
});

describe('"You should just see a lobby and be able to join it", no codes (12 Nov)', () => {
  it('the open races have codes of their own, never handed out to a private race', () => {
    expect(NET.LOBBIES.length).toBeGreaterThan(0);
    for (const l of NET.LOBBIES) expect(NET.CODE.test(l.code)).toBe(true);
    // (dice that would roll OPEN first: a private race's code is never an open race's)
    const open = NET.LOBBIES[0].code, rolls = [...open].map((ch) => (NET.LETTERS.indexOf(ch) + 0.5) / NET.LETTERS.length);
    let k = 0;
    const code = makeCode(() => (k < rolls.length ? rolls[k++] : 0.01));
    expect(isOpen(code)).toBe(false);
  });

  it('an open race seen from outside says who\'s in it, racing or waiting, before you join', () => {
    const S = new RaceServer('OPEN', seeded(2));
    S.join('c1'); S.message('c1', { t: 'hello', name: 'Anne' });
    S.join('c2'); S.message('c2', { t: 'hello', name: 'Bart' });
    expect(peekText(S.peek())).toEqual({ open: true, says: 'Waiting: Anne, Bart' });
    S.message('c1', { t: 'ready', on: true });
    S.message('c2', { t: 'ready', on: true });
    S.join('c3'); S.message('c3', { t: 'hello', name: 'Cara' });
    expect(S.peek().players.map((p) => p.racing)).toEqual([true, true, false]);
    expect(peekText(S.peek())).toEqual({ open: true, says: 'Racing now · next: Cara' });
  });

  it('an empty open race, a full one, and one that can\'t be reached each say so', () => {
    expect(peekText(new Referee(seeded(1)).peek())).toEqual({ open: true, says: 'Nobody yet' });
    const R = room(['aaaa', 'bbbb', 'cccc', 'dddd', 'eeee', 'ffff']);
    expect(peekText(R.peek()).open).toBe(false);
    expect(peekText(null).open).toBe(false);
  });

  it('the panel asks for no code: the open races are joined with a click, and racing online is on the den\'s top panel and the starter\'s card', () => {
    const net = readFileSync('js/den/race-net.js', 'utf8'), den = readFileSync('den.html', 'utf8'), card = readFileSync('js/den/race-start.js', 'utf8');
    expect(net).not.toMatch(/name="code"|Make a race|Copy the link/);
    expect(net).toMatch(/data-act="join" data-code=/);
    expect(den).toMatch(/id="race-btn"[^>]*>Race online</);
    expect(card).toMatch(/Race online/);
  });
});

describe('the den\'s panels while racing: "What does H head home mean in this context?" (12 Nov)', () => {
  it('the sailing bar\'s keys drop H: head home in a race, and H does nothing there', () => {
    const sailing = readFileSync('js/den/sailing.js', 'utf8'), den = readFileSync('den.html', 'utf8');
    expect(sailing).toMatch(/<span class="off-race">[^']*<kbd>H<\/kbd>: head home/);
    expect(den).toMatch(/body\.racing \.sailhud \.off-race \{ display: none; \}/);
    expect(sailing).toMatch(/key === 'h' && race\.rules\.state === 'off'/);
  });

  it('the starter\'s card is light: a line of the race, the rest behind How it works', () => {
    const card = readFileSync('js/den/race-start.js', 'utf8');
    expect(card).toMatch(/STARTER\.explain\[0\]/);
    expect(card).toMatch(/class="rc-more" hidden/);
  });
});
