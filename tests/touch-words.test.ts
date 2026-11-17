// A prompt's words on a touch screen (src/touch-words.ts): the phone check (16 Nov) found the den's prompts were
// all keys, "Space: go ashore" with no Space on a phone.
import { describe, it, expect } from 'vitest';
import { forTouch } from '../src/touch-words.js';

describe("a prompt's words on a touch screen", () => {
  it('says Tap here for Space, a tap for a click, and drops a key on its own (the den at sea on a phone, 16 Nov)', () => {
    expect(forTouch("Off the den's beach · Space: go ashore · click the sea to drop a pin · 1: Sailing"))
      .toBe("Off the den's beach · Tap here: go ashore · tap the sea to drop a pin");
  });

  it('keeps a click on something as a tap on it', () => {
    expect(forTouch('Shift or click a raider: lob it over the wall')).toBe('Tap a raider: lob it over the wall');
    expect(forTouch('Space, Shift or click a raider: throw the P down on them!')).toBe('Tap here: throw the P down on them!');
    expect(forTouch('Space or click: pick up / fit')).toBe('Tap here: pick up / fit');
  });

  it("leaves words that aren't keys alone", () => {
    for (const t of ['Up on the rampart · watch for raiders at the wall', 'A raider is in the den! Grab a piece to throw at them', 'Fetch a piece from the piles'])
      expect(forTouch(t)).toBe(t);
  });

  it('drops parts that are only keys', () => {
    expect(forTouch("Walk to the frame · M: the captain's map · Tab: the Carpentry view")).toBe('Walk to the frame');
    expect(forTouch('Q E: fire port, starboard · W / S: row')).toBe('');
    expect(forTouch('The starting line, spot 9 · 1 to 3: rivals (3) · Space: the count')).toBe('The starting line, spot 9 · Tap here: the count');
  });

  it("puts a cutscene's bar in a phone's words (Helium's lesson on a phone, 16 Nov)", () => {
    expect(forTouch('Space: skip')).toBe('Tap here: skip');
    expect(forTouch('Watch the flask · Space: go on · Esc: skip')).toBe('Watch the flask · Tap here: go on');
  });
});
