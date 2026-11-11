/* Pirate Den: how Swordfight looks. TypeScript, compiled to js/den-sword-draw.js. Paints what goes on
   the crates of the armoury stack (den.js builds the crates themselves in 3D).

   Since 8 Nov the board is a stack of weapon crates under a hoist, not a picture on a sign (the
   user, of the sign: "it just feels like it's been forced in. There's nothing natural looking about
   it"). In the spirit of the real puzzle's pieces (drawn fresh here, not copied): every colour has
   its own sword. Red a dagger with a skull for a pommel, yellow a broadsword, green a machete, blue
   a broad scimitar with a hand guard, the last three with cord-bound grips (checked against
   YPPedia's Sword_pieces picture, 11 Nov). A block is a crate of that colour with its sword stencilled on; a
   breaker is the sword itself, bare and glowing; a fused block is a big chest with one big sword;
   attack blocks are crates nailed shut with iron bands. */

import type { Colour } from './swordfight.js';

type Ctx = CanvasRenderingContext2D;

/** Each colour's base, highlight and shadow. */
export const PALETTE: Record<Colour, { base: string; light: string; dark: string }> = {
  0: { base: '#cf2418', light: '#ff7a5c', dark: '#5e0905' },
  1: { base: '#ecc810', light: '#fff07c', dark: '#6e5600' },   // (a lemon yellow, as the real one: on the crates' cream wood, not orange)
  2: { base: '#2c9a1c', light: '#93ef6c', dark: '#0d4408' },
  3: { base: '#2b6bd6', light: '#8cc4ff', dark: '#0b2c6a' },
};

/** A colour's sword, point down, filling the box (X, Y, w, h). `fill` null draws only the outline. */
export function drawSword(x: Ctx, c: Colour, X: number, Y: number, w: number, h: number, fill: string | CanvasGradient | null, line: string): void {
  const p = (u: number, v: number): [number, number] => [X + u * w, Y + v * h];
  x.save();
  x.lineJoin = 'round';
  x.lineCap = 'round';
  x.lineWidth = Math.max(1, w * 0.05);
  x.strokeStyle = line;
  const paint = () => { if (fill) { x.fillStyle = fill; x.fill(); } x.stroke(); };
  const poly = (pts: [number, number][]) => { x.beginPath(); pts.forEach(([u, v], i) => (i ? x.lineTo(...p(u, v)) : x.moveTo(...p(u, v)))); x.closePath(); paint(); };
  const rect = (u0: number, v0: number, u1: number, v1: number) => poly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
  const bar = (u0: number, v0: number, u1: number, v1: number, t: number) => {
    // A thick rounded stroke, outlined: the outline drawn wide, then the fill narrower on top.
    x.beginPath(); x.moveTo(...p(u0, v0)); x.lineTo(...p(u1, v1));
    x.lineWidth = t * w + x.lineWidth * 2; x.strokeStyle = line; x.stroke();
    if (fill) { x.lineWidth = t * w; x.strokeStyle = fill as string; x.stroke(); }
    x.lineWidth = Math.max(1, w * 0.05); x.strokeStyle = line;
  };
  // A grip bound round with cord, as the real swords' are: bands across it.
  const bands = (u0: number, u1: number, vs: number[]) => { x.beginPath(); for (const v of vs) { x.moveTo(...p(u0, v)); x.lineTo(...p(u1, v)); } x.stroke(); };
  switch (c) {
    case 0: {
      // The skull dagger: a straight tapering blade, crossed bones for a guard, a skull on top.
      poly([[0.41, 0.42], [0.59, 0.42], [0.57, 0.78], [0.5, 0.97], [0.43, 0.78]]);
      rect(0.45, 0.25, 0.55, 0.42);
      bar(0.24, 0.31, 0.76, 0.43, 0.08);
      bar(0.24, 0.43, 0.76, 0.31, 0.08);
      x.beginPath(); x.ellipse(...p(0.5, 0.13), w * 0.17, h * 0.11, 0, 0, Math.PI * 2); paint();
      rect(0.43, 0.2, 0.57, 0.26);
      x.fillStyle = line;
      for (const u of [0.43, 0.57]) { x.beginPath(); x.arc(...p(u, 0.13), w * 0.045, 0, Math.PI * 2); x.fill(); }
      break;
    }
    case 1: {
      // The broadsword: wide and straight, a flat pommel, a long bar of a guard.
      rect(0.37, 0.03, 0.63, 0.09);
      rect(0.44, 0.09, 0.56, 0.27);
      bands(0.44, 0.56, [0.14, 0.18, 0.22]);
      rect(0.18, 0.27, 0.82, 0.34);
      poly([[0.35, 0.34], [0.65, 0.34], [0.63, 0.82], [0.5, 0.97], [0.37, 0.82]]);
      x.beginPath(); x.moveTo(...p(0.5, 0.38)); x.lineTo(...p(0.5, 0.82)); x.stroke();
      break;
    }
    case 2: {
      // The machete: a blade that swells to one side, a guard with turned-down ends.
      x.beginPath(); x.arc(...p(0.5, 0.06), w * 0.06, 0, Math.PI * 2); paint();
      rect(0.44, 0.08, 0.56, 0.27);
      bands(0.44, 0.56, [0.13, 0.18, 0.23]);
      poly([[0.2, 0.33], [0.25, 0.27], [0.75, 0.27], [0.8, 0.33], [0.74, 0.33], [0.7, 0.31], [0.3, 0.31], [0.26, 0.33]]);
      x.beginPath();
      x.moveTo(...p(0.42, 0.31)); x.lineTo(...p(0.58, 0.31));
      x.quadraticCurveTo(...p(0.74, 0.6), ...p(0.62, 0.8));
      x.lineTo(...p(0.45, 0.97));
      x.quadraticCurveTo(...p(0.47, 0.64), ...p(0.42, 0.31));
      x.closePath(); paint();
      break;
    }
    default: {
      // The sabre: a curving blade, and a guard sweeping up round the hand to the pommel.
      x.beginPath(); x.moveTo(...p(0.7, 0.3)); x.quadraticCurveTo(...p(0.92, 0.1), ...p(0.54, 0.05));
      const lw = x.lineWidth;
      x.lineWidth = w * 0.11; x.stroke(); if (fill) { x.lineWidth = w * 0.05; x.strokeStyle = fill as string; x.stroke(); }
      x.lineWidth = lw; x.strokeStyle = line;
      rect(0.44, 0.06, 0.56, 0.28);
      bands(0.44, 0.56, [0.12, 0.17, 0.22]);
      x.beginPath(); x.ellipse(...p(0.5, 0.3), w * 0.22, h * 0.035, 0, 0, Math.PI * 2); paint();
      // The blade broad, as a scimitar's, swelling out and curving back to its point.
      x.beginPath();
      x.moveTo(...p(0.43, 0.32)); x.lineTo(...p(0.57, 0.32));
      x.quadraticCurveTo(...p(0.84, 0.62), ...p(0.36, 0.97));
      x.quadraticCurveTo(...p(0.54, 0.64), ...p(0.43, 0.32));
      x.closePath(); paint();
      break;
    }
  }
  x.restore();
}

/** A breaker: the sword alone, bright, outlined dark. */
export function drawBreaker(x: Ctx, c: Colour, X: number, Y: number, s: number): void {
  const pal = PALETTE[c], g = x.createLinearGradient(X, Y, X + s, Y + s);
  g.addColorStop(0, pal.light); g.addColorStop(0.6, pal.base); g.addColorStop(1, pal.dark);
  // A glow behind it, so a breaker stands out among the blocks.
  const glow = x.createRadialGradient(X + s / 2, Y + s / 2, 0, X + s / 2, Y + s / 2, s * 0.62);
  glow.addColorStop(0, `${pal.light}88`); glow.addColorStop(1, `${pal.light}00`);
  x.fillStyle = glow; x.fillRect(X, Y, s, s);
  drawSword(x, c, X + s * 0.02, Y + s * 0.01, s * 0.96, s * 0.98, g, '#140d08');
}

/** A crate's front: its colour's sword stencilled on in paint, on a clear canvas to lay over the
    wood. `faded`: an attack crate turning back, its paint dulled under the bands. */
export function drawStencil(cv: HTMLCanvasElement, c: Colour, faded = false): void {
  const x = cv.getContext('2d')!, s = cv.width, pal = PALETTE[c];
  x.clearRect(0, 0, s, cv.height);
  x.globalAlpha = faded ? 0.45 : 1;
  const g = x.createLinearGradient(0, 0, s, s);
  g.addColorStop(0, '#fff8e6'); g.addColorStop(0.5, pal.light); g.addColorStop(1, pal.base);
  drawSword(x, c, s * 0.2, s * 0.06, s * 0.6, s * 0.88, g, pal.dark);
  x.globalAlpha = 1;
}

/** A breaker: the bare sword, glowing, on a clear canvas. */
export function drawBlade(cv: HTMLCanvasElement, c: Colour): void {
  const x = cv.getContext('2d')!;
  x.clearRect(0, 0, cv.width, cv.height);
  drawBreaker(x, c, 0, 0, cv.width);
}
