/* A tutorial's shape, the same for every puzzle (TUTORIALS.md; RULES.md, "Every tutorial has the same shape, and you
   can jump in anywhere", 14 Nov). TypeScript, compiled to js/tutorial.js; tested in tests/tutorial.test.ts. Knows
   nothing of any puzzle, teacher or page: each puzzle fills in one description (`Tutorial`: its basics, its phases,
   its tricks, its scenarios, and its teacher's opening choice), and every tutorial gets from it
   - the read guide's sticky nav (`navFor`, `spy`), drawn by the hand-written js/tutorial-nav.js;
   - the animated lesson's opening choice in the teacher's voice, then that part's scenarios or single tricks to pick
     from (`TutorialMenu`, keyboard and touch), drawn by the hand-written js/tutorial-choice.js; what's picked is
     played as a short lesson on a real board by the puzzle's own lesson, from the part's `shows`.

   The user (14 Nov): "whatever structure we come up with ... should be a standard generic thing. Like ... jump to
   this, let me show you this trick. Let me show you this phase. Like, those are general concepts that we'll cover
   across all puzzles." And of the animated lesson: not a chatbot ("they kind of annoy me"), but "Would you like me to
   start you [with] the basics? Would you like help with the early or mid game? Are you trying to get your CC
   higher?"; then "a drop down of like, here are the scenario[s] ... Are you wanting the individual tricks?".

   Pure: no DOM, no clock, no randomness. */

/** A tutorial's four parts, in the order they're met. */
export const SECTIONS = ['basics', 'phases', 'tricks', 'scenarios'] as const;
export type Section = typeof SECTIONS[number];

/** What shows a part: a board to look at, or moves played on a board. `ref` is the puzzle's own key (one of its
    boards, a routine, a position a bot reached), read only by the puzzle: this module never draws a board. */
export interface Shows { kind: 'board' | 'moves'; ref: string }

/** A part of a tutorial: a basic, a phase, a trick or a scenario. */
export interface Part {
  /** Unique in its tutorial: how the lesson's menu, a link and the tests name it. */
  id: string;
  /** Its name, as the guide's heading says it. */
  title: string;
  /** What it is, one line in plain words. */
  line: string;
  /** What shows it. */
  shows: Shows;
  /** A trick's or a scenario's phase (a phase's id): where it's met in a game. None: any time. */
  phase?: string;
  /** Its place on the read guide, when that isn't its id. */
  anchor?: string;
  /** A short tag beside it (the first target that needs it: "CC^5"). */
  tag?: string;
  /** Not ready yet, and what's left (a description written ahead of its puzzle): left out of the nav and the menu. */
  todo?: string;
}

/** One of the teacher's opening questions. */
export interface Choice {
  id: string;
  /** Its button, in the player's words, short: "The basics". */
  label: string;
  /** The teacher asking it, in their voice: "Start you with the basics?" */
  asks: string;
  /** The teacher once it's picked, over its list: "The basics, then. Which bit?" */
  then: string;
  /** What it covers: a section's name (all of it), a phase's id (the phase, and every trick and scenario met in it),
      or any part's id. */
  covers: readonly string[];
}

/** The words round the menu and the nav that aren't the teacher's: generic, a page's own (a description may
    change them). */
export interface Words {
  /** Each section's name, as a heading, a tab and a nav button. */
  titles: Readonly<Record<Section, string>>;
  /** A trick or scenario with no phase, grouped under this. */
  anyTime: string;
  back: string;
  close: string;
}
export const WORDS: Words = {
  titles: { basics: 'The basics', phases: 'The phases', tricks: 'The tricks', scenarios: 'Scenarios' },
  anyTime: 'Any time',
  back: 'Back',
  close: 'Not now',
};

/** A puzzle's tutorial, described: the one thing each puzzle fills in. */
export interface Tutorial {
  /** The puzzle's name ("Distilling") and its teacher's ("Helium"). */
  puzzle: string;
  teacher: string;
  basics: readonly Part[];
  phases: readonly Part[];
  tricks: readonly Part[];
  scenarios: readonly Part[];
  /** The opening choice, in order. */
  choices: readonly Choice[];
  /** The teacher's opening line: by default `hello`, then their questions one after another (those with something
      ready to show). */
  opening?: string;
  hello?: string;
  /** Each section's place on the read guide (its heading's id); by default the section's name. */
  anchors?: Partial<Record<Section, string>>;
  /** The page's own words, where they differ (WORDS). */
  words?: Partial<Omit<Words, 'titles'>> & { titles?: Partial<Record<Section, string>> };
}

/** A tutorial's words: its own, else WORDS. */
export function wordsOf(t: Tutorial): Words {
  return { ...WORDS, ...t.words, titles: { ...WORDS.titles, ...t.words?.titles } };
}

/** Whether a part's ready to show (no `todo`). */
export const ready = (p: Part): boolean => !p.todo;
/** A section's parts, ready ones only unless `all`. */
export const partsOf = (t: Tutorial, s: Section, all = false): readonly Part[] => (all ? t[s] : t[s].filter(ready));
/** A part by its id, and its section; null if there's none. */
export function findPart(t: Tutorial, id: string): { part: Part; section: Section } | null {
  for (const section of SECTIONS) {
    const part = t[section].find((p) => p.id === id);
    if (part) return { part, section };
  }
  return null;
}
/** A part's place on the read guide. */
export const anchorOf = (p: Part): string => p.anchor ?? p.id;
/** A section's place on the read guide. */
export const sectionAnchor = (t: Tutorial, s: Section): string => t.anchors?.[s] ?? s;

// ---------------------------------------------------------------- what a choice covers

/** What a choice covers, the ready parts only, each section's in the description's order: its basics, its phases,
    its scenarios, its tricks (scenarios before tricks: "here are the scenarios ... Are you wanting the individual
    tricks?"). Sections with nothing in them are left out. */
export const LIST_ORDER: readonly Section[] = ['basics', 'phases', 'scenarios', 'tricks'];
export interface List { section: Section; title: string; parts: readonly Part[] }
export function covered(t: Tutorial, c: Choice): List[] {
  const ids = new Set<string>();
  const phaseIds = new Set(t.phases.map((p) => p.id));
  for (const id of c.covers) {
    if ((SECTIONS as readonly string[]).includes(id)) for (const p of t[id as Section]) ids.add(p.id);
    else if (phaseIds.has(id)) {
      ids.add(id);
      for (const p of [...t.tricks, ...t.scenarios]) if (p.phase === id) ids.add(p.id);
    } else ids.add(id);
  }
  const titles = wordsOf(t).titles;
  return LIST_ORDER.map((section) => ({ section, title: titles[section], parts: partsOf(t, section).filter((p) => ids.has(p.id)) })).filter((l) => l.parts.length > 0);
}
/** The choices with something ready to show. */
export const choicesOf = (t: Tutorial): Choice[] => t.choices.filter((c) => covered(t, c).length > 0);
/** The teacher's opening line: theirs, or their hello and their questions (the ones with something to show). */
export const openingOf = (t: Tutorial): string => t.opening ?? [t.hello, ...choicesOf(t).map((c) => c.asks)].filter(Boolean).join(' ');

// ---------------------------------------------------------------- what's wrong with a description

/** What's wrong with a description, in plain words (none, and it's sound): every id unique, every part named, in a
    line, and shown; every trick and scenario in a phase there is; every choice covering things there are; every
    ready part reachable from a choice (nothing in the lesson you can't get to). */
export function problems(t: Tutorial): string[] {
  const out: string[] = [];
  const all = SECTIONS.flatMap((s) => t[s].map((part) => ({ s, part })));
  const seen = new Map<string, Section>();
  for (const { s, part } of all) {
    if (seen.has(part.id)) out.push(`${part.id}: in ${seen.get(part.id)} and ${s}`);
    seen.set(part.id, s);
    if (!part.title.trim()) out.push(`${part.id}: no title`);
    if (!part.line.trim() || /\n/.test(part.line)) out.push(`${part.id}: its line wants to be one line`);
    if (!part.shows.ref.trim()) out.push(`${part.id}: nothing shows it`);
    if (part.phase !== undefined && (s === 'basics' || s === 'phases')) out.push(`${part.id}: only tricks and scenarios have a phase`);
    if (part.phase !== undefined && !t.phases.some((p) => p.id === part.phase)) out.push(`${part.id}: no phase ${part.phase}`);
  }
  const anchors = new Map<string, string>();
  for (const { part } of all) {
    const a = anchorOf(part);
    if (anchors.has(a)) out.push(`${part.id}: its place on the guide, #${a}, is ${anchors.get(a)}'s too`);
    anchors.set(a, part.id);
  }
  const choiceIds = new Set<string>();
  for (const c of t.choices) {
    if (choiceIds.has(c.id)) out.push(`choice ${c.id}: twice`);
    choiceIds.add(c.id);
    if (!c.label.trim() || !c.asks.trim() || !c.then.trim()) out.push(`choice ${c.id}: wants a label, a question and a line once it's picked`);
    if (!c.covers.length) out.push(`choice ${c.id}: covers nothing`);
    for (const id of c.covers) if (!(SECTIONS as readonly string[]).includes(id) && !seen.has(id)) out.push(`choice ${c.id}: covers ${id}, which isn't there`);
  }
  const reached = new Set(t.choices.flatMap((c) => covered(t, c).flatMap((l) => l.parts.map((p) => p.id))));
  for (const { part } of all) if (ready(part) && !reached.has(part.id)) out.push(`${part.id}: no choice reaches it`);
  return out;
}

// ---------------------------------------------------------------- the read guide's sticky nav

export interface NavLink { id: string; title: string; href: string; tag?: string }
/** A run of links under a phase's name (`phase` null: those met any time). */
export interface NavRun { phase: NavLink | null; links: NavLink[] }
/** A section of the nav: its button, and its links, in runs by phase (the basics and the phases one run). */
export interface NavGroup { section: Section; title: string; href: string; runs: NavRun[] }

const link = (p: Part): NavLink => ({ id: p.id, title: p.title, href: `#${anchorOf(p)}`, ...(p.tag ? { tag: p.tag } : {}) });
/** The read guide's nav, from the description: a button a section, each with its links; the tricks and the scenarios
    in runs under their phases, in the phases' order, those met any time first. Ready parts only. Sections with
    nothing ready are left out. */
export function navFor(t: Tutorial): NavGroup[] {
  const titles = wordsOf(t).titles, phases = partsOf(t, 'phases');
  return SECTIONS.map((section): NavGroup => {
    const parts = partsOf(t, section);
    let runs: NavRun[];
    if (section === 'basics' || section === 'phases') runs = [{ phase: null, links: parts.map(link) }];
    else {
      runs = [{ phase: null, links: parts.filter((p) => !p.phase || !phases.some((q) => q.id === p.phase)).map(link) },
        ...phases.map((ph) => ({ phase: link(ph), links: parts.filter((p) => p.phase === ph.id).map(link) }))];
    }
    return { section, title: titles[section], href: `#${sectionAnchor(t, section)}`, runs: runs.filter((r) => r.links.length > 0) };
  }).filter((g) => g.runs.length > 0);
}

/** Where you are on a page, for the nav to light: the last of `marks` (each a place's id and how far down the page
    its top is) at or above `y` (how far down you've read: the scroll, plus the sticky bar's height and a little).
    The marks in any order; null above the first. */
export function spy(marks: readonly { id: string; top: number }[], y: number): string | null {
  let best: { id: string; top: number } | null = null;
  for (const m of marks) if (m.top <= y && (!best || m.top >= best.top)) best = m;
  return best?.id ?? null;
}
/** The section a part's in, for the nav's buttons: the section, or null for none. */
export const sectionOf = (t: Tutorial, id: string): Section | null => findPart(t, id)?.section ?? null;

// ---------------------------------------------------------------- the lesson's opening choice

/** What the menu does: play a part on a real board (the puzzle's lesson does it, from `part.shows`), or shut. */
export type MenuEvent = { kind: 'play'; part: Part; section: Section; choice: string | null } | { kind: 'close' };
/** What a key did: nothing (not the menu's key: let it through), or it was the menu's (and perhaps an event). */
export type KeyResult = { handled: false } | { handled: true; event?: MenuEvent };
/** A row of the menu: a choice's button, or a part's (its title, its line, its tag). */
export interface MenuItem { id: string; label: string; line?: string; tag?: string }
/** The menu as it stands, to draw: the teacher's line, the tabs (a list's sections, when it has more than one), the
    rows, which is focused, and whether there's a level to go back to. */
export interface MenuView {
  level: 'choose' | 'list';
  teacher: string;
  says: string;
  choice: string | null;
  tabs: { section: Section; title: string; on: boolean }[];
  items: MenuItem[];
  focus: number;
  back: boolean;
  words: Words;
}

/** The keys the menu takes (KeyboardEvent.key, lower case): up and down the rows (W and S too, as on the den's
    boards), across the tabs, pick, back. A digit picks its row. */
export const MENU_KEYS: Readonly<Record<string, 'up' | 'down' | 'left' | 'right' | 'first' | 'last' | 'pick' | 'back'>> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
  home: 'first', end: 'last', enter: 'pick', ' ': 'pick', escape: 'back', backspace: 'back',
};

/** The opening choice, then a choice's list (see the top of this file): a model a page or a 3D scene draws, the
    keys and taps both going through it. Opens on the choice, or straight on a choice's list (`open`), or straight
    on a part (`play`). */
export class TutorialMenu {
  readonly t: Tutorial;
  private level: 'choose' | 'list' = 'choose';
  private choice: Choice | null = null;
  private tab = 0;
  private focus = 0;
  constructor(t: Tutorial) { this.t = t; }

  private lists(): List[] { return this.choice ? covered(this.t, this.choice) : []; }
  private items(): MenuItem[] {
    if (this.level === 'choose') return choicesOf(this.t).map((c) => ({ id: c.id, label: c.label }));
    const l = this.lists()[this.tab];
    return l ? l.parts.map((p) => ({ id: p.id, label: p.title, line: p.line, ...(p.tag ? { tag: p.tag } : {}) })) : [];
  }

  view(): MenuView {
    const words = wordsOf(this.t), lists = this.lists();
    return {
      level: this.level, teacher: this.t.teacher, says: this.level === 'choose' ? openingOf(this.t) : this.choice!.then, choice: this.choice?.id ?? null,
      tabs: this.level === 'list' && lists.length > 1 ? lists.map((l, i) => ({ section: l.section, title: l.title, on: i === this.tab })) : [],
      items: this.items(), focus: this.focus, back: this.level === 'list', words,
    };
  }

  /** Back to the opening choice. */
  reset(): void { this.level = 'choose'; this.choice = null; this.tab = 0; this.focus = 0; }
  /** Straight to a choice's list (a link's, or a teacher's own suggestion); false if there's no such choice. */
  open(choiceId: string): boolean {
    const c = choicesOf(this.t).find((x) => x.id === choiceId);
    if (!c) return false;
    this.level = 'list'; this.choice = c; this.tab = 0; this.focus = 0;
    return true;
  }
  /** Straight to a part (a "show me this" link from the read guide): its play event, or null if it's not there or
      not ready. */
  play(id: string): MenuEvent | null {
    const f = findPart(this.t, id);
    return f && ready(f.part) ? { kind: 'play', part: f.part, section: f.section, choice: null } : null;
  }

  /** A row tapped or clicked (or its digit): a choice opens its list; a part plays. */
  tap(i: number): MenuEvent | null {
    const items = this.items();
    if (i < 0 || i >= items.length) return null;
    this.focus = i;
    if (this.level === 'choose') { this.open(items[i].id); return null; }
    const l = this.lists()[this.tab], part = l.parts[i];
    return { kind: 'play', part, section: l.section, choice: this.choice!.id };
  }
  /** A tab tapped. */
  tapTab(section: Section): void {
    const i = this.lists().findIndex((l) => l.section === section);
    if (i >= 0 && i !== this.tab) { this.tab = i; this.focus = 0; }
  }
  /** Back a level: from a list to the opening choice; from the opening choice, shut. */
  back(): MenuEvent | null {
    if (this.level === 'list') { this.reset(); return null; }
    return { kind: 'close' };
  }

  /** A key (KeyboardEvent.key): see MENU_KEYS. */
  key(key: string): KeyResult {
    const k = key.toLowerCase(), n = this.items().length;
    if (/^[1-9]$/.test(k)) {
      const i = Number(k) - 1;
      if (i >= n) return { handled: false };
      const event = this.tap(i);
      return event ? { handled: true, event } : { handled: true };
    }
    const m = MENU_KEYS[k];
    if (!m) return { handled: false };
    if (m === 'up' || m === 'down') { if (n) this.focus = (this.focus + (m === 'up' ? n - 1 : 1)) % n; return { handled: true }; }
    if (m === 'first' || m === 'last') { this.focus = m === 'first' ? 0 : Math.max(0, n - 1); return { handled: true }; }
    if (m === 'left' || m === 'right') {
      const lists = this.lists();
      if (this.level !== 'list' || lists.length < 2) return { handled: this.level === 'list' };
      this.tab = (this.tab + (m === 'left' ? lists.length - 1 : 1)) % lists.length; this.focus = 0;
      return { handled: true };
    }
    if (m === 'pick') { const event = this.tap(this.focus); return event ? { handled: true, event } : { handled: true }; }
    const event = this.back();
    return event ? { handled: true, event } : { handled: true };
  }
}
