// The race course editor's page (race-editor.html, 12 Nov): the course drawn in 2D in the race chart's look
// (tools/race-map.mjs: ink on parchment, out to sea at the top), to click and drag; the side panel with the
// picked feature's numbers, the course's problems, its links and its balance check. Its rules are
// src/race-editor.ts and src/race-course.ts; the course is laid out by the den's own layRace
// (src/den-sail.ts), so what's drawn here is what's sailed in 3D.
import { layRace } from './den-sail.js';
import { longRoute } from './den-race.js';
import { whirlpool } from './den-whirl.js';
import { decodeCourse, encodeCourse, SIZES, SIZE_NAMES, CRANE_SIZES } from './race-course.js';
import {
  FEATURES, BUOY_IDS, ABOUT, FRAME_NAMES, ROUTE_OF, squaresOf, featureAt, columnOf, limitsOf, moved, sized, check, shareLink,
  raceLink, fresh, mmss, buoyOf,
} from './race-editor.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const params = new URLSearchParams(location.search);

/** The course being edited, the feature picked, the balance check (for the course it was run on). */
let course = decodeCourse(params.get('course')) ?? fresh();
let picked = null, drag = false, bal = null, balCode = '', worker = null;

const W = 27, SQ = 26;
const INK = '#4a2c14', LAND = '#d6b778', RED = '#7a2414', SNAKE = '#9b2a14', BLUE = '#284a60', GREEN = '#2f5a24', GOLD = '#a8780f';
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
const f = (n) => Math.round(n * 10) / 10;
const key = (c, r) => `${c},${r}`;

/* ---- The chart ---- */
function chart(lay, problems) {
  const R0 = lay.R0, RTOP = lay.FINISH[1] + 1, RBOT = R0 - 1;
  const X = (c) => (c + 0.5) * SQ, Y = (r) => (RTOP - r + 0.5) * SQ;
  const out = [], add = (s) => out.push(s);
  const VW = W * SQ, VH = (RTOP - RBOT + 1) * SQ;
  add(`<svg viewBox="-6 -6 ${VW + 12} ${VH + 12}" xmlns="http://www.w3.org/2000/svg" font-family="Alegreya, serif">`);
  add(`<defs><radialGradient id="paper" cx="50%" cy="50%" r="72%"><stop offset="0" stop-color="#f0ddae"/><stop offset=".75" stop-color="#dcc08a"/><stop offset="1" stop-color="#a87b42"/></radialGradient>
    <pattern id="shelter" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(70,120,50,.16)"/><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(47,90,36,.5)" stroke-width="2.4"/></pattern></defs>`);
  add(`<rect x="-6" y="-6" width="${VW + 12}" height="${VH + 12}" rx="10" fill="url(#paper)"/>`);

  // Winds: a tinted square and an arrow the way each blows; snakes red, the rest blue.
  const snake = new Set([...lay.SNAKES.LEFT, ...lay.SNAKES.TIGHT, ...lay.SNAKES.MID].map(([c, r]) => key(c, r)));
  let blue = '', red = '';
  for (const [c, r, d] of [...lay.WINDS, ...lay.WHIRLS.WINDS]) {
    if (r <= R0) continue;
    const s = snake.has(key(c, r)), x = X(c), y = Y(r), ux = DX[d], uy = DY[d], sx = -uy, sy = ux, a = SQ * 0.3, h = SQ * 0.16;
    add(`<rect x="${x - SQ / 2}" y="${y - SQ / 2}" width="${SQ}" height="${SQ}" fill="${s ? 'rgba(170,45,20,.16)' : 'rgba(40,74,96,.13)'}"/>`);
    const p = `M${f(x - ux * a)} ${f(y - uy * a)}L${f(x + ux * a)} ${f(y + uy * a)}M${f(x + ux * (a - h) + sx * h)} ${f(y + uy * (a - h) + sy * h)}L${f(x + ux * a)} ${f(y + uy * a)}L${f(x + ux * (a - h) - sx * h)} ${f(y + uy * (a - h) - sy * h)}`;
    if (s) red += p; else blue += p;
  }
  add(`<path d="${blue}" fill="none" stroke="${BLUE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`);
  add(`<path d="${red}" fill="none" stroke="${SNAKE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);

  // The land: each spit's squares, its coast inked.
  const barrier = new Set(lay.FORAGE.BARRIER.map(([c, r]) => key(c, r)));
  const land = new Set(lay.LAND.flat().map(([c, r]) => key(c, r)).filter((k) => !barrier.has(k)));
  let fill = '', coast = '';
  for (const k of land) {
    const [c, r] = k.split(',').map(Number), x = X(c), y = Y(r), hs = SQ / 2;
    fill += `M${x - hs - 0.5} ${y - hs - 0.5}h${SQ + 1}v${SQ + 1}h${-SQ - 1}Z`;
    for (let d = 0; d < 4; d++) {
      const nc = c + [0, 1, 0, -1][d], nr = r + [1, 0, -1, 0][d];
      if (nc < 0 || nc >= W || land.has(key(nc, nr))) continue;
      const ux = DX[d], uy = DY[d], sx = -uy, sy = ux;
      coast += `M${f(x + ux * hs + sx * hs)} ${f(y + uy * hs + sy * hs)}L${f(x + ux * hs - sx * hs)} ${f(y + uy * hs - sy * hs)}`;
    }
  }
  add(`<path d="${fill}" fill="${LAND}"/><path d="${coast}" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);

  // The line of rocks in front of it, and its gate.
  let rocks = '';
  for (const [c, r] of lay.REEF) { const x = X(c), y = Y(r); rocks += `M${x - 8} ${y + 5}L${x - 3} ${y - 6}L${x + 4} ${y - 5}L${x + 9} ${y + 5}Z`; }
  add(`<path d="${rocks}" fill="#9b8c78" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`);

  // Sheltered spots.
  for (const [c, r] of [...lay.LOCKS.map((l) => l.at), ...lay.POUND.at, lay.BERTH, lay.CRANE.LEDGE, lay.FORAGE.NOTCH, lay.BRIBE.NOTCH]) add(`<rect x="${X(c) - SQ / 2}" y="${Y(r) - SQ / 2}" width="${SQ}" height="${SQ}" fill="url(#shelter)"/>`);

  // Whirlpools: a spiral over each (the whirlpool channel's; the start's field's are each race's own).
  const spiral = (cx, cy, turns, k) => { let d = ''; for (let t = 0; t <= turns * Math.PI * 2; t += 0.3) d += `${d ? 'L' : 'M'}${f(cx + Math.cos(t) * (2 + t * k))} ${f(cy + Math.sin(t) * (2 + t * k))}`; return d; };
  for (const p of lay.WHIRLS.POOLS) {
    const [mc, mr] = whirlpool(p).mid, cx = X(mc), cy = Y(mr);
    add(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${SQ * 0.9}" fill="rgba(40,74,96,.12)" stroke="rgba(40,74,96,.5)" stroke-dasharray="3 3"/><path d="${spiral(cx, cy, 3, 1.05)}" fill="none" stroke="${BLUE}" stroke-width="1.8"/>`);
  }
  // Rocks: the wall across the rocks' gap (blasted down in a race), and those walling in the field's hop.
  const boulders = (c, r, col) => { const x = X(c), y = Y(r); return `<path d="M${x - 10} ${y + 7}L${x - 6} ${y - 4}L${x} ${y - 9}L${x + 7} ${y - 5}L${x + 10} ${y + 7}Z" fill="${col}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${x - 4} ${y + 7}L${x - 1} ${y}L${x + 4} ${y + 7}" fill="none" stroke="${INK}" stroke-width="1.2"/>`; };
  for (const [c, r] of lay.ROCKS.WALL) add(boulders(c, r, '#a39684'));
  for (const [c, r] of lay.FIELD.HOP.ROCKS) add(boulders(c, r, '#b5aa98'));
  add(label(X((lay.FIELD.HOP.c0 + lay.FIELD.HOP.c1) / 2), Y(lay.LINE.r + 1) + 5, 'the field: slow winds and whirlpools, fresh each race', { size: 11.5, italic: true }));

  // The gun gap's guns and the gate's towers; the wreck in its notch.
  for (const [c, r] of lay.GUNS.at) { const x = X(c), y = Y(r); add(`<g stroke="${INK}" stroke-width="1.8"><rect x="${x - 9}" y="${y - 8}" width="18" height="16" fill="#b89a6a"/><path d="M${x} ${y}h${Math.sign(lay.GUNS.gap[0] - c) * 15}" stroke-width="5" stroke-linecap="round"/></g>`); }
  for (const [c, r] of lay.GUNS.marks.flat()) add(`<g stroke="${SNAKE}" stroke-width="1.6" fill="none"><circle cx="${X(c)}" cy="${Y(r)}" r="6"/><path d="M${X(c) - 9} ${Y(r)}h18M${X(c)} ${Y(r) - 9}v18"/></g>`);
  for (const [c, r] of lay.BRIBE.TOWERS) { const x = X(c), y = Y(r); add(`<rect x="${x - 6}" y="${y - 10}" width="12" height="18" fill="#e6dcc4" stroke="${INK}" stroke-width="1.6"/><rect x="${x - 2.5}" y="${y - 6}" width="5" height="10" fill="#a3271c"/>`); }
  {
    const [c, r] = lay.BRIBE.WRECK, x = X(c), y = Y(r);
    add(`<g transform="translate(${x} ${y + 3}) rotate(-14)" stroke="${INK}" stroke-width="1.8"><path d="M-12 -2h18l-4 7h-11Z" fill="#8a5a30"/><path d="M-3 -2l2 -11l5 -3" fill="none"/></g><circle cx="${x + 8}" cy="${y - 7}" r="3" fill="#d9a93a" stroke="${INK}"/>`);
  }

  // The locks: a chamber between stone walls; the canal between.
  for (const [c, r] of lay.POUND.at) add(`<rect x="${X(c) - SQ / 2}" y="${Y(r) - SQ / 2}" width="${SQ}" height="${SQ}" fill="rgba(60,110,140,.28)"/>`);
  for (const l of lay.LOCKS) { const [c, r] = l.at, x = X(c), y = Y(r); add(`<g stroke="${INK}" stroke-width="1.6"><rect x="${x - SQ / 2}" y="${y - SQ / 2}" width="5" height="${SQ}" fill="#a49884"/><rect x="${x + SQ / 2 - 5}" y="${y - SQ / 2}" width="5" height="${SQ}" fill="#a49884"/><path d="M${x - SQ / 2 + 5} ${y - SQ / 2 + 2}h${SQ - 10}M${x - SQ / 2 + 5} ${y + SQ / 2 - 2}h${SQ - 10}" stroke="#5b3a20" stroke-width="3.5"/></g>`); }
  // The barrier of driftwood.
  for (const [c, r] of lay.FORAGE.BARRIER) { const x = X(c), y = Y(r); for (const [dx, dy, a] of [[-3, -6, 12], [2, 0, -8], [-1, 6, 5]]) add(`<rect x="${x + dx - 12}" y="${y + dy - 3}" width="24" height="6" rx="3" fill="#8a5a30" stroke="${INK}" stroke-width="1.4" transform="rotate(${a} ${x + dx} ${y + dy})"/>`); }
  // The crane on its ledge, and its swing over onto the run home.
  {
    const [c, r] = lay.CRANE.LEDGE, x = X(c), y = Y(r), T = lay.CRANE.TO;
    add(`<path d="M${x} ${y}C${x - SQ} ${y - SQ * 0.6} ${X(T.c) - SQ} ${Y(T.r) + SQ * 0.4} ${X(T.c)} ${Y(T.r)}" fill="none" stroke="${GREEN}" stroke-width="2.4" stroke-dasharray="2 5" stroke-linecap="round"/>`);
    add(`<g stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"><path d="M${x + 4} ${y + 10}L${x + 8} ${y - 15}L${x + 12} ${y + 10}M${x + 8} ${y - 15}L${x - 12} ${y - 23}M${x - 11} ${y - 22}v8"/></g>`);
  }

  // The starlit door (fixed in place on every course): its face on spit 2, Duty Navigation's stars about it, the
  // tunnel under the course and the cleft at each exit, up onto leg 3 and leg 5.
  {
    const D = lay.DOOR, fx = (X(D.FACE[0][0]) + X(D.FACE[1][0])) / 2, fy = Y(D.FACE[0][1]) + SQ / 2;
    const caves = D.EXITS.map((e) => [fx, Y(e.OUT[0][1]) - SQ / 2]), [ox, oy] = caves[caves.length - 1];
    add(`<path d="M${fx} ${fy}L${ox} ${oy}" stroke="#3b2a6b" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round" opacity=".85"/>`);
    add(`<path d="M${fx - 9} ${fy}v-6a9 9 0 0 1 18 0v6Z" fill="#2a2140" stroke="${INK}" stroke-width="1.6"/>`);
    for (const [x, y] of caves) add(`<path d="M${x - 9} ${y}a9 8 0 0 0 18 0Z" fill="#2a2140" stroke="${INK}" stroke-width="1.6"/>`);
    const star = (x, y, s) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? s * 0.42 : s; p += `${i ? 'L' : 'M'}${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`; } return `<path d="${p}Z" fill="#e7c34a" stroke="${INK}" stroke-width="1"/>`; };
    add(star(fx - 20, fy - 10, 5) + star(fx + 20, fy - 12, 4.5));
  }

  // The shortcuts' ways through, dotted green.
  {
    const S = lay.STRETCHES, last = (a) => a[a.length - 1];
    const ways = [
      [[lay.GUNS.way[0][0], S[0].r + 1], [lay.GUNS.way[2][0], S[1].r]],
      [[lay.BRIBE.NOTCH[0], S[0].r + 1], lay.BRIBE.NOTCH],
      [[lay.HEADWIND[0][0], S[1].r + 1], ...lay.HEADWIND, [last(lay.HEADWIND)[0], S[2].r]],
      [[lay.DOUBLE.WAY[0][0], S[1].r + 1], [lay.DOUBLE.WAY[0][0], S[2].r]],
      [[lay.WHIRLS.MOUTH.c, lay.WHIRLS.MOUTH.r], lay.WHIRLS.OUT],
      [[lay.FORAGE.NOTCH[0], S[2].r + 1], lay.FORAGE.NOTCH, lay.FORAGE.OUT],
      [[lay.ROCKS.WALL[0][0], S[2].r + 1], lay.ROCKS.OUT],
      [[lay.FIELD.HOP.c0, lay.FIELD.HOP.FROM], [lay.FIELD.HOP.c0, lay.FIELD.HOP.FROM + 2], [lay.FIELD.HOP.c1 + 1, lay.FIELD.HOP.FROM + 2], lay.FIELD.HOP.LANDS],
      [[lay.LOCKS[0].at[0], S[3].r], [lay.LOCKS[1].at[0], S[4].r]],
      [[lay.CRANE.LEDGE[0], S[4].r], lay.CRANE.LEDGE],
      [[lay.TRIPLE[0][0], S[4].r + 1], [lay.TRIPLE[0][0], S[5].r]],
    ];
    add(`<path d="${ways.map((w) => `M${w.map(([c, r]) => `${f(X(c))} ${f(Y(r))}`).join('L')}`).join('')}" fill="none" stroke="${GREEN}" stroke-width="2.6" stroke-dasharray="2 6" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  // The long way, dashed, round the buoys, arrowheads the way she goes.
  {
    const pts = longRoute(lay).map(([c, r]) => [X(c), Y(r)]);
    add(`<path d="M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}" fill="none" stroke="${RED}" stroke-width="2.6" stroke-dasharray="8 6" stroke-linecap="round" opacity=".85"/>`);
    let heads = '';
    pts.slice(1).forEach(([bx, by], i) => {
      const [ax, ay] = pts[i], len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len, sx = -uy, sy = ux;
      for (let t = SQ * 2.5; t < len - SQ; t += SQ * 5) { const x = ax + ux * t, y = ay + uy * t; heads += `M${f(x - ux * 7 + sx * 6)} ${f(y - uy * 7 + sy * 6)}L${f(x)} ${f(y)}L${f(x - ux * 7 - sx * 6)} ${f(y - uy * 7 - sy * 6)}`; }
    });
    add(`<path d="${heads}" fill="none" stroke="${RED}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  // The starting line, the buoy off the gate; the numbered buoys; the finish line.
  {
    const L = lay.LINE, y = Y(L.r);
    add(`<path d="M${X(L.c0) - SQ / 2} ${y}H${X(L.c1) + SQ / 2}" stroke="${INK}" stroke-width="1.6"/>`);
    for (let c = L.c0; c <= L.c1; c++) add(`<circle cx="${X(c)}" cy="${y}" r="3.4" fill="#f2efe4" stroke="${INK}" stroke-width="1.2"/>`);
    const [bc, br] = lay.BUOY;
    add(`<path d="M${X(bc) - 7} ${Y(br) + 6}L${X(bc)} ${Y(br) - 12}L${X(bc) + 7} ${Y(br) + 6}Z" fill="#c8402a" stroke="${INK}" stroke-width="1.6"/>`);
    add(label(X(L.c0) - 4, Y(br) + 5, 'starting line ↑', { size: 13, anchor: 'start', weight: 700 }));
  }
  for (const b of lay.BUOYS) {
    const [c, r] = b.at, x = X(c) + (b.bend === 'R' ? 6 : -6), y = Y(r);
    add(`<g stroke="${INK}" stroke-width="1.6"><path d="M${x - 6} ${y + 8}L${x} ${y - 11}L${x + 6} ${y + 8}Z" fill="#f2efe4"/><path d="M${x - 4} ${y + 2}h8M${x - 5} ${y + 6}h10" stroke="#c8402a" stroke-width="2.6"/></g>`);
    const nx = x + (b.bend === 'R' ? 12 : -12);
    add(`<circle cx="${nx}" cy="${y - 15}" r="9.5" fill="#f6ead0" stroke="${INK}" stroke-width="1.6"/><text x="${nx}" y="${y - 10.5}" font-size="13" font-weight="700" text-anchor="middle" fill="#5a1a0c">${b.n}</text>`);
  }
  {
    const [c, r] = lay.FINISH, x = X(c) - SQ / 2, ya = Y(r) - SQ / 2;
    let ch = '';
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) ch += `<rect x="${x - 4 + j * 4}" y="${ya + i * (SQ / 6)}" width="4" height="${SQ / 6}" fill="${INK}"/>`;
    add(`<rect x="${x - 4}" y="${ya}" width="8" height="${SQ}" fill="#f2efe4" stroke="${INK}" stroke-width="1.2"/>${ch}`);
    add(label(X(c) + 0.2 * SQ, Y(r) + 5, 'FINISH', { size: 14, anchor: 'start', weight: 700 }));
  }

  // Each feature's name and size where it is (and its wins, once the balance check's been run on this course).
  const wins = bal && balCode === encodeCourse(course) ? Object.fromEntries(bal.routes.map((x) => [x.id, x.wins])) : {};
  const S = lay.STRETCHES, SP = lay.SPITS;
  const tag = (id, c, r, lines, anchor = 'middle') => {
    const w = ROUTE_OF[id] && wins[ROUTE_OF[id]] !== undefined ? [`wins ${Math.round(100 * wins[ROUTE_OF[id]])}%`] : [];
    add(label(X(c), Y(r) + 4, [...lines, ...w], { size: 12.5, anchor, lead: true, pick: id }));
  };
  const K = course;
  tag('gun', K.gun - 1.6, SP[0].r1, [`Gate · ${K.coins} coins`], 'end');
  tag('wreck', K.wreck, SP[0].r1 + 0.1, ['Wreck']);

  tag('head', K.head + 0.5, SP[1].r1 + 0.2, ['Headwind gap']);
  tag('double', K.double, SP[1].r0 + 0.4, ['Double']);
  tag('mid', K.mid + 0.6, SP[1].r0 + 0.1, ['Snake'], 'start');
  {
    const c = (lay.DOOR.FACE[0][0] + lay.DOOR.FACE[1][0]) / 2, w = wins.door !== undefined ? [`wins ${Math.round(100 * wins.door)}%`] : [];
    add(label(X(c), Y(SP[1].r0 + 1.1) + 4, ['Starlit door', 'fixed in place', ...w], { size: 12.5, lead: true }));
  }
  tag('whirl', K.whirl - 1.5, SP[2].r1 - 2.6, ['Whirlpools', 'a Vegas']);
  tag('rocks', K.rocks, SP[2].r1 - 2.6, ['Rocks', 'blasted, 3 hits']);
  tag('forage', K.forage, SP[2].r1 - 0.2, ['Barrier', `${K.bundles} bundle${K.bundles > 1 ? 's' : ''}`]);
  tag('lock', K.lock + 3.4, SP[3].r1 - 0.3, ['Locks', `${K.clears} clears`], 'start');
  tag('crane', K.crane, SP[4].r1 + 0.1, ['Crane', K.frames]);
  tag('triple', K.triple, SP[4].r1 + 0.1, ['Triple']);

  S.forEach((s, i) => add(label(s.d === 1 ? X(1.4) : X(W - 2.4), Y(s.r) + 4, i === S.length - 1 ? '← the run home' : s.d === 1 ? `leg ${i + 1} →` : `← leg ${i + 1}`, { size: 13, anchor: s.d === 1 ? 'start' : 'end', italic: true })));

  // The picked feature: its squares outlined, and a handle to drag it along its spit.
  if (picked) {
    const sq = squaresOf(lay, picked);
    for (const [c, r] of sq) add(`<rect x="${X(c) - SQ / 2 + 1}" y="${Y(r) - SQ / 2 + 1}" width="${SQ - 2}" height="${SQ - 2}" fill="rgba(255,214,90,.22)" stroke="#e0a92a" stroke-width="2.4" rx="3"/>`);
    const [lo, hi] = limitsOf(course, picked), col = columnOf(course, picked), top = Math.max(...sq.map(([, r]) => r));
    const y = Y(top) - SQ * 0.95;
    add(`<path d="M${X(lo) - 8} ${y}H${X(hi) + 8}" stroke="rgba(138,75,15,.35)" stroke-width="3" stroke-linecap="round"/>`);
    add(`<g fill="#8a4b0f"><path d="M${X(col) - 16} ${y}l7 -6v12Z"/><path d="M${X(col) + 16} ${y}l-7 -6v12Z"/><circle cx="${X(col)}" cy="${y}" r="6" stroke="#fff3d6" stroke-width="1.6"/></g>`);
  }
  if (problems.length) add(`<rect x="-4" y="-4" width="${VW + 8}" height="${VH + 8}" rx="9" fill="none" stroke="#b0472c" stroke-width="4" stroke-dasharray="10 6"/>`);
  add('</svg>');
  return { svg: out.join(''), X, Y, RTOP };
}

/** Words on the chart with a parchment halo; an array is lines, the first a title. */
function label(x, y, text, o = {}) {
  const lines = Array.isArray(text) ? text : [text], size = o.size ?? 13;
  return `<text x="${f(x)}" y="${f(y)}" font-size="${size}" text-anchor="${o.anchor ?? 'middle'}" fill="${INK}"${o.italic ? ' font-style="italic"' : ''} font-weight="${o.weight ?? 500}" paint-order="stroke" stroke="rgba(238,220,172,.92)" stroke-width="${f(size * 0.3)}" stroke-linejoin="round"${o.pick ? ` data-pick="${o.pick}"` : ''}>${lines.map((t, i) => `<tspan x="${f(x)}" dy="${i ? f(size * 1.1) : 0}"${o.lead && !i ? ' font-weight="700" fill="#5a1a0c"' : ''}${/^wins/.test(t) ? ' fill="#8a1c10" font-weight="700"' : ''}>${esc(t)}</tspan>`).join('')}</text>`;
}

/* ---- The page ---- */
let view = null;
function render() {
  const problems = check(course), code = encodeCourse(course), lay = layRace(course, true);
  view = chart(lay, problems);
  $('chart').innerHTML = view.svg;
  if (drag) $('chart').firstChild.classList.add('drag');
  if (!problems.length) history.replaceState(null, '', `?course=${code}`);
  const to3d = $('to3d');
  to3d.href = raceLink(course);
  to3d.classList.toggle('off', problems.length > 0);
  to3d.title = problems.length ? 'Put right what\'s out of place first' : 'Race this course in the den';
  pickedPanel();
  coursePanel(problems);
  balancePanel();
}

function pickedPanel() {
  const el = $('picked');
  if (!picked) {
    el.innerHTML = `<h2>Pick something</h2><p>Click a buoy, a shortcut or a snake on the chart, or one of these. Drag it along its spit, or use ◂ ▸ (the arrow keys too). The starlit door stays where it is, its tunnel under the course: nothing else cuts through a spit in its columns.</p>
      <div class="chips">${FEATURES.map((id) => `<button data-pick="${id}">${esc(ABOUT[id].name)}</button>`).join('')}</div>`;
    return;
  }
  const A = ABOUT[picked], [lo, hi] = limitsOf(course, picked), col = columnOf(course, picked);
  const rows = A.sizes.map((s) => {
    if (s === 'frames') return `<div class="row"><label for="sz-frames">The crane's frames</label><select id="sz-frames" data-size="frames">${CRANE_SIZES.map((x) => `<option value="${x}"${course.frames === x ? ' selected' : ''}>${FRAME_NAMES[x]}</option>`).join('')}</select></div>`;
    const R = SIZES[s], unit = { clears: ' moves', bundles: '', coins: ' coins' }[s];
    return `<div class="row"><label for="sz-${s}">${esc(SIZE_NAMES[s])}</label><input type="range" id="sz-${s}" data-size="${s}" min="${R.lo}" max="${R.hi}" step="${R.step}" value="${course[s]}"><output>${course[s]}${unit}</output></div>`;
  });

  el.innerHTML = `<h2>${esc(A.name)}</h2><p>${esc(A.what)}</p>
    <div class="row"><label>Where</label><button class="ghost small" data-nudge="-1" title="Move it left">◂</button><output>column ${col}</output><button class="ghost small" data-nudge="1" title="Move it right">▸</button><span class="note">${lo > hi ? 'no room here' : `${lo} to ${hi}`}</span></div>
    ${rows.join('')}
    <div class="row"><button class="ghost" data-pick="">Done</button></div>`;
}

function coursePanel(problems) {
  $('course').innerHTML = `<h2>The course</h2>
    ${problems.length ? `<div class="bad"><b>Not a race yet:</b><ul>${problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>` : '<p class="good">✓ A race: the long way\'s open round every buoy, every shortcut can be sailed to.</p>'}
    <div class="row" style="margin-top:10px">
      <a class="btn${problems.length ? ' off' : ''}" href="${raceLink(course)}">Race it in 3D ▸</a>
      <button id="share"${problems.length ? ' disabled' : ''}>Copy share link</button>
      <button class="ghost" id="reset">Reset to the den's course</button>
    </div>
    <p class="note">The 3D view opens the course in the den's own race, a link there brings you back.</p>`;
}

function balancePanel() {
  const el = $('balance'), code = encodeCourse(course), fresh = bal && balCode === code, ok = !check(course).length;
  const head = `<h2>Balance check</h2><p>A few hundred races of four computer racers, each way round as often as the others: does each way round win about its fair share?</p>
    <div class="row"><button id="run"${ok ? '' : ' disabled'}>${bal ? 'Check again' : 'Check its balance'}</button> <span class="note" id="runs"></span></div>
    <div class="meter"><div id="meter"></div></div>`;
  if (!bal) { el.innerHTML = head; return; }
  const B = bal, pc = (x) => `${Math.round(100 * x)}%`, s = (n) => (n === null ? '–' : `${n < 0 ? '−' : ''}${Math.abs(Math.round(n))}`);
  el.innerHTML = `${head}${fresh ? '' : '<p class="note">(for the course as it was: check again)</p>'}
    <p>${B.races} races · the long way ${mmss(B.long)} · fair share ${pc(B.fair)}</p>
    <h3>Wins, each way round</h3>
    <table>${B.routes.map((r) => `<tr><td>${esc(r.name)}</td><td style="width:34%"><div class="bar${r.ok ? '' : ' out'}" style="width:${Math.min(100, (r.wins / (B.fair * 2)) * 100)}%"></div></td><td class="n">${pc(r.wins)}</td></tr>`).join('')}</table>
    <p class="note">Red: outside half to 1.6 times its fair share.</p>
    <h3>What each shortcut saves (s)</h3>
    <table><tr><th></th><th class="n">course</th><th class="n">decent</th><th class="n">good</th><th class="n">great</th></tr>
    ${B.cuts.map((c) => `<tr><td>${esc(c.name)}</td><td class="n">${s(c.saves)}</td><td class="n">${s(c.by.decent)}</td><td class="n">${s(c.by.good)}</td><td class="n">${s(c.by.great)}</td></tr>`).join('')}</table>
    <p class="note">"Course": the long way it cuts out, less the trip through (measured on the den's own course, shifted for this one). By skill: what it really saved a racer that good, her puzzling counted against it.</p>`;
}

function runBalance() {
  if (check(course).length) return;
  worker?.terminate();
  const code = encodeCourse(course), races = 300;
  worker = new Worker(`js/race-balance.js?course=${code}`, { type: 'module' });
  $('run').disabled = true;
  $('runs').textContent = `Racing ${races} races…`;
  worker.onmessage = (e) => {
    const m = e.data;
    if ($('meter')) $('meter').style.width = `${(100 * m.done) / m.races}%`;
    if ($('runs')) $('runs').textContent = `${m.done} of ${m.races} races`;
    if (m.balance) { bal = m.balance; balCode = code; worker.terminate(); worker = null; render(); }
  };
  worker.onerror = (e) => { $('runs').textContent = `The check went wrong: ${e.message || 'see the console'}`; $('run').disabled = false; };
  worker.postMessage({ races, size: 4, batch: 25 });
}

function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 1800); }

/* ---- Clicks, drags and keys ---- */
function square(ev) {
  const svg = $('chart').firstChild, pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [Math.floor(p.x / SQ), view.RTOP - Math.floor(p.y / SQ)];
}
function moveTo(c) {
  const next = moved(course, picked, c);
  if (encodeCourse(next) !== encodeCourse(course)) { course = next; render(); }
}
$('chart').addEventListener('pointerdown', (ev) => {
  const [c, r] = square(ev), lay = layRace(course, true);
  const byLabel = ev.target.closest?.('[data-pick]')?.dataset.pick;
  const id = byLabel || featureAt(lay, c, r);
  if (!id) { picked = null; render(); return; }
  picked = id; drag = true;
  try { $('chart').setPointerCapture(ev.pointerId); } catch { /* (a pointer already gone) */ }
  render();
});
$('chart').addEventListener('pointermove', (ev) => { if (drag && picked) moveTo(square(ev)[0]); });
const stop = () => { if (drag) { drag = false; render(); } };
$('chart').addEventListener('pointerup', stop);
$('chart').addEventListener('pointercancel', stop);

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button, a');
  if (!t) return;
  if (t.dataset.pick !== undefined && !t.closest('#chart')) { picked = t.dataset.pick || null; render(); }
  else if (t.dataset.nudge) moveTo(columnOf(course, picked) + Number(t.dataset.nudge));

  else if (t.id === 'reset') { course = fresh(); picked = null; render(); toast('Back to the den\'s own course'); }
  else if (t.id === 'run') runBalance();
  else if (t.id === 'share') {
    const link = shareLink(location.href, course);
    (navigator.clipboard?.writeText(link) ?? Promise.reject()).then(() => toast('Share link copied'), () => prompt('Copy this link:', link));
  }
});
document.addEventListener('input', (ev) => {
  const s = ev.target.dataset?.size;
  if (!s) return;
  course = sized(course, s, ev.target.value);
  render();
  document.getElementById(`sz-${s}`)?.focus();
});
document.addEventListener('keydown', (ev) => {
  if (!picked || ev.target.matches?.('input, select')) return;
  if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { moveTo(columnOf(course, picked) + (ev.key === 'ArrowLeft' ? -1 : 1)); ev.preventDefault(); }
  if (ev.key === 'Escape') { picked = null; render(); }
});

// (a link may pick a feature, `&pick=lock`, and run the balance check, `&check=1`: to show someone a part of it)
if (FEATURES.includes(params.get('pick'))) picked = params.get('pick');
render();
if (picked) document.querySelector('#chart rect[stroke="#e0a92a"]')?.scrollIntoView({ block: 'center' });
if (params.get('check') === '1') runBalance();
// (for poking at it from the console)
window.editor = { get course() { return course; }, set course(k) { course = k; render(); }, pick(id) { picked = id; render(); }, moveTo, runBalance, get balance() { return bal; }, BUOY_IDS, buoyOf };
