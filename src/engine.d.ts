/* Types for the main puzzle's engine (js/engine.js, a plain script that sets window.Carp). Only
   what the TypeScript parts use is described here; add to it as more of the engine is needed. */

/** One of the twelve pentominoes, by its standard letter. */
export type Letter = 'P' | 'F' | 'Y' | 'T' | 'N' | 'L' | 'W' | 'U' | 'V' | 'Z' | 'X' | 'I';

/** A square of a board, as [row, column]. */
export type Cell = [number, number];

/** A piece lying somewhere: its letter and the squares it covers. */
export interface Placed {
  letter: Letter;
  cells: Cell[];
}

export interface Box {
  r0: number;
  c0: number;
  r1: number;
  c1: number;
  w: number;
  h: number;
}

export interface Engine {
  /** Draw weights out of TOTAL_WEIGHT (94): P 22, F 14, Y 14 ... X 3, I 2. */
  WEIGHTS: Record<Letter, number>;
  TOTAL_WEIGHT: number;
  LETTERS: Letter[];
  /** Every way each piece can lie (turned and flipped). */
  ORIENTS_BY_LETTER: Record<Letter, Placed[]>;
  /** Up to `limit` exact tilings of the cells, each a list of pieces; [] when there's none. */
  solve(cells: Cell[], limit?: number): Placed[][];
  bbox(cells: Cell[]): Box;
  /** '#' for a square, anything else for none. */
  parseRows(rows: string[]): Cell[];
  normalize(cells: Cell[]): Cell[];
  /** A hole that `size` pieces finish exactly (grown outwards from `core`, if given). */
  genHole(size: number, core?: Cell[]): { hole: Cell[] };
  /** These follow useSeed, so a test can make them repeatable. */
  shuffle<T>(items: T[]): T[];
  pick<T>(items: T[]): T;
  weightedLetter(exclude?: Letter[]): Letter;
  /** Seed the engine's random choices (null: back to Math.random). */
  useSeed(seed: number | null): void;
}
