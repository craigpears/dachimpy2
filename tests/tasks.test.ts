// The task board (tasks/README.md, tools/task.mjs): every card readable, in a stream, with a status the board has a
// column for; the board drawn from them, a script's work and no one else's (the user, 15 Nov: "more deterministic").
import { describe, it, expect } from 'vitest';
// @ts-expect-error: a plain .mjs tool, untyped
import { load, board, parse, format, change, STATUSES } from '../tools/task.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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
  it('nothing parked, and no TODO.md beside the cards (the user, 15 Nov: "It should just be all these little files")', () => {
    expect(Object.keys(STATUSES)).not.toContain('parked');
    expect(existsSync(join(__dirname, '..', 'TODO.md'))).toBe(false);
  });
  it('a card dragged to another column is a set: its status changed and logged', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tasks-'));
    try {
      mkdirSync(join(dir, 'den'));
      writeFileSync(join(dir, 'den', 'raids.md'), format({ title: 'Raids', status: 'asked' }, '\nWhat was asked.\n\n## Log\n\n- 9 Nov: added.\n'));
      change(load(dir).cards, 'raids', 'done', { note: 'moved on the board' });
      const { meta, body } = parse(readFileSync(join(dir, 'den', 'raids.md'), 'utf8'));
      expect(meta.status).toBe('done');
      expect(body).toMatch(/: done: moved on the board/);
      expect(() => change(load(dir).cards, 'raids', 'parked')).toThrow();
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('the board lets a card be dragged, or moved from its menu', () => {
    const html: string = board(all);
    expect(html).toContain('draggable="true"');
    expect(html).toContain('/api/move');
    for (const st of Object.keys(STATUSES)) expect(html).toContain(`<option value="${st}"`);
  });
});
