/* Mischievious's wedding (IDEAS.md, "A Puzzle Pirates wedding"): a third place, like the sea, on her
   island. weddingEnter() takes you there and weddingLeave() home (the cheat "Mischievious's wedding",
   den.html?at=wedding, and later the sea map, use them). You choose the tone first (Happy and cheesy,
   or Dark humour), and the venue's shown as she left it: pretty, or a wreck from the last one, with
   her welcome. Then the planner down the right, her reacting to everything in a speech bubble: who you
   marry (her, in which of her looks; a line of suitors, blind-date style; or someone of your own), the
   venue, a theme (its layout and its guests' outfits), tuning it all (pick up, move, turn, recolour
   or take away any prop, add more, redress a guest), the plot, and "Start the wedding": the ceremony
   (wedding-ceremony.js), ending on a framed portrait to save or share as a link
   (den.html?at=wedding&w=...), which opens straight into that wedding, ready to play again. The set-up's
   kept in this browser as you go. Sailed to (her isle on the sea: isle.js), leaving puts you back
   aboard her at its jetty; by the cheat, back in the den. The rules and words: src/den-wedding.ts. The island and its pirates:
   wedding-scene.js; the props: wedding-props.js; a big wedding's crowd: wedding-crowd.js. While you
   choose the guests (how many, cosy to half the Ocean; each one yours to dress, move and turn) and
   decorate (the furnisher's whole shop, by kind), the camera's yours to roam: look round, slide, zoom. */
import * as THREE from 'three';
import * as LOOK from '../den-look.js';
import {
  TONES, VENUES, THEMES, PLOTS, PROPS, SUGGEST, ARRIVE, WELCOME, RETURN, GUARDS, PROP_R, AREA, MAX_PROPS, DYE_NAMES, SECURITY, RAIDERS,
  ASK_HER, answer, STAND, onSomeone, Gush, fresh, dressFor, moveTo, clean, encode, decode, seatsFor, suitors, suitorTitle, themeOf, themeLook, caption, readSecs, cleanProp,
  WHO, SIZES, MAX_GUESTS, SEEDS, PROP_GROUPS, MADE_IN, GROUNDS, clashes, restsOn, withSize, reseed, moveGuest, dressedUp, baseGuest, standFree, plainLook,
} from '../den-wedding.js';
import { $, scene, camera, renderer, hemi, skyDome, paintSky, keep, myLook, V3, toast as denToast, toastQuiet, toastHush, warm, sunOver, ray, burst, wearLook, worldLets, shake } from './world.js';
import { cine, cinePlay, cineEnd, cineLets, bubble, bubbleAt, stepTo } from './cine.js';
import { ISLE, VENUE_AT, ISLE_SKY, buildIsle, figure, dropFigure, poseFig, restArms, dressable, heartsTick, heartsClear, roomy } from './wedding-scene.js';
import { propMesh } from './wedding-props.js';
import { crowdMake, crowdSet, crowdPose, crowdPick } from './wedding-crowd.js';
import { dressLook } from './menus.js';
import { ceremony, portraitCam } from './wedding-ceremony.js';

const KEY = 'carp.den.wedding';
// (the den's own news is kept quiet while you're here: these are the island's)
const toast = (text, bad = false) => denToast(text, bad, false, true);
const STEPS = [['partner', 'Who'], ['venue', 'Where'], ['theme', 'Theme'], ['guests', 'Guests'], ['tune', 'Decorate'], ['plot', 'How it goes']];
/** The steps where you go round with the camera, picking guests and props (the user, 11 Nov: "go around
    like with a camera and click on each pirate and configure them"). */
const ROAM = new Set(['guests', 'tune']);
const roaming = () => ROAM.has(wed.step);
const newSeed = () => Math.floor(Math.random() * SEEDS);
const { mis: MIS_SPOT, you: YOU_SPOT, partner: PARTNER_SPOT } = STAND;
/** Her looks to choose from (js/den-look.js), or a stand-in till they're there. */
function versions() {
  const v = LOOK.MISCHIEVIOUS_VERSIONS;
  if (Array.isArray(v) && v.length) return v;
  return [{ title: 'Mischievious', look: LOOK.PIRATES?.Mischievious || { body: 'f', skin: 2, hair: 'long', hairCol: 'black', patch: false, smile: true, hat: 'none', top: 'corset', topCol: 'magenta', topCol2: 'black', legs: 'long', legsCol: 'magenta', feet: 'shoes', feetCol: 'black' } }];
}
const hex = (c) => LOOK.dyeHex(c);
const dyesHere = () => DYE_NAMES.filter((d) => LOOK.DYES[d]);

/** All there is of the wedding just now. */
export const wed = {
  on: false, snap: false, w: null, step: 'tone', pick: null, isle: null, root: null, propsG: null, propG: [], fig: null,
  gush: new Gush(), sel: null, tool: null, drag: null, rdrag: null, yaw: 0, zoom: 1, shot: null, play: null,
  /** The roaming camera: tilted (added to the usual), and panned (metres, on the venue). */
  tilt: 0, pan: { x: 0, z: 0 }, pdrag: null, gdrag: null, group: 'seats', crowd: null, camDist: 10,
  line: null, bub: null, show: null, lineup: null, welcome: null, portrait: null, settle: 0, sky: null, ring: null, mark: null,
  /** Come by sea (her isle's jetty: isle.js), so leaving's back aboard; and whether you've had a
      wedding yet (the captain's map's quests: quests.js). */
  bySea: false, had: false,
  /** Played by touch (a phone or tablet): the planner's hints say tap, drag and pinch. */
  touch: matchMedia('(pointer: coarse)').matches,
};

// ---------- kept as you go ----------
function save() { keep(KEY, encode(wed.w)); }
function kept() { try { const s = JSON.parse(localStorage.getItem(KEY)); return typeof s === 'string' ? decode(s) : null; } catch { return null; } }
function setLink(code) {
  try {
    const u = new URL(location.href);
    u.searchParams.set('at', 'wedding');
    if (code) u.searchParams.set('w', code); else u.searchParams.delete('w');
    history.replaceState(history.state, '', u);
    return u.href;
  } catch { return location.href; }
}

// ---------- names ----------
const yourName = () => { try { return localStorage.getItem('carp.den.name')?.trim() || 'You'; } catch { return 'You'; } };
function partnerName() {
  const p = wed.w?.partner;
  if (!p) return 'your sweetheart';
  if (p.kind === 'her') return 'Mischievious';
  if (p.kind === 'suitor') return suitors(wed.w.tone)[p.i]?.name || 'your sweetheart';
  return String(p.look.name || '').trim() || 'your sweetheart';
}

// ---------- the place and its pirates ----------
function enterSky() {
  wed.sky = { col: skyDome.geometry.attributes.color, bg: scene.background.clone(), fog: scene.fog.color.clone(), hemi: [hemi.color.clone(), hemi.groundColor.clone()] };
  paintSky(ISLE_SKY.zenith, ISLE_SKY.horizon);
  hemi.color.set(ISLE_SKY.hemi[0]); hemi.groundColor.set(ISLE_SKY.hemi[1]);
}
function leaveSky() {
  const s = wed.sky;
  if (!s) return;
  skyDome.geometry.setAttribute('color', s.col);
  scene.background.copy(s.bg); scene.fog.color.copy(s.fog);
  hemi.color.copy(s.hemi[0]); hemi.groundColor.copy(s.hemi[1]);
  sunOver(0, 0, 0);
  wed.sky = null;
}
/** The venue root to where the venue is, and the sun's shadows over it. */
function placeVenue() {
  const at = VENUE_AT[wed.w.venue] || VENUE_AT.beach;
  wed.root.position.copy(at);
  const w = V3(0, 0, 0); wed.isle.updateMatrixWorld(true); wed.root.localToWorld(w);
  sunOver(w.x, w.y, w.z);
}
function buildProps() {
  wed.propsG.clear();
  wed.propG = wed.w.props.map((p, i) => {
    const g = propMesh(p);
    g.userData.prop = p; g.userData.i = i;
    // (a cake, a punch bowl, candles or presents on a table sit on it)
    if (restsOn(p, wed.w.props)) g.position.y = 0.78;
    wed.propsG.add(g);
    return g;
  });
}
const seats = () => seatsFor(wed.w.props, wed.w.guests.length || 8, wed.w.spots);
/** Everyone, afresh: you, Mischievious, your partner, the security, the guests (in their seats), and
    the raiders (hidden till they crash it). */
function buildCast() {
  const F = wed.fig;
  if (F) [F.you, F.mis, F.partner, ...F.guards, ...F.guests, ...F.raiders, ...(wed.lineup?.list || [])].forEach(dropFigure);
  wed.lineup = null;
  const R = wed.root, w = wed.w;
  const mis = figure(R, misLook(), { ...MIS_SPOT });
  const fig = { mis, you: figure(R, myLook, { ...YOU_SPOT }), guards: SECURITY.map((l, i) => figure(R, l, { x: GUARDS[i].x, z: GUARDS[i].z, yaw: i ? -Math.PI / 2 : Math.PI / 2, sword: true })), guests: [], raiders: RAIDERS.map((l) => figure(R, l, { x: 9, z: 0, sword: true })), partner: null };
  fig.raiders.forEach((r) => { r.g.visible = false; });
  wed.fig = fig;
  partnerFigure();
  guestsFigures();
}
function misLook() {
  const p = wed.w?.partner, vs = versions();
  return (p?.kind === 'her' ? vs[p.ver] || vs[0] : vs[wed.show?.i ?? 0] || vs[0]).look;
}
function partnerFigure() {
  const F = wed.fig, p = wed.w.partner;
  if (F.partner && F.partner !== F.mis) dropFigure(F.partner);
  F.partner = null;
  if (!p) return;
  if (p.kind === 'her') { F.partner = F.mis; wearLook(F.mis, dressable(misLook())); return; }
  const s = p.kind === 'suitor' ? suitors(wed.w.tone)[p.i] : null;
  F.partner = figure(wed.root, s ? s.look : p.look, { ...PARTNER_SPOT, hurt: !!s?.hurt, bouquet: s ? 'rose' : null });
}
/* The guests: the first few drawn whole, and anyone you've dressed, moved or picked; the rest (a big
   wedding's crowd) cheap figures, all in one go (wedding-crowd.js). */
const FULL = () => (wed.touch ? 10 : 16);
function whole(i) { return i < FULL() || (wed.sel?.kind === 'guest' && wed.sel.i === i) || (wed.gdrag?.i === i) || wed.w.spots.some((s) => s.i === i) || dressedUp(wed.w, i); }
/** The figure of the i-th guest, if they're drawn whole. */
const figOf = (i) => wed.fig?.guests.find((g) => g.gi === i) || null;
/** Every guest drawn afresh (`all`), or just those now to be drawn whole or not, and the crowd. */
function guestsFigures(all = true) {
  const F = wed.fig, st = seats();
  if (all) { F.guests.forEach(dropFigure); F.guests = []; }
  F.guests = F.guests.filter((g) => { if (g.gi < wed.w.guests.length && whole(g.gi)) return true; dropFigure(g); return false; });
  wed.w.guests.forEach((l, i) => {
    if (!whole(i) || figOf(i)) return;
    const g = figure(wed.root, l, { x: st[i].x, z: st[i].z, yaw: st[i].yaw });
    g.gi = i; g.sit = st[i].sit; g.g.userData.guest = i;
    F.guests.push(g);
  });
  F.guests.sort((a, b) => a.gi - b.gi);
  crowdFill(st);
}
function crowdFill(st = seats()) {
  const list = [];
  wed.w.guests.forEach((l, i) => { if (!figOf(i)) list.push({ i, look: dressable(l), x: st[i].x, z: st[i].z, yaw: st[i].yaw }); });
  crowdSet(wed.crowd, list);
}
function reseat() {
  const st = seats();
  wed.fig.guests.forEach((g) => { if (g.gi !== wed.gdrag?.i) Object.assign(g, { x: st[g.gi].x, z: st[g.gi].z, yaw: st[g.gi].yaw, sit: st[g.gi].sit }); });
  wed.crowd.list.forEach((f) => Object.assign(f, { x: st[f.i].x, z: st[f.i].z, yaw: st[f.i].yaw }));
  crowdPose(wed.crowd);
}
const everyone = () => { const F = wed.fig; return F ? [F.you, F.mis, ...(F.partner && F.partner !== F.mis ? [F.partner] : []), ...F.guards, ...F.guests] : []; };

// ---------- her lines ----------
function say(fig, text, secs = null) {
  if (!fig || !text) { wed.line = null; return; }
  if (wed.line?.text !== text) wed.bub.textContent = text;
  wed.line = { fig, text, until: performance.now() + 1000 * (secs ?? readSecs(text) * 1.5 + 1.2), giggle: 0.7 };
}
const gush = (ev) => say(wed.fig.mis, wed.gush.say(ev));
/* Asking her things as you plan (the user, 11 Nov: "You could ask her"): your question over you, then
   her answer, the usual way her lines show; unless something else has been said in between. Small,
   in the planner's foot: she's the host, not the show. */
function ask(i) {
  const q = ASK_HER[i]?.q;
  if (!q) return;
  asks(false);
  const secs = readSecs(q) + 0.6;
  say(wed.fig.you, q, secs);
  const mine = wed.line;
  clearTimeout(wed.askT);
  wed.askT = setTimeout(() => {
    if (wed.on && STEPS.some(([id]) => id === wed.step) && (!wed.line || wed.line === mine)) say(wed.fig.mis, answer(i, wed.w.tone));
  }, secs * 1000);
}
/** The list of questions open (or shut). */
function asks(on) {
  const L = $('wed-asks');
  if (on && !L.childElementCount) ASK_HER.forEach((x, i) => L.append(btn(x.q, () => ask(i))));
  L.hidden = !on;
  $('wed-ask').classList.toggle('on', on);
  $('wed-ask').setAttribute('aria-expanded', String(on));
}
$('wed-ask').onclick = (e) => { e.currentTarget.blur(); asks($('wed-asks').hidden); };

// ---------- entering and leaving ----------
function fade(then) {
  const f = $('wed-fade');
  f.classList.add('on');
  setTimeout(() => { then(); setTimeout(() => f.classList.remove('on'), 120); }, 360);
}
/** Off to her island (from the den by the cheat, or ashore off the sloop at her isle's jetty: `bySea`).
    The set-up from a share link (?w=), else the one kept in this browser, else a fresh one: the tone
    to choose first. */
export function weddingEnter({ bySea = false } = {}) {
  if (wed.on) return;
  wed.bySea = bySea;
  $('wed-home').textContent = bySea ? 'Back aboard' : 'Back to the den';
  wed.isle ||= buildIsle();
  if (!wed.root) {
    wed.root = new THREE.Group(); wed.propsG = new THREE.Group(); wed.root.add(wed.propsG); wed.isle.add(wed.root);
    wed.bub = bubble('', document.body, 'wrap wed-say');
    wed.ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.85, depthWrite: false }));
    wed.ring.renderOrder = 3; wed.root.add(wed.ring);
    wed.crowd = crowdMake(wed.root, MAX_GUESTS);
  }
  fade(() => {
    wed.on = true; wed.snap = true; wed.isle.visible = true; toastQuiet.on = true; toastHush();
    document.body.classList.add('wedding');
    tuck(false);
    enterSky();
    const code = new URLSearchParams(location.search).get('w'), shared = code ? decode(code) : null, mine = kept();
    let ev = null;
    if (shared) { wed.w = shared; wed.step = 'plot'; ev = 'shared'; }
    else if (mine?.theme && mine.partner) { wed.w = mine; wed.step = 'tune'; ev = 'back'; }
    else { wed.w = fresh('happy'); wed.step = 'tone'; }
    if (code && !shared) toast('That wedding link didn\'t work: a fresh one, then', true);
    wed.gush = new Gush(wed.w.tone);
    Object.assign(wed, { pick: null, sel: null, tool: null, show: null, yaw: 0, zoom: 1, tilt: 0, pan: { x: 0, z: 0 }, portrait: null });
    placeVenue(); buildProps(); buildCast();
    panel();
    warm(wed.isle);
    if (ev) comeBack(ev); else arrive();
  });
}
/** Home again: the den as it was, or, come by sea, back aboard her at the isle's jetty (she's waited
    there, moored, the sea going on as it was: sailing.js). */
export function weddingLeave() {
  if (!wed.on) return;
  fade(() => {
    if (wed.play || wed.welcome) { wed.leaving = true; cineEnd(true); wed.leaving = false; }
    wed.on = false; wed.snap = true; wed.isle.visible = false; toastQuiet.on = false;
    cineLets.cineView = 0;   // (straight back, not easing out of the island's last shot across the sea)
    document.body.classList.remove('wedding');
    $('wed-portrait').classList.remove('on');
    wed.bub.style.display = 'none'; wed.line = null;
    heartsClear();
    leaveSky();
    try { const u = new URL(location.href); u.searchParams.delete('w'); if (u.searchParams.get('at') === 'wedding') u.searchParams.delete('at'); history.replaceState(history.state, '', u); } catch { /* never mind */ }
    if (wed.bySea) denToast('Back aboard, off the Wedding Isle');
    wed.bySea = false;
  });
}

// ---------- as you arrive: her greeting, the tone, and her welcome ----------
/** Where you and she meet, at the top of the aisle (in the front kept clear of guests), for her greeting
    and welcome. */
const MEET_YOU = { x: 0.3, z: -1.0 }, MEET_HER = { x: 0, z: -2.3 };
function meetUp() { const F = wed.fig; Object.assign(F.you, { ...MEET_YOU, yaw: Math.PI }); Object.assign(F.mis, { ...MEET_HER, yaw: 0 }); }
function toSpots() { const F = wed.fig; Object.assign(F.you, { ...YOU_SPOT, yaw: 0 }); Object.assign(F.mis, { ...MIS_SPOT, yaw: 0 }); }
/** The camera close on her as she talks, or on the two of you, from the side. */
function herShot(C, dist, yaw, tilt = 0.13) { const m = wed.fig.mis; shot(C, m.x, 1.4, m.z, dist, tilt, yaw); }
function twoShot(C, dist, yaw = 1.3) { const F = wed.fig; shot(C, (F.mis.x + F.you.x) / 2, 1.4, (F.mis.z + F.you.z) / 2, dist, 0.22, yaw); }   // (from the side, past the front row's end)
/* A little cutscene of her talking (cine.js: Space, Esc or a double tap skips it), a line a beat, the
   camera on each beat's shot (`frame(C, beat, secs into it)`), then `end()`. `meet`: you walk up the
   aisle and she comes to meet you, if you're not there already. */
function talk(lines, frame, end, meet = false) {
  const F = wed.fig, beats = lines.map((text) => readSecs(text) + 0.9);
  const c = { t: 0, cam: { look: V3(), dist: 6, tilt: 0.2, yaw: 0.5 }, tick, end: fin };
  frame(c.cam, 0, 0);
  wed.welcome = c;
  cinePlay(c);
  panel();
  function tick(dt) {
    const t = (c.t += dt);
    let i = 0, t0 = 0;
    while (i < beats.length && t > t0 + beats[i]) t0 += beats[i++];
    if (i >= beats.length) { cineEnd(false); return; }
    const L = t - t0, moving = new Set();
    if (meet) {
      if (!stepTo(F.you, F.you, MEET_YOU.x, MEET_YOU.z, 2.2, dt)) moving.add(F.you); else F.you.yaw = Math.PI;
      F.you.g.position.x = F.you.x; F.you.g.position.z = F.you.z;
      if (i >= 1 || t > 1.2) { if (!stepTo(F.mis, F.mis, MEET_HER.x, MEET_HER.z, 1.8, dt)) moving.add(F.mis); else F.mis.yaw = 0; F.mis.g.position.x = F.mis.x; F.mis.g.position.z = F.mis.z; }
    }
    everyone().forEach((p) => { restArms(p); if (!moving.has(p)) poseFig(p, dt); else p.yaw = p.g.rotation.y; });
    // (giggly, hands clasped, a little bounce as she talks)
    if (!moving.has(F.mis)) { F.mis.arms.forEach((a, j) => a.rotation.set(-1.1, 0, j ? -0.45 : 0.45)); F.mis.g.position.y = Math.abs(Math.sin(L * 8)) * 0.04; }
    if (L > 0.25) say(F.mis, lines[i], 99); else say(null);
    frame(c.cam, i, L);
  }
  function fin(skip) { wed.welcome = null; if (!wed.leaving) end(skip); }
}
/* As you arrive (the user, 11 Nov: "opening more with a cutscene where ... she explains to you what it
   is"): close on her as you walk up, her greeting; her venue behind her; then she asks what sort of
   wedding, the tone's choice in the planner, the two of you held close while you choose. */
function arrive() {
  const F = wed.fig;
  Object.assign(F.mis, { ...MEET_HER, yaw: 0 }); Object.assign(F.you, { x: 0.3, z: 3.4, yaw: Math.PI });
  talk(ARRIVE, (C, i, L) => {
    if (i === 0) herShot(C, 4.2 - L * 0.12, -0.14, 0.3);   // (from up the aisle, as you walk up it)
    else if (i === 1) shot(C, 0, 1.1, -1.6, (8.5 + L * 0.3) * roomy(), 0.42, 0.5 - L * 0.04);   // (the venue behind her, over the guests' heads)
    else twoShot(C, 4.4);
  }, () => { meetUp(); panel(); say(F.mis, ARRIVE.at(-1), 99); }, true);
}
function chooseTone(tone) {
  wed.w = fresh(tone, newSeed());
  wed.gush = new Gush(tone);
  wed.step = 'welcome';
  placeVenue(); buildProps(); buildCast();
  save();
  welcome();
}
/* The tone chosen: the venue as she left it (pretty, or the wreck and its security), what you do here,
   each line its own beat, close on the two of you; then she asks. */
function welcome() {
  const lines = WELCOME[wed.w.tone], F = wed.fig, dark = wed.w.tone === 'dark';
  meetUp();
  talk(lines, (C, i, L) => {
    if (i === 0) shot(C, 0, 0.8, -1.2, (9.5 - L * 0.4) * roomy(), 0.4, 0.75 - L * 0.1);   // (the venue as she left it)
    else if (i === 1 && dark) shot(C, 3.2, 1.1, -3.2, 7.5, 0.4, 0.55);   // (the security)
    else twoShot(C, 4.4);
  }, () => {
    toSpots();
    wed.step = 'partner';
    panel();
    say(F.mis, `${lines.at(-1)} ${wed.gush.say('ask')}`);
  });
}
/* Back again, a wedding already planned: a shorter welcome, close on her, then over to where you left off. */
function comeBack(ev) {
  const lines = [wed.gush.say(ev), ...RETURN[wed.w.tone]];
  talk(lines, (C, i, L) => {
    if (i === 0) herShot(C, 4.4 - L * 0.1, -0.95);   // (from her side of the front, clear of the guests)
    else { const P = planCam(); C.look.copy(P.look); Object.assign(C, { dist: P.dist, tilt: P.tilt, yaw: P.yaw }); }
  }, () => panel());
}
function shot(C, x, y, z, dist, tilt, yaw) { C.look.set(x, y, z); wed.root.localToWorld(C.look); Object.assign(C, { dist, tilt, yaw }); }

// ---------- who you marry ----------
function pickHer(ver) {
  const first = wed.w.partner?.kind !== 'her';
  wed.show = null;
  wed.w.partner = { kind: 'her', ver };
  partnerFigure();
  twirl(wed.fig.mis);
  save(); panel();
  gush(first ? 'her' : 'version');
}
// She models each of her looks in turn, each by its portrait's title, till you pick one.
function startShow() {
  wed.pick = 'her';
  wed.show = { i: wed.w.partner?.kind === 'her' ? wed.w.partner.ver : 0, t: 0, n: 0 };
  modelLook();
  panel();
}
function modelLook() {
  const v = versions()[wed.show.i];
  wearLook(wed.fig.mis, dressable(v.look));
  twirl(wed.fig.mis);
  say(wed.fig.mis, `"${v.title}"`, 2.8);
  panel();
}
function twirl(p) { p.twirl = 0.8; }
// "Here are your bachelors!" A line of them walks in, bouquets out, and each steps forward in turn.
function startLineup() {
  wed.pick = 'suitors';
  wed.show = null;
  if (wed.fig.partner && wed.fig.partner !== wed.fig.mis) wed.fig.partner.g.visible = false;
  wed.lineup?.list.forEach(dropFigure);
  const list = suitors(wed.w.tone).map((s, i, all) => {
    const x = -3.5 + i * 7 / Math.max(1, all.length - 1);
    const f = figure(wed.root, s.look, { x: 8 + i * 1.2, z: -3.5, yaw: -Math.PI / 2, hurt: !!s.hurt, bouquet: 'rose' });
    f.home = x;
    return f;
  });
  wed.lineup = { list, i: -1, t: 0, phase: 'walk' };
  Object.assign(wed.fig.you, { x: 0, z: -1.2, yaw: Math.PI });   // (watching them, like a game show's contestant)
  wearLook(wed.fig.mis, dressable(misLook()));
  Object.assign(wed.fig.mis, { x: -5, z: -3.0, yaw: 0.5 });
  say(wed.fig.mis, wed.gush.say('bachelors'), 2.5);
  panel();
}
function pickSuitor(i) {
  const L = wed.lineup, f = L && L.phase !== 'off' ? L.list[i] : null;
  wed.w.partner = { kind: 'suitor', i };
  partnerFigure();
  // The one you picked comes over to stand by you; the rest walk off.
  if (f) {
    Object.assign(wed.fig.partner, { x: f.x, z: f.z });
    wed.fig.partner.walkTo = { ...PARTNER_SPOT };
    dropFigure(f);
    L.list.splice(i, 1);
    L.phase = 'off';
  }
  Object.assign(wed.fig.mis, { x: MIS_SPOT.x, z: MIS_SPOT.z, yaw: 0 });
  Object.assign(wed.fig.you, { ...YOU_SPOT, yaw: 0 });
  save(); panel();
  gush(i === 0 ? 'suitorOne' : 'suitor');
}
function pickOwn(body = null) {
  wed.pick = 'own';
  wed.show = null;
  endLineup();
  const old = wed.w.partner?.kind === 'own' ? wed.w.partner.look : null;
  const b = body || (old?.body === 'm' || old?.body === 'f' ? old.body : Math.random() < 0.5 ? 'm' : 'f');
  const look = { ...LOOK.randomLook(b), name: old?.name || '' };
  wed.w.partner = { kind: 'own', look: clean({ partner: { kind: 'own', look } }).partner.look };
  wearLook(wed.fig.mis, dressable(misLook()));
  partnerFigure();
  twirl(wed.fig.partner);
  save(); panel();
  gush('own');
}
/* Your partner of your own in the wardrobe, as you dress yourself (the user, 11 Nov: "it should let you
   do like the same as like when you're dressing yourself ... you could do random, but you need to be
   able to customize them"): every piece, dye and familiar, their name, Surprise me; dressed as you go. */
function dressOwn() {
  if (wed.w.partner?.kind !== 'own') return;
  dressLook({
    title: 'Your sweetheart', look: wed.w.partner.look,
    onChange: (look) => {
      if (wed.w.partner?.kind !== 'own') return;
      wed.w.partner = { kind: 'own', look: clean({ partner: { kind: 'own', look } }).partner.look };
      if (wed.fig.partner && wed.fig.partner !== wed.fig.mis) wearLook(wed.fig.partner, dressable(wed.w.partner.look));
      save();
    },
    onClose: () => { if (wed.on) { twirl(wed.fig.partner); panel(); gush('own'); } },
  });
}
function endLineup() {
  const L = wed.lineup;
  if (!L) return;
  L.list.forEach(dropFigure);
  wed.lineup = null;
  if (wed.fig.partner) wed.fig.partner.g.visible = true;
  Object.assign(wed.fig.you, { ...YOU_SPOT, yaw: 0 });
  Object.assign(wed.fig.mis, { x: MIS_SPOT.x, z: MIS_SPOT.z, yaw: 0 });
}

// ---------- where, the theme, and tuning it ----------
function chooseVenue(id) {
  wed.w = moveTo(wed.w, id);
  placeVenue(); buildProps(); reseat();
  save(); panel();
  gush(`venue_${id}`);
}
function chooseTheme(id) {
  wed.w = dressFor(wed.w, id);
  wed.sel = null;
  buildProps(); guestsFigures();
  const v = V3(0, 1.2, 0); wed.root.localToWorld(v);
  for (const d of themeOf(id).dyes.slice(0, 3)) burst(v, hex(d), 12, 4);
  save(); panel();
  gush(`theme_${id}`);
}
const selProp = () => (wed.sel?.kind === 'prop' ? wed.w.props[wed.sel.i] : null);
const selGuest = () => (wed.sel?.kind === 'guest' && wed.sel.i < wed.w.guests.length ? wed.sel.i : null);
function propsChanged(ev) {
  buildProps(); reseat(); save(); panel();
  if (ev) gush(ev);
}
/** Whether a prop can stand at p: never on her, the couple or the guards, nor in another prop (one
    that's already in something, as the wreck leaves them, may move out of it). */
const fits = (p, i = -1, was = null) => !onSomeone(p) && (!clashes(p, wed.w.props, i) || (was && clashes(was, wed.w.props, i)));
function addProp(k, x, z) {
  if (wed.w.props.length >= MAX_PROPS) { say(wed.fig.mis, 'Ooh, it\'s full! Take something away first, and we\'ll squeeze it in.'); return false; }
  const T = themeOf(wed.w.theme), c = MADE_IN[k] || (T ? T.dyes[wed.w.props.length % 3] : 'rose');
  const p = cleanProp({ k, x, z, r: 0, c });
  if (onSomeone(p)) { say(wed.fig.mis, 'Not on top of us, love! A bit further off.'); return false; }
  if (clashes(p, wed.w.props)) { say(wed.fig.mis, 'Ooh, something\'s there already! A little to the side?'); return false; }
  wed.w.props.push(p);
  wed.sel = { kind: 'prop', i: wed.w.props.length - 1 };
  const v = V3(p.x, 0.4, p.z); wed.root.localToWorld(v); burst(v, '#fff3c4', 10, 2.4);
  // (her line for the very thing, unless she's just said it)
  propsChanged(wed.gush.pool(`add_${k}`).some((l) => l !== wed.gush.last) ? `add_${k}` : 'add');
  return true;
}
/** Another of the one you've picked, just beside it. */
function another() {
  const p = selProp(); if (!p) return;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1.5, 1], [-1.5, 1], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
    const d = Math.max(0.5, PROP_R[p.k] * 1.6), q = cleanProp({ ...p, x: p.x + dx * d, z: p.z + dz * d });
    if (q && (q.x !== p.x || q.z !== p.z) && !onSomeone(q) && !clashes(q, wed.w.props) && wed.w.props.length < MAX_PROPS) { delete q.w; wed.w.props.push(q); wed.sel = { kind: 'prop', i: wed.w.props.length - 1 }; propsChanged('add'); return; }
  }
  say(wed.fig.mis, 'Ooh, no room beside it! Somewhere else, perhaps?');
}
function turnProp(d) { const p = selProp(); if (!p) return; const was = { ...p }; p.r = (p.r + d + 8) % 8; if (!fits(p, wed.sel.i, was)) { p.r = was.r; return; } propsChanged('turn'); }
function colourProp(c) { const p = selProp(); if (!p) return; p.c = c; propsChanged('colour'); }
function removeProp() {
  const p = selProp(); if (!p) return;
  wed.w.props.splice(wed.sel.i, 1);
  wed.sel = null;
  propsChanged('remove');
}

// ---------- the guests: how many, and each one yours ----------
function chooseSize(id) {
  wed.w = withSize(wed.w, id);
  if (selGuest() === null) wed.sel = null;
  guestsFigures(false);
  save(); panel();
  gush(`size_${id}`);
}
function newCrowd() {
  wed.w = reseed(wed.w, newSeed());
  guestsFigures(true);
  save(); panel();
  gush('crowd');
}
/** A guest picked: drawn whole, if they weren't already, and their ring on. */
function pickGuest(i) {
  wed.sel = { kind: 'guest', i };
  if (!figOf(i)) guestsFigures(false);
  twirl(figOf(i));
}
function redress(i) {
  const g = wed.w.guests[i], body = g.body === 'f' ? 'f' : 'm';
  wed.w.guests[i] = { ...themeLook(wed.w.theme || 'rosy', body), ...(g.name ? { name: g.name } : {}) };
  regDress(i);
  gush('dress');
}
function surprise(i) { const n = wed.w.guests[i].name; wed.w.guests[i] = plainLook({ ...LOOK.randomLook(), ...(n ? { name: n } : {}) }); regDress(i); gush('dress'); }
function recolour(i, c) { wed.w.guests[i] = { ...wed.w.guests[i], topCol: c, hatCol: c }; regDress(i); gush('dress'); }
function asTheyCame(i) { wed.w.guests[i] = baseGuest(wed.w.theme, wed.w.seed, i); regDress(i); }
function regDress(i) {
  if (!figOf(i)) guestsFigures(false);
  const f = figOf(i);
  if (!f) return;
  wearLook(f, dressable(wed.w.guests[i]));
  f.g.userData.guest = i;
  twirl(f);
  save(); panel();
}
const guestName = (i) => String(wed.w.guests[i]?.name || '').trim() || `Guest ${i + 1}`;
/* A guest in the wardrobe, as you dress yourself (the user, 11 Nov: "click on each pirate and configure
   them"): every piece, dye and familiar, a name, Surprise me; dressed as you go. */
function dressGuest(i) {
  dressLook({
    title: guestName(i), look: dressable(wed.w.guests[i]),
    onChange: (look) => {
      if (!wed.w.guests[i]) return;
      wed.w.guests[i] = plainLook(look);
      if (!figOf(i)) guestsFigures(false);
      const f = figOf(i);
      if (f) { wearLook(f, dressable(wed.w.guests[i])); f.g.userData.guest = i; }
      save();
    },
    onClose: () => { if (wed.on) { twirl(figOf(i)); panel(); gush('dress'); } },
  });
}
/** A guest turned where they stand (an eighth at a time). */
function turnGuest(i, d) {
  const st = seats(), s = st[i], sp = wed.w.spots.find((x) => x.i === i);
  const r = ((sp ? sp.r : Math.round(s.yaw / (Math.PI / 4))) + d + 16) % 8;
  const w = moveGuest(wed.w, st, i, s.x, s.z, r);
  if (!w) return;
  wed.w = w; reseat(); save(); panel();
}
function backToPlace(i) { wed.w.spots = wed.w.spots.filter((s) => s.i !== i); reseat(); save(); panel(); }

// ---------- the wedding itself, and its portrait ----------
function startWedding() {
  if (!wed.w.partner || !wed.w.theme) return;
  endLineup();
  wed.sel = null; wed.tool = null; wed.show = null; wed.gdrag = null; wed.drag = null; wed.pdrag = null;
  say(null);
  save();
  wed.step = 'playing';
  panel();
  ceremony({
    get w() { return wed.w; }, root: wed.root, fig: wed.fig, propG: wed.propG,
    names: () => ({ you: yourName(), partner: partnerName() }), seats, dyes: () => themeOf(wed.w.theme)?.dyes.slice(0, 4) || ['rose', 'pink', 'white'],
    hex, say: (f, text) => say(f, text, 99), shake: () => { worldLets.shake = Math.max(shake, 0.15); }, set play(v) { wed.play = v; },
    // (the crowd: turned to the camera for the cheer and the portrait, bouncing as they cheer)
    crowd: (beat, t) => { const g = beat === 'cheer' || beat === 'portrait'; if (g || wed.crowd.posed) { wed.crowd.posed = g; crowdPose(wed.crowd, beat === 'cheer' ? (k) => Math.abs(Math.sin(t * 8 + k * 1.7)) * 0.16 : null, g ? 0 : null); } },
  }, (skipped) => {
    wed.play = null;
    if (wed.leaving) return;
    wed.had = true;
    wed.step = 'portrait';
    wed.settle = skipped ? 1.3 : 0.7;   // (the camera's still easing in from wherever the cutscene was)
    const P = portraitCam(wed.w.guests.length); wed.shot = { look: P.look.clone(), dist: P.dist * roomy(), tilt: P.tilt, yaw: P.yaw }; wed.root.localToWorld(wed.shot.look);
  });
}
/* The last shot, held: drawn once more just now and read off the canvas (it doesn't keep what it
   drew, so it's read straight after), then framed in gilt with its caption. */
function takePortrait() {
  renderer.render(scene, camera);
  const src = renderer.domElement, sw = src.width, sh = src.height;
  // A 4:3 window on the middle of the view.
  const w = Math.min(sw, sh * 4 / 3), h = w * 3 / 4, sx = (sw - w) / 2, sy = (sh - h) / 2;
  const OUT = 1200, oh = OUT * 3 / 4, pad = 46, cap = 112;
  const cv = document.createElement('canvas');
  cv.width = OUT + pad * 2; cv.height = oh + pad * 2 + cap;
  const g = cv.getContext('2d');
  const gold = g.createLinearGradient(0, 0, cv.width, cv.height);
  gold.addColorStop(0, '#7a5216'); gold.addColorStop(0.3, '#f2cf6a'); gold.addColorStop(0.55, '#a8761f'); gold.addColorStop(0.8, '#f6dc86'); gold.addColorStop(1, '#6e4812');
  g.fillStyle = gold; g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = 'rgba(60, 35, 8, .7)'; g.lineWidth = 4; g.strokeRect(12, 12, cv.width - 24, cv.height - 24);
  g.strokeRect(pad - 8, pad - 8, OUT + 16, oh + 16);
  g.drawImage(src, sx, sy, w, h, pad, pad, OUT, oh);
  // A soft vignette, like an old painting.
  const vg = g.createRadialGradient(pad + OUT / 2, pad + oh / 2, oh * 0.45, pad + OUT / 2, pad + oh / 2, OUT * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,20,5,.45)');
  g.fillStyle = vg; g.fillRect(pad, pad, OUT, oh);
  g.fillStyle = '#f6ecd2'; g.fillRect(pad, pad + oh + 18, OUT, cap - 30);
  g.strokeStyle = '#7a5216'; g.lineWidth = 2; g.strokeRect(pad, pad + oh + 18, OUT, cap - 30);
  g.fillStyle = '#3a2210'; g.textAlign = 'center';
  g.font = '700 36px Alegreya, Georgia, serif';
  g.fillText(caption(wed.w, yourName(), partnerName()), cv.width / 2, pad + oh + 60);
  g.font = 'italic 20px Alegreya, Georgia, serif';
  g.fillText('On the Wedding Isle, with love', cv.width / 2, pad + oh + 88);
  wed.portrait = cv.toDataURL('image/png');
  $('wed-img').src = wed.portrait;
  $('wed-portrait').classList.add('on');
  panel();
}
function closePortrait(again) {
  $('wed-portrait').classList.remove('on');
  wed.portrait = null;
  heartsClear();
  if (again) {
    wed.w = fresh(wed.w.tone, newSeed());
    wed.pick = null;
    setLink(null);
    save();
  }
  wed.step = again ? 'partner' : 'plot';
  wed.shot = null;
  placeVenue(); buildProps(); buildCast();
  panel();
  if (again) gush('again');
}
$('wed-save').onclick = () => {
  if (!wed.portrait) return;
  const a = document.createElement('a');
  a.href = wed.portrait;
  a.download = `wedding-${partnerName().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
  document.body.append(a); a.click(); a.remove();
};
$('wed-link').onclick = () => {
  const href = setLink(encode(wed.w));
  const ok = () => toast('Link copied: it opens this wedding, ready to play again');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(href).then(ok, () => toast('The link\'s in the address bar, to copy'));
  else toast('The link\'s in the address bar, to copy');
};
$('wed-again').onclick = () => closePortrait(true);
$('wed-close').onclick = () => closePortrait(false);
$('wed-home').onclick = (e) => { e.currentTarget.blur(); weddingLeave(); };
$('wed-afresh').onclick = (e) => {
  e.currentTarget.blur();
  if (wed.play || wed.welcome) return;
  endLineup();
  wed.w = fresh('happy', newSeed()); wed.step = 'tone'; wed.sel = null; wed.tool = null; wed.show = null; wed.pick = null; wed.pan = { x: 0, z: 0 }; wed.tilt = 0;
  setLink(null);
  try { localStorage.removeItem(KEY); } catch { /* never mind */ }
  placeVenue(); buildProps(); buildCast(); panel(); say(null);
};

// ---------- the planner ----------
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
function opt(name, blurb, on, click, tag = '') {
  const b = el('button', 'opt' + (on ? ' on' : ''));
  if (tag) b.append(el('em', '', tag));
  b.append(document.createTextNode(name));
  if (blurb) b.append(el('small', '', blurb));
  b.onclick = (e) => { e.currentTarget.blur(); click(); };
  return b;
}
function btn(text, click, cls = '') { const b = el('button', cls, text); b.onclick = (e) => { e.currentTarget.blur(); click(); }; return b; }
function swatches(row, cur, set, list) {
  for (const d of list) {
    const b = el('button', 'sw' + (d === cur ? ' cur' : ''));
    b.style.background = hex(d); b.title = d; b.setAttribute('aria-label', d);
    b.onclick = () => set(d);
    row.append(b);
  }
}
const can = (step) => step === 'partner' || (step === 'venue' || step === 'theme' ? !!wed.w.partner : !!(wed.w.partner && wed.w.theme));
function go(step) {
  if (!can(step)) return;
  if (step !== 'partner') { endLineup(); wed.show = null; if (wed.w.partner?.kind === 'her' || wed.pick === 'her') { wearLook(wed.fig.mis, dressable(misLook())); } }
  if (!ROAM.has(step)) { wed.sel = null; wed.tool = null; }
  if (step !== 'tune') wed.tool = null;
  wed.step = step; wed.peek = null;
  panel();
  if (step === 'theme' && !wed.w.theme) say(wed.fig.mis, `Ooh, a theme! Shall we start from ${themeOf(SUGGEST[wed.w.tone].theme).name.toLowerCase()}? Or anything you like!`);
  if (step === 'plot') say(wed.fig.mis, 'And how shall it go? I do love a bit of drama. Or none! Your choice.');
}
function panel() {
  const box = $('wed-body'), steps = $('wed-steps'), w = wed.w;
  $('wed').classList.toggle('off', ['welcome', 'playing', 'portrait'].includes(wed.step));
  // (asking her: at every planning step, not before she's welcomed you nor in the ceremony)
  const planning = STEPS.some(([id]) => id === wed.step);
  $('wed-ask').hidden = !planning;
  if (!planning) { asks(false); clearTimeout(wed.askT); }
  steps.replaceChildren(...(wed.step === 'tone' ? [] : STEPS.map(([id, name]) => { const b = btn(name, () => go(id), wed.step === id ? 'on' : ''); b.disabled = !can(id); return b; })));
  box.replaceChildren();
  const h = (t) => box.append(el('h3', '', t)), note = (t) => box.append(el('p', 'note', t));
  const next = (label, step) => { const b = btn(label, () => go(step), 'next'); b.disabled = !can(step); box.append(b); };
  if (wed.step === 'tone') {
    h('What sort of wedding would you like?');
    note('Your wedding, your way: who, where, the guests, every stick of furniture, and how it goes.');
    for (const t of TONES) box.append(opt(t.name, t.blurb, false, () => chooseTone(t.id)));
  } else if (wed.step === 'partner') {
    h('Who are you marrying?');
    box.append(opt(WHO.her.name, WHO.her.blurb, w.partner?.kind === 'her' || wed.pick === 'her', startShow));
    if (wed.pick === 'her') {
      note('She\'ll model each of her looks for you. Which one?');
      const r = el('div', 'row');
      versions().forEach((v, i) => r.append(btn(v.title, () => pickHer(i), (w.partner?.kind === 'her' && w.partner.ver === i && !wed.show) || wed.show?.i === i ? 'on' : '')));
      box.append(r);
    }
    box.append(opt(WHO.suitors.name, WHO.suitors.blurb, w.partner?.kind === 'suitor' || wed.pick === 'suitors', startLineup));
    if (wed.pick === 'suitors') {
      const r = el('div', 'row');
      suitors(w.tone).forEach((s, i) => r.append(btn(`${suitorTitle(s, i)}: ${s.name}`, () => pickSuitor(i), w.partner?.kind === 'suitor' && w.partner.i === i ? 'on' : '')));
      box.append(r);
    }
    box.append(opt(WHO.own.name, WHO.own.blurb, w.partner?.kind === 'own', () => pickOwn()));
    if (w.partner?.kind === 'own') {
      const r = el('div', 'row');
      r.append(btn('Dress them', dressOwn, 'on'), btn('Someone else', () => pickOwn()), btn('A man', () => pickOwn('m'), w.partner.look.body === 'm' ? 'on' : ''), btn('A woman', () => pickOwn('f'), w.partner.look.body === 'f' ? 'on' : ''));
      box.append(r);
      const nr = el('div', 'row'), inp = el('input');
      inp.placeholder = 'Their name'; inp.maxLength = 18; inp.value = w.partner.look.name || '';
      inp.oninput = () => { const v = inp.value.replace(/[^a-z0-9 '-]/gi, '').slice(0, 18); w.partner.look.name = v; if (!v) delete w.partner.look.name; save(); };
      inp.onkeydown = (e) => { if (e.key === 'Enter' || e.key === 'Escape') inp.blur(); };
      nr.append(el('span', 'note', 'Name: '), inp);
      box.append(nr);
    }
    next('Next: where?', 'venue');
  } else if (wed.step === 'venue') {
    h('Where shall it be?');
    for (const v of VENUES) {
      // (each shown as you point at it, or pick it)
      const b = opt(v.name, v.blurb, w.venue === v.id, () => { wed.peek = null; chooseVenue(v.id); });
      b.onmouseenter = b.onfocus = () => { wed.peek = v.id; };
      b.onmouseleave = b.onblur = () => { if (wed.peek === v.id) wed.peek = null; };
      box.append(b);
    }
    next('Next: the theme', 'theme');
  } else if (wed.step === 'theme') {
    h('Pick a theme to start from');
    note('It lays out the venue and dresses the guests. Change anything you like after.');
    const pick = SUGGEST[w.tone].theme;
    for (const t of [...THEMES].sort((a, b) => (b.id === pick) - (a.id === pick))) box.append(opt(t.name, t.blurb, w.theme === t.id, () => chooseTheme(t.id), t.id === pick ? 'her pick ♥' : ''));
    next('Next: the guests', 'guests');
  } else if (wed.step === 'guests' || wed.step === 'tune') {
    const tune = wed.step === 'tune', T = themeOf(w.theme), first = T ? [...T.dyes] : [], dyes = [...first, ...dyesHere().filter((d) => !first.includes(d))];
    const tap = wed.touch ? 'Tap' : 'Click';
    // What you've picked, first: a prop (turn, dye, another, take away) or a guest (dress, move, turn).
    const p = selProp(), gi = selGuest();
    if (p) {
      h(PROPS.find(([k]) => k === p.k)[1] + (p.w ? ' (wrecked)' : ''));
      const r1 = el('div', 'row');
      r1.append(btn('⟲ Turn', () => turnProp(1)), btn('Turn ⟳', () => turnProp(-1)), btn('Another one', another));
      if (p.w) r1.append(btn('Mend it', () => { p.w = false; delete p.w; propsChanged('add'); }));
      r1.append(btn('Take it away', removeProp), btn('Done', () => { wed.sel = null; panel(); }));
      box.append(r1);
      const r2 = el('div', 'row');
      swatches(r2, p.c, colourProp, dyes);
      box.append(r2);
    } else if (gi !== null) {
      const moved = w.spots.some((x) => x.i === gi);
      h(guestName(gi));
      const r1 = el('div', 'row');
      r1.append(btn('Dress them', () => dressGuest(gi), 'on'), btn('Surprise me', () => surprise(gi)), btn('Something else to wear', () => redress(gi)));
      if (dressedUp(w, gi)) r1.append(btn('As they came', () => asTheyCame(gi)));
      box.append(r1);
      const r3 = el('div', 'row');
      r3.append(btn('⟲ Turn', () => turnGuest(gi, 1)), btn('Turn ⟳', () => turnGuest(gi, -1)));
      if (moved) r3.append(btn('Back to their place', () => backToPlace(gi)));
      r3.append(btn('Done', () => { wed.sel = null; panel(); }));
      box.append(r3);
      note(`Their colours (or drag them anywhere there's room${wed.touch ? '' : '; Q/E turn them'}):`);
      const r2 = el('div', 'row');
      swatches(r2, w.guests[gi].topCol, (c) => recolour(gi, c), dyes);
      box.append(r2);
    }
    if (!tune) {
      if (gi === null) h('Who\'s coming?');
      for (const z of SIZES) box.append(opt(`${z.name}: ${z.n}`, z.blurb, w.size === z.id, () => chooseSize(z.id)));
      const r = el('div', 'row');
      r.append(btn('A different crowd', newCrowd));
      box.append(r);
      note(`${tap} any guest to dress them, then drag them anywhere there's room. ${wed.touch ? 'Drag to look round, two fingers to slide the view, pinch to zoom.' : 'Right-drag looks round, drag the ground to slide the view, the wheel zooms.'}`);
      next('Next: decorate', 'tune');
    } else {
      if (!p && gi === null) h('Make it yours');
      // The furnisher's, by kind (the user, 11 Nov: "some feel for getting lost in the furniture placement").
      const tabs = el('div', 'row wed-tabs');
      for (const g of PROP_GROUPS) tabs.append(btn(g.name, () => { wed.group = g.id; panel(); }, wed.group === g.id ? 'on' : ''));
      box.append(tabs);
      const G = PROP_GROUPS.find((g) => g.id === wed.group) || PROP_GROUPS[0], r = el('div', 'row');
      for (const k of G.kinds) r.append(btn(PROPS.find(([q]) => q === k)[1], () => { wed.tool = wed.tool === k ? null : k; wed.sel = null; panel(); }, wed.tool === k ? 'on' : ''));
      box.append(r);
      if (wed.tool) note(`${tap} where the ${PROPS.find(([k]) => k === wed.tool)[1].toLowerCase()} goes (${wed.touch ? 'tap it again' : 'Esc'}: never mind).`);
      else note(wed.touch ? 'Tap a prop or a guest to pick them, and drag them about. Drag anywhere else to look round, two fingers to slide the view, pinch to zoom.' : 'Click a prop or a guest to pick them up and drag them about. Right-drag looks round, drag the ground to slide the view, the wheel zooms.');
      note(`${w.props.length} of ${MAX_PROPS} props${wed.touch ? '' : ' · Q/E turn · Delete takes it away · WASD slides the view'}`);
      next('Next: how it goes', 'plot');
    }
    const rc = btn('Recentre the view', () => { wed.pan = { x: 0, z: 0 }; wed.tilt = 0; wed.yaw = 0; wed.zoom = 1; }, 'mini');
    box.append(rc);
  } else if (wed.step === 'plot') {
    h('How does the wedding go?');
    const sug = SUGGEST[w.tone].plots;
    for (const p of [...PLOTS].sort((a, b) => sug.includes(b.id) - sug.includes(a.id))) box.append(opt(p.name, p.blurb, w.plot === p.id, () => { w.plot = p.id; save(); panel(); gush(`plot_${p.id}`); }, sug[0] === p.id ? 'her pick ♥' : ''));
    const b = btn('Start the wedding!', startWedding, 'go');
    b.disabled = !can('plot');
    box.append(b);
    note(`${yourName()} & ${partnerName()}, ${VENUES.find((v) => v.id === w.venue).where}.`);
  }
}

// ---------- the mouse and keys on her island ----------
function aim(e) { ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera); }
function groundAt(e) {
  aim(e);
  const o = V3(0, 0, 0); wed.root.localToWorld(o);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -o.y), p)) return null;
  return wed.root.worldToLocal(p);
}
/** What's under the pointer: a prop, a guest (drawn whole, or one of the crowd), or nothing. */
function picked(e) {
  aim(e);
  let best = null;
  const hits = ray.intersectObjects([wed.propsG, ...wed.fig.guests.map((g) => g.g)], true);
  for (const h of hits) {
    let o = h.object, got = null;
    while (o && o !== wed.root && !got) {
      if (o.userData.guest !== undefined) got = { kind: 'guest', i: o.userData.guest };
      else if (o.userData.i !== undefined && o.parent === wed.propsG) got = { kind: 'prop', i: o.userData.i };
      o = o.parent;
    }
    if (got) { best = { ...got, d: h.distance }; break; }
  }
  const c = crowdPick(wed.crowd, ray);
  if (c && (!best || c.d < best.d)) best = { kind: 'guest', i: c.i, d: c.d };
  if (best) return best;
  // (a flat splatter's easy to miss: the nearest prop to where you clicked, if you're right by it)
  const g = groundAt(e);
  if (!g) return null;
  wed.w.props.forEach((p, i) => { const d = Math.hypot(p.x - g.x, p.z - g.z); if (d < Math.min(0.7, PROP_R[p.k]) && (!best || d < best.d)) best = { kind: 'prop', i, d }; });
  return best;
}
const inArea = (p) => p && Math.abs(p.x) <= AREA.x && p.z >= AREA.z0 && p.z <= AREA.z1;
/* The roaming camera (the user, 11 Nov: "go around like with a camera and click on each pirate"): it
   looks round (turns and tilts), slides over the venue and zooms, while you're at the guests and
   decorating. Dragging the ground slides it, the way a map's dragged. */
function lookRound(dx, dy) {
  wed.yaw -= dx * 0.006;
  if (roaming()) wed.tilt = Math.max(-0.45, Math.min(0.85, wed.tilt + dy * 0.004));
}
function slide(dx, dy) {
  const k = wed.camDist / Math.max(300, innerHeight) * 1.15, a = 0.22 + wed.yaw;
  wed.pan.x = Math.max(-9, Math.min(9, wed.pan.x + (-Math.cos(a) * dx - Math.sin(a) * dy) * k));
  wed.pan.z = Math.max(-7, Math.min(9, wed.pan.z + (Math.sin(a) * dx - Math.cos(a) * dy) * k));
}
const zoomBy = (f) => { wed.zoom = Math.max(roaming() ? 0.18 : 0.45, Math.min(2.6, wed.zoom * f)); };
export function weddingDown(e) {
  if (!wed.on || cine) return;
  if (e.button === 2) { wed.rdrag = { x: e.clientX, y: e.clientY }; return; }
  if (e.button === 1 && roaming()) { wed.pdrag = { x: e.clientX, y: e.clientY, moved: true }; e.preventDefault?.(); return; }
  if (e.button !== 0 || !roaming()) return;
  if (wed.tool) {
    const g = groundAt(e);
    if (inArea(g) && addProp(wed.tool, g.x, g.z)) { wed.tool = null; panel(); }
    return;
  }
  const hit = picked(e);
  if (!hit) { wed.pdrag = { x: e.clientX, y: e.clientY, moved: false }; return; }   // (the ground: slide the view, or a click lets go of what's picked)
  if (hit.kind === 'prop') {
    wed.sel = { kind: 'prop', i: hit.i };
    const g = groundAt(e), p = wed.w.props[hit.i];
    // (a table takes what's on it along with it)
    const on = wed.w.props.map((q, j) => j).filter((j) => restsOn(wed.w.props[j], [p]));
    wed.drag = { i: hit.i, moved: false, dx: g ? p.x - g.x : 0, dz: g ? p.z - g.z : 0, on, was: { ...p } };
  } else {
    pickGuest(hit.i);
    const f = figOf(hit.i), g = groundAt(e);
    wed.gdrag = { i: hit.i, moved: false, x: e.clientX, y: e.clientY, dx: g && f ? f.x - g.x : 0, dz: g && f ? f.z - g.z : 0, ok: true };
  }
  panel();
}
export function weddingMove(e) {
  if (!wed.on) return;
  if (wed.rdrag && e.buttons & 2) {
    lookRound(e.clientX - wed.rdrag.x, e.clientY - wed.rdrag.y);
    wed.rdrag.x = e.clientX; wed.rdrag.y = e.clientY;
    return;
  }
  if (wed.pdrag && e.buttons & 5) {
    if (!wed.pdrag.moved && Math.hypot(e.clientX - wed.pdrag.x, e.clientY - wed.pdrag.y) < 5) return;
    wed.pdrag.moved = true;
    slide(e.clientX - wed.pdrag.x, e.clientY - wed.pdrag.y);
    wed.pdrag.x = e.clientX; wed.pdrag.y = e.clientY;
    return;
  }
  if (wed.gdrag) {
    const G = wed.gdrag, f = figOf(G.i), g = groundAt(e);
    if (!f || !g) return;
    if (!G.moved && Math.hypot(e.clientX - G.x, e.clientY - G.y) < 6) return;
    G.moved = true;
    const x = Math.max(-GROUNDS.x, Math.min(GROUNDS.x, g.x + G.dx)), z = Math.max(GROUNDS.z0, Math.min(GROUNDS.z1, g.z + G.dz));
    const st = seats();
    G.ok = standFree(wed.w.props, st.filter((_, j) => j !== G.i), x, z);
    Object.assign(f, { x, z }); f.g.position.set(x, 0.12, z);
    return;
  }
  if (wed.drag) {
    const g = groundAt(e), p = wed.w.props[wed.drag.i], m = wed.propG[wed.drag.i];
    if (!g || !p || !m) return;
    const tx = g.x + wed.drag.dx, tz = g.z + wed.drag.dz;
    // (never onto her, the couple or the guards, nor into another prop: it slides along what it meets)
    const q = [cleanProp({ ...p, x: tx, z: tz }), cleanProp({ ...p, x: tx }), cleanProp({ ...p, z: tz })].find((q) => (q.x !== p.x || q.z !== p.z) && fits(q, wed.drag.i, p));
    if (q) {
      for (const j of wed.drag.on) { const c = wed.w.props[j]; c.x += q.x - p.x; c.z += q.z - p.z; wed.propG[j].position.x = c.x; wed.propG[j].position.z = c.z; }
      p.x = q.x; p.z = q.z; m.position.x = p.x; m.position.z = p.z; wed.drag.moved = true;
      if (p.k === 'bench' || wed.w.guests.length <= 48) reseat();
    }
    return;
  }
  if (roaming() && !cine) {
    const hit = wed.tool ? null : picked(e);
    renderer.domElement.style.cursor = wed.tool ? 'copy' : hit ? 'pointer' : 'grab';
    const g = wed.tool ? groundAt(e) : null;
    wed.mark = g && inArea(g) ? g : null;
  } else renderer.domElement.style.cursor = '';
}
export function weddingUp(e) {
  if (!wed.on) return;
  if (e.button === 2) wed.rdrag = null;
  if (wed.pdrag && (e.button === 0 || e.button === 1)) {
    const P = wed.pdrag;
    wed.pdrag = null;
    if (!P.moved && e.button === 0 && (wed.sel || wed.tool)) { wed.sel = null; panel(); }
  }
  if (e.button === 0 && wed.gdrag) {
    const G = wed.gdrag;
    wed.gdrag = null;
    if (G.moved) {
      const f = figOf(G.i), w = f && moveGuest(wed.w, seats(), G.i, f.x, f.z);
      if (w) { wed.w = w; save(); gush('guest_move'); } else say(wed.fig.mis, 'Somewhere with a bit more room, love!');
      reseat(); panel();
    }
  }
  if (e.button === 0 && wed.drag) {
    const moved = wed.drag.moved;
    wed.drag = null;
    if (moved) propsChanged('move');
  }
}
export function weddingWheel(e) {
  if (!wed.on || cine) return;
  zoomBy(e.deltaY > 0 ? 1.1 : 1 / 1.1);
}
/** Keys on her island (Space and Esc skip a cutscene first: den.js). True if it used the key. */
export function weddingKey(key, e) {
  if (!wed.on) return false;
  if (e.target instanceof HTMLInputElement) return true;
  if (wed.step === 'portrait' && key === 'escape') { if (wed.portrait) closePortrait(false); return true; }
  if (key === 'escape' && !$('wed-asks').hidden) { asks(false); return true; }
  if (!roaming()) return true;
  const gi = selGuest();
  if (key === 'escape') { wed.tool = null; wed.sel = null; panel(); }
  else if ((key === 'q' || key === 'e') && !e.repeat) { if (gi !== null) turnGuest(gi, key === 'q' ? 1 : -1); else turnProp(key === 'q' ? 1 : -1); }
  else if ((key === 'delete' || key === 'backspace') && !e.repeat) removeProp();
  else {
    const d = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] }[key];
    if (d) { e.preventDefault?.(); slide(-d[0] * 40, -d[1] * 40); }
  }
  return true;
}

// ---------- on a phone: the planner tucked away, and touch ----------
/** The planner tucked away to its heading (on a phone or tablet: its button), or out again. */
function tuck(on) {
  $('wed').classList.toggle('tucked', on);
  $('wed-tuck').textContent = on ? 'Show' : 'Tuck away';
  $('wed-tuck').setAttribute('aria-expanded', String(!on));
}
$('wed-tuck').onclick = (e) => { e.currentTarget.blur(); tuck(!$('wed').classList.contains('tucked')); };
/* By touch, all done here (no mouse events follow): a tap is a click; a drag from a prop or a guest
   moves it, from anywhere else looks round (turning, and tilting at the guests and decorating); two
   fingers pinch to zoom and slide the view; a double tap skips the welcome or the wedding (Space, on a
   keyboard). */
let touch = null, lastTap = 0;
const tp = (t) => ({ clientX: t.clientX, clientY: t.clientY, button: 0, buttons: 1 });
const apart = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
const mid = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
function letGo(t) { if (touch?.prop) weddingUp(tp(t)); }
renderer.domElement.addEventListener('touchstart', (e) => {
  if (!wed.on) return;
  e.preventDefault();
  wed.touch = true;
  if (cine) {
    const now = performance.now();
    if ((wed.play || wed.welcome) && now - lastTap < 400) { cineEnd(true); lastTap = 0; } else lastTap = now;
    return;
  }
  if (e.touches.length >= 2) {
    letGo(e.touches[0]);
    touch = { pinch: apart(e.touches[0], e.touches[1]), zoom: wed.zoom, mid: mid(e.touches[0], e.touches[1]) };
    return;
  }
  const t = e.touches[0];
  touch = { x: t.clientX, y: t.clientY, moved: false, prop: false };
  if (roaming() && !wed.tool && picked(tp(t))) { weddingDown(tp(t)); touch.prop = !!(wed.drag || wed.gdrag); }
}, { passive: false });
renderer.domElement.addEventListener('touchmove', (e) => {
  if (!wed.on || !touch) return;
  e.preventDefault();
  if (touch.pinch) {
    if (e.touches.length >= 2) {
      wed.zoom = touch.zoom; zoomBy(touch.pinch / Math.max(1, apart(e.touches[0], e.touches[1])));
      const m = mid(e.touches[0], e.touches[1]);
      if (roaming()) slide(m.x - touch.mid.x, m.y - touch.mid.y);
      touch.mid = m;
    }
    return;
  }
  const t = e.touches[0];
  if (touch.prop) { weddingMove(tp(t)); return; }
  if (!touch.moved && Math.hypot(t.clientX - touch.x, t.clientY - touch.y) < 10) return;
  touch.moved = true;
  lookRound((t.clientX - touch.x) * 1.3, t.clientY - touch.y);
  touch.x = t.clientX; touch.y = t.clientY;
}, { passive: false });
renderer.domElement.addEventListener('touchend', (e) => {
  if (!wed.on || !touch) return;
  e.preventDefault();
  const T = touch, t = e.changedTouches[0];
  if (e.touches.length) { if (T.pinch && e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, moved: true, prop: false }; return; }
  touch = null;
  if (T.prop) weddingUp(tp(t));
  else if (!T.moved && !T.pinch && !cine) {
    // (a tap on nothing lets go of what's picked; on a prop or guest, picks it)
    weddingDown(tp(t));
    if (wed.pdrag) { wed.pdrag = null; if (wed.sel) { wed.sel = null; panel(); } }
    if (wed.drag || wed.gdrag) weddingUp(tp(t));
  }
}, { passive: false });
renderer.domElement.addEventListener('touchcancel', () => {
  if (touch?.prop && wed.drag) { wed.drag = null; propsChanged('move'); }
  if (wed.gdrag) { wed.gdrag = null; reseat(); }
  touch = null;
});

// ---------- each tick, and the camera ----------
export function weddingTick(dt0) {
  if (!wed.on || !wed.fig) return;
  /* By the clock on the wall, as a cutscene is (cine.js): below 20 frames a second the den's own step
     runs slow, and the suitors crawled in. (A step run by hand, den.step, still counts.) */
  const now = performance.now(), dt = Math.max(dt0, Math.min(0.25, (now - (wed.wall ?? now)) / 1000));
  wed.wall = now;
  heartsTick(dt);
  const F = wed.fig, t = performance.now() / 1000;
  if (!wed.play && !wed.welcome) {
    const moving = new Set();
    // She models her looks, one after another.
    if (wed.show && (wed.show.t += dt) > 2.9) {
      wed.show.t = 0; wed.show.n++;
      if (wed.show.n >= versions().length) { wed.show = null; panel(); } else { wed.show.i = (wed.show.i + 1) % versions().length; modelLook(); }
    }
    // The bachelors: in they walk, then each steps forward in turn with their line.
    const L = wed.lineup;
    if (L) {
      if (L.phase === 'off') {
        L.list.forEach((f) => { if (!stepTo(f, f, 9.5, f.z, 3.2, dt)) moving.add(f); f.g.position.x = f.x; f.g.position.z = f.z; });
        if (L.list.every((f) => f.x > 9.3)) { L.list.forEach(dropFigure); wed.lineup = null; }
      } else {
        let all = true;
        L.list.forEach((f, i) => {
          const fz = L.i === i && L.phase === 'step' ? -2.8 : -3.5;
          if (!stepTo(f, f, f.home, fz, 3, dt)) { moving.add(f); all = false; } else f.yaw = 0;
          f.g.position.x = f.x; f.g.position.z = f.z;
        });
        L.t += dt;
        const title = () => say(F.mis, `${suitorTitle(suitors(wed.w.tone)[L.i], L.i)}!`, 1.7);
        if (all && L.phase === 'walk') { L.phase = 'title'; L.i = 0; L.t = 0; title(); }
        else if (L.phase === 'title' && L.t > 1.5) { L.phase = 'step'; L.t = 0; const s = suitors(wed.w.tone)[L.i]; say(L.list[L.i], `${s.name}: "${s.line}"`, readSecs(s.line) + 0.8); }
        else if (L.phase === 'step' && L.t > readSecs(suitors(wed.w.tone)[L.i].line) + 1.2) {
          L.t = 0;
          if (L.i + 1 < L.list.length) { L.i++; L.phase = 'title'; title(); }
          else { L.phase = 'wait'; L.i = -1; say(F.mis, "Well? Who's it to be?", 99); }
        }
      }
      L?.list.forEach((f) => { restArms(f); f.arms[0].rotation.x = -1.1; if (!moving.has(f)) poseFig(f, dt); });
    }
    // Your partner walking over to stand by you.
    const P = F.partner;
    if (P?.walkTo) { if (stepTo(P, P, P.walkTo.x, P.walkTo.z, 2.4, dt)) { P.walkTo = null; P.yaw = 0; } else moving.add(P); P.g.position.x = P.x; P.g.position.z = P.z; }
    for (const p of everyone()) {
      if (moving.has(p)) { p.yaw = p.g.rotation.y; continue; }
      restArms(p);
      if (p === F.partner && F.partner !== F.mis && !p.hurt) p.arms[0].rotation.x = -0.9;   // (flowers out)
      poseFig(p, dt);
      if (p.twirl > 0) { p.twirl = Math.max(0, p.twirl - dt); p.g.rotation.y = p.yaw + (1 - p.twirl / 0.8) * Math.PI * 2; p.g.position.y += Math.sin(p.twirl / 0.8 * Math.PI) * 0.12; }
    }
    // Her, as she talks: a little bounce, hands clasped, now and then a giggle behind them.
    if (wed.line?.fig === F.mis && !moving.has(F.mis)) {
      const k = Math.max(0, wed.line.giggle -= dt);
      F.mis.arms.forEach((a, j) => a.rotation.set(-1.15 - k * 0.6, 0, j ? -0.45 : 0.45));
      F.mis.g.position.y += Math.abs(Math.sin(t * 9)) * 0.035 * (k > 0 ? 1 : 0.3);
    }
    if (wed.line && performance.now() > wed.line.until) wed.line = null;
    // The portrait: once the camera's settled, framed.
    if (wed.step === 'portrait' && !wed.portrait && (wed.settle -= dt) <= 0) takePortrait();
  }
  // The speech bubble over whoever's speaking.
  const l = wed.line;
  if (l && l.fig?.g.parent) {
    const v = V3(); l.fig.g.getWorldPosition(v); v.y += 2.2;
    bubbleAt(wed.bub, true, v.x, v.y, v.z);
    // (kept clear of the planner: left of it down the right, above it as a sheet along the bottom; and on the screen)
    const r = $('wed').getBoundingClientRect(), bw = wed.bub.offsetWidth / 2, open = !$('wed').classList.contains('off'), off = panelOff();
    let x = parseFloat(wed.bub.style.left), y = parseFloat(wed.bub.style.top);
    if (open && !off.y && x + bw > r.left - 10) x = r.left - 10 - bw;
    if (open && off.y && y > r.top - 16) y = r.top - 16;
    wed.bub.style.top = `${Math.max(70, 8 + wed.bub.offsetHeight, y)}px`;   // (its foot, as it's drawn above it)
    wed.bub.style.left = `${Math.max(bw + 8, Math.min(innerWidth - bw - 8, x))}px`;
  } else wed.bub.style.display = 'none';
  // The ring under what you've picked (or where a new prop will go).
  const p = selProp(), gs = selGuest(), gi = gs !== null ? figOf(gs) : null, mk = wed.tool ? wed.mark : null;
  wed.ring.visible = roaming() && !!(p || gi || mk);
  if (wed.ring.visible) {
    const at = p ? { x: p.x, z: p.z, r: PROP_R[p.k] } : gi ? { x: gi.x, z: gi.z, r: 0.5 } : { x: mk.x, z: mk.z, r: 0.5 };
    wed.ring.position.set(at.x, 0.04, at.z);
    wed.ring.scale.setScalar(at.r);
    // (green where a new prop goes; red while a guest's dragged where there's no room)
    wed.ring.material.color.set(mk ? '#7dff7a' : wed.gdrag?.moved && !wed.gdrag.ok ? '#ff5a4a' : '#ffd23a');
    wed.ring.material.opacity = 0.6 + 0.3 * Math.sin(t * 5);
  }
}
/** The camera on her island (den.js uses it whole while you're here; a cutscene's own shots go over
    it): the whole venue from the foot of the aisle, turned and zoomed as you like; close on her as
    she models her looks or welcomes you; along the line of suitors; the portrait's shot at the end. */
export function weddingCam() {
  const C = planCam();
  if (!C || C === wed.shot) return C;
  wed.camDist = C.dist;
  // (the venue in the middle of what the planner leaves showing: the look slid right of where it'd be,
  // or, the planner a sheet along the bottom, below it, so the venue sits up in what's above it)
  const off = panelOff();
  if (off.x > 0) {
    const half = Math.tan(camera.fov * Math.PI / 360) * camera.aspect * C.dist * Math.cos(C.tilt * 0.5);
    C.look.x += Math.cos(C.yaw) * half * off.x; C.look.z -= Math.sin(C.yaw) * half * off.x;
  }
  if (off.y > 0) {
    const d = Math.tan(camera.fov * Math.PI / 360) * C.dist * off.y, st = Math.sin(C.tilt);
    C.look.x += st * Math.sin(C.yaw) * d; C.look.y -= Math.cos(C.tilt) * d; C.look.z += st * Math.cos(C.yaw) * d;
  }
  return C;
}
/** How much of the screen the planner takes: across, down the right (x), or up, as a sheet along the
    bottom on a phone held upright (y); none when it's out of the way. */
function panelOff() {
  const P = $('wed'), r = P.getBoundingClientRect();
  if (P.classList.contains('off') || r.width < 10) return { x: 0, y: 0 };
  if (r.width > innerWidth * 0.7) { const y = (innerHeight - r.top + 8) / innerHeight; return { x: 0, y: y < 0.7 ? y : 0 }; }
  const x = (innerWidth - r.left + 14) / innerWidth;
  return { x: x < 0.6 ? x : 0, y: 0 };
}
/* Close on what each choice is about (the user, 11 Nov: "Definitely more zoomed in ... I don't
   understand why it's so zoomed out while I'm choosing"): the two of you as she asks the tone; you
   and her (and whoever you're marrying) choosing who; her modelling her looks; the bachelors, each
   close as they step forward; each venue as you point at it or pick it; the layout from a near angle
   for the theme and tuning; the couple at the arch for how it goes. The wheel or a pinch zooms out. */
function planCam() {
  if (!wed.on || !wed.root) return null;
  const C = { look: V3(), dist: 15, tilt: 0.6, yaw: wed.yaw };
  const F = wed.fig, z = roaming() ? wed.zoom : Math.max(0.45, wed.zoom);
  // (far enough back to take in `w` metres across, in what the planner leaves showing)
  const hh = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect), across = (w) => w / (2 * Math.tan(hh) * (1 - panelOff().x));
  if ((wed.step === 'portrait' || wed.step === 'playing') && wed.shot) return wed.shot;
  if (!F) return C;
  if (wed.step === 'tone' || wed.step === 'welcome') { twoShot(C, Math.max(4.4, across(3)) * z, 1.3 + wed.yaw); return C; }
  if (wed.step === 'partner' && wed.lineup) {
    const L = wed.lineup, f = L.i >= 0 && L.list[L.i];
    if (f && L.phase === 'step') shot(C, f.x, 1.3, f.z, 3.6 * roomy(), 0.12, 0.05);
    else if (f && L.phase === 'title') shot(C, f.x, 1.2, f.z, Math.max(5.5, across(3.5)), 0.14, 0.05);
    else shot(C, 0, 1.2, -3.4, Math.max(8.6, across(10)) * z, 0.16, 0);   // (all of them)
    return C;
  }
  if (wed.step === 'partner' && (wed.show || wed.pick === 'her' || wed.w.partner?.kind === 'own')) {
    const f = wed.w.partner?.kind === 'own' && wed.pick !== 'her' ? F.partner : F.mis;
    shot(C, f.x, 1.1, f.z, 4.2 * roomy() * z, 0.26, 0.2 + wed.yaw);
    return C;
  }
  if (wed.step === 'partner') {
    // (you and her, and whoever you're marrying, at the front)
    const xs = [F.you, F.mis, ...(F.partner && F.partner !== F.mis ? [F.partner] : [])].map((p) => p.x);
    const lo = Math.min(...xs), hi = Math.max(...xs);
    shot(C, (lo + hi) / 2, 1.2, -3, Math.max(5.2, across(hi - lo + 2.4)) * z, 0.3, 0.12 + wed.yaw);
    return C;
  }
  if (wed.step === 'venue') {
    const at = VENUE_AT[wed.peek || wed.w.venue] || VENUE_AT.beach;
    C.look.set(at.x, at.y + 0.8, at.z - 0.8); wed.isle.localToWorld(C.look);
    Object.assign(C, { dist: Math.max(11, across(13)) * z, tilt: 0.42, yaw: 0.5 + wed.yaw });
    return C;
  }
  if (wed.step === 'plot') { shot(C, -0.5, 1.25, -3.2, Math.max(5.8, across(5)) * z, 0.42, 0.15 + wed.yaw); return C; }
  // (the theme: the venue's layout from a comfortable near angle; the guests and decorating, the same,
  // but yours to go round: tilted, slid over the venue and zoomed right in)
  if (roaming()) { shot(C, wed.pan.x, 0.5 + Math.max(0, 0.35 - z) * 1.6, -1.0 + wed.pan.z, Math.max(10.5, across(9)) * z, Math.max(0.1, Math.min(1.45, 0.6 + wed.tilt)), 0.22 + wed.yaw); return C; }
  shot(C, 0, 0.5, -1.0, Math.max(10.5, across(9)) * z, 0.6, 0.22 + wed.yaw);
  return C;
}
