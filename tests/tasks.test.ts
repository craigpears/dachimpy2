// The task board (tasks/README.md, tools/task.mjs): every card readable, in a stream, with a status the board has a
// column for; the board drawn from them, a script's work and no one else's (the user, 15 Nov: "more deterministic").
import { describe, it, expect } from 'vitest';
// @ts-expect-error: a plain .mjs tool, untyped
import { load, board, parse, format, STATUSES } from '../tools/task.mjs';

const all = load();

describe('the task board (the user, 14 Nov: "a clear list of things and what their status is")', () => {
  it('every card has a title and a status the board has a column for', () => {
    expect(all.cards.length).toBeGreaterThan(0);
    for (const c of all.cards) {
      expect(c.meta.title, c.id).toBeTruthy();
      expect(Object.keys(STATUSES), c.id).toContain(c.meta.status);
    }
  });
  it('every stream has its name and where it got to', () => {
    for (const s of all.streams) {
      expect(s.name, s.id).toBeTruthy();
      expect(s.where, s.id).toBeTruthy();
    }
  });
  it('a card reads back as it was written', () => {
    const meta = { title: 'A card', status: 'ready', link: 'den.html?at=x&as=dachimpy' };
    expect(parse(format(meta, '\nWhat was asked.\n'))).toEqual({ meta, body: '\nWhat was asked.\n' });
  });
  it('the board shows every card, in its column', () => {
    const html: string = board(all, new Date(2026, 10, 15, 9, 0));
    for (const c of all.cards) expect(html).toContain(`<code>${c.id}</code>`);
    for (const label of Object.values(STATUSES) as string[]) expect(html).toContain(label);
  });
});
