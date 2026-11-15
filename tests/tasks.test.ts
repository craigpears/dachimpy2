// The task board (tasks/README.md, tools/task.mjs): every card readable, in a stream, with a status the board has a
// column for; the board drawn from them, a script's work and no one else's (the user, 15 Nov: "more deterministic").
import { describe, it, expect } from 'vitest';
// @ts-expect-error: a plain .mjs tool, untyped
import { load, board, parse, format, change, dropIn, triage, update, tidy, resume, plainEnv, busy, STATUSES } from '../tools/task.mjs';
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
  it('what\'s dropped in the inbox is a card at once, its words kept (the user, 15 Nov: "whenever I drop something in it")', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tasks-'));
    try {
      const c = dropIn('The rowing feels slow when you turn. Also an idea: a lighthouse.', dir, new Date(2026, 10, 15, 9, 30, 5));
      expect(c.id).toBe('inbox-20261115-093005');
      const { meta, body } = parse(readFileSync(c.file, 'utf8'));
      expect(meta.status).toBe('inbox');
      expect(body).toContain('a lighthouse');
      expect(() => dropIn('   ', dir)).toThrow();
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('sorting it is a headless Claude allowed only the task script, reading, and editing documents', () => {
    let args: string[] = [], prompt = '';
    const fake = (_cmd: string, a: string[]) => {
      args = a;
      return { on() {}, stdout: { on() {} }, stderr: { on() {} }, stdin: { end: (p: string) => { prompt = p; } } };
    };
    triage({ id: 'inbox-20261115-093005', stream: 'inbox' }, fake);
    expect(args).toContain('-p');
    expect(args[args.indexOf('--allowedTools') + 1]).toBe('Read,Grep,Glob,Edit,Bash(node tools/task.mjs:*)');
    expect(prompt).toContain('tasks/inbox/inbox-20261115-093005.md');
    expect(prompt).toContain('set inbox-20261115-093005 done');
    expect(prompt).not.toContain('{{');
  });
  it('the board lets a card be dragged, or moved from its panel', () => {
    const html: string = board(all);
    const client = readFileSync(join(__dirname, '..', 'tools', 'board-client.js'), 'utf8');
    expect(html).toContain('draggable="true"');
    expect(html).toContain('<script src="../tools/board-client.js">');
    expect(client).toContain('/api/move');
    for (const st of Object.keys(STATUSES)) expect(html).toContain(`class="st" data-status="${st}"`);
  });
  it('a card opens to everything on it, and can be gone through (the user, 15 Nov: "I can\'t click on the card to open it")', () => {
    const html: string = board(all);
    const client = readFileSync(join(__dirname, '..', 'tools', 'board-client.js'), 'utf8');
    // every card's log is on the board, kept for its panel
    for (const c of all.cards) expect(html, c.id).toMatch(new RegExp(`data-id="${c.id}"[^]*?<div class="full" hidden>[^]*?<h4>Log</h4>`));
    expect(html).toContain('class="panel"');
    expect(html).toContain('class="through"');
    expect(client).toMatch(/ArrowRight/);
    expect(client).toContain('/api/update');
  });
  it('its headless Claude runs the real node, not npm\'s shim (15 Nov: every update "did nothing", stopped at an approval prompt)', () => {
    const sep = process.platform === 'win32' ? ';' : ':';
    const env = plainEnv({ Path: ['/repo/node_modules/.bin', '/usr/local/bin'].join(sep), OTHER: 'x' });
    expect(env.Path).toBe('/usr/local/bin');
    expect(env.OTHER).toBe('x');
    const script = readFileSync(join(__dirname, '..', 'tools', 'task.mjs'), 'utf8');
    expect(script).toMatch(/run\('claude', \[[^\]]*\], \{[^}]*env: plainEnv\(\)/);
  });
  it('what was left unanswered when the server stopped is picked up when it starts again', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tasks-'));
    try {
      mkdirSync(join(dir, 'den'));
      writeFileSync(join(dir, 'den', 'said.md'), format({ title: 'Said', status: 'idea' }, '\nA.\n\n## Log\n\n- 9 Nov: added.\n- 15 Nov: you said: "this is done"\n'));
      writeFileSync(join(dir, 'den', 'answered.md'), format({ title: 'Answered', status: 'done' }, '\nB.\n\n## Log\n\n- 15 Nov: you said: "done"\n- 15 Nov: done: as said\n'));
      const prompts: string[] = [];
      const closers: Array<(code: number) => void> = [];
      const fake = () => ({ on(ev: string, f: any) { if (ev === 'close') closers.push(f); }, stdout: { on() {} }, stderr: { on() {} }, stdin: { end: (p: string) => { prompts.push(p); } } });
      writeFileSync(join(dir, 'den', 'failed.md'), format({ title: 'Failed', status: 'idea' }, '\nC.\n\n## Log\n\n- 15 Nov: you said: "tidy it"\n- 15 Nov: acting on it did nothing: approve node?\n'));
      writeFileSync(join(dir, 'den', 'twice.md'), format({ title: 'Twice', status: 'idea' }, '\nD.\n\n## Log\n\n- 15 Nov: you said: "tidy it"\n- 15 Nov: acting on it did nothing: x\n- 15 Nov: acting on it did nothing: y\n'));
      expect(resume(fake, dir).sort()).toEqual(['failed', 'said']);
      expect(prompts.some((p) => p.includes('> this is done'))).toBe(true);
      closers.forEach((f) => f(1)); // the runs finish (failed), freeing their places
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('a card tidied up: its text rewritten, its log kept (the user, 15 Nov: "can you tidy this idea card up just so it\'s a bit more concise")', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tasks-'));
    try {
      mkdirSync(join(dir, 'den'));
      writeFileSync(join(dir, 'den', 'boat.md'), format({ title: 'Boat', status: 'idea' }, '\nA long ramble.\n\n## Log\n\n- 9 Nov: added.\n'));
      tidy(load(dir).cards, 'boat', 'Row home in a little boat.\n\n- short');
      const { meta, body } = parse(readFileSync(join(dir, 'den', 'boat.md'), 'utf8'));
      expect(meta.status).toBe('idea');
      expect(body).not.toContain('ramble');
      expect(body).toMatch(/^\nRow home in a little boat\.\n\n- short\n\n## Log\n\n- 9 Nov: added\.\n- .*: tidied up/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('a brain-dump dictated, and dropped in with a card open (the user, 15 Nov: "I should be able to brain dump while I\'ve got this side task open")', () => {
    const html: string = board(all);
    const client = readFileSync(join(__dirname, '..', 'tools', 'board-client.js'), 'utf8');
    expect(html).toContain('class="mic" data-for="inbox"');
    expect(html).toContain('class="mic" data-for="card"');
    expect(html).toContain('class="toinbox"');
    expect(html).toMatch(/body\.reading \{ padding-right/);
    expect(client).toContain("classList.add('reading')");
  });
  it('what\'s said about a card is logged on it at once, then a headless Claude acts on it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tasks-'));
    try {
      mkdirSync(join(dir, 'den'));
      writeFileSync(join(dir, 'den', 'raids.md'), format({ title: 'Raids', status: 'playtest' }, '\nWhat was asked.\n\n## Log\n\n- 9 Nov: added.\n'));
      let prompt = '';
      const fake = () => ({ on() {}, stdout: { on() {} }, stderr: { on() {} }, stdin: { end: (p: string) => { prompt = p; } } });
      const c = update(load(dir).cards, 'raids', '  That works now,\n  done. ', fake);
      expect(parse(readFileSync(c.file, 'utf8')).body).toContain(': you said: "That works now, done."');
      expect(prompt).toContain('> That works now, done.');
      expect(prompt).toContain('set raids <status>');
      expect(prompt).not.toContain('{{');
      expect(busy.has('raids')).toBe(true);
      expect(() => update(load(dir).cards, 'raids', ' ', fake)).toThrow();
      busy.delete('raids');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
