// The captain's map's tour and its quests (the rules and the words: src/den-finds.ts), drawn over the
// map while you read it (map.js). The user (10 Nov): "I just know there's a lot of stuff in here and I
// want to make it discoverable given it's a proof of concept demo." The first time you open the map a
// short tour points round it, a caption at a time on a scrap of parchment, the part it's about ringed
// in red ink; beside the map, always, a scrap with the quests: the den's jobs, and what's still out
// there to find, teased by its count.
import { TOUR, QUESTS_TITLE, quests, questLine, done, tourKey } from '../den-finds.js';
import { onMap, SHEET } from '../den-map.js';
import { SAIL } from '../den-sail.js';
import { $, camera, G, keep, V3 } from './world.js';
import { ramp } from './land.js';
import { sail } from './sea.js';
import { umami } from './capybara.js';
import { crane } from './crane.js';

// The tour's shown once in this browser (as your pirate's look is kept: world.js); T on the map
// shows it again.
const SEEN = 'carp.den.tour';
const seen = () => { try { return !!JSON.parse(localStorage.getItem(SEEN)); } catch { return false; } };
export const tour = { step: -1, card: null, ring: null, list: null, sig: '', hint: '' };
export const touring = () => tour.step >= 0;

/* How the den stands, for the list. The ways past the checkpoint are kept in G.found as she finds
   them (checkpoint.js); the rest is read off the den as it is: the rampart's and the shack's frames
   up (land.js), the wrecks' treasure aboard (treasure.js, crane.js), Umami out of his trap
   (capybara.js), the hidden cove and the lagoon come on (said there the first time: sailing.js,
   crane.js). */
function progress() {
  const jobs = ramp?.jobs ?? [];
  const up = (kind) => { const js = jobs.filter((j) => j.kind === kind); return js.length > 0 && js.every((j) => j.up); };
  const found = [...(G.found ?? [])];
  if (sail.said?.cove) found.push('cove');
  if (crane.said?.lagoon) found.push('lagoon');
  return {
    walk: up('deck'), stairs: up('stair'), tower: up('gun'), shack: up('house'),
    x: !!sail.wreckSalvage?.done, lagoonChest: !!crane.rules?.salvage?.done,
    umami: !!umami.rules && umami.rules.stage !== 'stuck', found,
  };
}

function make() {
  if (tour.list) return;
  tour.list = document.createElement('div');
  tour.list.className = 'quests';
  tour.card = document.createElement('div');
  tour.card.className = 'tour-card';
  tour.card.addEventListener('mousedown', (e) => { e.stopPropagation(); tourStep(e.button === 2 ? 'arrowleft' : 'click'); });
  tour.ring = document.createElement('div');
  tour.ring.className = 'tour-ring';
  document.body.append(tour.list, tour.ring, tour.card);
  $('map-hint').addEventListener('mousedown', (e) => { if (e.target.closest('.tour-btn')) { e.stopPropagation(); tourStart(); } });
}

/** The tour from its first step (opening the map the first time, or T on it). */
export function tourStart() {
  make();
  tour.step = 0;
  keep(SEEN, true);
}
/** Opening the map: the tour, if it's not been seen in this browser yet. */
export function tourMaybe() { if (!seen()) tourStart(); }
/** A key (or 'click') while the tour's on: on, back, or skipped altogether. */
export function tourStep(key) { tour.step = tourKey(tour.step, key); }

// The list, written out: a tick for each done, a box for each still to do.
function listHtml() {
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<h3>${QUESTS_TITLE}</h3>` + quests(progress()).map((g) => `<h4>${g.title}</h4><ul>${g.quests.map((q) => `<li class="${done(q) ? 'got' : ''}${q.secret ? ' secret' : ''}"><b>${done(q) ? '✓' : ''}</b>${esc(questLine(q))}</li>`).join('')}</ul>`).join('');
}

const P = V3(0, 0, 0);
/* A point of the sheet (0 to 1 across, down) on screen, the map lying open as `map` is: its group,
   and its size (metres). */
function onScreen(map, u, v) {
  P.set((u - 0.5) * map.w, 0.012, (v - 0.5) * map.d);
  map.g.localToWorld(P).project(camera);
  return [(P.x + 1) / 2 * innerWidth, (1 - P.y) / 2 * innerHeight];
}

/** Each frame: the list and the tour over the map, while it's open (`map`: chart.g, its size, how
    far it's unrolled, whether it's being read). */
export function questsTick(map) {
  make();
  if (!map.on) tour.step = -1;   // (rolled up: the tour's over)
  const open = map.on && map.g && map.open > 0.97;
  // The list: rewritten when something on it changes.
  const html = open ? listHtml() : tour.sig;
  if (html !== tour.sig) { tour.sig = html; tour.list.innerHTML = html; }
  tour.list.classList.toggle('on', !!open);
  const step = open && touring() ? TOUR[tour.step] : null;
  tour.list.classList.toggle('lit', !!step?.quests);
  // The hint along the bottom: the tour's keys while it's on, else how to roll it up, and the tour again.
  const hint = touring()
    ? '<kbd>Space</kbd>, click or <kbd>→</kbd>: next · <kbd>←</kbd>: back · <kbd>Esc</kbd>: skip the tour'
    : '<kbd>M</kbd>, <kbd>Esc</kbd> or <kbd>Space</kbd>: roll it up · <button class="tour-btn"><kbd>T</kbd> the tour</button>';
  if (hint !== tour.hint) { tour.hint = hint; $('map-hint').innerHTML = hint; }
  tour.card.classList.toggle('on', !!step);
  tour.ring.classList.toggle('on', !!step?.at);
  if (!step) return;
  const text = `<p>${step.say}</p><small>${tour.step + 1} of ${TOUR.length}</small>`;
  if (tour.card.dataset.step !== String(tour.step)) { tour.card.dataset.step = String(tour.step); tour.card.innerHTML = text; }
  // The ring round the part it's about: the box of squares it covers, as it lies on screen.
  let low = false;
  if (step.at) {
    const [u, v] = onMap(step.at), [sw, sh] = step.size ?? [3, 3];
    const du = sw / SAIL.COLS * (SHEET.U1 - SHEET.U0) / 2, dv = sh / SAIL.ROWS * (SHEET.V1 - SHEET.V0) / 2;
    const pts = [[u - du, v - dv], [u + du, v - dv], [u - du, v + dv], [u + du, v + dv]].map(([a, b]) => onScreen(map, a, b));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), pad = 14;
    Object.assign(tour.ring.style, { left: `${x0 - pad}px`, top: `${y0 - pad}px`, width: `${x1 - x0 + pad * 2}px`, height: `${y1 - y0 + pad * 2}px` });
    low = (y0 + y1) / 2 > innerHeight * 0.55;
  }
  // The card out of the ring's way: along the top when the ring's low on the map, else the bottom.
  tour.card.classList.toggle('high', low);
}
