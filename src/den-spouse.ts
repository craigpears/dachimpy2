/* Pirate Den: whoever you marry comes home with you. TypeScript, compiled to js/den-spouse.js; tested in
   tests/den-spouse.test.ts. js/den/spouse.js draws them: aboard her, then at the den.

   The user (11 Nov): "whoever you marry, I think naturally has to jump on the ship with you after you
   leave the Isle to have that continuity and hang out with the Den with you, that sort of thing. It's
   got to carry out into the world." So once a wedding's played through, your sweetheart (Mischievious,
   in the version of her you picked; a suitor; or someone of your own) is your spouse, in their wedding
   look. Leaving the isle by sea they come aboard with you and ride home on her deck; by the cheat,
   they're home straight away. Once she's back at the den and you're ashore, they step off and live at
   the den: strolling about its floor, stopping a while here and there, and turning to you for a word
   when you come up to them. Kept with your save (this browser); a new wedding brings a new spouse.

   What they say is in src/lines/ (hers in mischievious.ts, each suitor's in suitors.ts, someone of your
   own's in spouse.ts). This knows nothing of how anyone's drawn. */
import type { Look, Wedding } from './den-wedding.js';
import { suitors, plainLook } from './den-wedding.js';
import { AT_HOME as HER_HOME } from './lines/mischievious.js';
import { AT_HOME as SUITOR_HOME, SUITORS } from './lines/suitors.js';
import type { SuitorId } from './lines/suitors.js';
import { AT_HOME as OWN_HOME, OF_THEM } from './lines/spouse.js';

/** Your spouse: who they are (her, a suitor, someone of your own), their name, their wedding look, and,
    a suitor, which (their lines) and whether they're bandaged (Barnaby, after his last bride's mishap). */
export interface Spouse {
  kind: 'her' | 'suitor' | 'own';
  name: string;
  look: Look;
  suitor?: SuitorId;
  hurt?: boolean;
  /** Her: which of her portraits' versions you married (its title). */
  title?: string;
}
/** Where they are: still on the isle (just married, you're there too), aboard her, or at the den. */
export type Where = 'isle' | 'aboard' | 'den';

const NAME = /^[A-Za-z0-9 '.-]{1,24}$/;
/** Someone of your own's name, as you gave it (or "your sweetheart"). */
const ownName = (look: Look): string => {
  const n = String(look.name ?? '').trim();
  return NAME.test(n) ? n : 'Your sweetheart';
};

/** Whoever a wedding married you to, in their wedding look: `her` is Mischievious's versions to choose
    from (js/den-look.js's MISCHIEVIOUS_VERSIONS: a title and a look each). Null if nobody's chosen yet. */
export function spouseOf(w: Wedding, her: readonly { title: string; look: Look }[]): Spouse | null {
  const p = w.partner;
  if (!p) return null;
  if (p.kind === 'her') {
    const v = her[p.ver] ?? her[0];
    return { kind: 'her', name: 'Mischievious', look: { ...(v?.look ?? {}) }, ...(v ? { title: v.title } : {}) };
  }
  if (p.kind === 'suitor') {
    const s = suitors(w.tone)[p.i];
    if (!s) return null;
    return { kind: 'suitor', name: s.name, look: { ...s.look }, suitor: s.id, ...(s.hurt ? { hurt: true } : {}) };
  }
  return { kind: 'own', name: ownName(p.look), look: { ...p.look } };
}

/** A spouse from anywhere (this browser's storage) made safe, or null if it isn't one. */
export function cleanSpouse(o: unknown): Spouse | null {
  if (!o || typeof o !== 'object') return null;
  const s = o as Record<string, unknown>, look = plainLook(s.look);
  if (s.kind === 'her') {
    const title = typeof s.title === 'string' && NAME.test(s.title.replace(/[!?]/g, '')) ? s.title : undefined;
    return { kind: 'her', name: 'Mischievious', look, ...(title ? { title } : {}) };
  }
  if (s.kind === 'suitor') {
    const id = s.suitor as SuitorId;
    if (!Object.prototype.hasOwnProperty.call(SUITORS, id)) return null;
    return { kind: 'suitor', name: SUITORS[id].name, look, suitor: id, ...(s.hurt === true ? { hurt: true } : {}) };
  }
  if (s.kind === 'own') return { kind: 'own', name: typeof s.name === 'string' && NAME.test(s.name.trim()) ? s.name.trim() : ownName(look), look };
  return null;
}

/** Their lines at home: coming aboard with you, and at the den. */
export function homeLines(s: Spouse): { aboard: string; den: readonly string[] } {
  if (s.kind === 'her') return HER_HOME;
  if (s.kind === 'suitor' && s.suitor) return SUITOR_HOME[s.suitor];
  return OWN_HOME;
}
/** What's said as they come home with you: aboard (by sea), or home (by the cheat). */
export const homeNews = (s: Spouse, bySea: boolean): string => (bySea ? OF_THEM.aboard : OF_THEM.home).replace('{name}', s.name);

/** Leaving the isle, just married: aboard her with you (by sea), or home (by the cheat). */
export const leaving = (bySea: boolean): Where => (bySea ? 'aboard' : 'den');
/** Where they are now: aboard her, once she's home and you're ashore (not sailing, not on the isle),
    they step off, home for good. */
export function settle(where: Where, at: { sailing: boolean; onIsle: boolean }): Where {
  return where === 'aboard' && !at.sailing && !at.onIsle ? 'den' : where;
}
/** Where they are when the den's opened again (her and the sea start afresh): at the den. */
export const reopened = (): Where => 'den';

// ---------- at the den ----------
/** Where they stand on her deck as she sails (metres, along her from her middle, +x her bow; z across
    her): just aft of her mast, to starboard, clear of you at her tiller and of Umami on her foredeck. */
export const ABOARD = { x: -0.25, z: 0.5 } as const;
/** How they get about the den: walking pace (metres a second), how long they stay put (seconds, least
    and most), how near you come before they stop for a word, how long before they'd say another, and
    how long a line stays up. */
export const STROLL = { WALK: 1.2, STAY: [3, 9] as [number, number], CHAT: 2.0, GAP: 9, SAY: 4.5 } as const;
/** The part of the den floor they keep to (x either side of the middle; z from the wall back). */
export interface Area { x0: number; x1: number; z0: number; z1: number }

/** Your spouse at home: where they are on the den floor, where they're off to, and whether they've
    stopped for you. `free(x, z)` says whether they could stand there (the den knows: its crates, frames,
    stairs and the like). */
export class Stroll {
  x: number;
  z: number;
  to: { x: number; z: number } | null = null;
  /** Seconds before they move on, staying put. */
  wait = 1.5;
  /** Which way they face: an angle as three.js's rotation.y (0 faces +z). */
  yaw = Math.PI;
  /** Stopped for a word with you. */
  chatting = false;

  constructor(readonly area: Area, readonly free: (x: number, z: number) => boolean, readonly random: () => number = Math.random, at?: { x: number; z: number }) {
    const p = at ?? this.pick() ?? { x: (area.x0 + area.x1) / 2, z: (area.z0 + area.z1) / 2 };
    this.x = p.x; this.z = p.z;
  }

  /** Somewhere free in their part of the den, a stroll away with nothing in the way; null if nowhere is. */
  pick(): { x: number; z: number } | null {
    const A = this.area, R = this.random;
    for (let i = 0; i < 16; i++) {
      const x = A.x0 + (A.x1 - A.x0) * R(), z = A.z0 + (A.z1 - A.z0) * R();
      if (this.x === undefined) { if (this.free(x, z)) return { x, z }; continue; }
      if (Math.hypot(x - this.x, z - this.z) >= 1.5 && this.clear(x, z)) return { x, z };
    }
    return null;
  }

  /** Whether they could walk straight there from where they are, nothing in the way. */
  clear(x: number, z: number): boolean {
    const n = Math.ceil(Math.hypot(x - this.x, z - this.z) / 0.25);
    for (let i = 1; i <= n; i++) if (!this.free(this.x + (x - this.x) * i / n, this.z + (z - this.z) * i / n)) return false;
    return true;
  }

  /** Whether they're on their way somewhere. */
  get walking(): boolean { return !!this.to && !this.chatting; }

  /** Time passing: you near, they stop and turn to you; else they stay a while, then stroll on to
      somewhere free (and somewhere else, if something's come in the way). */
  tick(dt: number, you: { x: number; z: number } | null = null): void {
    this.chatting = !!you && Math.hypot(you.x - this.x, you.z - this.z) < STROLL.CHAT;
    if (this.chatting && you) { this.yaw = Math.atan2(you.x - this.x, you.z - this.z); return; }
    if (!this.to) {
      if ((this.wait -= dt) > 0) return;
      this.to = this.pick();
      if (!this.to) { this.wait = 1; return; }
    }
    const dx = this.to.x - this.x, dz = this.to.z - this.z, d = Math.hypot(dx, dz), step = STROLL.WALK * dt;
    if (d > 1e-6) this.yaw = Math.atan2(dx, dz);
    const arrive = () => { this.to = null; const [lo, hi] = STROLL.STAY; this.wait = lo + (hi - lo) * this.random(); };
    if (d <= step) { this.x = this.to.x; this.z = this.to.z; arrive(); return; }
    const nx = this.x + dx / d * step, nz = this.z + dz / d * step;
    if (!this.free(nx, nz)) { this.to = null; this.wait = 0.5; return; }   // (something's come in the way: somewhere else)
    this.x = nx; this.z = nz;
  }
}

/** What they say when you come up to them: a line each time you do (not again within STROLL.GAP
    seconds), in turn, never the same twice running. */
export class Chatter {
  private i = -1;
  private since = Infinity;
  private was = false;
  last = '';
  constructor(readonly lines: readonly string[]) {}
  /** Time passing, and whether you're near: a line the moment you come up to them, else null. */
  tick(dt: number, near: boolean): string | null {
    this.since += dt;
    const come = near && !this.was;
    this.was = near;
    if (!come || this.since < STROLL.GAP || !this.lines.length) return null;
    this.since = 0;
    this.i = (this.i + 1) % this.lines.length;
    return (this.last = this.lines[this.i]);
  }
}
