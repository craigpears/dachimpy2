import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// js/den/nav-board.js is hand-written 3D with no tests of its own. When Navigation's drops were slowed on
// 13 Nov, the line that starts each stage (`b.stage = st`) ended up behind a line comment. The queue then
// emptied without anything playing, and the board never moved.
describe('Duty Navigation\'s board', () => {
  it('"everything\'s just stuck at the top, like nothing\'s dropping" (13 Nov): each stage it begins is played', () => {
    const src = readFileSync('js/den/nav-board.js', 'utf8');
    const begin = src.slice(src.indexOf('const begin = (st) =>'), src.indexOf('// Finish a stage'));
    const live = begin.split('\n').map((l) => l.replace(/\/\/.*$/, ''));
    expect(live.some((l) => /\bb\.stage\s*=\s*st\b/.test(l))).toBe(true);
    expect(live.some((l) => /\bb\.T\s*=\s*TIME\[st\.kind\]/.test(l))).toBe(true);
  });
});
