import { describe, expect, it } from 'vitest';
import { MAP, WAYS, X_AT, DEN_AT, canPickUp, canRead, mapAfter } from '../src/den-map';

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

  it('shows a way past him for each puzzle: gun, sword and bilge ("leave the choices open", 9 Nov)', () => {
    expect(WAYS.map((w) => w.puzzle).sort()).toEqual(['Bilge', 'Gunning', 'Swordfight']);
    // Every way is on the map, out across the sea between your cove and the X on his island.
    for (const w of WAYS) {
      expect(w.at[0]).toBeGreaterThan(0); expect(w.at[0]).toBeLessThan(1);
      expect(w.at[1]).toBeGreaterThan(X_AT[1]); expect(w.at[1]).toBeLessThan(DEN_AT[1]);
    }
  });
});
