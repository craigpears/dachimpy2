/* The tabletop blockade at the table: a round set out on a real board, your ship and its planning pad, a stand-in
   for the other ships until the teaching bots come, and what the page needs to draw (TABLETOP-BLOCKADE.md). Pure: no
   DOM, no 3D, the dice handed in. The rules are src/cade.ts; the page cade-test.html draws on top of this, through
   js/den/cade.js, and reaches into nothing here but what's exported. */
import {
  Cade, buoysOf, influence, planProblem, resolveTurn, tileAt,
  type Board, type Kind, type Move, type Plan, type Seat, type Ship, type Tokens, type TurnLog,
} from './cade.js';
import { cadeBoard, CADE_BOARDS } from './cade-boards.js';

/* ---------- The planning pad: four slots, a move and the guns off each side in each ---------- */

/** An empty plan. */
export const emptyPlan = (): Plan => ({ moves: [null, null, null, null], guns: [[0, 0], [0, 0], [0, 0], [0, 0]] });
const copyPlan = (p: Plan): Plan => ({ moves: [...p.moves], guns: (p.guns ?? emptyPlan().guns!).map(([l, r]) => [l, r] as [number, number]) });

/** Her tokens left once this plan's are taken out: the moves of each kind, and the guns. */
export function left(t: Tokens, p: Plan): { F: number; L: number; R: number; guns: number } {
  const used = (m: Move) => p.moves.filter((x) => x === m).length;
  return { F: t.F.length - used('F'), L: t.L.length - used('L'), R: t.R.length - used('R'),
    guns: t.guns - (p.guns ?? []).reduce((n, [a, b]) => n + a + b, 0) };
}

/** A slot's move left-clicked: on to the next she can play there (none, left, forward, right, round again: a left
 *  first, as in the game; the user, 17 Nov), skipping what she's out of or a move a 3-move ship hasn't room for. */
export function cycleMove(kind: Kind, t: Tokens, p: Plan, slot: number): Plan {
  const order: (Move | null)[] = [null, 'L', 'F', 'R'];
  const at = order.indexOf(p.moves[slot] ?? null);
  for (let i = 1; i <= 4; i++) {
    const q = copyPlan(p);
    q.moves[slot] = order[(at + i) % 4];
    if (!planProblem(kind, t, q)) return q;
  }
  return p;
}

/** A move put straight in a slot (a key or a dragged token), if she can; the plan as it was if not. */
export function setMove(kind: Kind, t: Tokens, p: Plan, slot: number, m: Move | null): Plan {
  const q = copyPlan(p);
  q.moves[slot] = m;
  return planProblem(kind, t, q) ? p : q;
}

/** A slot clicked with a mouse's button, as in the game (the user, 17 Nov: "left mouse is left, and then it cycles
 *  through. Middle mouse is forward, right mouse click is right"): the left button cycles (`cycleMove`), the middle
 *  puts a forward and the right a right, each taking it out again if it's already there. */
export function pressMove(kind: Kind, t: Tokens, p: Plan, slot: number, button: 0 | 1 | 2): Plan {
  if (button === 0) return cycleMove(kind, t, p, slot);
  const m: Move = button === 1 ? 'F' : 'R';
  return setMove(kind, t, p, slot, p.moves[slot] === m ? null : m);
}

/** A slot's guns off one side, one fewer (a right click): none stays none. */
export function dropGun(p: Plan, slot: number, side: 0 | 1): Plan {
  const q = copyPlan(p);
  q.guns![slot][side] = Math.max(0, q.guns![slot][side] - 1);
  return q;
}

/** A slot's guns off one side clicked: one more, up to her guns a side (and what's loaded), then none again. */
export function cycleGuns(kind: Kind, t: Tokens, p: Plan, slot: number, side: 0 | 1): Plan {
  const q = copyPlan(p);
  const g = q.guns![slot];
  g[side] = g[side] + 1;
  if (g[side] > kind.guns || planProblem(kind, t, q)) g[side] = 0;
  return q;
}

/* ---------- Where a plan takes her ---------- */

/** Her plan played with everyone else lying still: each slot's square and heading, after her move and after the
 *  winds, and whether she hit something. What the pad shows on the board as she plans. */
export function preview(b: Board, ships: Ship[], me: number, p: Plan) {
  const copy = ships.filter((s) => !s.sunk).map((s) => ({ ...s }));
  const log = resolveTurn(b, copy, new Map([[me, p]]));
  return log.map((slot) => {
    const t = slot.tracks.get(me)!;
    return { moved: t.moved, to: t.to, stopped: t.stopped ?? t.windStopped, rock: !!t.rock };
  });
}

/* ---------- A stand-in for the other ships ---------- */

const seqs = (() => {
  const all: (Move | null)[][] = [];
  const opts: (Move | null)[] = [null, 'F', 'L', 'R'];
  for (const a of opts) for (const b of opts) for (const c of opts) for (const d of opts) all.push([a, b, c, d]);
  return all;
})();

/** What a square's worth to her: the most a buoy could give over how far it is (a greedy look, no lookahead). */
function pull(b: Board, s: Ship, x: number, y: number): number {
  let best = 0;
  for (const bu of buoysOf(b)) {
    const d = Math.abs(bu.x - x) + Math.abs(bu.y - y);
    best = Math.max(best, bu.points / (1 + d));
  }
  return best;
}

/** A stand-in ship's plan for the turn (not a teaching bot: those come next, TABLETOP-BLOCKADE.md). Every move
 *  sequence she has the tokens for, played with the others lying still: the one ending holding the most points, or
 *  nearest the most, without hitting rocks; then her guns fired in every slot an enemy's in line, as long as they
 *  last ("Shoot! Always shoot!": the user's notes). */
export function standIn(b: Board, ships: Ship[], me: Seat): Plan {
  const others = ships.filter((s) => !s.sunk && s.id !== me.id);
  let best: Plan = emptyPlan(), bestScore = -Infinity;
  for (const moves of seqs) {
    const p: Plan = { moves, guns: emptyPlan().guns };
    if (planProblem(me.kind, me.tokens, p)) continue;
    const mine = { ...me };
    const log = resolveTurn(b, [mine, ...others.map((o) => ({ ...o }))], new Map([[me.id, p]]));
    const rocks = log.filter((sl) => sl.tracks.get(me.id)!.rock).length;
    const held = influence(b, [mine, ...others]).buoys.filter((bu) => bu.holder === me.side).reduce((n, bu) => n + bu.points, 0);
    const score = held * 10 + pull(b, mine, mine.x, mine.y) * 4 - rocks * 3 - moves.filter(Boolean).length * 0.01;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  // Her guns: wherever she'll be each slot, at any enemy in line within three squares.
  const path = preview(b, ships, me.id, best);
  let guns = me.tokens.guns;
  best.guns = path.map(({ to }) => {
    const g: [number, number] = [0, 0];
    if (tileAt(b, to[0], to[1])?.safe) return g;
    for (const [side, turn] of [[0, 3], [1, 1]] as const) {
      const d = (to[2] + turn) % 4, dx = [0, 1, 0, -1][d], dy = [-1, 0, 1, 0][d];
      for (let i = 1; i <= 3; i++) {
        const x = to[0] + dx * i, y = to[1] + dy * i;
        if (!tileAt(b, x, y) || tileAt(b, x, y)!.rock === 'tall') break;
        const o = others.find((s) => s.x === x && s.y === y);
        if (o) { if (o.side !== me.side) { const n = Math.min(me.kind.guns, guns); g[side] = n; guns -= n; } break; }
      }
    }
    return g;
  });
  return best;
}

/* ---------- The table: a round set out, your ship, the rest stand-ins ---------- */

export interface Fleet { kind: string; side: 0 | 1; you?: boolean }
/** The round the page sets out unless told otherwise: you in a war brig with a war frigate and a sloop, against a war
 *  frigate, a war brig and a sloop. */
export const DEFAULT_FLEET: Fleet[] = [
  { kind: 'warBrig', side: 0, you: true }, { kind: 'warFrigate', side: 0 }, { kind: 'sloop', side: 0 },
  { kind: 'warFrigate', side: 1 }, { kind: 'warBrig', side: 1 }, { kind: 'sloop', side: 1 },
];

export interface TableSetup { board?: string; fleet?: Fleet[]; turns?: number; random?: () => number }

/** A round at the table: the rules (`cade`), which ship's yours (`me`), your plan as you make it (`pad`). */
export class Table {
  readonly cade: Cade;
  readonly me: number;
  readonly boardId: string;
  pad: Plan = emptyPlan();
  last: TurnLog | null = null;
  constructor({ board = 'Gallows16_3', fleet = DEFAULT_FLEET, turns = 60, random = Math.random }: TableSetup = {}) {
    this.boardId = CADE_BOARDS[board] ? board : 'Gallows16_3';
    this.cade = new Cade(cadeBoard(this.boardId), turns, random);
    let me = -1;
    for (const f of fleet) { const id = this.cade.add({ kind: f.kind, side: f.side }); if (f.you && me < 0) me = id; }
    this.me = me < 0 ? 0 : me;
  }
  get board() { return this.cade.board; }
  get you() { return this.cade.ship(this.me); }
  /** Your tokens left once the pad's are taken out. */
  get tokensLeft() { return left(this.you.tokens, this.pad); }

  move(slot: number) { this.pad = cycleMove(this.you.kind, this.you.tokens, this.pad, slot); }
  /** A slot clicked with the mouse's left (0), middle (1) or right (2) button. */
  press(slot: number, button: 0 | 1 | 2) { this.pad = pressMove(this.you.kind, this.you.tokens, this.pad, slot, button); }
  /** A gun off one side taken back out (a right click). */
  ungun(slot: number, side: 0 | 1) { this.pad = dropGun(this.pad, slot, side); }
  put(slot: number, m: Move | null) { this.pad = setMove(this.you.kind, this.you.tokens, this.pad, slot, m); }
  gun(slot: number, side: 0 | 1) { this.pad = cycleGuns(this.you.kind, this.you.tokens, this.pad, slot, side); }
  clear() { this.pad = emptyPlan(); }
  /** Where your plan takes you, everyone else lying still. */
  preview() { return preview(this.board, this.cade.ships, this.me, this.pad); }

  /** The turn played: your plan, the stand-ins', all at once. What happened, to draw. */
  sail(): TurnLog {
    for (const s of this.cade.ships) {
      if (s.sunk) continue;
      this.cade.plan(s.id, s.id === this.me ? this.pad : standIn(this.board, this.cade.ships, s));
    }
    this.pad = emptyPlan();
    return (this.last = this.cade.playTurn());
  }
}
