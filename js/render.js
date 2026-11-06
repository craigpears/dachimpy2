/* SVG drawing for holes, pieces and the toolbox. Returns markup strings. */
(function (root) {
  'use strict';
  const C = root.Carp;
  const k = (r, c) => r + ',' + c;

  // Long-grain pieces show their grain along the long axis; everything else runs horizontal.
  function grainDir(letter, cells) {
    if (!C.LONG_GRAIN.has(letter)) return 'h';
    const b = C.bbox(cells);
    return b.w > b.h ? 'h' : 'v';
  }

  // Outline only the outside edges of a group of cells.
  function outline(cells, s, ox, oy) {
    const set = new Set(cells.map(([r, c]) => k(r, c)));
    let d = '';
    for (const [r, c] of cells) {
      const x = ox + c * s, y = oy + r * s;
      if (!set.has(k(r - 1, c))) d += `M${x} ${y}h${s}`;
      if (!set.has(k(r + 1, c))) d += `M${x} ${y + s}h${s}`;
      if (!set.has(k(r, c - 1))) d += `M${x} ${y}v${s}`;
      if (!set.has(k(r, c + 1))) d += `M${x + s} ${y}v${s}`;
    }
    return d;
  }

  function labelCell(cells) {
    const mr = cells.reduce((a, [r]) => a + r, 0) / cells.length;
    const mc = cells.reduce((a, [, c]) => a + c, 0) / cells.length;
    return cells.slice().sort((a, b) => Math.hypot(a[0] - mr, a[1] - mc) - Math.hypot(b[0] - mr, b[1] - mc))[0];
  }

  function pieceShapes(p, s, ox, oy, opts = {}) {
    const dir = grainDir(p.letter, p.cells);
    const cls = 'pc' + (p.ghost ? ' ghost' : '') + (p.fresh ? ' fresh' : '');
    let out = `<g class="${cls}" style="--pc: var(--p-${p.letter})">`;
    for (const [r, c] of p.cells) {
      const x = ox + c * s, y = oy + r * s;
      out += `<rect class="pc-fill" x="${x}" y="${y}" width="${s}" height="${s}"/>`;
      out += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="url(#grain-${dir})"/>`;
    }
    out += `<path class="pc-edge" d="${outline(p.cells, s, ox, oy)}"/>`;
    if (opts.labels !== false) {
      const [lr, lc] = labelCell(p.cells);
      out += `<text class="pc-label" x="${ox + lc * s + s / 2}" y="${oy + lr * s + s / 2}" font-size="${Math.round(s * 0.5)}">${p.letter}</text>`;
    }
    return out + '</g>';
  }

  /* A hole on the workbench.
     remnant: empty squares still to fill.  pieces: [{letter, cells, ghost?, fresh?}] drawn on top.
     The border around the remnant is drawn as existing work so it reads as the end of a real hole. */
  function board(remnant, pieces = [], opts = {}) {
    const s = opts.cell || 28;
    const frame = opts.frame ?? 1;
    const all = remnant.concat(...pieces.map((p) => p.cells));
    const b = C.bbox(all.length ? all : [[0, 0]]);
    const rows = b.h + frame * 2, cols = b.w + frame * 2;
    const r0 = b.r0 - frame, c0 = b.c0 - frame;
    const W = cols * s, H = rows * s;
    const holeSet = new Set(all.map(([r, c]) => k(r, c)));
    const ox = -c0 * s, oy = -r0 * s;

    let svg = `<svg class="board" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${opts.label || 'Carpentry hole'}">`;
    svg += `<rect class="bench" x="0" y="0" width="${W}" height="${H}" rx="4"/>`;
    // Existing work: planks around the hole.
    for (let r = r0; r < r0 + rows; r++) {
      for (let c = c0; c < c0 + cols; c++) {
        if (holeSet.has(k(r, c))) continue;
        const x = ox + c * s, y = oy + r * s;
        svg += `<rect class="work" x="${x + 0.5}" y="${y + 0.5}" width="${s - 1}" height="${s - 1}"/>`;
      }
    }
    for (const [r, c] of all) {
      svg += `<rect class="hole" x="${ox + c * s}" y="${oy + r * s}" width="${s}" height="${s}"/>`;
    }
    svg += `<path class="hole-edge" d="${outline(all, s, ox, oy)}"/>`;
    if (opts.target) svg += `<path class="target" d="${outline(opts.target, s, ox, oy)}"/>`;
    for (const p of pieces) svg += pieceShapes(p, s, ox, oy, opts);
    return svg + '</svg>';
  }

  // A loose piece, e.g. in the toolbox or the gallery.
  function piece(letter, cells, opts = {}) {
    const s = opts.cell || 18;
    cells = C.normalize(cells || C.ORIENTS_BY_LETTER[letter][0].cells);
    const b = C.bbox(cells);
    const pad = opts.pad ?? 2;
    const W = b.w * s + pad * 2, H = b.h * s + pad * 2;
    const box = opts.box
      ? `viewBox="0 0 ${Math.max(W, opts.box)} ${Math.max(H, opts.box)}" width="${Math.max(W, opts.box)}" height="${Math.max(H, opts.box)}"`
      : `viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"`;
    const ox = opts.box ? (Math.max(W, opts.box) - b.w * s) / 2 : pad;
    const oy = opts.box ? (Math.max(H, opts.box) - b.h * s) / 2 : pad;
    return `<svg class="piece-svg" ${box} role="img" aria-label="${letter} piece">${pieceShapes({ letter, cells }, s, ox, oy, { labels: opts.labels ?? false })}</svg>`;
  }

  function putty(size = 44) {
    return `<svg class="piece-svg putty" viewBox="0 0 44 44" width="${size}" height="${size}" role="img" aria-label="Putty bucket">
      <path d="M10 14h24l-3 22a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3z" class="putty-bucket"/>
      <ellipse cx="22" cy="14" rx="12" ry="3.5" class="putty-top"/>
      <path d="M12 14c4-6 16-6 20 0" class="putty-handle"/>
    </svg>`;
  }

  function toolbox(items, opts = {}) {
    return `<div class="toolbox" aria-label="Toolbox">${items.map((it, i) => `
      <div class="slot"><span class="slot-n">${i + 1}</span>${it === 'putty' ? putty() : piece(it, null, { cell: opts.cell || 13, box: 76, labels: false })}
      <span class="slot-name">${it === 'putty' ? 'Putty' : it}</span></div>`).join('')}</div>`;
  }

  // Shared SVG defs (grain patterns) live once in the page.
  function defs() {
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <pattern id="grain-h" patternUnits="userSpaceOnUse" width="28" height="7">
        <path d="M0 2.5q7 -1.4 14 0t14 0" fill="none" stroke="var(--grain)" stroke-width="0.9"/>
        <path d="M0 5.8q9 1 16 0t12 0.4" fill="none" stroke="var(--grain)" stroke-width="0.6"/>
      </pattern>
      <pattern id="grain-v" patternUnits="userSpaceOnUse" width="7" height="28">
        <path d="M2.5 0q-1.4 7 0 14t0 14" fill="none" stroke="var(--grain)" stroke-width="0.9"/>
        <path d="M5.8 0q1 9 0 16t0.4 12" fill="none" stroke="var(--grain)" stroke-width="0.6"/>
      </pattern>
    </defs></svg>`;
  }

  root.Render = { board, piece, putty, toolbox, defs };
})(window);
