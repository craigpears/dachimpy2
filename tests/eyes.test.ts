/* Watching eyes, any portrait's (11 Nov, of the Count's in Gravee's house: "The vampire portrait that's
   following you definitely needs to be a normal thing"). */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eyesToward, pirateEyes, PIRATE_EYES } from '../src/eyes';

const ROOT = join(__dirname, '..');

describe("a portrait's eyes follow you", () => {
  it('looks left when you are to its left, right when you are to its right', () => {
    expect(eyesToward(10, 2, 7, 1, -3)[0]).toBeLessThan(-0.3);
    expect(eyesToward(10, 2, 13, 1, -3)[0]).toBeGreaterThan(0.3);
    expect(Math.abs(eyesToward(10, 2, 10, 1, -3)[0])).toBeLessThan(0.01);
  });
  it('looks down at you from high on the wall', () => {
    expect(eyesToward(10, 2.4, 10, 1, -3)[1]).toBeLessThan(-0.1);
  });
  it('never rolls its eyes right out of its head', () => {
    for (const x of [-100, 0, 100]) for (const z of [-3, 0, 50]) for (const v of eyesToward(10, 2, x, z, -3)) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });
});

describe("a pirate's eyes, where the wardrobe puts them", () => {
  it('has two, or one under an eyepatch, the uncovered one', () => {
    expect(pirateEyes({ body: 'm', patch: false }).map((e) => e.x)).toEqual([PIRATE_EYES.x, -PIRATE_EYES.x]);
    expect(pirateEyes({ body: 'f', patch: true }).map((e) => e.x)).toEqual([PIRATE_EYES.x]);
  });
  it("sits them on the head's front, as js/den-look.js draws it", () => {
    const look = readFileSync(join(ROOT, 'js', 'den-look.js'), 'utf8');
    expect(look).toMatch(/const hr = F \? 0\.235 : 0\.25;/);
    expect(look).toMatch(/const eye = \(x\) => part\([^)]*\), black, x, 0\.95, hr/);
    expect(pirateEyes({ body: 'f' })[0].z).toBe(0.235);
    expect(pirateEyes({ body: 'm' })[0].z).toBe(0.25);
  });
  it('is one piece for any scene: the frame draws them, not a house', () => {
    expect(readFileSync(join(ROOT, 'js', 'den', 'portraits.js'), 'utf8')).toMatch(/export function watching\(/);
    expect(readFileSync(join(ROOT, 'js', 'den', 'gravee-house.js'), 'utf8')).not.toMatch(/CircleGeometry/);
  });
});
