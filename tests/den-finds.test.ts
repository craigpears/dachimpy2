/* What there is to do and to find, on the captain's map, and its tour (src/den-finds.ts). */
import { describe, expect, it } from 'vitest';
import { PLACES, QUESTS_TITLE, TOUR, WAYS, addFind, done, questLine, quests, tourKey, wayThrough, wayWrecked, type Progress } from '../src/den-finds';
import { CHART, X_AT } from '../src/den-map';

const none: Progress = { walk: false, stairs: false, tower: false, shack: false, x: false, lagoonChest: false, umami: false, wedding: false, found: [] };
const lines = (p: Progress) => quests(p).flatMap((g) => g.quests);
const line = (p: Progress, start: string) => lines(p).find((q) => q.label.startsWith(start))!;

/* The user, 10 Nov: "I just know there's a lot of stuff in here and I want to make it ...
   discoverable given it's a proof of concept demo." At the map stage, a short tour and a list of
   little quests: tease, don't tell. */
describe('the den\'s a lot to take in for a demo (10 Nov)', () => {
  it('has a short tour, a few steps, each saying something and pointing at the map or the quests', () => {
    expect(TOUR.length).toBeGreaterThanOrEqual(4);
    expect(TOUR.length).toBeLessThanOrEqual(6);
    for (const s of TOUR) {
      expect(s.say.length).toBeGreaterThan(20);
      expect(s.at || s.quests).toBeTruthy();
    }
    // The den first, the X on the old wreck along the way, and the quests last.
    expect(Math.abs(TOUR[0].at![0] - CHART.den[0])).toBeLessThan(3);
    expect(TOUR.some((s) => s.at?.[0] === X_AT[0] && s.at?.[1] === X_AT[1])).toBe(true);
    expect(TOUR.some((s) => s.at?.[1] === CHART.checkpoint.row && /checkpoint/i.test(s.say))).toBe(true);
    expect(TOUR[TOUR.length - 1].quests).toBe(true);
    expect(TOUR[TOUR.length - 1].say).toMatch(/quests/);
  });

  it('tells you how to set off, but never the way past the checkpoint nor where a secret is', () => {
    const all = TOUR.map((s) => s.say).join(' ');
    expect(all).toMatch(/jetty/);
    expect(all).toMatch(/Space to board/);
    expect(all).toMatch(/more than one way past/);
    expect(all).not.toMatch(/\b(oars?|row(ing|ed)?|locks?|canal|cove|lagoon|cliff|capybara|umami|crane|bribe|wreck (its|the) guns)\b/i);
  });

  it('steps on with Space, a click or the right arrow, back with the left, and Esc skips it all', () => {
    expect(tourKey(0, ' ')).toBe(1);
    expect(tourKey(0, 'click')).toBe(1);
    expect(tourKey(1, 'arrowright')).toBe(2);
    expect(tourKey(2, 'arrowleft')).toBe(1);
    expect(tourKey(0, 'arrowleft')).toBe(0);
    expect(tourKey(TOUR.length - 1, ' ')).toBe(-1);   // (past the last: it's over)
    expect(tourKey(2, 'escape')).toBe(-1);
    expect(tourKey(2, 'q')).toBe(2);
  });

  it('lists the den\'s jobs plainly and the secrets by their counts, under one heading', () => {
    expect(QUESTS_TITLE).toBe('Quests');
    const all = lines(none);
    expect(all.filter((q) => !q.secret).map(questLine)).toEqual(['Build the walk along the wall', 'Build the stairs up to it', 'Build the gun tower', 'Build yer shack', 'Haul up the treasure at the X', "See what's afoot on the Wedding Isle"]);
    expect(all.filter((q) => q.secret).map(questLine)).toEqual(['Ways past the checkpoint: 0 of 4', 'Hidden places: 0 of 2', 'Secret treasure: 0 of 1', 'A friend to rescue: 0 of 1']);
  });

  it('never names a secret for what it is or the way to it', () => {
    for (const q of lines(none).filter((x) => x.secret)) expect(questLine(q)).not.toMatch(/\b(oars?|row|run|fight|guns?|locks?|canal|cove|lagoon|cliff|crane|capybara|umami|trap|wreck)\b/i);
  });

  it('ticks each off as it\'s done, and keeps it on the list', () => {
    const p: Progress = { ...none, walk: true, stairs: true, shack: true, umami: true, found: ['run', 'locks', 'cove'] };
    expect(done(line(p, 'Build the walk'))).toBe(true);
    expect(done(line(p, 'Build the gun tower'))).toBe(false);
    expect(done(line(p, 'Build yer shack'))).toBe(true);
    expect(questLine(line(p, 'Ways past'))).toBe('Ways past the checkpoint: 2 of 4');
    expect(done(line(p, 'Ways past'))).toBe(false);
    expect(questLine(line(p, 'Hidden places'))).toBe('Hidden places: 1 of 2');
    expect(done(line(p, 'A friend'))).toBe(true);
    const all: Progress = { ...p, tower: true, x: true, lagoonChest: true, wedding: true, found: [...WAYS, ...PLACES] };
    expect(lines(all).every(done)).toBe(true);
    expect(lines(all)).toHaveLength(lines(none).length);
  });

  it("Out at sea: the isle's on the map, named for the wedding, not her: 'she's a primary character, but not the star of the show' (11 Nov)", () => {
    const q = line(none, 'See what');
    expect(quests(none).find((g) => g.title === 'Out at sea')!.quests).toContainEqual(q);
    expect(q.secret).toBe(false);
    expect(questLine(q)).toBe("See what's afoot on the Wedding Isle");
    expect(questLine(q)).not.toMatch(/Mischievious/);
    expect(done(q)).toBe(false);
    expect(done(line({ ...none, wedding: true }, 'See what'))).toBe(true);
  });

  it('counts each find once', () => {
    let f = addFind(undefined, 'row');
    f = addFind(f, 'row');
    f = addFind(f, 'cove');
    expect(f).toEqual(['row', 'cove']);
  });

  it('knows which way she got past the checkpoint', () => {
    expect(wayThrough('locks', { oars: false, silenced: false })).toBe('locks');
    expect(wayThrough('locks', { oars: true, silenced: true })).toBe('locks');
    expect(wayThrough('gate', { oars: false, silenced: false })).toBe('run');
    expect(wayThrough('gate', { oars: true, silenced: false })).toBe('row');
    // Its guns knocked out, the gate's safe: that was the way past, not going through after.
    expect(wayThrough('gate', { oars: false, silenced: true })).toBe(null);
    expect(wayWrecked(true)).toBe('fight');
    expect(wayWrecked(false)).toBe(null);
  });
});
