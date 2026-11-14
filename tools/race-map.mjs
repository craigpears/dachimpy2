/* A chart of the sloop race's course (12 Nov), in the captain's map's look (js/den/map.js, mapTexture:
   ink on old parchment, hand-lettered), drawn from the race's own data so it stays right as the course is
   re-laid: the user, "draw like a map of the course ... shows where all the shortcuts and things are, and all
   the wins? Like a 2D depiction of the course."

   Everything on it is read from the compiled js: the squares from LAY.RACE (src/den-sail.ts) and the sea
   built on them (courseSea), the long way (LONG_ROUTE), what each shortcut saves (CUTS, from RACE.DECENT,
   DOOR.SAVES and SIM.ZIGZAG), the sheltered spots (SHELTER), the gun gap's guns and their reach (CHECK), the
   rivals' spots and routes (RIVALS); and the wins from the race simulated, as tools/race-sim.mjs runs it
   (src/race-sim.ts). Only the words for each puzzle are written here. The sheet itself (the paper, the sea,
   the land and everything on the water) and where each shortcut's words go are src/race-chart.ts's (14 Nov),
   the one drawing the race plan's big chart in the den is too (js/den/plan-chart.js).

   One chart, everything on it, the starlit door, its tunnel and its route among the rest: since 12 Nov
   there are no hidden gems in the proof of concept (RULES.md), so the PUBLIC mode that left the door out is
   gone. Its chart is changelog/race-map.jpg, on the changelog and design.html (RACE.md §13).

   Run on the compiled js (npm run build first) with Node 22:
     node_modules/node/bin/node.exe tools/race-map.mjs <out.html> [races] [size]
   races (default 2000, about a minute) and size (racers in each, default 4) as tools/race-sim.mjs. With
   JPG=changelog/race-map.jpg it also writes the chart alone as that picture (1280 wide, by sharp), stamped with
   the course's fingerprint (chartFingerprint, src/race-sim.ts) in a JPEG comment, so tests/race-chart.test.ts
   fails when the course has changed since it was drawn (12 Nov: "hopefully we're keeping this [race map] JPEG
   in sync").

   Each label sits beside what it names (12 Nov: the user couldn't tell the gate's or the locks' labels were
   theirs, nor what the wreck was for). The start's field is each race's own (src/start-field.ts): one drawn,
   from seed 1. */

import { writeFileSync } from 'node:fs';
import { LAY, SAIL } from '../js/den-sail.js';
import { RACE } from '../js/den-race.js';
import { run, ROUTES, STYLES, SKILLS, CUTS, SIM, PACE, zoneOf, chartFingerprint } from '../js/race-sim.js';
import { CHECK } from '../js/den-checkpoint.js';
import { RIVALS } from '../js/den-rivals.js';
import { DOOR } from '../js/den-door.js';
import { fieldFor } from '../js/start-field.js';
import * as CH from '../js/race-chart.js';
import { sheet, wordsAt, legWords, label, esc } from '../js/race-chart.js';

const OUT = process.argv[2];
if (!OUT) { console.error('usage: tools/race-map.mjs <out.html> [races] [size]'); process.exit(1); }
const RACES = Number(process.argv[3]) || 2000, SIZE = Number(process.argv[4]) || 4;

/* ---- The wins ---- */
const t0 = Date.now();
const rep = run(RACES, SIZE, { mode: RACE.GAP.MODE });
console.log(`${RACES} races of ${SIZE} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const fair = 1 / SIZE;
const winOf = (t) => (t && t.n ? t.wins / t.n : 0);
const pc = (x) => `${Math.round(100 * x)}%`;
const routeWin = (name) => pc(winOf(rep.byRoute[name]));

/* ---- The course: the sheet, drawn by src/race-chart.ts (shared with the race plan's big chart in the den) ---- */
const RC = LAY.RACE, W = SAIL.COLS, FIELD = fieldFor(1);
const SHEET = sheet({ field: FIELD }), { X, Y, x0, y0 } = SHEET, VW = SHEET.w, VH = SHEET.h;
const svg = [...SHEET.layers];
const add = (s) => svg.push(s);
const { SQ, INK, SNAKE, RED, BLUE, GREEN, DOOR_INK } = CH;
const f = (n) => Math.round(n * 10) / 10;

/* ---- Words ---- */
const sv = (id) => `${Math.round(CUTS[id].saves)} s`;
const T = (t) => [t, '#5a1a0c', 700];   // a title line
const N = (t) => [t, INK, 500, 'italic'];   // a note line
const WIN = (t) => [t, '#8a1c10', 700];   // a win line
// Where a label goes: a square (c, r: fractions allowed) as the middle of its first line; or a shortcut's own
// place, as the race plan's big chart puts its words too (wordsAt).
const at = (c, r, lines, o) => add(SHEET.at(c, r, lines, o));
const AT = wordsAt(), atW = (w, lines, o) => at(w.c, w.r, lines, { anchor: w.anchor, ...o });
const S = RC.STRETCHES, SP = RC.SPITS;

// The legs, each where it starts, the way it's sailed. (Sizes in squares: the words big enough to read on a
// phone, the chart scaled to its width.)
for (const g of legWords()) at(g.c, g.r, [[g.text, '#5a1a0c', 700]], { size: 0.74, anchor: g.anchor, style: 'italic' });
// The start.
const HOP = RC.FIELD.HOP;
{
  const L = RC.LINE;
  atW(AT.line, [T('↑ starting line: pick a spot')], { size: 0.6 });
  const zones = { left: [L.c0, 15], gap: [16, 20], right: [21, L.c1] };
  for (const [z, [a, b]] of Object.entries(zones)) {
    if (zoneOf(a) !== z || zoneOf(b) !== z) throw new Error(`the starting spots' zones have moved: ${z}`);
    at((a + b) / 2, RC.START.r0 - 0.2, [WIN(`${z === 'gap' ? 'above the hop' : z} ${pc(winOf(rep.bySpot[z]))}`)], { size: 0.66 });
    add(`<path d="M${X(a) - SQ / 2 + 4} ${Y(RC.START.r0) - SQ * 0.72}v6H${X(b) + SQ / 2 - 4}v-6" fill="none" stroke="#8a1c10" stroke-width="2"/>`);
  }
  at(RC.BUOY[0] + 0.7, RC.BUOY[1] + 0.05, [N('Space by the buoy')], { size: 0.56, anchor: 'start' });
  for (const R of RIVALS) at(R.spot + 0.45, L.r + 0.7, [[R.name, INK, 700]], { size: 0.55, anchor: 'start' });
  at(RACE.LONG_SPOT, L.r - 0.66, [N('long way’s spot')], { size: 0.45 });
  // (the field: its slow winds and whirlpools each race's own; its conveyor, its hop, its wind back on the right)
  at(6, RC.FIELD.r0 + 0.55, [N('conveyor → to above the hop')], { size: 0.5 });
  at(6, RC.FIELD.r0 + 4.6, [T('The field'), N('slow winds nudge a square,'), N('whirlpools turn her round:'), N('fresh each race (one shown)')], { size: 0.5, lh: 1.1 });
  at((HOP.c0 + HOP.c1) / 2, HOP.FROM - 0.05, [T('The hop ↓ a Double'), N('over its headwinds, into a lane'), N('down onto leg 1 · about 10 s')], { size: 0.46, lh: 1.08 });
  at(W - 1.4, RC.FIELD.r1 + 0.05, [N('wind back → the hop’s lane')], { size: 0.46, anchor: 'end' });
}
const BIG = { size: 0.56, lh: 1.12 };
const sp = (k) => (SP[k].r0 + SP[k].r1) / 2;
// [A] spit 1: the fort's bay (13 Nov): the long way round it, the Empire's mole across it; the imperial gate
// through the fort at the mole's root, by buoy 1 (its words on the mole beside it); the wreck in its notch off leg 1.
atW(AT.gate, [T(`The imperial gate · ${sv('guns')} ▸`), WIN(`shot ${routeWin('gap-shot')} · run ${routeWin('gap-run')} · bribe ${routeWin('bribe')}`)], { size: 0.46, lh: 1.1 });
atW(AT.bay, [T('The fort’s bay ▸'), N('the long way round it,'), N('round the Empire’s mole;'), N('its fort and town here')], { size: 0.44, lh: 1.08 });
atW(AT.wreck, [T('The wreck ▸'), N('haul the bribe (Treasure Haul, sheltered)')], { size: 0.42, lh: 1.08 });
// [B] spit 2: the Double's gap and the headwind gap (stacked between them), the starlit door, the trade wind back.
atW(AT.double, [T('◂ Double’s gap'), N(`a Double · ${sv('double')}`)], { size: 0.44, lh: 1.05 });
atW(AT.headwind, [T('Headwind gap ▸'), N(`row it · ${sv('headwind')} · ${routeWin('headwind')}`)], { size: 0.44, lh: 1.05 });
atW(AT.door, [['◂ ★ Starlit door', DOOR_INK, 700], N('Navigation opens it'), [`up on leg 3 · ${Math.round(DOOR.SAVES)} s`, '#5a1a0c', 700]], { size: 0.44, lh: 1.05 });
atW(AT.snake, [['SNAKE ▾', SNAKE, 700], N('hop it on a'), N('Double, or 3 back')], { size: 0.42, lh: 1.05 });
// [C] spit 3: the whirlpools, the rocks, the barrier.
atW(AT.whirls, [T('Whirlpool channel ▸'), N('a Vegas carries her'), [`saves ${sv('whirls')}`, '#5a1a0c', 700], WIN(`Vegas ${routeWin('whirls')}`), N('in the open')], BIG);
atW(AT.rocks, [T('The rocks ▸'), N('3 hits, anyone’s,'), N('then open to all'), [`saves ${sv('rocks')}`, '#5a1a0c', 700], WIN(`rocks ${routeWin('rocks')}`)], { size: 0.46, lh: 1.08 });
atW(AT.forage, [T('◂ Barrier'), N('Foraging'), [`saves ${sv('forage')}`, '#5a1a0c', 700], WIN(`forage ${routeWin('forage')}`), N('sheltered')], { size: 0.5, lh: 1.1 });
// [D] spit 4: the zigzag below it (on the long way), the locks and their berth.
atW(AT.zigzag, [T('The zigzag ↓'), N(`hop on Doubles · ${sv('zigzag')}`), WIN(`long way ${routeWin('long')}`)], { size: 0.46, lh: 1.08 });
atW(AT.locks, [T(`◂ The locks · ${sv('locks')}`), N('Bilge · sheltered'), WIN(`locks ${routeWin('locks')}`)], { size: 0.46, lh: 1.08 });
atW(AT.berth, [N('▴ the berth: wait for the lock')], { size: 0.38 });
// [E] spit 5: the crane and the Triple's gap.
atW(AT.crane, [T(`The crane · ${sv('crane')} ▸`), WIN(`Carpentry · ${routeWin('crane')}`)], { size: 0.46, lh: 1.08 });
atW(AT.triple, [T('◂ Triple'), N(sv('triple'))], { size: 0.42, lh: 1.05 });
// The finish, and the left-hand trade wind's gentle loops.
atW(AT.finish, [['FINISH', '#5a1a0c', 700]], { size: 0.7 });
at(15, S[5].r + 1, [['SNAKE: a misclick, a few squares back up onto the run home', SNAKE, 700]], { size: 0.5 });
for (const k of [1, 3]) add(label(X(0) + 7, Y(sp(k)), ['SNAKE: a few back'], { size: 0.42, weight: 700, col: SNAKE, rotate: -90 }));
add('</g>');

/* ---- The page ---- */
const RT = (n) => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`;
const PUZZLE = {
  long: ['The long way round the buoys', 'Sailing on the pilot; hops the zigzag’s headwinds on Doubles'],
  'gap-run': ['The imperial gate, run a square at a time', 'no puzzle; holed by both its guns, patched by Carpentry'],
  'gap-shot': ['The imperial gate, its guns shot quiet', 'two hits a gun: her two starting shots and two more loaded by Gunnery'],
  bribe: ['The imperial gate, its guard bribed', 'Treasure Haul at the wreck in its notch off leg 1 (sheltered), then pay at the gate and be towed through'],
  headwind: ['Headwind gap, rowed', 'Rowing (mirror strokes); idle and she drifts back out'],
  doubles: ['The Double’s and Triple’s gaps', 'a Double, then a Triple, built on the move'],
  whirls: ['Whirlpool channel', 'a Sailing Vegas from its mouth; less sends her back'],
  forage: ['Barrier of driftwood', 'Foraging, from the notch in front of it'],
  locks: ['The locks', 'Bilge, pumping the up lock'],
  crane: ['The crane', 'Carpentry, building it a part at a time'],
  door: ['★ The starlit door', `Duty Navigation on the rock opens it, and it carries her through: up its cleft on leg 3, ${Math.round(DOOR.SAVES)} s`],
  rocks: ['The rocks', 'her broadsides (Gunnery loads more): three hits, anyone’s, and they’re open to every racer'],
  every: ['Every shortcut it comes to', 'the wreck and the gate’s bribe, the Double, the whirlpools, the locks, the crane'],
};
const MOVE = new Set(['guns', 'double', 'triple', 'zigzag', 'rocks']);
const kindOf = (id) => (MOVE.has(id) ? 'on the move' : id === 'headwind' ? 'rowing, slowly' : CUTS[id].sheltered ? 'stopped, sheltered' : 'stopped, exposed');
const racedBy = (name) => RIVALS.filter((R) => R.racer.route === name).map((R) => R.name).join(', ');
const maxWin = Math.max(...ROUTES.map((r) => winOf(rep.byRoute[r.name])), fair * 1.6);
const bar = (w) => `<div class="bar"><span style="width:${f((100 * w) / maxWin)}%" class="${w / fair < 0.75 ? 'lo' : w / fair > 1.25 ? 'hi' : ''}"></span><i style="left:${f((100 * fair) / maxWin)}%"></i></div>`;
const rows = ROUTES.map((R) => {
  const t = rep.byRoute[R.name], w = winOf(t), saves = R.cuts.reduce((n, id) => n + CUTS[id].saves, 0);
  const [name, how] = PUZZLE[R.name] ?? [R.name, ''];
  const kinds = [...new Set(R.cuts.map(kindOf))].join('; ');
  const by = racedBy(R.name);
  return `<tr><td><b>${esc(name)}</b><br><small>${esc(how)}${kinds ? ` · ${esc(kinds)}` : ''}${by ? ` · <em>${esc(by)}’s way</em>` : ''}</small>${bar(w)}</td><td class="n">${Math.round(saves)} s</td><td class="n"><b>${pc(w)}</b><br><small>${t ? f(w / fair).toFixed(2) : '-'}× fair</small></td></tr>`;
}).join('');
const small = (title, list, by) => `<table class="mini"><tr><th colspan="2">${title}</th></tr>${list.map((k) => `<tr><td>${esc(k)}</td><td class="n">${pc(winOf(by[k]))}</td></tr>`).join('')}</table>`;
const cutRows = Object.entries(rep.cuts).map(([id, c]) => `<tr><td>${esc(id)}</td><td class="n">${Math.round(CUTS[id].saves)}</td><td class="n">${pc(c.tried ? c.done / c.tried : 0)}</td>${SKILLS.map((k) => `<td class="n">${c.saved[k].n ? Math.round(c.saved[k].secs / c.saved[k].n) : '-'}</td>`).join('')}</tr>`).join('');
const snakes = Object.entries(rep.bySnake).map(([k, x]) => `${k === 'left' ? 'the left-hand trade wind' : 'the trade wind back across leg 3'}: ${x.n} swept (${pc(x.n / (RACES * SIZE))} of racers), ${pc(x.n ? x.wins / x.n : 0)} still won`).join('; ');
const K = rep.rocks, rocks = `down in ${pc(K.down / RACES)} of races; ${K.through} racers went through them, ${K.free} of them free on someone else\u2019s hits (they won ${pc(K.free ? K.freeWins / K.free : 0)})`;
const today = new Date().toISOString().slice(0, 10);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sloop Race Chart</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,500;0,700;1,500&display=swap" rel="stylesheet">
<style>
  :root { --ink: #4a2c14; --red: #8a1c10; --paper: #ecd9a8; }
  html, body { margin: 0; background: #2b1a0e; color: var(--ink); font: 500 17px/1.4 Alegreya, Georgia, serif; }
  main { max-width: 980px; margin: 0 auto; padding: 14px 10px 40px; }
  h1 { font-size: 30px; margin: 4px 6px 0; color: #f0ddae; letter-spacing: .5px; }
  .sub { color: #d9c08c; margin: 2px 6px 12px; font-style: italic; }
  svg { width: 100%; height: auto; display: block; font-family: Alegreya, Georgia, serif; }
  .card { background: radial-gradient(ellipse at center, #f0ddae 0%, #dcc08a 80%, #c49a5e 100%); border-radius: 6px; padding: 14px 14px 10px; margin: 16px 0; box-shadow: 0 2px 12px #0008; }
  h2 { margin: 0 0 6px; font-size: 22px; color: #5a1a0c; }
  table { border-collapse: collapse; width: 100%; }
  td, th { padding: 6px 4px; border-bottom: 1px solid #4a2c1433; vertical-align: top; text-align: left; }
  td.n { text-align: right; white-space: nowrap; }
  small { font-size: 14px; }
  .bar { position: relative; height: 12px; margin: 6px 0 2px; max-width: 420px; background: #4a2c1418; border-radius: 3px; }
  .bar span { position: absolute; left: 0; top: 0; bottom: 0; background: #6f4a24; border-radius: 3px; }
  .bar span.lo { background: #9b2a14; } .bar span.hi { background: #2f5a24; }
  .bar i { position: absolute; top: -4px; bottom: -4px; border-left: 2px dashed var(--red); }
  .minis { display: flex; flex-wrap: wrap; gap: 12px; }
  .mini { width: auto; min-width: 150px; flex: 1; }
  .key { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 6px 14px; font-size: 15px; }
  .key div { display: flex; gap: 8px; align-items: center; }
  .key svg { width: 34px; height: 22px; flex: none; }
  .fine { color: #b89a6a; font-size: 13px; margin: 18px 6px 0; }
  .fair { font-style: italic; }
</style></head>
<body><main>
<h1>The Sloop Race: a chart of the course</h1>
<p class="sub">Every shortcut, snake and wind (no gambles), and who wins by which way round: ${RACES} races of ${SIZE} simulated. Out to sea is up; the race starts at the bottom and winds up to the finish.</p>
<svg viewBox="${f(x0)} ${f(y0)} ${f(VW)} ${f(VH)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chart of the sloop race course">${svg.join('\n')}</svg>
<div class="card"><h2>The key</h2><div class="key">
  <div><svg viewBox="0 0 34 22"><path d="M2 11h30" stroke="${RED}" stroke-width="3" stroke-dasharray="8 5"/></svg>the long way, round the numbered buoys (${RT(SIM.LONG)}, ${f(PACE)} s a square)</div>
  <div><svg viewBox="0 0 34 22"><path d="M2 11h30" stroke="${GREEN}" stroke-width="3.4" stroke-dasharray="2 7" stroke-linecap="round"/></svg>a shortcut's way through a spit</div>
  <div><svg viewBox="0 0 34 22"><rect x="6" y="0" width="22" height="22" fill="rgba(170,45,20,.16)"/><path d="M8 11h17m-6 -5l6 5l-6 5" stroke="${SNAKE}" stroke-width="3" fill="none"/></svg>a snake: a wind that carries her a few squares back</div>
  <div><svg viewBox="0 0 34 22"><rect x="6" y="0" width="22" height="22" fill="rgba(40,74,96,.16)"/><path d="M8 11h17m-6 -5l6 5l-6 5" stroke="${BLUE}" stroke-width="2.6" fill="none"/></svg>a wind, the way it blows (a headwind to hop, the start's field, the whirlpools')</div>
  <div><svg viewBox="0 0 34 22"><rect x="6" y="0" width="22" height="22" fill="url(#k-shelter)" stroke="rgba(47,90,36,.7)"/><defs><pattern id="k-shelter" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(70,120,50,.18)"/><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(47,90,36,.55)" stroke-width="3"/></pattern></defs></svg>sheltered: safe to puzzle, even in the lead</div>
  <div><svg viewBox="0 0 34 22"><rect x="6" y="0" width="22" height="22" fill="url(#k-exp)" stroke="rgba(155,42,20,.7)"/><defs><pattern id="k-exp" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="8" height="8" fill="rgba(170,40,20,.12)"/><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(155,42,20,.5)" stroke-width="2.5"/></pattern></defs></svg>stopped in the open: a sitting duck for anyone behind</div>
  <div><svg viewBox="0 0 34 22"><rect x="2" y="2" width="30" height="18" rx="3" fill="none" stroke="${SNAKE}" stroke-width="2" stroke-dasharray="6 4"/></svg>a gun gap gun's reach (${CHECK.REACH} squares any way); crosshairs: the squares it's trained on</div>
  <div><svg viewBox="0 0 34 22"><circle cx="17" cy="11" r="9" fill="none" stroke="${BLUE}" stroke-width="2"/><path d="M17 11m-3 0a3 3 0 1 1 6 0a6 6 0 1 1 -12 0" fill="none" stroke="${BLUE}" stroke-width="2"/></svg>a whirlpool: stop on one and it has her; a gust zooms her over</div>
  <div><svg viewBox="0 0 34 22"><path d="M10 20v-26" stroke="${INK}"/><path d="M10 4l14 5l-14 5Z" fill="#b8322a" stroke="${INK}"/></svg>a rival's spot on the line (Kikkit red, Tzz blue, Dalnoth gold); the gold ring, the long way's</div>
  <div><svg viewBox="0 0 34 22"><rect x="8" y="2" width="18" height="18" fill="none" stroke="${BLUE}" stroke-width="1.4" stroke-dasharray="3 3"/><path d="M12 11h10m-4 -4l4 4l-4 4" stroke="${BLUE}" stroke-width="2.2" fill="none"/></svg>a slow wind: a nudge of a square after each move</div>
  <div><svg viewBox="0 0 34 22"><path d="M6 18L10 6L17 4L24 7L28 18Z" fill="#a39684" stroke="${INK}" stroke-width="1.6"/></svg>rocks: across the rocks' gap, blasted open in a race</div>
</div></div>
<div class="card"><h2>Who wins, by which way round</h2>
<p class="fair">Fair is ${pc(fair)}: one race in ${SIZE}, in fields of ${SIZE}, each racer a different way round, a racing style and a skill drawn at random, and a level better at her own way's puzzle. The dashed line on each bar is fair; green is more than a quarter over it, red more than a quarter under. "Saves" is over the long way, for a decent player's puzzling (the puzzle's time is on top).</p>
<table><tr><th>Way round</th><th class="n">Saves</th><th class="n">Wins</th></tr>${rows}</table></div>
<div class="card"><h2>And the rest of the field</h2><div class="minis">
${small('By style', STYLES.map((s) => s.name), rep.byStyle)}
${small('By skill', SKILLS, rep.bySkill)}
${small('By starting spot', ['left', 'gap', 'right'], rep.bySpot)}
${small('Stopped in the open, won the race', ['leader', 'pack', 'last'], Object.fromEntries(Object.entries(rep.byPosition).map(([k, p]) => [k, { n: p.n, wins: p.wins }])))}
</div>
<p><small><b>Snakes:</b> ${esc(snakes) || 'none bit'}.</small></p>
<p><small><b>The rocks:</b> ${esc(rocks)}.</small></p>
<p><small><b>Stopped in the open, hit there:</b> leader ${pc(rep.byPosition.leader.n ? rep.byPosition.leader.hit / rep.byPosition.leader.n : 0)}, in the pack ${pc(rep.byPosition.pack.n ? rep.byPosition.pack.hit / rep.byPosition.pack.n : 0)}, last ${pc(rep.byPosition.last.n ? rep.byPosition.last.hit / rep.byPosition.last.n : 0)}.</small></p>
<h2>What each shortcut really saved</h2>
<table><tr><th>Shortcut</th><th class="n">Laid to save</th><th class="n">Done</th><th class="n">decent</th><th class="n">good</th><th class="n">great</th></tr>${cutRows}</table>
<p><small>Seconds, mean, by the racer's skill, her puzzling counted; less than nothing, it cost her.</small></p></div>
<p class="fine">Drawn ${today}, for the Pirate Den’s changelog and design page, by tools/race-map.mjs from the course as laid (LAY.RACE) and src/race-sim.ts's computer racers (gun gap guns '${RACE.GAP.MODE}'); run it again after a change to the course.</p>
</main></body></html>
`;
writeFileSync(OUT, html);
console.log(`Wrote ${OUT}`);

/* The chart alone as a picture (JPG=...): the svg 1280 wide, a headless Chrome's screenshot of it (CHROME=its
   path, or the usual place on Windows), stamped with the course's fingerprint in a JPEG comment (FF FE), read
   back by tests/race-chart.test.ts. */
if (process.env.JPG) {
  const { execFileSync } = await import('node:child_process');
  const { readFileSync, rmSync } = await import('node:fs');
  const { pathToFileURL } = await import('node:url');
  const WPX = 1280, HPX = Math.round((WPX * VH) / VW);
  const page = `${OUT}.chart.html`, shot = `${OUT}.chart.jpg`;
  writeFileSync(page, `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,500;0,700;1,500&display=swap" rel="stylesheet"><style>html,body{margin:0;background:#2b1a0e}svg{display:block;width:${WPX}px;height:${HPX}px;font-family:Alegreya,Georgia,serif}</style></head><body><svg viewBox="${f(x0)} ${f(y0)} ${f(VW)} ${f(VH)}" xmlns="http://www.w3.org/2000/svg">${svg.join('\n')}</svg></body></html>`);
  const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${WPX},${HPX}`, '--virtual-time-budget=6000', `--screenshot=${shot}`, pathToFileURL(page).href], { stdio: 'ignore' });
  const jpg = readFileSync(shot);
  rmSync(page); rmSync(shot);
  if (jpg[0] !== 0xff || jpg[1] !== 0xd8) throw new Error('the screenshot isn\'t a JPEG');
  const note = Buffer.from(`race-course:${chartFingerprint()}`, 'latin1'), seg = Buffer.alloc(4);
  seg.writeUInt16BE(0xfffe, 0); seg.writeUInt16BE(note.length + 2, 2);
  writeFileSync(process.env.JPG, Buffer.concat([jpg.subarray(0, 2), seg, note, jpg.subarray(2)]));
  console.log(`Wrote ${process.env.JPG} (${WPX} by ${HPX}), course ${chartFingerprint()}`);
}
