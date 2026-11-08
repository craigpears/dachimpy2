/* Pirate Den: how Swordfight looks. TypeScript, compiled to js/den-sword-draw.js. Draws the board
   at the sword rack (onto a canvas den.js shows in 3D) and the sword pieces lying on the floor.

   In the spirit of the real puzzle's pieces (drawn fresh here, not copied): every colour has its
   own sword. Red a dagger with a skull for a pommel, yellow a broadsword, green a machete, blue a
   sabre with a hand guard. A block is a glossy bevelled tile with its sword pressed into it; a
   breaker is the sword itself, with no tile; a fused block is one big tile with one big sword;
   attack blocks are silver tiles, opaque and then see-through, with only the sword's outline.
   The user, of a first go with plain coloured squares and rings: it "really does not look like
   sword fighting pieces to me". */
import { ENTRY, H, W } from './swordfight.js';
/** Each colour's base, highlight and shadow. */
export const PALETTE = {
    0: { base: '#cf2418', light: '#ff7a5c', dark: '#5e0905' },
    1: { base: '#dcae0c', light: '#ffe979', dark: '#6e5000' },
    2: { base: '#2c9a1c', light: '#93ef6c', dark: '#0d4408' },
    3: { base: '#2b6bd6', light: '#8cc4ff', dark: '#0b2c6a' },
};
function roundRect(x, X, Y, w, h, r) {
    x.beginPath();
    x.moveTo(X + r, Y);
    x.arcTo(X + w, Y, X + w, Y + h, r);
    x.arcTo(X + w, Y + h, X, Y + h, r);
    x.arcTo(X, Y + h, X, Y, r);
    x.arcTo(X, Y, X + w, Y, r);
    x.closePath();
}
/** A colour's sword, point down, filling the box (X, Y, w, h). `fill` null draws only the outline. */
export function drawSword(x, c, X, Y, w, h, fill, line) {
    const p = (u, v) => [X + u * w, Y + v * h];
    x.save();
    x.lineJoin = 'round';
    x.lineCap = 'round';
    x.lineWidth = Math.max(1, w * 0.05);
    x.strokeStyle = line;
    const paint = () => { if (fill) {
        x.fillStyle = fill;
        x.fill();
    } x.stroke(); };
    const poly = (pts) => { x.beginPath(); pts.forEach(([u, v], i) => (i ? x.lineTo(...p(u, v)) : x.moveTo(...p(u, v)))); x.closePath(); paint(); };
    const rect = (u0, v0, u1, v1) => poly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
    const bar = (u0, v0, u1, v1, t) => {
        // A thick rounded stroke, outlined: the outline drawn wide, then the fill narrower on top.
        x.beginPath();
        x.moveTo(...p(u0, v0));
        x.lineTo(...p(u1, v1));
        x.lineWidth = t * w + x.lineWidth * 2;
        x.strokeStyle = line;
        x.stroke();
        if (fill) {
            x.lineWidth = t * w;
            x.strokeStyle = fill;
            x.stroke();
        }
        x.lineWidth = Math.max(1, w * 0.05);
        x.strokeStyle = line;
    };
    switch (c) {
        case 0: {
            // The skull dagger: a straight tapering blade, crossed bones for a guard, a skull on top.
            poly([[0.41, 0.42], [0.59, 0.42], [0.57, 0.78], [0.5, 0.97], [0.43, 0.78]]);
            rect(0.45, 0.25, 0.55, 0.42);
            bar(0.24, 0.31, 0.76, 0.43, 0.08);
            bar(0.24, 0.43, 0.76, 0.31, 0.08);
            x.beginPath();
            x.ellipse(...p(0.5, 0.13), w * 0.17, h * 0.11, 0, 0, Math.PI * 2);
            paint();
            rect(0.43, 0.2, 0.57, 0.26);
            x.fillStyle = line;
            for (const u of [0.43, 0.57]) {
                x.beginPath();
                x.arc(...p(u, 0.13), w * 0.045, 0, Math.PI * 2);
                x.fill();
            }
            break;
        }
        case 1: {
            // The broadsword: wide and straight, a flat pommel, a long bar of a guard.
            rect(0.37, 0.03, 0.63, 0.09);
            rect(0.44, 0.09, 0.56, 0.27);
            rect(0.18, 0.27, 0.82, 0.34);
            poly([[0.35, 0.34], [0.65, 0.34], [0.63, 0.82], [0.5, 0.97], [0.37, 0.82]]);
            x.beginPath();
            x.moveTo(...p(0.5, 0.38));
            x.lineTo(...p(0.5, 0.82));
            x.stroke();
            break;
        }
        case 2: {
            // The machete: a blade that swells to one side, a guard with turned-down ends.
            x.beginPath();
            x.arc(...p(0.5, 0.06), w * 0.06, 0, Math.PI * 2);
            paint();
            rect(0.44, 0.08, 0.56, 0.27);
            poly([[0.2, 0.33], [0.25, 0.27], [0.75, 0.27], [0.8, 0.33], [0.74, 0.33], [0.7, 0.31], [0.3, 0.31], [0.26, 0.33]]);
            x.beginPath();
            x.moveTo(...p(0.42, 0.31));
            x.lineTo(...p(0.58, 0.31));
            x.quadraticCurveTo(...p(0.74, 0.6), ...p(0.62, 0.8));
            x.lineTo(...p(0.45, 0.97));
            x.quadraticCurveTo(...p(0.47, 0.64), ...p(0.42, 0.31));
            x.closePath();
            paint();
            break;
        }
        default: {
            // The sabre: a curving blade, and a guard sweeping up round the hand to the pommel.
            x.beginPath();
            x.moveTo(...p(0.7, 0.3));
            x.quadraticCurveTo(...p(0.92, 0.1), ...p(0.54, 0.05));
            const lw = x.lineWidth;
            x.lineWidth = w * 0.11;
            x.stroke();
            if (fill) {
                x.lineWidth = w * 0.05;
                x.strokeStyle = fill;
                x.stroke();
            }
            x.lineWidth = lw;
            x.strokeStyle = line;
            rect(0.44, 0.06, 0.56, 0.28);
            x.beginPath();
            x.ellipse(...p(0.5, 0.3), w * 0.22, h * 0.035, 0, 0, Math.PI * 2);
            paint();
            x.beginPath();
            x.moveTo(...p(0.43, 0.32));
            x.lineTo(...p(0.57, 0.32));
            x.quadraticCurveTo(...p(0.66, 0.66), ...p(0.4, 0.97));
            x.quadraticCurveTo(...p(0.5, 0.62), ...p(0.43, 0.32));
            x.closePath();
            paint();
            break;
        }
    }
    x.restore();
}
/** A breaker: the sword alone, bright, outlined dark. */
export function drawBreaker(x, c, X, Y, s) {
    const pal = PALETTE[c], g = x.createLinearGradient(X, Y, X + s, Y + s);
    g.addColorStop(0, pal.light);
    g.addColorStop(0.6, pal.base);
    g.addColorStop(1, pal.dark);
    // A glow behind it, so a breaker stands out among the blocks.
    const glow = x.createRadialGradient(X + s / 2, Y + s / 2, 0, X + s / 2, Y + s / 2, s * 0.62);
    glow.addColorStop(0, `${pal.light}88`);
    glow.addColorStop(1, `${pal.light}00`);
    x.fillStyle = glow;
    x.fillRect(X, Y, s, s);
    drawSword(x, c, X + s * 0.02, Y + s * 0.01, s * 0.96, s * 0.98, g, '#140d08');
}
/** A tile: a glossy bevelled block (w by h squares of size s), with its sword pressed into it.
    `grey`: an attack block, silver (2 opaque, 1 see-through). */
export function drawTile(x, c, X, Y, w, h, grey = 0) {
    const pal = PALETTE[c], r = Math.min(w, h) * 0.16;
    x.save();
    if (grey === 1)
        x.globalAlpha = 0.6;
    const g = x.createLinearGradient(X, Y, X + w, Y + h);
    if (grey) {
        g.addColorStop(0, '#f4f4f2');
        g.addColorStop(0.5, '#b9b8b4');
        g.addColorStop(1, '#6f6e6a');
    }
    else {
        g.addColorStop(0, pal.light);
        g.addColorStop(0.45, pal.base);
        g.addColorStop(1, pal.dark);
    }
    roundRect(x, X + 1, Y + 1, w - 2, h - 2, r);
    x.fillStyle = g;
    x.fill();
    x.lineWidth = 1.5;
    x.strokeStyle = '#140d08';
    x.stroke();
    // The bevel: a highlight round the top and left, a shadow round the bottom and right.
    roundRect(x, X + 3, Y + 3, w - 6, h - 6, r * 0.8);
    x.lineWidth = Math.max(1.5, Math.min(w, h) * 0.06);
    x.strokeStyle = grey ? '#ffffff55' : `${pal.light}66`;
    x.stroke();
    // The sword, pressed in: a shade of the tile, outlined darker.
    const sw = Math.min(w, h * 0.62), sh = h * 0.9;
    if (grey)
        drawSword(x, c, X + (w - sw) / 2, Y + (h - sh) / 2, sw, sh, null, '#8b8a86');
    else
        drawSword(x, c, X + (w - sw) / 2, Y + (h - sh) / 2, sw, sh, `${pal.light}99`, `${pal.dark}cc`);
    x.restore();
}
/** One piece: a block's tile, or a breaker's sword. */
export function drawGem(x, g, X, Y, s) {
    if (g.breaker && !g.grey)
        drawBreaker(x, g.c, X, Y, s);
    else
        drawTile(x, g.c, X, Y, s, s, g.grey ?? 0);
}
/** The board at the sword rack, with the pieces waiting down the side. Square size `P` pixels; the
    canvas should be (W + 3) * P + 24 wide and H * P + 24 high. */
export function drawRack(cv, rack, P) {
    const x = cv.getContext('2d'), ox = 12, oy = 12, b = rack.board;
    x.fillStyle = '#1b130d';
    x.fillRect(0, 0, cv.width, cv.height);
    const bg = x.createLinearGradient(0, oy, 0, oy + H * P);
    bg.addColorStop(0, '#2e2620');
    bg.addColorStop(1, '#17110c');
    x.fillStyle = bg;
    x.fillRect(ox, oy, W * P, H * P);
    // The fourth column, where the pairs come in: lose it and you've lost.
    x.fillStyle = '#ffffff0c';
    x.fillRect(ox + ENTRY * P, oy, P, H * P);
    x.strokeStyle = '#ffffff10';
    x.lineWidth = 1;
    for (let c = 1; c < W; c++) {
        x.beginPath();
        x.moveTo(ox + c * P, oy);
        x.lineTo(ox + c * P, oy + H * P);
        x.stroke();
    }
    const at = (r, c) => [ox + c * P, oy + (H - 1 - r) * P];
    for (let r = 0; r < H; r++)
        for (let c = 0; c < W; c++) {
            const g = b.grid[r][c];
            if (g && g.fuse === undefined)
                drawGem(x, g, ...at(r, c), P);
        }
    for (const id of b.fusedIds()) {
        const f = b.fusedBox(id), g = b.grid[f.r0][f.c0], [px, py] = at(f.r0 + f.h - 1, f.c0);
        drawTile(x, g.c, px, py, f.w * P, f.h * P);
    }
    const f = b.falling;
    if (f)
        b.fallingCells().forEach(([r, c], i) => { if (r < H)
            drawGem(x, { c: f.pair[i].c, breaker: f.pair[i].breaker || undefined }, ...at(r, c), P); });
    x.strokeStyle = '#6b4a2e';
    x.lineWidth = 3;
    x.strokeRect(ox - 1.5, oy - 1.5, W * P + 3, H * P + 3);
    // Down the side: the pieces you've picked up, next first.
    const sx = ox + W * P + P * 0.6;
    x.fillStyle = '#e8dcc0';
    x.font = `bold ${Math.round(P * 0.42)}px sans-serif`;
    x.fillText('Next', sx, oy + P * 0.4);
    rack.queue.slice(0, 5).forEach((pair, i) => {
        const y = oy + P * 0.7 + i * (P * 2 + 8);
        drawGem(x, { c: pair[1].c, breaker: pair[1].breaker || undefined }, sx, y, P);
        drawGem(x, { c: pair[0].c, breaker: pair[0].breaker || undefined }, sx, y + P, P);
    });
    if (rack.queue.length > 5) {
        x.fillStyle = '#e8dcc0';
        x.fillText(`+${rack.queue.length - 5}`, sx, oy + P * 0.7 + 5 * (P * 2 + 8) + P * 0.3);
    }
    if (!f && !rack.queue.length) {
        x.fillStyle = '#e8dcc0cc';
        x.font = `bold ${Math.round(P * 0.42)}px sans-serif`;
        x.textAlign = 'center';
        ['Beat raiders', 'for sword', 'pieces'].forEach((t, i) => x.fillText(t, ox + (W * P) / 2, oy + (H * P) / 2 - P * 0.6 + i * P * 0.6));
        x.textAlign = 'start';
    }
}
/** A sword piece as it lies on the den floor: the pair, one above the other, on a canvas of its own. */
export function drawPair(cv, pair) {
    const x = cv.getContext('2d'), s = cv.width;
    x.clearRect(0, 0, cv.width, cv.height);
    drawGem(x, pair[1], 0, 0, s);
    drawGem(x, pair[0], 0, s, s);
}
