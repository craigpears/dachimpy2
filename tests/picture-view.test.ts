/* The pictures' close view (11 Nov: "needs a 2D version similar to the puzzles, so you can go through the
   portraits easily with keyboard controls"). */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pictureKey, startAt, browse, counter } from '../src/picture-view';
import type { Picture } from '../src/picture-view';
import { allPortraits, galleryHang } from '../src/den-gravee';

const ROW: Picture[] = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, title: id.toUpperCase(), x: i * 2, z: 0 }));

describe('the pictures, one at a time, flat and big', () => {
  it('go through the portraits with the keys (11 Nov)', () => {
    // Left and Right, or A and D, one at a time, round from the last to the first; Esc (or Tab) back.
    let i = startAt(ROW, null, { x: 2.3, z: 1 });
    expect(ROW[i].id).toBe('b');   // (the one you're nearest)
    i = browse(i, pictureKey('ArrowRight') as 'next', ROW.length);
    expect(ROW[i].id).toBe('c');
    i = browse(i, pictureKey('d') as 'next', ROW.length);
    expect(ROW[i].id).toBe('d');
    i = browse(i, 'next', ROW.length);
    expect(ROW[i].id).toBe('a');   // (round again)
    i = browse(i, pictureKey('a') as 'prev', ROW.length);
    expect(ROW[i].id).toBe('d');
    expect(pictureKey('ArrowLeft')).toBe('prev');
    expect(pictureKey('Escape')).toBe('close');
    expect(pictureKey('Tab')).toBe('close');
    expect(browse(2, 'first', 4)).toBe(0); expect(browse(0, 'last', 4)).toBe(3);
    expect(pictureKey('w')).toBeNull();   // (nothing else does anything)
    expect(counter(1, 4)).toBe('2 of 4');
  });

  it("opens on the one you're looking at, the nearer if it hangs twice", () => {
    expect(startAt(ROW, 'd', { x: 0, z: 0 })).toBe(3);
    const twice = [...ROW, { id: 'b', title: 'B', x: 20, z: 0 }];
    expect(startAt(twice, 'b', { x: 19, z: 0 })).toBe(4);
    expect(startAt(twice, 'nobody', null)).toBe(0);
    expect(startAt([], 'a', null)).toBe(-1);
  });

  it("goes through Gravee's in the order they hang, yours among them once she's painted you", () => {
    const before = allPortraits(false), after = allPortraits(true);
    expect(after.length).toBe(before.length + 1);
    expect(after.map((p) => p.id)).toContain('you');
    expect(before.map((p) => p.id)).not.toContain('you');
    // The hall's, then the gallery's from the hall end, then the Count's.
    const gal = galleryHang().map((p) => p.id);
    expect(before.slice(2, 2 + gal.length).map((p) => p.id)).toEqual(gal);
    expect(before[before.length - 1].id).toBe('vampire');
  });

  it("knows nothing of whose pictures they are (a museum's can use it)", () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'picture-view.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    expect(src).not.toMatch(/gravee|portrait|house/i);
    const view = readFileSync(join(__dirname, '..', 'js', 'den', 'picture-view.js'), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    expect(view).not.toMatch(/gravee|den-gravee|house\.js/i);
  });
});
