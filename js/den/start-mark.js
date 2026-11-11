// Something new to start, offered where you're looking: a marker over the thing itself (the crane's
// chalked frame on the ledge, the hook, Umami's bank, the old sloop), clickable, Space as ever. Any
// place can offer one: an offer is { at, label, go }, `at` where the thing is in the world, `go` what
// starts it (what Space does there). One at a time, as the prompt at the bottom is one at a time. Where
// it goes on the screen, or whether it's out of sight: src/start-mark.ts (markAt). Each place says
// what it offers (crane.js, craneOffer; sailing.js, sailOffer gathers the sea's) and den.js shows the
// one there is each frame, after the camera's set.
import { markAt } from '../start-mark.js';
import { camera, v3 } from './world.js';

const mark = { el: null, offer: null, label: '', pulsed: new Set(), bandT: 0, top: 0, bottom: 0 };

function make() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'startmark';
  el.tabIndex = -1;   // (never focused: Space stays the den's)
  el.innerHTML = '<span></span><kbd>Space</kbd>';
  // A click (or a tap) on it starts the thing; the sea or the den under it never hears of it.
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
  el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const o = mark.offer; if (o) { hide(); o.go(); } });
  document.body.append(el);
  return el;
}
function hide() {
  mark.offer = null;
  if (mark.el) mark.el.style.display = 'none';
}

/** Each frame, once the camera's set: the offer there is just now ({ at: a Vector3, label, go }), or
    null; `hold` hides it whatever (paused, a cutscene, the map, the game over). */
export function startMark(offer, hold = false, dt = 0) {
  if (!offer || hold) { hide(); return; }
  const el = (mark.el ||= make());
  // The band it's kept in: below the den's panel, above the prompt at the foot (measured now and then).
  if ((mark.bandT -= dt) <= 0) {
    mark.bandT = 0.5;
    mark.top = document.querySelector('.hud')?.getBoundingClientRect().bottom ?? 0;
    mark.bottom = document.getElementById('dock')?.getBoundingClientRect().top ?? innerHeight;
    if (el.style.display === 'block') mark.half = el.offsetWidth / 2;   // (its size, as the screen's changed)
  }
  if (offer.label !== mark.label) { mark.label = offer.label; el.firstChild.textContent = offer.label; mark.half = 0; mark.fresh = true; }
  v3.copy(offer.at).project(camera);
  const p = markAt(v3, { w: innerWidth, h: innerHeight, top: mark.top, bottom: mark.bottom }, mark.half);
  if (!p) { hide(); return; }
  mark.offer = offer;
  el.style.display = 'block';
  mark.half ||= el.offsetWidth / 2;   // (measured once it's shown, for each label)
  if (mark.fresh) {
    mark.fresh = false;
    // Each offer pulses the first time it comes up only (RULES.md, "Something new to do stands out").
    el.classList.remove('pulse');
    if (!mark.pulsed.has(offer.label)) { mark.pulsed.add(offer.label); void el.offsetWidth; el.classList.add('pulse'); }
  }
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y}px`;
}
